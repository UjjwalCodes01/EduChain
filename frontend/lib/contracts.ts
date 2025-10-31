// Contract addresses and ABIs
// Update these addresses after deploying your contracts

export const POOL_FACTORY_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // Update with your deployed PoolFactory address

// Factory ABI
export const FACTORY_ABI = [
  "function createPool(string memory _poolName, string memory _poolDescription, uint256 _scholarshipAmount, uint256 _applicationDeadline) external payable returns (address)",
  "function getAllPools() external view returns (address[] memory)",
  "function getPoolsByCreator(address creator) external view returns (address[] memory)",
  "function poolCount() external view returns (uint256)"
];

// Scholarship Pool ABI
export const POOL_ABI = [
  "function poolName() external view returns (string memory)",
  "function poolDescription() external view returns (string memory)",
  "function scholarshipAmount() external view returns (uint256)",
  "function applicationDeadline() external view returns (uint256)",
  "function balance() external view returns (uint256)",
  "function totalScholarshipsAwarded() external view returns (uint256)",
  "function paused() external view returns (bool)",
  "function admin() external view returns (address)",
  "function totalApplications() external view returns (uint256)",
  "function fundPool() external payable",
  "function withdrawFunds(uint256 amount) external",
  "function disburseScholarship(address recipient) external",
  "function pausePool() external",
  "function unpausePool() external"
];

// Network configuration
export const NETWORK_CONFIG = {
  chainId: 31337, // Local Hardhat network, change for production
  chainName: "Localhost",
  rpcUrl: "http://127.0.0.1:8545"
};
