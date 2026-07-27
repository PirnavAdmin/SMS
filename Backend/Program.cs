using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SMS.Api.Data;
using SMS.Api.Middleware;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Repositories.Implementations;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Implementations;
var builder = WebApplication.CreateBuilder(args);

// 1. MySQL Connection
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("DefaultConnection is missing in appsettings.json.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));
// 2. Register Repositories and Services
// 2. Dependency Injection Registration (Repositories & Services)
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOtpService, OtpService>();



builder.Services.AddScoped< ITransportRouteRepository, TransportRouteRepository>();
builder.Services.AddScoped<ITransportRouteService,TransportRouteService>();

builder.Services.AddScoped<IPickupPointRepository, PickupPointRepository>();
builder.Services.AddScoped<IPickupPointService, PickupPointService>();
builder.Services.AddScoped<ITransportVehicleRepository, TransportVehicleRepository>();
builder.Services.AddScoped<ITransportVehicleRepository, TransportVehicleRepository>();
builder.Services.AddScoped<ITransportVehicleService, TransportVehicleService>();
builder.Services.AddScoped<ITransportDriverRepository,TransportDriverRepository>();
builder.Services.AddScoped<ITransportDriverService, TransportDriverService>();
builder.Services.AddScoped<ITransportVehicleAssignmentRepository,TransportVehicleAssignmentRepository>();
builder.Services.AddScoped<ITransportVehicleAssignmentService,TransportVehicleAssignmentService>();
builder.Services.AddScoped<IStudentTransportAssignmentRepository,StudentTransportAssignmentRepository>();
builder.Services.AddScoped<IStudentTransportAssignmentService,StudentTransportAssignmentService>();
builder.Services.AddScoped<IVehicleMaintenanceRepository,VehicleMaintenanceRepository>();

builder.Services.AddScoped<IVehicleMaintenanceService,VehicleMaintenanceService>();
builder.Services.AddScoped<ITransportDashboardRepository,TransportDashboardRepository>();
builder.Services.AddScoped<ITransportReportRepository,TransportReportRepository>();


builder.Services.AddScoped<ITransportReportService,TransportReportService>();

builder.Services.AddScoped<
    ITransportDashboardService,
    TransportDashboardService>();

// Transport Management
builder.Services.AddScoped<ITransportRepository, TransportRepository>();
builder.Services.AddScoped<ITransportService, TransportService>();

// Academic & School Management
builder.Services.AddScoped<ISchoolRepository, SchoolRepository>();
builder.Services.AddScoped<ISchoolService, SchoolService>();

// 3. Configure JWT Authentication
var jwtKey = Environment.GetEnvironmentVariable("SMS_JWT_KEY")
    ?? builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT Key is missing.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = System.Security.Claims.ClaimTypes.Role,
            NameClaimType = System.Security.Claims.ClaimTypes.Name
        };
    });

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();

// 4. Configure Swagger UI with JWT Bearer Security Scheme
builder.Services.AddSwaggerGen(options =>
{
    options.CustomSchemaIds(type => type.FullName);
    options.ResolveConflictingActions(apiDescriptions => apiDescriptions.First());

    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SMS.Api",
        Version = "v1"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT Bearer token below.\n\nExample: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// 5. Custom Middleware Pipeline
app.UseMiddleware<ExceptionMiddleware>();

// Enable Swagger UI unconditionally
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

// 6. Security Pipeline Order
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// =========================================================
// AUTOMATIC SEED: Ensure Admin User Exists For Login
// =========================================================
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Safe Schema Synchronization for MySQL (No table collision errors)
    try
    {
        context.Database.ExecuteSqlRaw(@"
            CREATE TABLE IF NOT EXISTS `Departments` (
                `DepartmentId` int NOT NULL AUTO_INCREMENT,
                `DepartmentName` varchar(150) NOT NULL,
                `DepartmentCode` varchar(50) NULL,
                `Description` varchar(500) NULL,
                `Status` varchar(20) NOT NULL DEFAULT 'Active',
                `CreatedDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (`DepartmentId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

            CREATE TABLE IF NOT EXISTS `departments` (
                `DepartmentId` int NOT NULL AUTO_INCREMENT,
                `DepartmentName` varchar(150) NOT NULL,
                `DepartmentCode` varchar(50) NULL,
                `Description` varchar(500) NULL,
                `Status` varchar(20) NOT NULL DEFAULT 'Active',
                `CreatedDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (`DepartmentId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        ");

        void EnsureColumnExists(string table, string column, string columnDef)
        {
            try
            {
                var exists = context.Database.SqlQueryRaw<int>(
                    "SELECT COUNT(1) AS Value FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = {0} AND COLUMN_NAME = {1}",
                    table, column
                ).AsEnumerable().FirstOrDefault() > 0;

                if (!exists)
                {
#pragma warning disable EF1002
                    context.Database.ExecuteSqlRaw($"ALTER TABLE `{table}` ADD COLUMN `{column}` {columnDef};");
#pragma warning restore EF1002
                }
            }
            catch { }
        }

        EnsureColumnExists("Subjects", "DepartmentId", "int NOT NULL DEFAULT 1");
        EnsureColumnExists("subjects", "DepartmentId", "int NOT NULL DEFAULT 1");
    }
    catch { }

    // 1. Ensure All System Roles Exist
    var defaultRoles = new[]
    {
        new Role { RoleName = "SuperAdmin", Description = "System Owner" },
        new Role { RoleName = "Admin", Description = "School Administrator" },
        new Role { RoleName = "Teacher", Description = "Teacher / Faculty" },
        new Role { RoleName = "Student", Description = "Student Account" },
        new Role { RoleName = "Parent", Description = "Parent / Guardian" }
    };

    foreach (var r in defaultRoles)
    {
        if (!context.Roles.Any(x => x.RoleName == r.RoleName))
        {
            context.Roles.Add(r);
        }
    }
    context.SaveChanges();

    var superAdminRole = context.Roles.FirstOrDefault(r => r.RoleName == "SuperAdmin");
    var adminRole = context.Roles.FirstOrDefault(r => r.RoleName == "Admin");

    // 2. Ensure Admin User with BCrypt hash for "admin1234"
    var adminUser = context.Users.Include(u => u.Roles).FirstOrDefault(u => u.Email == "admin@pirnavschools.com");
    if (adminUser == null)
    {
        adminUser = new User
        {
            FullName = "Dr. Eleanor Vance",
            Email = "admin@pirnavschools.com",
            MobileNumber = "9876543210",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1234"),
            Role = "Admin",
            IsEmailVerified = true,
            IsMobileVerified = true,
            CreatedAt = DateTime.UtcNow
        };
        if (adminRole != null) adminUser.Roles.Add(adminRole);
        if (superAdminRole != null) adminUser.Roles.Add(superAdminRole);
        context.Users.Add(adminUser);
        context.SaveChanges();
    }
    else
    {
        // Force reset password to "admin1234"
        adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1234");
        if (adminRole != null && !adminUser.Roles.Any(r => r.RoleName == "Admin"))
        {
            adminUser.Roles.Add(adminRole);
        }
        if (superAdminRole != null && !adminUser.Roles.Any(r => r.RoleName == "SuperAdmin"))
        {
            adminUser.Roles.Add(superAdminRole);
        }
        context.SaveChanges();
    }

    // 3. Ensure Sample Staff Members Exist
    if (!context.Staff.Any())
    {
        var sampleStaff = new List<Staff>
        {
            new Staff
            {
                EmployeeId = "EMP101",
                FirstName = "Dr. Robert",
                LastName = "Vance",
                Email = "robert.vance@pirnavschools.com",
                Phone = "9876543210",
                Designation = "Senior Physics Teacher",
                Department = "Science",
                MonthlySalary = 65000,
                IsActive = true
            },
            new Staff
            {
                EmployeeId = "EMP102",
                FirstName = "Sarah",
                LastName = "Jenkins",
                Email = "sarah.jenkins@pirnavschools.com",
                Phone = "9876543211",
                Designation = "Math Department Lead",
                Department = "Mathematics",
                MonthlySalary = 70000,
                IsActive = true
            },
            new Staff
            {
                EmployeeId = "EMP103",
                FirstName = "David",
                LastName = "Miller",
                Email = "david.miller@pirnavschools.com",
                Phone = "9876543212",
                Designation = "English Faculty",
                Department = "Humanities",
                MonthlySalary = 58000,
                IsActive = true
            }
        };
        context.Staff.AddRange(sampleStaff);
        context.SaveChanges();
    }

    // 4. Ensure Sample Departments & Subjects Exist
    try
    {
        if (!context.Departments.Any())
        {
            var mathDept = new Department { DepartmentName = "Mathematics", DepartmentCode = "DEPT-MTH", Description = "Department of Mathematics & Statistics", Status = "Active" };
            var sciDept = new Department { DepartmentName = "Science", DepartmentCode = "DEPT-SCI", Description = "Physics, Chemistry & Biology", Status = "Active" };
            var langDept = new Department { DepartmentName = "Languages", DepartmentCode = "DEPT-ENG", Description = "English & Foreign Languages", Status = "Active" };

            context.Departments.AddRange(mathDept, sciDept, langDept);
            context.SaveChanges();

            if (!context.Subjects.Any())
            {
                var sampleSubjects = new List<Subject>
                {
                    new Subject { SubjectCode = "MATH101", SubjectName = "Mathematics", CourseCode = "MATH", DepartmentId = mathDept.DepartmentId },
                    new Subject { SubjectCode = "PHY101", SubjectName = "Physics", CourseCode = "PHY", DepartmentId = sciDept.DepartmentId },
                    new Subject { SubjectCode = "ENG101", SubjectName = "English Literature", CourseCode = "ENG", DepartmentId = langDept.DepartmentId },
                    new Subject { SubjectCode = "CHEM101", SubjectName = "Chemistry", CourseCode = "CHEM", DepartmentId = sciDept.DepartmentId }
                };
                context.Subjects.AddRange(sampleSubjects);
                context.SaveChanges();
            }
        }
    }
    catch { /* Ignore if table creation is pending */ }

    // 5. Ensure Default Academic Classes & Sections Exist
    if (!context.Classes.Any())
    {
        var staff1 = context.Staff.FirstOrDefault();
        var staff2 = context.Staff.Skip(1).FirstOrDefault();

        for (int i = 1; i <= 12; i++)
        {
            var cls = new ClassGrade { ClassName = $"Class {i}" };
            if (i == 1)
            {
                cls.Sections.Add(new ClassSection { SectionName = "A", ClassTeacherEmpId = staff1?.StaffId });
            }
            else if (i == 2)
            {
                cls.Sections.Add(new ClassSection { SectionName = "A", ClassTeacherEmpId = staff2?.StaffId });
            }
            else if (i == 9)
            {
                cls.Sections.Add(new ClassSection { SectionName = "A", ClassTeacherEmpId = staff1?.StaffId });
                cls.Sections.Add(new ClassSection { SectionName = "B", ClassTeacherEmpId = staff2?.StaffId });
            }
            context.Classes.Add(cls);
            context.SaveChanges();
        }
    }

    // 6. Ensure Sample Admission Applications Exist
    if (!context.AdmissionApplications.Any())
    {
        var firstClass = context.Classes.FirstOrDefault();
        var sampleApp = new AdmissionApplication
        {
            RegistrationNo = "REG-1001",
            FirstName = "Alexander",
            LastName = "Wright",
            DateOfBirth = new DateTime(2012, 8, 15),
            Gender = "Male",
            AppliedClassId = firstClass?.ClassId ?? 1,
            BranchName = "Main Campus",
            BloodGroup = "O+",
            Religion = "General",
            Caste = "General",
            FatherName = "Robert Wright",
            MotherName = "Eleanor Wright",
            FatherContact = "9876543210",
            MotherMobileNumber = "9876543211",
            ParentEmail = "robert.wright@example.com",
            HouseNo = "742",
            Street = "Evergreen Terrace",
            AreaLocality = "Springfield Suburbs",
            City = "Springfield",
            District = "Knowledge District",
            State = "NY",
            PinCode = "10001",
            NumberOfSiblings = 1,
            TransportRequired = true,
            TransportType = "AC Bus",
            BusRoute = "Route A",
            PickupPoint = "Stop #4",
            Scholarship = "Merit Scholarship",
            Discount = "None",
            Status = "Pending"
        };
        context.AdmissionApplications.Add(sampleApp);
        context.SaveChanges();
    }
}

app.Run();