namespace SMS.Api.Repositories.Interfaces.Examination;

using SMS.Api.Models.Examination;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamScheduleRepository
{
    Task<List<string>> GetClassNamesAsync();
    Task<List<string>> GetSectionNamesAsync();
    Task<List<string>> GetInvigilatorNamesAsync();
    Task<List<string>> GetRoomNamesAsync();
    Task<List<NewExamTimetableSlot>> GetTimetableSlotsAsync(int? examId, string className, string sectionName);
    Task<bool> SaveTimetableSlotsAsync(int? examId, string className, string sectionName, List<NewExamTimetableSlot> slots);
    Task<List<NewExamTimetableSlot>> GetAllTimetableSlotsAsync();
    Task<bool> DeleteSlotAsync(int slotId);
    Task<bool> ClearTimetableAsync(int? examId, string className, string sectionName);
}

