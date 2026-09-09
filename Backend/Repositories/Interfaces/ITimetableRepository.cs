namespace SMS.Api.Repositories.Interfaces;

using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;

public interface ITimetableRepository
{
    // Period Settings
    Task<List<PeriodSetting>> GetPeriodSettingsAsync();
    Task<PeriodSetting?> GetPeriodSettingByIdAsync(int periodId);
    Task<PeriodSetting> SavePeriodSettingAsync(PeriodSetting period);
    Task<bool> DeletePeriodSettingAsync(int periodId);
    Task<bool> HasOverlappingPeriodSettingAsync(TimeSpan startTime, TimeSpan endTime, int? excludePeriodId = null);
    Task<List<PeriodSetting>> SyncPeriodSettingsAsync(List<PeriodSetting> periods);

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

    // Class & Section Lookups
    Task<ClassGrade?> GetClassByIdAsync(int classId);
    Task<ClassGrade?> GetClassByNameAsync(string className);
    Task<ClassGrade?> GetDefaultClassAsync();
    Task<ClassSection?> GetSectionByIdAsync(int sectionId);
    Task<ClassSection?> GetSectionByNameAsync(int classId, string sectionName);
    Task<ClassSection?> GetDefaultSectionForClassAsync(int classId);

    // Subject Lookups
    Task<Subject?> GetSubjectByIdAsync(int subjectId);
    Task<Subject?> GetSubjectByNameAsync(string subjectName);
    Task<Subject> SaveSubjectAsync(Subject subject);
    Task<List<Subject>> GetAllSubjectsAsync();

    // Staff Lookups
    Task<Staff?> GetStaffByIdAsync(int staffId);
    Task<Staff?> GetStaffByNameAsync(string firstName, string lastName);
    Task<List<Staff>> GetAllStaffAsync();

    // Class Subject Mappings
    Task<ClassSubjectMapping?> GetClassSubjectMappingAsync(int classId, int subjectId);
    Task<List<ClassSubjectMapping>> GetClassSubjectMappingsByClassAsync(int classId);
    Task<List<ClassSubjectMapping>> GetAllClassSubjectMappingsAsync();

    // Batch & Regeneration Operations
    Task<List<TimetableSlot>> GetSlotsByAcademicYearAsync(string academicYear);
    Task DeleteSlotsByHeaderIdsAsync(IEnumerable<int> headerIds);
    Task SaveSlotsBatchAsync(IEnumerable<TimetableSlot> slots);
}
