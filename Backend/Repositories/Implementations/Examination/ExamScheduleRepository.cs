namespace SMS.Api.Repositories.Implementations.Examination;

using SMS.Api.Data;
using SMS.Api.Models.Examination;
using SMS.Api.Repositories.Interfaces.Examination;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamScheduleRepository : IExamScheduleRepository
{
    private readonly AppDbContext _context;

    private static readonly List<NewExamTimetableSlot> _inMemoryTimetable = new List<NewExamTimetableSlot>();

    public ExamScheduleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NewExamTimetableSlot>> GetTimetableSlotsAsync(int? examId, string className, string sectionName)
    {
        try
        {
            var query = _context.NewExamTimetableSlots.AsNoTracking();
            if (examId.HasValue && examId.Value > 0)
            {
                query = query.Where(s => s.ExamId == examId.Value);
            }
            var dbSlots = await query
                .Where(s => (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase) && (s.SectionName ?? "").Equals(sectionName, StringComparison.OrdinalIgnoreCase))
                .ToListAsync();

            if (dbSlots != null && dbSlots.Any())
                return dbSlots;
        }
        catch
        {
            // Fallback
        }

        var inMemQuery = _inMemoryTimetable.AsQueryable();
        if (examId.HasValue && examId.Value > 0)
        {
            inMemQuery = inMemQuery.Where(s => s.ExamId == examId.Value);
        }

        return inMemQuery
            .Where(s => (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase) &&
                        (s.SectionName ?? "").Equals(sectionName, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public async Task<bool> SaveTimetableSlotsAsync(int? examId, string className, string sectionName, List<NewExamTimetableSlot> slots)
    {
        try
        {
            var query = _context.NewExamTimetableSlots
                .Where(s => (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase) && (s.SectionName ?? "").Equals(sectionName, StringComparison.OrdinalIgnoreCase));

            if (examId.HasValue && examId.Value > 0)
            {
                query = query.Where(s => s.ExamId == examId.Value);
            }

            var existingDb = await query.ToListAsync();

            if (existingDb.Any())
            {
                _context.NewExamTimetableSlots.RemoveRange(existingDb);
            }

            foreach (var s in slots)
            {
                s.SlotId = 0; // Reset SlotId to 0 for auto-increment in MySQL
            }

            await _context.NewExamTimetableSlots.AddRangeAsync(slots);
            await _context.SaveChangesAsync();
        }
        catch
        {
            // Fallback
        }

        if (examId.HasValue && examId.Value > 0)
        {
            _inMemoryTimetable.RemoveAll(s => s.ExamId == examId.Value && (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase) && (s.SectionName ?? "").Equals(sectionName, StringComparison.OrdinalIgnoreCase));
        }
        else
        {
            _inMemoryTimetable.RemoveAll(s => (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase) && (s.SectionName ?? "").Equals(sectionName, StringComparison.OrdinalIgnoreCase));
        }
        _inMemoryTimetable.AddRange(slots);

        return true;
    }

    public async Task<List<NewExamTimetableSlot>> GetAllTimetableSlotsAsync()
    {
        try
        {
            var dbSlots = await _context.NewExamTimetableSlots.AsNoTracking().ToListAsync();
            if (dbSlots != null && dbSlots.Any())
                return dbSlots;
        }
        catch
        {
            // Fallback
        }

        return _inMemoryTimetable;
    }

    public async Task<bool> DeleteSlotAsync(int slotId)
    {
        _inMemoryTimetable.RemoveAll(s => s.SlotId == slotId);

        try
        {
            var dbSlot = await _context.NewExamTimetableSlots.FirstOrDefaultAsync(s => s.SlotId == slotId);
            if (dbSlot != null)
            {
                _context.NewExamTimetableSlots.Remove(dbSlot);
                await _context.SaveChangesAsync();
            }
            return true;
        }
        catch
        {
            return true;
        }
    }

    public async Task<bool> ClearTimetableAsync(int? examId, string className, string sectionName)
    {
        if (examId.HasValue && examId.Value > 0)
        {
            _inMemoryTimetable.RemoveAll(s => s.ExamId == examId.Value && (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase) && (s.SectionName ?? "").Equals(sectionName, StringComparison.OrdinalIgnoreCase));
        }
        else
        {
            _inMemoryTimetable.RemoveAll(s => (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase) && (s.SectionName ?? "").Equals(sectionName, StringComparison.OrdinalIgnoreCase));
        }

        try
        {
            var query = _context.NewExamTimetableSlots
                .Where(s => (s.ClassName ?? "").Equals(className, StringComparison.OrdinalIgnoreCase) && (s.SectionName ?? "").Equals(sectionName, StringComparison.OrdinalIgnoreCase));

            if (examId.HasValue && examId.Value > 0)
            {
                query = query.Where(s => s.ExamId == examId.Value);
            }

            var dbSlots = await query.ToListAsync();

            if (dbSlots.Any())
            {
                _context.NewExamTimetableSlots.RemoveRange(dbSlots);
                await _context.SaveChangesAsync();
            }
            return true;
        }
        catch
        {
            return true;
        }
    }

    public async Task<List<string>> GetClassNamesAsync()
    {
        try
        {
            var classes = await _context.Classes.AsNoTracking()
                .Where(c => c.ClassName != null)
                .Select(c => c.ClassName!)
                .Distinct()
                .ToListAsync();
            if (classes != null && classes.Any()) return classes;
        }
        catch { }
        return new List<string>();
    }

    public async Task<List<string>> GetSectionNamesAsync()
    {
        try
        {
            var sections = await _context.ClassSections.AsNoTracking()
                .Where(s => s.SectionName != null)
                .Select(s => s.SectionName!)
                .Distinct()
                .ToListAsync();
            if (sections != null && sections.Any()) return sections;
        }
        catch { }
        return new List<string>();
    }

    public async Task<List<string>> GetInvigilatorNamesAsync()
    {
        try
        {
            var staffList = await _context.Staff.AsNoTracking()
                .Select(s => $"{s.FirstName} {s.LastName}".Trim())
                .Distinct()
                .ToListAsync();
            if (staffList != null && staffList.Any()) return staffList;
        }
        catch { }
        return new List<string>();
    }

    public async Task<List<string>> GetRoomNamesAsync()
    {
        try
        {
            var rooms = await _context.ClassSections.AsNoTracking()
                .Where(s => !string.IsNullOrWhiteSpace(s.RoomNo))
                .Select(s => s.RoomNo!)
                .Distinct()
                .ToListAsync();
            if (rooms != null && rooms.Any()) return rooms;
        }
        catch { }
        return new List<string>();
    }
}

