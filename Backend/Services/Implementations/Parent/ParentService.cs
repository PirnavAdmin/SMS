using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SMS.Api.Dtos.Parent;
using SMS.Api.Repositories.Interfaces.Parent;
using SMS.Api.Services.Interfaces.Parent;

namespace SMS.Api.Services.Implementations.Parent
{
    public class ParentService : IParentService
    {
        private readonly IParentRepository _parentRepository;

        public ParentService(IParentRepository parentRepository)
        {
            _parentRepository = parentRepository;
        }

        public async Task<List<ParentChildDto>> GetChildrenAsync(string parentIdentifier)
        {
            var students = await _parentRepository.GetChildrenByParentIdentifierAsync(parentIdentifier);
            
            return students.Select(s => {
                var studentName = s.StudentName ?? "Student";
                var nameParts = studentName.Split(' ');
                var firstName = nameParts.Length > 0 ? nameParts[0] : studentName;
                var lastName = nameParts.Length > 1 ? string.Join(" ", nameParts.Skip(1)) : string.Empty;

                return new ParentChildDto
                {
                    StudentId = s.StudentId,
                    AdmissionNumber = s.AdmissionNumber,
                    RollNumber = s.RollNumber,
                    StudentName = studentName,
                    FirstName = firstName,
                    LastName = lastName,
                    ClassId = s.ClassId,
                    ClassName = s.ClassGrade?.ClassName ?? "Class 6",
                    SectionId = s.SectionId,
                    SectionName = s.ClassSection?.SectionName ?? "A",
                    Gender = s.Gender,
                    DateOfBirth = s.DateOfBirth,
                    ProfilePhoto = null
                };
            }).ToList();
        }

        public async Task<ParentDashboardSummaryDto> GetDashboardSummaryAsync(int studentId)
        {
            return await _parentRepository.GetDashboardSummaryAsync(studentId);
        }

        public async Task<ParentStudentDetailsDto?> GetStudentDetailsAsync(int studentId)
        {
            var dashboard = await _parentRepository.GetDashboardSummaryAsync(studentId);
            return dashboard.StudentInfo;
        }

        public async Task<ParentAttendanceSummaryDto> GetAttendanceSummaryAsync(int studentId)
        {
            return await _parentRepository.GetAttendanceSummaryAsync(studentId);
        }

        public async Task<List<ParentTimetableDayDto>> GetTimetableAsync(int studentId)
        {
            return await _parentRepository.GetTimetableAsync(studentId);
        }

        public async Task<List<ParentHomeworkItemDto>> GetHomeworkAsync(int studentId)
        {
            return await _parentRepository.GetHomeworkAsync(studentId);
        }

        public async Task<List<ParentExamResultReportDto>> GetExamResultsAsync(int studentId)
        {
            return await _parentRepository.GetExamResultsAsync(studentId);
        }

        public async Task<ParentFeeSummaryDto> GetFeeSummaryAsync(int studentId)
        {
            return await _parentRepository.GetFeeSummaryAsync(studentId);
        }

        public async Task<ParentFeePaymentResponseDto> PayFeeAsync(ParentFeePaymentRequestDto request)
        {
            return await _parentRepository.PayFeeAsync(request);
        }

        public async Task<List<ParentTeacherInfoDto>> GetTeachersAsync(int studentId)
        {
            return await _parentRepository.GetTeachersAsync(studentId);
        }

        public async Task<ParentTransportInfoDto> GetTransportInfoAsync(int studentId)
        {
            return await _parentRepository.GetTransportInfoAsync(studentId);
        }

        public async Task<ParentHostelInfoDto> GetHostelInfoAsync(int studentId)
        {
            return await _parentRepository.GetHostelInfoAsync(studentId);
        }

        public async Task<List<ParentEventItemDto>> GetUpcomingEventsAsync()
        {
            return await _parentRepository.GetUpcomingEventsAsync();
        }

        public async Task<List<ParentCommunicationDto>> GetCommunicationsAsync()
        {
            return await _parentRepository.GetCommunicationsAsync();
        }
    }
}
