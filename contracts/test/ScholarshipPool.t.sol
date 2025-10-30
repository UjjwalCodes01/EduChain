// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/ScholarshipPool.sol";

contract ScholarshipPoolTest is Test {
    ScholarshipPool public pool;
    
    address public admin = address(1);
    address public donor = address(2);
    address public student1 = address(3);
    address public student2 = address(4);
    
    string public poolName = "Tech Scholarship 2024";
    string public poolDescription = "For CS students with GPA > 3.5";
    uint256 public scholarshipAmount = 1 ether;
    uint256 public applicationDeadline;
    
    event PoolFunded(address indexed donor, uint256 amount);
    event ApplicationSubmitted(address indexed student, string dataHash, uint256 timestamp);
    event ApplicationVerified(address indexed student);
    event ApplicationApproved(address indexed student);
    event ScholarshipPaid(address indexed student, uint256 amount);

    function setUp() public {
        applicationDeadline = block.timestamp + 30 days;
        
        pool = new ScholarshipPool(
            poolName,
            poolDescription,
            scholarshipAmount,
            applicationDeadline,
            admin
        );
        
        // Fund accounts
        vm.deal(donor, 10 ether);
        vm.deal(student1, 1 ether);
        vm.deal(student2, 1 ether);
    }

    function testConstructor() public {
        assertEq(pool.poolName(), poolName);
        assertEq(pool.poolDescription(), poolDescription);
        assertEq(pool.scholarshipAmount(), scholarshipAmount);
        assertEq(pool.applicationDeadline(), applicationDeadline);
        assertEq(pool.owner(), admin);
    }

    function testConstructorRevertsWithInvalidParams() public {
        vm.expectRevert("Pool name required");
        new ScholarshipPool("", poolDescription, scholarshipAmount, applicationDeadline, admin);
        
        vm.expectRevert("Scholarship amount must be > 0");
        new ScholarshipPool(poolName, poolDescription, 0, applicationDeadline, admin);
        
        vm.expectRevert("Deadline must be in future");
        new ScholarshipPool(poolName, poolDescription, scholarshipAmount, block.timestamp - 1, admin);
        
        vm.expectRevert(abi.encodeWithSignature("OwnableInvalidOwner(address)", address(0)));
        new ScholarshipPool(poolName, poolDescription, scholarshipAmount, applicationDeadline, address(0));
    }

    function testFundPool() public {
        vm.prank(donor);
        vm.expectEmit(true, false, false, true);
        emit PoolFunded(donor, 5 ether);
        pool.fundPool{value: 5 ether}();
        
        assertEq(pool.totalFunds(), 5 ether);
        assertEq(pool.availableFunds(), 5 ether);
    }

    function testFundPoolViaReceive() public {
        vm.prank(donor);
        (bool success, ) = address(pool).call{value: 3 ether}("");
        assertTrue(success);
        
        assertEq(pool.totalFunds(), 3 ether);
        assertEq(pool.availableFunds(), 3 ether);
    }

    function testFundPoolRevertsWithZeroValue() public {
        vm.prank(donor);
        vm.expectRevert("Must send funds");
        pool.fundPool{value: 0}();
    }

    function testSubmitApplication() public {
        string memory dataHash = "QmHash123";
        
        vm.prank(student1);
        vm.expectEmit(true, false, false, true);
        emit ApplicationSubmitted(student1, dataHash, block.timestamp);
        pool.submitApplication(dataHash);
        
        (address studentAddress, string memory hash, bool isVerified, bool isApproved, bool isPaid, uint256 timestamp) = 
            pool.getApplication(student1);
        
        assertEq(studentAddress, student1);
        assertEq(hash, dataHash);
        assertFalse(isVerified);
        assertFalse(isApproved);
        assertFalse(isPaid);
        assertEq(timestamp, block.timestamp);
    }

    function testSubmitApplicationRevertsAfterDeadline() public {
        vm.warp(applicationDeadline + 1);
        
        vm.prank(student1);
        vm.expectRevert("Application deadline passed");
        pool.submitApplication("QmHash123");
    }

    function testSubmitApplicationRevertsIfAlreadyApplied() public {
        vm.startPrank(student1);
        pool.submitApplication("QmHash123");
        
        vm.expectRevert("Already applied");
        pool.submitApplication("QmHash456");
        vm.stopPrank();
    }

    function testSubmitApplicationRevertsWithEmptyHash() public {
        vm.prank(student1);
        vm.expectRevert("Data hash required");
        pool.submitApplication("");
    }

    function testVerifyApplication() public {
        vm.prank(student1);
        pool.submitApplication("QmHash123");
        
        vm.prank(admin);
        vm.expectEmit(true, false, false, false);
        emit ApplicationVerified(student1);
        pool.verifyApplication(student1);
        
        (, , bool isVerified, , , ) = pool.getApplication(student1);
        assertTrue(isVerified);
    }

    function testVerifyApplicationRevertsIfNotAdmin() public {
        vm.prank(student1);
        pool.submitApplication("QmHash123");
        
        vm.prank(student2);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", student2));
        pool.verifyApplication(student1);
    }

    function testApproveApplication() public {
        // Fund pool
        vm.prank(donor);
        pool.fundPool{value: 5 ether}();
        
        // Submit and verify
        vm.prank(student1);
        pool.submitApplication("QmHash123");
        
        vm.startPrank(admin);
        pool.verifyApplication(student1);
        
        vm.expectEmit(true, false, false, false);
        emit ApplicationApproved(student1);
        pool.approveApplication(student1);
        vm.stopPrank();
        
        (, , , bool isApproved, , ) = pool.getApplication(student1);
        assertTrue(isApproved);
    }

    function testApproveApplicationRevertsIfNotVerified() public {
        vm.prank(student1);
        pool.submitApplication("QmHash123");
        
        vm.prank(admin);
        vm.expectRevert("Not verified");
        pool.approveApplication(student1);
    }

    function testApproveApplicationRevertsIfInsufficientFunds() public {
        vm.prank(student1);
        pool.submitApplication("QmHash123");
        
        vm.startPrank(admin);
        pool.verifyApplication(student1);
        
        vm.expectRevert("Insufficient funds");
        pool.approveApplication(student1);
        vm.stopPrank();
    }

    function testPayScholarship() public {
        // Fund pool
        vm.prank(donor);
        pool.fundPool{value: 5 ether}();
        
        // Submit, verify, and approve
        vm.prank(student1);
        pool.submitApplication("QmHash123");
        
        vm.startPrank(admin);
        pool.verifyApplication(student1);
        pool.approveApplication(student1);
        
        uint256 studentBalanceBefore = student1.balance;
        
        vm.expectEmit(true, false, false, true);
        emit ScholarshipPaid(student1, scholarshipAmount);
        pool.payScholarship(student1);
        vm.stopPrank();
        
        assertEq(student1.balance, studentBalanceBefore + scholarshipAmount);
        assertEq(pool.availableFunds(), 4 ether);
        assertEq(pool.totalScholarshipsAwarded(), 1);
        
        (, , , , bool isPaid, ) = pool.getApplication(student1);
        assertTrue(isPaid);
    }

    function testPayScholarshipRevertsIfNotApproved() public {
        vm.prank(donor);
        pool.fundPool{value: 5 ether}();
        
        vm.prank(student1);
        pool.submitApplication("QmHash123");
        
        vm.prank(admin);
        vm.expectRevert("Not approved");
        pool.payScholarship(student1);
    }

    function testPayScholarshipRevertsIfAlreadyPaid() public {
        vm.prank(donor);
        pool.fundPool{value: 5 ether}();
        
        vm.prank(student1);
        pool.submitApplication("QmHash123");
        
        vm.startPrank(admin);
        pool.verifyApplication(student1);
        pool.approveApplication(student1);
        pool.payScholarship(student1);
        
        vm.expectRevert("Already paid");
        pool.payScholarship(student1);
        vm.stopPrank();
    }

    function testBatchPayScholarships() public {
        // Fund pool
        vm.prank(donor);
        pool.fundPool{value: 10 ether}();
        
        // Submit and approve multiple students
        vm.prank(student1);
        pool.submitApplication("QmHash1");
        
        vm.prank(student2);
        pool.submitApplication("QmHash2");
        
        vm.startPrank(admin);
        pool.verifyApplication(student1);
        pool.verifyApplication(student2);
        pool.approveApplication(student1);
        pool.approveApplication(student2);
        
        address[] memory students = new address[](2);
        students[0] = student1;
        students[1] = student2;
        
        uint256 student1BalanceBefore = student1.balance;
        uint256 student2BalanceBefore = student2.balance;
        
        pool.batchPayScholarships(students);
        vm.stopPrank();
        
        assertEq(student1.balance, student1BalanceBefore + scholarshipAmount);
        assertEq(student2.balance, student2BalanceBefore + scholarshipAmount);
        assertEq(pool.totalScholarshipsAwarded(), 2);
        assertEq(pool.availableFunds(), 8 ether);
    }

    function testUpdateScholarshipAmount() public {
        uint256 newAmount = 2 ether;
        
        vm.prank(admin);
        pool.updateScholarshipAmount(newAmount);
        
        assertEq(pool.scholarshipAmount(), newAmount);
    }

    function testUpdateDeadline() public {
        uint256 newDeadline = block.timestamp + 60 days;
        
        vm.prank(admin);
        pool.updateDeadline(newDeadline);
        
        assertEq(pool.applicationDeadline(), newDeadline);
    }

    function testWithdrawFunds() public {
        vm.prank(donor);
        pool.fundPool{value: 5 ether}();
        
        uint256 adminBalanceBefore = admin.balance;
        
        vm.prank(admin);
        pool.withdrawFunds(2 ether);
        
        assertEq(admin.balance, adminBalanceBefore + 2 ether);
        assertEq(pool.availableFunds(), 3 ether);
    }

    function testPauseAndUnpause() public {
        vm.prank(admin);
        pool.pause();
        
        vm.prank(donor);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        pool.fundPool{value: 1 ether}();
        
        vm.prank(admin);
        pool.unpause();
        
        vm.prank(donor);
        pool.fundPool{value: 1 ether}();
        assertEq(pool.totalFunds(), 1 ether);
    }

    function testGetApplicantCount() public {
        vm.prank(student1);
        pool.submitApplication("QmHash1");
        
        vm.prank(student2);
        pool.submitApplication("QmHash2");
        
        assertEq(pool.getApplicantCount(), 2);
    }

    function testGetAllApplicants() public {
        vm.prank(student1);
        pool.submitApplication("QmHash1");
        
        vm.prank(student2);
        pool.submitApplication("QmHash2");
        
        address[] memory applicants = pool.getAllApplicants();
        assertEq(applicants.length, 2);
        assertEq(applicants[0], student1);
        assertEq(applicants[1], student2);
    }

    function testGetPoolStats() public {
        vm.prank(donor);
        pool.fundPool{value: 5 ether}();
        
        vm.prank(student1);
        pool.submitApplication("QmHash1");
        
        (
            uint256 _totalFunds,
            uint256 _availableFunds,
            uint256 _totalScholarshipsAwarded,
            uint256 _applicantCount,
            uint256 _scholarshipAmount,
            uint256 _deadline
        ) = pool.getPoolStats();
        
        assertEq(_totalFunds, 5 ether);
        assertEq(_availableFunds, 5 ether);
        assertEq(_totalScholarshipsAwarded, 0);
        assertEq(_applicantCount, 1);
        assertEq(_scholarshipAmount, scholarshipAmount);
        assertEq(_deadline, applicationDeadline);
    }
}
