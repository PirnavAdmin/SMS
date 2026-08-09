using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Controllers.AcademicManagement;
using SMS.Api.Data;
using SMS.Api.Dtos.AcademicManagement;
using SMS.Api.Models.AcademicManagement;
using Xunit;

namespace Backend.Tests.Controllers
{
    public class ClassesControllerTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new AppDbContext(options);
        }

        private void SetupControllerContext(ClassesController controller)
        {
            var httpContext = new Microsoft.AspNetCore.Http.DefaultHttpContext();
            httpContext.Request.Headers["X-Branch-Id"] = "Main Campus";
            httpContext.Request.Headers["X-Academic-Year-Id"] = "2026-2027";
            
            var claims = new List<System.Security.Claims.Claim>
            {
                new System.Security.Claims.Claim("id", "1"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, "Admin"),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "Admin")
            };
            var identity = new System.Security.Claims.ClaimsIdentity(claims, "TestAuth");
            var principal = new System.Security.Claims.ClaimsPrincipal(identity);
            httpContext.User = principal;
            
            controller.ControllerContext = new ControllerContext { HttpContext = httpContext };
        }

        [Fact]
        public async Task GetClasses_ReturnsOkWithList()
        {
            using var db = GetInMemoryDbContext();
            db.Classes.Add(new ClassGrade { ClassId = 1, ClassName = "Grade 10", CampusLocation = "Main Campus", AcademicYear = "2026-2027" });
            await db.SaveChangesAsync();

            var controller = new ClassesController(db);
            SetupControllerContext(controller);

            var result = await controller.GetClasses();

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task GetClassById_ReturnsOkWithDto()
        {
            using var db = GetInMemoryDbContext();
            db.Classes.Add(new ClassGrade { ClassId = 1, ClassName = "Grade 10", CampusLocation = "Main Campus", AcademicYear = "2026-2027" });
            await db.SaveChangesAsync();

            var controller = new ClassesController(db);
            SetupControllerContext(controller);

            var result = await controller.GetClassById(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task CreateClassGrade_ReturnsOk()
        {
            using var db = GetInMemoryDbContext();
            var controller = new ClassesController(db);
            SetupControllerContext(controller);

            var dto = new CreateClassGradeDto 
            { 
                ClassName = "Grade 11",
                CampusLocation = "Main Campus",
                AcademicYear = "2026-2027",
                Status = "Active",
                Sections = new List<SectionAssignmentDto> { new SectionAssignmentDto { SectionName = "A" } }
            };

            var result = await controller.CreateClassGrade(dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task UpdateClassGrade_ReturnsOk()
        {
            using var db = GetInMemoryDbContext();
            var classObj = new ClassGrade { ClassId = 1, ClassName = "Grade 11 Old", CampusLocation = "Main Campus", AcademicYear = "2026-2027" };
            db.Classes.Add(classObj);
            await db.SaveChangesAsync();

            var controller = new ClassesController(db);
            SetupControllerContext(controller);

            var dto = new CreateClassGradeDto 
            { 
                ClassName = "Grade 11 Updated",
                CampusLocation = "Main Campus",
                AcademicYear = "2026-2027",
                Status = "Active"
            };

            var result = await controller.UpdateClassGrade(1, dto);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }

        [Fact]
        public async Task DeleteClassGrade_ReturnsOk()
        {
            using var db = GetInMemoryDbContext();
            var classObj = new ClassGrade { ClassId = 1, ClassName = "Grade 11 ToDelete", CampusLocation = "Main Campus", AcademicYear = "2026-2027" };
            db.Classes.Add(classObj);
            await db.SaveChangesAsync();

            var controller = new ClassesController(db);
            SetupControllerContext(controller);

            var result = await controller.DeleteClassGrade(1);

            var okResult = Assert.IsType<OkObjectResult>(result);
            Assert.NotNull(okResult.Value);
        }
    }
}
