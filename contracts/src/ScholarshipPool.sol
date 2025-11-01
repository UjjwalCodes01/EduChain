// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title ScholarshipPool
 * @notice Manages a single scholarship pool with applications, verifications, and payments
 * @dev Uses AccessControl for flexible automation via Kwala
 */
contract ScholarshipPool is ReentrancyGuard, Pausable, AccessControl {
    // --- Role Definitions ---
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUTOMATION_ROLE = keccak256("AUTOMATION_ROLE");
    // Pool metadata
    string public poolName;
    string public poolDescription;
    uint256 public scholarshipAmount;
    uint256 public applicationDeadline;
    uint256 public totalFunds;
    uint256 public availableFunds;
    uint256 public totalScholarshipsAwarded;

    // Application tracking
    struct Application {
        address studentAddress;
        string dataHash; // IPFS hash or backend DB reference
        bool isVerified; // Email verified
        bool isApproved; // Admin approved
        bool isPaid; // Scholarship paid
        uint256 timestamp;
    }

    mapping(address => Application) public applications;
    address[] public applicants;

    // Events
    event PoolFunded(address indexed donor, uint256 amount);
    event ApplicationSubmitted(address indexed student, string dataHash, uint256 timestamp);
    event ApplicationVerified(address indexed student);
    event ApplicationApproved(address indexed student);
    event ApplicationRejected(address indexed student);
    event ScholarshipPaid(address indexed student, uint256 amount);
    event ScholarshipAmountUpdated(uint256 newAmount);
    event DeadlineUpdated(uint256 newDeadline);
    event FundsWithdrawn(address indexed admin, uint256 amount);
    event PoolDescriptionUpdated(string newDescription);

    /**
     * @notice Creates a new scholarship pool
     * @param _poolName Name of the scholarship pool
     * @param _poolDescription Description of the pool and eligibility criteria
     * @param _scholarshipAmount Amount per scholarship in wei
     * @param _applicationDeadline Unix timestamp for application deadline
     * @param _admin Address of the pool administrator
     */
    constructor(
        string memory _poolName,
        string memory _poolDescription,
        uint256 _scholarshipAmount,
        uint256 _applicationDeadline,
        address _admin
    ) {
        require(bytes(_poolName).length > 0, "Pool name required");
        require(_scholarshipAmount > 0, "Scholarship amount must be > 0");
        require(_applicationDeadline > block.timestamp, "Deadline must be in future");
        
        poolName = _poolName;
        poolDescription = _poolDescription;
        scholarshipAmount = _scholarshipAmount;
        applicationDeadline = _applicationDeadline;
        
        // --- Grant Roles ---
        // The creator is the ADMIN (can withdraw funds, pause, update settings)
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
        _grantRole(ADMIN_ROLE, _admin);
        
        // The ADMIN can also perform automation tasks manually if needed
        _grantRole(AUTOMATION_ROLE, _admin);
    }

    // Receive donations
    receive() external payable {
        fundPool();
    }

    /**
     * @notice Allows anyone to fund the scholarship pool
     */
    function fundPool() public payable whenNotPaused {
        require(msg.value > 0, "Must send funds");
        totalFunds += msg.value;
        availableFunds += msg.value;
        emit PoolFunded(msg.sender, msg.value);
    }

    /**
     * @notice Student submits scholarship application
     * @param _dataHash IPFS hash or backend reference for application data
     */
    function submitApplication(string memory _dataHash) external whenNotPaused {
        require(block.timestamp <= applicationDeadline, "Application deadline passed");
        require(applications[msg.sender].studentAddress == address(0), "Already applied");
        require(bytes(_dataHash).length > 0, "Data hash required");

        Application memory newApplication = Application({
            studentAddress: msg.sender,
            dataHash: _dataHash,
            isVerified: false,
            isApproved: false,
            isPaid: false,
            timestamp: block.timestamp
        });

        applications[msg.sender] = newApplication;
        applicants.push(msg.sender);

        emit ApplicationSubmitted(msg.sender, _dataHash, block.timestamp);
    }

    /**
     * @notice Admin verifies student application (after email verification)
     * @dev Can be called by Kwala automation or admin manually
     * @param _student Address of the student
     */
    function verifyApplication(address _student) external onlyRole(AUTOMATION_ROLE) {
        require(applications[_student].studentAddress != address(0), "No application found");
        require(!applications[_student].isVerified, "Already verified");

        applications[_student].isVerified = true;
        emit ApplicationVerified(_student);
    }

    /**
     * @notice Admin approves a verified application
     * @dev Can be called by Kwala automation or admin manually
     * @param _student Address of the student
     */
    function approveApplication(address _student) external onlyRole(AUTOMATION_ROLE) {
        require(applications[_student].isVerified, "Not verified");
        require(!applications[_student].isApproved, "Already approved");
        require(availableFunds >= scholarshipAmount, "Insufficient funds");

        applications[_student].isApproved = true;
        emit ApplicationApproved(_student);
    }

    /**
     * @notice Admin rejects an application
     * @dev Can be called by Kwala automation or admin manually
     * @param _student Address of the student
     */
    function rejectApplication(address _student) external onlyRole(AUTOMATION_ROLE) {
        require(applications[_student].studentAddress != address(0), "No application found");
        require(!applications[_student].isApproved, "Already approved");

        emit ApplicationRejected(_student);
    }

    /**
     * @notice Pay scholarship to a single approved student
     * @dev Can be called by Kwala automation or admin manually
     * @param _student Address of the student
     */
    function payScholarship(address _student) external onlyRole(AUTOMATION_ROLE) nonReentrant {
        Application storage app = applications[_student];
        require(app.isApproved, "Not approved");
        require(!app.isPaid, "Already paid");
        require(availableFunds >= scholarshipAmount, "Insufficient funds");

        app.isPaid = true;
        availableFunds -= scholarshipAmount;
        totalScholarshipsAwarded++;

        (bool success, ) = payable(_student).call{value: scholarshipAmount}("");
        require(success, "Transfer failed");

        emit ScholarshipPaid(_student, scholarshipAmount);
    }

    /**
     * @notice Pay scholarships to multiple approved students in one transaction
     * @dev Can be called by Kwala automation for batch payments
     * @param _students Array of student addresses
     */
    function batchPayScholarships(address[] calldata _students) external onlyRole(AUTOMATION_ROLE) nonReentrant {
        uint256 totalAmount = _students.length * scholarshipAmount;
        require(availableFunds >= totalAmount, "Insufficient funds for batch");

        for (uint256 i = 0; i < _students.length; i++) {
            Application storage app = applications[_students[i]];
            if (app.isApproved && !app.isPaid) {
                app.isPaid = true;
                availableFunds -= scholarshipAmount;
                totalScholarshipsAwarded++;

                (bool success, ) = payable(_students[i]).call{value: scholarshipAmount}("");
                require(success, "Transfer failed");

                emit ScholarshipPaid(_students[i], scholarshipAmount);
            }
        }
    }

    /**
     * @notice Admin updates the scholarship amount
     * @param _newAmount New scholarship amount in wei
     */
    function updateScholarshipAmount(uint256 _newAmount) external onlyRole(ADMIN_ROLE) {
        require(_newAmount > 0, "Amount must be > 0");
        scholarshipAmount = _newAmount;
        emit ScholarshipAmountUpdated(_newAmount);
    }

    /**
     * @notice Admin updates the application deadline
     * @param _newDeadline New deadline as Unix timestamp
     */
    function updateDeadline(uint256 _newDeadline) external onlyRole(ADMIN_ROLE) {
        require(_newDeadline > block.timestamp, "Deadline must be in future");
        applicationDeadline = _newDeadline;
        emit DeadlineUpdated(_newDeadline);
    }

    /**
     * @notice Admin updates pool description
     * @param _newDescription New description
     */
    function updatePoolDescription(string memory _newDescription) external onlyRole(ADMIN_ROLE) {
        poolDescription = _newDescription;
        emit PoolDescriptionUpdated(_newDescription);
    }

    /**
     * @notice Admin withdraws unused funds
     * @param _amount Amount to withdraw in wei
     */
    function withdrawFunds(uint256 _amount) external onlyRole(ADMIN_ROLE) nonReentrant {
        require(_amount <= availableFunds, "Insufficient available funds");
        availableFunds -= _amount;

        (bool success, ) = payable(msg.sender).call{value: _amount}("");
        require(success, "Withdrawal failed");

        emit FundsWithdrawn(msg.sender, _amount);
    }

    /**
     * @notice Pause the pool (emergency)
     */
    function pause() external onlyRole(ADMIN_ROLE) {
        _pause();
    }

    /**
     * @notice Unpause the pool
     */
    function unpause() external onlyRole(ADMIN_ROLE) {
        _unpause();
    }

    /**
     * @notice Get total number of applicants
     */
    function getApplicantCount() external view returns (uint256) {
        return applicants.length;
    }

    /**
     * @notice Get applicant address by index
     */
    function getApplicant(uint256 _index) external view returns (address){
        require(_index < applicants.length, "Index out of bounds");
        return applicants[_index];
    }

    /**
     * @notice Get all applicants
     */
    function getAllApplicants() external view returns (address[] memory) {
        return applicants;
    }

    /**
     * @notice Get application details for a student
     */
    function getApplication(address _student) external view returns (
        address studentAddress,
        string memory dataHash,
        bool isVerified,
        bool isApproved,
        bool isPaid,
        uint256 timestamp
    ) {
        Application memory app = applications[_student];
        return (
            app.studentAddress,
            app.dataHash,
            app.isVerified,
            app.isApproved,
            app.isPaid,
            app.timestamp
        );
    }

    /**
     * @notice Get pool statistics
     */
    function getPoolStats() external view returns (
        uint256 _totalFunds,
        uint256 _availableFunds,
        uint256 _totalScholarshipsAwarded,
        uint256 _applicantCount,
        uint256 _scholarshipAmount,
        uint256 _deadline
    ) {
        return (
            totalFunds,
            availableFunds,
            totalScholarshipsAwarded,
            applicants.length,
            scholarshipAmount,
            applicationDeadline
        );
    }
}
