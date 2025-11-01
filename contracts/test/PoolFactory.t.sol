// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/PoolFactory.sol";
import "../src/ScholarshipPool.sol";

contract PoolFactoryTest is Test {
    PoolFactory public factory;
    
    address public creator1 = address(1);
    address public creator2 = address(2);
    
    string public poolName1 = "Tech Scholarship 2024";
    string public poolDescription1 = "For CS students";
    uint256 public scholarshipAmount1 = 1 ether;
    uint256 public applicationDeadline1;
    
    string public poolName2 = "Arts Scholarship 2024";
    string public poolDescription2 = "For Fine Arts students";
    uint256 public scholarshipAmount2 = 0.5 ether;
    uint256 public applicationDeadline2;
    
    event PoolCreated(
        address indexed poolAddress,
        address indexed creator,
        string poolName,
        uint256 scholarshipAmount,
        uint256 applicationDeadline,
        uint256 timestamp
    );

    function setUp() public {
        factory = new PoolFactory();
        applicationDeadline1 = block.timestamp + 30 days;
        applicationDeadline2 = block.timestamp + 60 days;
    }

    function testCreatePool() public {
        vm.prank(creator1);
        vm.expectEmit(false, true, false, false);
        emit PoolCreated(address(0), creator1, poolName1, scholarshipAmount1, applicationDeadline1, block.timestamp);
        
        address poolAddress = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        assertTrue(poolAddress != address(0));
        assertTrue(factory.isPool(poolAddress));
        
        // Verify pool was created correctly
        ScholarshipPool pool = ScholarshipPool(payable(poolAddress));
        assertEq(pool.poolName(), poolName1);
        assertEq(pool.scholarshipAmount(), scholarshipAmount1);
        
        // Verify creator has ADMIN_ROLE (AccessControl)
        bytes32 adminRole = pool.ADMIN_ROLE();
        assertTrue(pool.hasRole(adminRole, creator1));
    }

    function testCreatePoolRevertsWithInvalidParams() public {
        vm.startPrank(creator1);
        
        vm.expectRevert("Pool name required");
        factory.createPool("", poolDescription1, scholarshipAmount1, applicationDeadline1);
        
        vm.expectRevert("Scholarship amount must be > 0");
        factory.createPool(poolName1, poolDescription1, 0, applicationDeadline1);
        
        vm.expectRevert("Deadline must be in future");
        factory.createPool(poolName1, poolDescription1, scholarshipAmount1, block.timestamp - 1);
        
        vm.stopPrank();
    }

    function testCreateMultiplePools() public {
        vm.prank(creator1);
        address pool1 = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        vm.prank(creator2);
        address pool2 = factory.createPool(
            poolName2,
            poolDescription2,
            scholarshipAmount2,
            applicationDeadline2
        );
        
        assertEq(factory.getPoolCount(), 2);
        assertTrue(factory.isPool(pool1));
        assertTrue(factory.isPool(pool2));
        assertTrue(pool1 != pool2);
    }

    function testGetAllPools() public {
        vm.prank(creator1);
        address pool1 = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        vm.prank(creator2);
        address pool2 = factory.createPool(
            poolName2,
            poolDescription2,
            scholarshipAmount2,
            applicationDeadline2
        );
        
        address[] memory allPools = factory.getAllPools();
        assertEq(allPools.length, 2);
        assertEq(allPools[0], pool1);
        assertEq(allPools[1], pool2);
    }

    function testGetPoolsByCreator() public {
        vm.startPrank(creator1);
        address pool1 = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        address pool2 = factory.createPool(
            "Tech Scholarship 2025",
            "For CS students",
            2 ether,
            applicationDeadline1
        );
        vm.stopPrank();
        
        vm.prank(creator2);
        address pool3 = factory.createPool(
            poolName2,
            poolDescription2,
            scholarshipAmount2,
            applicationDeadline2
        );
        
        address[] memory creator1Pools = factory.getPoolsByCreator(creator1);
        assertEq(creator1Pools.length, 2);
        assertEq(creator1Pools[0], pool1);
        assertEq(creator1Pools[1], pool2);
        
        address[] memory creator2Pools = factory.getPoolsByCreator(creator2);
        assertEq(creator2Pools.length, 1);
        assertEq(creator2Pools[0], pool3);
    }

    function testGetCreatorPoolCount() public {
        vm.startPrank(creator1);
        factory.createPool(poolName1, poolDescription1, scholarshipAmount1, applicationDeadline1);
        factory.createPool("Pool 2", "Description 2", 1 ether, applicationDeadline1);
        vm.stopPrank();
        
        assertEq(factory.getCreatorPoolCount(creator1), 2);
        assertEq(factory.getCreatorPoolCount(creator2), 0);
    }

    function testGetPoolInfo() public {
        vm.prank(creator1);
        address poolAddress = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        (
            address returnedPoolAddress,
            address admin,
            string memory name,
            uint256 amount,
            uint256 deadline,
            uint256 createdAt
        ) = factory.getPoolInfo(poolAddress);
        
        assertEq(returnedPoolAddress, poolAddress);
        assertEq(admin, creator1);
        assertEq(name, poolName1);
        assertEq(amount, scholarshipAmount1);
        assertEq(deadline, applicationDeadline1);
        assertEq(createdAt, block.timestamp);
    }

    function testGetPoolInfoRevertsForInvalidPool() public {
        address fakePool = address(999);
        
        vm.expectRevert("Not a valid pool");
        factory.getPoolInfo(fakePool);
    }

    function testGetMultiplePoolsInfo() public {
        vm.prank(creator1);
        address pool1 = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        vm.prank(creator2);
        address pool2 = factory.createPool(
            poolName2,
            poolDescription2,
            scholarshipAmount2,
            applicationDeadline2
        );
        
        address[] memory poolAddresses = new address[](2);
        poolAddresses[0] = pool1;
        poolAddresses[1] = pool2;
        
        PoolFactory.PoolInfo[] memory infos = factory.getMultiplePoolsInfo(poolAddresses);
        
        assertEq(infos.length, 2);
        assertEq(infos[0].poolAddress, pool1);
        assertEq(infos[0].admin, creator1);
        assertEq(infos[1].poolAddress, pool2);
        assertEq(infos[1].admin, creator2);
    }

    function testGetAllPoolsInfo() public {
        vm.prank(creator1);
        address pool1 = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        vm.prank(creator2);
        address pool2 = factory.createPool(
            poolName2,
            poolDescription2,
            scholarshipAmount2,
            applicationDeadline2
        );
        
        PoolFactory.PoolInfo[] memory allInfos = factory.getAllPoolsInfo();
        
        assertEq(allInfos.length, 2);
        assertEq(allInfos[0].poolAddress, pool1);
        assertEq(allInfos[1].poolAddress, pool2);
    }

    function testValidatePool() public {
        vm.prank(creator1);
        address poolAddress = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        assertTrue(factory.validatePool(poolAddress));
        assertFalse(factory.validatePool(address(999)));
    }

    function testPoolIndependence() public {
        // Create two pools
        vm.prank(creator1);
        address pool1Address = factory.createPool(
            poolName1,
            poolDescription1,
            scholarshipAmount1,
            applicationDeadline1
        );
        
        vm.prank(creator2);
        address pool2Address = factory.createPool(
            poolName2,
            poolDescription2,
            scholarshipAmount2,
            applicationDeadline2
        );
        
        ScholarshipPool pool1 = ScholarshipPool(payable(pool1Address));
        ScholarshipPool pool2 = ScholarshipPool(payable(pool2Address));
        
        // Verify they have different admins (AccessControl)
        bytes32 adminRole = pool1.ADMIN_ROLE();
        assertTrue(pool1.hasRole(adminRole, creator1));
        assertTrue(pool2.hasRole(adminRole, creator2));
        
        // Verify creator1 can only control pool1
        vm.prank(creator1);
        pool1.pause();
        
        vm.prank(creator2);
        vm.expectRevert();
        pool1.unpause(); // Should fail because creator2 is not owner of pool1
        
        vm.prank(creator1);
        pool1.unpause(); // Should succeed
    }

    function testGetPoolCount() public {
        assertEq(factory.getPoolCount(), 0);
        
        vm.prank(creator1);
        factory.createPool(poolName1, poolDescription1, scholarshipAmount1, applicationDeadline1);
        assertEq(factory.getPoolCount(), 1);
        
        vm.prank(creator2);
        factory.createPool(poolName2, poolDescription2, scholarshipAmount2, applicationDeadline2);
        assertEq(factory.getPoolCount(), 2);
    }
}
