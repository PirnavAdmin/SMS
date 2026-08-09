namespace SMS.Api.Services.Implementations.ExaminationNew;

using SMS.Api.Dtos.ExaminationNew;
using SMS.Api.Models.ExaminationNew;
using SMS.Api.Repositories.Interfaces.ExaminationNew;
using SMS.Api.Services.Interfaces.ExaminationNew;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamScheduleService : IExamScheduleService
{
    private readonly IExamScheduleRepository _repository;

    public ExamScheduleService(IExamScheduleRepository repository)
    {
        _repository = repository;
    }

    public Task<ScheduleOptionsDto> GetScheduleOptionsAsync()
    {
        return Task.FromResult(new ScheduleOptionsDto());
    }

    public async Task<ClassSectionScheduleResponseDto> GetTimetableForClassSectionAsync(string className, string sectionName)
    {
        var slots = await _repository.GetTimetableSlotsAsync(className, sectionName);

        var dtoList = slots.Select(s => new TimetableSlotItemDto
        {
            SlotId = s.SlotId,
            SubjectCode = s.SubjectCode,
            SubjectName = s.SubjectName,
            TotalMarks = s.TotalMarks,
            ExamDate = s.ExamDate.ToString("yyyy-MM-dd"),
            TimeSlot = s.TimeSlot,
            Duration = s.Duration,
            RoomHall = s.RoomHall,
            InvigilatorFaculty = s.InvigilatorFaculty
        }).ToList();

        return new ClassSectionScheduleResponseDto
        {
            ClassName = className,
            SectionName = sectionName,
            Timetable = dtoList
        };
    }

    public async Task<bool> SaveTimetableAsync(SaveTimetableRequestDto request)
    {
        var slots = request.Timetable.Select(t => new NewExamTimetableSlot
        {
            ExamId = request.ExamId,
            ClassName = request.ClassName,
            SectionName = request.SectionName,
            SubjectCode = t.SubjectCode,
            SubjectName = t.SubjectName,
            TotalMarks = t.TotalMarks > 0 ? t.TotalMarks : 100,
            ExamDate = DateTime.TryParse(t.ExamDate, out var d) ? d : DateTime.UtcNow,
            TimeSlot = string.IsNullOrWhiteSpace(t.TimeSlot) ? "09:00 - 12:00" : t.TimeSlot,
            Duration = string.IsNullOrWhiteSpace(t.Duration) ? "3h" : t.Duration,
            RoomHall = string.IsNullOrWhiteSpace(t.RoomHall) ? "TBA" : t.RoomHall,
            InvigilatorFaculty = string.IsNullOrWhiteSpace(t.InvigilatorFaculty) ? "Unassigned" : t.InvigilatorFaculty
        }).ToList();

        return await _repository.SaveTimetableSlotsAsync(request.ClassName, request.SectionName, slots);
    }

    public async Task<SchedulePreviewResponseDto> GetSchedulePreviewAsync(string? academicYear, string? className, string? sectionName)
    {
        var allSlots = await _repository.GetAllTimetableSlotsAsync();

        var sections = new List<(string Class, string Section)>
        {
            ("Class 1", "Section A"),
            ("Class 1", "Section B"),
            ("Class 1", "Section C")
        };

        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("All", StringComparison.OrdinalIgnoreCase) && !className.Contains("All"))
        {
            sections = sections.Where(s => s.Class.Equals(className, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        if (!string.IsNullOrWhiteSpace(sectionName) && !sectionName.Equals("All", StringComparison.OrdinalIgnoreCase) && !sectionName.Contains("All"))
        {
            sections = sections.Where(s => s.Section.Equals(sectionName, StringComparison.OrdinalIgnoreCase)).ToList();
        }

        var cards = new List<SectionSchedulePreviewCardDto>();

        foreach (var sec in sections)
        {
            var secSlots = allSlots.Where(s => s.ClassName.Equals(sec.Class, StringComparison.OrdinalIgnoreCase) && s.SectionName.Equals(sec.Section, StringComparison.OrdinalIgnoreCase)).ToList();

            cards.Add(new SectionSchedulePreviewCardDto
            {
                ClassName = sec.Class,
                SectionName = sec.Section,
                Timetable = secSlots.Select(s => new TimetableSlotItemDto
                {
                    SlotId = s.SlotId,
                    SubjectCode = s.SubjectCode,
                    SubjectName = s.SubjectName,
                    TotalMarks = s.TotalMarks,
                    ExamDate = s.ExamDate.ToString("yyyy-MM-dd"),
                    TimeSlot = s.TimeSlot,
                    Duration = s.Duration,
                    RoomHall = s.RoomHall,
                    InvigilatorFaculty = s.InvigilatorFaculty
                }).ToList()
            });
        }

        return new SchedulePreviewResponseDto
        {
            AcademicYear = academicYear ?? "2026-27",
            FilterView = "View: All Examination Classes — All Sections",
            SectionSchedules = cards
        };
    }
}
