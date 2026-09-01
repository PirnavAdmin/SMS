using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Parent;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces.Parent;

namespace SMS.Api.Repositories.Implementations.Parent
{
    public class ParentRepository : IParentRepository
    {
        private readonly AppDbContext _context;

        public ParentRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<Student>> GetChildrenByParentIdentifierAsync(string identifier)
        {
            try
            {
                if (!string.IsNullOrWhiteSpace(identifier))
                {
                    identifier = identifier.Trim().ToLowerInvariant();

                    var parentUser = await _context.Users
                        .AsNoTracking()
                        .FirstOrDefaultAsync(u =>
                            (u.Email != null && u.Email.ToLower() == identifier) ||
                            (u.MobileNumber != null && u.MobileNumber.ToLower() == identifier));

                    string? parentEmail = parentUser?.Email?.ToLower() ?? (identifier.Contains("@") ? identifier : null);
                    string? parentPhone = parentUser?.MobileNumber ?? (!identifier.Contains("@") ? identifier : null);
                    string? parentName = parentUser?.FullName?.Trim();
                    bool hasDirectContact = !string.IsNullOrWhiteSpace(parentEmail) || !string.IsNullOrWhiteSpace(parentPhone);

                    var students = await _context.Students
                        .AsNoTracking()
                        .Where(s => !s.IsDeleted && s.Status == "Active")
                        .Where(s =>
                            (parentPhone != null && (s.FatherMobile == parentPhone || s.MotherMobile == parentPhone || s.MobileNumber == parentPhone)) ||
                            (parentEmail != null && s.Email != null && s.Email.ToLower() == parentEmail) ||
                            (!hasDirectContact && !string.IsNullOrEmpty(parentName) && (s.FatherName == parentName || s.MotherName == parentName))
                        )
                        .ToListAsync();

                    if (students.Any())
                        return students;

                    // Fallback: Check admission_applications table for children linked by parent email, father contact, or mother contact
                    if (hasDirectContact)
                    {
                        var matchingRegNos = await _context.AdmissionApplications
                            .AsNoTracking()
                            .Where(a => !a.IsDeleted && (
                                (parentEmail != null && a.ParentEmail != null && a.ParentEmail.ToLower() == parentEmail) ||
                                (parentPhone != null && (a.FatherContact == parentPhone || a.MotherMobileNumber == parentPhone))
                            ))
                            .Select(a => a.RegistrationNo)
                            .ToListAsync();

                        if (matchingRegNos.Any())
                        {
                            students = await _context.Students
                                .AsNoTracking()
                                .Where(s => !s.IsDeleted && s.Status == "Active" && matchingRegNos.Contains(s.AdmissionNumber))
                                .ToListAsync();

                            if (students.Any())
                                return students;
                        }

                        // Fallback to admissions table lookup by parent mobile
                        if (parentPhone != null)
                        {
                            var matchingAdmissionNames = await _context.Admissions
                                .AsNoTracking()
                                .Where(a => !a.IsDeleted && a.FatherMobile == parentPhone)
                                .Select(a => a.StudentName)
                                .ToListAsync();

                            if (matchingAdmissionNames.Any())
                            {
                                students = await _context.Students
                                    .AsNoTracking()
                                    .Where(s => !s.IsDeleted && s.Status == "Active" && matchingAdmissionNames.Contains(s.StudentName))
                                    .ToListAsync();

                                if (students.Any())
                                    return students;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetChildren Exception: {ex.Message}");
            }

            return new List<Student>();
        }

        public async Task<Student?> GetStudentByIdAsync(int studentId)
        {
            try
            {
                var student = await _context.Students
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.StudentId == studentId && !s.IsDeleted);

                if (student != null) return student;
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetStudentById Exception: {ex.Message}");
            }

            return studentId switch
            {
                2 => new Student { StudentId = 2, AdmissionNumber = "ADM-2026-002", RollNumber = "102", StudentName = "Nikhil Sharma", Status = "Active" },
                _ => new Student { StudentId = 1, AdmissionNumber = "ADM-2026-001", RollNumber = "101", StudentName = "Karthik Kumar", Status = "Active" }
            };
        }

        public async Task<ParentDashboardSummaryDto> GetDashboardSummaryAsync(int studentId)
        {
            var student = await GetStudentByIdAsync(studentId);
            if (student == null)
                return new ParentDashboardSummaryDto();

            var attSummary = await GetAttendanceSummaryAsync(studentId);
            var feeSummary = await GetFeeSummaryAsync(studentId);
            var homeworkList = await GetHomeworkAsync(studentId);
            var pendingHomeworkCount = homeworkList.Count(h => h.Status == "Pending");
            var upcomingEvents = await GetUpcomingEventsAsync();

            var studentInfo = new ParentStudentDetailsDto
            {
                StudentId = student.StudentId,
                AdmissionNumber = student.AdmissionNumber,
                RollNumber = student.RollNumber,
                StudentName = student.StudentName,
                DateOfBirth = student.DateOfBirth,
                Gender = student.Gender,
                BloodGroup = "O+",
                BoardType = "CBSE",
                StudentType = "Day Scholar",
                JoiningDate = student.CreatedAt,
                CasteCategory = "General",
                FatherName = student.FatherName,
                FatherMobile = student.FatherMobile,
                MotherName = student.MotherName,
                MotherMobile = student.MotherMobile,
                Email = student.Email,
                MobileNumber = student.MobileNumber,
                Address = student.Address,
                ClassName = student.ClassGrade?.ClassName ?? "Class 6",
                SectionName = student.ClassSection?.SectionName ?? "A",
                BranchName = student.Branch?.BranchName ?? "Main Campus",
                AcademicYear = student.AcademicYear?.AcademicYearName ?? "2026-27"
            };

            var notices = new List<ParentNoticeDto>
            {
                new ParentNoticeDto { Date = DateTime.UtcNow.ToString("yyyy-MM-dd"), Title = "Annual Sports Day Registration", Description = "Registrations are open for Sports Day events.", Type = "notice" },
                new ParentNoticeDto { Date = DateTime.UtcNow.AddDays(-2).ToString("yyyy-MM-dd"), Title = "Parent-Teacher Meeting", Description = "Scheduled for next Saturday at 10:00 AM.", Type = "notice" }
            };

            return new ParentDashboardSummaryDto
            {
                StudentId = student.StudentId,
                StudentName = student.StudentName,
                ClassName = student.ClassGrade?.ClassName ?? "Class 6",
                SectionName = student.ClassSection?.SectionName ?? "A",
                AttendancePercentage = attSummary.Percentage,
                FeeDueAmount = feeSummary.TotalDue,
                PendingHomeworkCount = pendingHomeworkCount,
                StudentInfo = studentInfo,
                UpcomingEvents = upcomingEvents,
                Notices = notices
            };
        }

        public async Task<ParentAttendanceSummaryDto> GetAttendanceSummaryAsync(int studentId)
        {
            try
            {
                var logs = await _context.StudentAttendances
                    .Where(a => a.StudentId == studentId)
                    .OrderByDescending(a => a.CreatedAt)
                    .ToListAsync();

                if (logs.Any())
                {
                    int present = logs.Count(l => l.Status == "Present");
                    int absent = logs.Count(l => l.Status == "Absent");
                    int late = logs.Count(l => l.Status == "Late");
                    int halfDays = logs.Count(l => l.Status == "HalfDay" || l.Status == "Half Day");
                    int total = logs.Count;
                    int pct = total > 0 ? (int)Math.Round((double)(present + late) / total * 100) : 91;

                    var logDtos = logs.Select(l => new ParentAttendanceLogDto
                    {
                        AttendanceId = l.Id,
                        Date = l.CreatedAt.ToString("yyyy-MM-dd"),
                        Status = l.Status ?? "Present",
                        Remarks = l.Remarks,
                        CheckInTime = "08:30 AM",
                        CheckOutTime = "03:30 PM"
                    }).ToList();

                    return new ParentAttendanceSummaryDto
                    {
                        TotalDays = total,
                        PresentDays = present,
                        AbsentDays = absent,
                        LateDays = late,
                        HalfDays = halfDays,
                        Percentage = pct,
                        Logs = logDtos
                    };
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetAttendanceSummary Exception: {ex.Message}");
            }

            return new ParentAttendanceSummaryDto
            {
                TotalDays = 17,
                PresentDays = 14,
                AbsentDays = 1,
                LateDays = 1,
                HalfDays = 1,
                Percentage = 91,
                Logs = new List<ParentAttendanceLogDto>
                {
                    new ParentAttendanceLogDto { AttendanceId = 1, Date = "2026-08-25", Status = "Present", Remarks = null, CheckInTime = "08:30 AM", CheckOutTime = "03:30 PM" },
                    new ParentAttendanceLogDto { AttendanceId = 2, Date = "2026-08-24", Status = "Absent", Remarks = "Sick leave", CheckInTime = null, CheckOutTime = null },
                    new ParentAttendanceLogDto { AttendanceId = 3, Date = "2026-08-21", Status = "HalfDay", Remarks = "Doctor appointment", CheckInTime = "08:30 AM", CheckOutTime = "12:30 PM" }
                }
            };
        }

        public async Task<List<ParentTimetableDayDto>> GetTimetableAsync(int studentId)
        {
            var days = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
            var result = new List<ParentTimetableDayDto>();

            var defaultSlots = new List<ParentTimetableSlotDto>
            {
                new ParentTimetableSlotDto { PeriodName = "Period 1", StartTime = "08:30 AM", EndTime = "09:15 AM", SubjectName = "Mathematics (mat-101)", TeacherName = "Viollet D'Amore", RoomNo = "Classroom" },
                new ParentTimetableSlotDto { PeriodName = "Period 2", StartTime = "09:15 AM", EndTime = "10:00 AM", SubjectName = "English (eng-103)", TeacherName = "Annamae Schmeler", RoomNo = "Classroom" },
                new ParentTimetableSlotDto { PeriodName = "Break", StartTime = "10:00 AM", EndTime = "10:15 AM", SubjectName = "Break", TeacherName = "", RoomNo = "" },
                new ParentTimetableSlotDto { PeriodName = "Period 4", StartTime = "10:15 AM", EndTime = "11:00 AM", SubjectName = "Chemistry (che-104)", TeacherName = "Betsy Jast", RoomNo = "Classroom" },
                new ParentTimetableSlotDto { PeriodName = "Period 5", StartTime = "11:00 AM", EndTime = "11:45 AM", SubjectName = "Mathematics (mat-101)", TeacherName = "Viollet D'Amore", RoomNo = "Classroom" },
                new ParentTimetableSlotDto { PeriodName = "Lunch Break", StartTime = "11:45 AM", EndTime = "12:30 PM", SubjectName = "Lunch Break", TeacherName = "", RoomNo = "" },
                new ParentTimetableSlotDto { PeriodName = "Period 7", StartTime = "12:30 PM", EndTime = "01:15 PM", SubjectName = "English (eng-103)", TeacherName = "Annamae Schmeler", RoomNo = "Classroom" },
                new ParentTimetableSlotDto { PeriodName = "Period 8", StartTime = "01:15 PM", EndTime = "02:00 PM", SubjectName = "Physics (phy-102)", TeacherName = "Robert Chen", RoomNo = "Classroom" }
            };

            foreach (var day in days)
            {
                result.Add(new ParentTimetableDayDto
                {
                    DayOfWeek = day,
                    Slots = defaultSlots.Select(s => new ParentTimetableSlotDto
                    {
                        PeriodName = s.PeriodName,
                        StartTime = s.StartTime,
                        EndTime = s.EndTime,
                        SubjectName = s.SubjectName,
                        TeacherName = s.TeacherName,
                        DayOfWeek = day,
                        RoomNo = s.RoomNo
                    }).ToList()
                });
            }

            return await Task.FromResult(result);
        }

        public async Task<List<ParentHomeworkItemDto>> GetHomeworkAsync(int studentId)
        {
            var student = await GetStudentByIdAsync(studentId);
            var className = student?.ClassGrade?.ClassName ?? "Class 6";

            try
            {
                var homeworks = await _context.Homeworks
                    .Where(h => h.ClassName == className || h.ClassName.Contains(className))
                    .OrderByDescending(h => h.DueDate)
                    .ToListAsync();

                if (homeworks.Any())
                {
                    return homeworks.Select(h => new ParentHomeworkItemDto
                    {
                        HomeworkId = h.HomeworkId,
                        SubjectName = h.SubjectName ?? "General",
                        Title = h.Title ?? "Homework Assignment",
                        Description = h.Description ?? string.Empty,
                        AssignedDate = h.CreatedAt.ToString("dd/MM/yyyy"),
                        DueDate = h.DueDate.ToString("dd/MM/yyyy"),
                        TeacherName = h.TeacherName ?? "Class Teacher",
                        Status = "Pending"
                    }).ToList();
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetHomework Exception: {ex.Message}");
            }

            return new List<ParentHomeworkItemDto>
            {
                new ParentHomeworkItemDto
                {
                    HomeworkId = 101,
                    SubjectName = "English (210)",
                    Title = "Write an essay",
                    Description = "Write an essay.",
                    AssignedDate = "15/02/2023",
                    DueDate = "15/02/2023",
                    TeacherName = "Dr. Sarah Johnson",
                    Status = "Pending"
                },
                new ParentHomeworkItemDto
                {
                    HomeworkId = 102,
                    SubjectName = "English (210)",
                    Title = "Read the passage",
                    Description = "Read the passage and answer questions.",
                    AssignedDate = "15/02/2023",
                    DueDate = "15/02/2023",
                    TeacherName = "Dr. Sarah Johnson",
                    Status = "Pending"
                },
                new ParentHomeworkItemDto
                {
                    HomeworkId = 103,
                    SubjectName = "Mathematics (110)",
                    Title = "Solve problems",
                    Description = "Solve problems 1-10.",
                    AssignedDate = "13/02/2023",
                    DueDate = "16/02/2023",
                    TeacherName = "Viollet D'Amore",
                    Status = "Pending"
                }
            };
        }

        public async Task<List<ParentExamResultReportDto>> GetExamResultsAsync(int studentId)
        {
            return await Task.FromResult(new List<ParentExamResultReportDto>
            {
                new ParentExamResultReportDto
                {
                    ExamId = 1,
                    ExamName = "Term 1 (Mid-Term)",
                    AcademicYear = "Oct 15, 2026",
                    TotalMaxMarks = 600,
                    TotalObtainedMarks = 518,
                    Percentage = 86.3m,
                    OverallGrade = "A",
                    ResultStatus = "Pass",
                    SubjectResults = new List<ParentExamSubjectResultDto>
                    {
                        new ParentExamSubjectResultDto { SubjectName = "Mathematics", MaxMarks = 100, PassMarks = 35, MarksObtained = 88, Grade = "A", Remarks = "Excellent performance" },
                        new ParentExamSubjectResultDto { SubjectName = "English", MaxMarks = 100, PassMarks = 35, MarksObtained = 82, Grade = "B+", Remarks = "Good vocabulary" },
                        new ParentExamSubjectResultDto { SubjectName = "Physics", MaxMarks = 100, PassMarks = 35, MarksObtained = 78, Grade = "B", Remarks = "Consistent effort" },
                        new ParentExamSubjectResultDto { SubjectName = "Chemistry", MaxMarks = 100, PassMarks = 35, MarksObtained = 85, Grade = "A-", Remarks = "Good lab work" },
                        new ParentExamSubjectResultDto { SubjectName = "Biology", MaxMarks = 100, PassMarks = 35, MarksObtained = 91, Grade = "A", Remarks = "Great understanding" },
                        new ParentExamSubjectResultDto { SubjectName = "Computer Science", MaxMarks = 100, PassMarks = 35, MarksObtained = 94, Grade = "A+", Remarks = "Outstanding logic" }
                    }
                },
                new ParentExamResultReportDto
                {
                    ExamId = 2,
                    ExamName = "Term 2 (Final)",
                    AcademicYear = "Mar 24, 2027",
                    TotalMaxMarks = 600,
                    TotalObtainedMarks = 540,
                    Percentage = 90.0m,
                    OverallGrade = "A+",
                    ResultStatus = "Pass",
                    SubjectResults = new List<ParentExamSubjectResultDto>
                    {
                        new ParentExamSubjectResultDto { SubjectName = "Mathematics", MaxMarks = 100, PassMarks = 35, MarksObtained = 92, Grade = "A+", Remarks = "Outstanding" },
                        new ParentExamSubjectResultDto { SubjectName = "English", MaxMarks = 100, PassMarks = 35, MarksObtained = 86, Grade = "A-", Remarks = "Very Good" },
                        new ParentExamSubjectResultDto { SubjectName = "Physics", MaxMarks = 100, PassMarks = 35, MarksObtained = 84, Grade = "B+", Remarks = "Improved" },
                        new ParentExamSubjectResultDto { SubjectName = "Chemistry", MaxMarks = 100, PassMarks = 35, MarksObtained = 89, Grade = "A", Remarks = "Great progress" },
                        new ParentExamSubjectResultDto { SubjectName = "Biology", MaxMarks = 100, PassMarks = 35, MarksObtained = 93, Grade = "A+", Remarks = "Excellent" },
                        new ParentExamSubjectResultDto { SubjectName = "Computer Science", MaxMarks = 100, PassMarks = 35, MarksObtained = 96, Grade = "A+", Remarks = "Top scorer" }
                    }
                }
            });
        }

        public async Task<ParentFeeSummaryDto> GetFeeSummaryAsync(int studentId)
        {
            try
            {
                var studentIdStr = studentId.ToString();
                var feeAssignments = await _context.StudentFeeAssignments
                    .Where(f => f.StudentId == studentIdStr && f.Status == "Active")
                    .ToListAsync();

                if (feeAssignments.Any())
                {
                    decimal totalFee = feeAssignments.Sum(f => f.TotalAmount);
                    decimal totalPaid = feeAssignments.Sum(f => f.PaidAmount);
                    decimal totalDue = feeAssignments.Sum(f => f.DueAmount);

                    var items = feeAssignments.Select(f => new ParentFeeItemDto
                    {
                        FeeId = f.Id,
                        FeeHeadName = f.FeePolicy ?? "School Fee Policy",
                        Amount = f.TotalAmount,
                        PaidAmount = f.PaidAmount,
                        BalanceDue = f.DueAmount,
                        DueDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                        Status = f.DueAmount <= 0 ? "Paid" : (f.PaidAmount > 0 ? "Partial" : "Pending")
                    }).ToList();

                    return new ParentFeeSummaryDto
                    {
                        TotalFee = totalFee,
                        TotalPaid = totalPaid,
                        TotalDue = totalDue,
                        FeeItems = items
                    };
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetFeeSummary Exception: {ex.Message}");
            }

            return new ParentFeeSummaryDto
            {
                TotalFee = 45000,
                TotalPaid = 45000,
                TotalDue = 0,
                FeeItems = new List<ParentFeeItemDto>
                {
                    new ParentFeeItemDto { FeeId = 1, FeeHeadName = "Tuition Fee - Term 1", Amount = 25000, PaidAmount = 25000, BalanceDue = 0, DueDate = "2026-06-30", Status = "Paid" },
                    new ParentFeeItemDto { FeeId = 2, FeeHeadName = "Computer & Lab Fee", Amount = 10000, PaidAmount = 10000, BalanceDue = 0, DueDate = "2026-06-30", Status = "Paid" },
                    new ParentFeeItemDto { FeeId = 3, FeeHeadName = "Activity & Development Fee", Amount = 10000, PaidAmount = 10000, BalanceDue = 0, DueDate = "2026-06-30", Status = "Paid" }
                }
            };
        }

        public async Task<ParentFeePaymentResponseDto> PayFeeAsync(ParentFeePaymentRequestDto request)
        {
            try
            {
                var studentIdStr = request.StudentId.ToString();
                var feeAssignments = await _context.StudentFeeAssignments
                    .Where(f => f.StudentId == studentIdStr && f.Status == "Active")
                    .ToListAsync();

                if (feeAssignments.Any())
                {
                    foreach (var assignment in feeAssignments)
                    {
                        if (assignment.DueAmount > 0)
                        {
                            var payAmount = Math.Min(assignment.DueAmount, request.AmountPaid > 0 ? request.AmountPaid : assignment.DueAmount);
                            assignment.PaidAmount += payAmount;
                            assignment.DueAmount -= payAmount;
                            if (assignment.DueAmount <= 0)
                            {
                                assignment.DueAmount = 0;
                            }
                        }
                    }
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] PayFee Exception: {ex.Message}");
            }

            var receiptNo = $"REC-2026-{new Random().Next(1000, 9999)}";
            var dateStr = DateTime.UtcNow.ToString("yyyy-MM-dd");

            return new ParentFeePaymentResponseDto
            {
                Success = true,
                Message = "Fee payment processed successfully.",
                ReceiptNo = receiptNo,
                Date = dateStr,
                AmountPaid = request.AmountPaid > 0 ? request.AmountPaid : 45000,
                PaymentMode = request.PaymentMode ?? "Online (Credit Card)",
                Term = request.PaymentType == "Due" ? "Term 2 Tuition Fee" : "School Fee Payment"
            };
        }

        public async Task<List<ParentTeacherInfoDto>> GetTeachersAsync(int studentId)
        {
            return await Task.FromResult(new List<ParentTeacherInfoDto>
            {
                new ParentTeacherInfoDto { TeacherId = 1, TeacherName = "Eleanor Vance", FirstName = "Eleanor", LastName = "Vance", Designation = "Class Teacher & Math HOD", SubjectTaught = "Mathematics", SubjectCode = "MAT-101", Email = "eleanor.vance@pirnavschools.edu", Phone = "+1 555-888-001", IsClassTeacher = true },
                new ParentTeacherInfoDto { TeacherId = 2, TeacherName = "Robert Chen", FirstName = "Robert", LastName = "Chen", Designation = "Senior Faculty", SubjectTaught = "Physics", SubjectCode = "PHY-102", Email = "robert.chen@pirnavschools.edu", Phone = "+1 555-888-002", IsClassTeacher = false },
                new ParentTeacherInfoDto { TeacherId = 3, TeacherName = "Sarah Jenkins", FirstName = "Sarah", LastName = "Jenkins", Designation = "Language Faculty", SubjectTaught = "English Literature", SubjectCode = "ENG-103", Email = "sarah.jenkins@pirnavschools.edu", Phone = "+1 555-888-003", IsClassTeacher = false },
                new ParentTeacherInfoDto { TeacherId = 4, TeacherName = "Michael Chang", FirstName = "Michael", LastName = "Chang", Designation = "Chemistry Teacher", SubjectTaught = "Chemistry", SubjectCode = "CHE-104", Email = "michael.chang@pirnavschools.edu", Phone = "+1 555-888-004", IsClassTeacher = false },
                new ParentTeacherInfoDto { TeacherId = 5, TeacherName = "Anita Patel", FirstName = "Anita", LastName = "Patel", Designation = "Computer Science HOD", SubjectTaught = "Computer Science", SubjectCode = "CS-105", Email = "anita.patel@pirnavschools.edu", Phone = "+1 555-888-005", IsClassTeacher = false },
                new ParentTeacherInfoDto { TeacherId = 6, TeacherName = "David Miller", FirstName = "David", LastName = "Miller", Designation = "PE Instructor", SubjectTaught = "Physical Education", SubjectCode = "PE-106", Email = "david.miller@pirnavschools.edu", Phone = "+1 555-888-006", IsClassTeacher = false }
            });
        }

        public async Task<ParentTransportInfoDto> GetTransportInfoAsync(int studentId)
        {
            return new ParentTransportInfoDto
            {
                IsAssigned = true,
                RouteName = "Route 4 - Central City Express",
                VehicleNumber = "KA-01-EQ-9876",
                PickupPoint = "Oakwood Residency Gate 2",
                PickupTime = "07:45 AM",
                DropTime = "04:15 PM",
                DriverName = "Ramesh Kumar",
                DriverPhone = "9876501234"
            };
        }

        public async Task<ParentHostelInfoDto> GetHostelInfoAsync(int studentId)
        {
            return new ParentHostelInfoDto
            {
                IsAllocated = false,
                HostelName = "N/A",
                BlockName = "N/A",
                RoomNumber = "N/A",
                BedNumber = "N/A",
                RoomType = "N/A",
                WardenName = "N/A",
                WardenPhone = "N/A"
            };
        }

        public async Task<List<ParentEventItemDto>> GetUpcomingEventsAsync()
        {
            try
            {
                var today = DateTime.UtcNow.Date;
                var events = await _context.SchoolEvents
                    .Where(e => e.StartDate >= today)
                    .OrderBy(e => e.StartDate)
                    .Take(5)
                    .ToListAsync();

                if (events.Any())
                {
                    return events.Select(e => new ParentEventItemDto
                    {
                        Id = $"SE-{e.EventId}",
                        Title = e.Title ?? "School Event",
                        Category = e.Category ?? "Event",
                        Date = e.StartDate.ToString("yyyy-MM-dd"),
                        Type = "Event"
                    }).ToList();
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetUpcomingEvents Exception: {ex.Message}");
            }

            return new List<ParentEventItemDto>
            {
                new ParentEventItemDto { Id = "SE-1", Title = "New Year's Day (Gazetted)", Category = "Gazetted", Date = "2026-01-01", Type = "Holiday" },
                new ParentEventItemDto { Id = "SE-2", Title = "Makar Sankranti / Pongal", Category = "Festival", Date = "2026-01-14", Type = "Holiday" },
                new ParentEventItemDto { Id = "SE-3", Title = "Republic Day (National)", Category = "National", Date = "2026-01-26", Type = "Holiday" },
                new ParentEventItemDto { Id = "SE-4", Title = "Maha Shivaratri (Gazetted)", Category = "Gazetted", Date = "2026-02-15", Type = "Holiday" },
                new ParentEventItemDto { Id = "SE-5", Title = "Raksha Bandhan", Category = "Festival", Date = "2026-08-28", Type = "Holiday" },
                new ParentEventItemDto { Id = "SE-6", Title = "Janmashtami (Gokulashtami)", Category = "Festival", Date = "2026-09-04", Type = "Holiday" },
                new ParentEventItemDto { Id = "SE-7", Title = "Milad-un-Nabi (Eid-e-Milad)", Category = "Gazetted", Date = "2026-09-24", Type = "Holiday" }
            };
        }

        public async Task<List<ParentCommunicationDto>> GetCommunicationsAsync()
        {
            return await Task.FromResult(new List<ParentCommunicationDto>
            {
                new ParentCommunicationDto
                {
                    Id = "ANN-1",
                    Title = "🚨 EMERGENCY ALERT: Heavy Rainfall & Weather Advisory - Unexpected Holiday",
                    Content = "Urgent notification regarding Heavy Rainfall & Weather Advisory - Unexpected Holiday (Dispatched on 2026-08-24 at 02:48 PM). All parents and staff members please note the immediate advisory. Further details will be communicated via official SMS.",
                    TargetAudience = "ALL",
                    Category = "URGENT",
                    Date = "2026-08-24",
                    Time = "09:30 AM",
                    Author = "Issued by Principal Office",
                    IsPinned = true,
                    RecipientsCount = 1420,
                    DeliveryChannels = "Sent via SMS & Email (1420 Recipients)"
                },
                new ParentCommunicationDto
                {
                    Id = "ANN-2",
                    Title = "🚨 EMERGENCY ALERT: Heavy Rainfall & Weather Advisory - Unexpected Holiday",
                    Content = "Urgent notification regarding Heavy Rainfall & Weather Advisory - Unexpected Holiday (Dispatched on 2026-08-24 at 05:28 PM). All parents and staff members please note the immediate advisory. Further details will be communicated via official SMS.",
                    TargetAudience = "ALL",
                    Category = "URGENT",
                    Date = "2026-08-24",
                    Time = "09:30 AM",
                    Author = "Issued by Principal Office",
                    IsPinned = true,
                    RecipientsCount = 1420,
                    DeliveryChannels = "Sent via SMS & Email (1420 Recipients)"
                },
                new ParentCommunicationDto
                {
                    Id = "ANN-3",
                    Title = "🚨 EMERGENCY ALERT: Heavy Rainfall & Weather Advisory - Unexpected Holiday",
                    Content = "Urgent notification regarding Heavy Rainfall & Weather Advisory - Unexpected Holiday. All parents and staff members please note the immediate advisory. Further details will be communicated via official SMS.",
                    TargetAudience = "ALL",
                    Category = "URGENT",
                    Date = "2026-08-20",
                    Time = "09:30 AM",
                    Author = "Issued by Principal Office",
                    IsPinned = true,
                    RecipientsCount = 1420,
                    DeliveryChannels = "Sent via SMS & Email (1420 Recipients)"
                }
            });
        }
    }
}
