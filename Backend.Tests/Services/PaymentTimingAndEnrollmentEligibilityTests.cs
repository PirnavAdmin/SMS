namespace Backend.Tests.Services;

using Microsoft.EntityFrameworkCore;
using Moq;
using SMS.Api.Data;
using SMS.Api.Dtos.AcademicManagement;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Services.Implementations;
using SMS.Api.Services.Implementations.FinanceManagement;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.Settings;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

public class PaymentTimingAndEnrollmentEligibilityTests
{
    private readonly AppDbContext _context;
    private readonly Mock<ISchoolRepository> _schoolRepoMock;
    private readonly Mock<IEmailNotificationService> _emailMock;
    private readonly Mock<ISettingsService> _settingsMock;
    private readonly SchoolService _schoolService;

    private readonly Mock<IFinanceRepository> _financeRepoMock;
    private readonly FinanceService _financeService;

    public PaymentTimingAndEnrollmentEligibilityTests()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        _context = new AppDbContext(options);

        _schoolRepoMock = new Mock<ISchoolRepository>();
        _emailMock = new Mock<IEmailNotificationService>();
        _settingsMock = new Mock<ISettingsService>();
        _schoolService = new SchoolService(_schoolRepoMock.Object, _context, _emailMock.Object, _settingsMock.Object);

        _financeRepoMock = new Mock<IFinanceRepository>();
        _financeRepoMock.Setup(r => r.GetFeeHeadsAsync()).ReturnsAsync(new List<FeeHead>());
        _financeRepoMock.Setup(r => r.GetDynamicFeeStructuresAsync()).ReturnsAsync(new List<DynamicFeeStructure>());
        _financeService = new FinanceService(_financeRepoMock.Object);
    }

    // --- Scenario 1: Pay Before Enrollment - Unpaid blocks enrollment ---
    [Fact]
    public async Task PayBeforeEnrollment_WhenUnpaid_EligibilityIsFalse_EnrollThrowsBadRequest()
    {
        // Arrange
        var app = new AdmissionApplication
        {
            Id = 101,
            FirstName = "Aarav",
            LastName = "Sharma",
            AppliedClassId = 1,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(101)).ReturnsAsync(app);

        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 1,
            Name = "Grade 1 Admission & Tuition",
            ClassName = "Grade 1",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 25000m,
            PaymentRequirement = "Pay Before Enrollment",
            PreEnrollmentAmount = 25000m
        });
        _context.Classes.Add(new ClassGrade { ClassId = 1, ClassName = "Grade 1" });
        await _context.SaveChangesAsync();

        // Act
        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(101);

        // Assert
        Assert.False(result.IsEligible);
        Assert.Equal(25000m, result.RequiredAmount);
        Assert.Equal(0m, result.PaidAmount);
        Assert.Equal(25000m, result.OutstandingAmount);
        Assert.Contains("Outstanding pre-enrollment fee balance of ₹25,000 must be paid prior to enrollment", result.Reason);

        // Enrolling directly must throw BadRequestException
        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _schoolService.EnrollStudentAsync(101));
        Assert.Contains("Outstanding pre-enrollment fee balance", ex.Message);
    }

    // --- Scenario 2: Pay Before Enrollment - Partial Payment still blocks enrollment ---
    [Fact]
    public async Task PayBeforeEnrollment_WhenPartialPayment_EligibilityIsFalse()
    {
        // Arrange
        var app = new AdmissionApplication
        {
            Id = 102,
            FirstName = "Pooja",
            LastName = "Reddy",
            AppliedClassId = 1,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(102)).ReturnsAsync(app);

        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 2,
            Name = "Grade 1 Fee",
            ClassName = "Grade 1",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 30000m,
            PaymentRequirement = "Pay Before Enrollment",
            PreEnrollmentAmount = 30000m
        });
        _context.Classes.Add(new ClassGrade { ClassId = 1, ClassName = "Grade 1" });

        // Record partial payment of 10,000
        _context.FeePayments.Add(new FeePayment
        {
            Id = 1,
            StudentId = "102",
            Amount = 10000m,
            Status = "Completed",
            ReceiptNo = "REC-001"
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(102);

        // Assert
        Assert.False(result.IsEligible);
        Assert.Equal(30000m, result.RequiredAmount);
        Assert.Equal(10000m, result.PaidAmount);
        Assert.Equal(20000m, result.OutstandingAmount);

        await Assert.ThrowsAsync<BadRequestException>(() => _schoolService.EnrollStudentAsync(102));
    }

    // --- Scenario 3: Pay Before Enrollment - Fully Paid enables enrollment ---
    [Fact]
    public async Task PayBeforeEnrollment_WhenFullyPaid_EligibilityIsTrue_EnrollSucceeds()
    {
        // Arrange
        var app = new AdmissionApplication
        {
            Id = 103,
            FirstName = "Kiran",
            LastName = "Kumar",
            AppliedClassId = 1,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(103)).ReturnsAsync(app);
        _schoolRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 3,
            Name = "Grade 1 Fee",
            ClassName = "Grade 1",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 15000m,
            PaymentRequirement = "Pay Before Enrollment",
            PreEnrollmentAmount = 15000m
        });
        _context.Classes.Add(new ClassGrade { ClassId = 1, ClassName = "Grade 1" });

        // Record full payment
        _context.FeePayments.Add(new FeePayment
        {
            Id = 2,
            StudentId = "103",
            Amount = 15000m,
            Status = "Completed",
            ReceiptNo = "REC-002"
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(103);
        Assert.True(result.IsEligible);
        Assert.Equal(15000m, result.RequiredAmount);
        Assert.Equal(15000m, result.PaidAmount);
        Assert.Equal(0m, result.OutstandingAmount);

        var admNo = await _schoolService.EnrollStudentAsync(103);

        // Assert
        Assert.NotNull(admNo);
        Assert.Equal("Enrolled", app.Status);
    }

    // --- Scenario 4: Pay After Enrollment - Unpaid does NOT block enrollment ---
    [Fact]
    public async Task PayAfterEnrollment_WhenUnpaid_EligibilityIsTrue_CanEnrollWithZeroPaid()
    {
        // Arrange
        var app = new AdmissionApplication
        {
            Id = 104,
            FirstName = "Sita",
            LastName = "Devi",
            AppliedClassId = 2,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(104)).ReturnsAsync(app);
        _schoolRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 4,
            Name = "Grade 2 Tuition Annual",
            ClassName = "Grade 2",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 50000m,
            PaymentRequirement = "Pay After Enrollment",
            PreEnrollmentAmount = 0m
        });
        _context.Classes.Add(new ClassGrade { ClassId = 2, ClassName = "Grade 2" });
        await _context.SaveChangesAsync();

        // Act
        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(104);

        // Assert: 0 required pre-enrollment dues, applicant is eligible immediately
        Assert.True(result.IsEligible);
        Assert.Equal(0m, result.RequiredAmount);
        Assert.Equal(0m, result.PaidAmount);
        Assert.Equal(0m, result.OutstandingAmount);

        var admNo = await _schoolService.EnrollStudentAsync(104);
        Assert.NotNull(admNo);
        Assert.Equal("Enrolled", app.Status);
    }

    // --- Scenario 5: Pay Before & After Enrollment - Partial pre-enrollment blocks ---
    [Fact]
    public async Task PayBeforeAndAfterEnrollment_WhenPreEnrollmentPartiallyPaid_EligibilityIsFalse()
    {
        // Arrange: Total 50,000; PreEnrollment requirement 15,000
        var app = new AdmissionApplication
        {
            Id = 105,
            FirstName = "Rohan",
            LastName = "Varma",
            AppliedClassId = 3,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(105)).ReturnsAsync(app);

        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 5,
            Name = "Grade 3 Composite Fee",
            ClassName = "Grade 3",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 50000m,
            PaymentRequirement = "Pay Before & After Enrollment",
            PreEnrollmentAmount = 15000m
        });
        _context.Classes.Add(new ClassGrade { ClassId = 3, ClassName = "Grade 3" });

        // Paid only 10,000 (5,000 remaining pre-enrollment)
        _context.FeePayments.Add(new FeePayment
        {
            Id = 3,
            StudentId = "105",
            Amount = 10000m,
            Status = "Completed",
            ReceiptNo = "REC-003"
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(105);

        // Assert
        Assert.False(result.IsEligible);
        Assert.Equal(15000m, result.RequiredAmount);
        Assert.Equal(10000m, result.PaidAmount);
        Assert.Equal(5000m, result.OutstandingAmount);

        await Assert.ThrowsAsync<BadRequestException>(() => _schoolService.EnrollStudentAsync(105));
    }

    // --- Scenario 6: Pay Before & After Enrollment - Pre-enrollment fully paid enables enrollment ---
    [Fact]
    public async Task PayBeforeAndAfterEnrollment_WhenPreEnrollmentAmountCleared_EligibilityIsTrue()
    {
        // Arrange: Total 50,000; PreEnrollment requirement 15,000; Remaining 35,000 post-enrollment
        var app = new AdmissionApplication
        {
            Id = 106,
            FirstName = "Ananya",
            LastName = "Pandey",
            AppliedClassId = 3,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(106)).ReturnsAsync(app);
        _schoolRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 6,
            Name = "Grade 3 Composite Fee",
            ClassName = "Grade 3",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 50000m,
            PaymentRequirement = "Pay Before & After Enrollment",
            PreEnrollmentAmount = 15000m
        });
        _context.Classes.Add(new ClassGrade { ClassId = 3, ClassName = "Grade 3" });

        // Paid exactly 15,000 (pre-enrollment requirement satisfied, 35,000 remains post-enrollment)
        _context.FeePayments.Add(new FeePayment
        {
            Id = 4,
            StudentId = "106",
            Amount = 15000m,
            Status = "Completed",
            ReceiptNo = "REC-004"
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(106);

        // Assert
        Assert.True(result.IsEligible);
        Assert.Equal(15000m, result.RequiredAmount);
        Assert.Equal(15000m, result.PaidAmount);
        Assert.Equal(0m, result.OutstandingAmount);

        var admNo = await _schoolService.EnrollStudentAsync(106);
        Assert.NotNull(admNo);
        Assert.Equal("Enrolled", app.Status);
    }

    // --- Scenario 7: Multiple fee structures - Only Pre-Enrollment structures count toward block ---
    [Fact]
    public async Task MultipleStructures_OnlyPreEnrollmentRequirementsBlockEnrollment()
    {
        // Arrange
        var app = new AdmissionApplication
        {
            Id = 107,
            FirstName = "Vikram",
            LastName = "Singhania",
            AppliedClassId = 4,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(107)).ReturnsAsync(app);
        _schoolRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        // Structure 1: Registration/Admission Fee - Pay Before Enrollment (5,000)
        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 7,
            Name = "Admission Fee",
            ClassName = "Grade 4",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 5000m,
            PaymentRequirement = "Pay Before Enrollment",
            PreEnrollmentAmount = 5000m
        });
        // Structure 2: Tuition Fee - Pay After Enrollment (45,000)
        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 8,
            Name = "Tuition Fee",
            ClassName = "Grade 4",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 45000m,
            PaymentRequirement = "Pay After Enrollment",
            PreEnrollmentAmount = 0m
        });
        _context.Classes.Add(new ClassGrade { ClassId = 4, ClassName = "Grade 4" });

        // Paid only 5,000 (covers the Pay Before Enrollment requirement)
        _context.FeePayments.Add(new FeePayment
        {
            Id = 5,
            StudentId = "107",
            Amount = 5000m,
            Status = "Completed",
            ReceiptNo = "REC-005"
        });
        await _context.SaveChangesAsync();

        // Act
        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(107);

        // Assert: Required is only 5,000 (not 50,000), and since 5,000 is paid, applicant is eligible!
        Assert.True(result.IsEligible);
        Assert.Equal(5000m, result.RequiredAmount);
        Assert.Equal(5000m, result.PaidAmount);
        Assert.Equal(0m, result.OutstandingAmount);

        var admNo = await _schoolService.EnrollStudentAsync(107);
        Assert.NotNull(admNo);
        Assert.Equal("Enrolled", app.Status);
    }

    // --- Scenario 8: No fees requiring pre-enrollment payment - Eligible immediately ---
    [Fact]
    public async Task NoPreEnrollmentFees_ApplicantIsEligibleImmediately()
    {
        var app = new AdmissionApplication
        {
            Id = 108,
            FirstName = "Meera",
            LastName = "Nair",
            AppliedClassId = 5,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(108)).ReturnsAsync(app);
        _schoolRepoMock.Setup(r => r.SaveChangesAsync()).Returns(Task.CompletedTask);

        _context.Classes.Add(new ClassGrade { ClassId = 5, ClassName = "Grade 5" });
        await _context.SaveChangesAsync();

        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(108);

        Assert.True(result.IsEligible);
        Assert.Equal(0m, result.RequiredAmount);
        Assert.Equal(0m, result.OutstandingAmount);

        var admNo = await _schoolService.EnrollStudentAsync(108);
        Assert.NotNull(admNo);
        Assert.Equal("Enrolled", app.Status);
    }

    // --- Scenario 9: Cancelled or Reversed payments do NOT satisfy pre-enrollment ---
    [Fact]
    public async Task CancelledOrReversedPayments_DoNotSatisfyRequirement()
    {
        var app = new AdmissionApplication
        {
            Id = 109,
            FirstName = "Kavya",
            LastName = "Iyer",
            AppliedClassId = 1,
            AcademicYear = "2026-27",
            BranchName = "Capital Park",
            Status = "Approved"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(109)).ReturnsAsync(app);

        _context.DynamicFeeStructures.Add(new DynamicFeeStructure
        {
            Id = 9,
            Name = "Grade 1 Fee",
            ClassName = "Grade 1",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Status = "Active",
            TotalAmount = 20000m,
            PaymentRequirement = "Pay Before Enrollment"
        });
        _context.Classes.Add(new ClassGrade { ClassId = 1, ClassName = "Grade 1" });

        // Add cancelled and reversed payments
        _context.FeePayments.Add(new FeePayment
        {
            Id = 6,
            StudentId = "109",
            Amount = 10000m,
            Status = "Cancelled",
            ReceiptNo = "REC-006"
        });
        _context.FeePayments.Add(new FeePayment
        {
            Id = 7,
            StudentId = "109",
            Amount = 10000m,
            Status = "Reversed",
            ReceiptNo = "REC-007"
        });
        await _context.SaveChangesAsync();

        var result = await _schoolService.VerifyPreEnrollmentEligibilityAsync(109);

        Assert.False(result.IsEligible);
        Assert.Equal(20000m, result.RequiredAmount);
        Assert.Equal(0m, result.PaidAmount);
        Assert.Equal(20000m, result.OutstandingAmount);
    }

    // --- Scenario 10: Duplicate Enrollment Rejection ---
    [Fact]
    public async Task EnrollStudentAsync_WhenAlreadyEnrolled_ThrowsBadRequestException()
    {
        var app = new AdmissionApplication
        {
            Id = 110,
            FirstName = "Alok",
            LastName = "Gupta",
            Status = "Enrolled",
            AdmissionNo = "ADM-2026-001"
        };
        _schoolRepoMock.Setup(r => r.GetApplicationByIdAsync(110)).ReturnsAsync(app);

        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _schoolService.EnrollStudentAsync(110));
        Assert.Contains("already enrolled", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    // --- Scenario 11: FinanceService Validation - PreEnrollmentAmount > TotalAmount throws BadRequestException ---
    [Fact]
    public async Task CreateFeeStructure_WhenPreEnrollmentAmountExceedsTotal_ThrowsBadRequestException()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Invalid Fee Structure",
            ClassName = "Grade 6",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Category = "Tuition",
            TotalAmount = 10000m,
            PaymentRequirement = "Pay Before & After Enrollment",
            PreEnrollmentAmount = 15000m // Exceeds 10,000
        };

        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _financeService.CreateDynamicFeeStructureAsync(dto));
        Assert.Contains("cannot be negative or exceed the total fee amount", ex.Message);
    }

    // --- Scenario 12: FinanceService Validation - Negative PreEnrollmentAmount throws BadRequestException ---
    [Fact]
    public async Task CreateFeeStructure_WhenPreEnrollmentAmountIsNegative_ThrowsBadRequestException()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Invalid Negative Fee Structure",
            ClassName = "Grade 6",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Category = "Tuition",
            TotalAmount = 10000m,
            PaymentRequirement = "Pay Before & After Enrollment",
            PreEnrollmentAmount = -500m
        };

        var ex = await Assert.ThrowsAsync<BadRequestException>(() => _financeService.CreateDynamicFeeStructureAsync(dto));
        Assert.Contains("cannot be negative or exceed the total fee amount", ex.Message);
    }

    // --- Scenario 13: Fee structure with Pay After Enrollment defaults PreEnrollmentAmount to 0 ---
    [Fact]
    public async Task CreateFeeStructure_PayAfterEnrollment_DefaultsPreEnrollmentAmountToZero()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Tuition Annual",
            ClassName = "Grade 7",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Category = "Tuition",
            TotalAmount = 40000m,
            PaymentRequirement = "Pay After Enrollment",
            PreEnrollmentAmount = 10000m // should be overridden to 0 for Pay After Enrollment
        };

        _financeRepoMock.Setup(r => r.CreateDynamicFeeStructureAsync(It.IsAny<DynamicFeeStructure>()))
            .ReturnsAsync((DynamicFeeStructure s) =>
            {
                s.Id = 99;
                return s;
            });

        var result = await _financeService.CreateDynamicFeeStructureAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Pay After Enrollment", result.PaymentRequirement);
        Assert.Equal(0m, result.PreEnrollmentAmount);
    }

    // --- Scenario 14: Fee structure with Pay Before Enrollment sets PreEnrollmentAmount to TotalAmount ---
    [Fact]
    public async Task CreateFeeStructure_PayBeforeEnrollment_SetsPreEnrollmentAmountToTotal()
    {
        var dto = new DynamicFeeStructureDto
        {
            Name = "Admission Charge",
            ClassName = "Grade 8",
            AcademicYear = "2026-27",
            Branch = "Capital Park",
            Category = "Tuition",
            TotalAmount = 12000m,
            PaymentRequirement = "Pay Before Enrollment",
            PreEnrollmentAmount = 0m // should be set to total (12,000)
        };

        _financeRepoMock.Setup(r => r.CreateDynamicFeeStructureAsync(It.IsAny<DynamicFeeStructure>()))
            .ReturnsAsync((DynamicFeeStructure s) =>
            {
                s.Id = 100;
                return s;
            });

        var result = await _financeService.CreateDynamicFeeStructureAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("Pay Before Enrollment", result.PaymentRequirement);
        Assert.Equal(12000m, result.PreEnrollmentAmount);
    }
}
