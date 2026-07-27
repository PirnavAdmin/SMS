using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SMS.Api.Data;
using SMS.Api.Middleware;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations;
using SMS.Api.Services.Interfaces;

using SMS.Api.Repositories.Implementations;


var builder = WebApplication.CreateBuilder(args);

// =========================================================
// 1. DATABASE CONNECTION
// =========================================================

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "DefaultConnection is missing in appsettings.json.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)));

// =========================================================
// 2. DEPENDENCY INJECTION
// =========================================================

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOtpService, OtpService>();

// Transport Route
builder.Services.AddScoped<
    ITransportRouteRepository,
    TransportRouteRepository>();

builder.Services.AddScoped<
    ITransportRouteService,
    TransportRouteService>();

// Pickup Point
builder.Services.AddScoped<
    IPickupPointRepository,
    PickupPointRepository>();

builder.Services.AddScoped<
    IPickupPointService,
    PickupPointService>();

// Transport Vehicle
builder.Services.AddScoped<
    ITransportVehicleRepository,
    TransportVehicleRepository>();

builder.Services.AddScoped<
    ITransportVehicleService,
    TransportVehicleService>();

// Transport Driver
builder.Services.AddScoped<
    ITransportDriverRepository,
    TransportDriverRepository>();

builder.Services.AddScoped<
    ITransportDriverService,
    TransportDriverService>();

// Vehicle Assignment
builder.Services.AddScoped<
    ITransportVehicleAssignmentRepository,
    TransportVehicleAssignmentRepository>();

builder.Services.AddScoped<
    ITransportVehicleAssignmentService,
    TransportVehicleAssignmentService>();

// Student Transport Assignment
builder.Services.AddScoped<
    IStudentTransportAssignmentRepository,
    StudentTransportAssignmentRepository>();

builder.Services.AddScoped<
    IStudentTransportAssignmentService,
    StudentTransportAssignmentService>();

// Vehicle Maintenance
builder.Services.AddScoped<
    IVehicleMaintenanceRepository,
    VehicleMaintenanceRepository>();

builder.Services.AddScoped<
    IVehicleMaintenanceService,
    VehicleMaintenanceService>();

// Transport Dashboard
builder.Services.AddScoped<
    ITransportDashboardRepository,
    TransportDashboardRepository>();

builder.Services.AddScoped<
    ITransportDashboardService,
    TransportDashboardService>();

// Transport Reports
builder.Services.AddScoped<
    ITransportReportRepository,
    TransportReportRepository>();

builder.Services.AddScoped<
    ITransportReportService,
    TransportReportService>();

// Academic and School Management
builder.Services.AddScoped<ISchoolRepository, SchoolRepository>();

builder.Services.AddScoped<ISchoolService, SchoolService>();

builder.Services.AddScoped<IExamMasterRepository, ExamMasterRepository>();

builder.Services.AddScoped<IExamMasterService, ExamMasterService>();

// Transport Management
builder.Services.AddScoped<ITransportRepository, TransportRepository>();
builder.Services.AddScoped<ITransportService, TransportService>();

// =========================================================
// 3. JWT AUTHENTICATION
// =========================================================

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is missing in appsettings.json.");

var jwtIssuer = builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer is missing in appsettings.json.");

var jwtAudience = builder.Configuration["Jwt:Audience"]
    ?? throw new InvalidOperationException(
        "Jwt:Audience is missing in appsettings.json.");

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = jwtIssuer,
                ValidAudience = jwtAudience,

                IssuerSigningKey = new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(jwtKey)),

                RoleClaimType = System.Security.Claims.ClaimTypes.Role,
                NameClaimType = System.Security.Claims.ClaimTypes.Name,
                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();

// =========================================================
// 4. CONTROLLERS AND SWAGGER
// =========================================================

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "SMS.Api",
            Version = "v1"
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description =
                "Enter the JWT token without writing the word Bearer."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
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

    options.CustomSchemaIds(type => type.FullName);
    options.ResolveConflictingActions(
        apiDescriptions => apiDescriptions.First());
});

var app = builder.Build();

// =========================================================
// 5. MIDDLEWARE PIPELINE
// =========================================================

app.UseMiddleware<ExceptionMiddleware>();

// Enable Swagger UI unconditionally
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// =========================================================
// 6. APPLY MIGRATIONS AND SEED DATABASE
// =========================================================

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;

    try
    {
        var context =
            services.GetRequiredService<AppDbContext>();

        // Safe schema initialization retained from the existing file.
        try
        {
            context.Database.ExecuteSqlRaw(@"
                CREATE TABLE IF NOT EXISTS `transport_vehicles` (
                    `VehicleId` bigint NOT NULL AUTO_INCREMENT,
                    `VehicleNumber` varchar(50) NOT NULL,
                    `RegistrationNumber` varchar(50) NOT NULL,
                    `VehicleName` varchar(100) NOT NULL DEFAULT '',
                    `VehicleType` varchar(50) NOT NULL DEFAULT 'Bus',
                    `Manufacturer` varchar(100) NOT NULL DEFAULT '',
                    `Model` varchar(100) NOT NULL DEFAULT '',
                    `InsuranceNumber` varchar(100) NOT NULL DEFAULT '',
                    `InsuranceExpiry` datetime(6) NULL,
                    `PollutionExpiry` datetime(6) NULL,
                    `FitnessExpiry` datetime(6) NULL,
                    `Capacity` int NOT NULL DEFAULT 40,
                    `IsAC` tinyint(1) NOT NULL DEFAULT 1,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    PRIMARY KEY (`VehicleId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
                CREATE TABLE IF NOT EXISTS `transport_routes` (
                    `RouteId` bigint NOT NULL AUTO_INCREMENT,
                    `RouteCode` varchar(30) NOT NULL,
                    `RouteName` varchar(150) NOT NULL,
                    `StartLocation` varchar(150) NOT NULL DEFAULT '',
                    `EndLocation` varchar(150) NOT NULL DEFAULT '',
                    `PickupPoint` varchar(255) NOT NULL DEFAULT '',
                    `DropPoint` varchar(255) NOT NULL DEFAULT '',
                    `DistanceKm` decimal(10,2) NOT NULL DEFAULT 0,
                    `EstimatedDurationMinutes` int NOT NULL DEFAULT 30,
                    `Description` varchar(500) NOT NULL DEFAULT '',
                    `MonthlyFee` decimal(18,2) NOT NULL DEFAULT 0,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    `VehicleId` bigint NULL,
                    PRIMARY KEY (`RouteId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
                CREATE TABLE IF NOT EXISTS `transport_drivers` (
                    `DriverId` bigint NOT NULL AUTO_INCREMENT,
                    `DriverName` varchar(100) NOT NULL,
                    `LicenceNumber` varchar(50) NOT NULL,
                    `LicenceExpiry` datetime(6) NULL,
                    `MobileNumber` varchar(20) NOT NULL,
                    `AlternateMobileNumber` varchar(20) NOT NULL DEFAULT '',
                    `Address` varchar(255) NOT NULL DEFAULT '',
                    `BloodGroup` varchar(10) NOT NULL DEFAULT '',
                    `EmergencyContactName` varchar(100) NOT NULL DEFAULT '',
                    `EmergencyContactNumber` varchar(20) NOT NULL DEFAULT '',
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    `AssignedVehicleId` bigint NULL,
                    PRIMARY KEY (`DriverId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
                CREATE TABLE IF NOT EXISTS `transport_pickup_points` (
                    `PickupPointId` bigint NOT NULL AUTO_INCREMENT,
                    `RouteId` bigint NOT NULL,
                    `PickupPointName` varchar(150) NOT NULL,
                    `Landmark` varchar(250) NULL,
                    `SequenceNo` int NOT NULL DEFAULT 1,
                    `PickupTime` time NOT NULL DEFAULT '00:00:00',
                    `DistanceFromStart` decimal(10,2) NOT NULL DEFAULT 0,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    PRIMARY KEY (`PickupPointId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
                CREATE TABLE IF NOT EXISTS `transport_vehicle_assignments` (
                    `AssignmentId` bigint NOT NULL AUTO_INCREMENT,
                    `RouteId` bigint NOT NULL,
                    `VehicleId` bigint NOT NULL,
                    `DriverId` bigint NOT NULL,
                    `EffectiveFrom` datetime(6) NOT NULL,
                    `EffectiveTo` datetime(6) NULL,
                    `Shift` varchar(20) NULL,
                    `Remarks` varchar(255) NULL,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    PRIMARY KEY (`AssignmentId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
                CREATE TABLE IF NOT EXISTS `student_transport_assignments` (
                    `StudentTransportAssignmentId` bigint NOT NULL AUTO_INCREMENT,
                    `StudentId` bigint NOT NULL,
                    `RouteId` bigint NOT NULL,
                    `PickupPointId` bigint NOT NULL,
                    `VehicleAssignmentId` bigint NOT NULL,
                    `TransportType` varchar(20) NOT NULL DEFAULT 'AC',
                    `EffectiveFrom` datetime(6) NOT NULL,
                    `EffectiveTo` datetime(6) NULL,
                    `Remarks` varchar(255) NULL,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    PRIMARY KEY (`StudentTransportAssignmentId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
                CREATE TABLE IF NOT EXISTS `transport_vehicle_maintenance` (
                    `maintenance_id` bigint NOT NULL AUTO_INCREMENT,
                    `vehicle_id` bigint NOT NULL,
                    `service_type` varchar(150) NOT NULL,
                    `service_date` date NOT NULL,
                    `cost` decimal(12,2) NOT NULL DEFAULT 0,
                    `vendor_center` varchar(150) NULL,
                    `next_service_due` date NULL,
                    `remarks` varchar(500) NULL,
                    `status` tinyint(1) NOT NULL DEFAULT 1,
                    `is_deleted` tinyint(1) NOT NULL DEFAULT 0,
                    `created_by` bigint NULL,
                    `updated_by` bigint NULL,
                    `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `updated_at` datetime(6) NULL,
                    PRIMARY KEY (`maintenance_id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    
                CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
                    `MigrationId` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
                    `ProductVersion` varchar(32) CHARACTER SET utf8mb4 NOT NULL,
                    CONSTRAINT `PK___EFMigrationsHistory` PRIMARY KEY (`MigrationId`)
                ) CHARACTER SET=utf8mb4;
    
                INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`) VALUES
                ('20260722050151_InitialCreate', '9.0.0'),
                ('20260722064533_AddAcademicClassManagement', '9.0.0'),
                ('20260722111607_AddTransportRouteMaster', '9.0.0'),
                ('20260722112301_InitialCleanSetup', '9.0.0'),
                ('20260722113738_AddPickupPointMaster', '9.0.0'),
                ('20260722175324_AddTransportVehicleMaster', '9.0.0'),
                ('20260723040503_AddTransportDriverMaster', '9.0.0'),
                ('20260723042707_AddTransportVehicleAssignment', '9.0.0'),
                ('20260723050948_AddStudentTransportAssignment', '9.0.0'),
                ('20260723052220_AddExtendedAdmissionFields', '9.0.0'),
                ('20260723053901_AddFirstNameAndLastNameToAdmission', '9.0.0'),
                ('20260723054607_AddAllExtendedFieldsAndFinancialBenefitsToAdmission', '9.0.0'),
                ('20260723055420_RemoveStudentNameAndStudentTypeFromAdmission', '9.0.0'),
                ('20260723063756_FixAdmissionApplicationClassGradeForeignKey', '9.0.0'),
                ('20260723084335_AddVehicleMaintenance', '9.0.0'),
                ('20260723103949_AddTransportPerformanceIndexes', '9.0.0'),
                ('20260723133619_TransportModuleFullSetup', '9.0.0');
            ");

            // Migration column sync for existing tables (Check INFORMATION_SCHEMA first to prevent EF Core error logs)
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
                        context.Database.ExecuteSqlRaw($"ALTER TABLE `{table}` ADD COLUMN `{column}` {columnDef};");
                    }
                }
                catch { }
            }

            EnsureColumnExists("transport_routes", "VehicleId", "bigint NULL");
            EnsureColumnExists("transport_drivers", "AssignedVehicleId", "bigint NULL");
            EnsureColumnExists("transport_vehicle_assignments", "Shift", "varchar(20) NULL");
            EnsureColumnExists("student_transport_assignments", "Remarks", "varchar(255) NULL");

            // DB Schema Audit Verification
            try
            {
                var cols = context.Database.SqlQueryRaw<string>(
                    "SELECT CONCAT(TABLE_NAME, '.', COLUMN_NAME, ' (', DATA_TYPE, ')') FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND (TABLE_NAME LIKE 'transport%' OR TABLE_NAME LIKE '%transport%')"
                ).ToList();
                Console.WriteLine("=== DATABASE TRANSPORT TABLES AUDIT ===");
                foreach (var col in cols)
                {
<<<<<<< HEAD
                    Console.WriteLine($"DB SCHEMA: {col}");
=======
#pragma warning disable EF1002
                    context.Database.ExecuteSqlRaw($"ALTER TABLE `{table}` ADD COLUMN `{column}` {columnDef};");
#pragma warning restore EF1002
>>>>>>> 1795679efc28df2336d7d8edc61b64032ca71afd
                }
                Console.WriteLine("=======================================");
            }
            catch { }
        }
<<<<<<< HEAD
        catch
=======

        EnsureColumnExists("transport_routes", "VehicleId", "bigint NULL");
        EnsureColumnExists("transport_routes", "PickupPoint", "varchar(255) NULL");
        EnsureColumnExists("transport_routes", "DropPoint", "varchar(255) NULL");
        EnsureColumnExists("transport_drivers", "AssignedVehicleId", "bigint NULL");
        EnsureColumnExists("transport_vehicle_assignments", "Shift", "varchar(20) NULL");
        EnsureColumnExists("student_transport_assignments", "Remarks", "varchar(255) NULL");
        EnsureColumnExists("transport_vehicles", "ChassisNumber", "varchar(100) NULL");
        EnsureColumnExists("transport_vehicles", "EngineNumber", "varchar(100) NULL");
        EnsureColumnExists("transport_vehicles", "GpsDeviceId", "varchar(100) NULL");

        try
        {
            context.Database.ExecuteSqlRaw("ALTER TABLE transport_routes MODIFY COLUMN DropPoint varchar(255) NULL;");
            context.Database.ExecuteSqlRaw("ALTER TABLE transport_routes MODIFY COLUMN PickupPoint varchar(255) NULL;");
        }
        catch { }

        // DB Schema Audit Verification
        try
>>>>>>> 1795679efc28df2336d7d8edc61b64032ca71afd
        {
            // Ignore if the compatibility schema initialization already ran.
        }

        // Apply all pending EF Core migrations.
        context.Database.Migrate();

        // =================================================
        // SEED ROLES
        // =================================================

        var defaultRoles = new[]
        {
            new Role
            {
                RoleName = "SuperAdmin",
                Description = "System Owner"
            },
            new Role
            {
                RoleName = "Admin",
                Description = "School Administrator"
            },
            new Role
            {
                RoleName = "Teacher",
                Description = "Teacher / Faculty"
            },
            new Role
            {
                RoleName = "Student",
                Description = "Student Account"
            },
            new Role
            {
                RoleName = "Parent",
                Description = "Parent / Guardian"
            }
        };

        foreach (var role in defaultRoles)
        {
            var roleExists = await context.Roles.AnyAsync(
                x => x.RoleName == role.RoleName);

            if (!roleExists)
            {
                await context.Roles.AddAsync(role);
            }
        }

        await context.SaveChangesAsync();

        var superAdminRole =
            await context.Roles.FirstOrDefaultAsync(
                x => x.RoleName == "SuperAdmin");

        var adminRole =
            await context.Roles.FirstOrDefaultAsync(
                x => x.RoleName == "Admin");

        // =================================================
        // SEED ADMIN USER
        // =================================================

        const string adminEmail =
            "admin@pirnavschools.com";

        var adminUser =
            await context.Users
                .Include(x => x.Roles)
                .FirstOrDefaultAsync(
                    x => x.Email == adminEmail);

        if (adminUser == null)
        {
            adminUser = new User
            {
                FullName = "Dr. Eleanor Vance",
                Email = adminEmail,
                MobileNumber = "9876543210",

                PasswordHash =
                    BCrypt.Net.BCrypt.HashPassword(
                        "admin1234"),

                Role = "Admin",
                IsEmailVerified = true,
                IsMobileVerified = true,
                CreatedAt = DateTime.UtcNow
            };

            if (adminRole != null)
            {
                adminUser.Roles.Add(adminRole);
            }

            if (superAdminRole != null)
            {
                adminUser.Roles.Add(superAdminRole);
            }

            await context.Users.AddAsync(adminUser);
        }
        else
        {
            // Remove these two lines later if you do not want
            // the password reset every time the API starts.
            adminUser.PasswordHash =
                BCrypt.Net.BCrypt.HashPassword(
                    "admin1234");

            adminUser.Role = "Admin";

            if (adminRole != null &&
                adminUser.Roles.All(
                    x => x.RoleName != "Admin"))
            {
                adminUser.Roles.Add(adminRole);
            }

            if (superAdminRole != null &&
                adminUser.Roles.All(
                    x => x.RoleName != "SuperAdmin"))
            {
                adminUser.Roles.Add(superAdminRole);
            }
        }

        await context.SaveChangesAsync();

        // =================================================
        // SEED STAFF
        // =================================================

        if (!await context.Staff.AnyAsync())
        {
            var sampleStaff = new List<Staff>
            {
                new()
                {
                    EmployeeId = "EMP101",
                    FirstName = "Dr. Robert",
                    LastName = "Vance",
                    Email =
                        "robert.vance@pirnavschools.com",
                    Phone = "9876543210",
                    Designation =
                        "Senior Physics Teacher",
                    Department = "Science",
                    MonthlySalary = 65000,
                    IsActive = true
                },
                new()
                {
                    EmployeeId = "EMP102",
                    FirstName = "Sarah",
                    LastName = "Jenkins",
                    Email =
                        "sarah.jenkins@pirnavschools.com",
                    Phone = "9876543211",
                    Designation =
                        "Math Department Lead",
                    Department = "Mathematics",
                    MonthlySalary = 70000,
                    IsActive = true
                },
                new()
                {
                    EmployeeId = "EMP103",
                    FirstName = "David",
                    LastName = "Miller",
                    Email =
                        "david.miller@pirnavschools.com",
                    Phone = "9876543212",
                    Designation = "English Faculty",
                    Department = "Humanities",
                    MonthlySalary = 58000,
                    IsActive = true
                }
            };

            await context.Staff.AddRangeAsync(
                sampleStaff);

            await context.SaveChangesAsync();
        }

        // =================================================
        // SEED SUBJECTS
        // =================================================

        if (!await context.Subjects.AnyAsync())
        {
            var sampleSubjects = new List<Subject>
            {
                new()
                {
                    SubjectCode = "MATH101",
                    SubjectName = "Mathematics",
                    CourseCode = "MATH"
                },
                new()
                {
                    SubjectCode = "PHY101",
                    SubjectName = "Physics",
                    CourseCode = "PHY"
                },
                new()
                {
                    SubjectCode = "ENG101",
                    SubjectName =
                        "English Literature",
                    CourseCode = "ENG"
                },
                new()
                {
                    SubjectCode = "CHEM101",
                    SubjectName = "Chemistry",
                    CourseCode = "CHEM"
                }
            };

            await context.Subjects.AddRangeAsync(
                sampleSubjects);

            await context.SaveChangesAsync();
        }

        // =================================================
        // SEED CLASSES AND SECTIONS
        // =================================================

        if (!await context.Classes.AnyAsync())
        {
            var staffMembers =
                await context.Staff
                    .OrderBy(x => x.StaffId)
                    .Take(2)
                    .ToListAsync();

            var staff1 = staffMembers.ElementAtOrDefault(0);
            var staff2 = staffMembers.ElementAtOrDefault(1);

            for (var classNumber = 1;
                 classNumber <= 12;
                 classNumber++)
            {
                var classGrade = new ClassGrade
                {
                    ClassName = $"Class {classNumber}"
                };

                if (classNumber == 1)
                {
                    classGrade.Sections.Add(
                        new ClassSection
                        {
                            SectionName = "A",
                            ClassTeacherEmpId =
                                staff1?.StaffId
                        });
                }
                else if (classNumber == 2)
                {
                    classGrade.Sections.Add(
                        new ClassSection
                        {
                            SectionName = "A",
                            ClassTeacherEmpId =
                                staff2?.StaffId
                        });
                }
                else if (classNumber == 9)
                {
                    classGrade.Sections.Add(
                        new ClassSection
                        {
                            SectionName = "A",
                            ClassTeacherEmpId =
                                staff1?.StaffId
                        });

                    classGrade.Sections.Add(
                        new ClassSection
                        {
                            SectionName = "B",
                            ClassTeacherEmpId =
                                staff2?.StaffId
                        });
                }

                await context.Classes.AddAsync(
                    classGrade);
            }

            // Save once after all classes are added.
            await context.SaveChangesAsync();
        }

        // =================================================
        // SEED ADMISSION APPLICATION
        // =================================================

        if (!await context.AdmissionApplications.AnyAsync())
        {
            var firstClass =
                await context.Classes
                    .OrderBy(x => x.ClassId)
                    .FirstOrDefaultAsync();

            if (firstClass != null)
            {
                var sampleApplication =
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1001",
                        FirstName = "Alexander",
                        LastName = "Wright",

                        DateOfBirth =
                            new DateTime(2012, 8, 15),

                        Gender = "Male",
                        AppliedClassId =
                            firstClass.ClassId,

                        BranchName = "Main Campus",
                        BloodGroup = "O+",
                        Religion = "General",
                        Caste = "General",

                        FatherName = "Robert Wright",
                        MotherName = "Eleanor Wright",

                        FatherContact =
                            "9876543210",

                        MotherMobileNumber =
                            "9876543211",

                        ParentEmail =
                            "robert.wright@example.com",

                        HouseNo = "742",
                        Street = "Evergreen Terrace",

                        AreaLocality =
                            "Springfield Suburbs",

                        City = "Springfield",

                        District =
                            "Knowledge District",

                        State = "NY",
                        PinCode = "10001",

                        NumberOfSiblings = 1,
                        TransportRequired = true,
                        TransportType = "AC Bus",
                        BusRoute = "Route A",
                        PickupPoint = "Stop #4",

                        Scholarship =
                            "Merit Scholarship",

                        Discount = "None",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow
                    };

                await context
                    .AdmissionApplications
                    .AddAsync(sampleApplication);

                await context.SaveChangesAsync();
            }
        }
    }
    catch (Exception exception)
    {
        var logger =
            services.GetRequiredService<
                ILogger<Program>>();

        logger.LogError(
            exception,
            "An error occurred while migrating or seeding the database.");

        throw;
    }
}

app.Run();