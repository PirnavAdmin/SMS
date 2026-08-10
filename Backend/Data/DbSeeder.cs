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

            // 1b. Seed Default Super Admin User
            if (!await context.Users.AnyAsync(u => u.Email == "superadmin@pirnavschools.com"))
            {
                var superAdminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "SuperAdmin");
                var superAdminUser = new User
                {
                    FullName = "System Owner",
                    Email = "superadmin@pirnavschools.com",
                    MobileNumber = "9999999999",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("superadmin1234"),
                    Role = "SuperAdmin",
                    IsEmailVerified = true,
                    IsMobileVerified = true,
                    CreatedAt = DateTime.UtcNow
                };

                if (superAdminRole != null)
                {
                    superAdminUser.Roles.Add(superAdminRole);
                }

                await context.Users.AddAsync(superAdminUser);
                await context.SaveChangesAsync();
            }

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

            // Student attendance is no longer seeded here.
            // The current model requires a valid StudentAttendanceSession before
            // StudentAttendance records can be created. Attendance-session and
            // record seed data can be added after the related master IDs are known.
        }
    }
}