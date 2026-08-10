namespace SMS.Api.Repositories.Implementations.ExaminationNew;

using SMS.Api.Data;
using SMS.Api.Models.ExaminationNew;
using SMS.Api.Repositories.Interfaces.ExaminationNew;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class ExamScheduleRepository : IExamScheduleRepository
{
    private readonly AppDbContext _context;

    private static readonly List<NewExamTimetableSlot> _inMemoryTimetable = new List<NewExamTimetableSlot>
    {
        // Class 1 - Section A
        new NewExamTimetableSlot { SlotId = 1, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "MTH-101", SubjectName = "Mathematics", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 2, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "ENG-105", SubjectName = "English Language", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 3, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "CHM-103", SubjectName = "Chemistry", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 4, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "HIS-107", SubjectName = "History", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 5, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "ACC-109", SubjectName = "Accountancy", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 6, ClassName = "Class 1", SectionName = "Section A", SubjectCode = "PHY-102", SubjectName = "Physics", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },

        // Class 1 - Section B
        new NewExamTimetableSlot { SlotId = 7, ClassName = "Class 1", SectionName = "Section B", SubjectCode = "MTH-101", SubjectName = "Mathematics", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 8, ClassName = "Class 1", SectionName = "Section B", SubjectCode = "ENG-105", SubjectName = "English Language", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 9, ClassName = "Class 1", SectionName = "Section B", SubjectCode = "CHM-103", SubjectName = "Chemistry", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 10, ClassName = "Class 1", SectionName = "Section B", SubjectCode = "HIS-107", SubjectName = "History", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 11, ClassName = "Class 1", SectionName = "Section B", SubjectCode = "ACC-109", SubjectName = "Accountancy", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" },
        new NewExamTimetableSlot { SlotId = 12, ClassName = "Class 1", SectionName = "Section B", SubjectCode = "PHY-102", SubjectName = "Physics", TotalMarks = 100, ExamDate = new DateTime(2026, 08, 09), TimeSlot = "09:00 - 12:00", Duration = "3h", RoomHall = "TBA", InvigilatorFaculty = "Unassigned" }
    };

    public ExamScheduleRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<NewExamTimetableSlot>> GetTimetableSlotsAsync(string className, string sectionName)
    {
        try
        {
            var dbSlots = await _context.NewExamTimetableSlots
                .AsNoTracking()
                .Where(s => s.ClassName == className && s.SectionName == sectionName)
                .ToListAsync();

            if (dbSlots != null && dbSlots.Any())
                return dbSlots;
        }
        catch
        {
            // Fallback
        }

        return _inMemoryTimetable
            .Where(s => s.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) && 
                        s.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase))
            .ToList();
    }

    public async Task<bool> SaveTimetableSlotsAsync(string className, string sectionName, List<NewExamTimetableSlot> slots)
    {
        try
        {
            var existingDb = await _context.NewExamTimetableSlots
                .Where(s => s.ClassName == className && s.SectionName == sectionName)
                .ToListAsync();

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

        _inMemoryTimetable.RemoveAll(s => s.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) && s.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase));
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

    public async Task<bool> ClearTimetableAsync(string className, string sectionName)
    {
        _inMemoryTimetable.RemoveAll(s => s.ClassName.Equals(className, StringComparison.OrdinalIgnoreCase) && s.SectionName.Equals(sectionName, StringComparison.OrdinalIgnoreCase));

        try
        {
            var dbSlots = await _context.NewExamTimetableSlots
                .Where(s => s.ClassName == className && s.SectionName == sectionName)
                .ToListAsync();

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
}
