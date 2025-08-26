// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title RealDonationPool
 * @dev 실제 토큰을 받고 분배하는 기부 풀 컨트랙트
 */
contract RealDonationPool is Ownable, ReentrancyGuard, Pausable {
    
    // 기부자 정보
    struct Donor {
        uint256 totalDonated;
        uint256 donationCount;
        uint256 firstDonationTime;
        bool isActive;
    }
    
    // 기부 기록
    struct Donation {
        address donor;
        uint256 amount;
        uint256 timestamp;
        string message;
    }
    
    // 분배 기록  
    struct Distribution {
        address recipient;
        uint256 amount;
        uint256 timestamp;
        string reason;
        address approver;
    }
    
    // State variables
    mapping(address => Donor) public donors;
    address[] public donorsList;
    Donation[] public donations;
    Distribution[] public distributions;
    
    uint256 public totalReceived;
    uint256 public totalDistributed;
    uint256 public minimumDonation = 0.001 ether; // 최소 기부 금액
    
    // 관리자 주소들 (토큰 분배 승인 가능)
    mapping(address => bool) public approvers;
    
    // Events
    event DonationReceived(address indexed donor, uint256 amount, string message);
    event TokensDistributed(address indexed recipient, uint256 amount, string reason);
    event ApproverAdded(address indexed approver);
    event ApproverRemoved(address indexed approver);
    event MinimumDonationUpdated(uint256 oldAmount, uint256 newAmount);
    
    // Modifiers
    modifier onlyApprover() {
        require(approvers[msg.sender] || msg.sender == owner(), "Not authorized to approve distributions");
        _;
    }
    
    constructor() {
        approvers[msg.sender] = true; // 배포자를 기본 승인자로 설정
    }
    
    /**
     * @dev 기부하기 - payable 함수
     */
    function donate(string calldata message) external payable nonReentrant whenNotPaused {
        require(msg.value >= minimumDonation, "Donation below minimum amount");
        
        // 기부자 정보 업데이트
        if (!donors[msg.sender].isActive) {
            donors[msg.sender].firstDonationTime = block.timestamp;
            donors[msg.sender].isActive = true;
            donorsList.push(msg.sender);
        }
        
        donors[msg.sender].totalDonated += msg.value;
        donors[msg.sender].donationCount++;
        
        // 기부 기록 저장
        donations.push(Donation({
            donor: msg.sender,
            amount: msg.value,
            timestamp: block.timestamp,
            message: message
        }));
        
        // 전체 기부 금액 업데이트
        totalReceived += msg.value;
        
        emit DonationReceived(msg.sender, msg.value, message);
    }
    
    /**
     * @dev 토큰 분배하기 (관리자만)
     */
    function distributeTokens(
        address recipient, 
        uint256 amount, 
        string calldata reason
    ) external onlyApprover nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Invalid amount");
        require(getAvailableBalance() >= amount, "Insufficient pool balance");
        
        // 토큰 전송
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "Transfer failed");
        
        // 분배 기록 저장
        distributions.push(Distribution({
            recipient: recipient,
            amount: amount,
            timestamp: block.timestamp,
            reason: reason,
            approver: msg.sender
        }));
        
        totalDistributed += amount;
        
        emit TokensDistributed(recipient, amount, reason);
    }
    
    /**
     * @dev 여러 주소에 일괄 분배
     */
    function batchDistribute(
        address[] calldata recipients, 
        uint256[] calldata amounts,
        string calldata reason
    ) external onlyApprover nonReentrant {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            totalAmount += amounts[i];
        }
        
        require(getAvailableBalance() >= totalAmount, "Insufficient pool balance");
        
        // 일괄 전송
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            require(amounts[i] > 0, "Invalid amount");
            
            (bool success, ) = payable(recipients[i]).call{value: amounts[i]}("");
            require(success, "Transfer failed");
            
            distributions.push(Distribution({
                recipient: recipients[i],
                amount: amounts[i],
                timestamp: block.timestamp,
                reason: reason,
                approver: msg.sender
            }));
            
            emit TokensDistributed(recipients[i], amounts[i], reason);
        }
        
        totalDistributed += totalAmount;
    }
    
    /**
     * @dev 긴급 인출 (소유자만)
     */
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }
    
    /**
     * @dev 승인자 추가
     */
    function addApprover(address approver) external onlyOwner {
        require(approver != address(0), "Invalid approver");
        require(!approvers[approver], "Already an approver");
        
        approvers[approver] = true;
        emit ApproverAdded(approver);
    }
    
    /**
     * @dev 승인자 제거
     */
    function removeApprover(address approver) external onlyOwner {
        require(approver != owner(), "Cannot remove owner");
        require(approvers[approver], "Not an approver");
        
        approvers[approver] = false;
        emit ApproverRemoved(approver);
    }
    
    /**
     * @dev 최소 기부 금액 설정
     */
    function setMinimumDonation(uint256 amount) external onlyOwner {
        uint256 oldAmount = minimumDonation;
        minimumDonation = amount;
        emit MinimumDonationUpdated(oldAmount, amount);
    }
    
    /**
     * @dev 컨트랙트 일시정지
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev 컨트랙트 재개
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // View functions
    function getAvailableBalance() public view returns (uint256) {
        return address(this).balance;
    }
    
    function getPoolStats() external view returns (
        uint256 available,
        uint256 totalRec,
        uint256 totalDist,
        uint256 donorCount,
        uint256 donationCount,
        uint256 distributionCount
    ) {
        return (
            getAvailableBalance(),
            totalReceived,
            totalDistributed,
            donorsList.length,
            donations.length,
            distributions.length
        );
    }
    
    function getDonorInfo(address donor) external view returns (
        uint256 totalDonated,
        uint256 donationCount,
        uint256 firstDonationTime,
        bool isActive
    ) {
        Donor memory d = donors[donor];
        return (d.totalDonated, d.donationCount, d.firstDonationTime, d.isActive);
    }
    
    function getRecentDonations(uint256 limit) external view returns (Donation[] memory) {
        uint256 length = donations.length;
        if (length == 0) return new Donation[](0);
        
        uint256 resultLength = limit > length ? length : limit;
        Donation[] memory result = new Donation[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = donations[length - 1 - i];
        }
        
        return result;
    }
    
    function getRecentDistributions(uint256 limit) external view returns (Distribution[] memory) {
        uint256 length = distributions.length;
        if (length == 0) return new Distribution[](0);
        
        uint256 resultLength = limit > length ? length : limit;
        Distribution[] memory result = new Distribution[](resultLength);
        
        for (uint256 i = 0; i < resultLength; i++) {
            result[i] = distributions[length - 1 - i];
        }
        
        return result;
    }
    
    // 이더 직접 전송 받기 (donate 함수 호출)
    receive() external payable {
        if (msg.value >= minimumDonation) {
            donate("Direct transfer");
        } else {
            revert("Donation below minimum amount");
        }
    }
}