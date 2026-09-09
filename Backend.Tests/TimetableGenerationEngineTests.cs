namespace Backend.Tests;

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations.AcademicManagement;
using SMS.Api.Services.Interfaces;
using Xunit;

public class TimetableGenerationEngineTests
{
    private readonly Mock<ITimetableRepository> _mockRepo;
    private readonly Mock<IAcademicYearService> _mockAcademicYearService;
    private readonly ITimetableIntegrityValidator _validator;
    private readonly TimetableGenerationService _service;

    public TimetableGenerationEngineTests()
    {
        _mockRepo = new Mock<ITimetableRepository>();
        _mockAcademicYearService = new Mock<IAcademicYearService>();
        _mockAcademicYearService.Setup(s => s.GetCurrentAcademicYearAsync()).ReturnsAsync("2026-2027");

        _validator = new TimetableIntegrityValidator(new NullLogger<TimetableIntegrityValidator>());
        _service = new TimetableGenerationService(
            _mockRepo.Object,
            _mockAcademicYearService.Object,
            _validator,
            new NullLogger<TimetableGenerationService>()
        );
    }

    private void SetupStandardEnvironment(
        int classId = 1,
        string className = "Class 9",
        int sectionId = 1,
        string sectionName = "A",
        List<Subject>? subjects = null,
        List<Staff>? staff = null,
        List<ClassSubjectMapping>? mappings = null,
        Dictionary<int, Staff>? subjectTeachers = null)
    {
        var classGrade = new ClassGrade { ClassId = classId, ClassName = className, CampusLocation = "Main Campus" };
        var section = new ClassSection { SectionId = sectionId, ClassId = classId, SectionName = sectionName, RoomNo = "Room 101" };
        var header = new TimetableHeader
        {
            HeaderId = 10,
            ClassId = classId,
            SectionId = sectionId,
            AcademicYear = "2026-2027",
            BranchName = "Main Campus",
            Status = "Draft"
        };

        _mockRepo.Setup(r => r.GetClassByNameAsync(It.IsAny<string>())).ReturnsAsync(classGrade);
        _mockRepo.Setup(r => r.GetClassByIdAsync(classId)).ReturnsAsync(classGrade);
        _mockRepo.Setup(r => r.GetSectionByNameAsync(classId, It.IsAny<string>())).ReturnsAsync(section);
        _mockRepo.Setup(r => r.GetSectionByIdAsync(sectionId)).ReturnsAsync(section);
        _mockRepo.Setup(r => r.GetHeaderByClassSectionAsync(classId, sectionId, It.IsAny<string>())).ReturnsAsync(header);
        _mockRepo.Setup(r => r.CreateHeaderAsync(It.IsAny<TimetableHeader>())).ReturnsAsync(header);

        var subList = subjects ?? new List<Subject>
        {
            new Subject { SubjectId = 101, SubjectName = "Mathematics", SubjectCode = "MATH" },
            new Subject { SubjectId = 102, SubjectName = "Science", SubjectCode = "SCI" },
            new Subject { SubjectId = 103, SubjectName = "English", SubjectCode = "ENG" },
            new Subject { SubjectId = 104, SubjectName = "Social Studies", SubjectCode = "SS" }
        };
        _mockRepo.Setup(r => r.GetAllSubjectsAsync()).ReturnsAsync(subList);

        var staffList = staff ?? new List<Staff>
        {
            new Staff { StaffId = 201, FirstName = "Alan", LastName = "Turing", EmployeeId = "EMP-001" },
            new Staff { StaffId = 202, FirstName = "Marie", LastName = "Curie", EmployeeId = "EMP-002" },
            new Staff { StaffId = 203, FirstName = "William", LastName = "Shakespeare", EmployeeId = "EMP-003" },
            new Staff { StaffId = 204, FirstName = "Albert", LastName = "Einstein", EmployeeId = "EMP-004" }
        };
        _mockRepo.Setup(r => r.GetAllStaffAsync()).ReturnsAsync(staffList);

        var mapList = mappings ?? new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = classId, SubjectId = 101, WeeklyPeriods = 5 },
            new ClassSubjectMapping { ClassId = classId, SubjectId = 102, WeeklyPeriods = 5 },
            new ClassSubjectMapping { ClassId = classId, SubjectId = 103, WeeklyPeriods = 5 },
            new ClassSubjectMapping { ClassId = classId, SubjectId = 104, WeeklyPeriods = 5 }
        };
        _mockRepo.Setup(r => r.GetAllClassSubjectMappingsAsync()).ReturnsAsync(mapList);

        var teacherLookup = subjectTeachers ?? new Dictionary<int, Staff>
        {
            { 101, staffList[0] },
            { 102, staffList[1] },
            { 103, staffList[2] },
            { 104, staffList[3] }
        };

        _mockRepo.Setup(r => r.GetAssignedTeacherForSubjectAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<int>()))
            .Returns((int c, int s, int subId) => Task.FromResult(teacherLookup.ContainsKey(subId) ? teacherLookup[subId] : null));

        _mockRepo.Setup(r => r.GetPeriodSettingsAsync()).ReturnsAsync(new List<PeriodSetting>());
        _mockRepo.Setup(r => r.SavePeriodSettingAsync(It.IsAny<PeriodSetting>()))
            .ReturnsAsync((PeriodSetting p) => { p.PeriodId = new Random().Next(1, 1000); return p; });

        _mockRepo.Setup(r => r.GetSlotsByAcademicYearAsync(It.IsAny<string>()))
            .ReturnsAsync(new List<TimetableSlot>());

        _mockRepo.Setup(r => r.ReplaceSlotsInTransactionAsync(It.IsAny<IEnumerable<int>>(), It.IsAny<IEnumerable<TimetableSlot>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
    }

    [Fact]
    public async Task Test01_FiveSubjectsTimesFiveDays_WeekdaysHaveDistinctSignatures()
    {
        // Arrange: 5 subjects x 5 periods/week = 25 periods.
        // Chemistry, Social Studies, Computer, Physics, Mathematics
        var subjects = new List<Subject>
        {
            new Subject { SubjectId = 101, SubjectName = "Chemistry", SubjectCode = "CHEM" },
            new Subject { SubjectId = 102, SubjectName = "Social Studies", SubjectCode = "SS" },
            new Subject { SubjectId = 103, SubjectName = "Computer", SubjectCode = "CS" },
            new Subject { SubjectId = 104, SubjectName = "Physics", SubjectCode = "PHY" },
            new Subject { SubjectId = 105, SubjectName = "Mathematics", SubjectCode = "MATH" }
        };
        var staff = new List<Staff>
        {
            new Staff { StaffId = 201, FirstName = "T1", LastName = "S", EmployeeId = "E1" },
            new Staff { StaffId = 202, FirstName = "T2", LastName = "S", EmployeeId = "E2" },
            new Staff { StaffId = 203, FirstName = "T3", LastName = "S", EmployeeId = "E3" },
            new Staff { StaffId = 204, FirstName = "T4", LastName = "S", EmployeeId = "E4" },
            new Staff { StaffId = 205, FirstName = "T5", LastName = "S", EmployeeId = "E5" }
        };
        var mappings = subjects.Select(s => new ClassSubjectMapping { ClassId = 1, SubjectId = s.SubjectId, WeeklyPeriods = 5 }).ToList();
        var teachers = subjects.ToDictionary(s => s.SubjectId, s => staff.First(st => st.StaffId == 200 + (s.SubjectId - 100)));

        SetupStandardEnvironment(subjects: subjects, staff: staff, mappings: mappings, subjectTeachers: teachers);

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "12:15 PM", // 5 periods of 45m = 225m
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            Seed = 42
        };

        // Act
        var response = await _service.GenerateTimetableAsync(request);

        // Assert
        Assert.True(response.Success, response.Message);
        Assert.Equal(25, response.Timetable.Count);

        // Daily signatures must vary across weekdays!
        var daySignatures = new Dictionary<string, string>();
        foreach (var day in request.WorkingDays)
        {
            var sig = string.Join("-", response.Timetable
                .Where(s => s.DayOfWeek == day)
                .OrderBy(s => s.StartTime)
                .Select(s => s.SubjectId));
            daySignatures[day] = sig;
        }

        // Distinct daily signatures across weekdays proves the repeated pattern bug is completely eliminated
        var distinctSignatures = daySignatures.Values.Distinct().Count();
        Assert.True(distinctSignatures >= 4, $"Expected diverse daily signatures across weekdays, but got {distinctSignatures} distinct.");
        Assert.NotEqual(daySignatures["Monday"], daySignatures["Tuesday"]);
        Assert.NotEqual(daySignatures["Tuesday"], daySignatures["Wednesday"]);
    }

    [Fact]
    public async Task Test02_SubjectWith5PeriodsAcross5Days_HasOneOccurrencePerWeekday()
    {
        var mappings = new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = 1, SubjectId = 101, WeeklyPeriods = 5 },
            new ClassSubjectMapping { ClassId = 1, SubjectId = 102, WeeklyPeriods = 5 }
        };
        SetupStandardEnvironment(mappings: mappings);

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" }
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success, response.Message);
        var mathSlots = response.Timetable.Where(s => s.SubjectId == 101).ToList();
        Assert.Equal(5, mathSlots.Count);

        foreach (var day in request.WorkingDays)
        {
            Assert.Equal(1, mathSlots.Count(s => s.DayOfWeek == day));
        }
    }

    [Fact]
    public async Task Test03_SubjectWith3PeriodsAcross5Days_SpreadsAcrossWeekWithSpacing()
    {
        var mappings = new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = 1, SubjectId = 101, WeeklyPeriods = 3 },
            new ClassSubjectMapping { ClassId = 1, SubjectId = 102, WeeklyPeriods = 7 }
        };
        SetupStandardEnvironment(mappings: mappings);

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" }
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        var mathSlots = response.Timetable.Where(s => s.SubjectId == 101).ToList();
        Assert.Equal(3, mathSlots.Count);

        var distinctDays = mathSlots.Select(s => s.DayOfWeek).Distinct().Count();
        Assert.Equal(3, distinctDays);
    }

    [Fact]
    public async Task Test04_SubjectWith10PeriodsAcross5Days_TwoPerDay_NoProhibitedConsecutive()
    {
        var mappings = new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = 1, SubjectId = 103, WeeklyPeriods = 10 },
            new ClassSubjectMapping { ClassId = 1, SubjectId = 101, WeeklyPeriods = 5 }
        };
        SetupStandardEnvironment(mappings: mappings);

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "03:45 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            MinPeriodGap = 1
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        var engSlots = response.Timetable.Where(s => s.SubjectId == 103).ToList();
        Assert.Equal(10, engSlots.Count);

        foreach (var day in request.WorkingDays)
        {
            var dayEng = engSlots
                .Where(s => s.DayOfWeek == day)
                .OrderBy(s => DateTime.ParseExact(s.StartTime, new[] { "hh:mm tt", "h:mm tt" }, CultureInfo.InvariantCulture, DateTimeStyles.None))
                .ToList();
            Assert.Equal(2, dayEng.Count);

            // Spacing check: Never consecutive
            var t1 = DateTime.ParseExact(dayEng[0].EndTime, new[] { "hh:mm tt", "h:mm tt" }, CultureInfo.InvariantCulture, DateTimeStyles.None);
            var t2 = DateTime.ParseExact(dayEng[1].StartTime, new[] { "hh:mm tt", "h:mm tt" }, CultureInfo.InvariantCulture, DateTimeStyles.None);
            Assert.True(t2 > t1, "Periods should not be back to back for normal subjects!");
        }
    }

    [Fact]
    public async Task Test05_BreakPeriods_NeverAssignedTeachingSlots()
    {
        SetupStandardEnvironment();
        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:30 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            Breaks = new List<BreakItemDto>
            {
                new BreakItemDto { Name = "Lunch Break", AfterPeriod = 3, DurationMinutes = 45, Type = "Lunch" }
            }
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        var lunchStart = TimeSpan.FromMinutes(10 * 60 + 45); // 10:45 AM
        var lunchEnd = TimeSpan.FromMinutes(11 * 60 + 30);   // 11:30 AM

        foreach (var slot in response.Timetable)
        {
            var start = DateTime.ParseExact(slot.StartTime, new[] { "hh:mm tt", "h:mm tt" }, CultureInfo.InvariantCulture, DateTimeStyles.None).TimeOfDay;
            var end = DateTime.ParseExact(slot.EndTime, new[] { "hh:mm tt", "h:mm tt" }, CultureInfo.InvariantCulture, DateTimeStyles.None).TimeOfDay;

            bool overlaps = start < lunchEnd && end > lunchStart;
            Assert.False(overlaps, $"Slot overlaps with lunch break: {slot.StartTime}-{slot.EndTime}");
        }
    }

    [Fact]
    public async Task Test06_TeacherTeachesTwoSections_NeverDoubleBookedAtSameTime()
    {
        var classGrade = new ClassGrade { ClassId = 1, ClassName = "Class 9", CampusLocation = "Main Campus" };
        var secA = new ClassSection { SectionId = 1, ClassId = 1, SectionName = "A", RoomNo = "Room 101" };
        var secB = new ClassSection { SectionId = 2, ClassId = 1, SectionName = "B", RoomNo = "Room 102" };

        var headerA = new TimetableHeader { HeaderId = 10, ClassId = 1, SectionId = 1, AcademicYear = "2026-2027", BranchName = "Main Campus", Status = "Draft" };
        var headerB = new TimetableHeader { HeaderId = 20, ClassId = 1, SectionId = 2, AcademicYear = "2026-2027", BranchName = "Main Campus", Status = "Draft" };

        _mockRepo.Setup(r => r.GetClassByNameAsync("Class 9")).ReturnsAsync(classGrade);
        _mockRepo.Setup(r => r.GetClassByIdAsync(1)).ReturnsAsync(classGrade);
        _mockRepo.Setup(r => r.GetSectionByNameAsync(1, "A")).ReturnsAsync(secA);
        _mockRepo.Setup(r => r.GetSectionByNameAsync(1, "B")).ReturnsAsync(secB);
        _mockRepo.Setup(r => r.GetSectionByIdAsync(1)).ReturnsAsync(secA);
        _mockRepo.Setup(r => r.GetSectionByIdAsync(2)).ReturnsAsync(secB);
        _mockRepo.Setup(r => r.GetHeaderByClassSectionAsync(1, 1, It.IsAny<string>())).ReturnsAsync(headerA);
        _mockRepo.Setup(r => r.GetHeaderByClassSectionAsync(1, 2, It.IsAny<string>())).ReturnsAsync(headerB);

        var sharedTeacher = new Staff { StaffId = 201, FirstName = "Alan", LastName = "Turing", EmployeeId = "EMP-001" };
        var otherTeacher = new Staff { StaffId = 202, FirstName = "Marie", LastName = "Curie", EmployeeId = "EMP-002" };

        _mockRepo.Setup(r => r.GetAllSubjectsAsync()).ReturnsAsync(new List<Subject>
        {
            new Subject { SubjectId = 101, SubjectName = "Mathematics" },
            new Subject { SubjectId = 102, SubjectName = "Science" }
        });
        _mockRepo.Setup(r => r.GetAllStaffAsync()).ReturnsAsync(new List<Staff> { sharedTeacher, otherTeacher });
        _mockRepo.Setup(r => r.GetAllClassSubjectMappingsAsync()).ReturnsAsync(new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = 1, SubjectId = 101, WeeklyPeriods = 5 },
            new ClassSubjectMapping { ClassId = 1, SubjectId = 102, WeeklyPeriods = 5 }
        });

        _mockRepo.Setup(r => r.GetAssignedTeacherForSubjectAsync(1, It.IsAny<int>(), 101)).ReturnsAsync(sharedTeacher);
        _mockRepo.Setup(r => r.GetAssignedTeacherForSubjectAsync(1, It.IsAny<int>(), 102)).ReturnsAsync(otherTeacher);
        _mockRepo.Setup(r => r.GetPeriodSettingsAsync()).ReturnsAsync(new List<PeriodSetting>());
        _mockRepo.Setup(r => r.GetSlotsByAcademicYearAsync(It.IsAny<string>())).ReturnsAsync(new List<TimetableSlot>());

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A", "Class 9-B" }
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        var sharedSlots = response.Timetable.Where(s => s.TeacherId == 201).ToList();
        var clashes = sharedSlots
            .GroupBy(s => $"{s.DayOfWeek}_{s.StartTime}")
            .Where(g => g.Count() > 1)
            .ToList();

        Assert.Empty(clashes);
    }

    [Fact]
    public async Task Test07_ImpossibleSchedule_ReturnsNoSolution_NoPartialDbSave()
    {
        var mappings = new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = 1, SubjectId = 101, WeeklyPeriods = 25 }
        };
        SetupStandardEnvironment(mappings: mappings);

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "10:00 AM", // 2 periods/day = 10 weekly
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" }
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.False(response.Success);
        Assert.Equal(TimetableGenerationStatus.NO_SOLUTION, response.Status);

        _mockRepo.Verify(r => r.ReplaceSlotsInTransactionAsync(
            It.IsAny<IEnumerable<int>>(),
            It.IsAny<IEnumerable<TimetableSlot>>(),
            It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Test08_SameInputPlusSameSeed_ProducesExactSameTimetable()
    {
        SetupStandardEnvironment();
        var request1 = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            Seed = 12345
        };

        var request2 = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            Seed = 12345
        };

        var res1 = await _service.GenerateTimetableAsync(request1);
        var res2 = await _service.GenerateTimetableAsync(request2);

        Assert.True(res1.Success);
        Assert.True(res2.Success);
        Assert.Equal(res1.Timetable.Count, res2.Timetable.Count);

        for (int i = 0; i < res1.Timetable.Count; i++)
        {
            Assert.Equal(res1.Timetable[i].DayOfWeek, res2.Timetable[i].DayOfWeek);
            Assert.Equal(res1.Timetable[i].StartTime, res2.Timetable[i].StartTime);
            Assert.Equal(res1.Timetable[i].SubjectId, res2.Timetable[i].SubjectId);
        }
    }

    [Fact]
    public async Task Test09_SameInputPlusDifferentSeed_ProducesDifferentValidTimetable()
    {
        SetupStandardEnvironment();
        var request1 = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            Seed = 11111
        };

        var request2 = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            Seed = 99999
        };

        var res1 = await _service.GenerateTimetableAsync(request1);
        var res2 = await _service.GenerateTimetableAsync(request2);

        Assert.True(res1.Success);
        Assert.True(res2.Success);

        bool hasDifference = false;
        for (int i = 0; i < Math.Min(res1.Timetable.Count, res2.Timetable.Count); i++)
        {
            if (res1.Timetable[i].SubjectId != res2.Timetable[i].SubjectId)
            {
                hasDifference = true;
                break;
            }
        }
        Assert.True(hasDifference, "Expected different valid schedules with different seeds!");
    }

    [Fact]
    public async Task Test10_OnlyOneValidTimetableExists_ReturnsTimetableEvenIfDailyPatternRepeats()
    {
        var subjects = new List<Subject>
        {
            new Subject { SubjectId = 101, SubjectName = "SingleSubject", SubjectCode = "SNG" }
        };
        var mappings = new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = 1, SubjectId = 101, WeeklyPeriods = 5 }
        };
        var staff = new List<Staff>
        {
            new Staff { StaffId = 201, FirstName = "Sole", LastName = "Teacher", EmployeeId = "EMP-001" }
        };
        var teachers = new Dictionary<int, Staff> { { 101, staff[0] } };

        SetupStandardEnvironment(subjects: subjects, mappings: mappings, staff: staff, subjectTeachers: teachers);

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "09:15 AM", // 1 period/day
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            Seed = 123
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        Assert.Equal(5, response.Timetable.Count);
    }

    [Fact]
    public async Task Test11_LabRequiresDoublePeriod_ScheduledInContiguousAdjacentSlots()
    {
        var subjects = new List<Subject>
        {
            new Subject { SubjectId = 101, SubjectName = "Physics Lab", SubjectCode = "PHY-LAB" },
            new Subject { SubjectId = 102, SubjectName = "Mathematics", SubjectCode = "MATH" }
        };
        var mappings = new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = 1, SubjectId = 101, WeeklyPeriods = 2 },
            new ClassSubjectMapping { ClassId = 1, SubjectId = 102, WeeklyPeriods = 8 }
        };
        var staff = new List<Staff>
        {
            new Staff { StaffId = 201, FirstName = "Richard", LastName = "Feynman", EmployeeId = "EMP-001" },
            new Staff { StaffId = 202, FirstName = "Alan", LastName = "Turing", EmployeeId = "EMP-002" }
        };
        var teachers = new Dictionary<int, Staff> { { 101, staff[0] }, { 102, staff[1] } };

        SetupStandardEnvironment(subjects: subjects, mappings: mappings, staff: staff, subjectTeachers: teachers);

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            AllowConsecutiveForLabs = true
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        var labSlots = response.Timetable.Where(s => s.SubjectId == 101).ToList();
        Assert.Equal(2, labSlots.Count);
        Assert.Equal(labSlots[0].DayOfWeek, labSlots[1].DayOfWeek);

        var orderedLab = labSlots.OrderBy(s => DateTime.ParseExact(s.StartTime, new[] { "hh:mm tt", "h:mm tt" }, CultureInfo.InvariantCulture, DateTimeStyles.None)).ToList();
        var end0 = DateTime.ParseExact(orderedLab[0].EndTime, new[] { "hh:mm tt", "h:mm tt" }, CultureInfo.InvariantCulture, DateTimeStyles.None);
        var start1 = DateTime.ParseExact(orderedLab[1].StartTime, new[] { "hh:mm tt", "h:mm tt" }, CultureInfo.InvariantCulture, DateTimeStyles.None);
        Assert.Equal(end0, start1);
    }

    [Fact]
    public async Task Test12_LockedTimetableSlot_NeverOverwrittenOrChanged()
    {
        SetupStandardEnvironment();
        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" },
            LockedSlots = new List<LockedSlotDto>
            {
                new LockedSlotDto
                {
                    ClassId = 1,
                    SectionId = 1,
                    DayOfWeek = "Monday",
                    StartTime = "08:30 AM",
                    EndTime = "09:15 AM",
                    SubjectId = 104,
                    TeacherId = 204
                }
            }
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        var mondayFirstSlot = response.Timetable
            .First(s => s.DayOfWeek == "Monday" && s.StartTime == "08:30 AM");
        Assert.Equal(104, mondayFirstSlot.SubjectId);
    }

    [Fact]
    public async Task Test13_RoomConflict_TwoSectionsCannotShareRoomAtSameTime()
    {
        var classGrade = new ClassGrade { ClassId = 1, ClassName = "Class 9", CampusLocation = "Main Campus" };
        var secA = new ClassSection { SectionId = 1, ClassId = 1, SectionName = "A", RoomNo = "Room 101" };
        var secB = new ClassSection { SectionId = 2, ClassId = 1, SectionName = "B", RoomNo = "Room 101" };

        var headerA = new TimetableHeader { HeaderId = 10, ClassId = 1, SectionId = 1, AcademicYear = "2026-2027", BranchName = "Main Campus", Status = "Draft" };
        var headerB = new TimetableHeader { HeaderId = 20, ClassId = 1, SectionId = 2, AcademicYear = "2026-2027", BranchName = "Main Campus", Status = "Draft" };

        _mockRepo.Setup(r => r.GetClassByNameAsync("Class 9")).ReturnsAsync(classGrade);
        _mockRepo.Setup(r => r.GetClassByIdAsync(1)).ReturnsAsync(classGrade);
        _mockRepo.Setup(r => r.GetSectionByNameAsync(1, "A")).ReturnsAsync(secA);
        _mockRepo.Setup(r => r.GetSectionByNameAsync(1, "B")).ReturnsAsync(secB);
        _mockRepo.Setup(r => r.GetSectionByIdAsync(1)).ReturnsAsync(secA);
        _mockRepo.Setup(r => r.GetSectionByIdAsync(2)).ReturnsAsync(secB);
        _mockRepo.Setup(r => r.GetHeaderByClassSectionAsync(1, 1, It.IsAny<string>())).ReturnsAsync(headerA);
        _mockRepo.Setup(r => r.GetHeaderByClassSectionAsync(1, 2, It.IsAny<string>())).ReturnsAsync(headerB);

        var staffA = new Staff { StaffId = 201, FirstName = "Alan", LastName = "Turing" };
        var staffB = new Staff { StaffId = 202, FirstName = "Marie", LastName = "Curie" };

        _mockRepo.Setup(r => r.GetAllSubjectsAsync()).ReturnsAsync(new List<Subject>
        {
            new Subject { SubjectId = 101, SubjectName = "Mathematics" },
            new Subject { SubjectId = 102, SubjectName = "Science" }
        });
        _mockRepo.Setup(r => r.GetAllStaffAsync()).ReturnsAsync(new List<Staff> { staffA, staffB });
        _mockRepo.Setup(r => r.GetAllClassSubjectMappingsAsync()).ReturnsAsync(new List<ClassSubjectMapping>
        {
            new ClassSubjectMapping { ClassId = 1, SubjectId = 101, WeeklyPeriods = 5 },
            new ClassSubjectMapping { ClassId = 1, SubjectId = 102, WeeklyPeriods = 5 }
        });
        _mockRepo.Setup(r => r.GetAssignedTeacherForSubjectAsync(1, 1, 101)).ReturnsAsync(staffA);
        _mockRepo.Setup(r => r.GetAssignedTeacherForSubjectAsync(1, 1, 102)).ReturnsAsync(staffB);
        _mockRepo.Setup(r => r.GetAssignedTeacherForSubjectAsync(1, 2, 101)).ReturnsAsync(staffA);
        _mockRepo.Setup(r => r.GetAssignedTeacherForSubjectAsync(1, 2, 102)).ReturnsAsync(staffB);
        _mockRepo.Setup(r => r.GetPeriodSettingsAsync()).ReturnsAsync(new List<PeriodSetting>());
        _mockRepo.Setup(r => r.GetSlotsByAcademicYearAsync(It.IsAny<string>())).ReturnsAsync(new List<TimetableSlot>());

        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "11:30 AM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A", "Class 9-B" }
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        var roomClashes = response.Timetable
            .Where(s => !string.IsNullOrWhiteSpace(s.RoomNo))
            .GroupBy(s => $"{s.DayOfWeek}_{s.StartTime}")
            .Where(g => g.Count() > 1)
            .ToList();

        Assert.Empty(roomClashes);
    }

    [Fact]
    public async Task Test14_GenerateThenValidate_PassesIndependentValidatorWithZeroHardViolations()
    {
        SetupStandardEnvironment();
        var request = new GenerateTimetableRequestDto
        {
            AcademicYear = "2026-2027",
            SchoolStartTime = "08:30 AM",
            SchoolEndTime = "02:15 PM",
            PeriodDurationMinutes = 45,
            WorkingDays = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday" },
            SelectedClassSections = new List<string> { "Class 9-A" }
        };

        var response = await _service.GenerateTimetableAsync(request);

        Assert.True(response.Success);
        Assert.Equal(0, response.Summary?.HardViolations);
        Assert.Equal(0, response.ConsecutiveSubjectViolations);
        Assert.Equal(0, response.TeacherConflicts);
        Assert.Equal(0, response.SectionConflicts);
        Assert.Equal(0, response.QuotaViolations);
        Assert.True(response.QualityScore >= 90.0);
    }
}
