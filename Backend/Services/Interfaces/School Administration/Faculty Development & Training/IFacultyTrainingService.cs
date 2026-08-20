using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos;

namespace SMS.Api.Services.Interfaces
{
    public interface IFacultyTrainingService
    {
        // Stats
        Task<TrainingDashboardStatsDto> GetDashboardStatsAsync();

        // Workshops
        Task<List<WorkshopResponseDto>> GetAllWorkshopsAsync();
        Task<WorkshopResponseDto?> GetWorkshopByIdAsync(int id);
        Task<WorkshopResponseDto> CreateWorkshopAsync(CreateWorkshopDto dto);
        Task<WorkshopResponseDto> UpdateWorkshopAsync(int id, UpdateWorkshopDto dto);
        Task DeleteWorkshopAsync(int id);

        // Assessments
        Task<List<AssessmentResponseDto>> GetAllAssessmentsAsync();
        Task<AssessmentResponseDto?> GetAssessmentByIdAsync(int id);
        Task<AssessmentResponseDto> CreateAssessmentAsync(CreateAssessmentDto dto);
        Task<AssessmentResponseDto> UpdateAssessmentAsync(int id, UpdateAssessmentDto dto);
        Task DeleteAssessmentAsync(int id);

        // Participations
        Task<ParticipationResponseDto> RegisterParticipantAsync(int workshopId, RegisterParticipantDto dto);
        Task<ParticipationResponseDto> GradeParticipantAsync(int workshopId, GradeParticipationDto dto);

        // Assessment Candidates
        Task<List<AssessmentCandidateResponseDto>> GetCandidatesByAssessmentIdAsync(int assessmentId);
        Task<List<AssessmentCandidateResponseDto>> AssignAssessmentCandidatesAsync(int assessmentId, AssignAssessmentCandidatesDto dto);
        Task<AssessmentCandidateResponseDto> GradeAssessmentCandidateAsync(int assessmentId, GradeAssessmentCandidateDto dto);

        // Lookups / Dropdowns
        Task<List<string>> GetAssessmentTypesAsync();
        Task<List<string>> GetAssessmentCategoriesAsync();
        Task<List<string>> GetGradingSchemesAsync();
        Task<List<string>> GetEmployeeTypesAsync();
        Task<List<string>> GetBranchesAsync();
        Task<List<string>> GetDepartmentsAsync();
        Task<List<string>> GetDesignationsAsync();
        Task<List<string>> GetAssessmentModesAsync();
        Task<List<string>> GetWorkshopCategoriesAsync();
        Task<List<string>> GetTargetRoleTypesAsync();
        Task<List<string>> GetAttendanceStatusesAsync();

        // Workshop Attendance
        Task<WorkshopResponseDto> RecordWorkshopAttendanceAsync(int workshopId, RecordWorkshopAttendanceDto dto);

        // Assessment Bulk Results Publishing
        Task<AssessmentResponseDto> PublishAssessmentResultsAsync(int assessmentId, PublishAssessmentResultsDto dto);

        // Certificate Registry
        Task<List<IssuedCertificateResponseDto>> GetIssuedCertificatesAsync();
        Task<IssuedCertificateResponseDto?> GetCertificateByNoAsync(string certNo);

        // Reports & Export
        Task<DevelopmentReportsSummaryDto> GetDevelopmentReportsSummaryAsync();
        Task<string> ExportReportsCsvAsync();

        // Staff Development View
        Task<List<FacultyStaffDropdownDto>> GetStaffDropdownAsync();
        Task<StaffDevelopmentProfileDto> GetStaffDevelopmentProfileAsync(int staffId);
    }
}
