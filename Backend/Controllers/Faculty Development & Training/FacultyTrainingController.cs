using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/v1/faculty-training")]
    public class FacultyTrainingController : ControllerBase
    {
        private readonly IFacultyTrainingService _service;

        public FacultyTrainingController(IFacultyTrainingService service)
        {
            _service = service;
        }

        // ==========================================
        // Stats
        // ==========================================
        [HttpGet("stats")]
        public async Task<ActionResult<TrainingDashboardStatsDto>> GetDashboardStats()
        {
            var stats = await _service.GetDashboardStatsAsync();
            return Ok(stats);
        }

        // ==========================================
        // Workshops
        // ==========================================
        [HttpGet("workshops")]
        public async Task<ActionResult<List<WorkshopResponseDto>>> GetAllWorkshops()
        {
            var workshops = await _service.GetAllWorkshopsAsync();
            return Ok(workshops);
        }

        [HttpGet("workshops/{id:int}")]
        public async Task<ActionResult<WorkshopResponseDto>> GetWorkshopById(int id)
        {
            var workshop = await _service.GetWorkshopByIdAsync(id);
            if (workshop == null)
            {
                return NotFound(new { message = "Workshop not found." });
            }
            return Ok(workshop);
        }

        [HttpPost("workshops")]
        public async Task<ActionResult<WorkshopResponseDto>> CreateWorkshop([FromBody] CreateWorkshopDto dto)
        {
            var result = await _service.CreateWorkshopAsync(dto);
            return CreatedAtAction(nameof(GetWorkshopById), new { id = result.WorkshopId }, result);
        }

        [HttpPut("workshops/{id:int}")]
        public async Task<ActionResult<WorkshopResponseDto>> UpdateWorkshop(int id, [FromBody] UpdateWorkshopDto dto)
        {
            var result = await _service.UpdateWorkshopAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("workshops/{id:int}")]
        public async Task<IActionResult> DeleteWorkshop(int id)
        {
            await _service.DeleteWorkshopAsync(id);
            return Ok(new { message = "Workshop deleted successfully." });
        }

        // ==========================================
        // Assessments
        // ==========================================
        [HttpGet("assessments")]
        public async Task<ActionResult<List<AssessmentResponseDto>>> GetAllAssessments()
        {
            var assessments = await _service.GetAllAssessmentsAsync();
            return Ok(assessments);
        }

        [HttpGet("assessments/{id:int}")]
        public async Task<ActionResult<AssessmentResponseDto>> GetAssessmentById(int id)
        {
            var assessment = await _service.GetAssessmentByIdAsync(id);
            if (assessment == null)
            {
                return NotFound(new { message = "Assessment not found." });
            }
            return Ok(assessment);
        }

        [HttpPost("assessments")]
        public async Task<ActionResult<AssessmentResponseDto>> CreateAssessment([FromBody] CreateAssessmentDto dto)
        {
            var result = await _service.CreateAssessmentAsync(dto);
            return CreatedAtAction(nameof(GetAssessmentById), new { id = result.AssessmentId }, result);
        }

        [HttpPut("assessments/{id:int}")]
        public async Task<ActionResult<AssessmentResponseDto>> UpdateAssessment(int id, [FromBody] UpdateAssessmentDto dto)
        {
            var result = await _service.UpdateAssessmentAsync(id, dto);
            return Ok(result);
        }

        [HttpDelete("assessments/{id:int}")]
        public async Task<IActionResult> DeleteAssessment(int id)
        {
            await _service.DeleteAssessmentAsync(id);
            return Ok(new { message = "Assessment deleted successfully." });
        }

        // ==========================================
        // Participations / Registrations
        // ==========================================
        [HttpPost("workshops/{id:int}/register")]
        public async Task<ActionResult<ParticipationResponseDto>> RegisterParticipant(int id, [FromBody] RegisterParticipantDto dto)
        {
            var result = await _service.RegisterParticipantAsync(id, dto);
            return Ok(result);
        }

        [HttpPost("workshops/{id:int}/grade")]
        public async Task<ActionResult<ParticipationResponseDto>> GradeParticipant(int id, [FromBody] GradeParticipationDto dto)
        {
            var result = await _service.GradeParticipantAsync(id, dto);
            return Ok(result);
        }

        // ==========================================
        // Assessment Candidates
        // ==========================================
        [HttpGet("assessments/{id:int}/candidates")]
        public async Task<ActionResult<List<AssessmentCandidateResponseDto>>> GetCandidates(int id)
        {
            var result = await _service.GetCandidatesByAssessmentIdAsync(id);
            return Ok(result);
        }

        [HttpPost("assessments/{id:int}/candidates")]
        public async Task<ActionResult<List<AssessmentCandidateResponseDto>>> AssignCandidates(int id, [FromBody] AssignAssessmentCandidatesDto dto)
        {
            var result = await _service.AssignAssessmentCandidatesAsync(id, dto);
            return Ok(result);
        }

        [HttpPost("assessments/{id:int}/grade")]
        public async Task<ActionResult<AssessmentCandidateResponseDto>> GradeCandidate(int id, [FromBody] GradeAssessmentCandidateDto dto)
        {
            var result = await _service.GradeAssessmentCandidateAsync(id, dto);
            return Ok(result);
        }

        // ==========================================
        // Dropdowns / Lookups
        // ==========================================
        [HttpGet("dropdowns/assessment-types")]
        public async Task<ActionResult<List<string>>> GetAssessmentTypes()
        {
            var result = await _service.GetAssessmentTypesAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/assessment-categories")]
        public async Task<ActionResult<List<string>>> GetAssessmentCategories()
        {
            var result = await _service.GetAssessmentCategoriesAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/grading-schemes")]
        public async Task<ActionResult<List<string>>> GetGradingSchemes()
        {
            var result = await _service.GetGradingSchemesAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/employee-types")]
        public async Task<ActionResult<List<string>>> GetEmployeeTypes()
        {
            var result = await _service.GetEmployeeTypesAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/branches")]
        public async Task<ActionResult<List<string>>> GetBranches()
        {
            var result = await _service.GetBranchesAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/departments")]
        public async Task<ActionResult<List<string>>> GetDepartments()
        {
            var result = await _service.GetDepartmentsAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/designations")]
        public async Task<ActionResult<List<string>>> GetDesignations()
        {
            var result = await _service.GetDesignationsAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/assessment-modes")]
        public async Task<ActionResult<List<string>>> GetAssessmentModes()
        {
            var result = await _service.GetAssessmentModesAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/workshop-categories")]
        public async Task<ActionResult<List<string>>> GetWorkshopCategories()
        {
            var result = await _service.GetWorkshopCategoriesAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/target-role-types")]
        public async Task<ActionResult<List<string>>> GetTargetRoleTypes()
        {
            var result = await _service.GetTargetRoleTypesAsync();
            return Ok(result);
        }

        [HttpGet("dropdowns/attendance-statuses")]
        public async Task<ActionResult<List<string>>> GetAttendanceStatuses()
        {
            var result = await _service.GetAttendanceStatusesAsync();
            return Ok(result);
        }

        [HttpPost("workshops/{id:int}/attendance")]
        public async Task<ActionResult<WorkshopResponseDto>> RecordWorkshopAttendance(int id, [FromBody] RecordWorkshopAttendanceDto dto)
        {
            var result = await _service.RecordWorkshopAttendanceAsync(id, dto);
            return Ok(result);
        }

        [HttpPost("assessments/{id:int}/publish-results")]
        public async Task<ActionResult<AssessmentResponseDto>> PublishAssessmentResults(int id, [FromBody] PublishAssessmentResultsDto dto)
        {
            var result = await _service.PublishAssessmentResultsAsync(id, dto);
            return Ok(result);
        }

        // ==========================================
        // Certificates Registry
        // ==========================================
        [HttpGet("certificates")]
        public async Task<ActionResult<List<IssuedCertificateResponseDto>>> GetIssuedCertificates()
        {
            var result = await _service.GetIssuedCertificatesAsync();
            return Ok(result);
        }

        [HttpGet("certificates/{certNo}")]
        public async Task<ActionResult<IssuedCertificateResponseDto>> GetCertificateByNo(string certNo)
        {
            var result = await _service.GetCertificateByNoAsync(certNo);
            if (result == null)
            {
                return NotFound(new { message = "Certificate not found." });
            }
            return Ok(result);
        }

        // ==========================================
        // Development Reports
        // ==========================================
        [HttpGet("reports/summary")]
        public async Task<ActionResult<DevelopmentReportsSummaryDto>> GetReportsSummary()
        {
            var result = await _service.GetDevelopmentReportsSummaryAsync();
            return Ok(result);
        }

        [HttpGet("reports/export")]
        public async Task<IActionResult> ExportReports()
        {
            var csv = await _service.ExportReportsCsvAsync();
            var bytes = System.Text.Encoding.UTF8.GetBytes(csv);
            return File(bytes, "text/csv", "Executive_Training_and_Competency_Report.csv");
        }

        // ==========================================
        // Staff Development View
        // ==========================================
        [HttpGet("employees")]
        public async Task<ActionResult<List<FacultyStaffDropdownDto>>> GetStaffDropdown()
        {
            var result = await _service.GetStaffDropdownAsync();
            return Ok(result);
        }

        [HttpGet("employees/{id:int}/logs")]
        public async Task<ActionResult<StaffDevelopmentProfileDto>> GetStaffDevelopmentProfile(int id)
        {
            var result = await _service.GetStaffDevelopmentProfileAsync(id);
            return Ok(result);
        }
    }
}
