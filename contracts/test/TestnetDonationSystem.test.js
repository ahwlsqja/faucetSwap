const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TestnetDonationSystem", function () {
  let donationSystem;
  let owner;
  let addr1;
  let addr2;
  let backend;

  beforeEach(async function () {
    [owner, addr1, addr2, backend] = await ethers.getSigners();

    const TestnetDonationSystem = await ethers.getContractFactory("TestnetDonationSystem");
    donationSystem = await TestnetDonationSystem.deploy();
    await donationSystem.waitForDeployment();

    // Update backend service address
    await donationSystem.updateBackendService(backend.address);
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await donationSystem.owner()).to.equal(owner.address);
    });

    it("Should set the right backend service", async function () {
      expect(await donationSystem.backendService()).to.equal(backend.address);
    });
  });

  describe("Donation Pool Management", function () {
    it("Should create a new donation pool", async function () {
      await donationSystem.createPool("ethereum");
      const pool = await donationSystem.getPoolInfo("ethereum");
      
      expect(pool.isActive).to.be.true;
      expect(pool.totalAmount).to.equal(0);
      expect(pool.available).to.equal(0);
      expect(pool.distributed).to.equal(0);
    });

    it("Should not allow non-owner to create pool", async function () {
      await expect(
        donationSystem.connect(addr1).createPool("ethereum")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should not create duplicate pool", async function () {
      await donationSystem.createPool("ethereum");
      await expect(
        donationSystem.createPool("ethereum")
      ).to.be.revertedWith("Pool already exists");
    });
  });

  describe("Donation Recording", function () {
    beforeEach(async function () {
      await donationSystem.createPool("ethereum");
    });

    it("Should record a donation", async function () {
      const amount = ethers.parseEther("1.0");
      
      await expect(
        donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", amount)
      )
        .to.emit(donationSystem, "DonationReceived")
        .withArgs(addr1.address, "ethereum", amount);

      expect(await donationSystem.userDonations(addr1.address, "ethereum")).to.equal(amount);
      expect(await donationSystem.totalContributions(addr1.address)).to.equal(amount);

      const pool = await donationSystem.getPoolInfo("ethereum");
      expect(pool.totalAmount).to.equal(amount);
      expect(pool.available).to.equal(amount);
    });

    it("Should not allow non-backend to record donation", async function () {
      const amount = ethers.parseEther("1.0");
      
      await expect(
        donationSystem.connect(addr1).recordDonation(addr1.address, "ethereum", amount)
      ).to.be.revertedWith("Not authorized");
    });

    it("Should not record zero amount donation", async function () {
      await expect(
        donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", 0)
      ).to.be.revertedWith("Invalid amount");
    });
  });

  describe("Badge Minting", function () {
    beforeEach(async function () {
      await donationSystem.createPool("ethereum");
    });

    it("Should mint Bronze badge for 0.1 ETH donation", async function () {
      const amount = ethers.parseEther("0.1");
      
      await expect(
        donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", amount)
      )
        .to.emit(donationSystem, "BadgeMinted")
        .withArgs(addr1.address, 0, 0); // BadgeLevel.Bronze = 0, tokenId = 0

      expect(await donationSystem.balanceOf(addr1.address)).to.equal(1);
      expect(await donationSystem.ownerOf(0)).to.equal(addr1.address);
      expect(await donationSystem.hasLevel(addr1.address, 0)).to.be.true; // Bronze level
    });

    it("Should mint Silver badge for 1 ETH donation", async function () {
      const amount = ethers.parseEther("1.0");
      
      await donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", amount);
      
      expect(await donationSystem.balanceOf(addr1.address)).to.equal(1);
      expect(await donationSystem.hasLevel(addr1.address, 1)).to.be.true; // Silver level
      
      const badge = await donationSystem.getBadgeDetails(0);
      expect(badge.level).to.equal(1); // Silver
      expect(badge.totalDonated).to.equal(amount);
    });

    it("Should not mint duplicate badges", async function () {
      const amount1 = ethers.parseEther("0.1");
      const amount2 = ethers.parseEther("0.05");
      
      // First donation - should mint Bronze
      await donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", amount1);
      expect(await donationSystem.balanceOf(addr1.address)).to.equal(1);
      
      // Second donation - should not mint another Bronze
      await donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", amount2);
      expect(await donationSystem.balanceOf(addr1.address)).to.equal(1);
    });

    it("Should upgrade badge level", async function () {
      // First donation - Bronze
      await donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", ethers.parseEther("0.1"));
      expect(await donationSystem.balanceOf(addr1.address)).to.equal(1);
      
      // Second donation - should mint Silver
      await donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", ethers.parseEther("0.9"));
      expect(await donationSystem.balanceOf(addr1.address)).to.equal(2);
      
      expect(await donationSystem.hasLevel(addr1.address, 0)).to.be.true; // Bronze
      expect(await donationSystem.hasLevel(addr1.address, 1)).to.be.true; // Silver
    });
  });

  describe("Token Distribution", function () {
    beforeEach(async function () {
      await donationSystem.createPool("ethereum");
      // Add some funds to the pool
      await donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", ethers.parseEther("2.0"));
    });

    it("Should distribute tokens from pool", async function () {
      const amount = ethers.parseEther("0.5");
      
      await expect(
        donationSystem.connect(backend).distributeTokens(addr2.address, "ethereum", amount)
      )
        .to.emit(donationSystem, "TokensDistributed")
        .withArgs(addr2.address, "ethereum", amount);

      const pool = await donationSystem.getPoolInfo("ethereum");
      expect(pool.available).to.equal(ethers.parseEther("1.5"));
      expect(pool.distributed).to.equal(amount);
    });

    it("Should not allow over-distribution", async function () {
      const amount = ethers.parseEther("3.0");
      
      await expect(
        donationSystem.connect(backend).distributeTokens(addr2.address, "ethereum", amount)
      ).to.be.revertedWith("Insufficient pool balance");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await donationSystem.createPool("ethereum");
      await donationSystem.connect(backend).recordDonation(addr1.address, "ethereum", ethers.parseEther("1.0"));
    });

    it("Should return user badges", async function () {
      const badges = await donationSystem.getUserBadges(addr1.address);
      expect(badges.length).to.equal(1);
      expect(badges[0]).to.equal(0);
    });

    it("Should return badge details", async function () {
      const badge = await donationSystem.getBadgeDetails(0);
      expect(badge.level).to.equal(1); // Silver
      expect(badge.totalDonated).to.equal(ethers.parseEther("1.0"));
      expect(badge.isActive).to.be.true;
    });

    it("Should return user chain donations", async function () {
      const amount = await donationSystem.getUserChainDonations(addr1.address, "ethereum");
      expect(amount).to.equal(ethers.parseEther("1.0"));
    });
  });
});