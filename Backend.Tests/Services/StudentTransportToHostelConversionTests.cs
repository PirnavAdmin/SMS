namespace Backend.Tests.Services;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Implementations.FinanceManagement;
using Xunit;

public class StudentTransportToHostelConversionTests
{
    private AppDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task TransitionStudentCategory_DayScholarToHostel_CorrectlyProratesAndCredits()
    {
        using var db = GetInMemoryDbContext();

        // 1. Arrange Branch, AcademicYear, Class
        var branch = new Branch { BranchId = 1, BranchName = "Main Campus", Status = "Active" };
        var ay = new AcademicYear { AcademicYearId = 1, AcademicYearName = "2026-2027", StartDate = DateTime.UtcNow.AddMonths(-3), EndDate = DateTime.UtcNow.AddMonths(9), Status = "Active" };
        var cls = new ClassGrade { ClassId = 1, ClassName = "Class 10", Status = "Active", DisplayOrder = 10 };
        var sec = new ClassSection { SectionId = 1, SectionName = "A", ClassId = 1, Status = "Active" };

        db.Branches.Add(branch);
        db.AcademicYears.Add(ay);
        db.Classes.Add(cls);
        db.ClassSections.Add(sec);

        // 2. Arrange Student & Admission
        var student = new Student
        {
            StudentId = 101,
            AdmissionNumber = "ADM-101",
            RollNumber = "101",
            StudentName = "Aarav Sharma",
            BranchId = 1,
            AcademicYearId = 1,
            ClassId = 1,
            SectionId = 1,
            Status = "Active"
        };
        db.Students.Add(student);

        var admission = new AdmissionApplication
        {
            Id = 101,
            AdmissionNo = "ADM-101",
            RegistrationNo = "ADM-101",
            FirstName = "Aarav",
            LastName = "Sharma",
            StudentType = "Non-Residential",
            TransportRequired = true,
            BusRoute = "Route 1",
            PickupPoint = "Point A",
            AppliedClassId = 1,
            Status = "Enrolled",
            CreatedAt = DateTime.UtcNow.AddMonths(-3)
        };
        db.AdmissionApplications.Add(admission);

        // 3. Arrange Transport Route & Assignment
        var route = new TransportRoute
        {
            RouteId = 1,
            RouteName = "Route 1",
            DistanceKm = 10m,
            MinRangeKm = 5m,
            NonAcBaseFare = 1000m,
            NonAcRatePerKm = 100m,
            AcBaseFare = 1200m,
            AcRatePerKm = 150m,
            Status = true
        };
        var pickup = new PickupPoint
        {
            PickupPointId = 1,
            PickupPointName = "Point A",
            RouteId = 1,
            DistanceFromStart = 8m,
            Status = true
        };
        db.TransportRoutes.Add(route);
        db.PickupPoints.Add(pickup);

        var transportAssignment = new StudentTransportAssignment
        {
            StudentTransportAssignmentId = 1,
            StudentId = 101,
            AdmissionNo = "ADM-101",
            RouteId = 1,
            PickupPointId = 1,
            EffectiveFrom = DateTime.UtcNow.AddMonths(-3),
            TransportType = "Non-AC",
            Status = true,
            IsDeleted = false
        };
        db.StudentTransportAssignments.Add(transportAssignment);

        // 4. Arrange Hostel Block, Room, and Fee Config
        var hostel = new HostelBlock { HostelId = 1, HostelName = "Vidyarthi Nilayam", HostelCode = "VN-01", HostelType = "Boys Hostel", Status = "Active" };
        var roomType = new RoomType { RoomTypeId = 1, RoomTypeName = "Double Sharing Non-AC", AcType = "Non-AC", BedCapacity = 2 };
        var room = new RoomMaster { RoomId = 1, HostelId = 1, RoomNumber = "101", RoomTypeId = 1, Status = "Active", RoomType = roomType, Hostel = hostel };
        db.HostelBlocks.Add(hostel);
        db.RoomTypes.Add(roomType);
        db.RoomMasters.Add(room);

        var hostelConfig = new HostelFeeConfig
        {
            HostelId = "1",
            HostelName = "Vidyarthi Nilayam",
            ClassRange = "All",
            AcType = "Non-AC",
            SharingType = "Double",
            HostelFee = 36000m, // 3000/mo
            SecurityDeposit = 5000m,
            FeePlan = "Annual",
            Status = "Active"
        };
        db.HostelFeeConfigs.Add(hostelConfig);

        // 5. Monthly Fare for Non-AC: Base 1000 + (8-5)*100 = 1300/mo. Annual = 15,600.
        // Student paid 15,600 in advance for transport.
        var advancePayment = new FeePayment
        {
            Id = 1,
            ReceiptNo = "REC-TRP-001",
            StudentId = "101",
            Amount = 15600m,
            PaymentDate = DateTime.UtcNow.AddMonths(-3),
            FeeHeadName = "Transport Fee",
            TermName = "Full Year Transport",
            Status = "Completed"
        };
        db.FeePayments.Add(advancePayment);

        await db.SaveChangesAsync();

        var repo = new FeeCollectionRepository(db);

        // Act: Transition to Residential effective today with credit transfer
        var transitionReq = new StudentCategoryTransitionRequestDto
        {
            StudentId = 101,
            AdmissionNo = "ADM-101",
            NewStudentType = "Residential",
            EffectiveDate = DateTime.UtcNow,
            TransportEndDate = DateTime.UtcNow,
            HostelJoiningDate = DateTime.UtcNow,
            HostelId = 1,
            RoomId = 1,
            BedNumber = "Bed #1",
            ApplyTransportCreditToHostel = true,
            Remarks = "Student joined hostel"
        };

        var response = await repo.TransitionStudentCategoryAsync(transitionReq);

        // Assert
        Assert.True(response.Success);
        Assert.Equal("Residential", response.NewStudentType);
        Assert.Equal("Non-Residential", response.PreviousStudentType);

        // Transport used 3 months: 3 * 1300 = 3900.
        Assert.Equal(3900m, response.FinalizedTransportFee);
        Assert.Equal(15600m, response.TransportPaid);

        // Unused credit = 15600 - 3900 = 11700
        Assert.Equal(11700m, response.UnusedTransportCredit);
        Assert.Equal(11700m, response.CreditAppliedToHostel);
        Assert.Equal(0m, response.RemainingTransportDue);

        // Transport assignment ceased
        var updatedTa = await db.StudentTransportAssignments.FirstAsync(t => t.StudentId == 101);
        Assert.False(updatedTa.Status);
        Assert.NotNull(updatedTa.EffectiveTo);

        // Bed allocated
        var bedAlloc = await db.StudentBedAllocations.FirstOrDefaultAsync(b => b.StudentId == 101);
        Assert.NotNull(bedAlloc);
        Assert.Equal("Active", bedAlloc.Status);
        Assert.Equal(1, bedAlloc.HostelId);
        Assert.Equal("Bed #1", bedAlloc.BedNumber);

        // Auditable Ledger entry created for credit transfer
        var creditLedger = await db.LedgerEntries.FirstOrDefaultAsync(l => l.TransactionType == "Credit Transfer" && l.StudentId == 101);
        Assert.NotNull(creditLedger);
        Assert.Equal(11700m, creditLedger.Credit);
        Assert.Equal(11700m, creditLedger.Debit);

        // Verified profile breakdown
        var profile = await repo.GetStudentFeeProfileAsync(101, "2026-2027");
        Assert.NotNull(profile);
        Assert.Equal(3900m, profile.TransportAssessedFee);
        Assert.Equal(3900m, profile.TransportPaidAmount);
        Assert.Equal(0m, profile.TransportRemainingDue);
        Assert.Equal(5000m, profile.SecurityDepositAssessed);
        Assert.True(profile.CurrentAcademicYearFees.Any(f => f.FeeHeadId == "FH-HST-DEP"));
    }

    [Fact]
    public async Task ApplyTransportCredit_ReallocatesAvailableCredit_UpdatesLedgerAndPayment()
    {
        using var db = GetInMemoryDbContext();

        var student = new Student { StudentId = 102, AdmissionNumber = "ADM-102", RollNumber = "102", StudentName = "Priya Rao", AcademicYearId = 1, BranchId = 1 };
        db.Students.Add(student);

        // Transport paid 10,000 but only used 4,000 (available credit = 6,000)
        var ta = new StudentTransportAssignment
        {
            StudentTransportAssignmentId = 2,
            StudentId = 102,
            AdmissionNo = "ADM-102",
            RouteId = 1,
            PickupPointId = 1,
            EffectiveFrom = DateTime.UtcNow.AddMonths(-4),
            EffectiveTo = DateTime.UtcNow,
            Status = false
        };
        db.StudentTransportAssignments.Add(ta);

        var route = new TransportRoute { RouteId = 1, RouteName = "Route 1", NonAcBaseFare = 1000m, MinRangeKm = 10m, DistanceKm = 5m };
        var pickup = new PickupPoint { PickupPointId = 1, PickupPointName = "Stop 1", RouteId = 1 };
        db.TransportRoutes.Add(route);
        db.PickupPoints.Add(pickup);

        var payment = new FeePayment
        {
            Id = 2,
            ReceiptNo = "REC-TRP-002",
            StudentId = "102",
            Amount = 10000m,
            FeeHeadName = "Transport Fee",
            PaymentDate = DateTime.UtcNow.AddMonths(-4),
            Status = "Completed"
        };
        db.FeePayments.Add(payment);
        await db.SaveChangesAsync();

        var repo = new FeeCollectionRepository(db);

        // Available credit should be 6,000 (10,000 paid - 4,000 used)
        var profile = await repo.GetStudentFeeProfileAsync(102, null);
        Assert.NotNull(profile);
        Assert.Equal(6000m, profile.TransportCreditAmount);

        // Act: Apply 3,000 of credit to Hostel Accommodation
        var req = new ApplyTransportCreditRequestDto
        {
            StudentId = 102,
            Amount = 3000m,
            TargetFeeHead = "Hostel Accommodation",
            Reason = "Reallocate credit towards hostel stay"
        };
        var success = await repo.ApplyTransportCreditAsync(req);

        // Assert
        Assert.True(success);

        var ledger = await db.LedgerEntries.FirstOrDefaultAsync(l => l.StudentId == 102 && l.TransactionType == "Credit Transfer");
        Assert.NotNull(ledger);
        Assert.Equal(3000m, ledger.Debit);

        var creditPayment = await db.FeePayments.FirstOrDefaultAsync(p => p.StudentId == "102" && p.PaymentMethod == "Credit Adjustment");
        Assert.NotNull(creditPayment);
        Assert.Equal(3000m, creditPayment.Amount);
        Assert.Equal("Hostel Accommodation", creditPayment.FeeHeadName);
    }

    [Fact]
    public async Task ProcessDepositRefund_CreatesRefundLedgerAndNegativePayment()
    {
        using var db = GetInMemoryDbContext();

        var student = new Student { StudentId = 103, AdmissionNumber = "ADM-103", RollNumber = "103", StudentName = "Rohan Verma", AcademicYearId = 1, BranchId = 1 };
        db.Students.Add(student);
        await db.SaveChangesAsync();

        var repo = new FeeCollectionRepository(db);

        // Act: Process 5,000 deposit refund with 500 damage deduction
        var req = new ProcessDepositRefundRequestDto
        {
            StudentId = 103,
            RefundAmount = 5000m,
            DeductionAmount = 500m,
            DeductionReason = "Room door lock repair",
            PaymentMode = "Bank Transfer",
            Remarks = "Student graduated from hostel"
        };

        var success = await repo.ProcessDepositRefundAsync(req);

        // Assert
        Assert.True(success);

        var refundLedger = await db.LedgerEntries.FirstOrDefaultAsync(l => l.StudentId == 103 && l.TransactionType == "Refund");
        Assert.NotNull(refundLedger);
        Assert.Equal(4500m, refundLedger.Debit); // Net refund

        var refundPayment = await db.FeePayments.FirstOrDefaultAsync(p => p.StudentId == "103" && p.Status == "Refunded");
        Assert.NotNull(refundPayment);
        Assert.Equal(-4500m, refundPayment.Amount);
    }
}
