namespace SMS.Api.Repositories.Interfaces.ExaminationNew;

using SMS.Api.Models.ExaminationNew;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamScheduleRepository
{
    Task<List<NewExamTimetableSlot>> GetTimetableSlotsAsync(string className, string sectionName);
    Task<bool> SaveTimetableSlotsAsync(string className, string sectionName, List<NewExamTimetableSlot> slots);
    Task<List<NewExamTimetableSlot>> GetAllTimetableSlotsAsync();
}
