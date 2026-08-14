namespace SMS.Api.Repositories.Interfaces;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Models;

public interface ITimetableRepository
{
    // Period Settings
    Task<List<PeriodSetting>> GetPeriodSettingsAsync();
    Task<PeriodSetting?> GetPeriodSettingByIdAsync(int periodId);
    Task<PeriodSetting> SavePeriodSettingAsync(PeriodSetting period);
    Task<bool> DeletePeriodSettingAsync(int periodId);
    Task<bool> HasOverlappingPeriodSettingAsync(TimeSpan startTime, TimeSpan endTime, int? excludePeriodId = null);

    // Timetable Header & Slots
    Task<TimetableHeader?> GetHeaderByClassSectionAsync(int classId, int sectionId, string academicYear);
    Task<TimetableHeader> CreateHeaderAsync(TimetableHeader header);
    Task<TimetableHeader> UpdateHeaderStatusAsync(int headerId, string status);
    Task<List<TimetableSlot>> GetSlotsByHeaderIdAsync(int headerId);
    Task<TimetableSlot?> GetSlotByIdAsync(int slotId);
    Task<TimetableSlot> SaveSlotAsync(TimetableSlot slot);
    Task<bool> DeleteSlotAsync(int slotId);

    // Conflict Validation Queries
    Task<TimetableSlot?> CheckTeacherConflictAsync(int teacherId, string dayOfWeek, TimeSpan startTime, TimeSpan endTime, int? excludeSlotId = null);
    Task<TimetableSlot?> CheckRoomConflictAsync(string roomNo, string dayOfWeek, TimeSpan startTime, TimeSpan endTime, int? excludeSlotId = null);

    // Auto-Resolve Teacher for Class+Subject
    Task<Staff?> GetAssignedTeacherForSubjectAsync(int classId, int sectionId, int subjectId);

    // Timetables Views
    Task<List<TimetableSlot>> GetTeacherTimetableSlotsAsync(int teacherId, string academicYear);
    Task<List<TimetableSlot>> GetStudentTimetableSlotsAsync(int classId, int sectionId, string academicYear);

    // Copy Class Timetable
    Task<bool> CopyTimetableSlotsAsync(int sourceHeaderId, int targetHeaderId);
}
