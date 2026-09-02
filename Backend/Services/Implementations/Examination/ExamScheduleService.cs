namespace SMS.Api.Services.Implementations.Examination;

using SMS.Api.Dtos.Examination;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using SMS.Api.Services.Interfaces.Examination;
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
        var classes = await _repository.GetClassNamesAsync();
        var sections = await _repository.GetSectionNamesAsync();
        var invigilators = await _repository.GetInvigilatorNamesAsync();
        var rooms = await _repository.GetRoomNamesAsync();

        return new ScheduleOptionsDto
        {
            Classes = classes,
            Sections = sections,
            Rooms = rooms,
            Invigilators = invigilators
        };
    }

    public async Task<ClassSectionScheduleResponseDto> GetTimetableForClassSectionAsync(int? examId, string className, string sectionName)
    {
        var slots = await _repository.GetTimetableSlotsAsync(examId, className, sectionName);

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
                ExamId = request.ExamId,
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

        return await _repository.SaveTimetableSlotsAsync(request.ExamId, request.ClassName, request.SectionName, slots);
    }

    public async Task<SchedulePreviewResponseDto> GetSchedulePreviewAsync(int? examId, string? academicYear, string? className, string? sectionName)
    {
        var allSlots = await _repository.GetAllTimetableSlotsAsync() ?? new List<NewExamTimetableSlot>();

        var query = allSlots.AsEnumerable();

        if (examId.HasValue && examId.Value > 0)
        {
            query = query.Where(s => s.ExamId == examId.Value);
        }

        if (!string.IsNullOrWhiteSpace(className) && !className.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(s => (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(sectionName) && !sectionName.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            var searchSec = sectionName.Replace("Section ", "", StringComparison.OrdinalIgnoreCase).Trim();
            query = query.Where(s => (s.SectionName ?? "").Replace("Section ", "", StringComparison.OrdinalIgnoreCase).Trim().Equals(searchSec, StringComparison.OrdinalIgnoreCase));
        }

        var cards = query.GroupBy(s => new { ClassName = s.ClassName ?? "", SectionName = s.SectionName ?? "" })
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

    public async Task<bool> ClearTimetableAsync(int? examId, string className, string sectionName)
    {
        return await _repository.ClearTimetableAsync(examId, className, sectionName);
    }
}

