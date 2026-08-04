using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SMS.Api.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Apply any pending EF Core migrations automatically
            await context.Database.MigrateAsync();

            // 1. Seed Initial Roles
            var defaultRoles = new List<Role>
            {
                new Role { RoleName = "SuperAdmin", Description = "System Owner" },
                new Role { RoleName = "Admin", Description = "School Administrator" },
                new Role { RoleName = "Teacher", Description = "Teacher / Faculty" },
                new Role { RoleName = "Student", Description = "Student Account" },
                new Role { RoleName = "Parent", Description = "Parent / Guardian" }
            };

            foreach (var r in defaultRoles)
            {
                if (!await context.Roles.AnyAsync(x => x.RoleName == r.RoleName))
                {
                    await context.Roles.AddAsync(r);
                }
            }
            await context.SaveChangesAsync();

            // 2. Seed Default Admin User
            if (!await context.Users.AnyAsync(u => u.Email == "admin@pirnavschools.com"))
            {
                var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin")
                             ?? await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "SuperAdmin");

                var adminUser = new User
                {
                    FullName = "Rajesh Sharma",
                    Email = "admin@pirnavschools.com",
                    MobileNumber = "9876543210",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1234"),
                    Role = adminRole?.RoleName ?? "Admin",
                    IsEmailVerified = true,
                    IsMobileVerified = true,
                    CreatedAt = DateTime.UtcNow
                };

                if (adminRole != null)
                {
                    adminUser.Roles.Add(adminRole);
                }

                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
            }

            // 3. Seed Default Staff (Matching Screenshot & Teacher Information Specs)
            if (!await context.Staff.AnyAsync())
            {
                var seedStaff = new List<Staff>
                {
                    new Staff
                    {
                        EmployeeId = "EMP001",
                        EmployeeCategory = "Teaching Staff",
                        FirstName = "Eleanor",
                        LastName = "Vance",
                        Email = "eleanor.vance@stxaviers.edu",
                        Phone = "+1 555-888-001",
                        Designation = "Class Teacher",
                        Department = "Mathematics",
                        PrimarySubject = "Mathematics",
                        Specialization = "Algebra & Calculus",
                        Qualification = "M.Sc. Mathematics, B.Ed.",
                        MonthlySalary = 75000,
                        IsActive = true
                    },
                    new Staff
                    {
                        EmployeeId = "EMP002",
                        EmployeeCategory = "Teaching Staff",
                        FirstName = "Robert",
                        LastName = "Chen",
                        Email = "robert.chen@stxaviers.edu",
                        Phone = "+1 555-888-002",
                        Designation = "Teacher",
                        Department = "Physics",
                        PrimarySubject = "Physics",
                        Specialization = "Quantum & Classical Mechanics",
                        Qualification = "M.Sc. Physics",
                        MonthlySalary = 72000,
                        IsActive = true
                    },
                    new Staff
                    {
                        EmployeeId = "EMP003",
                        EmployeeCategory = "Teaching Staff",
                        FirstName = "Sarah",
                        LastName = "Jenkins",
                        Email = "sarah.jenkins@stxaviers.edu",
                        Phone = "+1 555-888-003",
                        Designation = "Teacher",
                        Department = "English",
                        PrimarySubject = "English Literature",
                        Specialization = "Modern Literature & Composition",
                        Qualification = "M.A. English, B.Ed.",
                        MonthlySalary = 70000,
                        IsActive = true
                    },
                    new Staff
                    {
                        EmployeeId = "EMP004",
                        EmployeeCategory = "Teaching Staff",
                        FirstName = "Michael",
                        LastName = "Chang",
                        Email = "michael.chang@stxaviers.edu",
                        Phone = "+1 555-888-004",
                        Designation = "Teacher",
                        Department = "Chemistry",
                        PrimarySubject = "Chemistry",
                        Specialization = "Organic Chemistry",
                        Qualification = "M.Sc. Chemistry",
                        MonthlySalary = 71000,
                        IsActive = true
                    },
                    new Staff
                    {
                        EmployeeId = "EMP005",
                        EmployeeCategory = "Teaching Staff",
                        FirstName = "Anita",
                        LastName = "Patel",
                        Email = "anita.patel@stxaviers.edu",
                        Phone = "+1 555-888-005",
                        Designation = "Teacher",
                        Department = "Computer Science",
                        PrimarySubject = "Computer Science",
                        Specialization = "Software Engineering & Algorithms",
                        Qualification = "M.Tech CSE",
                        MonthlySalary = 78000,
                        IsActive = true
                    },
                    new Staff
                    {
                        EmployeeId = "EMP006",
                        EmployeeCategory = "Teaching Staff",
                        FirstName = "David",
                        LastName = "Miller",
                        Email = "david.miller@stxaviers.edu",
                        Phone = "+1 555-888-006",
                        Designation = "Teacher",
                        Department = "Sports",
                        PrimarySubject = "Physical Education",
                        Specialization = "Athletics & Physical Fitness",
                        Qualification = "B.P.Ed.",
                        MonthlySalary = 65000,
                        IsActive = true
                    }
                };

                await context.Staff.AddRangeAsync(seedStaff);
                await context.SaveChangesAsync();
            }

            // 4. Seed Default Leave Types
            if (!await context.LeaveTypeConfigs.AnyAsync())
            {
                var leaveTypes = new List<LeaveTypeConfig>
                {
                    new LeaveTypeConfig { Name = "Casual Leave", Code = "CL", AnnualAllowance = 10, CarryForward = false, MaxConsecutiveDays = 3, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Sick Leave", Code = "SL", AnnualAllowance = 12, CarryForward = true, MaxConsecutiveDays = 5, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Earned Leave", Code = "EL", AnnualAllowance = 15, CarryForward = true, MaxConsecutiveDays = 10, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Maternity Leave", Code = "ML", AnnualAllowance = 180, CarryForward = false, MaxConsecutiveDays = 180, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Paternity Leave", Code = "PL", AnnualAllowance = 15, CarryForward = false, MaxConsecutiveDays = 15, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Loss of Pay", Code = "LOP", AnnualAllowance = 0, CarryForward = false, MaxConsecutiveDays = 30, IsPaid = false, Status = "Active" }
                };

                await context.LeaveTypeConfigs.AddRangeAsync(leaveTypes);
                await context.SaveChangesAsync();
            }

            // 5. Seed Homework & Assignments
            if (!await context.Homeworks.AnyAsync())
            {
                var hw = new Homework
                {
                    ClassName = "Class 10-A",
                    SubjectName = "Mathematics",
                    Title = "Quadratic Equations Problem Set",
                    Description = "Complete Problems 1 to 25 from Chapter 4 in the textbook.",
                    DueDate = new DateTime(2026, 07, 22),
                    AttachmentFileName = "Chapter4_Guide.pdf",
                    TeacherName = "Jonathan Miller",
                    SubmissionsCount = 24,
                    CreatedAt = DateTime.UtcNow
                };
                await context.Homeworks.AddAsync(hw);
                await context.SaveChangesAsync();
            }

            // 6. Seed Circulars & Meetings
            if (!await context.Circulars.AnyAsync())
            {
                var circ = new Circular
                {
                    Title = "Annual Sports Meet Registration Open",
                    Category = "SPORTS - ALL",
                    Content = "Submit entries to PE department before August 5th.",
                    TargetAudience = "ALL",
                    CreatedDate = new DateTime(2026, 07, 20),
                    SmsSent = true,
                    EmailSent = true,
                    PushDelivered = true
                };
                await context.Circulars.AddAsync(circ);
                await context.SaveChangesAsync();
            }

            if (!await context.Meetings.AnyAsync())
            {
                var meetings = new List<Meeting>
                {
                    new Meeting
                    {
                        MeetingAudience = "Individual Meeting",
                        ParticipantType = "Parent",
                        ParticipantName = "Robert Morgan (Parent)",
                        ParticipantPhone = "9876543210",
                        WardStudentName = "Alex Morgan",
                        WardAdmissionNo = "ADM-101",
                        WardClass = "Class 10-A",
                        MeetingTitle = "Parent-Teacher Performance Sync (Alex Morgan)",
                        Agenda = "In-person discussion regarding Class 10 Mid-Term progress and career stream selection.",
                        MeetingMode = "In-Person",
                        Building = "Academic Block A",
                        Floor = "1st Floor",
                        MeetingRoom = "Conference Room 204",
                        RoomCapacity = 15,
                        MeetingDate = new DateTime(2026, 08, 10),
                        StartTime = "14:00",
                        EndTime = "14:30",
                        MeetingStatus = "Scheduled"
                    },
                    new Meeting
                    {
                        MeetingAudience = "Group Meeting",
                        ParticipantType = "Teacher",
                        ParticipantName = "All Mathematics Department Faculty",
                        MeetingTitle = "HOD & Mathematics Faculty Academic Alignment",
                        Agenda = "Group strategy session to align syllabus completion for Class 9 and Class 10 upcoming assessments.",
                        MeetingMode = "In-Person",
                        Building = "Science & Tech Wing",
                        Floor = "Ground Floor",
                        MeetingRoom = "Staff Seminar Hall B",
                        RoomCapacity = 40,
                        MeetingDate = new DateTime(2026, 08, 12),
                        StartTime = "11:00",
                        EndTime = "12:00",
                        MeetingStatus = "Scheduled"
                    }
                };

                await context.Meetings.AddRangeAsync(meetings);
                await context.SaveChangesAsync();
            }

            // 7. Seed School Events & Gazetted Holidays
            if (!await context.SchoolEvents.AnyAsync())
            {
                var events = new List<SchoolEvent>
                {
                    new SchoolEvent
                    {
                        Title = "Annual Sports Day & Athletic Meet 2026",
                        Category = "Sports Day",
                        Venue = "Main Campus Stadium Ground",
                        StartDate = new DateTime(2026, 08, 15),
                        EndDate = new DateTime(2026, 08, 15),
                        Time = "08:30 AM",
                        Organizer = "Physical Education Dept",
                        Description = "Grand Annual Sports Day featuring track & field competitions, march past, relay races, and trophy distribution.",
                        Status = "Published",
                        ApplicableBranch = "Main Campus"
                    },
                    new SchoolEvent
                    {
                        Title = "Inter-House Science & Robotics Exhibition",
                        Category = "Science Exhibition",
                        Venue = "Auditorium & STEM Lab 1",
                        StartDate = new DateTime(2026, 08, 22),
                        EndDate = new DateTime(2026, 08, 22),
                        Time = "10:00 AM",
                        Organizer = "Department of Science & Tech",
                        Description = "Student project showcases in AI, Renewable Energy, Physics Experiments, and Robotics Prototypes.",
                        Status = "Published",
                        ApplicableBranch = "Main Campus"
                    }
                };

                await context.SchoolEvents.AddRangeAsync(events);
                await context.SaveChangesAsync();
            }

            // 8. Seed Payroll Config & Payslips
            if (!await context.PayrollConfigs.AnyAsync())
            {
                await context.PayrollConfigs.AddAsync(new PayrollConfig
                {
                    PayrollName = "Main Campus Payroll",
                    Branch = "Main Campus",
                    FinancialYear = "2026-2027",
                    Currency = "INR",
                    Status = "Active",
                    EffectiveFrom = DateTime.UtcNow,
                    EffectiveTo = DateTime.UtcNow.AddYears(1)
                });
                await context.SaveChangesAsync();
            }

            if (!await context.Payslips.AnyAsync())
            {
                var seedPayslips = new List<Payslip>
                {
                    new Payslip { EmployeeId = "EMP001", EmployeeName = "sudheer k", Department = "Academics", Designation = "Teacher", Month = "July", Year = 2026, BasicSalary = 7000, HouseRentAllowance = 1400, DearnessAllowance = 700, GrossEarnings = 9100, ProvidentFund = 560, Esi = 0, TotalDeductions = 560, NetPay = 8540, PanNumber = "ABCDE1234F", Status = "Generated" },
                    new Payslip { EmployeeId = "EMP002", EmployeeName = "sundhar k", Department = "Science", Designation = "Teacher", Month = "July", Year = 2026, BasicSalary = 7000, HouseRentAllowance = 1400, DearnessAllowance = 700, GrossEarnings = 9100, ProvidentFund = 560, Esi = 0, TotalDeductions = 560, NetPay = 8540, PanNumber = "ABCDE1234F", Status = "Generated" }
                };

                await context.Payslips.AddRangeAsync(seedPayslips);
                await context.SaveChangesAsync();
            }

            // 9. Seed Examination & Invigilation Panel Data
            if (!await context.ExamSchedules.AnyAsync())
            {
                var sched1 = new ExamSchedule
                {
                    ExamId = 1,
                    ExamTitle = "Mid-Term Examination 2026",
                    ClassName = "Class 10",
                    SectionName = "Section A",
                    SubjectName = "Mathematics",
                    ExamDate = new DateTime(2026, 09, 10),
                    StartTime = "09:00",
                    EndTime = "12:00",
                    MaxMarks = 100,
                    PassMarks = 33,
                    AcademicYear = "2025-2026",
                    BranchName = "Main Campus"
                };
                sched1.InvigilatorAssignments.Add(new ExamInvigilatorAssignment { SectionName = "Section A", StaffId = 3, StaffName = "Rajesh Pirnav", EmployeeId = "EMP003" });

                var sched2 = new ExamSchedule
                {
                    ExamId = 1,
                    ExamTitle = "Mid-Term Examination 2026",
                    ClassName = "Class 10",
                    SectionName = "Section A",
                    SubjectName = "Physics",
                    ExamDate = new DateTime(2026, 09, 12),
                    StartTime = "09:00",
                    EndTime = "12:00",
                    MaxMarks = 100,
                    PassMarks = 33,
                    AcademicYear = "2025-2026",
                    BranchName = "Main Campus"
                };
                sched2.InvigilatorAssignments.Add(new ExamInvigilatorAssignment { SectionName = "Section A", StaffId = 3, StaffName = "Rajesh Pirnav", EmployeeId = "EMP003" });

                await context.ExamSchedules.AddRangeAsync(sched1, sched2);
                await context.SaveChangesAsync();
            }

            if (!await context.QuestionPapers.AnyAsync())
            {
                var qp = new QuestionPaper
                {
                    ExamId = 1,
                    ExamTitle = "Mid-Term Examination 2026",
                    ClassName = "Class 10",
                    SectionName = "10th (A)",
                    SubjectName = "Mathematics",
                    PaperTitle = "final",
                    PaperCode = "MAT-101",
                    ExamDate = new DateTime(2026, 07, 27),
                    Duration = "3 Hours",
                    MaxMarks = 100,
                    Instructions = "1. Read all questions carefully. 2. Answer in neat handwriting.",
                    DocumentFileName = "question_paper.pdf",
                    DocumentSize = "1.5 MB",
                    UploadedBy = "javvadivenkat999",
                    UploadedDate = DateTime.UtcNow,
                    PublishStatus = "PUBLISHED"
                };

                await context.QuestionPapers.AddAsync(qp);
                await context.SaveChangesAsync();
            }

            if (!await context.GradeConfigurations.AnyAsync())
            {
                var grades = new List<GradeConfiguration>
                {
                    new GradeConfiguration { SchemeName = "Default Scholastic", GradeLetter = "A+", MinPercentage = 90, MaxPercentage = 100, GradePoints = 10, CriteriaStatus = "Pass" },
                    new GradeConfiguration { SchemeName = "Default Scholastic", GradeLetter = "A", MinPercentage = 80, MaxPercentage = 89, GradePoints = 9, CriteriaStatus = "Pass" },
                    new GradeConfiguration { SchemeName = "Default Scholastic", GradeLetter = "B+", MinPercentage = 70, MaxPercentage = 79, GradePoints = 8, CriteriaStatus = "Pass" },
                    new GradeConfiguration { SchemeName = "Default Scholastic", GradeLetter = "B", MinPercentage = 60, MaxPercentage = 69, GradePoints = 7, CriteriaStatus = "Pass" },
                    new GradeConfiguration { SchemeName = "Default Scholastic", GradeLetter = "C", MinPercentage = 50, MaxPercentage = 59, GradePoints = 6, CriteriaStatus = "Pass" },
                    new GradeConfiguration { SchemeName = "Default Scholastic", GradeLetter = "D", MinPercentage = 33, MaxPercentage = 49, GradePoints = 4, CriteriaStatus = "Pass" },
                    new GradeConfiguration { SchemeName = "Default Scholastic", GradeLetter = "F", MinPercentage = 0, MaxPercentage = 32, GradePoints = 0, CriteriaStatus = "Fail" }
                };

                await context.GradeConfigurations.AddRangeAsync(grades);
                await context.SaveChangesAsync();
            }

            if (!await context.ExamMarks.AnyAsync())
            {
                var mark = new ExamMark
                {
                    ExamId = 1,
                    ExamTitle = "Mid-Term Examination 2026",
                    ClassName = "Class 10",
                    SectionName = "A",
                    StudentId = 1,
                    RollNo = "1001",
                    StudentName = "ALEXANDER WRIGHT",
                    SubjectName = "Mathematics",
                    MaxMarks = 100,
                    MarksObtained = 95,
                    GradePreview = "A+",
                    Remarks = "E.g., Good",
                    IsLocked = true
                };

                await context.ExamMarks.AddAsync(mark);
                await context.SaveChangesAsync();
            }

            if (!await context.ExamResults.AnyAsync())
            {
                var result = new ExamResult
                {
                    ExamId = 1,
                    ExamTitle = "Mid-Term Examination 2026",
                    ClassName = "Class 10",
                    SectionName = "A",
                    StudentId = 1,
                    RollNo = "1001",
                    StudentName = "Alexander Wright",
                    MarksObtained = 95,
                    TotalMaxMarks = 200,
                    Percentage = 48,
                    GPA = 4,
                    FinalGrade = "D",
                    PassStatus = "Pass",
                    ResultStatus = "PROCESSED"
                };

                await context.ExamResults.AddAsync(result);
                await context.SaveChangesAsync();
            }
        }
    }
}