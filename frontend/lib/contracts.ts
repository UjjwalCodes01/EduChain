// Contract addresses and ABIs
// Deployed on Sepolia Testnet

// Use environment variables with fallbacks
export const POOL_FACTORY_ADDRESS = 
  process.env.NEXT_PUBLIC_POOL_FACTORY_ADDRESS || "0x5D2B277be75CAB114189dE5298F2bC875Fa2a14a";

export const SCHOLARSHIP_POOL_ADDRESS = 
  process.env.NEXT_PUBLIC_SCHOLARSHIP_POOL_ADDRESS || "0xd5CD1b7D40A1b442954f9873CAb03A5E61d866FE";

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
// SCHOLARSHIP POOL ABI - ScholarshipPool.sol
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
  "function paused() external view returns (bool)",
  
  // AccessControl roles
  "function ADMIN_ROLE() external view returns (bytes32)",
  "function AUTOMATION_ROLE() external view returns (bytes32)",
  "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  "function renounceRole(bytes32 role, address callerConfirmation) external",
  "function getRoleAdmin(bytes32 role) external view returns (bytes32)",
  
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
  
  // Application queries
  "function getApplicantCount() external view returns (uint256)",
  "function getApplicant(uint256 _index) external view returns (address)",
  "function getAllApplicants() external view returns (address[] memory)",
  "function applications(address) external view returns (address studentAddress, string dataHash, bool isVerified, bool isApproved, bool isPaid, uint256 timestamp)",
  "function getApplication(address _student) external view returns (address studentAddress, string memory dataHash, bool isVerified, bool isApproved, bool isPaid, uint256 timestamp)",
  "function getPoolStats() external view returns (uint256 _totalFunds, uint256 _availableFunds, uint256 _totalScholarshipsAwarded, uint256 _applicantCount, uint256 _scholarshipAmount, uint256 _deadline)",
  
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
  "event PoolDescriptionUpdated(string newDescription)",
  "event Paused(address account)",
  "event Unpaused(address account)",
  "event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender)",
  "event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender)"
];

// ============================================================================
// NETWORK CONFIGURATION
// ============================================================================
export const NETWORK_CONFIG = {
  chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "11155111"),
  chainName: process.env.NEXT_PUBLIC_NETWORK_NAME || "Sepolia",
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || "https://eth-sepolia.g.alchemy.com/v2/Yv-jZwlxmcykNC7GGC0rh",
  blockExplorer: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || "https://sepolia.etherscan.io"
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if the user is connected to the correct network
 */
export const isCorrectNetwork = (chainId: number): boolean => {
  return chainId === NETWORK_CONFIG.chainId;
};

/**
 * Get block explorer URL for an address
 */
export const getExplorerAddressUrl = (address: string): string => {
  return `${NETWORK_CONFIG.blockExplorer}/address/${address}`;
};

/**
 * Get block explorer URL for a transaction
 */
export const getExplorerTxUrl = (txHash: string): string => {
  return `${NETWORK_CONFIG.blockExplorer}/tx/${txHash}`;
};

/**
 * Format wallet address for display (0x1234...5678)
 */
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

/**
 * Network switch params for MetaMask
 */
export const NETWORK_PARAMS = {
  chainId: `0x${NETWORK_CONFIG.chainId.toString(16)}`,
  chainName: NETWORK_CONFIG.chainName,
  nativeCurrency: {
    name: 'Sepolia ETH',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: [NETWORK_CONFIG.rpcUrl],
  blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
};
