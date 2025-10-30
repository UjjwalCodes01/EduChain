// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./ScholarshipPool.sol";

/**
 * @title PoolFactory
 * @notice Factory contract for creating and tracking scholarship pools
 * @dev Allows organizations to deploy their own independent scholarship pools
 */
contract PoolFactory {
    // Array of all created pools
    address[] public allPools;
    
    // Mapping from creator address to their pools
    mapping(address => address[]) public poolsByCreator;
    
    // Mapping to check if an address is a valid pool
    mapping(address => bool) public isPool;
    
    // Pool metadata for easy querying
    struct PoolInfo {
        address poolAddress;
        address admin;
        string poolName;
        uint256 scholarshipAmount;
        uint256 applicationDeadline;
        uint256 createdAt;
    }
    
    mapping(address => PoolInfo) public poolInfo;

    // Events
    event PoolCreated(
        address indexed poolAddress,
        address indexed creator,
        string poolName,
        uint256 scholarshipAmount,
        uint256 applicationDeadline,
        uint256 timestamp
    );

    /**
     * @notice Creates a new scholarship pool
     * @param _poolName Name of the scholarship pool
     * @param _poolDescription Description of the pool and eligibility criteria
     * @param _scholarshipAmount Amount per scholarship in wei
     * @param _applicationDeadline Unix timestamp for application deadline
     * @return poolAddress Address of the newly created pool
     */
    function createPool(
        string memory _poolName,
        string memory _poolDescription,
        uint256 _scholarshipAmount,
        uint256 _applicationDeadline
    ) external returns (address poolAddress) {
        require(bytes(_poolName).length > 0, "Pool name required");
        require(_scholarshipAmount > 0, "Scholarship amount must be > 0");
        require(_applicationDeadline > block.timestamp, "Deadline must be in future");

        // Deploy new ScholarshipPool contract
        ScholarshipPool newPool = new ScholarshipPool(
            _poolName,
            _poolDescription,
            _scholarshipAmount,
            _applicationDeadline,
            msg.sender
        );

        poolAddress = address(newPool);

        // Store pool information
        allPools.push(poolAddress);
        poolsByCreator[msg.sender].push(poolAddress);
        isPool[poolAddress] = true;

        poolInfo[poolAddress] = PoolInfo({
            poolAddress: poolAddress,
            admin: msg.sender,
            poolName: _poolName,
            scholarshipAmount: _scholarshipAmount,
            applicationDeadline: _applicationDeadline,
            createdAt: block.timestamp
        });

        emit PoolCreated(
            poolAddress,
            msg.sender,
            _poolName,
            _scholarshipAmount,
            _applicationDeadline,
            block.timestamp
        );

        return poolAddress;
    }

    /**
     * @notice Get total number of pools created
     */
    function getPoolCount() external view returns (uint256) {
        return allPools.length;
    }

    /**
     * @notice Get all pool addresses
     */
    function getAllPools() external view returns (address[] memory) {
        return allPools;
    }

    /**
     * @notice Get pools created by a specific address
     * @param _creator Address of the pool creator
     */
    function getPoolsByCreator(address _creator) external view returns (address[] memory) {
        return poolsByCreator[_creator];
    }

    /**
     * @notice Get number of pools created by an address
     * @param _creator Address of the pool creator
     */
    function getCreatorPoolCount(address _creator) external view returns (uint256) {
        return poolsByCreator[_creator].length;
    }

    /**
     * @notice Get basic info for a pool
     * @param _poolAddress Address of the pool
     */
    function getPoolInfo(address _poolAddress) external view returns (
        address poolAddress,
        address admin,
        string memory poolName,
        uint256 scholarshipAmount,
        uint256 applicationDeadline,
        uint256 createdAt
    ) {
        require(isPool[_poolAddress], "Not a valid pool");
        PoolInfo memory info = poolInfo[_poolAddress];
        return (
            info.poolAddress,
            info.admin,
            info.poolName,
            info.scholarshipAmount,
            info.applicationDeadline,
            info.createdAt
        );
    }

    /**
     * @notice Get detailed info for multiple pools
     * @param _poolAddresses Array of pool addresses
     */
    function getMultiplePoolsInfo(address[] calldata _poolAddresses) 
        external 
        view 
        returns (PoolInfo[] memory) 
    {
        PoolInfo[] memory infos = new PoolInfo[](_poolAddresses.length);
        for (uint256 i = 0; i < _poolAddresses.length; i++) {
            if (isPool[_poolAddresses[i]]) {
                infos[i] = poolInfo[_poolAddresses[i]];
            }
        }
        return infos;
    }

    /**
     * @notice Get all pools with their basic info
     */
    function getAllPoolsInfo() external view returns (PoolInfo[] memory) {
        PoolInfo[] memory infos = new PoolInfo[](allPools.length);
        for (uint256 i = 0; i < allPools.length; i++) {
            infos[i] = poolInfo[allPools[i]];
        }
        return infos;
    }

    /**
     * @notice Check if an address is a valid pool created by this factory
     * @param _poolAddress Address to check
     */
    function validatePool(address _poolAddress) external view returns (bool) {
        return isPool[_poolAddress];
    }
}
