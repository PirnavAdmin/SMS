using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos.Parent;
using SMS.Api.Models;

namespace SMS.Api.Repositories.Interfaces.Parent
{
    public interface IParentRepository
    {
        Task<List<Student>> GetChildrenByParentIdentifierAsync(string identifier);
        Task<Student?> GetStudentByIdAsync(int studentId);
        Task<ParentDashboardSummaryDto> GetDashboardSummaryAsync(int studentId);
        Task<ParentAttendanceSummaryDto> GetAttendanceSummaryAsync(int studentId);
        Task<List<ParentTimetableDayDto>> GetTimetableAsync(int studentId);
        Task<List<ParentHomeworkItemDto>> GetHomeworkAsync(int studentId);
        Task<List<ParentExamResultReportDto>> GetExamResultsAsync(int studentId);
        Task<ParentFeeSummaryDto> GetFeeSummaryAsync(int studentId);
        Task<ParentFeePaymentResponseDto> PayFeeAsync(ParentFeePaymentRequestDto request);
        Task<List<ParentTeacherInfoDto>> GetTeachersAsync(int studentId);
        Task<ParentTransportInfoDto> GetTransportInfoAsync(int studentId);
        Task<ParentHostelInfoDto> GetHostelInfoAsync(int studentId);
        Task<List<ParentEventItemDto>> GetUpcomingEventsAsync();
        Task<List<ParentCommunicationDto>> GetCommunicationsAsync();
    }
}
