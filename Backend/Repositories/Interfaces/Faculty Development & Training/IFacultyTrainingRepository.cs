using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Models;

namespace SMS.Api.Repositories.Interfaces
{
    public interface IFacultyTrainingRepository
    {
        // Workshops
        Task<List<FacultyWorkshop>> GetAllWorkshopsAsync();
        Task<FacultyWorkshop?> GetWorkshopByIdAsync(int id);
        Task AddWorkshopAsync(FacultyWorkshop workshop);
        Task UpdateWorkshopAsync(FacultyWorkshop workshop);
        Task DeleteWorkshopAsync(int id);

        // Assessments
        Task<List<EmployeeCompetencyAssessment>> GetAllAssessmentsAsync();
        Task<EmployeeCompetencyAssessment?> GetAssessmentByIdAsync(int id);
        Task AddAssessmentAsync(EmployeeCompetencyAssessment assessment);
        Task UpdateAssessmentAsync(EmployeeCompetencyAssessment assessment);
        Task DeleteAssessmentAsync(int id);

        // Participations
        Task<List<FacultyTrainingParticipation>> GetParticipationsByWorkshopIdAsync(int workshopId);
        Task<FacultyTrainingParticipation?> GetParticipationAsync(int workshopId, int staffId);
        Task AddParticipationAsync(FacultyTrainingParticipation participation);
        Task UpdateParticipationAsync(FacultyTrainingParticipation participation);

        // Candidates
        Task<List<EmployeeAssessmentCandidate>> GetCandidatesByAssessmentIdAsync(int assessmentId);
        Task<EmployeeAssessmentCandidate?> GetCandidateAsync(int assessmentId, int staffId);
        Task AddCandidateAsync(EmployeeAssessmentCandidate candidate);
        Task RemoveCandidatesRangeAsync(IEnumerable<EmployeeAssessmentCandidate> candidates);

        // Metrics Helpers
        Task<int> GetCertificatesIssuedCountAsync();
        Task<decimal> GetAverageScoreAsync();
        Task<List<FacultyTrainingParticipation>> GetIssuedWorkshopCertificatesAsync();
        Task<List<EmployeeAssessmentCandidate>> GetIssuedAssessmentCertificatesAsync();
        Task<List<Staff>> GetAllStaffForDropdownAsync();
        Task<List<FacultyTrainingParticipation>> GetParticipationsByStaffIdAsync(int staffId);
        Task<List<EmployeeAssessmentCandidate>> GetCandidatesByStaffIdAsync(int staffId);

        // Save
        Task SaveChangesAsync();
    }
}
