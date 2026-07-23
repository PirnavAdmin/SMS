using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Implementations;
using Xunit;

namespace Backend.Tests.Repositories
{
    public class SchoolRepositoryTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        // --- STAFF TABLE TESTS ---
        [Fact]
        public async Task StaffOperations_Add_Get_Dropdown_Remove_WorkCorrectly()
        {
            using var db = GetInMemoryDbContext();
            var repo = new SchoolRepository(db);

            var staff1 = new Staff
            {
                EmployeeId = "EMP101",
                FirstName = "Alice",
                LastName = "Smith",
                Department = "Science",
                Designation = "Physics Teacher",
                Email = "alice@school.com",
                Phone = "1234567890",
                IsActive = true
            };

            var staff2 = new Staff
            {
                EmployeeId = "EMP102",
                FirstName = "Bob",
                LastName = "Jones",
                Department = "Math",
                Designation = "Math Teacher",
                Email = "bob@school.com",
                Phone = "0987654321",
                IsActive = false
            };

            await repo.AddStaffAsync(staff1);
            await repo.AddStaffAsync(staff2);
            await repo.SaveChangesAsync();

            var allStaff = await repo.GetAllStaffAsync("Alice", "Science");
            Assert.Single(allStaff);
            Assert.Equal("EMP101", allStaff[0].EmployeeId);

            var fetchedById = await repo.GetStaffByIdAsync(staff1.StaffId);
            Assert.NotNull(fetchedById);
            Assert.Equal("Alice", fetchedById!.FirstName);

            var activeTeachers = await repo.GetTeachersForDropdownAsync(null);
            Assert.Single(activeTeachers);
            Assert.Equal("EMP101", activeTeachers[0].EmployeeId);

            repo.RemoveStaff(staff1);
            await repo.SaveChangesAsync();
            var remainingStaff = await repo.GetAllStaffAsync(null, null);
            Assert.Single(remainingStaff);
        }

        // --- SUBJECTS TABLE TESTS ---
        [Fact]
        public async Task SubjectOperations_Add_Get_Remove_WorkCorrectly()
        {
            using var db = GetInMemoryDbContext();
            var repo = new SchoolRepository(db);

            var sub1 = new Subject { SubjectCode = "MATH101", SubjectName = "Mathematics", CourseCode = "MATH" };
            var sub2 = new Subject { SubjectCode = "ENG101", SubjectName = "English", CourseCode = "ENG" };

            await repo.AddSubjectAsync(sub1);
            await repo.AddSubjectAsync(sub2);
            await repo.SaveChangesAsync();

            var searchResult = await repo.GetAllSubjectsAsync("MATH");
            Assert.Single(searchResult);
            Assert.Equal("Mathematics", searchResult[0].SubjectName);

            var fetched = await repo.GetSubjectByIdAsync(sub1.SubjectId);
            Assert.NotNull(fetched);

            repo.RemoveSubject(sub1);
            await repo.SaveChangesAsync();

            var remaining = await repo.GetAllSubjectsAsync(null);
            Assert.Single(remaining);
            Assert.Equal("ENG101", remaining[0].SubjectCode);
        }

        // --- CLASSES, CLASS SECTIONS, & CURRICULUM SUBJECTS TABLES TESTS ---
        [Fact]
        public async Task ClassGrade_Sections_CurriculumSubjects_Operations_WorkCorrectly()
        {
            using var db = GetInMemoryDbContext();
            var repo = new SchoolRepository(db);

            var teacher = new Staff
            {
                EmployeeId = "EMP201",
                FirstName = "David",
                LastName = "Miller",
                Email = "david@school.com",
                Phone = "9998887777",
                IsActive = true
            };
            db.Staff.Add(teacher);
            await db.SaveChangesAsync();

            var subject = new Subject { SubjectCode = "CS101", SubjectName = "Computer Science", CourseCode = "CS" };
            db.Subjects.Add(subject);
            await db.SaveChangesAsync();

            var classGrade = new ClassGrade { ClassName = "Grade 10" };
            await repo.AddClassGradeAsync(classGrade);
            await repo.SaveChangesAsync();

            classGrade.Sections.Add(new ClassSection
            {
                ClassId = classGrade.ClassId,
                SectionName = "A",
                ClassTeacherEmpId = teacher.StaffId
            });

            classGrade.CurriculumSubjects.Add(new ClassCurriculumSubject
            {
                ClassId = classGrade.ClassId,
                SubjectId = subject.SubjectId
            });

            await repo.SaveChangesAsync();

            var allGrades = await repo.GetAllClassGradesAsync();
            Assert.Single(allGrades);
            Assert.Equal("Grade 10", allGrades[0].ClassName);
            Assert.Single(allGrades[0].Sections);
            Assert.Equal("A", allGrades[0].Sections.First().SectionName);
            Assert.Single(allGrades[0].CurriculumSubjects);

            var byId = await repo.GetClassGradeByIdAsync(classGrade.ClassId);
            Assert.NotNull(byId);
            Assert.Equal("Grade 10", byId!.ClassName);

            repo.RemoveClassGrade(classGrade);
            await repo.SaveChangesAsync();
            var remainingGrades = await repo.GetAllClassGradesAsync();
            Assert.Empty(remainingGrades);
        }

        // --- ADMISSION APPLICATION TABLE TESTS ---
        [Fact]
        public async Task AdmissionApplicationOperations_Add_Get_Remove_WorkCorrectly()
        {
            using var db = GetInMemoryDbContext();
            var repo = new SchoolRepository(db);

            var classGrade = new ClassGrade { ClassName = "Grade 10" };
            db.Classes.Add(classGrade);
            await db.SaveChangesAsync();

            var app = new AdmissionApplication
            {
                RegistrationNo = "REG-1001",
                FirstName = "Charlie",
                LastName = "Brown",
                BranchName = "Main Campus",
                FatherName = "David Brown",
                FatherContact = "1234567890",
                MotherName = "Sarah Brown",
                Religion = "General",
                City = "New York",
                TransportRequired = true,
                TransportType = "AC Bus",
                AppliedClassId = classGrade.ClassId,
                Status = "Pending"
            };

            await repo.AddApplicationAsync(app);
            await repo.SaveChangesAsync();

            var filteredApps = await repo.GetAllApplicationsAsync("Charlie", "Main Campus", null, "Pending");
            Assert.Single(filteredApps);
            Assert.Equal("Charlie", filteredApps[0].FirstName);

            var byId = await repo.GetApplicationByIdAsync(app.Id);
            Assert.NotNull(byId);
            Assert.Equal("REG-1001", byId!.RegistrationNo);
            Assert.Equal("Sarah Brown", byId.MotherName);
            Assert.Equal("New York", byId.City);
            Assert.True(byId.TransportRequired);

            repo.RemoveApplication(app);
            await repo.SaveChangesAsync();
            var remainingApps = await repo.GetAllApplicationsAsync(null, null, null, null);
            Assert.Empty(remainingApps);
        }
    }
}
