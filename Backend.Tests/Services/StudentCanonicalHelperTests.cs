namespace Backend.Tests.Services;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Implementations;
using SMS.Api.Services.Implementations.Dashboard;
using Backend.Helpers;
using Xunit;

public class StudentCanonicalHelperTests
{
    private AppDbContext CreateDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new AppDbContext(options);
    }

    [Fact]
    public void DeduplicateStudents_RemovesDuplicateRecordsAndPrefersAdmPrefixAndEarlierId()
    {
        var students = new List<Student>
        {
            // Student 1: 3 records (Set 1: ADM-, Set 2: ADM-, Set 3: REG-)
            new Student { StudentId = 293, AdmissionNumber = "ADM-2026-0117", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 304, AdmissionNumber = "ADM-2026-0106", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 314, AdmissionNumber = "REG-1106", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },

            // Student 2: 1 record
            new Student { StudentId = 290, AdmissionNumber = "ADM-2026-0088", StudentName = "Simran Gowda", FatherMobile = "9876501099", ClassId = 21, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },

            // Student 3: 2 records (ADM- and REG-)
            new Student { StudentId = 303, AdmissionNumber = "ADM-2026-0127", StudentName = "vishnu reddy", FatherMobile = "7013596058", ClassId = 14, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 325, AdmissionNumber = "REG-1117", StudentName = "vishnu reddy", FatherMobile = "7013596058", ClassId = 14, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false }
        };

        var result = StudentCanonicalHelper.DeduplicateStudents(students);

        // 6 total rows -> exactly 3 unique students
        Assert.Equal(3, result.Count);

        // Ritvik Modi should keep ID 293 (ADM-2026-0117)
        var ritvik = result.FirstOrDefault(s => s.StudentName == "Ritvik Modi");
        Assert.NotNull(ritvik);
        Assert.Equal(293, ritvik.StudentId);
        Assert.Equal("ADM-2026-0117", ritvik.AdmissionNumber);

        // Vishnu Reddy should keep ID 303 (ADM-2026-0127)
        var vishnu = result.FirstOrDefault(s => s.StudentName == "vishnu reddy");
        Assert.NotNull(vishnu);
        Assert.Equal(303, vishnu.StudentId);
        Assert.Equal("ADM-2026-0127", vishnu.AdmissionNumber);

        // Simran Gowda is preserved
        Assert.Contains(result, s => s.StudentId == 290 && s.StudentName == "Simran Gowda");
    }

    [Fact]
    public async Task GetAllStudentsAsync_DeduplicatesAcrossRepositoryAndReturnsCanonicalTotal()
    {
        using var context = CreateDbContext();

        var branch = new Branch { BranchId = 6, BranchName = "Madhapur Branch" };
        var ay = new AcademicYear { AcademicYearId = 2, AcademicYearName = "2026-2027", IsDeleted = false };
        var cls = new ClassGrade { ClassId = 21, ClassName = "Class 10", CampusLocation = "Madhapur Branch", Status = "Active" };

        var sec = new ClassSection { SectionId = 1, ClassId = 21, SectionName = "A" };

        context.Branches.Add(branch);
        context.AcademicYears.Add(ay);
        context.Classes.Add(cls);
        context.ClassSections.Add(sec);

        // 3 duplicates for Ritvik Modi
        context.Students.AddRange(
            new Student { StudentId = 293, AdmissionNumber = "ADM-2026-0117", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, SectionId = 1, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 304, AdmissionNumber = "ADM-2026-0106", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, SectionId = 1, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 314, AdmissionNumber = "REG-1106", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, SectionId = 1, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 290, AdmissionNumber = "ADM-2026-0088", StudentName = "Simran Gowda", FatherMobile = "9876501099", ClassId = 21, SectionId = 1, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false }
        );

        await context.SaveChangesAsync();

        var repo = new SchoolRepository(context);
        var result = await repo.GetAllStudentsAsync(new StudentFilterDto
        {
            BranchId = 6,
            AcademicYearId = 2,
            PageNumber = 1,
            PageSize = 100
        });

        // 4 raw students -> 2 unique students
        Assert.Equal(2, result.TotalRecords);
        Assert.Equal(2, result.Items.Count());
        Assert.Contains(result.Items, s => s.StudentId == 293 && s.AdmissionNumber == "ADM-2026-0117");
        Assert.Contains(result.Items, s => s.StudentId == 290 && s.AdmissionNumber == "ADM-2026-0088");
        Assert.DoesNotContain(result.Items, s => s.StudentId == 304);
        Assert.DoesNotContain(result.Items, s => s.StudentId == 314);
    }

    [Fact]
    public async Task DashboardService_ReturnsCanonicalTotalStudentsAndClassStrengths()
    {
        using var context = CreateDbContext();

        var branch = new Branch { BranchId = 6, BranchName = "Madhapur Branch" };
        var ay = new AcademicYear { AcademicYearId = 2, AcademicYearName = "2026-2027", IsDeleted = false };
        var cls10 = new ClassGrade { ClassId = 21, ClassName = "Class 10", CampusLocation = "Madhapur Branch", Status = "Active" };
        var cls1 = new ClassGrade { ClassId = 14, ClassName = "Class 1", CampusLocation = "Madhapur Branch", Status = "Active" };

        context.Branches.Add(branch);
        context.AcademicYears.Add(ay);
        context.Classes.AddRange(cls10, cls1);

        // Seed 3 records for Ritvik in Class 10, 2 records for Vishnu in Class 1, and 1 for Simran in Class 10
        context.Students.AddRange(
            new Student { StudentId = 293, AdmissionNumber = "ADM-2026-0117", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 304, AdmissionNumber = "ADM-2026-0106", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 314, AdmissionNumber = "REG-1106", StudentName = "Ritvik Modi", FatherMobile = "9876501000", ClassId = 21, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 290, AdmissionNumber = "ADM-2026-0088", StudentName = "Simran Gowda", FatherMobile = "9876501099", ClassId = 21, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 303, AdmissionNumber = "ADM-2026-0127", StudentName = "vishnu reddy", FatherMobile = "7013596058", ClassId = 14, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false },
            new Student { StudentId = 325, AdmissionNumber = "REG-1117", StudentName = "vishnu reddy", FatherMobile = "7013596058", ClassId = 14, BranchId = 6, AcademicYearId = 2, Status = "Active", IsDeleted = false }
        );

        await context.SaveChangesAsync();

        var service = new DashboardService(context);
        var summary = await service.GetDashboardSummaryAsync("Madhapur Branch", 2);

        // 6 raw rows -> exactly 3 canonical students
        Assert.Equal(3, summary.TotalStudents);

        // ClassWiseStrength sums to 3 (Class 10: 2, Class 1: 1)
        var class10Strength = summary.ClassWiseStrength.FirstOrDefault(c => c.ClassName == "Class 10");
        var class1Strength = summary.ClassWiseStrength.FirstOrDefault(c => c.ClassName == "Class 1");

        Assert.NotNull(class10Strength);
        Assert.Equal(2, class10Strength.StudentCount);

        Assert.NotNull(class1Strength);
        Assert.Equal(1, class1Strength.StudentCount);

        Assert.Equal(3, summary.ClassWiseStrength.Sum(c => c.StudentCount));
    }
}
