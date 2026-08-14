using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading.Tasks;
using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class FacultyTrainingService : IFacultyTrainingService
    {
        private readonly IFacultyTrainingRepository _repository;

        public FacultyTrainingService(IFacultyTrainingRepository repository)
        {
            _repository = repository;
        }

        // ==========================================
        // Stats Calculation
        // ==========================================
        public async Task<TrainingDashboardStatsDto> GetDashboardStatsAsync()
        {
            var workshops = await _repository.GetAllWorkshopsAsync();
            var assessments = await _repository.GetAllAssessmentsAsync();

            var today = DateTime.UtcNow.Date;

            int upcomingWorkshops = workshops.Count(w => w.StartDate > today && w.Status == "Scheduled");
            int upcomingTests = assessments.Count(a => a.ScheduledDate > today && a.Status == "Pending");
            int ongoingPrograms = workshops.Count(w => w.StartDate <= today && w.EndDate >= today && w.Status == "Ongoing");
            int completedFdps = workshops.Count(w => w.Status == "Completed");

            int totalParticipants = workshops.SelectMany(w => w.Participants).Select(p => p.StaffId).Distinct().Count();
            int certificatesIssued = await _repository.GetCertificatesIssuedCountAsync();
            decimal avgScore = await _repository.GetAverageScoreAsync();

            return new TrainingDashboardStatsDto
            {
                UpcomingWorkshops = upcomingWorkshops,
                UpcomingTests = upcomingTests,
                OngoingPrograms = ongoingPrograms,
                CompletedFdpCount = completedFdps,
                TotalParticipants = totalParticipants,
                CertificatesIssued = certificatesIssued,
                AverageScore = Math.Round(avgScore, 2)
            };
        }

        // ==========================================
        // Workshops CRUD Actions
        // ==========================================
        public async Task<List<WorkshopResponseDto>> GetAllWorkshopsAsync()
        {
            var workshops = await _repository.GetAllWorkshopsAsync();
            return workshops.Select(MapToWorkshopResponse).ToList();
        }

        public async Task<WorkshopResponseDto?> GetWorkshopByIdAsync(int id)
        {
            var workshop = await _repository.GetWorkshopByIdAsync(id);
            return workshop == null ? null : MapToWorkshopResponse(workshop);
        }

        public async Task<WorkshopResponseDto> CreateWorkshopAsync(CreateWorkshopDto dto)
        {
            var workshop = new FacultyWorkshop
            {
                Title = dto.Title,
                Description = dto.Description,
                TrainerName = dto.TrainerName,
                Organization = dto.Organization,
                Venue = dto.Venue,
                StartDate = dto.StartDate,
                EndDate = dto.EndDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                Category = dto.Category,
                TargetRoleType = dto.TargetRoleType,
                Branch = dto.Branch,
                Status = dto.Status,
                CreatedAt = DateTime.UtcNow
            };

            await _repository.AddWorkshopAsync(workshop);
            await _repository.SaveChangesAsync();

            // Register participants if specified
            if (dto.ParticipantStaffIds != null && dto.ParticipantStaffIds.Count > 0)
            {
                foreach (var staffId in dto.ParticipantStaffIds)
                {
                    var p = new FacultyTrainingParticipation
                    {
                        WorkshopId = workshop.WorkshopId,
                        StaffId = staffId,
                        RegistrationStatus = "Registered",
                        CertificateIssued = false
                    };
                    await _repository.AddParticipationAsync(p);
                }
                await _repository.SaveChangesAsync();
            }

            // Reload to fetch participants navigation
            var reloaded = await _repository.GetWorkshopByIdAsync(workshop.WorkshopId);
            return MapToWorkshopResponse(reloaded ?? workshop);
        }

        public async Task<WorkshopResponseDto> UpdateWorkshopAsync(int id, UpdateWorkshopDto dto)
        {
            var workshop = await _repository.GetWorkshopByIdAsync(id);
            if (workshop == null)
            {
                throw new AppException("Workshop not found.", HttpStatusCode.NotFound);
            }

            if (dto.Title != null) workshop.Title = dto.Title;
            if (dto.Description != null) workshop.Description = dto.Description;
            if (dto.TrainerName != null) workshop.TrainerName = dto.TrainerName;
            if (dto.Organization != null) workshop.Organization = dto.Organization;
            if (dto.Venue != null) workshop.Venue = dto.Venue;
            if (dto.StartDate.HasValue) workshop.StartDate = dto.StartDate;
            if (dto.EndDate.HasValue) workshop.EndDate = dto.EndDate;
            if (dto.StartTime != null) workshop.StartTime = dto.StartTime;
            if (dto.EndTime != null) workshop.EndTime = dto.EndTime;
            if (dto.Category != null) workshop.Category = dto.Category;
            if (dto.TargetRoleType != null) workshop.TargetRoleType = dto.TargetRoleType;
            if (dto.Branch != null) workshop.Branch = dto.Branch;
            if (dto.Status != null) workshop.Status = dto.Status;

            await _repository.UpdateWorkshopAsync(workshop);
            await _repository.SaveChangesAsync();

            return MapToWorkshopResponse(workshop);
        }

        public async Task DeleteWorkshopAsync(int id)
        {
            await _repository.DeleteWorkshopAsync(id);
            await _repository.SaveChangesAsync();
        }

        // ==========================================
        // Assessments CRUD Actions
        // ==========================================
        public async Task<List<AssessmentResponseDto>> GetAllAssessmentsAsync()
        {
            var assessments = await _repository.GetAllAssessmentsAsync();
            return assessments.Select(MapToAssessmentResponse).ToList();
        }

        public async Task<AssessmentResponseDto?> GetAssessmentByIdAsync(int id)
        {
            var assessment = await _repository.GetAssessmentByIdAsync(id);
            return assessment == null ? null : MapToAssessmentResponse(assessment);
        }

        public async Task<AssessmentResponseDto> CreateAssessmentAsync(CreateAssessmentDto dto)
        {
            if (dto.GradingScheme != null)
            {
                ValidateGradingScheme(dto.GradingScheme);
            }

            var assessment = new EmployeeCompetencyAssessment
            {
                AssessmentName = dto.AssessmentName,
                AssessmentType = dto.AssessmentType,
                AssessmentCategory = dto.AssessmentCategory,
                TotalMarks = dto.TotalMarks,
                PassingMarks = dto.PassingMarks,
                GradingScheme = dto.GradingScheme ?? "",
                Description = dto.Description,
                AssessmentInstructions = dto.AssessmentInstructions,
                EmployeeTypeFilter = dto.EmployeeTypeFilter,
                BranchFilter = dto.BranchFilter,
                DepartmentFilter = dto.DepartmentFilter,
                DesignationFilter = dto.DesignationFilter,
                ScheduledDate = dto.ScheduledDate,
                StartTime = dto.StartTime,
                EndTime = dto.EndTime,
                AssessmentMode = dto.AssessmentMode,
                Venue = dto.Venue,
                MainEvaluator = dto.MainEvaluator,
                CoEvaluator = dto.CoEvaluator,
                NotifyParticipants = dto.NotifyParticipants,
                AutoCertificates = dto.AutoCertificates,
                AddToCalendar = dto.AddToCalendar,
                PublishImmediately = dto.PublishImmediately,
                CandidatesCount = dto.CandidatesCount,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            await _repository.AddAssessmentAsync(assessment);
            await _repository.SaveChangesAsync();

            return MapToAssessmentResponse(assessment);
        }

        public async Task<AssessmentResponseDto> UpdateAssessmentAsync(int id, UpdateAssessmentDto dto)
        {
            var assessment = await _repository.GetAssessmentByIdAsync(id);
            if (assessment == null)
            {
                throw new AppException("Assessment not found.", HttpStatusCode.NotFound);
            }

            if (dto.AssessmentName != null) assessment.AssessmentName = dto.AssessmentName;
            if (dto.AssessmentType != null) assessment.AssessmentType = dto.AssessmentType;
            if (dto.AssessmentCategory != null) assessment.AssessmentCategory = dto.AssessmentCategory;
            if (dto.TotalMarks.HasValue) assessment.TotalMarks = dto.TotalMarks.Value;
            if (dto.PassingMarks.HasValue) assessment.PassingMarks = dto.PassingMarks.Value;
            if (dto.GradingScheme != null)
            {
                ValidateGradingScheme(dto.GradingScheme);
                assessment.GradingScheme = dto.GradingScheme;
            }
            if (dto.Description != null) assessment.Description = dto.Description;
            if (dto.AssessmentInstructions != null) assessment.AssessmentInstructions = dto.AssessmentInstructions;
            if (dto.EmployeeTypeFilter != null) assessment.EmployeeTypeFilter = dto.EmployeeTypeFilter;
            if (dto.BranchFilter != null) assessment.BranchFilter = dto.BranchFilter;
            if (dto.DepartmentFilter != null) assessment.DepartmentFilter = dto.DepartmentFilter;
            if (dto.DesignationFilter != null) assessment.DesignationFilter = dto.DesignationFilter;
            if (dto.ScheduledDate.HasValue) assessment.ScheduledDate = dto.ScheduledDate;
            if (dto.StartTime != null) assessment.StartTime = dto.StartTime;
            if (dto.EndTime != null) assessment.EndTime = dto.EndTime;
            if (dto.AssessmentMode != null) assessment.AssessmentMode = dto.AssessmentMode;
            if (dto.Venue != null) assessment.Venue = dto.Venue;
            if (dto.MainEvaluator != null) assessment.MainEvaluator = dto.MainEvaluator;
            if (dto.CoEvaluator != null) assessment.CoEvaluator = dto.CoEvaluator;
            if (dto.NotifyParticipants.HasValue) assessment.NotifyParticipants = dto.NotifyParticipants.Value;
            if (dto.AutoCertificates.HasValue) assessment.AutoCertificates = dto.AutoCertificates.Value;
            if (dto.AddToCalendar.HasValue) assessment.AddToCalendar = dto.AddToCalendar.Value;
            if (dto.PublishImmediately.HasValue) assessment.PublishImmediately = dto.PublishImmediately.Value;
            if (dto.CandidatesCount.HasValue) assessment.CandidatesCount = dto.CandidatesCount.Value;
            if (dto.Status != null) assessment.Status = dto.Status;

            await _repository.UpdateAssessmentAsync(assessment);
            await _repository.SaveChangesAsync();

            return MapToAssessmentResponse(assessment);
        }

        public async Task DeleteAssessmentAsync(int id)
        {
            await _repository.DeleteAssessmentAsync(id);
            await _repository.SaveChangesAsync();
        }

        // ==========================================
        // Participations Actions
        // ==========================================
        public async Task<ParticipationResponseDto> RegisterParticipantAsync(int workshopId, RegisterParticipantDto dto)
        {
            var existing = await _repository.GetParticipationAsync(workshopId, dto.StaffId);
            if (existing != null)
            {
                return MapToParticipationResponse(existing);
            }

            var participation = new FacultyTrainingParticipation
            {
                WorkshopId = workshopId,
                StaffId = dto.StaffId,
                RegistrationStatus = "Registered",
                CertificateIssued = false
            };

            await _repository.AddParticipationAsync(participation);
            await _repository.SaveChangesAsync();

            // Refresh model reference
            var result = await _repository.GetParticipationAsync(workshopId, dto.StaffId);
            return MapToParticipationResponse(result!);
        }

        public async Task<ParticipationResponseDto> GradeParticipantAsync(int workshopId, GradeParticipationDto dto)
        {
            var participation = await _repository.GetParticipationAsync(workshopId, dto.StaffId);
            if (participation == null)
            {
                throw new AppException("Participant registration record not found for this workshop.", HttpStatusCode.NotFound);
            }

            participation.AssessmentScore = dto.Score;
            participation.RegistrationStatus = "Attended";

            // Award certificate if they passed threshold (e.g. 50% or matching workshop constraints)
            if (dto.Score >= 50m && !participation.CertificateIssued)
            {
                participation.CertificateIssued = true;
                participation.IssuedDate = DateTime.UtcNow;
                participation.CertificateNumber = $"CERT-FDP-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";
            }

            await _repository.UpdateParticipationAsync(participation);
            await _repository.SaveChangesAsync();

            return MapToParticipationResponse(participation);
        }

        // ==========================================
        // Candidate Services
        // ==========================================
        public async Task<List<AssessmentCandidateResponseDto>> GetCandidatesByAssessmentIdAsync(int assessmentId)
        {
            var candidates = await _repository.GetCandidatesByAssessmentIdAsync(assessmentId);
            return candidates.Select(MapToCandidateResponse).ToList();
        }

        public async Task<List<AssessmentCandidateResponseDto>> AssignAssessmentCandidatesAsync(int assessmentId, AssignAssessmentCandidatesDto dto)
        {
            var assessment = await _repository.GetAssessmentByIdAsync(assessmentId);
            if (assessment == null)
            {
                throw new AppException("Assessment not found.", HttpStatusCode.NotFound);
            }

            // Remove existing candidates
            var existing = await _repository.GetCandidatesByAssessmentIdAsync(assessmentId);
            await _repository.RemoveCandidatesRangeAsync(existing);

            // Add new candidates
            foreach (var staffId in dto.StaffIds)
            {
                var candidate = new EmployeeAssessmentCandidate
                {
                    AssessmentId = assessmentId,
                    StaffId = staffId,
                    Status = "Assigned",
                    CertificateIssued = false
                };
                await _repository.AddCandidateAsync(candidate);
            }

            assessment.CandidatesCount = dto.StaffIds.Count;
            await _repository.UpdateAssessmentAsync(assessment);
            await _repository.SaveChangesAsync();

            var updatedCandidates = await _repository.GetCandidatesByAssessmentIdAsync(assessmentId);
            return updatedCandidates.Select(MapToCandidateResponse).ToList();
        }

        public async Task<AssessmentCandidateResponseDto> GradeAssessmentCandidateAsync(int assessmentId, GradeAssessmentCandidateDto dto)
        {
            var assessment = await _repository.GetAssessmentByIdAsync(assessmentId);
            if (assessment == null)
            {
                throw new AppException("Assessment not found.", HttpStatusCode.NotFound);
            }

            var candidate = await _repository.GetCandidateAsync(assessmentId, dto.StaffId);
            if (candidate == null)
            {
                throw new AppException("Candidate is not assigned to this assessment.", HttpStatusCode.NotFound);
            }

            candidate.Score = dto.Score;
            candidate.Remarks = dto.Remarks;
            candidate.Status = "Completed";

            // Enforce passing logic
            bool isPassed = dto.Score >= assessment.PassingMarks;
            if (isPassed)
            {
                candidate.Grade = "Pass";
                if (assessment.AutoCertificates && !candidate.CertificateIssued)
                {
                    candidate.CertificateIssued = true;
                    candidate.IssuedDate = DateTime.UtcNow;
                    candidate.CertificateNumber = $"CERT-COMP-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";
                }
            }
            else
            {
                candidate.Grade = "Fail";
            }

            await _repository.SaveChangesAsync();
            return MapToCandidateResponse(candidate);
        }

        // ==========================================
        // Mappers
        // ==========================================
        private WorkshopResponseDto MapToWorkshopResponse(FacultyWorkshop workshop)
        {
            decimal rate = 0m;
            if (workshop.Participants != null && workshop.Participants.Count > 0)
            {
                int total = workshop.Participants.Count;
                int present = workshop.Participants.Count(p => p.RegistrationStatus == "Present" || p.RegistrationStatus == "Attended");
                rate = Math.Round(((decimal)present / total) * 100, 2);
            }

            return new WorkshopResponseDto
            {
                WorkshopId = workshop.WorkshopId,
                Title = workshop.Title,
                Description = workshop.Description,
                TrainerName = workshop.TrainerName,
                Organization = workshop.Organization,
                Venue = workshop.Venue,
                StartDate = workshop.StartDate,
                EndDate = workshop.EndDate,
                StartTime = workshop.StartTime,
                EndTime = workshop.EndTime,
                Category = workshop.Category,
                TargetRoleType = workshop.TargetRoleType,
                Branch = workshop.Branch,
                Status = workshop.Status,
                AttendanceRate = rate,
                CreatedAt = workshop.CreatedAt,
                Participants = workshop.Participants?.Select(MapToParticipationResponse).ToList() ?? new()
            };
        }

        private AssessmentResponseDto MapToAssessmentResponse(EmployeeCompetencyAssessment assessment)
        {
            return new AssessmentResponseDto
            {
                AssessmentId = assessment.AssessmentId,
                AssessmentName = assessment.AssessmentName,
                AssessmentType = assessment.AssessmentType,
                AssessmentCategory = assessment.AssessmentCategory,
                TotalMarks = assessment.TotalMarks,
                PassingMarks = assessment.PassingMarks,
                GradingScheme = assessment.GradingScheme,
                Description = assessment.Description,
                AssessmentInstructions = assessment.AssessmentInstructions,
                EmployeeTypeFilter = assessment.EmployeeTypeFilter,
                BranchFilter = assessment.BranchFilter,
                DepartmentFilter = assessment.DepartmentFilter,
                DesignationFilter = assessment.DesignationFilter,
                ScheduledDate = assessment.ScheduledDate,
                StartTime = assessment.StartTime,
                EndTime = assessment.EndTime,
                AssessmentMode = assessment.AssessmentMode,
                Venue = assessment.Venue,
                MainEvaluator = assessment.MainEvaluator,
                CoEvaluator = assessment.CoEvaluator,
                NotifyParticipants = assessment.NotifyParticipants,
                AutoCertificates = assessment.AutoCertificates,
                AddToCalendar = assessment.AddToCalendar,
                PublishImmediately = assessment.PublishImmediately,
                CandidatesCount = assessment.CandidatesCount,
                Status = assessment.Status,
                CreatedAt = assessment.CreatedAt,
                Candidates = assessment.Candidates?.Select(MapToCandidateResponse).ToList() ?? new()
            };
        }

        private AssessmentCandidateResponseDto MapToCandidateResponse(EmployeeAssessmentCandidate c)
        {
            return new AssessmentCandidateResponseDto
            {
                CandidateId = c.CandidateId,
                AssessmentId = c.AssessmentId,
                StaffId = c.StaffId,
                StaffName = c.Staff != null ? $"{c.Staff.FirstName} {c.Staff.LastName}".Trim() : "Staff Member",
                Status = c.Status,
                Score = c.Score,
                Grade = c.Grade,
                Remarks = c.Remarks,
                CertificateIssued = c.CertificateIssued,
                CertificateNumber = c.CertificateNumber,
                IssuedDate = c.IssuedDate
            };
        }

        private ParticipationResponseDto MapToParticipationResponse(FacultyTrainingParticipation p)
        {
            return new ParticipationResponseDto
            {
                ParticipationId = p.ParticipationId,
                WorkshopId = p.WorkshopId,
                StaffId = p.StaffId,
                StaffName = p.Staff != null ? $"{p.Staff.FirstName} {p.Staff.LastName}".Trim() : "Staff Member",
                RegistrationStatus = p.RegistrationStatus,
                AssessmentScore = p.AssessmentScore,
                CertificateIssued = p.CertificateIssued,
                CertificateNumber = p.CertificateNumber,
                IssuedDate = p.IssuedDate
            };
        }

        private void ValidateGradingScheme(string gradingScheme)
        {
            var allowedSchemes = new List<string>
            {
                "Letter Grade (A+, A, B, C, F)",
                "Percentage (%)",
                "Pass / Fail Only"
            };

            if (!allowedSchemes.Contains(gradingScheme))
            {
                throw new AppException(
                    $"Invalid grading scheme '{gradingScheme}'. Allowed values are: {string.Join(", ", allowedSchemes)}", 
                    HttpStatusCode.BadRequest);
            }
        }

        // ==========================================
        // Dropdown / Lookups
        // ==========================================
        public async Task<List<string>> GetAssessmentTypesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Subject Knowledge Test",
                "Teaching Competency",
                "Practical Demonstration",
                "Classroom Observation",
                "Viva / Interview",
                "Online Assessment",
                "Offline Assessment",
                "Digital Skills Test",
                "Safety Assessment",
                "Internal Promotion Assessment",
                "Compliance Assessment",
                "Custom Assessment"
            });
        }

        public async Task<List<string>> GetAssessmentCategoriesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Knowledge",
                "Practical",
                "Observation",
                "Interview",
                "Certification",
                "Performance Evaluation",
                "Validation"
            });
        }

        public async Task<List<string>> GetGradingSchemesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Letter Grade (A+, A, B, C, F)",
                "Percentage (%)",
                "Pass / Fail Only"
            });
        }

        public async Task<List<string>> GetEmployeeTypesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Teaching Staff",
                "Non-Teaching Staff",
                "Both (All Staff)"
            });
        }

        public async Task<List<string>> GetBranchesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Main Campus",
                "North Branch",
                "West Campus",
                "All Branches"
            });
        }

        public async Task<List<string>> GetDepartmentsAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "All Departments",
                "Academics",
                "Mathematics",
                "Science",
                "Administration"
            });
        }

        public async Task<List<string>> GetDesignationsAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "All Designations",
                "Senior PGT Teacher",
                "TGT Teacher",
                "PRT Teacher",
                "Support Staff"
            });
        }

        public async Task<List<string>> GetAssessmentModesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Offline (Exam Hall)",
                "Online (Computer Portal)",
                "Practical Demonstration",
                "Classroom Observation"
            });
        }

        public async Task<List<string>> GetWorkshopCategoriesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Faculty Development Program (FDP)",
                "Subject Training",
                "Teaching Methodology",
                "Classroom Management",
                "Smart Classroom Training",
                "ERP Training",
                "AI Training",
                "Leadership Training",
                "POCSO Awareness"
            });
        }

        public async Task<List<string>> GetTargetRoleTypesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Teaching Staff",
                "Non-Teaching"
            });
        }

        public async Task<List<string>> GetAttendanceStatusesAsync()
        {
            return await Task.FromResult(new List<string>
            {
                "Present",
                "Absent",
                "Excused",
                "Pending"
            });
        }

        public async Task<WorkshopResponseDto> RecordWorkshopAttendanceAsync(int workshopId, RecordWorkshopAttendanceDto dto)
        {
            var workshop = await _repository.GetWorkshopByIdAsync(workshopId);
            if (workshop == null)
            {
                throw new AppException("Workshop not found.", HttpStatusCode.NotFound);
            }

            foreach (var record in dto.AttendanceRecords)
            {
                var participation = await _repository.GetParticipationAsync(workshopId, record.StaffId);
                if (participation == null)
                {
                    participation = new FacultyTrainingParticipation
                    {
                        WorkshopId = workshopId,
                        StaffId = record.StaffId,
                        RegistrationStatus = record.Status,
                        CertificateIssued = false
                    };
                    await _repository.AddParticipationAsync(participation);
                }
                else
                {
                    participation.RegistrationStatus = record.Status;
                    await _repository.UpdateParticipationAsync(participation);
                }
            }

            await _repository.SaveChangesAsync();

            var reloaded = await _repository.GetWorkshopByIdAsync(workshopId);
            return MapToWorkshopResponse(reloaded ?? workshop);
        }

        public async Task<AssessmentResponseDto> PublishAssessmentResultsAsync(int assessmentId, PublishAssessmentResultsDto dto)
        {
            var assessment = await _repository.GetAssessmentByIdAsync(assessmentId);
            if (assessment == null)
            {
                throw new AppException("Assessment not found.", HttpStatusCode.NotFound);
            }

            foreach (var result in dto.Results)
            {
                var candidate = await _repository.GetCandidateAsync(assessmentId, result.StaffId);
                if (candidate == null)
                {
                    candidate = new EmployeeAssessmentCandidate
                    {
                        AssessmentId = assessmentId,
                        StaffId = result.StaffId,
                        CertificateIssued = false
                    };
                    await _repository.AddCandidateAsync(candidate);
                }

                candidate.Score = result.Score;
                candidate.Remarks = result.Remarks;
                candidate.Status = "Completed";

                // Enforce pass/fail
                bool isPassed = result.Score >= assessment.PassingMarks;
                if (isPassed)
                {
                    candidate.Grade = "Pass";
                    if (assessment.AutoCertificates && !candidate.CertificateIssued)
                    {
                        candidate.CertificateIssued = true;
                        candidate.IssuedDate = DateTime.UtcNow;
                        candidate.CertificateNumber = $"CERT-COMP-{DateTime.UtcNow.Year}-{new Random().Next(1000, 9999)}";
                    }
                }
                else
                {
                    candidate.Grade = "Fail";
                }
            }

            assessment.Status = "Completed";
            await _repository.UpdateAssessmentAsync(assessment);
            await _repository.SaveChangesAsync();

            var reloaded = await _repository.GetAssessmentByIdAsync(assessmentId);
            return MapToAssessmentResponse(reloaded ?? assessment);
        }

        public async Task<List<IssuedCertificateResponseDto>> GetIssuedCertificatesAsync()
        {
            var participations = await _repository.GetIssuedWorkshopCertificatesAsync();
            var candidates = await _repository.GetIssuedAssessmentCertificatesAsync();

            var list = new List<IssuedCertificateResponseDto>();

            list.AddRange(participations.Select(p => new IssuedCertificateResponseDto
            {
                CertificateNumber = p.CertificateNumber ?? string.Empty,
                StaffId = p.StaffId,
                EmployeeName = p.Staff != null ? $"{p.Staff.FirstName} {p.Staff.LastName}".Trim() : "Staff Member",
                ProgramId = p.WorkshopId,
                ProgramName = p.Workshop?.Title ?? "Workshop Program",
                ProgramType = "Workshop",
                CompletionDate = p.IssuedDate ?? (p.Workshop?.EndDate ?? DateTime.UtcNow),
                Status = "Issued"
            }));

            list.AddRange(candidates.Select(c => new IssuedCertificateResponseDto
            {
                CertificateNumber = c.CertificateNumber ?? string.Empty,
                StaffId = c.StaffId,
                EmployeeName = c.Staff != null ? $"{c.Staff.FirstName} {c.Staff.LastName}".Trim() : "Staff Member",
                ProgramId = c.AssessmentId,
                ProgramName = c.Assessment?.AssessmentName ?? "Assessment Evaluation",
                ProgramType = "Assessment",
                CompletionDate = c.IssuedDate ?? (c.Assessment?.ScheduledDate ?? DateTime.UtcNow),
                Status = "Issued"
            }));

            return list.OrderByDescending(x => x.CompletionDate).ToList();
        }

        public async Task<IssuedCertificateResponseDto?> GetCertificateByNoAsync(string certNo)
        {
            var participations = await _repository.GetIssuedWorkshopCertificatesAsync();
            var p = participations.FirstOrDefault(x => x.CertificateNumber == certNo);
            if (p != null)
            {
                return new IssuedCertificateResponseDto
                {
                    CertificateNumber = p.CertificateNumber ?? string.Empty,
                    StaffId = p.StaffId,
                    EmployeeName = p.Staff != null ? $"{p.Staff.FirstName} {p.Staff.LastName}".Trim() : "Staff Member",
                    ProgramId = p.WorkshopId,
                    ProgramName = p.Workshop?.Title ?? "Workshop Program",
                    ProgramType = "Workshop",
                    CompletionDate = p.IssuedDate ?? (p.Workshop?.EndDate ?? DateTime.UtcNow),
                    Status = "Issued"
                };
            }

            var candidates = await _repository.GetIssuedAssessmentCertificatesAsync();
            var c = candidates.FirstOrDefault(x => x.CertificateNumber == certNo);
            if (c != null)
            {
                return new IssuedCertificateResponseDto
                {
                    CertificateNumber = c.CertificateNumber ?? string.Empty,
                    StaffId = c.StaffId,
                    EmployeeName = c.Staff != null ? $"{c.Staff.FirstName} {c.Staff.LastName}".Trim() : "Staff Member",
                    ProgramId = c.AssessmentId,
                    ProgramName = c.Assessment?.AssessmentName ?? "Assessment Evaluation",
                    ProgramType = "Assessment",
                    CompletionDate = c.IssuedDate ?? (c.Assessment?.ScheduledDate ?? DateTime.UtcNow),
                    Status = "Issued"
                };
            }

            return null;
        }

        public async Task<DevelopmentReportsSummaryDto> GetDevelopmentReportsSummaryAsync()
        {
            var workshops = await _repository.GetAllWorkshopsAsync();
            var assessments = await _repository.GetAllAssessmentsAsync();

            var workshopSummaries = workshops.Select(w =>
            {
                decimal rate = 100m; // Default to 100% if no participants registered (like POCSO)
                if (w.Participants != null && w.Participants.Count > 0)
                {
                    int total = w.Participants.Count;
                    int present = w.Participants.Count(p => p.RegistrationStatus == "Present" || p.RegistrationStatus == "Attended");
                    rate = Math.Round(((decimal)present / total) * 100, 2);
                }
                return new WorkshopReportSummaryDto
                {
                    WorkshopId = w.WorkshopId,
                    Title = w.Title,
                    EnrolledCount = w.Participants?.Count ?? 0,
                    AttendanceRate = rate
                };
            }).ToList();

            var assessmentSummaries = assessments.Select(a =>
            {
                int total = a.Candidates?.Count ?? 0;
                int passed = a.Candidates?.Count(c => c.Grade == "Pass") ?? 0;
                return new AssessmentReportSummaryDto
                {
                    AssessmentId = a.AssessmentId,
                    AssessmentName = a.AssessmentName,
                    PassedCount = passed,
                    TotalCandidates = total
                };
            }).ToList();

            return new DevelopmentReportsSummaryDto
            {
                WorkshopParticipationSummary = workshopSummaries,
                AssessmentPassFailBreakdown = assessmentSummaries
            };
        }

        public async Task<string> ExportReportsCsvAsync()
        {
            var summary = await GetDevelopmentReportsSummaryAsync();
            var csv = new System.Text.StringBuilder();

            // Header
            csv.AppendLine("Program Type,Program Name,Enrolled / Candidates,Metrics");

            // Workshops
            foreach (var w in summary.WorkshopParticipationSummary)
            {
                csv.AppendLine($"Workshop,\"{w.Title.Replace("\"", "\"\"")}\",{w.EnrolledCount},{w.AttendanceRate}% Attended");
            }

            // Assessments
            foreach (var a in summary.AssessmentPassFailBreakdown)
            {
                csv.AppendLine($"Assessment,\"{a.AssessmentName.Replace("\"", "\"\"")}\",{a.TotalCandidates},{a.PassedCount} / {a.TotalCandidates} Passed");
            }

            return csv.ToString();
        }

        public async Task<List<FacultyStaffDropdownDto>> GetStaffDropdownAsync()
        {
            var staffList = await _repository.GetAllStaffForDropdownAsync();
            return staffList.Select(s => new FacultyStaffDropdownDto
            {
                StaffId = s.StaffId,
                FullName = $"{s.FirstName} {s.LastName}".Trim(),
                PrimarySubject = s.PrimarySubject,
                Designation = s.Designation,
                Department = s.Department
            }).ToList();
        }

        public async Task<StaffDevelopmentProfileDto> GetStaffDevelopmentProfileAsync(int staffId)
        {
            var staffList = await _repository.GetAllStaffForDropdownAsync();
            var staff = staffList.FirstOrDefault(s => s.StaffId == staffId);
            if (staff == null)
            {
                throw new AppException("Staff member not found.", HttpStatusCode.NotFound);
            }

            var participations = await _repository.GetParticipationsByStaffIdAsync(staffId);
            var candidates = await _repository.GetCandidatesByStaffIdAsync(staffId);

            var workshopLogs = participations.Select(p => new StaffWorkshopLogDto
            {
                WorkshopId = p.WorkshopId,
                Title = p.Workshop?.Title ?? "Workshop",
                Status = p.RegistrationStatus,
                CompletionDate = p.IssuedDate ?? (p.Workshop?.EndDate ?? DateTime.UtcNow)
            }).ToList();

            var assessmentLogs = candidates.Select(c => new StaffAssessmentLogDto
            {
                AssessmentId = c.AssessmentId,
                AssessmentName = c.Assessment?.AssessmentName ?? "Assessment",
                Score = c.Score,
                Grade = c.Grade,
                Status = c.Status,
                ScheduledDate = c.IssuedDate ?? (c.Assessment?.ScheduledDate ?? DateTime.UtcNow)
            }).ToList();

            var certs = new List<StaffCertificateLogDto>();
            certs.AddRange(participations.Where(p => p.CertificateIssued && p.CertificateNumber != null).Select(p => new StaffCertificateLogDto
            {
                CertificateNumber = p.CertificateNumber!,
                ProgramName = p.Workshop?.Title ?? "Workshop",
                ProgramType = "Workshop",
                IssuedDate = p.IssuedDate
            }));
            certs.AddRange(candidates.Where(c => c.CertificateIssued && c.CertificateNumber != null).Select(c => new StaffCertificateLogDto
            {
                CertificateNumber = c.CertificateNumber!,
                ProgramName = c.Assessment?.AssessmentName ?? "Assessment",
                ProgramType = "Assessment",
                IssuedDate = c.IssuedDate
            }));

            return new StaffDevelopmentProfileDto
            {
                StaffId = staff.StaffId,
                FullName = $"{staff.FirstName} {staff.LastName}".Trim(),
                Designation = staff.Designation,
                Department = staff.Department,
                PrimarySubject = staff.PrimarySubject,
                AvatarUrl = staff.Gender == "Female" ? "/assets/images/avatar-female.png" : "/assets/images/avatar-male.png",
                WorkshopsAttended = workshopLogs,
                CompetencyAssessments = assessmentLogs,
                EarnedCertificates = certs
            };
        }
    }
}
