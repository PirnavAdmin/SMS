namespace Backend.Tests.Services;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Implementations;
using SMS.Api.Services.Implementations;
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

        // Seed Period Settings
        var p1 = new PeriodSetting { PeriodId = 1, PeriodName = "Period 1", StartTime = new TimeSpan(8, 30, 0), EndTime = new TimeSpan(9, 15, 0), PeriodType = "Teaching Period", DisplayOrder = 1 };
        var p2 = new PeriodSetting { PeriodId = 2, PeriodName = "Period 2", StartTime = new TimeSpan(9, 15, 0), EndTime = new TimeSpan(10, 0, 0), PeriodType = "Teaching Period", DisplayOrder = 2 };
        await context.PeriodSettings.AddRangeAsync(p1, p2);

        await context.SaveChangesAsync();
        return context;
    }

    [Fact]
    public async Task GetPeriodSettings_ReturnsActivePeriods()
    {
        var context = await GetInMemoryDbContextAsync();
        var repo = new TimetableRepository(context);
        var service = new TimetableService(repo, context);

        var periods = await service.GetPeriodSettingsAsync();

        Assert.NotNull(periods);
        Assert.Equal(2, periods.Count);
        Assert.Equal("Period 1", periods[0].PeriodName);
    }

    [Fact]
    public async Task SavePeriodSetting_InvalidTiming_ThrowsPeriodOverlapException()
    {
        var context = await GetInMemoryDbContextAsync();
        var repo = new TimetableRepository(context);
        var service = new TimetableService(repo, context);

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
        var repo = new TimetableRepository(context);
        var service = new TimetableService(repo, context);

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
        var repo = new TimetableRepository(context);
        var service = new TimetableService(repo, context);

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
        var repo = new TimetableRepository(context);
        var service = new TimetableService(repo, context);

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
        var repo = new TimetableRepository(context);
        var service = new TimetableService(repo, context);

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
}
