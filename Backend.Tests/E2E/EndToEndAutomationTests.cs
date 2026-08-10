using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using Xunit;

namespace Backend.Tests.E2E
{
    public class EndToEndAutomationTests
    {
        private async Task<AppDbContext> GetInMemoryDbContextAsync()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            var context = new AppDbContext(options);
            return context;
        }

        [Fact]
        public async Task E2E_01_Authentication_And_Otp_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var adminUser = new User
            {
                Email = "admin@sms.com",
                MobileNumber = "9998887770",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                FullName = "System Administrator",
                Role = "Admin"
            };
            await context.Users.AddAsync(adminUser);
            await context.SaveChangesAsync();

            var otp = new OtpVerification
            {
                UserId = adminUser.UserId,
                OtpCodeHash = BCrypt.Net.BCrypt.HashPassword("123456"),
                DeliveryMethod = "Email",
                Purpose = "Login",
                ExpiryTime = DateTime.UtcNow.AddMinutes(10),
                IsUsed = false
            };
            await context.OtpVerifications.AddAsync(otp);
            await context.SaveChangesAsync();

            var savedOtp = await context.OtpVerifications.FirstOrDefaultAsync(o => o.UserId == adminUser.UserId);
            Assert.NotNull(savedOtp);
            Assert.False(savedOtp.IsUsed);
        }

        [Fact]
        public async Task E2E_02_Academic_Departments_And_Subjects_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var dept = new Department
            {
                DepartmentName = "Computer Science & AI",
                DepartmentCode = "CSAI",
                Description = "Department of Computer Science and Artificial Intelligence",
                Status = "Active",
                CreatedDate = DateTime.UtcNow
            };
            await context.Departments.AddAsync(dept);
            await context.SaveChangesAsync();

            var subject = new Subject
            {
                SubjectCode = "CSAI-401",
                SubjectName = "Artificial Intelligence",
                CourseCode = "CSAI-401",
                DepartmentId = dept.DepartmentId
            };
            await context.Subjects.AddAsync(subject);
            await context.SaveChangesAsync();

            var savedSubject = await context.Subjects.FirstOrDefaultAsync(s => s.CourseCode == "CSAI-401");
            Assert.NotNull(savedSubject);
            Assert.Equal("Artificial Intelligence", savedSubject.SubjectName);
            Assert.Equal(dept.DepartmentId, savedSubject.DepartmentId);
        }

        [Fact]
        public async Task E2E_03_Staff_Sequential_AutoIncrement_EmpId_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var staffList = await context.Staff.ToListAsync();
            var maxId = staffList
                .Select(s => s.EmployeeId)
                .Where(id => !string.IsNullOrEmpty(id) && id.StartsWith("EMP"))
                .Select(id => int.TryParse(id.Substring(3), out var n) ? n : 0)
                .DefaultIfEmpty(0)
                .Max();

            var nextEmpId = $"EMP{(maxId + 1):D3}";
            Assert.StartsWith("EMP", nextEmpId);

            var newStaff = new Staff
            {
                EmployeeId = nextEmpId,
                EmployeeCategory = "Teacher",
                FirstName = "David",
                LastName = "Goggins",
                Email = "david.goggins@sms.com",
                Phone = "9876543210",
                Gender = "Male",
                Designation = "Senior Lecturer",
                Department = "Mathematics",
                MonthlySalary = 85000,
                IsActive = true
            };
            await context.Staff.AddAsync(newStaff);
            await context.SaveChangesAsync();

            var createdStaff = await context.Staff.FirstOrDefaultAsync(s => s.Email == "david.goggins@sms.com");
            Assert.NotNull(createdStaff);
            Assert.Equal(nextEmpId, createdStaff.EmployeeId);
        }

        [Fact]
        public async Task E2E_04_Admissions_Student_Enrollment_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var admission = new AdmissionApplication
            {
                RegistrationNo = "REG-2026-9999",
                FirstName = "Lucas",
                LastName = "Scott",
                DateOfBirth = new DateTime(2010, 05, 15),
                Gender = "Male",
                BranchName = "Main Campus",
                FatherName = "Dan Scott",
                MotherName = "Karen Scott",
                ParentEmail = "karen.scott@example.com",
                FatherContact = "9123456789",
                HouseNo = "Building 12",
                Street = "Tree Hill Street",
                City = "North Carolina",
                State = "NC",
                PinCode = "28401",
                Status = "Pending"
            };
            await context.AdmissionApplications.AddAsync(admission);
            await context.SaveChangesAsync();

            admission.Status = "Enrolled";
            await context.SaveChangesAsync();

            var updated = await context.AdmissionApplications.FirstOrDefaultAsync(a => a.RegistrationNo == "REG-2026-9999");
            Assert.NotNull(updated);
            Assert.Equal("Enrolled", updated.Status);
        }

        [Fact]
        public async Task E2E_05_Hostel_And_Bed_Allocation_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var hostel = new HostelBlock
            {
                HostelName = "Newton Boys Hostel",
                HostelCode = "NBH-01",
                HostelType = "Boys",
                WardenName = "Marcus Vance",
                PrimaryMobileNumber = "9988776655",
                Email = "marcus@sms.com",
                Status = "Active",
                Address = "North Campus Grounds",
                CreatedAt = DateTime.UtcNow
            };
            await context.HostelBlocks.AddAsync(hostel);
            await context.SaveChangesAsync();

            var roomType = new RoomTypeConfig
            {
                RoomTypeSpecification = "2-Sharing AC Suite",
                BedCapacity = 2,
                AcType = "AC",
                Status = "Active",
                Description = "2 Bed AC Room"
            };
            await context.RoomTypeConfigs.AddAsync(roomType);
            await context.SaveChangesAsync();

            var room = new RoomMaster
            {
                HostelId = hostel.HostelId,
                RoomTypeId = roomType.RoomTypeId,
                FloorLevel = "1st Floor",
                RoomNumber = "101",
                Status = "Available",
                CreatedAt = DateTime.UtcNow
            };
            await context.RoomMasters.AddAsync(room);
            await context.SaveChangesAsync();

            var allocation = new StudentBedAllocation
            {
                RegistrationNo = "ADM-2026-001",
                StudentName = "Alex Turner",
                HostelId = hostel.HostelId,
                RoomId = room.RoomId,
                BedNumber = "Bed-A",
                JoiningDate = DateTime.UtcNow,
                Status = "Active"
            };
            await context.StudentBedAllocations.AddAsync(allocation);
            await context.SaveChangesAsync();

            var savedAlloc = await context.StudentBedAllocations.FirstOrDefaultAsync(b => b.RegistrationNo == "ADM-2026-001");
            Assert.NotNull(savedAlloc);
            Assert.Equal("Bed-A", savedAlloc.BedNumber);
        }

        [Fact]
        public async Task E2E_06_Transport_Management_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var route = new TransportRoute
            {
                RouteName = "Route 5 - Downtown Express",
                RouteCode = "RT-05",
                StartLocation = "Central Bus Terminus",
                EndLocation = "Main Campus",
                DistanceKm = 18.5m,
                Status = true
            };
            await context.TransportRoutes.AddAsync(route);
            await context.SaveChangesAsync();

            var vehicle = new TransportVehicle
            {
                VehicleNumber = "V-01",
                RegistrationNumber = "KA-01-EQ-9988",
                VehicleType = "Bus",
                Capacity = 45,
                Status = true
            };
            await context.TransportVehicles.AddAsync(vehicle);
            await context.SaveChangesAsync();

            Assert.True(route.RouteId > 0);
            Assert.True(vehicle.VehicleId > 0);
        }

        [Fact]
        public async Task E2E_07_Homework_And_Communications_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var hw = new Homework
            {
                ClassName = "Class 10-A",
                SubjectName = "Physics",
                Title = "Thermodynamics Chapter 4 Problems",
                Description = "Solve exercises 1 through 15",
                DueDate = DateTime.UtcNow.AddDays(3),
                TeacherName = "Sarah Jenkins"
            };
            await context.Homeworks.AddAsync(hw);

            var circular = new Circular
            {
                Title = "Annual Science Fair Registration Open",
                Category = "Academic Event",
                Content = "Students can register project proposals by Friday.",
                TargetAudience = "All Students & Staff"
            };
            await context.Circulars.AddAsync(circular);

            var meeting = new Meeting
            {
                MeetingAudience = "Individual Meeting",
                ParticipantType = "Parent",
                ParticipantName = "Robert Langdon (Parent)",
                MeetingTitle = "Academic Review Meeting",
                Agenda = "Discuss semester test performance",
                MeetingMode = "In-Person",
                Building = "Main Academic Block",
                Floor = "Ground Floor",
                MeetingRoom = "Room 102",
                RoomCapacity = 10,
                MeetingDate = DateTime.UtcNow.AddDays(2),
                StartTime = "10:00 AM",
                EndTime = "10:30 AM",
                MeetingStatus = "Scheduled"
            };
            await context.Meetings.AddAsync(meeting);
            await context.SaveChangesAsync();

            Assert.True(hw.HomeworkId > 0);
            Assert.True(circular.CircularId > 0);
            Assert.True(meeting.MeetingId > 0);
        }

        [Fact]
        public async Task E2E_08_HR_Payroll_Processing_8Step_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var config = new PayrollConfig
            {
                PayrollName = "Main Campus Monthly Payroll",
                Branch = "Main Campus",
                FinancialYear = "2026-2027",
                Currency = "INR",
                Status = "Active"
            };
            await context.PayrollConfigs.AddAsync(config);

            var payslip = new Payslip
            {
                EmployeeId = "EMP001",
                EmployeeName = "sudheer k",
                Department = "Academics",
                Month = "July",
                Year = 2026,
                BasicSalary = 10000,
                HouseRentAllowance = 2000,
                DearnessAllowance = 1000,
                GrossEarnings = 13000,
                ProvidentFund = 800,
                TotalDeductions = 800,
                NetPay = 12200,
                Status = "Published"
            };
            await context.Payslips.AddAsync(payslip);
            await context.SaveChangesAsync();

            var savedPayslip = await context.Payslips.FirstOrDefaultAsync(p => p.EmployeeId == "EMP001");
            Assert.NotNull(savedPayslip);
            Assert.Equal(12200, savedPayslip.NetPay);
            Assert.Equal("Published", savedPayslip.Status);
        }

        [Fact]
        public async Task E2E_09_Examination_New_Workflow()
        {
            var context = await GetInMemoryDbContextAsync();

            var exam = new NewExamination
            {
                ExamId = 1,
                ExamName = "Mid-Term Examination 2026",
                AssessmentType = "Scholastic",
                AcademicTerm = "Term 1",
                StartDate = new DateTime(2026, 09, 10),
                EndDate = new DateTime(2026, 09, 20),
                ApplicableClasses = "Class 10,Class 11",
                Status = "Draft"
            };

            var subjectConfig = new NewExamSubjectConfig
            {
                ConfigId = 1,
                ExamId = 1,
                ClassName = "Class 10",
                SubjectCode = "MTH-101",
                SubjectName = "Mathematics",
                IsActive = true,
                MaxMarks = 100m,
                PassMarks = 35m
            };

            var slot = new NewExamTimetableSlot
            {
                SlotId = 1,
                ExamId = 1,
                ClassName = "Class 10",
                SectionName = "Section A",
                SubjectCode = "MTH-101",
                SubjectName = "Mathematics",
                TotalMarks = 100,
                ExamDate = new DateTime(2026, 09, 12),
                TimeSlot = "09:00 - 12:00",
                Duration = "3h",
                RoomHall = "Room 101",
                InvigilatorFaculty = "Dr. Eleanor Vance"
            };

            await context.NewExaminations.AddAsync(exam);
            await context.NewExamSubjectConfigs.AddAsync(subjectConfig);
            await context.NewExamTimetableSlots.AddAsync(slot);
            await context.SaveChangesAsync();

            var savedExam = await context.NewExaminations.Include(e => e.SubjectConfigs).FirstOrDefaultAsync(e => e.ExamId == 1);
            Assert.NotNull(savedExam);
            Assert.Equal("Mid-Term Examination 2026", savedExam.ExamName);
            Assert.Single(savedExam.SubjectConfigs);

            var savedSlot = await context.NewExamTimetableSlots.FirstOrDefaultAsync(s => s.SlotId == 1);
            Assert.NotNull(savedSlot);
            Assert.Equal("Room 101", savedSlot.RoomHall);
            Assert.Equal("Dr. Eleanor Vance", savedSlot.InvigilatorFaculty);
        }
    }
}
