namespace SMS.Api.Repositories.Implementations;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Interfaces;

public class TimetableRepository : ITimetableRepository
{
    private readonly AppDbContext _context;

    public TimetableRepository(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // PERIOD SETTINGS
    // =========================================================

    public async Task<List<PeriodSetting>> GetPeriodSettingsAsync()
    {
        return await _context.PeriodSettings
            .Where(p => !p.IsDeleted && p.IsActive)
            .OrderBy(p => p.DisplayOrder)
            .ThenBy(p => p.StartTime)
            .ToListAsync();
    }

    public async Task<PeriodSetting?> GetPeriodSettingByIdAsync(int periodId)
    {
        return await _context.PeriodSettings
            .FirstOrDefaultAsync(p => p.PeriodId == periodId && !p.IsDeleted);
    }

    public async Task<PeriodSetting> SavePeriodSettingAsync(PeriodSetting period)
    {
        if (period.PeriodId == 0)
        {
            await _context.PeriodSettings.AddAsync(period);
        }
        else
        {
            _context.PeriodSettings.Update(period);
        }

        await _context.SaveChangesAsync();
        return period;
    }

    public async Task<bool> DeletePeriodSettingAsync(int periodId)
    {
        var period = await GetPeriodSettingByIdAsync(periodId);
        if (period == null) return false;

        period.IsDeleted = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> HasOverlappingPeriodSettingAsync(TimeSpan startTime, TimeSpan endTime, int? excludePeriodId = null)
    {
        return await _context.PeriodSettings
            .Where(p => !p.IsDeleted && p.IsActive)
            .Where(p => excludePeriodId == null || p.PeriodId != excludePeriodId.Value)
            .AnyAsync(p =>
                (startTime >= p.StartTime && startTime < p.EndTime) ||
                (endTime > p.StartTime && endTime <= p.EndTime) ||
                (startTime <= p.StartTime && endTime >= p.EndTime));
    }

    // =========================================================
    // TIMETABLE HEADER & SLOTS
    // =========================================================

    public async Task<TimetableHeader?> GetHeaderByClassSectionAsync(int classId, int sectionId, string academicYear)
    {
        return await _context.TimetableHeaders
            .Include(h => h.ClassGrade)
            .Include(h => h.ClassSection)
            .FirstOrDefaultAsync(h =>
                h.ClassId == classId &&
                h.SectionId == sectionId &&
                h.AcademicYear == academicYear);
    }

    public async Task<TimetableHeader> CreateHeaderAsync(TimetableHeader header)
    {
        await _context.TimetableHeaders.AddAsync(header);
        await _context.SaveChangesAsync();
        return header;
    }

    public async Task<TimetableHeader> UpdateHeaderStatusAsync(int headerId, string status)
    {
        var header = await _context.TimetableHeaders.FindAsync(headerId);
        if (header != null)
        {
            header.Status = status;
            header.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }
        return header!;
    }

    public async Task<List<TimetableSlot>> GetSlotsByHeaderIdAsync(int headerId)
    {
        return await _context.TimetableSlots
            .Include(s => s.Period)
            .Include(s => s.Subject)
            .Include(s => s.Teacher)
            .Where(s => s.HeaderId == headerId)
            .ToListAsync();
    }

    public async Task<TimetableSlot?> GetSlotByIdAsync(int slotId)
    {
        return await _context.TimetableSlots
            .Include(s => s.Header)
            .Include(s => s.Period)
            .Include(s => s.Subject)
            .Include(s => s.Teacher)
            .FirstOrDefaultAsync(s => s.SlotId == slotId);
    }

    public async Task<TimetableSlot> SaveSlotAsync(TimetableSlot slot)
    {
        if (slot.SlotId == 0)
        {
            await _context.TimetableSlots.AddAsync(slot);
        }
        else
        {
            _context.TimetableSlots.Update(slot);
        }

        await _context.SaveChangesAsync();

        // Reload relationships
        return (await GetSlotByIdAsync(slot.SlotId))!;
    }

    public async Task<bool> DeleteSlotAsync(int slotId)
    {
        var slot = await _context.TimetableSlots.FindAsync(slotId);
        if (slot == null) return false;

        _context.TimetableSlots.Remove(slot);
        await _context.SaveChangesAsync();
        return true;
    }

    // =========================================================
    // CONFLICT VALIDATION QUERIES
    // =========================================================

    public async Task<TimetableSlot?> CheckTeacherConflictAsync(int teacherId, string dayOfWeek, TimeSpan startTime, TimeSpan endTime, int? excludeSlotId = null)
    {
        return await _context.TimetableSlots
            .Include(s => s.Header)
            .ThenInclude(h => h!.ClassGrade)
            .Include(s => s.Header)
            .ThenInclude(h => h!.ClassSection)
            .Include(s => s.Teacher)
            .Where(s => s.TeacherId == teacherId && s.DayOfWeek.ToLower() == dayOfWeek.ToLower())
            .Where(s => excludeSlotId == null || s.SlotId != excludeSlotId.Value)
            .FirstOrDefaultAsync(s =>
                (startTime >= s.StartTime && startTime < s.EndTime) ||
                (endTime > s.StartTime && endTime <= s.EndTime) ||
                (startTime <= s.StartTime && endTime >= s.EndTime));
    }

    public async Task<TimetableSlot?> CheckRoomConflictAsync(string roomNo, string dayOfWeek, TimeSpan startTime, TimeSpan endTime, int? excludeSlotId = null)
    {
        if (string.IsNullOrWhiteSpace(roomNo)) return null;

        return await _context.TimetableSlots
            .Include(s => s.Header)
            .ThenInclude(h => h!.ClassGrade)
            .Include(s => s.Header)
            .ThenInclude(h => h!.ClassSection)
            .Where(s => s.RoomNo != null && s.RoomNo.ToLower() == roomNo.Trim().ToLower() && s.DayOfWeek.ToLower() == dayOfWeek.ToLower())
            .Where(s => excludeSlotId == null || s.SlotId != excludeSlotId.Value)
            .FirstOrDefaultAsync(s =>
                (startTime >= s.StartTime && startTime < s.EndTime) ||
                (endTime > s.StartTime && endTime <= s.EndTime) ||
                (startTime <= s.StartTime && endTime >= s.EndTime));
    }

    // =========================================================
    // AUTO-RESOLVE TEACHER
    // =========================================================

    public async Task<Staff?> GetAssignedTeacherForSubjectAsync(int classId, int sectionId, int subjectId)
    {
        var assignment = await _context.TeacherSubjectAssignments
            .Include(a => a.Staff)
            .FirstOrDefaultAsync(a =>
                a.ClassId == classId &&
                a.SectionId == sectionId &&
                a.SubjectId == subjectId);

        if (assignment?.Staff != null)
            return assignment.Staff;

        // Fallback: Check if section has a Class Teacher assigned
        var section = await _context.ClassSections
            .FirstOrDefaultAsync(s => s.SectionId == sectionId);

        if (section != null)
        {
            var classTeacherAssignment = await _context.TeacherAssignments
                .Include(a => a.Teacher)
                .FirstOrDefaultAsync(a =>
                    a.ClassId == section.ClassId &&
                    a.SectionLetter == section.SectionName &&
                    a.Role == "Class Teacher");

            if (classTeacherAssignment != null)
                return classTeacherAssignment.Teacher;
        }

        return null;
    }

    // =========================================================
    // TIMETABLES VIEWS
    // =========================================================

    public async Task<List<TimetableSlot>> GetTeacherTimetableSlotsAsync(int teacherId, string academicYear)
    {
        return await _context.TimetableSlots
            .Include(s => s.Header)
            .ThenInclude(h => h!.ClassGrade)
            .Include(s => s.Header)
            .ThenInclude(h => h!.ClassSection)
            .Include(s => s.Subject)
            .Include(s => s.Period)
            .Where(s => s.TeacherId == teacherId && s.Header!.AcademicYear == academicYear)
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ToListAsync();
    }

    public async Task<List<TimetableSlot>> GetStudentTimetableSlotsAsync(int classId, int sectionId, string academicYear)
    {
        return await _context.TimetableSlots
            .Include(s => s.Header)
            .Include(s => s.Subject)
            .Include(s => s.Teacher)
            .Include(s => s.Period)
            .Where(s => s.Header!.ClassId == classId && s.Header.SectionId == sectionId && s.Header.AcademicYear == academicYear)
            .OrderBy(s => s.DayOfWeek)
            .ThenBy(s => s.StartTime)
            .ToListAsync();
    }

    // =========================================================
    // COPY CLASS TIMETABLE
    // =========================================================

    public async Task<bool> CopyTimetableSlotsAsync(int sourceHeaderId, int targetHeaderId)
    {
        var sourceSlots = await _context.TimetableSlots
            .Where(s => s.HeaderId == sourceHeaderId)
            .ToListAsync();

        if (!sourceSlots.Any()) return false;

        // Remove existing target slots
        var targetSlots = await _context.TimetableSlots
            .Where(s => s.HeaderId == targetHeaderId)
            .ToListAsync();

        _context.TimetableSlots.RemoveRange(targetSlots);

        // Add cloned slots
        var newSlots = sourceSlots.Select(s => new TimetableSlot
        {
            HeaderId = targetHeaderId,
            PeriodId = s.PeriodId,
            DayOfWeek = s.DayOfWeek,
            StartTime = s.StartTime,
            EndTime = s.EndTime,
            SubjectId = s.SubjectId,
            TeacherId = s.TeacherId,
            RoomNo = s.RoomNo
        }).ToList();

        await _context.TimetableSlots.AddRangeAsync(newSlots);
        await _context.SaveChangesAsync();
        return true;
    }
}
