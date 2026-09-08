namespace SMS.Api.Services.Implementations.AcademicManagement;

using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

public class TimetableValidationService : ITimetableValidationService
{
    private readonly ITimetableRepository _timetableRepository;
    private readonly ILogger<TimetableValidationService> _logger;

    public TimetableValidationService(ITimetableRepository timetableRepository, ILogger<TimetableValidationService> logger)
    {
        _timetableRepository = timetableRepository;
        _logger = logger;
    }

    private static string FormatTime(TimeSpan span)
    {
        var dummyDate = DateTime.Today.Add(span);
        return dummyDate.ToString("hh:mm tt", CultureInfo.InvariantCulture);
    }

    public async Task ValidateWeeklySubjectLimitAsync(int headerId, int classId, int subjectId, string subjectName, int? excludeSlotId = null)
    {
        var mapping = await _timetableRepository.GetClassSubjectMappingAsync(classId, subjectId);
        if (mapping != null && mapping.WeeklyPeriods > 0)
        {
            var headerSlots = await _timetableRepository.GetSlotsByHeaderIdAsync(headerId);
            int currentAssigned = headerSlots.Count(s => s.SubjectId == subjectId && (!excludeSlotId.HasValue || s.SlotId != excludeSlotId.Value));

            if (currentAssigned >= mapping.WeeklyPeriods)
            {
                _logger.LogWarning("Weekly subject limit exceeded: Subject '{SubjectName}' in Class ID {ClassId} has {Current} assigned vs {Max} allowed.",
                    subjectName, classId, currentAssigned, mapping.WeeklyPeriods);

                throw new TimetableValidationException(
                    $"Weekly period limit exceeded: Subject '{subjectName}' is configured for a maximum of {mapping.WeeklyPeriods} periods per week for this class (current: {currentAssigned}).");
            }
        }
    }

    public async Task ValidateSlotConflictsAsync(int headerId, int teacherId, string teacherName, string? roomNo, string dayOfWeek, TimeSpan startTime, TimeSpan endTime, int? excludeSlotId = null)
    {
        // 1. Teacher Conflict
        if (teacherId > 0)
        {
            var teacherConflict = await _timetableRepository.CheckTeacherConflictAsync(teacherId, dayOfWeek, startTime, endTime, excludeSlotId);
            if (teacherConflict != null && teacherConflict.HeaderId != headerId)
            {
                var otherClass = teacherConflict.Header?.ClassGrade?.ClassName ?? "another class";
                var otherSec = teacherConflict.Header?.ClassSection?.SectionName ?? "";
                _logger.LogWarning("Teacher conflict detected for '{TeacherName}' on {Day} ({Start}-{End}) with {OtherClass}-{OtherSec}",
                    teacherName, dayOfWeek, startTime, endTime, otherClass, otherSec);

                throw new TimetableConflictException(
                    $"Teacher Overlap Conflict: Teacher '{teacherName}' is already assigned to {otherClass} - Section {otherSec} on {dayOfWeek} ({FormatTime(teacherConflict.StartTime)} - {FormatTime(teacherConflict.EndTime)}).");
            }
        }

        // 2. Room Conflict
        if (!string.IsNullOrWhiteSpace(roomNo))
        {
            var roomConflict = await _timetableRepository.CheckRoomConflictAsync(roomNo, dayOfWeek, startTime, endTime, excludeSlotId);
            if (roomConflict != null && roomConflict.HeaderId != headerId)
            {
                var otherClass = roomConflict.Header?.ClassGrade?.ClassName ?? "another class";
                var otherSec = roomConflict.Header?.ClassSection?.SectionName ?? "";
                _logger.LogWarning("Room conflict detected for room '{RoomNo}' on {Day} ({Start}-{End}) with {OtherClass}-{OtherSec}",
                    roomNo, dayOfWeek, startTime, endTime, otherClass, otherSec);

                throw new TimetableConflictException(
                    $"Room Overlap Conflict: '{roomNo}' is already occupied by {otherClass} - Section {otherSec} on {dayOfWeek} ({FormatTime(roomConflict.StartTime)} - {FormatTime(roomConflict.EndTime)}).");
            }
        }
    }

    public async Task<TimetableValidationResultDto> ValidateTimetableAsync(int classId, int sectionId, string academicYear)
    {
        var result = new TimetableValidationResultDto { Valid = true };

        var classGrade = await _timetableRepository.GetClassByIdAsync(classId)
            ?? throw new NotFoundException($"Class with ID {classId} not found.");

        var section = await _timetableRepository.GetSectionByIdAsync(sectionId)
            ?? throw new NotFoundException($"Section with ID {sectionId} not found.");

        var header = await _timetableRepository.GetHeaderByClassSectionAsync(classId, sectionId, academicYear);
        if (header == null) return result;

        var slots = await _timetableRepository.GetSlotsByHeaderIdAsync(header.HeaderId);
        if (!slots.Any()) return result;

        var allSubjects = await _timetableRepository.GetAllSubjectsAsync();
        var subjectsDict = allSubjects.ToDictionary(s => s.SubjectId);

        var allStaff = await _timetableRepository.GetAllStaffAsync();
        var staffDict = allStaff.ToDictionary(s => s.StaffId);

        var classSecName = $"{classGrade.ClassName}-{section.SectionName}";

        // 1. Check teacher double booking & room double booking
        foreach (var slot in slots)
        {
            if (slot.TeacherId > 0)
            {
                var teacherConflict = await _timetableRepository.CheckTeacherConflictAsync(
                    slot.TeacherId, slot.DayOfWeek, slot.StartTime, slot.EndTime, slot.SlotId);

                if (teacherConflict != null && teacherConflict.HeaderId != header.HeaderId)
                {
                    result.Valid = false;
                    staffDict.TryGetValue(slot.TeacherId, out var teacher);
                    var tName = teacher?.DisplayName ?? $"{teacher?.FirstName ?? ""} {teacher?.LastName ?? ""}".Trim();
                    if (string.IsNullOrEmpty(tName)) tName = "Teacher";
                    var otherClass = teacherConflict.Header?.ClassGrade?.ClassName ?? "";
                    var otherSec = teacherConflict.Header?.ClassSection?.SectionName ?? "";

                    result.Conflicts.Add(new TimetableConflictDto
                    {
                        Type = nameof(TimetableConflictType.TeacherConflict),
                        Message = $"Teacher '{tName}' has an overlap on {slot.DayOfWeek} ({FormatTime(slot.StartTime)}-{FormatTime(slot.EndTime)}) with {otherClass}-{otherSec}.",
                        TeacherId = slot.TeacherId,
                        TeacherName = tName,
                        Day = slot.DayOfWeek,
                        TimeSlot = $"{FormatTime(slot.StartTime)}-{FormatTime(slot.EndTime)}"
                    });
                }
            }

            if (!string.IsNullOrWhiteSpace(slot.RoomNo))
            {
                var roomConflict = await _timetableRepository.CheckRoomConflictAsync(
                    slot.RoomNo, slot.DayOfWeek, slot.StartTime, slot.EndTime, slot.SlotId);

                if (roomConflict != null && roomConflict.HeaderId != header.HeaderId)
                {
                    result.Valid = false;
                    var otherClass = roomConflict.Header?.ClassGrade?.ClassName ?? "";
                    var otherSec = roomConflict.Header?.ClassSection?.SectionName ?? "";

                    result.Conflicts.Add(new TimetableConflictDto
                    {
                        Type = nameof(TimetableConflictType.RoomConflict),
                        Message = $"Room '{slot.RoomNo}' is double-booked on {slot.DayOfWeek} ({FormatTime(slot.StartTime)}-{FormatTime(slot.EndTime)}) with {otherClass}-{otherSec}.",
                        RoomNo = slot.RoomNo,
                        Day = slot.DayOfWeek,
                        TimeSlot = $"{FormatTime(slot.StartTime)}-{FormatTime(slot.EndTime)}"
                    });
                }
            }
        }

        // 2. Check weekly subject quotas
        var mappings = await _timetableRepository.GetClassSubjectMappingsByClassAsync(classId);
        var subjectSlotCounts = slots.GroupBy(s => s.SubjectId).ToDictionary(g => g.Key, g => g.Count());

        foreach (var mapping in mappings)
        {
            subjectSlotCounts.TryGetValue(mapping.SubjectId, out int assignedCount);
            subjectsDict.TryGetValue(mapping.SubjectId, out var sub);
            var subName = sub?.SubjectName ?? $"Subject #{mapping.SubjectId}";

            if (assignedCount > mapping.WeeklyPeriods)
            {
                result.Valid = false;
                result.Conflicts.Add(new TimetableConflictDto
                {
                    Type = nameof(TimetableConflictType.WeeklyLimit),
                    Message = $"{subName} in {classSecName} has {assignedCount} periods assigned vs max {mapping.WeeklyPeriods} allowed per week."
                });
            }
        }

        return result;
    }
}
