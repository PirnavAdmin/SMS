using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class FacultyTrainingRepository : IFacultyTrainingRepository
    {
        private readonly AppDbContext _context;

        public FacultyTrainingRepository(AppDbContext context)
        {
            _context = context;
        }

        // ==========================================
        // Workshops CRUD
        // ==========================================
        public async Task<List<FacultyWorkshop>> GetAllWorkshopsAsync()
        {
            return await _context.FacultyWorkshops
                .Include(w => w.Participants)
                    .ThenInclude(p => p.Staff)
                .OrderByDescending(w => w.StartDate)
                .ToListAsync();
        }

        public async Task<FacultyWorkshop?> GetWorkshopByIdAsync(int id)
        {
            return await _context.FacultyWorkshops
                .Include(w => w.Participants)
                    .ThenInclude(p => p.Staff)
                .FirstOrDefaultAsync(w => w.WorkshopId == id);
        }

        public async Task AddWorkshopAsync(FacultyWorkshop workshop)
        {
            await _context.FacultyWorkshops.AddAsync(workshop);
        }

        public async Task UpdateWorkshopAsync(FacultyWorkshop workshop)
        {
            _context.FacultyWorkshops.Update(workshop);
            await Task.CompletedTask;
        }

        public async Task DeleteWorkshopAsync(int id)
        {
            var workshop = await _context.FacultyWorkshops.FindAsync(id);
            if (workshop != null)
            {
                _context.FacultyWorkshops.Remove(workshop);
            }
        }

        // ==========================================
        // Assessments CRUD
        // ==========================================
        public async Task<List<EmployeeCompetencyAssessment>> GetAllAssessmentsAsync()
        {
            return await _context.EmployeeCompetencyAssessments
                .Include(a => a.Candidates)
                    .ThenInclude(c => c.Staff)
                .OrderByDescending(a => a.ScheduledDate ?? a.CreatedAt)
                .ToListAsync();
        }

        public async Task<EmployeeCompetencyAssessment?> GetAssessmentByIdAsync(int id)
        {
            return await _context.EmployeeCompetencyAssessments
                .Include(a => a.Candidates)
                    .ThenInclude(c => c.Staff)
                .FirstOrDefaultAsync(a => a.AssessmentId == id);
        }

        public async Task AddAssessmentAsync(EmployeeCompetencyAssessment assessment)
        {
            await _context.EmployeeCompetencyAssessments.AddAsync(assessment);
        }

        public async Task UpdateAssessmentAsync(EmployeeCompetencyAssessment assessment)
        {
            _context.EmployeeCompetencyAssessments.Update(assessment);
            await Task.CompletedTask;
        }

        public async Task DeleteAssessmentAsync(int id)
        {
            var assessment = await _context.EmployeeCompetencyAssessments.FindAsync(id);
            if (assessment != null)
            {
                _context.EmployeeCompetencyAssessments.Remove(assessment);
            }
        }

        // ==========================================
        // Participations CRUD
        // ==========================================
        public async Task<List<FacultyTrainingParticipation>> GetParticipationsByWorkshopIdAsync(int workshopId)
        {
            return await _context.FacultyTrainingParticipations
                .Include(p => p.Staff)
                .Where(p => p.WorkshopId == workshopId)
                .ToListAsync();
        }

        public async Task<FacultyTrainingParticipation?> GetParticipationAsync(int workshopId, int staffId)
        {
            return await _context.FacultyTrainingParticipations
                .Include(p => p.Staff)
                .FirstOrDefaultAsync(p => p.WorkshopId == workshopId && p.StaffId == staffId);
        }

        public async Task AddParticipationAsync(FacultyTrainingParticipation participation)
        {
            await _context.FacultyTrainingParticipations.AddAsync(participation);
        }

        public async Task UpdateParticipationAsync(FacultyTrainingParticipation participation)
        {
            _context.FacultyTrainingParticipations.Update(participation);
            await Task.CompletedTask;
        }

        // ==========================================
        // Candidates CRUD
        // ==========================================
        public async Task<List<EmployeeAssessmentCandidate>> GetCandidatesByAssessmentIdAsync(int assessmentId)
        {
            return await _context.EmployeeAssessmentCandidates
                .Include(c => c.Staff)
                .Where(c => c.AssessmentId == assessmentId)
                .ToListAsync();
        }

        public async Task<EmployeeAssessmentCandidate?> GetCandidateAsync(int assessmentId, int staffId)
        {
            return await _context.EmployeeAssessmentCandidates
                .Include(c => c.Staff)
                .FirstOrDefaultAsync(c => c.AssessmentId == assessmentId && c.StaffId == staffId);
        }

        public async Task AddCandidateAsync(EmployeeAssessmentCandidate candidate)
        {
            await _context.EmployeeAssessmentCandidates.AddAsync(candidate);
        }

        public async Task RemoveCandidatesRangeAsync(IEnumerable<EmployeeAssessmentCandidate> candidates)
        {
            _context.EmployeeAssessmentCandidates.RemoveRange(candidates);
            await Task.CompletedTask;
        }

        // ==========================================
        // Metrics Helpers
        // ==========================================
        public async Task<int> GetCertificatesIssuedCountAsync()
        {
            var workshopsCertCount = await _context.FacultyTrainingParticipations
                .CountAsync(p => p.CertificateIssued);
            var assessmentsCertCount = await _context.EmployeeAssessmentCandidates
                .CountAsync(c => c.CertificateIssued);
            return workshopsCertCount + assessmentsCertCount;
        }

        public async Task<decimal> GetAverageScoreAsync()
        {
            var hasScores = await _context.FacultyTrainingParticipations
                .AnyAsync(p => p.AssessmentScore != null);

            if (!hasScores) return 0m;

            var avg = await _context.FacultyTrainingParticipations
                .Where(p => p.AssessmentScore != null)
                .AverageAsync(p => (double)p.AssessmentScore!.Value);

            return (decimal)avg;
        }

        public async Task<List<FacultyTrainingParticipation>> GetIssuedWorkshopCertificatesAsync()
        {
            return await _context.FacultyTrainingParticipations
                .Include(p => p.Staff)
                .Include(p => p.Workshop)
                .Where(p => p.CertificateIssued && p.CertificateNumber != null)
                .OrderByDescending(p => p.IssuedDate)
                .ToListAsync();
        }

        public async Task<List<EmployeeAssessmentCandidate>> GetIssuedAssessmentCertificatesAsync()
        {
            return await _context.EmployeeAssessmentCandidates
                .Include(c => c.Staff)
                .Include(c => c.Assessment)
                .Where(c => c.CertificateIssued && c.CertificateNumber != null)
                .OrderByDescending(c => c.IssuedDate)
                .ToListAsync();
        }

        public async Task<List<Staff>> GetAllStaffForDropdownAsync()
        {
            return await _context.Staff
                .OrderBy(s => s.FirstName)
                .ThenBy(s => s.LastName)
                .ToListAsync();
        }

        public async Task<List<FacultyTrainingParticipation>> GetParticipationsByStaffIdAsync(int staffId)
        {
            return await _context.FacultyTrainingParticipations
                .Include(p => p.Workshop)
                .Where(p => p.StaffId == staffId)
                .ToListAsync();
        }

        public async Task<List<EmployeeAssessmentCandidate>> GetCandidatesByStaffIdAsync(int staffId)
        {
            return await _context.EmployeeAssessmentCandidates
                .Include(c => c.Assessment)
                .Where(c => c.StaffId == staffId)
                .ToListAsync();
        }

        // ==========================================
        // Save
        // ==========================================
        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
