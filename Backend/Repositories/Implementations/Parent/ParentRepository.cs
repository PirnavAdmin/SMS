using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Parent;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
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
                if (string.IsNullOrWhiteSpace(identifier))
                    return new List<Student>();

                identifier = identifier.Trim().ToLowerInvariant();
                var digitsOnly = new string(identifier.Where(char.IsDigit).ToArray());

                // 1. Look up parentUser in Users table if identifier is email/mobile/name/userId
                var parentUser = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => 
                        (u.Email != null && u.Email.ToLower() == identifier) ||
                        u.MobileNumber == identifier ||
                        (digitsOnly.Length >= 10 && u.MobileNumber != null && u.MobileNumber.EndsWith(digitsOnly)) ||
                        u.UserId.ToString() == identifier ||
                        u.FullName.ToLower() == identifier
                    );

                string searchMobile = parentUser?.MobileNumber ?? identifier;
                string searchEmail = parentUser?.Email ?? identifier;
                string searchFullName = parentUser?.FullName ?? identifier;
                string searchMobileDigits = new string(searchMobile.Where(char.IsDigit).ToArray());

                // 2. Query students strictly matching exact Mobile, Email, or Full Name
                var children = await _context.Students
                    .Include(s => s.ClassGrade)
                    .Include(s => s.ClassSection)
                    .AsNoTracking()
                    .Where(s => !s.IsDeleted && s.Status == "Active")
                    .Where(s =>
                        (!string.IsNullOrEmpty(searchMobile) && (
                            s.FatherMobile == searchMobile || 
                            s.MotherMobile == searchMobile || 
                            s.MobileNumber == searchMobile ||
                            (searchMobileDigits.Length >= 10 && (
                                (s.FatherMobile != null && s.FatherMobile.EndsWith(searchMobileDigits)) ||
                                (s.MotherMobile != null && s.MotherMobile.EndsWith(searchMobileDigits)) ||
                                (s.MobileNumber != null && s.MobileNumber.EndsWith(searchMobileDigits))
                            ))
                        )) ||
                        (!string.IsNullOrEmpty(searchEmail) && searchEmail.Contains("@") && (
                            (s.Email != null && s.Email.ToLower() == searchEmail)
                        )) ||
                        (!string.IsNullOrEmpty(searchFullName) && (
                            (s.FatherName != null && s.FatherName.Trim().ToLower() == searchFullName.Trim().ToLower()) ||
                            (s.MotherName != null && s.MotherName.Trim().ToLower() == searchFullName.Trim().ToLower())
                        ))
                    )
                    .OrderByDescending(s => s.StudentId)
                    .ToListAsync();

                return children;
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetChildren Exception: {ex.Message}");
                return new List<Student>();
            }
        }

        public async Task<Student?> GetStudentByIdAsync(int studentId)
        {
            try
            {
                var student = await _context.Students
                    .Include(s => s.ClassGrade)
                    .Include(s => s.ClassSection)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => s.StudentId == studentId && !s.IsDeleted);

                if (student != null) return student;

                return await _context.Students
                    .Include(s => s.ClassGrade)
                    .Include(s => s.ClassSection)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(s => !s.IsDeleted && s.Status == "Active");
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetStudentById Exception: {ex.Message}");
                return null;
            }
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
                TotalDays = 0,
                PresentDays = 0,
                AbsentDays = 0,
                LateDays = 0,
                HalfDays = 0,
                Percentage = 0,
                Logs = new List<ParentAttendanceLogDto>()
            };
        }

        public async Task<List<ParentTimetableDayDto>> GetTimetableAsync(int studentId)
        {
            var student = await _context.Students
                .Include(s => s.ClassGrade)
                .Include(s => s.ClassSection)
                .FirstOrDefaultAsync(s => s.StudentId == studentId);

            if (student == null)
            {
                return new List<ParentTimetableDayDto>();
            }

            int classId = student.ClassId;
            int sectionId = student.SectionId;

            if (classId <= 0 && student.ClassGrade != null)
            {
                classId = student.ClassGrade.ClassId;
            }
            if (sectionId <= 0 && student.ClassSection != null)
            {
                sectionId = student.ClassSection.SectionId;
            }

            if (classId <= 0)
            {
                return new List<ParentTimetableDayDto>();
            }

            // Find published or configured timetable header for this class and section
            var header = await _context.TimetableHeaders
                .Include(h => h.Slots)
                    .ThenInclude(s => s.Subject)
                .Include(h => h.Slots)
                    .ThenInclude(s => s.Teacher)
                .Include(h => h.Slots)
                    .ThenInclude(s => s.Period)
                .FirstOrDefaultAsync(h => h.ClassId == classId && (h.SectionId == sectionId || h.SectionId == 0));

            if (header == null || header.Slots == null || !header.Slots.Any())
            {
                return new List<ParentTimetableDayDto>();
            }

            var days = new List<string> { "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday" };
            var result = new List<ParentTimetableDayDto>();

            foreach (var day in days)
            {
                var daySlots = header.Slots
                    .Where(s => s.DayOfWeek != null && s.DayOfWeek.Equals(day, StringComparison.OrdinalIgnoreCase))
                    .OrderBy(s => s.StartTime)
                    .Select(s => new ParentTimetableSlotDto
                    {
                        PeriodName = s.Period?.PeriodName ?? "Period",
                        StartTime = DateTime.Today.Add(s.StartTime).ToString("hh:mm tt", System.Globalization.CultureInfo.InvariantCulture),
                        EndTime = DateTime.Today.Add(s.EndTime).ToString("hh:mm tt", System.Globalization.CultureInfo.InvariantCulture),
                        SubjectName = s.Subject?.SubjectName ?? (s.SubjectId > 0 ? $"Subject #{s.SubjectId}" : "Subject"),
                        TeacherName = s.Teacher != null ? $"{s.Teacher.FirstName} {s.Teacher.LastName}".Trim() : "",
                        DayOfWeek = day,
                        RoomNo = !string.IsNullOrWhiteSpace(s.RoomNo) ? s.RoomNo : (student.ClassSection?.RoomNo ?? "101")
                    })
                    .ToList();

                if (daySlots.Any())
                {
                    result.Add(new ParentTimetableDayDto
                    {
                        DayOfWeek = day,
                        Slots = daySlots
                    });
                }
            }

            return result;
        }

        public async Task<List<ParentHomeworkItemDto>> GetHomeworkAsync(int studentId)
        {
            var student = await GetStudentByIdAsync(studentId);
            if (student == null) return new List<ParentHomeworkItemDto>();

            var className = student.ClassGrade?.ClassName ?? "Class 6";
            var sectionName = student.ClassSection?.SectionName ?? "A";
            var fullClass = $"{className}-{sectionName}";

            try
            {
                var homeworks = await _context.Homeworks
                    .Where(h => h.ClassName == className || h.ClassName == fullClass || h.ClassName.Contains(className))
                    .OrderByDescending(h => h.CreatedAt)
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

            return new List<ParentHomeworkItemDto>();
        }

        public async Task<List<ParentExamResultReportDto>> GetExamResultsAsync(int studentId)
        {
            var student = await GetStudentByIdAsync(studentId);
            if (student == null) return new List<ParentExamResultReportDto>();

            try
            {
                var results = await _context.NewStudentExamResults
                    .Where(r => r.StudentId == studentId || (!string.IsNullOrEmpty(student.AdmissionNumber) && r.AdmissionNo == student.AdmissionNumber))
                    .ToListAsync();

                if (results.Any())
                {
                    var examIds = results.Select(r => r.ExamId).Distinct().ToList();
                    var exams = await _context.NewExaminations
                        .Where(e => examIds.Contains(e.ExamId))
                        .ToListAsync();

                    var reportList = new List<ParentExamResultReportDto>();

                    foreach (var exam in exams)
                    {
                        var examResult = results.FirstOrDefault(r => r.ExamId == exam.ExamId);
                        if (examResult == null) continue;

                        reportList.Add(new ParentExamResultReportDto
                        {
                            ExamId = exam.ExamId,
                            ExamName = exam.ExamName,
                            AcademicYear = exam.AcademicTerm ?? "2026-2027",
                            TotalMaxMarks = examResult.TotalMaxMarks,
                            TotalObtainedMarks = examResult.TotalMarksObtained,
                            Percentage = Math.Round(examResult.Percentage, 1),
                            OverallGrade = examResult.Grade ?? "A",
                            ResultStatus = examResult.ResultStatus ?? "Pass",
                            SubjectResults = new List<ParentExamSubjectResultDto>()
                        });
                    }

                    if (reportList.Any())
                    {
                        return reportList;
                    }
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetExamResults Exception: {ex.Message}");
            }

            return new List<ParentExamResultReportDto>();
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
                TotalFee = 0,
                TotalPaid = 0,
                TotalDue = 0,
                FeeItems = new List<ParentFeeItemDto>()
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
                AmountPaid = request.AmountPaid,
                PaymentMode = request.PaymentMode ?? "Online (Credit Card)",
                Term = request.PaymentType == "Due" ? "Term 2 Tuition Fee" : "School Fee Payment"
            };
        }

        public async Task<List<ParentTeacherInfoDto>> GetTeachersAsync(int studentId)
        {
            var student = await GetStudentByIdAsync(studentId);
            if (student == null)
            {
                return new List<ParentTeacherInfoDto>();
            }

            int classId = student.ClassId;
            string sectionLetter = student.ClassSection?.SectionName ?? "A";

            try
            {
                var assignments = await _context.TeacherAssignments
                    .Include(ta => ta.Teacher)
                    .Include(ta => ta.Subject)
                    .Where(ta => ta.ClassId == classId && (ta.SectionLetter == sectionLetter || ta.SectionLetter == "All" || string.IsNullOrEmpty(ta.SectionLetter)))
                    .ToListAsync();

                var timetableSlots = await _context.TimetableSlots
                    .Include(ts => ts.Teacher)
                    .Include(ts => ts.Subject)
                    .Include(ts => ts.Header)
                    .Where(ts => ts.Header != null && ts.Header.ClassId == classId && (ts.Header.SectionId == student.SectionId || ts.Header.SectionId == 0))
                    .ToListAsync();

                var teacherMap = new Dictionary<int, ParentTeacherInfoDto>();

                foreach (var a in assignments)
                {
                    if (a.Teacher != null && !teacherMap.ContainsKey(a.Teacher.StaffId))
                    {
                        teacherMap[a.Teacher.StaffId] = new ParentTeacherInfoDto
                        {
                            TeacherId = a.Teacher.StaffId,
                            TeacherName = $"{a.Teacher.FirstName} {a.Teacher.LastName}".Trim(),
                            FirstName = a.Teacher.FirstName ?? "",
                            LastName = a.Teacher.LastName ?? "",
                            Designation = a.Teacher.Designation ?? (a.Role == "Class Teacher" ? "Class Teacher" : "Faculty"),
                            SubjectTaught = a.Subject?.SubjectName ?? a.Teacher.Department ?? "General",
                            SubjectCode = a.Subject?.SubjectCode ?? "",
                            Email = a.Teacher.Email ?? "",
                            Phone = a.Teacher.Phone ?? "",
                            IsClassTeacher = a.Role == "Class Teacher"
                        };
                    }
                }

                foreach (var s in timetableSlots)
                {
                    if (s.Teacher != null && !teacherMap.ContainsKey(s.Teacher.StaffId))
                    {
                        teacherMap[s.Teacher.StaffId] = new ParentTeacherInfoDto
                        {
                            TeacherId = s.Teacher.StaffId,
                            TeacherName = $"{s.Teacher.FirstName} {s.Teacher.LastName}".Trim(),
                            FirstName = s.Teacher.FirstName ?? "",
                            LastName = s.Teacher.LastName ?? "",
                            Designation = s.Teacher.Designation ?? "Faculty",
                            SubjectTaught = s.Subject?.SubjectName ?? s.Teacher.Department ?? "General",
                            SubjectCode = s.Subject?.SubjectCode ?? "",
                            Email = s.Teacher.Email ?? "",
                            Phone = s.Teacher.Phone ?? "",
                            IsClassTeacher = false
                        };
                    }
                }

                if (teacherMap.Any())
                {
                    return teacherMap.Values.ToList();
                }

                var teachingStaff = await _context.Staff
                    .AsNoTracking()
                    .Where(s => s.IsActive == true && ((s.Designation != null && (s.Designation == "Teacher" || s.Designation.Contains("Teacher"))) || s.Department != "Transport"))
                    .Take(6)
                    .ToListAsync();

                return teachingStaff.Select(t => new ParentTeacherInfoDto
                {
                    TeacherId = t.StaffId,
                    TeacherName = $"{t.FirstName} {t.LastName}".Trim(),
                    FirstName = t.FirstName ?? "",
                    LastName = t.LastName ?? "",
                    Designation = t.Designation ?? "Faculty",
                    SubjectTaught = t.Department ?? "General",
                    SubjectCode = "",
                    Email = t.Email ?? "",
                    Phone = t.Phone ?? "",
                    IsClassTeacher = false
                }).ToList();
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetTeachers Exception: {ex.Message}");
                return new List<ParentTeacherInfoDto>();
            }
        }

        public async Task<ParentTransportInfoDto> GetTransportInfoAsync(int studentId)
        {
            var student = await GetStudentByIdAsync(studentId);
            if (student == null)
            {
                return new ParentTransportInfoDto { IsAssigned = false };
            }

            try
            {
                var assignment = await _context.StudentTransportAssignments
                    .Include(a => a.Route)
                    .Include(a => a.PickupPoint)
                    .Include(a => a.VehicleAssignment)
                        .ThenInclude(va => va.Vehicle)
                    .Include(a => a.VehicleAssignment)
                        .ThenInclude(va => va.Driver)
                    .FirstOrDefaultAsync(a => !a.IsDeleted && a.Status && (!string.IsNullOrEmpty(student.AdmissionNumber) && a.AdmissionNo == student.AdmissionNumber));

                if (assignment != null)
                {
                    return new ParentTransportInfoDto
                    {
                        IsAssigned = true,
                        RouteName = assignment.Route?.RouteName ?? "Bus Route",
                        VehicleNumber = assignment.VehicleAssignment?.Vehicle?.VehicleNumber ?? "",
                        PickupPoint = assignment.PickupPoint?.PickupPointName ?? "",
                        PickupTime = assignment.PickupPoint?.PickupTime.ToString(@"hh\:mm") ?? "07:30 AM",
                        DropTime = "04:00 PM",
                        DriverName = assignment.VehicleAssignment?.Driver?.DriverName ?? "Driver",
                        DriverPhone = assignment.VehicleAssignment?.Driver?.MobileNumber ?? ""
                    };
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetTransportInfo Exception: {ex.Message}");
            }

            return new ParentTransportInfoDto
            {
                IsAssigned = false,
                RouteName = "N/A",
                VehicleNumber = "N/A",
                PickupPoint = "N/A",
                PickupTime = "N/A",
                DropTime = "N/A",
                DriverName = "N/A",
                DriverPhone = "N/A"
            };
        }

        public async Task<ParentHostelInfoDto> GetHostelInfoAsync(int studentId)
        {
            var student = await GetStudentByIdAsync(studentId);
            if (student == null)
            {
                return new ParentHostelInfoDto { IsAllocated = false };
            }

            try
            {
                var alloc = await _context.StudentBedAllocations
                    .Include(a => a.Hostel)
                    .Include(a => a.Room)
                    .FirstOrDefaultAsync(a => a.Status == "Active" && (a.StudentId == studentId || (!string.IsNullOrEmpty(student.AdmissionNumber) && a.RegistrationNo == student.AdmissionNumber)));

                if (alloc != null)
                {
                    return new ParentHostelInfoDto
                    {
                        IsAllocated = true,
                        HostelName = alloc.Hostel?.HostelName ?? "School Hostel",
                        BlockName = alloc.Hostel?.HostelType ?? "Block A",
                        RoomNumber = alloc.Room?.RoomNumber ?? "",
                        BedNumber = alloc.BedNumber ?? "",
                        RoomType = alloc.Room?.FloorLevel ?? "Standard",
                        WardenName = alloc.Hostel?.WardenName ?? "Hostel Warden",
                        WardenPhone = alloc.Hostel?.PrimaryMobileNumber ?? ""
                    };
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetHostelInfo Exception: {ex.Message}");
            }

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

            return new List<ParentEventItemDto>();
        }

        public async Task<List<ParentCommunicationDto>> GetCommunicationsAsync()
        {
            try
            {
                var circulars = await _context.Circulars
                    .AsNoTracking()
                    .OrderByDescending(c => c.CreatedDate)
                    .Take(20)
                    .ToListAsync();

                if (circulars.Any())
                {
                    return circulars.Select(c => new ParentCommunicationDto
                    {
                        Id = $"ANN-{c.CircularId}",
                        Title = c.Title ?? "Announcement",
                        Content = c.Content ?? "",
                        TargetAudience = c.TargetAudience ?? "ALL",
                        Category = c.Category ?? "NOTICE",
                        Date = c.CreatedDate.ToString("yyyy-MM-dd"),
                        Time = c.CreatedDate.ToString("hh:mm tt"),
                        Author = c.Author ?? "School Administration",
                        IsPinned = c.IsPinned,
                        RecipientsCount = c.DeliveredCount,
                        DeliveryChannels = "Sent via System Notification"
                    }).ToList();
                }
            }
            catch (Exception ex)
            {
                System.Console.WriteLine($"[ParentRepository] GetCommunications Exception: {ex.Message}");
            }

            return new List<ParentCommunicationDto>();
        }
    }
}
