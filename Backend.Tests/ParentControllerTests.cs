using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Moq;
using SMS.Api.Controllers.Parent;
using SMS.Api.Data;
using SMS.Api.Dtos.Parent;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Implementations.Parent;
using SMS.Api.Services.Implementations.Parent;
using SMS.Api.Services.Interfaces.Parent;
using Xunit;

namespace Backend.Tests
{
    public class ParentControllerTests
    {
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        private static T GetData<T>(IActionResult? actionResult)
        {
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var json = JsonSerializer.Serialize(okResult.Value);
            using var doc = JsonDocument.Parse(json);
            var dataElement = doc.RootElement.GetProperty("data");
            return JsonSerializer.Deserialize<T>(dataElement.GetRawText(), JsonOptions)!;
        }

        private static bool GetSuccess(IActionResult? actionResult)
        {
            var okResult = Assert.IsType<OkObjectResult>(actionResult);
            var json = JsonSerializer.Serialize(okResult.Value);
            using var doc = JsonDocument.Parse(json);
            return doc.RootElement.GetProperty("success").GetBoolean();
        }

        private static void SeedAcademicStructure(AppDbContext db)
        {
            if (!db.Classes.Any())
            {
                db.Classes.Add(new ClassGrade { ClassId = 1, ClassName = "Class 10" });
            }
            if (!db.ClassSections.Any())
            {
                db.ClassSections.Add(new ClassSection { SectionId = 1, SectionName = "A", ClassId = 1 });
            }
        }

        private ControllerContext CreateControllerContext(int userId, string role, string email, string name = "Suresh Javvadi")
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
                new Claim(ClaimTypes.Role, role),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Name, name)
            };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);

            return new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        private ControllerContext CreateUnauthenticatedControllerContext()
        {
            return new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) }
            };
        }

        private AppDbContext CreateInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        // ==========================================
        // TEST 1: Parent with one student: Returns only that student
        // ==========================================
        [Fact]
        public async Task Test01_ParentWithOneStudent_ReturnsOnlyThatStudent()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentUserId = 101;
            int studentId = 201;

            var expectedChildren = new List<ParentChildDto>
            {
                new ParentChildDto { StudentId = studentId, StudentName = "Abhinav Javvadi", ClassName = "Class 10", SectionName = "A" }
            };

            parentServiceMock.Setup(s => s.GetChildrenByUserIdAsync(parentUserId))
                .ReturnsAsync(expectedChildren);

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentUserId, "Parent", "parent101@example.com")
            };

            // Act
            var result = await controller.GetChildren(null);

            // Assert
            Assert.True(GetSuccess(result));
            var children = GetData<List<ParentChildDto>>(result);
            Assert.Single(children);
            Assert.Equal(studentId, children[0].StudentId);
            Assert.Equal("Abhinav Javvadi", children[0].StudentName);
        }

        // ==========================================
        // TEST 2: Two parents with the same name: Parent A sees Student A; Parent B sees Student B
        // ==========================================
        [Fact]
        public async Task Test02_TwoParentsSameName_StrictDataIsolation()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();

            int parentAId = 673;
            int parentBId = 736;
            int studentAId = 1243;
            int studentBId = 1231;

            var studentA = new ParentChildDto { StudentId = studentAId, StudentName = "Abhinav Javvadi" };
            var studentB = new ParentChildDto { StudentId = studentBId, StudentName = "Diya Javvadi" };

            // Parent A has only Student A
            parentServiceMock.Setup(s => s.GetChildrenByUserIdAsync(parentAId))
                .ReturnsAsync(new List<ParentChildDto> { studentA });

            // Parent B has only Student B
            parentServiceMock.Setup(s => s.GetChildrenByUserIdAsync(parentBId))
                .ReturnsAsync(new List<ParentChildDto> { studentB });

            var controllerA = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "abhinav.javvadi124@example.com", "Suresh Javvadi")
            };

            var controllerB = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentBId, "Parent", "diya.javvadi112@example.com", "Suresh Javvadi")
            };

            // Act
            var resultA = await controllerA.GetChildren(null);
            var resultB = await controllerB.GetChildren(null);

            // Assert
            var childrenA = GetData<List<ParentChildDto>>(resultA);
            var childrenB = GetData<List<ParentChildDto>>(resultB);

            // Parent A sees only Student A
            Assert.Single(childrenA);
            Assert.Equal(studentAId, childrenA[0].StudentId);
            Assert.DoesNotContain(childrenA, c => c.StudentId == studentBId);

            // Parent B sees only Student B
            Assert.Single(childrenB);
            Assert.Equal(studentBId, childrenB[0].StudentId);
            Assert.DoesNotContain(childrenB, c => c.StudentId == studentAId);
        }

        // ==========================================
        // TEST 3: Parent with multiple students: Returns all mapped students
        // ==========================================
        [Fact]
        public async Task Test03_ParentWithMultipleStudents_ReturnsAllMappedStudents()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentUserId = 500;

            var mappedChildren = new List<ParentChildDto>
            {
                new ParentChildDto { StudentId = 10, StudentName = "Sibling One", ClassName = "Class 8" },
                new ParentChildDto { StudentId = 11, StudentName = "Sibling Two", ClassName = "Class 5" }
            };

            parentServiceMock.Setup(s => s.GetChildrenByUserIdAsync(parentUserId))
                .ReturnsAsync(mappedChildren);

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentUserId, "Parent", "parent.multi@example.com")
            };

            // Act
            var result = await controller.GetChildren(null);

            // Assert
            var children = GetData<List<ParentChildDto>>(result);
            Assert.Equal(2, children.Count);
            Assert.Contains(children, c => c.StudentId == 10);
            Assert.Contains(children, c => c.StudentId == 11);
        }

        // ==========================================
        // TEST 4: Parent with no students: Returns empty list (zero demo data or fallback leaks)
        // ==========================================
        [Fact]
        public async Task Test04_ParentWithNoStudents_ReturnsEmptyList()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentUserId = 999;

            parentServiceMock.Setup(s => s.GetChildrenByUserIdAsync(parentUserId))
                .ReturnsAsync(new List<ParentChildDto>());

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentUserId, "Parent", "newparent@example.com")
            };

            // Act
            var result = await controller.GetChildren(null);

            // Assert
            var children = GetData<List<ParentChildDto>>(result);
            Assert.Empty(children);
        }

        // ==========================================
        // TEST 5: Student details endpoint: Parent A requesting Student A returns 200; Student B returns 403
        // ==========================================
        [Fact]
        public async Task Test05_StudentDetailsEndpoint_EnforcesAuthorization()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentAId = 673;
            int studentAId = 1243;
            int studentBId = 1231;

            parentServiceMock.Setup(s => s.IsStudentAssociatedWithParentAsync(parentAId, studentAId)).ReturnsAsync(true);
            parentServiceMock.Setup(s => s.IsStudentAssociatedWithParentAsync(parentAId, studentBId)).ReturnsAsync(false);
            parentServiceMock.Setup(s => s.GetStudentDetailsAsync(studentAId)).ReturnsAsync(new ParentStudentDetailsDto { StudentId = studentAId, StudentName = "Abhinav Javvadi" });

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "parentA@example.com")
            };

            // Act & Assert 1: Authorized access to Student A
            var responseA = await controller.GetStudentDetails(studentAId) as OkObjectResult;
            Assert.NotNull(responseA);
            Assert.Equal(200, responseA.StatusCode);

            // Act & Assert 2: Unauthorized access to Student B returns 403 Forbidden
            var responseB = await controller.GetStudentDetails(studentBId) as ObjectResult;
            Assert.NotNull(responseB);
            Assert.Equal(403, responseB.StatusCode);
        }

        // ==========================================
        // TEST 6: Student attendance endpoint: Parent A requesting Student B returns 403
        // ==========================================
        [Fact]
        public async Task Test06_StudentAttendanceEndpoint_UnauthorizedStudent_Returns403()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentAId = 673;
            int studentBId = 1231;

            parentServiceMock.Setup(s => s.IsStudentAssociatedWithParentAsync(parentAId, studentBId)).ReturnsAsync(false);

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "parentA@example.com")
            };

            // Act
            var response = await controller.GetAttendanceSummary(studentBId) as ObjectResult;

            // Assert
            Assert.NotNull(response);
            Assert.Equal(403, response.StatusCode);
        }

        // ==========================================
        // TEST 7: Student fees endpoint: Parent A requesting Student B returns 403
        // ==========================================
        [Fact]
        public async Task Test07_StudentFeesEndpoint_UnauthorizedStudent_Returns403()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentAId = 673;
            int studentBId = 1231;

            parentServiceMock.Setup(s => s.IsStudentAssociatedWithParentAsync(parentAId, studentBId)).ReturnsAsync(false);

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "parentA@example.com")
            };

            // Act
            var response = await controller.GetFeeSummary(studentBId) as ObjectResult;

            // Assert
            Assert.NotNull(response);
            Assert.Equal(403, response.StatusCode);
        }

        // ==========================================
        // TEST 8: Student marks/results endpoint: Parent A requesting Student B returns 403
        // ==========================================
        [Fact]
        public async Task Test08_StudentMarksResultsEndpoint_UnauthorizedStudent_Returns403()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentAId = 673;
            int studentBId = 1231;

            parentServiceMock.Setup(s => s.IsStudentAssociatedWithParentAsync(parentAId, studentBId)).ReturnsAsync(false);

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "parentA@example.com")
            };

            // Act
            var response = await controller.GetExamResults(studentBId) as ObjectResult;

            // Assert
            Assert.NotNull(response);
            Assert.Equal(403, response.StatusCode);
        }

        // ==========================================
        // TEST 9: Invalid student ID: Returns 403 Forbidden
        // ==========================================
        [Theory]
        [InlineData(0)]
        [InlineData(-1)]
        [InlineData(-999)]
        public async Task Test09_InvalidStudentId_Returns403(int invalidStudentId)
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentAId = 673;

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "parentA@example.com")
            };

            // Act
            var response = await controller.GetDashboardSummary(invalidStudentId) as ObjectResult;

            // Assert
            Assert.NotNull(response);
            Assert.Equal(403, response.StatusCode);
        }

        // ==========================================
        // TEST 10: Inactive/soft-deleted student: Is not returned
        // ==========================================
        [Fact]
        public async Task Test10_InactiveOrSoftDeletedStudent_IsNotReturned()
        {
            // Arrange
            var db = CreateInMemoryDbContext();
            SeedAcademicStructure(db);
            int parentUserId = 801;

            var activeStudent = new Student { StudentId = 1, StudentName = "Active Child", Status = "Active", IsDeleted = false, RollNumber = "R1", AdmissionNumber = "A1", ClassId = 1, SectionId = 1 };
            var deletedStudent = new Student { StudentId = 2, StudentName = "Deleted Child", Status = "Active", IsDeleted = true, RollNumber = "R2", AdmissionNumber = "A2", ClassId = 1, SectionId = 1 };
            var inactiveStudent = new Student { StudentId = 3, StudentName = "Inactive Child", Status = "Inactive", IsDeleted = false, RollNumber = "R3", AdmissionNumber = "A3", ClassId = 1, SectionId = 1 };

            db.Students.AddRange(activeStudent, deletedStudent, inactiveStudent);
            db.ParentStudentMappings.AddRange(
                new ParentStudentMapping { ParentUserId = parentUserId, StudentId = 1, Status = "Active" },
                new ParentStudentMapping { ParentUserId = parentUserId, StudentId = 2, Status = "Active" },
                new ParentStudentMapping { ParentUserId = parentUserId, StudentId = 3, Status = "Active" }
            );
            await db.SaveChangesAsync();

            var repo = new ParentRepository(db, null!);

            // Act
            var students = await repo.GetChildrenByParentUserIdAsync(parentUserId);

            // Assert
            Assert.Single(students);
            Assert.Equal(1, students[0].StudentId);
            Assert.DoesNotContain(students, s => s.StudentId == 2);
            Assert.DoesNotContain(students, s => s.StudentId == 3);
        }

        // ==========================================
        // TEST 11: Inactive/revoked relationship: Is not returned
        // ==========================================
        [Fact]
        public async Task Test11_InactiveOrRevokedRelationship_IsNotReturned()
        {
            // Arrange
            var db = CreateInMemoryDbContext();
            SeedAcademicStructure(db);
            int parentUserId = 802;

            var student1 = new Student { StudentId = 10, StudentName = "Active Mapping Child", Status = "Active", IsDeleted = false, RollNumber = "R10", AdmissionNumber = "A10", ClassId = 1, SectionId = 1 };
            var student2 = new Student { StudentId = 20, StudentName = "Revoked Mapping Child", Status = "Active", IsDeleted = false, RollNumber = "R20", AdmissionNumber = "A20", ClassId = 1, SectionId = 1 };

            db.Students.AddRange(student1, student2);
            db.ParentStudentMappings.AddRange(
                new ParentStudentMapping { ParentUserId = parentUserId, StudentId = 10, Status = "Active" },
                new ParentStudentMapping { ParentUserId = parentUserId, StudentId = 20, Status = "Inactive" }
            );
            await db.SaveChangesAsync();

            var repo = new ParentRepository(db, null!);

            // Act
            var students = await repo.GetChildrenByParentUserIdAsync(parentUserId);
            var isAssociatedActive = await repo.IsStudentAssociatedWithParentAsync(parentUserId, 10);
            var isAssociatedInactive = await repo.IsStudentAssociatedWithParentAsync(parentUserId, 20);

            // Assert
            Assert.Single(students);
            Assert.Equal(10, students[0].StudentId);
            Assert.True(isAssociatedActive);
            Assert.False(isAssociatedInactive);
        }

        // ==========================================
        // TEST 12: Unauthenticated request: Returns 401 Unauthorized for GetChildren
        // ==========================================
        [Fact]
        public async Task Test12_UnauthenticatedRequest_Returns401()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateUnauthenticatedControllerContext()
            };

            // Act
            var result = await controller.GetChildren(null) as ObjectResult;

            // Assert
            Assert.NotNull(result);
            Assert.Equal(401, result.StatusCode);
        }

        // ==========================================
        // TEST 13: Request with token of non-parent role: Returns 403 Forbidden
        // ==========================================
        [Fact]
        public async Task Test13_NonParentRoleToken_Returns403()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int teacherUserId = 305;

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(teacherUserId, "Teacher", "teacher@example.com")
            };

            // Act
            var result = await controller.GetChildren(null) as ObjectResult;

            // Assert
            Assert.NotNull(result);
            Assert.Equal(403, result.StatusCode);
        }

        // ==========================================
        // TEST 14: Manipulated parent ID in query string, route param, or header: Does not bypass authorization
        // ==========================================
        [Fact]
        public async Task Test14_ManipulatedParentIdInRequest_DoesNotBypassAuthorization()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentAId = 673;
            int parentBId = 736;

            var studentA = new ParentChildDto { StudentId = 1243, StudentName = "Abhinav Javvadi" };

            // When Parent A calls GetChildren, only Parent A's mapped children are retrieved
            parentServiceMock.Setup(s => s.GetChildrenByUserIdAsync(parentAId))
                .ReturnsAsync(new List<ParentChildDto> { studentA });

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "abhinav.javvadi124@example.com")
            };
            // Attacker attempts spoofing via X-Parent-Identifier header
            controller.HttpContext.Request.Headers["X-Parent-Identifier"] = parentBId.ToString();

            // Act: Attacker attempts override via ?identifier=736 query parameter
            var result = await controller.GetChildren(parentBId.ToString());

            // Assert
            var children = GetData<List<ParentChildDto>>(result);
            Assert.Single(children);
            Assert.Equal(1243, children[0].StudentId); // Strictly Student A, spoof attempt ignored!
            parentServiceMock.Verify(s => s.GetChildrenByUserIdAsync(parentAId), Times.Once);
            parentServiceMock.Verify(s => s.GetChildrenAsync(It.IsAny<string>()), Times.Never);
        }

        // ==========================================
        // TEST 21: Database unique constraint prevents duplicate parent-student mappings
        // ==========================================
        [Fact]
        public void Test21_ModelConfiguration_EnforcesUniqueParentStudentConstraint()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            using var db = new AppDbContext(options);
            var entityType = db.Model.FindEntityType(typeof(ParentStudentMapping));
            Assert.NotNull(entityType);

            // Verify unique index on (ParentUserId, StudentId)
            var index = entityType.GetIndexes().FirstOrDefault(i =>
                i.Properties.Count == 2 &&
                i.Properties.Any(p => p.Name == "ParentUserId") &&
                i.Properties.Any(p => p.Name == "StudentId")
            );

            Assert.NotNull(index);
            Assert.True(index.IsUnique);
        }

        // ==========================================
        // TEST 22: Database foreign key constraints prevent invalid parent or student IDs
        // ==========================================
        [Fact]
        public void Test22_ModelConfiguration_EnforcesForeignKeys()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(Guid.NewGuid().ToString())
                .Options;

            using var db = new AppDbContext(options);
            var entityType = db.Model.FindEntityType(typeof(ParentStudentMapping));
            Assert.NotNull(entityType);

            var parentUserFk = entityType.GetForeignKeys()
                .FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(User));
            var studentFk = entityType.GetForeignKeys()
                .FirstOrDefault(fk => fk.PrincipalEntityType.ClrType == typeof(Student));

            Assert.NotNull(parentUserFk);
            Assert.NotNull(studentFk);
            Assert.Equal(DeleteBehavior.Restrict, parentUserFk.DeleteBehavior);
            Assert.Equal(DeleteBehavior.Cascade, studentFk.DeleteBehavior);
        }

        // ==========================================
        // TEST 25: Dashboard summary returns correct counts for authorized student only
        // ==========================================
        [Fact]
        public async Task Test25_DashboardSummary_ReturnsDataForAuthorizedStudentOnly()
        {
            // Arrange
            var parentServiceMock = new Mock<IParentService>();
            int parentAId = 673;
            int studentAId = 1243;
            int studentBId = 1231;

            parentServiceMock.Setup(s => s.IsStudentAssociatedWithParentAsync(parentAId, studentAId)).ReturnsAsync(true);
            parentServiceMock.Setup(s => s.IsStudentAssociatedWithParentAsync(parentAId, studentBId)).ReturnsAsync(false);

            var summary = new ParentDashboardSummaryDto
            {
                StudentId = studentAId,
                StudentName = "Abhinav Javvadi",
                AttendancePercentage = 95,
                FeeDueAmount = 0
            };
            parentServiceMock.Setup(s => s.GetDashboardSummaryAsync(studentAId)).ReturnsAsync(summary);

            var controller = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "parentA@example.com")
            };

            // Act 1: Authorized student summary
            var responseA = await controller.GetDashboardSummary(studentAId);
            var dataA = GetData<ParentDashboardSummaryDto>(responseA);
            Assert.Equal(studentAId, dataA.StudentId);
            Assert.Equal(95, dataA.AttendancePercentage);

            // Act 2: Unauthorized student summary returns 403 Forbidden
            var responseB = await controller.GetDashboardSummary(studentBId) as ObjectResult;
            Assert.NotNull(responseB);
            Assert.Equal(403, responseB.StatusCode);
        }

        // ==========================================
        // TEST 26: Performance test: Student retrieval completes within acceptable latency (< 500ms)
        // ==========================================
        [Fact]
        public async Task Test26_Performance_StudentRetrievalCompletesWithin500ms()
        {
            var db = CreateInMemoryDbContext();
            SeedAcademicStructure(db);
            int parentUserId = 999;

            var student = new Student { StudentId = 55, StudentName = "Fast Query Student", Status = "Active", IsDeleted = false, RollNumber = "R55", AdmissionNumber = "A55", ClassId = 1, SectionId = 1 };
            db.Students.Add(student);
            db.ParentStudentMappings.Add(new ParentStudentMapping { ParentUserId = parentUserId, StudentId = 55, Status = "Active" });
            await db.SaveChangesAsync();

            var repo = new ParentRepository(db, null!);

            var sw = Stopwatch.StartNew();
            var children = await repo.GetChildrenByParentUserIdAsync(parentUserId);
            sw.Stop();

            Assert.Single(children);
            Assert.True(sw.ElapsedMilliseconds < 500, $"Expected latency < 500ms, actual: {sw.ElapsedMilliseconds}ms");
        }

        // ==========================================
        // TEST 27: Concurrency test: Simultaneous requests from Parent A and Parent B return isolated data
        // ==========================================
        [Fact]
        public async Task Test27_Concurrency_SimultaneousRequestsReturnIsolatedData()
        {
            var parentServiceMock = new Mock<IParentService>();
            int parentAId = 673;
            int parentBId = 736;

            var studentA = new ParentChildDto { StudentId = 1243, StudentName = "Abhinav Javvadi" };
            var studentB = new ParentChildDto { StudentId = 1231, StudentName = "Diya Javvadi" };

            parentServiceMock.Setup(s => s.GetChildrenByUserIdAsync(parentAId)).ReturnsAsync(new List<ParentChildDto> { studentA });
            parentServiceMock.Setup(s => s.GetChildrenByUserIdAsync(parentBId)).ReturnsAsync(new List<ParentChildDto> { studentB });

            var controllerA = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentAId, "Parent", "abhinav@example.com")
            };
            var controllerB = new ParentController(parentServiceMock.Object)
            {
                ControllerContext = CreateControllerContext(parentBId, "Parent", "diya@example.com")
            };

            // Run 50 concurrent requests
            var tasks = new List<Task<IActionResult>>();
            for (int i = 0; i < 25; i++)
            {
                tasks.Add(Task.Run(() => controllerA.GetChildren(null)));
                tasks.Add(Task.Run(() => controllerB.GetChildren(null)));
            }

            var results = await Task.WhenAll(tasks);

            for (int i = 0; i < 50; i++)
            {
                var children = GetData<List<ParentChildDto>>(results[i]);
                Assert.Single(children);

                if (i % 2 == 0)
                {
                    // Parent A call
                    Assert.Equal(1243, children[0].StudentId);
                }
                else
                {
                    // Parent B call
                    Assert.Equal(1231, children[0].StudentId);
                }
            }
        }

        // ==========================================
        // TEST 28: Stored XSS / Injection: Student name or parent name with script tags is preserved as plain text
        // ==========================================
        [Fact]
        public async Task Test28_StoredXSS_ScriptTagsPreservedAsPlainText()
        {
            var db = CreateInMemoryDbContext();
            SeedAcademicStructure(db);
            int parentUserId = 777;
            string xssPayload = "<script>alert('XSS')</script>";

            var student = new Student
            {
                StudentId = 77,
                StudentName = xssPayload,
                Status = "Active",
                IsDeleted = false,
                RollNumber = "XSS-1",
                AdmissionNumber = "XSS-ADM",
                ClassId = 1,
                SectionId = 1
            };

            db.Students.Add(student);
            db.ParentStudentMappings.Add(new ParentStudentMapping { ParentUserId = parentUserId, StudentId = 77, Status = "Active" });
            await db.SaveChangesAsync();

            var repo = new ParentRepository(db, null!);
            var service = new ParentService(repo);

            var children = await service.GetChildrenByUserIdAsync(parentUserId);

            Assert.Single(children);
            Assert.Equal(xssPayload, children[0].StudentName);
            // Verify that the payload is treated as string data, never executed or stripped silently
        }
    }
}
