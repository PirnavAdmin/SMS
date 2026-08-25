using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos.Parent;

namespace SMS.Api.Services.Interfaces.Parent
{
    public interface IParentService
    {
        Task<List<ParentChildDto>> GetChildrenAsync(string parentIdentifier);
        Task<ParentDashboardSummaryDto> GetDashboardSummaryAsync(int studentId);
        Task<ParentStudentDetailsDto?> GetStudentDetailsAsync(int studentId);
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
