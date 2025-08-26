// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TestnetDonationSystem is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Badge levels
    enum BadgeLevel { Bronze, Silver, Gold, Diamond }
    
    // Contributor badge structure
    struct ContributorBadge {
        BadgeLevel level;
        uint256 totalDonated;
        uint256 mintedAt;
        string chain;
        bool isActive;
    }
    
    // Donation pool structure
    struct DonationPool {
        uint256 totalAmount;
        uint256 available;
        uint256 distributed;
        bool isActive;
    }
    
    // Mappings
    mapping(address => mapping(string => uint256)) public userDonations; // user -> chain -> amount
    mapping(string => DonationPool) public donationPools; // chain -> pool
    mapping(address => uint256) public totalContributions; // total donations across all chains
    mapping(uint256 => ContributorBadge) public badges; // tokenId -> badge
    mapping(address => uint256[]) public userBadges; // user -> badge tokenIds
    mapping(address => mapping(BadgeLevel => bool)) public hasLevel; // user -> level -> exists
    
    // Badge level thresholds (in wei)
    uint256 public constant BRONZE_THRESHOLD = 0.1 ether;
    uint256 public constant SILVER_THRESHOLD = 1 ether;
    uint256 public constant GOLD_THRESHOLD = 5 ether;
    uint256 public constant DIAMOND_THRESHOLD = 10 ether;
    
    // Backend service address (for recording donations)
    address public backendService;
    
    // Events
    event DonationReceived(address indexed donor, string chain, uint256 amount);
    event BadgeMinted(address indexed recipient, BadgeLevel level, uint256 tokenId);
    event TokensDistributed(address indexed recipient, string chain, uint256 amount);
    event PoolCreated(string chain);
    event BackendServiceUpdated(address indexed oldService, address indexed newService);
    
    // Modifiers
    modifier onlyBackend() {
        require(msg.sender == backendService || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() ERC721("Testnet Contributor Badge", "TCB") {
        backendService = msg.sender;
    }
    
    /**
     * @dev Record a donation (called by backend service)
     * @param donor The address of the donor
     * @param chain The chain identifier
     * @param amount The donation amount
     */
    function recordDonation(address donor, string memory chain, uint256 amount) external onlyBackend {
        require(donor != address(0), "Invalid donor address");
        require(amount > 0, "Invalid amount");
        
        // Update user's donations for this chain
        userDonations[donor][chain] += amount;
        
        // Update donation pool
        donationPools[chain].totalAmount += amount;
        donationPools[chain].available += amount;
        
        // Update total contributions
        totalContributions[donor] += amount;
        
        // Check and mint badge if eligible
        _checkAndMintBadge(donor);
        
        emit DonationReceived(donor, chain, amount);
    }
    
    /**
     * @dev Create a new donation pool for a chain
     * @param chain The chain identifier
     */
    function createPool(string memory chain) external onlyOwner {
        require(!donationPools[chain].isActive, "Pool already exists");
        
        donationPools[chain] = DonationPool({
            totalAmount: 0,
            available: 0,
            distributed: 0,
            isActive: true
        });
        
        emit PoolCreated(chain);
    }
    
    /**
     * @dev Distribute tokens from donation pool to a recipient
     * @param recipient The recipient address
     * @param chain The chain identifier
     * @param amount The amount to distribute
     */
    function distributeTokens(address recipient, string memory chain, uint256 amount) 
        external 
        onlyBackend 
        nonReentrant 
    {
        require(recipient != address(0), "Invalid recipient");
        require(donationPools[chain].isActive, "Pool not active");
        require(donationPools[chain].available >= amount, "Insufficient pool balance");
        
        // Update pool balances
        donationPools[chain].available -= amount;
        donationPools[chain].distributed += amount;
        
        emit TokensDistributed(recipient, chain, amount);
    }
    
    /**
     * @dev Check if user is eligible for a badge and mint it
     * @param contributor The contributor address
     */
    function _checkAndMintBadge(address contributor) internal {
        uint256 total = totalContributions[contributor];
        BadgeLevel eligibleLevel;
        bool shouldMint = false;
        
        // Determine highest eligible level
        if (total >= DIAMOND_THRESHOLD && !hasLevel[contributor][BadgeLevel.Diamond]) {
            eligibleLevel = BadgeLevel.Diamond;
            shouldMint = true;
        } else if (total >= GOLD_THRESHOLD && !hasLevel[contributor][BadgeLevel.Gold]) {
            eligibleLevel = BadgeLevel.Gold;
            shouldMint = true;
        } else if (total >= SILVER_THRESHOLD && !hasLevel[contributor][BadgeLevel.Silver]) {
            eligibleLevel = BadgeLevel.Silver;
            shouldMint = true;
        } else if (total >= BRONZE_THRESHOLD && !hasLevel[contributor][BadgeLevel.Bronze]) {
            eligibleLevel = BadgeLevel.Bronze;
            shouldMint = true;
        }
        
        if (shouldMint) {
            _mintBadge(contributor, eligibleLevel, total);
        }
    }
    
    /**
     * @dev Mint a contributor badge NFT
     * @param recipient The recipient address
     * @param level The badge level
     * @param totalDonated The total amount donated
     */
    function _mintBadge(address recipient, BadgeLevel level, uint256 totalDonated) internal {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(recipient, tokenId);
        
        // Create badge metadata
        badges[tokenId] = ContributorBadge({
            level: level,
            totalDonated: totalDonated,
            mintedAt: block.timestamp,
            chain: "multi", // Multi-chain contributor
            isActive: true
        });
        
        // Track user's badges
        userBadges[recipient].push(tokenId);
        hasLevel[recipient][level] = true;
        
        // Set metadata URI
        string memory uri = _generateTokenURI(level, totalDonated);
        _setTokenURI(tokenId, uri);
        
        emit BadgeMinted(recipient, level, tokenId);
    }
    
    /**
     * @dev Generate metadata URI for badge NFT
     * @param level The badge level
     * @param totalDonated The total amount donated
     */
    function _generateTokenURI(BadgeLevel level, uint256 totalDonated) internal pure returns (string memory) {
        // In a real implementation, this would generate proper JSON metadata
        // For now, we return a simple string representation
        string memory levelName;
        if (level == BadgeLevel.Bronze) levelName = "Bronze";
        else if (level == BadgeLevel.Silver) levelName = "Silver";
        else if (level == BadgeLevel.Gold) levelName = "Gold";
        else levelName = "Diamond";
        
        return string(abi.encodePacked("https://api.testnet-faucet.com/metadata/", levelName));
    }
    
    /**
     * @dev Get user's badges
     * @param user The user address
     */
    function getUserBadges(address user) external view returns (uint256[] memory) {
        return userBadges[user];
    }
    
    /**
     * @dev Get badge details
     * @param tokenId The token ID
     */
    function getBadgeDetails(uint256 tokenId) external view returns (ContributorBadge memory) {
        require(_exists(tokenId), "Token does not exist");
        return badges[tokenId];
    }
    
    /**
     * @dev Get donation pool info
     * @param chain The chain identifier
     */
    function getPoolInfo(string memory chain) external view returns (DonationPool memory) {
        return donationPools[chain];
    }
    
    /**
     * @dev Get user's total donations for a specific chain
     * @param user The user address
     * @param chain The chain identifier
     */
    function getUserChainDonations(address user, string memory chain) external view returns (uint256) {
        return userDonations[user][chain];
    }
    
    /**
     * @dev Update backend service address
     * @param newBackendService The new backend service address
     */
    function updateBackendService(address newBackendService) external onlyOwner {
        require(newBackendService != address(0), "Invalid address");
        address oldService = backendService;
        backendService = newBackendService;
        emit BackendServiceUpdated(oldService, newBackendService);
    }
    
    /**
     * @dev Pause/unpause a donation pool
     * @param chain The chain identifier
     * @param isActive The new active status
     */
    function setPoolStatus(string memory chain, bool isActive) external onlyOwner {
        donationPools[chain].isActive = isActive;
    }
    
    /**
     * @dev Emergency withdrawal function (owner only)
     * @param token The token address (address(0) for ETH)
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        if (token == address(0)) {
            payable(owner()).transfer(amount);
        } else {
            // For ERC20 tokens (would need to import IERC20)
            // IERC20(token).transfer(owner(), amount);
        }
    }
    
    // Override required functions
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}