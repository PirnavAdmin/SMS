namespace Backend.Tests.Services;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Services.Implementations.Dashboard;
using Xunit;

public class DashboardServiceTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public async Task GetDashboardSummaryAsync_ReturnsAccurateMetricsAndReconcilesAdmissions()
    {
        using var context = CreateDbContext();

        // Seed Branches
        var mainBranch = new Branch { BranchId = 1, BranchName = "Main Campus" };
        var northBranch = new Branch { BranchId = 2, BranchName = "North Branch" };
        context.Branches.AddRange(mainBranch, northBranch);

        // Seed Academic Year
        var ay = new AcademicYear { AcademicYearId = 1, AcademicYearName = "2026-2027", IsDeleted = false };
        context.AcademicYears.Add(ay);

        // Seed Classes
        var class1 = new ClassGrade { ClassId = 1, ClassName = "Class 1", CampusLocation = "Main Campus", Status = "Active" };
        var class2 = new ClassGrade { ClassId = 2, ClassName = "Class 2", CampusLocation = "Main Campus", Status = "Active" };
        var classNorth = new ClassGrade { ClassId = 3, ClassName = "Class 10", CampusLocation = "North Branch", Status = "Active" };
        context.Classes.AddRange(class1, class2, classNorth);

        // Seed Students (Main Campus: 3 Active, 1 Deleted, 1 Inactive)
        context.Students.AddRange(
            new Student { StudentId = 1, AdmissionNumber = "REG-01", RollNumber = "1", StudentName = "Alice", BranchId = 1, AcademicYearId = 1, ClassId = 1, Status = "Active", IsDeleted = false },
            new Student { StudentId = 2, AdmissionNumber = "REG-02", RollNumber = "2", StudentName = "Bob", BranchId = 1, AcademicYearId = 1, ClassId = 1, Status = "Active", IsDeleted = false },
            new Student { StudentId = 3, AdmissionNumber = "REG-03", RollNumber = "3", StudentName = "Charlie", BranchId = 1, AcademicYearId = 1, ClassId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 4, AdmissionNumber = "REG-04", RollNumber = "4", StudentName = "Deleted Student", BranchId = 1, AcademicYearId = 1, ClassId = 1, Status = "Active", IsDeleted = true },
            new Student { StudentId = 5, AdmissionNumber = "REG-05", RollNumber = "5", StudentName = "Inactive Student", BranchId = 1, AcademicYearId = 1, ClassId = 1, Status = "Inactive", IsDeleted = false },
            new Student { StudentId = 6, AdmissionNumber = "REG-06", RollNumber = "6", StudentName = "North Student", BranchId = 2, AcademicYearId = 1, ClassId = 3, Status = "Active", IsDeleted = false }
        );

        // Seed Staff (Main Campus: 2 Teaching, 1 Non-Teaching, 1 Inactive)
        context.Staff.AddRange(
            new Staff { StaffId = 1, FirstName = "Teacher", LastName = "One", BranchName = "Main Campus", Department = "Teaching", IsActive = true },
            new Staff { StaffId = 2, FirstName = "Teacher", LastName = "Two", BranchName = "Main Campus", EmployeeCategory = "Teaching Staff", IsActive = true },
            new Staff { StaffId = 3, FirstName = "Admin", LastName = "Staff", BranchName = "Main Campus", Department = "Administration", IsActive = true },
            new Staff { StaffId = 4, FirstName = "Former", LastName = "Staff", BranchName = "Main Campus", Department = "Teaching", IsActive = false },
            new Staff { StaffId = 5, FirstName = "North", LastName = "Teacher", BranchName = "North Branch", Department = "Teaching", IsActive = true }
        );

        // Seed Admissions (Main Campus: 2 Pending, 3 Enrolled, 1 Rejected, 1 Deleted)
        context.AdmissionApplications.AddRange(
            new AdmissionApplication { Id = 1, RegistrationNo = "ADM-1", BranchName = "Main Campus", Status = "Pending", IsDeleted = false },
            new AdmissionApplication { Id = 2, RegistrationNo = "ADM-2", BranchName = "Main Campus", Status = "Pending", IsDeleted = false },
            new AdmissionApplication { Id = 3, RegistrationNo = "ADM-3", BranchName = "Main Campus", Status = "Enrolled", IsDeleted = false },
            new AdmissionApplication { Id = 4, RegistrationNo = "ADM-4", BranchName = "Main Campus", Status = "Enrolled", IsDeleted = false },
            new AdmissionApplication { Id = 5, RegistrationNo = "ADM-5", BranchName = "Main Campus", Status = "Enrolled", IsDeleted = false },
            new AdmissionApplication { Id = 6, RegistrationNo = "ADM-6", BranchName = "Main Campus", Status = "Rejected", IsDeleted = false },
            new AdmissionApplication { Id = 7, RegistrationNo = "ADM-7", BranchName = "Main Campus", Status = "Deleted", IsDeleted = true }
        );

        await context.SaveChangesAsync();

        var service = new DashboardService(context);

        // Act for Main Campus
        var summary = await service.GetDashboardSummaryAsync("Main Campus", 1);

        // Assert
        Assert.Equal(3, summary.TotalStudents);
        Assert.Equal(2, summary.TeachingStaff);
        Assert.Equal(1, summary.NonTeachingStaff);
        Assert.Equal(2, summary.TotalClasses);

        // Admissions Invariant Check
        Assert.Equal(6, summary.TotalAdmissions);
        Assert.Equal(2, summary.PendingAdmissions);
        Assert.Equal(3, summary.EnrolledAdmissions);
        Assert.Equal(1, summary.RejectedAdmissions);
        Assert.Equal(0, summary.OtherAdmissions);
        Assert.Equal(summary.TotalAdmissions, summary.PendingAdmissions + summary.EnrolledAdmissions + summary.RejectedAdmissions + summary.OtherAdmissions);

        // Class Wise Strength Check
        Assert.Equal(2, summary.ClassWiseStrength.Count);
        Assert.Contains(summary.ClassWiseStrength, c => c.ClassName == "Class 1" && c.StudentCount == 2);
        Assert.Contains(summary.ClassWiseStrength, c => c.ClassName == "Class 2" && c.StudentCount == 1);
    }
}
