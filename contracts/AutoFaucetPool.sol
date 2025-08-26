// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AutoFaucetPool is ReentrancyGuard, Ownable {
    // 상수들
    uint256 public constant COOLDOWN_TIME = 24 hours;
    uint256 public faucetAmount = 0.1 ether; // 관리자가 조정 가능
    uint256 public minDonation = 0.001 ether;
    
    // 상태 관리
    mapping(address => uint256) public lastClaim;
    mapping(address => uint256) public totalDonated;
    uint256 public totalDonations;
    uint256 public totalClaimed;
    
    // 이벤트
    event DonationReceived(address indexed donor, uint256 amount, string message);
    event FaucetClaimed(address indexed user, uint256 amount);
    event FaucetAmountUpdated(uint256 oldAmount, uint256 newAmount);
    
    constructor() {}
    
    // 🎯 기부 (누구나 가능)
    function donate(string calldata message) external payable nonReentrant {
        require(msg.value >= minDonation, "Donation too small");
        
        totalDonated[msg.sender] += msg.value;
        totalDonations += msg.value;
        
        emit DonationReceived(msg.sender, msg.value, message);
    }
    
    // 🚀 Faucet 요청 (완전 자동화)
    function requestFaucet() external nonReentrant {
        require(canClaim(msg.sender), "Still in cooldown period");
        require(address(this).balance >= faucetAmount, "Insufficient pool balance");
        
        // 쿨다운 업데이트
        lastClaim[msg.sender] = block.timestamp;
        totalClaimed += faucetAmount;
        
        // 즉시 토큰 전송
        payable(msg.sender).transfer(faucetAmount);
        
        emit FaucetClaimed(msg.sender, faucetAmount);
    }
    
    // 📊 쿨다운 체크
    function canClaim(address user) public view returns (bool) {
        return block.timestamp >= lastClaim[user] + COOLDOWN_TIME;
    }
    
    function getCooldownRemaining(address user) external view returns (uint256) {
        if (canClaim(user)) return 0;
        return (lastClaim[user] + COOLDOWN_TIME) - block.timestamp;
    }
    
    // 🏆 기여도 레벨 계산 (NFT 배지용)
    function getContributionLevel(address user) external view returns (uint8) {
        uint256 donated = totalDonated[user];
        
        if (donated >= 10 ether) return 4; // Diamond
        if (donated >= 5 ether) return 3;  // Gold
        if (donated >= 1 ether) return 2;  // Silver
        if (donated >= 0.1 ether) return 1; // Bronze
        return 0; // None
    }
    
    // 📈 풀 통계
    function getPoolStats() external view returns (
        uint256 currentBalance,
        uint256 _totalDonations,
        uint256 _totalClaimed,
        uint256 totalUsers,
        uint256 availableClaims
    ) {
        return (
            address(this).balance,
            totalDonations,
            totalClaimed,
            0, // 이건 백엔드에서 계산
            address(this).balance / faucetAmount
        );
    }
    
    // 🛠️ 관리자 기능
    function setFaucetAmount(uint256 _newAmount) external onlyOwner {
        uint256 oldAmount = faucetAmount;
        faucetAmount = _newAmount;
        emit FaucetAmountUpdated(oldAmount, _newAmount);
    }
    
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
    
    // 기부 받기용 fallback
    receive() external payable {
        if (msg.value > 0) {
            totalDonated[msg.sender] += msg.value;
            totalDonations += msg.value;
            emit DonationReceived(msg.sender, msg.value, "Direct transfer");
        }
    }
}