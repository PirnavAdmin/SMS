using System;
using System.Collections.Generic;

namespace SMS.Api.Dtos
{
    // ==========================================
    // Dashboard Stats DTO
    // ==========================================
    public class TrainingDashboardStatsDto
    {
        public int UpcomingWorkshops { get; set; }
        public int UpcomingTests { get; set; }
        public int OngoingPrograms { get; set; }
        public int CompletedFdpCount { get; set; }
        public int TotalParticipants { get; set; }
        public int CertificatesIssued { get; set; }
        public decimal AverageScore { get; set; }
    }

    // ==========================================
    // FacultyWorkshop DTOs
    // ==========================================
    public class CreateWorkshopDto
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? TrainerName { get; set; }
        public string? Organization { get; set; }
        public string? Venue { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string StartTime { get; set; } = "10:00 AM";
        public string EndTime { get; set; } = "04:00 PM";
        public string Category { get; set; } = "Pedagogy";
        public string? TargetRoleType { get; set; }
        public string? Branch { get; set; }
        public string Status { get; set; } = "Scheduled";
        public List<int> ParticipantStaffIds { get; set; } = new();
    }

    public class UpdateWorkshopDto
    {
        public string? Title { get; set; }
        public string? Description { get; set; }
        public string? TrainerName { get; set; }
        public string? Organization { get; set; }
        public string? Venue { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? Category { get; set; }
        public string? TargetRoleType { get; set; }
        public string? Branch { get; set; }
        public string? Status { get; set; }
    }

    public class WorkshopResponseDto
    {
        public int WorkshopId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? TrainerName { get; set; }
        public string? Organization { get; set; }
        public string? Venue { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? TargetRoleType { get; set; }
        public string? Branch { get; set; }
        public string Status { get; set; } = string.Empty;
        public decimal AttendanceRate { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<ParticipationResponseDto> Participants { get; set; } = new();
    }

    // ==========================================
    // EmployeeCompetencyAssessment DTOs
    // ==========================================
    public class CreateAssessmentDto
    {
        public string AssessmentName { get; set; } = string.Empty;
        public string AssessmentType { get; set; } = "Subject Knowledge Test";
        public string AssessmentCategory { get; set; } = "Knowledge";
        public int TotalMarks { get; set; } = 100;
        public int PassingMarks { get; set; } = 70;
        public string GradingScheme { get; set; } = "Letter Grade (A+, A, B, C, F)";
        public string? Description { get; set; }
        public string? AssessmentInstructions { get; set; }

        // Step 2 details
        public string? EmployeeTypeFilter { get; set; }
        public string? BranchFilter { get; set; }
        public string? DepartmentFilter { get; set; }
        public string? DesignationFilter { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? AssessmentMode { get; set; }
        public string? Venue { get; set; }
        public string? MainEvaluator { get; set; }
        public string? CoEvaluator { get; set; }
        public bool NotifyParticipants { get; set; } = true;
        public bool AutoCertificates { get; set; } = true;
        public bool AddToCalendar { get; set; } = true;
        public bool PublishImmediately { get; set; } = true;
        public int CandidatesCount { get; set; } = 0;
    }

    public class UpdateAssessmentDto
    {
        public string? AssessmentName { get; set; }
        public string? AssessmentType { get; set; }
        public string? AssessmentCategory { get; set; }
        public int? TotalMarks { get; set; }
        public int? PassingMarks { get; set; }
        public string? GradingScheme { get; set; }
        public string? Description { get; set; }
        public string? AssessmentInstructions { get; set; }
        public string? EmployeeTypeFilter { get; set; }
        public string? BranchFilter { get; set; }
        public string? DepartmentFilter { get; set; }
        public string? DesignationFilter { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? AssessmentMode { get; set; }
        public string? Venue { get; set; }
        public string? MainEvaluator { get; set; }
        public string? CoEvaluator { get; set; }
        public bool? NotifyParticipants { get; set; }
        public bool? AutoCertificates { get; set; }
        public bool? AddToCalendar { get; set; }
        public bool? PublishImmediately { get; set; }
        public int? CandidatesCount { get; set; }
        public string? Status { get; set; }
    }

    public class AssessmentResponseDto
    {
        public int AssessmentId { get; set; }
        public string AssessmentName { get; set; } = string.Empty;
        public string AssessmentType { get; set; } = string.Empty;
        public string AssessmentCategory { get; set; } = string.Empty;
        public int TotalMarks { get; set; }
        public int PassingMarks { get; set; }
        public string GradingScheme { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? AssessmentInstructions { get; set; }
        public string? EmployeeTypeFilter { get; set; }
        public string? BranchFilter { get; set; }
        public string? DepartmentFilter { get; set; }
        public string? DesignationFilter { get; set; }
        public DateTime? ScheduledDate { get; set; }
        public string? StartTime { get; set; }
        public string? EndTime { get; set; }
        public string? AssessmentMode { get; set; }
        public string? Venue { get; set; }
        public string? MainEvaluator { get; set; }
        public string? CoEvaluator { get; set; }
        public bool NotifyParticipants { get; set; }
        public bool AutoCertificates { get; set; }
        public bool AddToCalendar { get; set; }
        public bool PublishImmediately { get; set; }
        public int CandidatesCount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<AssessmentCandidateResponseDto> Candidates { get; set; } = new();
    }

    // ==========================================
    // Participation DTOs
    // ==========================================
    public class RegisterParticipantDto
    {
        public int StaffId { get; set; }
    }

    public class GradeParticipationDto
    {
        public int StaffId { get; set; }
        public decimal Score { get; set; }
    }

    public class ParticipationResponseDto
    {
        public int ParticipationId { get; set; }
        public int WorkshopId { get; set; }
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string RegistrationStatus { get; set; } = string.Empty;
        public decimal? AssessmentScore { get; set; }
        public bool CertificateIssued { get; set; }
        public string? CertificateNumber { get; set; }
        public DateTime? IssuedDate { get; set; }
    }

    // ==========================================
    // Candidate DTOs
    // ==========================================
    public class AssignAssessmentCandidatesDto
    {
        public List<int> StaffIds { get; set; } = new();
    }

    public class GradeAssessmentCandidateDto
    {
        public int StaffId { get; set; }
        public decimal Score { get; set; }
        public string? Remarks { get; set; }
    }

    public class AssessmentCandidateResponseDto
    {
        public int CandidateId { get; set; }
        public int AssessmentId { get; set; }
        public int StaffId { get; set; }
        public string StaffName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal? Score { get; set; }
        public string? Grade { get; set; }
        public string? Remarks { get; set; }
        public bool CertificateIssued { get; set; }
        public string? CertificateNumber { get; set; }
        public DateTime? IssuedDate { get; set; }
    }

    // ==========================================
    // Attendance DTOs
    // ==========================================
    public class RecordWorkshopAttendanceDto
    {
        public List<StaffAttendanceStatusDto> AttendanceRecords { get; set; } = new();
    }

    public class StaffAttendanceStatusDto
    {
        public int StaffId { get; set; }
        public string Status { get; set; } = "Present"; // Present, Absent, Excused, Pending
    }

    // ==========================================
    // Bulk Grading DTOs
    // ==========================================
    public class PublishAssessmentResultsDto
    {
        public List<CandidateResultRecordDto> Results { get; set; } = new();
    }

    public class CandidateResultRecordDto
    {
        public int StaffId { get; set; }
        public decimal Score { get; set; }
        public string? Remarks { get; set; }
    }

    // ==========================================
    // Certificate Registry DTOs
    // ==========================================
    public class IssuedCertificateResponseDto
    {
        public string CertificateNumber { get; set; } = string.Empty;
        public int StaffId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public int ProgramId { get; set; }
        public string ProgramName { get; set; } = string.Empty;
        public string ProgramType { get; set; } = string.Empty; // "Workshop" or "Assessment"
        public DateTime CompletionDate { get; set; }
        public string Status { get; set; } = "Issued";
    }

    // ==========================================
    // Reports DTOs
    // ==========================================
    public class DevelopmentReportsSummaryDto
    {
        public List<WorkshopReportSummaryDto> WorkshopParticipationSummary { get; set; } = new();
        public List<AssessmentReportSummaryDto> AssessmentPassFailBreakdown { get; set; } = new();
    }

    public class WorkshopReportSummaryDto
    {
        public int WorkshopId { get; set; }
        public string Title { get; set; } = string.Empty;
        public int EnrolledCount { get; set; }
        public decimal AttendanceRate { get; set; }
    }

    public class AssessmentReportSummaryDto
    {
        public int AssessmentId { get; set; }
        public string AssessmentName { get; set; } = string.Empty;
        public int PassedCount { get; set; }
        public int TotalCandidates { get; set; }
    }

    // ==========================================
    // Staff Development Logs DTOs
    // ==========================================
    public class FacultyStaffDropdownDto
    {
        public int StaffId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? PrimarySubject { get; set; }
        public string? Designation { get; set; }
        public string? Department { get; set; }
    }

    public class StaffDevelopmentProfileDto
    {
        public int StaffId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Designation { get; set; }
        public string? Department { get; set; }
        public string? PrimarySubject { get; set; }
        public string? AvatarUrl { get; set; }
        public List<StaffWorkshopLogDto> WorkshopsAttended { get; set; } = new();
        public List<StaffAssessmentLogDto> CompetencyAssessments { get; set; } = new();
        public List<StaffCertificateLogDto> EarnedCertificates { get; set; } = new();
    }

    public class StaffWorkshopLogDto
    {
        public int WorkshopId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime? CompletionDate { get; set; }
    }

    public class StaffAssessmentLogDto
    {
        public int AssessmentId { get; set; }
        public string AssessmentName { get; set; } = string.Empty;
        public decimal? Score { get; set; }
        public string? Grade { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ScheduledDate { get; set; }
    }

    public class StaffCertificateLogDto
    {
        public string CertificateNumber { get; set; } = string.Empty;
        public string ProgramName { get; set; } = string.Empty;
        public string ProgramType { get; set; } = string.Empty; // "Workshop" or "Assessment"
        public DateTime? IssuedDate { get; set; }
    }
}
