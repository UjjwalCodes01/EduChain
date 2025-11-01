// Contract addresses and ABIs
// Update these addresses after deploying your contracts to testnet/mainnet

export const POOL_FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update after deployment

// ============================================================================
// FACTORY ABI - PoolFactory.sol
// ============================================================================
export const FACTORY_ABI = [
  // Pool creation
  "function createPool(string memory _poolName, string memory _poolDescription, uint256 _scholarshipAmount, uint256 _applicationDeadline) external returns (address)",
  
  // View functions
  "function getAllPools() external view returns (address[] memory)",
  "function getPoolsByCreator(address creator) external view returns (address[] memory)",
  "function getPoolCount() external view returns (uint256)",
  "function isPool(address pool) external view returns (bool)",
  
  // Pool info struct
  "function getPoolInfo(address pool) external view returns (string name, string description, uint256 amount, uint256 deadline, uint256 totalFunds, uint256 availableFunds, uint256 scholarshipsAwarded, address creator)",
  "function getAllPoolsInfo() external view returns (tuple(address poolAddress, string poolName, string poolDescription, uint256 scholarshipAmount, uint256 applicationDeadline, uint256 totalFunds, uint256 availableFunds, uint256 totalScholarshipsAwarded, address creator)[] memory)",
  
  // Events
  "event PoolCreated(address indexed poolAddress, address indexed creator, string poolName, uint256 scholarshipAmount, uint256 applicationDeadline, uint256 timestamp)"
];

// ============================================================================
// SCHOLARSHIP POOL ABI - ScholarshipPool.sol (with AccessControl)
// ============================================================================
export const POOL_ABI = [
  // Pool metadata (view functions)
  "function poolName() external view returns (string memory)",
  "function poolDescription() external view returns (string memory)",
  "function scholarshipAmount() external view returns (uint256)",
  "function applicationDeadline() external view returns (uint256)",
  "function totalFunds() external view returns (uint256)",
  "function availableFunds() external view returns (uint256)",
  "function totalScholarshipsAwarded() external view returns (uint256)",
  
  // AccessControl roles
  "function ADMIN_ROLE() external view returns (bytes32)",
  "function AUTOMATION_ROLE() external view returns (bytes32)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  
  // Application functions
  "function submitApplication(string memory _dataHash) external",
  "function verifyApplication(address _student) external",
  "function approveApplication(address _student) external",
  "function rejectApplication(address _student) external",
  
  // Payment functions
  "function payScholarship(address _student) external",
  "function batchPayScholarships(address[] calldata _students) external",
  
  // Funding
  "function fundPool() external payable",
  "function withdrawFunds(uint256 _amount) external",
  
  // Admin functions
  "function updateScholarshipAmount(uint256 _newAmount) external",
  "function updateDeadline(uint256 _newDeadline) external",
  "function updatePoolDescription(string memory _newDescription) external",
  "function pause() external",
  "function unpause() external",
  "function paused() external view returns (bool)",
  
  // Application queries
  "function getApplicantCount() external view returns (uint256)",
  "function applicants(uint256) external view returns (address)",
  "function applications(address) external view returns (address studentAddress, string dataHash, bool isVerified, bool isApproved, bool isPaid, uint256 timestamp)",
  "function getAllApplicants() external view returns (address[] memory)",
  "function getPoolStats() external view returns (uint256 totalApplicants, uint256 verified, uint256 approved, uint256 paid, uint256 available, uint256 total)",
  
  // Events
  "event PoolFunded(address indexed donor, uint256 amount)",
  "event ApplicationSubmitted(address indexed student, string dataHash, uint256 timestamp)",
  "event ApplicationVerified(address indexed student)",
  "event ApplicationApproved(address indexed student)",
  "event ApplicationRejected(address indexed student)",
  "event ScholarshipPaid(address indexed student, uint256 amount)",
  "event ScholarshipAmountUpdated(uint256 newAmount)",
  "event DeadlineUpdated(uint256 newDeadline)",
  "event FundsWithdrawn(address indexed admin, uint256 amount)",
  "event PoolDescriptionUpdated(string newDescription)"
];

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================
export const NETWORK_CONFIG = {
  // Update these after deploying to your chosen testnet
  chainId: 31337, // Change to: 80001 (Mumbai) or 11155111 (Sepolia)
  chainName: "Localhost",
  rpcUrl: "http://127.0.0.1:8545", // Change to Mumbai/Sepolia RPC
  blockExplorer: "http://localhost:8545" // Change to polygonscan/etherscan
};

// Testnet configurations (uncomment when deploying)
/*
// Polygon Mumbai Testnet
export const NETWORK_CONFIG = {
  chainId: 80001,
  chainName: "Polygon Mumbai",
  rpcUrl: "https://rpc-mumbai.maticvigil.com",
  blockExplorer: "https://mumbai.polygonscan.com"
};

// Ethereum Sepolia Testnet
export const NETWORK_CONFIG = {
  chainId: 11155111,
  chainName: "Sepolia",
  rpcUrl: "https://rpc.sepolia.org",
  blockExplorer: "https://sepolia.etherscan.io"
};
*/
