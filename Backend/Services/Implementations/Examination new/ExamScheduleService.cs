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

    public async Task<ScheduleOptionsDto> GetScheduleOptionsAsync()
    {
        return new ScheduleOptionsDto
        {
            Classes = new List<string> { "Class 1", "Class 2", "Class 8", "Class 9", "Class 10", "Class 11", "Class 12" },
            Sections = new List<string> { "Section A", "Section B", "Section C" },
            Rooms = new List<string> { "TBA", "Room 101", "Room 102", "Auditorium Hall", "Science Lab" },
            Invigilators = new List<string> { "Unassigned", "Sarah Jenkins", "Robert Davis", "Emily Watson", "Michael Brown" }
        };
    }

    public async Task<ClassSectionScheduleResponseDto> GetTimetableForClassSectionAsync(string className, string sectionName)
    {
        var slots = await _repository.GetTimetableSlotsAsync(className, sectionName);

        return new ClassSectionScheduleResponseDto
        {
            ClassName = className,
            SectionName = sectionName,
            Timetable = slots.Select(s => new TimetableSlotItemDto
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
        };
    }

    public async Task<bool> SaveTimetableAsync(SaveTimetableRequestDto request)
    {
        var slots = request.Timetable.Select(s =>
        {
            DateTime.TryParse(s.ExamDate, out var parsedDate);
            return new NewExamTimetableSlot
            {
                SlotId = s.SlotId,
                ClassName = request.ClassName,
                SectionName = request.SectionName,
                SubjectCode = s.SubjectCode,
                SubjectName = s.SubjectName,
                TotalMarks = s.TotalMarks,
                ExamDate = parsedDate != DateTime.MinValue ? parsedDate : DateTime.UtcNow,
                TimeSlot = s.TimeSlot,
                Duration = s.Duration,
                RoomHall = s.RoomHall,
                InvigilatorFaculty = s.InvigilatorFaculty
            };
        }).ToList();

        return await _repository.SaveTimetableSlotsAsync(request.ClassName, request.SectionName, slots);
    }

    public async Task<SchedulePreviewResponseDto> GetSchedulePreviewAsync(string? academicYear, string? className, string? sectionName)
    {
        var allSlots = await _repository.GetAllTimetableSlotsAsync();

        var query = allSlots.AsEnumerable();
        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(sectionName) && !sectionName.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => s.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase));
        }

        var cards = query.GroupBy(s => new { s.ClassName, s.SectionName })
            .Select(g => new SectionSchedulePreviewCardDto
            {
                ClassName = g.Key.ClassName,
                SectionName = g.Key.SectionName,
                Timetable = g.Select(s => new TimetableSlotItemDto
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
            }).ToList();

        return new SchedulePreviewResponseDto
        {
            AcademicYear = academicYear ?? "2026-27",
            FilterView = $"View: {className ?? "All"} — {sectionName ?? "All"}",
            SectionSchedules = cards
        };
    }

    public async Task<bool> DeleteSlotAsync(int slotId)
    {
        return await _repository.DeleteSlotAsync(slotId);
    }

    public async Task<bool> ClearTimetableAsync(string className, string sectionName)
    {
        return await _repository.ClearTimetableAsync(className, sectionName);
    }
}
