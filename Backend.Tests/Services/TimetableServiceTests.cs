namespace Backend.Tests.Services;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Implementations;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations;
using SMS.Api.Services.Implementations.AcademicManagement;
using SMS.Api.Services.Interfaces;
using Xunit;

public class TimetableServiceTests
{
    private async Task<AppDbContext> GetInMemoryDbContextAsync()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);
        await context.Database.EnsureCreatedAsync();

        // Seed Active Academic Year
        var ay = new AcademicYear { AcademicYearId = 1, AcademicYearName = "2026-2027", IsActive = true, IsCurrent = true };
        await context.AcademicYears.AddAsync(ay);

        // Seed Class
        var class9 = new ClassGrade { ClassId = 1, ClassName = "Class 9" };
        var class10 = new ClassGrade { ClassId = 2, ClassName = "Class 10" };
        await context.Classes.AddRangeAsync(class9, class10);

        // Seed Sections
        var secA = new ClassSection { SectionId = 1, ClassId = 1, SectionName = "A" };
        var secB = new ClassSection { SectionId = 2, ClassId = 1, SectionName = "B" };
        var sec10A = new ClassSection { SectionId = 3, ClassId = 2, SectionName = "A" };
        await context.ClassSections.AddRangeAsync(secA, secB, sec10A);

        // Seed Department & Subjects
        var dept = new Department { DepartmentId = 1, DepartmentName = "Mathematics", DepartmentCode = "MATH" };
        await context.Departments.AddAsync(dept);

        var mathSub = new Subject { SubjectId = 1, SubjectName = "Mathematics", SubjectCode = "MTH-101", DepartmentId = 1 };
        var sciSub = new Subject { SubjectId = 2, SubjectName = "Physics", SubjectCode = "PHY-101", DepartmentId = 1 };
        await context.Subjects.AddRangeAsync(mathSub, sciSub);

        // Seed Staff / Teachers
        var teacherSarah = new Staff { StaffId = 1, EmployeeId = "EMP001", FirstName = "Sarah", LastName = "Jenkins", Email = "sarah@school.com", Designation = "Teacher", Department = "1" };
        var teacherJohn = new Staff { StaffId = 2, EmployeeId = "EMP002", FirstName = "John", LastName = "Doe", Email = "john@school.com", Designation = "Teacher", Department = "1" };
        await context.Staff.AddRangeAsync(teacherSarah, teacherJohn);

        // Seed Class Subject Mappings
        var mapping1 = new ClassSubjectMapping { Id = 1, ClassId = 1, SubjectId = 1, WeeklyPeriods = 5 };
        var mapping2 = new ClassSubjectMapping { Id = 2, ClassId = 1, SubjectId = 2, WeeklyPeriods = 5 };
        var mapping3 = new ClassSubjectMapping { Id = 3, ClassId = 2, SubjectId = 2, WeeklyPeriods = 5 };
        await context.ClassSubjectMappings.AddRangeAsync(mapping1, mapping2, mapping3);

        // Seed Teacher Subject Assignments
        var tsa1 = new TeacherSubjectAssignment { AssignmentId = 1, StaffId = 1, ClassId = 1, SectionId = 1, SubjectId = 1 };
        var tsa2 = new TeacherSubjectAssignment { AssignmentId = 2, StaffId = 2, ClassId = 1, SectionId = 1, SubjectId = 2 };
        var tsa3 = new TeacherSubjectAssignment { AssignmentId = 3, StaffId = 2, ClassId = 2, SectionId = 3, SubjectId = 2 };
        await context.TeacherSubjectAssignments.AddRangeAsync(tsa1, tsa2, tsa3);

        // Seed Period Settings
        var p1 = new PeriodSetting { PeriodId = 1, PeriodName = "Period 1", StartTime = new TimeSpan(8, 30, 0), EndTime = new TimeSpan(9, 15, 0), PeriodType = "Teaching Period", DisplayOrder = 1 };
        var p2 = new PeriodSetting { PeriodId = 2, PeriodName = "Period 2", StartTime = new TimeSpan(9, 15, 0), EndTime = new TimeSpan(10, 0, 0), PeriodType = "Teaching Period", DisplayOrder = 2 };
        await context.PeriodSettings.AddRangeAsync(p1, p2);

        await context.SaveChangesAsync();
        return context;
    }

    private (TimetableService service, AppDbContext context, ITimetableRepository repo, ITimetableValidationService validationService, ITimetableGenerationService generationService) CreateService(AppDbContext context)
    {
        var repo = new TimetableRepository(context);
        var academicYearService = new AcademicYearService(context);
        var validationService = new TimetableValidationService(repo, NullLogger<TimetableValidationService>.Instance);
        var generationService = new TimetableGenerationService(repo, academicYearService, NullLogger<TimetableGenerationService>.Instance);
        var logger = NullLogger<TimetableService>.Instance;

        var service = new TimetableService(repo, academicYearService, validationService, generationService, logger);
        return (service, context, repo, validationService, generationService);
    }

    [Fact]
    public async Task GetPeriodSettings_ReturnsActivePeriods()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        var periods = await service.GetPeriodSettingsAsync();

        Assert.NotNull(periods);
        Assert.Equal(2, periods.Count);
        Assert.Equal("Period 1", periods[0].PeriodName);
    }

    [Fact]
    public async Task SavePeriodSetting_InvalidTiming_ThrowsPeriodOverlapException()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        var dto = new SavePeriodSettingDto
        {
            PeriodName = "Bad Period",
            StartTime = "10:00 AM",
            EndTime = "09:00 AM" // End time earlier than start time
        };

        await Assert.ThrowsAsync<PeriodOverlapException>(() => service.SavePeriodSettingAsync(dto));
    }

    [Fact]
    public async Task SaveTimetableSlot_TeacherConflict_ThrowsTimetableConflictException()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        // Save Slot 1 for Sarah Jenkins in Class 9 Sec A
        var dto1 = new SaveTimetableSlotDto
        {
            ClassId = 1,
            SectionId = 1,
            AcademicYear = "2026-2027",
            DayOfWeek = "Monday",
            StartTime = "08:30 AM",
            EndTime = "09:15 AM",
            SubjectId = 1,
            TeacherId = 1, // Sarah
            RoomNo = "Room 101"
        };
        await service.SaveTimetableSlotAsync(dto1);

        // Try to assign Sarah Jenkins to Class 10 Sec A at the EXACT SAME TIME on Monday
        var dto2 = new SaveTimetableSlotDto
        {
            ClassId = 2,
            SectionId = 3,
            AcademicYear = "2026-2027",
            DayOfWeek = "Monday",
            StartTime = "08:30 AM",
            EndTime = "09:15 AM",
            SubjectId = 2,
            TeacherId = 1, // Sarah again (double-booking!)
            RoomNo = "Room 102"
        };

        var ex = await Assert.ThrowsAsync<TimetableConflictException>(() => service.SaveTimetableSlotAsync(dto2));
        Assert.Contains("Teacher Overlap Conflict", ex.Message);
    }

    [Fact]
    public async Task SaveTimetableSlot_RoomConflict_ThrowsTimetableConflictException()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        // Slot 1 in Room 101
        var dto1 = new SaveTimetableSlotDto
        {
            ClassId = 1,
            SectionId = 1,
            AcademicYear = "2026-2027",
            DayOfWeek = "Monday",
            StartTime = "08:30 AM",
            EndTime = "09:15 AM",
            SubjectId = 1,
            TeacherId = 1, // Sarah
            RoomNo = "Room 101"
        };
        await service.SaveTimetableSlotAsync(dto1);

        // Slot 2 in Room 101 with John Doe for Class 10 Sec A
        var dto2 = new SaveTimetableSlotDto
        {
            ClassId = 2,
            SectionId = 3,
            AcademicYear = "2026-2027",
            DayOfWeek = "Monday",
            StartTime = "08:30 AM",
            EndTime = "09:15 AM",
            SubjectId = 2,
            TeacherId = 2, // John
            RoomNo = "Room 101" // Room double-booking!
        };

        var ex = await Assert.ThrowsAsync<TimetableConflictException>(() => service.SaveTimetableSlotAsync(dto2));
        Assert.Contains("Room Overlap Conflict", ex.Message);
    }

    [Fact]
    public async Task PublishTimetable_UpdatesStatusToPublished()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        var pubDto = new PublishTimetableDto
        {
            ClassId = 1,
            SectionId = 1,
            AcademicYear = "2026-2027",
            Status = "Published"
        };

        var result = await service.PublishTimetableAsync(pubDto);

        Assert.NotNull(result);
        Assert.Equal("Published", result.Status);
    }

    [Fact]
    public async Task CopyTimetable_DuplicatesSlotsToTargetSection()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        // Slot 1 in Class 9 Sec A
        var dto1 = new SaveTimetableSlotDto
        {
            ClassId = 1,
            SectionId = 1,
            AcademicYear = "2026-2027",
            DayOfWeek = "Monday",
            StartTime = "08:30 AM",
            EndTime = "09:15 AM",
            SubjectId = 1,
            TeacherId = 1,
            RoomNo = "Room 101"
        };
        await service.SaveTimetableSlotAsync(dto1);

        // Copy Class 9 Sec A -> Class 9 Sec B
        var copyDto = new CopyTimetableDto
        {
            SourceClassId = 1,
            SourceSectionId = 1,
            TargetClassId = 1,
            TargetSectionId = 2,
            AcademicYear = "2026-2027"
        };

        var targetGrid = await service.CopyTimetableAsync(copyDto);

        Assert.NotNull(targetGrid);
        Assert.Single(targetGrid.Slots);
        Assert.Equal("Monday", targetGrid.Slots[0].DayOfWeek);
    }

    [Fact]
    public async Task ValidateTimetableAsync_NonExistentClass_ThrowsNotFoundException()
    {
        var context = await GetInMemoryDbContextAsync();
        var (_, _, _, validationService, _) = CreateService(context);

        await Assert.ThrowsAsync<NotFoundException>(() => validationService.ValidateTimetableAsync(999, 1, "2026-2027"));
    }

    [Fact]
    public async Task ValidateTimetableAsync_NonExistentSection_ThrowsNotFoundException()
    {
        var context = await GetInMemoryDbContextAsync();
        var (_, _, _, validationService, _) = CreateService(context);

        await Assert.ThrowsAsync<NotFoundException>(() => validationService.ValidateTimetableAsync(1, 999, "2026-2027"));
    }

    [Fact]
    public async Task GetStudentTimetableAsync_NonExistentClass_ThrowsNotFoundException()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetStudentTimetableAsync(999, 1, "2026-2027"));
    }

    [Fact]
    public async Task GetStudentTimetableAsync_NonExistentSection_ThrowsNotFoundException()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        await Assert.ThrowsAsync<NotFoundException>(() => service.GetStudentTimetableAsync(1, 999, "2026-2027"));
    }

    [Fact]
    public async Task GetTeacherTimetableAsync_NullTeacherNames_DoesNotThrowNullReferenceException()
    {
        var context = await GetInMemoryDbContextAsync();
        var staff = new Staff { StaffId = 50, FirstName = null, LastName = null, EmployeeId = "EMP050" };
        await context.Staff.AddAsync(staff);
        await context.SaveChangesAsync();

        var (service, _, _, _, _) = CreateService(context);
        var result = await service.GetTeacherTimetableAsync(50, "2026-2027");

        Assert.NotNull(result);
        Assert.Equal(50, result.TeacherId);
        Assert.NotNull(result.TeacherName);
    }

    [Fact]
    public async Task SaveTimetableSlotAsync_ExceedingWeeklyLimit_ThrowsTimetableValidationException()
    {
        var context = await GetInMemoryDbContextAsync();
        var mapping = await context.ClassSubjectMappings.FirstAsync(m => m.ClassId == 1 && m.SubjectId == 1);
        mapping.WeeklyPeriods = 1;
        await context.SaveChangesAsync();

        var (service, _, _, _, _) = CreateService(context);

        // Slot 1 (Monday)
        await service.SaveTimetableSlotAsync(new SaveTimetableSlotDto
        {
            ClassId = 1,
            SectionId = 1,
            AcademicYear = "2026-2027",
            DayOfWeek = "Monday",
            StartTime = "08:30 AM",
            EndTime = "09:15 AM",
            SubjectId = 1,
            TeacherId = 1
        });

        // Slot 2 (Tuesday) - exceeds weekly limit of 1
        var ex = await Assert.ThrowsAsync<TimetableValidationException>(() => service.SaveTimetableSlotAsync(new SaveTimetableSlotDto
        {
            ClassId = 1,
            SectionId = 1,
            AcademicYear = "2026-2027",
            DayOfWeek = "Tuesday",
            StartTime = "08:30 AM",
            EndTime = "09:15 AM",
            SubjectId = 1,
            TeacherId = 1
        }));

        Assert.Contains("Weekly period limit exceeded", ex.Message);
    }

    [Fact]
    public async Task GenerateTimetableAsync_NoMappedSubjects_HandlesGracefullyWithoutDivideByZero()
    {
        var context = await GetInMemoryDbContextAsync();
        var classEmpty = new ClassGrade { ClassId = 10, ClassName = "Class Empty" };
        var secEmpty = new ClassSection { SectionId = 10, ClassId = 10, SectionName = "A" };
        await context.Classes.AddAsync(classEmpty);
        await context.ClassSections.AddAsync(secEmpty);
        await context.SaveChangesAsync();

        var (service, _, _, _, _) = CreateService(context);

        var req = new GenerateTimetableRequestDto
        {
            SelectedClassSections = new List<string> { "Class Empty-A" },
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:00 AM",
            SchoolEndTime = "02:00 PM",
            PeriodDurationMinutes = 45
        };

        // Must not throw DivideByZeroException; skips empty class gracefully
        var result = await service.GenerateTimetableAsync(req);
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    [Fact]
    public async Task GenerateTimetableAsync_ValidClass_GeneratesSlotsSuccessfully()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        var req = new GenerateTimetableRequestDto
        {
            SelectedClassSections = new List<string> { "Class 9-A" },
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:00 AM",
            SchoolEndTime = "12:00 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday" },
            Breaks = new List<BreakItemDto>
            {
                new BreakItemDto { Name = "Short Break", DurationMinutes = 15, AfterPeriod = 2, Type = "Break" }
            }
        };

        var result = await service.GenerateTimetableAsync(req);

        Assert.NotNull(result);
        Assert.NotEmpty(result);
        Assert.All(result, slot => Assert.NotNull(slot.SubjectName));
    }

    [Fact]
    public async Task SyncPeriodSettingsAsync_UpdatesAndSynchronizesPeriodsCorrectly()
    {
        var context = await GetInMemoryDbContextAsync();
        var (service, _, _, _, _) = CreateService(context);

        var newPeriods = new List<SavePeriodSettingDto>
        {
            new SavePeriodSettingDto { PeriodName = "Period 1", StartTime = "08:30 AM", EndTime = "09:15 AM", DisplayOrder = 1, PeriodType = "Teaching Period" },
            new SavePeriodSettingDto { PeriodName = "Period 2", StartTime = "09:15 AM", EndTime = "10:00 AM", DisplayOrder = 2, PeriodType = "Teaching Period" },
            new SavePeriodSettingDto { PeriodName = "Morning Break", StartTime = "10:00 AM", EndTime = "10:15 AM", DisplayOrder = 3, PeriodType = "Break" }
        };

        var synced = await service.SyncPeriodSettingsAsync(newPeriods);

        Assert.NotNull(synced);
        Assert.Equal(3, synced.Count);
        Assert.Equal("08:30 AM", synced[0].StartTime);
        Assert.Equal("09:15 AM", synced[0].EndTime);
        Assert.Equal("Morning Break", synced[2].PeriodName);
    }
}
