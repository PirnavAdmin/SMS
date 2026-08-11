using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SMS.Api.Data;
using SMS.Api.Middleware;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.StaffManagement;
using SMS.Api.Services.Implementations.StaffManagement;
using SMS.Api.Repositories.Implementations;
using SMS.Api.Repositories.Interfaces.Examination;
using SMS.Api.Repositories.Implementations.Examination;
using SMS.Api.Services.Interfaces.Examination;
using SMS.Api.Services.Implementations.Examination;

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
        new MySqlServerVersion(new Version(8, 0, 30)),
        mysqlOptions => mysqlOptions.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));

// =========================================================
// 2. DEPENDENCY INJECTION
// =========================================================

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<ISuperAdminRepository, SuperAdminRepository>();
builder.Services.AddScoped<ISuperAdminService, SuperAdminService>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOtpService, OtpService>();

// Transport Route
builder.Services.AddScoped<ITransportRouteRepository,TransportRouteRepository>();

builder.Services.AddScoped<ITransportRouteService,TransportRouteService>();

// Pickup Point
builder.Services.AddScoped<IPickupPointRepository,PickupPointRepository>();

builder.Services.AddScoped<IPickupPointService,PickupPointService>();

// Transport Vehicle
builder.Services.AddScoped<ITransportVehicleRepository,TransportVehicleRepository>();

builder.Services.AddScoped<ITransportVehicleService,TransportVehicleService>();

// Transport Driver
builder.Services.AddScoped<ITransportDriverRepository,TransportDriverRepository>();

builder.Services.AddScoped<ITransportDriverService,TransportDriverService>();

// Transport Attendant
builder.Services.AddScoped<ITransportAttendantRepository,TransportAttendantRepository>();

builder.Services.AddScoped<ITransportAttendantService,TransportAttendantService>();

// Vehicle Assignment
builder.Services.AddScoped<ITransportVehicleAssignmentRepository,TransportVehicleAssignmentRepository>();

builder.Services.AddScoped<ITransportVehicleAssignmentService,TransportVehicleAssignmentService>();

// Student Transport Assignment
builder.Services.AddScoped<IStudentTransportAssignmentRepository,StudentTransportAssignmentRepository>();

builder.Services.AddScoped<IStudentTransportAssignmentService,StudentTransportAssignmentService>();

// Vehicle Maintenance
builder.Services.AddScoped<IVehicleMaintenanceRepository,VehicleMaintenanceRepository>();

builder.Services.AddScoped<IVehicleMaintenanceService,VehicleMaintenanceService>();

// Examination New
builder.Services.AddScoped<IExamNewRepository, ExamNewRepository>();
builder.Services.AddScoped<IExamNewService, ExamNewService>();
builder.Services.AddScoped<IExamScheduleRepository, ExamScheduleRepository>();
builder.Services.AddScoped<IExamScheduleService, ExamScheduleService>();
builder.Services.AddScoped<IExamMarksEntryRepository, ExamMarksEntryRepository>();
builder.Services.AddScoped<IExamMarksEntryService, ExamMarksEntryService>();
builder.Services.AddScoped<IExamResultsReportsRepository, ExamResultsReportsRepository>();
builder.Services.AddScoped<IExamResultsReportsService, ExamResultsReportsService>();
builder.Services.AddScoped<IExamGradingScaleRepository, ExamGradingScaleRepository>();
builder.Services.AddScoped<IExamGradingScaleService, ExamGradingScaleService>();

// Transport Dashboard
builder.Services.AddScoped<ITransportDashboardRepository,TransportDashboardRepository>();

builder.Services.AddScoped<ITransportDashboardService,TransportDashboardService>();

// Transport Reports
builder.Services.AddScoped<ITransportReportRepository,TransportReportRepository>();

builder.Services.AddScoped<ITransportReportService,TransportReportService>();
// Teacher Student Attendance Entry
builder.Services.AddScoped<ITeacherStudentAttendanceRepository,TeacherStudentAttendanceRepository>();

builder.Services.AddScoped<ITeacherStudentAttendanceService,TeacherStudentAttendanceService>();


// Teacher Self Profile
builder.Services.AddScoped<SMS.Api.Repositories.Interfaces.ITeacherProfileRepository, SMS.Api.Repositories.Implementations.TeacherProfileRepository>();
builder.Services.AddScoped<SMS.Api.Services.Interfaces.ITeacherProfileService, SMS.Api.Services.Implementations.TeacherProfileService>();

// Academic and School Management
builder.Services.AddScoped<ISchoolRepository, SchoolRepository>();

builder.Services.AddScoped<ISchoolService, SchoolService>();
builder.Services.AddScoped<IStaffService, StaffService>();

// Transport Management
builder.Services.AddScoped<ITransportRepository, TransportRepository>();
builder.Services.AddScoped<ITransportService, TransportService>();

// Hostel ERP Module
builder.Services.AddScoped<IHostelRepository, HostelRepository>();
builder.Services.AddScoped<IHostelService, HostelService>();

// Uniform Management Module
builder.Services.AddScoped<SMS.Api.Repositories.Interfaces.IUniformRepository, SMS.Api.Repositories.Implementations.UniformRepository>();
builder.Services.AddScoped<SMS.Api.Services.Interfaces.IUniformService, SMS.Api.Services.Implementations.UniformService>();

// Class Timetable Module
builder.Services.AddScoped<ITimetableRepository, TimetableRepository>();
builder.Services.AddScoped<ITimetableService, TimetableService>();
//teacher dashboard
// Teacher Dashboard Module
builder.Services.AddScoped<ITeacherDashboardRepository, TeacherDashboardRepository>();

builder.Services.AddScoped<ITeacherDashboardService, TeacherDashboardService>();
builder.Services.AddScoped<ITeacherAttendanceRepository, TeacherAttendanceRepository>();

builder.Services.AddScoped<ITeacherAttendanceService, TeacherAttendanceService>();

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

app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

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

        // Check if database is reachable before running DDL and migrations
        bool isDbReachable = false;
        try
        {
            var dbConnection = Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.GetDbConnection(context.Database);
            var connStr = dbConnection.ConnectionString;
            if (!connStr.Contains("Connection Timeout", StringComparison.OrdinalIgnoreCase) && !connStr.Contains("Connect Timeout", StringComparison.OrdinalIgnoreCase))
            {
                connStr += ";Connection Timeout=2;";
            }
            using var conn = new MySqlConnector.MySqlConnection(connStr);
            conn.Open();
            isDbReachable = true;
            conn.Close();
        }
        catch (Exception ex)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogWarning($"[Database Connection Check] Database is unreachable. Skipping migrations and seeds. Error: {ex.Message}");
        }

        if (isDbReachable)
        {
            // Ensure EF Core Database and Schema are Created
            try { context.Database.EnsureCreated(); } catch { }

            // Dynamic Database Table Renaming & Schema Upgrades
            try
            {
                var dbConnection = Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.GetDbConnection(context.Database);
                var dbName = dbConnection.Database;
                var wasOpen = dbConnection.State == System.Data.ConnectionState.Open;
                if (!wasOpen) dbConnection.Open();

            var tablesToRename = new System.Collections.Generic.Dictionary<string, string>
            {
                { "UserRoles", "user_roles" },
                { "Users", "users" },
                { "Roles", "roles" },
                { "Staff", "staff" },
                { "Classes", "classes" },
                { "Circulars", "circulars" },
                { "Meetings", "meetings" },
                { "SchoolEvents", "school_events" },
                { "PayrollConfigs", "payroll_configs" },
                { "SalaryComponents", "salary_components" },
                { "SalaryStructures", "salary_structures" },
                { "SalaryStructureItems", "salary_structure_items" },
                { "EmployeeSalaryAssignments", "employee_salary_assignments" },
                { "Payslips", "payslips" },
                { "ExamSchedules", "exam_schedules" },
                { "ExamInvigilatorAssignments", "exam_invigilator_assignments" },
                { "QuestionPapers", "question_papers" },
                { "ExamMarks", "exam_marks" },
                { "GradeConfigurations", "grade_configurations" },
                { "ExamResults", "exam_results" },
                { "ExamMasters", "exam_masters" },
                { "ExamClasses", "exam_classes" },
                { "admissions", "students" },
                { "Admissions", "students" },
                { "admissionapplications", "admission_applications" },
                { "AdmissionApplications", "admission_applications" },
                { "transport_vehicle_maintenance", "transport_vehicle_maintenances" },
                { "OtpVerifications", "otp_verifications" },
                { "StaffDocuments", "staff_documents" },
                { "StaffAttendances", "staff_attendances" },
                { "LeaveTypeConfigs", "leave_type_configs" },
                { "LeaveApplications", "leave_applications" },
                { "HolidayCalendars", "holiday_calendars" },
                { "Homeworks", "homeworks" },
                { "HomeworkSubmissions", "homework_submissions" }
            };

            /*
            foreach (var kvp in tablesToRename)
            {
                var oldTable = kvp.Key;
                var newTable = kvp.Value;
                if (string.Equals(oldTable, newTable, System.StringComparison.Ordinal)) continue;

                using (var cmd = dbConnection.CreateCommand())
                {
                    cmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '{dbName}' AND TABLE_NAME = '{oldTable}';";
                    var oldExists = System.Convert.ToInt32(cmd.ExecuteScalar());

                    cmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '{dbName}' AND TABLE_NAME = '{newTable}';";
                    var newExists = System.Convert.ToInt32(cmd.ExecuteScalar());

                    if (oldExists > 0 && newExists == 0)
                    {
                        cmd.CommandText = $"RENAME TABLE `{oldTable}` TO `{newTable}`;";
                        cmd.ExecuteNonQuery();
                        System.Console.WriteLine($"[Database Schema Upgrade] Renamed table `{oldTable}` to `{newTable}`.");
                    }
                }
            }
            */

            // Upgrade/Recreate the admission applications auto-registration number trigger
            using (var cmd = dbConnection.CreateCommand())
            {
                try
                {
                    cmd.CommandText = "DROP TRIGGER IF EXISTS `trg_admissionapplications_before_insert`;";
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = "DROP TRIGGER IF EXISTS `trg_admission_applications_before_insert`;";
                    cmd.ExecuteNonQuery();

                    cmd.CommandText = @"
                        CREATE TRIGGER `trg_admission_applications_before_insert` BEFORE INSERT ON `admission_applications`
                        FOR EACH ROW
                        BEGIN
                            DECLARE max_num INT;
                            SELECT COALESCE(MAX(CAST(SUBSTRING(RegistrationNo, 5) AS UNSIGNED)), 1000)
                            INTO max_num
                            FROM `admission_applications`
                            WHERE RegistrationNo LIKE 'REG-%';
                            SET NEW.RegistrationNo = CONCAT('REG-', max_num + 1);
                        END;";
                    cmd.ExecuteNonQuery();
                    System.Console.WriteLine("[Database Schema Upgrade] Recreated trigger `trg_admission_applications_before_insert` successfully.");
                }
                catch (System.Exception ex)
                {
                    System.Console.WriteLine($"[Database Trigger Upgrade Warning] {ex.Message}");
                }
            }

            // Upgrade staff_attendances table to add InTime and OutTime columns if they don't exist
            using (var cmd = dbConnection.CreateCommand())
            {
                try
                {
                    cmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{dbName}' AND TABLE_NAME = 'staff_attendances' AND COLUMN_NAME = 'InTime';";
                    var inTimeExists = System.Convert.ToInt32(cmd.ExecuteScalar());
                    if (inTimeExists == 0)
                    {
                        cmd.CommandText = "ALTER TABLE `staff_attendances` ADD COLUMN `InTime` longtext NULL;";
                        cmd.ExecuteNonQuery();
                        System.Console.WriteLine("[Database Schema Upgrade] Added column `InTime` to `staff_attendances`.");
                    }

                    cmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = '{dbName}' AND TABLE_NAME = 'staff_attendances' AND COLUMN_NAME = 'OutTime';";
                    var outTimeExists = System.Convert.ToInt32(cmd.ExecuteScalar());
                    if (outTimeExists == 0)
                    {
                        cmd.CommandText = "ALTER TABLE `staff_attendances` ADD COLUMN `OutTime` longtext NULL;";
                        cmd.ExecuteNonQuery();
                        System.Console.WriteLine("[Database Schema Upgrade] Added column `OutTime` to `staff_attendances`.");
                    }
                }
                catch (System.Exception ex)
                {
                    System.Console.WriteLine($"[Database Columns Upgrade Warning] {ex.Message}");
                }
            }

            if (!wasOpen) dbConnection.Close();
        }
        catch (System.Exception ex)
        {
            System.Console.WriteLine($"[Database Schema Upgrade Error] {ex.Message}");
        }

        // Safe Schema Auto-Initialization for Core, Transport, Hostel & Timetable Modules
        var tableSqls = new[]
        {
            @"CREATE TABLE IF NOT EXISTS `departments` (
                `DepartmentId` int NOT NULL AUTO_INCREMENT,
                `DepartmentName` varchar(150) NOT NULL,
                `DepartmentCode` varchar(50) NOT NULL,
                `Description` varchar(500) NULL,
                `Status` varchar(20) NOT NULL DEFAULT 'Active',
                `CreatedDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`DepartmentId`),
                UNIQUE KEY `ux_departments_code` (`DepartmentCode`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `subjects` (
                `SubjectId` int NOT NULL AUTO_INCREMENT,
                `SubjectCode` varchar(50) NOT NULL,
                `SubjectName` varchar(150) NOT NULL,
                `CourseCode` varchar(50) NULL,
                `DepartmentId` int NOT NULL DEFAULT 1,
                PRIMARY KEY (`SubjectId`),
                UNIQUE KEY `ux_subjects_code` (`SubjectCode`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `classes` (
                `ClassId` int NOT NULL AUTO_INCREMENT,
                `ClassName` varchar(100) NOT NULL,
                PRIMARY KEY (`ClassId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `class_sections` (
                `SectionId` int NOT NULL AUTO_INCREMENT,
                `AcademicClassId` int NOT NULL,
                `SectionName` varchar(50) NOT NULL,
                `ClassTeacherId` int NULL,
                PRIMARY KEY (`SectionId`),
                UNIQUE KEY `ux_class_sections_class_name` (`AcademicClassId`, `SectionName`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `class_curriculum_subjects` (
                `ClassId` int NOT NULL,
                `SubjectId` int NOT NULL,
                PRIMARY KEY (`ClassId`, `SubjectId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `staff` (
                `StaffId` int NOT NULL AUTO_INCREMENT,
                `EmployeeId` varchar(50) NOT NULL,
                `FirstName` varchar(100) NOT NULL,
                `LastName` varchar(100) NOT NULL,
                `Email` varchar(150) NULL,
                `Phone` varchar(20) NULL,
                `Designation` varchar(100) NULL,
                `Department` varchar(100) NULL,
                `MonthlySalary` decimal(18,2) NOT NULL DEFAULT 0,
                `DateOfBirth` datetime NULL,
                `IsActive` tinyint(1) NOT NULL DEFAULT 1,
                PRIMARY KEY (`StaffId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `transport_vehicles` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `transport_routes` (
                `RouteId` bigint NOT NULL AUTO_INCREMENT,
                `RouteCode` varchar(30) NOT NULL,
                `RouteName` varchar(150) NOT NULL,
                `StartLocation` varchar(150) NOT NULL DEFAULT '',
                `EndLocation` varchar(150) NOT NULL DEFAULT '',
                `PickupPoint` varchar(255) NULL,
                `DropPoint` varchar(255) NULL,
                `DistanceKm` decimal(10,2) NOT NULL DEFAULT 0,
                `EstimatedDurationMinutes` int NOT NULL DEFAULT 30,
                `Description` varchar(500) NULL,
                `MonthlyFee` decimal(18,2) NOT NULL DEFAULT 0,
                `Status` tinyint(1) NOT NULL DEFAULT 1,
                `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                `CreatedBy` bigint NULL,
                `UpdatedBy` bigint NULL,
                `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                `UpdatedAt` datetime(6) NULL,
                `VehicleId` bigint NULL,
                PRIMARY KEY (`RouteId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `transport_drivers` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `transport_pickup_points` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `transport_vehicle_assignments` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `student_transport_assignments` (
                `StudentTransportAssignmentId` bigint NOT NULL AUTO_INCREMENT,
                `AdmissionNo` varchar(50) NOT NULL DEFAULT '',
                `StudentId` bigint NULL,
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `transport_vehicle_maintenances` (
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `hostel_blocks` (
                `HostelId` int NOT NULL AUTO_INCREMENT,
                `HostelName` varchar(150) NOT NULL,
                `HostelCode` varchar(50) NOT NULL,
                `HostelType` varchar(50) NOT NULL DEFAULT 'Boys Hostel',
                `WardenName` varchar(150) NULL,
                `PrimaryMobileNumber` varchar(20) NULL,
                `AlternateMobileNumber` varchar(20) NULL,
                `Email` varchar(150) NULL,
                `Status` varchar(20) NOT NULL DEFAULT 'Active',
                `Address` varchar(500) NULL,
                `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (`HostelId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `room_type_configs` (
                `RoomTypeId` int NOT NULL AUTO_INCREMENT,
                `RoomTypeSpecification` varchar(150) NOT NULL,
                `BedCapacity` int NOT NULL DEFAULT 1,
                `AcType` varchar(20) NOT NULL DEFAULT 'AC',
                `Status` varchar(20) NOT NULL DEFAULT 'Active',
                `Description` varchar(500) NULL,
                `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (`RoomTypeId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `room_masters` (
                `RoomId` int NOT NULL AUTO_INCREMENT,
                `HostelId` int NOT NULL,
                `RoomTypeId` int NOT NULL,
                `FloorLevel` varchar(50) NOT NULL DEFAULT '1st Floor',
                `RoomNumber` varchar(50) NOT NULL,
                `Status` varchar(20) NOT NULL DEFAULT 'Active',
                `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (`RoomId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `hostel_wardens` (
                `WardenId` int NOT NULL AUTO_INCREMENT,
                `HostelId` int NOT NULL,
                `WardenName` varchar(150) NOT NULL,
                `MobileNumber` varchar(20) NOT NULL,
                `AlternateMobile` varchar(20) NULL,
                `EmailAddress` varchar(150) NULL,
                `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (`WardenId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `student_bed_allocations` (
                `AllocationId` int NOT NULL AUTO_INCREMENT,
                `RegistrationNo` varchar(100) NULL,
                `StudentName` varchar(150) NULL,
                `StudentId` int NULL,
                `HostelId` int NOT NULL,
                `RoomId` int NOT NULL,
                `BedNumber` varchar(50) NOT NULL,
                `JoiningDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                `Status` varchar(20) NOT NULL DEFAULT 'Active',
                `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (`AllocationId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `hostel_attendances` (
                `AttendanceId` bigint NOT NULL AUTO_INCREMENT,
                `AllocationId` int NOT NULL,
                `Date` datetime(6) NOT NULL,
                `CurfewStatus` varchar(20) NOT NULL DEFAULT 'Present',
                `Remarks` varchar(255) NULL,
                `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (`AttendanceId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `staff_attendances` (
                `StaffAttendanceId` int NOT NULL AUTO_INCREMENT,
                `StaffId` int NOT NULL,
                `Date` datetime(6) NOT NULL,
                `Status` varchar(50) NOT NULL DEFAULT 'Present',
                `AcademicYear` varchar(50) NULL DEFAULT '2026-2027',
                `Branch` varchar(100) NULL DEFAULT 'Main Campus',
                `Department` varchar(100) NULL,
                `Designation` varchar(100) NULL,
                `Remarks` varchar(500) NULL,
                `InTime` varchar(50) NULL,
                `OutTime` varchar(50) NULL,
                PRIMARY KEY (`StaffAttendanceId`),
                KEY `ix_staff_attendances_staff_id` (`StaffId`),
                UNIQUE KEY `ux_staff_attendances_staff_date` (`StaffId`, `Date`),
                CONSTRAINT `fk_staff_attendances_staff` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",
            @"CREATE TABLE IF NOT EXISTS `period_settings` (
                `PeriodId` int NOT NULL AUTO_INCREMENT,
                `PeriodName` varchar(100) NOT NULL,
                `StartTime` time NOT NULL,
                `EndTime` time NOT NULL,
                `PeriodType` varchar(50) NOT NULL DEFAULT 'Teaching Period',
                `DisplayOrder` int NOT NULL DEFAULT 1,
                `IsActive` tinyint(1) NOT NULL DEFAULT 1,
                `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                PRIMARY KEY (`PeriodId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `teacher_subject_assignments` (
                `AssignmentId` int NOT NULL AUTO_INCREMENT,
                `ClassId` int NOT NULL,
                `SectionId` int NOT NULL,
                `SubjectId` int NOT NULL,
                `StaffId` int NOT NULL,
                PRIMARY KEY (`AssignmentId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `timetable_headers` (
                `HeaderId` int NOT NULL AUTO_INCREMENT,
                `AcademicYear` varchar(50) NOT NULL DEFAULT '2026-2027',
                `BranchName` varchar(100) NOT NULL DEFAULT 'Main Campus',
                `ClassId` int NOT NULL,
                `SectionId` int NOT NULL,
                `Status` varchar(30) NOT NULL DEFAULT 'Draft',
                `IncludeSaturday` tinyint(1) NOT NULL DEFAULT 1,
                `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `UpdatedAt` datetime NULL,
                PRIMARY KEY (`HeaderId`),
                UNIQUE KEY `ux_timetable_header_class_sec_year` (`ClassId`, `SectionId`, `AcademicYear`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `timetable_slots` (
                `SlotId` int NOT NULL AUTO_INCREMENT,
                `HeaderId` int NOT NULL,
                `PeriodId` int NULL,
                `DayOfWeek` varchar(20) NOT NULL,
                `StartTime` time NOT NULL,
                `EndTime` time NOT NULL,
                `SubjectId` int NOT NULL,
                `TeacherId` int NOT NULL,
                `RoomNo` varchar(50) NULL,
                PRIMARY KEY (`SlotId`),
                KEY `ix_timetable_slot_teacher` (`TeacherId`, `DayOfWeek`, `StartTime`, `EndTime`),
                KEY `ix_timetable_slot_room` (`RoomNo`, `DayOfWeek`, `StartTime`, `EndTime`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `schools` (
                `SchoolId` int NOT NULL AUTO_INCREMENT,
                `SchoolName` varchar(200) NOT NULL,
                `SchoolCode` varchar(50) NOT NULL,
                `Address` varchar(500) NULL,
                `Phone` varchar(50) NULL,
                `Email` varchar(150) NULL,
                `Website` varchar(150) NULL,
                `PrincipalName` varchar(100) NULL,
                `Status` varchar(20) NOT NULL DEFAULT 'Active',
                `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `UpdatedAt` datetime NULL,
                PRIMARY KEY (`SchoolId`),
                UNIQUE KEY `ux_schools_code` (`SchoolCode`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `audit_logs` (
                `AuditLogId` int NOT NULL AUTO_INCREMENT,
                `UserId` int NULL,
                `UserName` varchar(150) NULL,
                `UserRole` varchar(50) NULL,
                `Action` varchar(100) NOT NULL,
                `Details` text NOT NULL,
                `IpAddress` varchar(50) NULL,
                `Timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `SchoolId` int NULL,
                PRIMARY KEY (`AuditLogId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `system_notifications` (
                `NotificationId` int NOT NULL AUTO_INCREMENT,
                `Title` varchar(200) NOT NULL,
                `Message` text NOT NULL,
                `Type` varchar(50) NOT NULL DEFAULT 'Info',
                `IsRead` tinyint(1) NOT NULL DEFAULT 0,
                `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `SchoolId` int NULL,
                PRIMARY KEY (`NotificationId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `leave_type_configs` (
                `LeaveTypeId` int NOT NULL AUTO_INCREMENT,
                `Name` varchar(150) NOT NULL,
                `Code` varchar(50) NOT NULL,
                `AnnualAllowance` int NOT NULL DEFAULT 10,
                `CarryForward` tinyint(1) NOT NULL DEFAULT 0,
                `MaxConsecutiveDays` int NOT NULL DEFAULT 3,
                `RequiresAttachment` tinyint(1) NOT NULL DEFAULT 0,
                `IsPaid` tinyint(1) NOT NULL DEFAULT 1,
                `Status` varchar(50) NOT NULL DEFAULT 'Active',
                PRIMARY KEY (`LeaveTypeId`),
                UNIQUE KEY `ux_leave_type_configs_code` (`Code`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `leave_applications` (
                `LeaveApplicationId` int NOT NULL AUTO_INCREMENT,
                `StaffId` int NOT NULL,
                `LeaveTypeId` int NOT NULL,
                `FromDate` datetime(6) NOT NULL,
                `ToDate` datetime(6) NOT NULL,
                `IsHalfDay` tinyint(1) NOT NULL DEFAULT 0,
                `RequestedDays` int NOT NULL DEFAULT 1,
                `Reason` text NOT NULL,
                `AppliedDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                `Status` varchar(50) NOT NULL DEFAULT 'Pending',
                PRIMARY KEY (`LeaveApplicationId`),
                KEY `ix_leave_applications_staff_id` (`StaffId`),
                KEY `ix_leave_applications_type_id` (`LeaveTypeId`),
                CONSTRAINT `fk_leave_applications_staff` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE,
                CONSTRAINT `fk_leave_applications_type` FOREIGN KEY (`LeaveTypeId`) REFERENCES `leave_type_configs` (`LeaveTypeId`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `salary_structures` (
                `StructureId` int NOT NULL AUTO_INCREMENT,
                `StructureCode` varchar(50) NOT NULL,
                `StructureName` varchar(150) NOT NULL,
                `Branch` varchar(150) NOT NULL DEFAULT 'Main Campus',
                `Department` varchar(150) NOT NULL DEFAULT 'General',
                `Designation` varchar(150) NOT NULL DEFAULT 'Teacher',
                `StaffCategory` varchar(150) NOT NULL DEFAULT 'Teacher',
                `EmploymentType` varchar(150) NOT NULL DEFAULT 'Full-time',
                `EffectiveDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `Status` varchar(50) NOT NULL DEFAULT 'Active',
                `Notes` text NULL,
                `MonthlyGrossSalary` decimal(18,2) NOT NULL DEFAULT 0,
                `AssignedEmployeesCount` int NOT NULL DEFAULT 0,
                `PayrollFrequency` varchar(50) NOT NULL DEFAULT 'Monthly',
                `SalaryPaymentDay` varchar(50) NULL DEFAULT '5',
                `PfApplicable` tinyint(1) NOT NULL DEFAULT 0,
                `PfPercentage` decimal(5,2) NOT NULL DEFAULT 0,
                `EsiApplicable` tinyint(1) NOT NULL DEFAULT 0,
                `EsiPercentage` decimal(5,2) NOT NULL DEFAULT 0,
                `ProfessionalTaxApplicable` tinyint(1) NOT NULL DEFAULT 0,
                `ProfessionalTaxAmount` decimal(18,2) NOT NULL DEFAULT 0,
                `RoundOffRule` varchar(50) NOT NULL DEFAULT 'No Round Off',
                PRIMARY KEY (`StructureId`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `salary_structure_items` (
                `ItemId` int NOT NULL AUTO_INCREMENT,
                `StructureId` int NOT NULL,
                `ComponentName` varchar(150) NOT NULL,
                `ComponentType` varchar(50) NOT NULL DEFAULT 'Earning',
                `Amount` decimal(18,2) NOT NULL DEFAULT 0,
                PRIMARY KEY (`ItemId`),
                CONSTRAINT `fk_structure_items_structure` FOREIGN KEY (`StructureId`) REFERENCES `salary_structures` (`StructureId`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `employee_salary_assignments` (
                `AssignmentId` int NOT NULL AUTO_INCREMENT,
                `StaffId` int NOT NULL,
                `StructureId` int NOT NULL,
                `Status` varchar(50) NOT NULL DEFAULT 'Active',
                `EffectiveDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `AssignedDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `Reason` varchar(255) NULL,
                `SalaryOverride` tinyint(1) NOT NULL DEFAULT 0,
                `OverrideBasicSalary` decimal(18,2) NULL,
                `OverrideAllowances` decimal(18,2) NULL,
                `OverrideDeductions` decimal(18,2) NULL,
                `OverrideNetSalary` decimal(18,2) NULL,
                `UpdatedBy` varchar(150) NULL,
                `UpdatedAt` datetime NULL,
                PRIMARY KEY (`AssignmentId`),
                CONSTRAINT `fk_salary_assignments_staff` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE,
                CONSTRAINT `fk_salary_assignments_structure` FOREIGN KEY (`StructureId`) REFERENCES `salary_structures` (`StructureId`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `admins` (
                `AdminId` int NOT NULL AUTO_INCREMENT,
                `FullName` varchar(150) NOT NULL,
                `Email` varchar(150) NULL,
                `MobileNumber` varchar(20) NOT NULL,
                `PasswordHash` varchar(255) NOT NULL,
                `Role` varchar(50) NOT NULL DEFAULT 'Admin',
                `IsEmailVerified` tinyint(1) NOT NULL DEFAULT 0,
                `IsMobileVerified` tinyint(1) NOT NULL DEFAULT 0,
                `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                `SchoolId` int NULL,
                PRIMARY KEY (`AdminId`),
                UNIQUE KEY `ux_admins_mobile` (`MobileNumber`),
                CONSTRAINT `fk_admins_school` FOREIGN KEY (`SchoolId`) REFERENCES `schools` (`SchoolId`) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `admin_roles_junction` (
                `AdminId` int NOT NULL,
                `RoleId` int NOT NULL,
                PRIMARY KEY (`AdminId`, `RoleId`),
                CONSTRAINT `fk_admin_roles_admin` FOREIGN KEY (`AdminId`) REFERENCES `admins` (`AdminId`) ON DELETE CASCADE,
                CONSTRAINT `fk_admin_roles_role` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`RoleId`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `staff_documents` (
                `StaffDocumentId` int NOT NULL AUTO_INCREMENT,
                `StaffId` int NOT NULL,
                `DocumentType` varchar(100) NOT NULL,
                `FileUrl` varchar(500) NULL,
                `IsRequired` tinyint(1) NOT NULL DEFAULT 1,
                `Status` varchar(50) NOT NULL DEFAULT 'Missing',
                `UploadedAt` datetime NULL,
                PRIMARY KEY (`StaffDocumentId`),
                CONSTRAINT `fk_staff_documents_staff` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `new_examinations` (
                `exam_id` int NOT NULL AUTO_INCREMENT,
                `exam_name` varchar(200) NOT NULL,
                `assessment_type` varchar(100) NULL,
                `academic_term` varchar(100) NULL,
                `start_date` date NULL,
                `end_date` date NULL,
                `applicable_classes` varchar(500) NULL,
                `status` varchar(30) NOT NULL DEFAULT 'Draft',
                `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`exam_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `new_exam_subject_configs` (
                `config_id` int NOT NULL AUTO_INCREMENT,
                `exam_id` int NOT NULL,
                `class_name` varchar(100) NULL,
                `subject_code` varchar(50) NULL,
                `subject_name` varchar(150) NULL,
                `is_active` tinyint(1) NOT NULL DEFAULT 1,
                `max_marks` decimal(10,2) NOT NULL DEFAULT 100.00,
                `pass_marks` decimal(10,2) NOT NULL DEFAULT 35.00,
                PRIMARY KEY (`config_id`),
                CONSTRAINT `fk_new_exam_subject_configs_exam` FOREIGN KEY (`exam_id`) REFERENCES `new_examinations` (`exam_id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;",

            @"CREATE TABLE IF NOT EXISTS `new_exam_timetable_slots` (
                `slot_id` int NOT NULL AUTO_INCREMENT,
                `exam_id` int NOT NULL,
                `class_name` varchar(100) NULL,
                `section_name` varchar(100) NULL,
                `subject_code` varchar(50) NULL,
                `subject_name` varchar(150) NULL,
                `total_marks` int NOT NULL DEFAULT 100,
                `exam_date` date NULL,
                `time_slot` varchar(100) NULL,
                `duration` varchar(50) NULL,
                `room_hall` varchar(100) NULL,
                `invigilator_faculty` varchar(150) NULL,
                `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (`slot_id`),
                CONSTRAINT `fk_new_exam_timetable_slots_exam` FOREIGN KEY (`exam_id`) REFERENCES `new_examinations` (`exam_id`) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
        };

        foreach (var sql in tableSqls)
        {
            try
            {
                context.Database.ExecuteSqlRaw(sql);
            }
            catch { }
        }

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
        EnsureColumnExists("transport_routes", "VehicleId", "bigint NULL");
        EnsureColumnExists("transport_routes", "PickupPoint", "varchar(255) NULL");
        EnsureColumnExists("transport_routes", "DropPoint", "varchar(255) NULL");
        EnsureColumnExists("transport_routes", "RouteName", "varchar(150) NULL");
        EnsureColumnExists("transport_routes", "RouteCode", "varchar(30) NULL");
        EnsureColumnExists("transport_routes", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
        EnsureColumnExists("transport_drivers", "AssignedVehicleId", "bigint NULL");
        EnsureColumnExists("transport_drivers", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
        EnsureColumnExists("transport_pickup_points", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
        EnsureColumnExists("transport_vehicle_assignments", "Shift", "varchar(20) NULL");
        EnsureColumnExists("transport_vehicle_assignments", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
        EnsureColumnExists("student_transport_assignments", "Remarks", "varchar(255) NULL");
        EnsureColumnExists("student_transport_assignments", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
        EnsureColumnExists("hostel_wardens", "StaffId", "int NULL");
        EnsureColumnExists("admission_applications", "StudentType", "varchar(50) NOT NULL DEFAULT 'Day Scholar'");
        EnsureColumnExists("admission_applications", "AllocatedBedId", "varchar(50) NULL");
        EnsureColumnExists("admission_applications", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
        EnsureColumnExists("student_bed_allocations", "RegistrationNo", "varchar(100) NULL");
        EnsureColumnExists("student_bed_allocations", "StudentName", "varchar(150) NULL");
        EnsureColumnExists("student_bed_allocations", "StudentId", "int NULL");
        EnsureColumnExists("student_transport_assignments", "AdmissionNo", "varchar(50) NOT NULL DEFAULT ''");
        EnsureColumnExists("student_transport_assignments", "StudentId", "bigint NULL");
        EnsureColumnExists("transport_routes", "Description", "varchar(500) NULL");

        // Homework table: ClassRoom column missing from MySQL but present in EF Core model
        EnsureColumnExists("homeworks", "ClassRoom", "varchar(150) NOT NULL DEFAULT 'Class 10-A'");
        EnsureColumnExists("homeworks", "ClassName", "varchar(150) NOT NULL DEFAULT 'Class 10-A'");
        EnsureColumnExists("homeworks", "SubjectName", "varchar(150) NOT NULL DEFAULT 'Mathematics'");
        EnsureColumnExists("homeworks", "Title", "varchar(255) NOT NULL DEFAULT 'Homework'");
        EnsureColumnExists("homeworks", "Topic", "varchar(255) NULL");
        EnsureColumnExists("homeworks", "Description", "longtext NULL");
        EnsureColumnExists("homeworks", "DueDate", "datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
        EnsureColumnExists("homeworks", "PublishedTo", "varchar(100) NOT NULL DEFAULT 'Entire Class'");
        EnsureColumnExists("homeworks", "Status", "varchar(50) NOT NULL DEFAULT 'PUBLISHED'");
        EnsureColumnExists("homeworks", "AttachmentFileName", "varchar(255) NULL");
        EnsureColumnExists("homeworks", "AttachmentUrl", "varchar(500) NULL");
        EnsureColumnExists("homeworks", "TeacherName", "varchar(150) NOT NULL DEFAULT 'Teacher'");
        EnsureColumnExists("homeworks", "SubmissionsCount", "int NOT NULL DEFAULT 0");
        EnsureColumnExists("homeworks", "CreatedAt", "datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");

        EnsureColumnExists("users", "SchoolId", "int NULL");

        var staffTables = new[] { "staff" };
        foreach (var tbl in staffTables)
        {
            EnsureColumnExists(tbl, "AccountHolderName", "varchar(150) NULL");
            EnsureColumnExists(tbl, "AccountNumber", "varchar(50) NULL");
            EnsureColumnExists(tbl, "BankName", "varchar(150) NULL");
            EnsureColumnExists(tbl, "BranchName", "varchar(150) NULL");
            EnsureColumnExists(tbl, "IfscCode", "varchar(50) NULL");
            EnsureColumnExists(tbl, "UpiId", "varchar(100) NULL");
            EnsureColumnExists(tbl, "Gender", "varchar(20) NULL");
            EnsureColumnExists(tbl, "ResidentialAddress", "varchar(500) NULL");
            EnsureColumnExists(tbl, "EmployeeCategory", "varchar(100) NULL");
            EnsureColumnExists(tbl, "JoiningDate", "datetime NULL");
            EnsureColumnExists(tbl, "Qualification", "varchar(150) NULL");
            EnsureColumnExists(tbl, "PrimarySubject", "varchar(150) NULL");
            EnsureColumnExists(tbl, "Specialization", "varchar(150) NULL");
            EnsureColumnExists(tbl, "SystemRole", "varchar(100) NULL");
            EnsureColumnExists(tbl, "CasualLeaveBalance", "int NOT NULL DEFAULT 10");
            EnsureColumnExists(tbl, "SickLeaveBalance", "int NOT NULL DEFAULT 10");
            EnsureColumnExists(tbl, "EarnedLeaveBalance", "int NOT NULL DEFAULT 15");
            EnsureColumnExists(tbl, "GrossSalary", "decimal(18,2) NULL");
            EnsureColumnExists(tbl, "NetSalary", "decimal(18,2) NULL");
            EnsureColumnExists(tbl, "SalaryStructureId", "int NULL");
            EnsureColumnExists(tbl, "SalaryStructureName", "varchar(150) NULL");
            EnsureColumnExists(tbl, "SalaryStructureEffectiveDate", "datetime NULL");
        }

        try
        {
            context.Database.ExecuteSqlRaw("UPDATE `staff` SET `FirstName` = '' WHERE `FirstName` IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE `staff` SET `LastName` = '' WHERE `LastName` IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE `staff` SET `Email` = '' WHERE `Email` IS NULL;");
            context.Database.ExecuteSqlRaw("UPDATE `staff` SET `EmployeeId` = CONCAT('EMP', `StaffId`) WHERE `EmployeeId` IS NULL OR `EmployeeId` = '';");
            context.Database.ExecuteSqlRaw("UPDATE `staff` SET `EmployeeCategory` = 'Non-Teaching Staff' WHERE `Designation` LIKE '%Warden%' OR `Designation` LIKE '%Driver%' OR `Designation` LIKE '%Security%';");
            context.Database.ExecuteSqlRaw("UPDATE `staff` SET `EmployeeCategory` = 'Teaching Staff' WHERE (`EmployeeCategory` IS NULL OR `EmployeeCategory` = '') AND (`Designation` LIKE '%Teacher%' OR `Designation` LIKE '%Faculty%' OR `Designation` LIKE '%Professor%' OR `Designation` LIKE '%Lead%' OR `Designation` LIKE '%Mathematics%' OR `Designation` LIKE '%Science%');");
            context.Database.ExecuteSqlRaw("UPDATE `staff` SET `EmployeeCategory` = 'Non-Teaching Staff' WHERE `EmployeeCategory` IS NULL OR `EmployeeCategory` = '';");
            context.Database.ExecuteSqlRaw("UPDATE `subjects` SET `SubjectCode` = CONCAT('SUB', `SubjectId`) WHERE `SubjectCode` IS NULL OR `SubjectCode` = '';");
            context.Database.ExecuteSqlRaw("UPDATE `subjects` SET `SubjectName` = 'General Subject' WHERE `SubjectName` IS NULL OR `SubjectName` = '';");
        }
        catch { }

        try
        {
            EnsureColumnExists("otp_verifications", "UserId", "int NULL");
            EnsureColumnExists("otp_verifications", "AdminId", "int NULL");
            
            bool constraintExists = false;
            try
            {
                var conn = Microsoft.EntityFrameworkCore.RelationalDatabaseFacadeExtensions.GetDbConnection(context.Database);
                bool closeConn = false;
                if (conn.State != System.Data.ConnectionState.Open)
                {
                    conn.Open();
                    closeConn = true;
                }
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_otp_admins' AND CONSTRAINT_TYPE = 'FOREIGN KEY';";
                    var result = cmd.ExecuteScalar();
                    if (result != null && Convert.ToInt32(result) > 0)
                    {
                        constraintExists = true;
                    }
                }
                if (closeConn)
                {
                    conn.Close();
                }
            }
            catch { }

            if (!constraintExists)
            {
                try { context.Database.ExecuteSqlRaw("ALTER TABLE `otp_verifications` ADD CONSTRAINT `fk_otp_admins` FOREIGN KEY (`AdminId`) REFERENCES `admins` (`AdminId`) ON DELETE CASCADE;"); } catch { }
            }

            context.Database.ExecuteSqlRaw(@"
                INSERT INTO `admins` (`FullName`, `Email`, `MobileNumber`, `PasswordHash`, `Role`, `IsEmailVerified`, `IsMobileVerified`, `CreatedAt`, `SchoolId`)
                SELECT `FullName`, `Email`, `MobileNumber`, `PasswordHash`, 'Admin', `IsEmailVerified`, `IsMobileVerified`, `CreatedAt`, `SchoolId`
                FROM `users`
                WHERE `Role` = 'Admin' AND `MobileNumber` NOT IN (SELECT `MobileNumber` FROM `admins`);");

            context.Database.ExecuteSqlRaw(@"
                INSERT INTO `admin_roles_junction` (`AdminId`, `RoleId`)
                SELECT a.`AdminId`, ur.`RoleId`
                FROM `user_roles` ur
                JOIN `users` u ON u.`UserId` = ur.`UserId`
                JOIN `admins` a ON a.`MobileNumber` = u.`MobileNumber`
                WHERE u.`Role` = 'Admin' AND NOT EXISTS (
                    SELECT 1 FROM `admin_roles_junction` arj WHERE arj.`AdminId` = a.`AdminId` AND arj.`RoleId` = ur.`RoleId`
                );");

            context.Database.ExecuteSqlRaw(@"
                DELETE ur
                FROM `user_roles` ur
                JOIN `users` u ON u.`UserId` = ur.`UserId`
                WHERE u.`Role` = 'Admin';");

            context.Database.ExecuteSqlRaw("DELETE FROM `users` WHERE `Role` = 'Admin';");
        }
        catch (System.Exception ex)
        {
            System.Console.WriteLine($"[Database Migration Warning] {ex.Message}");
        }

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
                RoleName = "Warden",
                Description = "Hostel Warden / Supervisor"
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
        // SEED TEACHER, STUDENT AND PARENT USERS
        // =================================================

        var teacherRole = await context.Roles
            .FirstOrDefaultAsync(x => x.RoleName == "Teacher");

        var studentRole = await context.Roles
            .FirstOrDefaultAsync(x => x.RoleName == "Student");

        var parentRole = await context.Roles
            .FirstOrDefaultAsync(x => x.RoleName == "Parent");

        var portalUsers = new[]
        {
            new
            {
                FullName = "Robert Teacher",
                Email = "teacher@pirnavschools.com",
                Mobile = "9876543221",
                Password = "Teacher@123",
                Role = teacherRole
            },
            new
            {
                FullName = "Arjun Student",
                Email = "student@pirnavschools.com",
                Mobile = "9876543222",
                Password = "Student@123",
                Role = studentRole
            },
            new
            {
                FullName = "Kumar Parent",
                Email = "parent@pirnavschools.com",
                Mobile = "9876543223",
                Password = "Parent@123",
                Role = parentRole
            }
        };

        foreach (var portalUser in portalUsers)
        {
            if (portalUser.Role == null)
            {
                continue;
            }

            var existingUser = await context.Users
                .Include(x => x.Roles)
                .FirstOrDefaultAsync(x =>
                    x.Email == portalUser.Email ||
                    x.MobileNumber == portalUser.Mobile);

            if (existingUser == null)
            {
                var newUser = new User
                {
                    FullName = portalUser.FullName,
                    Email = portalUser.Email,
                    MobileNumber = portalUser.Mobile,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(
                        portalUser.Password),
                    Role = portalUser.Role.RoleName,
                    IsEmailVerified = true,
                    IsMobileVerified = true,
                    CreatedAt = DateTime.UtcNow
                };

                newUser.Roles.Add(portalUser.Role);

                await context.Users.AddAsync(newUser);
            }
            else
            {
                existingUser.Role = portalUser.Role.RoleName;

                if (existingUser.Roles.All(x =>
                    x.RoleId != portalUser.Role.RoleId))
                {
                    existingUser.Roles.Add(portalUser.Role);
                }
            }
        }

        await context.SaveChangesAsync();

        // =================================================
        // SEED DEPARTMENTS
        // =================================================

        var departmentSeeds = new[]
        {
            new Department
            {
                DepartmentName = "Mathematics",
                DepartmentCode = "DEPT-MTH",
                Description = "Department of Mathematics",
                Status = "Active"
            },
            new Department
            {
                DepartmentName = "Science",
                DepartmentCode = "DEPT-SCI",
                Description = "Department of Science",
                Status = "Active"
            },
            new Department
            {
                DepartmentName = "Languages",
                DepartmentCode = "DEPT-LNG",
                Description = "Department of Languages",
                Status = "Active"
            }
        };

        foreach (var departmentSeed in departmentSeeds)
        {
            var departmentExists = await context.Departments.AnyAsync(
                x => x.DepartmentCode == departmentSeed.DepartmentCode);

            if (!departmentExists)
            {
                await context.Departments.AddAsync(departmentSeed);
            }
        }

        // Save departments first because Subjects.DepartmentId
        // is a foreign key to Departments.DepartmentId.
        await context.SaveChangesAsync();

        var mathematicsDepartment = await context.Departments
            .SingleAsync(x => x.DepartmentCode == "DEPT-MTH");

        var scienceDepartment = await context.Departments
            .SingleAsync(x => x.DepartmentCode == "DEPT-SCI");

        var languagesDepartment = await context.Departments
            .SingleAsync(x => x.DepartmentCode == "DEPT-LNG");

        // =================================================
        // SEED SUBJECTS
        // =================================================

        var subjectSeeds = new[]
        {
            new Subject
            {
                SubjectCode = "MATH101",
                SubjectName = "Mathematics",
                CourseCode = "MATH",
                DepartmentId = mathematicsDepartment.DepartmentId
            },
            new Subject
            {
                SubjectCode = "PHY101",
                SubjectName = "Physics",
                CourseCode = "PHY",
                DepartmentId = scienceDepartment.DepartmentId
            },
            new Subject
            {
                SubjectCode = "ENG101",
                SubjectName = "English Literature",
                CourseCode = "ENG",
                DepartmentId = languagesDepartment.DepartmentId
            },
            new Subject
            {
                SubjectCode = "CHEM101",
                SubjectName = "Chemistry",
                CourseCode = "CHEM",
                DepartmentId = scienceDepartment.DepartmentId
            }
        };

        foreach (var subjectSeed in subjectSeeds)
        {
            var subjectExists = await context.Subjects.AnyAsync(
                x => x.SubjectCode == subjectSeed.SubjectCode);

            if (!subjectExists)
            {
                await context.Subjects.AddAsync(subjectSeed);
            }
        }

        await context.SaveChangesAsync();

        // =================================================
        // SEED CLASSES AND SECTIONS
        // =================================================

        if (!await context.Classes.AnyAsync())
        {
            var staffMembers = await context.Staff
                .OrderBy(x => x.StaffId)
                .Take(2)
                .ToListAsync();

            var staff1 = staffMembers.ElementAtOrDefault(0);
            var staff2 = staffMembers.ElementAtOrDefault(1);

            // Fetch a default subject to satisfy FK constraint on teacher_assignments
            var defaultSubject = await context.Subjects.FirstOrDefaultAsync();
            var defaultSubjectId = defaultSubject?.SubjectId ?? 1;

            for (var classNumber = 1;
                 classNumber <= 12;
                 classNumber++)
            {
                var classGrade = new ClassGrade
                {
                    ClassName = $"Class {classNumber}"
                };

                // Save the class first to generate ClassId.
                await context.Classes.AddAsync(classGrade);
                await context.SaveChangesAsync();

                if (classNumber == 1)
                {
                    await context.ClassSections.AddAsync(
                        new ClassSection
                        {
                            ClassId = classGrade.ClassId,
                            SectionName = "A"
                        });
                    if (staff1 != null)
                    {
                        await context.TeacherAssignments.AddAsync(
                            new TeacherAssignment
                            {
                                ClassId = classGrade.ClassId,
                                SectionLetter = "A",
                                TeacherId = staff1.StaffId,
                                SubjectId = defaultSubjectId,
                                Role = "Class Teacher",
                                Status = "Active"
                            });
                    }
                }
                else if (classNumber == 2)
                {
                    await context.ClassSections.AddAsync(
                        new ClassSection
                        {
                            ClassId = classGrade.ClassId,
                            SectionName = "A"
                        });
                    if (staff2 != null)
                    {
                        await context.TeacherAssignments.AddAsync(
                            new TeacherAssignment
                            {
                                ClassId = classGrade.ClassId,
                                SectionLetter = "A",
                                TeacherId = staff2.StaffId,
                                SubjectId = defaultSubjectId,
                                Role = "Class Teacher",
                                Status = "Active"
                            });
                    }
                }
                else if (classNumber == 9)
                {
                    await context.ClassSections.AddRangeAsync(
                        new ClassSection
                        {
                            ClassId = classGrade.ClassId,
                            SectionName = "A"
                        },
                        new ClassSection
                        {
                            ClassId = classGrade.ClassId,
                            SectionName = "B"
                        });
                    if (staff1 != null)
                    {
                        await context.TeacherAssignments.AddAsync(
                            new TeacherAssignment
                            {
                                ClassId = classGrade.ClassId,
                                SectionLetter = "A",
                                TeacherId = staff1.StaffId,
                                SubjectId = defaultSubjectId,
                                Role = "Class Teacher",
                                Status = "Active"
                            });
                    }
                    if (staff2 != null)
                    {
                        await context.TeacherAssignments.AddAsync(
                            new TeacherAssignment
                            {
                                ClassId = classGrade.ClassId,
                                SectionLetter = "B",
                                TeacherId = staff2.StaffId,
                                SubjectId = defaultSubjectId,
                                Role = "Class Teacher",
                                Status = "Active"
                            });
                    }
                }

                await context.SaveChangesAsync();
            }
        }

        // =================================================
        // SEED ADMISSION APPLICATION
        // =================================================

        {
            // Retrieve first class as fallback
            var firstClass = await context.Classes.OrderBy(x => x.ClassId).FirstOrDefaultAsync();
            var class10 = await context.Classes.FirstOrDefaultAsync(x => x.ClassName == "Class 10");
            var class9 = await context.Classes.FirstOrDefaultAsync(x => x.ClassName == "Class 9");

            if (firstClass != null)
            {
                var c10Id = class10?.ClassId ?? firstClass.ClassId;
                var c9Id = class9?.ClassId ?? firstClass.ClassId;

                // Predefined diverse distribution mapping for the 12 registration records
                var seedApps = new List<AdmissionApplication>
                {
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1001",
                        FirstName = "Alexander",
                        LastName = "Wright",
                        DateOfBirth = new DateTime(2012, 8, 15),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "North Branch",
                        FatherName = "Robert Wright",
                        FatherContact = "9876543210",
                        Status = "Enrolled",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1002",
                        FirstName = "Rahul",
                        LastName = "Sharma",
                        DateOfBirth = new DateTime(2012, 5, 15),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "North Branch",
                        FatherName = "Aman Sharma",
                        FatherContact = "+1 (555) 019-2831",
                        Status = "Rejected",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1003",
                        FirstName = "Priya",
                        LastName = "Patel",
                        DateOfBirth = new DateTime(2012, 8, 22),
                        Gender = "Female",
                        AppliedClassId = c10Id,
                        BranchName = "Main Campus",
                        FatherName = "Rajesh Patel",
                        FatherContact = "+1 (555) 019-3829",
                        Status = "Deleted",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1004",
                        FirstName = "Sneha",
                        LastName = "Reddy",
                        DateOfBirth = new DateTime(2013, 9, 28),
                        Gender = "Female",
                        AppliedClassId = c9Id,
                        BranchName = "North Branch",
                        FatherName = "Prasad Reddy",
                        FatherContact = "+1 (555) 019-7832",
                        Status = "Enrolled",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1005",
                        FirstName = "Alex",
                        LastName = "Wright",
                        DateOfBirth = new DateTime(2000, 1, 9),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "North Branch",
                        FatherName = "Robert Wright",
                        FatherContact = "9876543210",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1006",
                        FirstName = "sample",
                        LastName = "sample",
                        DateOfBirth = new DateTime(2000, 1, 9),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "West Campus",
                        FatherName = "sample",
                        FatherContact = "9999999999",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1007",
                        FirstName = "Narendra",
                        LastName = "Modi",
                        DateOfBirth = new DateTime(1999, 12, 14),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "North Branch",
                        FatherName = "Damodardas",
                        FatherContact = "8888888888",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1008",
                        FirstName = "Gokul",
                        LastName = "Raj",
                        DateOfBirth = new DateTime(2016, 2, 1),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "Main Campus",
                        FatherName = "Shankar",
                        FatherContact = "8998897887",
                        Status = "Enrolled",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1009",
                        FirstName = "Veera",
                        LastName = "Garikapati",
                        DateOfBirth = new DateTime(2004, 10, 26),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "Hyderabad",
                        FatherName = "Srinivasa Rao",
                        FatherContact = "9581768555",
                        Status = "Enrolled",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1010",
                        FirstName = "nagaraj",
                        LastName = "kamati",
                        DateOfBirth = new DateTime(2011, 6, 15),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "Main Campus",
                        FatherName = "Basappa",
                        FatherContact = "9999999999",
                        Status = "Pending",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1011",
                        FirstName = "nagaraj",
                        LastName = "kamati",
                        DateOfBirth = new DateTime(2011, 6, 15),
                        Gender = "Male",
                        AppliedClassId = firstClass.ClassId,
                        BranchName = "Main Campus",
                        FatherName = "Basappa",
                        FatherContact = "9999999999",
                        Status = "pending",
                        CreatedAt = DateTime.UtcNow
                    },
                    new AdmissionApplication
                    {
                        RegistrationNo = "REG-1012",
                        FirstName = "Rahul",
                        LastName = "Kumar",
                        DateOfBirth = new DateTime(2011, 6, 15),
                        Gender = "Male",
                        AppliedClassId = c10Id,
                        BranchName = "Main Campus",
                        FatherName = "Rajesh",
                        FatherContact = "9999999999",
                        Status = "Deleted",
                        CreatedAt = DateTime.UtcNow
                    }
                };

                foreach (var seedApp in seedApps)
                {
                    var existingApp = await context.AdmissionApplications.FirstOrDefaultAsync(x => x.RegistrationNo == seedApp.RegistrationNo);
                    if (existingApp == null)
                    {
                        await context.AdmissionApplications.AddAsync(seedApp);
                    }
                    else
                    {
                        // Update existing app to distribute branch and status
                        existingApp.BranchName = seedApp.BranchName;
                        existingApp.Status = seedApp.Status;
                        existingApp.AppliedClassId = seedApp.AppliedClassId;

                        // Retain user custom names if they exist, otherwise update them
                        if (existingApp.FirstName == "sample" || string.IsNullOrEmpty(existingApp.FirstName))
                        {
                            existingApp.FirstName = seedApp.FirstName;
                        }
                        if (existingApp.LastName == "sample" || string.IsNullOrEmpty(existingApp.LastName))
                        {
                            existingApp.LastName = seedApp.LastName;
                        }
                    }
                }
                await context.SaveChangesAsync();

            }
        }


        // =================================================
        // SYNC: ADMISSIONS → STUDENTS (startup heal)
        // Ensures the `students` table is populated from the `admissions`
        // table so that attendance, hostel, and library modules work correctly.
        // Runs in its own try-catch so a missing table never crashes seeding.
        // =================================================
        try
        {
            // Verify prerequisite tables exist before querying them
            var conn = context.Database.GetDbConnection();
            if (conn.State != System.Data.ConnectionState.Open)
                await conn.OpenAsync();

            bool tablesReady = false;
            using (var cmd = conn.CreateCommand())
            {
                cmd.CommandText = @"
                    SELECT COUNT(*) FROM information_schema.tables
                    WHERE table_schema = DATABASE()
                    AND table_name IN ('academic_years', 'branches', 'students', 'admissions', 'class_sections')";
                var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                tablesReady = count >= 5;
            }

            if (tablesReady)
            {
                var defaultBranch = await context.Branches.FirstOrDefaultAsync();
                var defaultAcademicYear = await context.AcademicYears.FirstOrDefaultAsync();

                if (defaultBranch != null && defaultAcademicYear != null)
                {
                    var activeAdmissions = await context.Admissions
                        .Where(a => !a.IsDeleted && (a.Status == "Enrolled" || a.Status == "Active"))
                        .ToListAsync();

                    foreach (var admission in activeAdmissions)
                    {
                        if (admission.ClassId == null || string.IsNullOrEmpty(admission.SectionLetter))
                            continue;

                        var sectionObj = await context.ClassSections
                            .FirstOrDefaultAsync(s => s.ClassId == admission.ClassId && s.SectionName.ToLower() == admission.SectionLetter.ToLower());
                        if (sectionObj == null) continue;

                        var existing = await context.Students
                            .FirstOrDefaultAsync(s => s.AdmissionNumber == admission.ApplicationNo);

                        if (existing != null)
                        {
                            existing.SectionId = sectionObj.SectionId;
                            existing.RollNumber = admission.RollNo ?? existing.RollNumber;
                            existing.Status = "Active";
                        }
                        else
                        {
                            var student = new Student
                            {
                                AdmissionNumber = admission.ApplicationNo ?? $"ADM-{admission.AdmissionId}",
                                RollNumber = admission.RollNo ?? $"R-{admission.AdmissionId}",
                                StudentName = admission.StudentName,
                                DateOfBirth = admission.Dob,
                                Gender = admission.Gender,
                                FatherName = admission.FatherName,
                                FatherMobile = admission.FatherMobile,
                                BranchId = defaultBranch.BranchId,
                                AcademicYearId = defaultAcademicYear.AcademicYearId,
                                ClassId = admission.ClassId.Value,
                                SectionId = sectionObj.SectionId,
                                Status = "Active",
                                CreatedAt = DateTime.UtcNow
                            };
                            await context.Students.AddAsync(student);
                        }
                    }

                    await context.SaveChangesAsync();
                }
            }
            else
            {
                var logger = services.GetRequiredService<ILogger<Program>>();
                logger.LogWarning("Admissions→Students sync skipped: one or more required tables do not exist yet. Will sync on next startup after migrations.");
            }
        }
        catch (Exception syncEx)
        {
            var logger = services.GetRequiredService<ILogger<Program>>();
            logger.LogWarning(syncEx, "Admissions→Students startup sync failed. This is non-fatal — sync will retry on next startup.");
        }

        // =================================================
        // SEED PERIOD SETTINGS
        // =================================================
        if (!await context.PeriodSettings.AnyAsync(p => !p.IsDeleted))
        {
            var defaultPeriods = new[]
            {
                new PeriodSetting { PeriodName = "Period 1", StartTime = new TimeSpan(8, 30, 0), EndTime = new TimeSpan(9, 15, 0), PeriodType = "Teaching Period", DisplayOrder = 1 },
                new PeriodSetting { PeriodName = "Period 2", StartTime = new TimeSpan(9, 15, 0), EndTime = new TimeSpan(10, 0, 0), PeriodType = "Teaching Period", DisplayOrder = 2 },
                new PeriodSetting { PeriodName = "Morning Break", StartTime = new TimeSpan(10, 0, 0), EndTime = new TimeSpan(10, 15, 0), PeriodType = "Break / Recess", DisplayOrder = 3 },
                new PeriodSetting { PeriodName = "Period 3", StartTime = new TimeSpan(10, 15, 0), EndTime = new TimeSpan(11, 0, 0), PeriodType = "Teaching Period", DisplayOrder = 4 },
                new PeriodSetting { PeriodName = "Period 4", StartTime = new TimeSpan(11, 0, 0), EndTime = new TimeSpan(11, 45, 0), PeriodType = "Teaching Period", DisplayOrder = 5 },
                new PeriodSetting { PeriodName = "Lunch Break", StartTime = new TimeSpan(11, 45, 0), EndTime = new TimeSpan(12, 30, 0), PeriodType = "Break / Recess", DisplayOrder = 6 },
                new PeriodSetting { PeriodName = "Period 5", StartTime = new TimeSpan(12, 30, 0), EndTime = new TimeSpan(13, 15, 0), PeriodType = "Teaching Period", DisplayOrder = 7 },
                new PeriodSetting { PeriodName = "Period 6", StartTime = new TimeSpan(13, 15, 0), EndTime = new TimeSpan(14, 0, 0), PeriodType = "Teaching Period", DisplayOrder = 8 }
            };

            await context.PeriodSettings.AddRangeAsync(defaultPeriods);
            await context.SaveChangesAsync();
        }

        // =================================================
        // SEED TEACHER SUBJECT ASSIGNMENTS
        // =================================================
        if (!await context.TeacherSubjectAssignments.AnyAsync())
        {
            var firstClass = await context.Classes.FirstOrDefaultAsync();
            var firstSec = await context.ClassSections.FirstOrDefaultAsync();
            var firstSub = await context.Subjects.FirstOrDefaultAsync();
            var firstTeacher = await context.Staff.FirstOrDefaultAsync(s => s.IsActive == true);

            if (firstClass != null && firstSec != null && firstSub != null && firstTeacher != null)
            {
                var sampleAssignment = new TeacherSubjectAssignment
                {
                    ClassId = firstClass.ClassId,
                    SectionId = firstSec.SectionId,
                    SubjectId = firstSub.SubjectId,
                    StaffId = firstTeacher.StaffId
                };
                await context.TeacherSubjectAssignments.AddAsync(sampleAssignment);
                await context.SaveChangesAsync();
            }
        }
        // =================================================
        // SEED LEAVE TYPES CONFIG
        // =================================================
        if (!await context.LeaveTypeConfigs.AnyAsync())
        {
            var defaultLeaveTypes = new[]
            {
                new LeaveTypeConfig { Name = "Casual Leave", Code = "CL", AnnualAllowance = 10, CarryForward = false, MaxConsecutiveDays = 3, RequiresAttachment = false, IsPaid = true, Status = "Active" },
                new LeaveTypeConfig { Name = "Sick Leave", Code = "SL", AnnualAllowance = 12, CarryForward = true, MaxConsecutiveDays = 5, RequiresAttachment = true, IsPaid = true, Status = "Active" },
                new LeaveTypeConfig { Name = "Earned Leave", Code = "EL", AnnualAllowance = 15, CarryForward = true, MaxConsecutiveDays = 10, RequiresAttachment = true, IsPaid = true, Status = "Active" },
                new LeaveTypeConfig { Name = "Maternity Leave", Code = "ML", AnnualAllowance = 90, CarryForward = false, MaxConsecutiveDays = 90, RequiresAttachment = true, IsPaid = true, Status = "Active" },
                new LeaveTypeConfig { Name = "Paternity Leave", Code = "PL", AnnualAllowance = 15, CarryForward = false, MaxConsecutiveDays = 15, RequiresAttachment = true, IsPaid = true, Status = "Active" },
                new LeaveTypeConfig { Name = "Loss of Pay", Code = "LOP", AnnualAllowance = 0, CarryForward = false, MaxConsecutiveDays = 30, RequiresAttachment = false, IsPaid = false, Status = "Active" }
            };
            await context.LeaveTypeConfigs.AddRangeAsync(defaultLeaveTypes);
            await context.SaveChangesAsync();
        }

        // =================================================
        // SEED LEAVE APPLICATIONS
        // =================================================
        if (!await context.LeaveApplications.AnyAsync())
        {
            var teacher = await context.Staff.FirstOrDefaultAsync(s => s.EmployeeCategory == "Teacher" || s.SystemRole == "Teacher");
            var clType = await context.LeaveTypeConfigs.FirstOrDefaultAsync(l => l.Code == "CL");
            if (teacher != null && clType != null)
            {
                var sampleLeave = new LeaveApplication
                {
                    StaffId = teacher.StaffId,
                    LeaveTypeId = clType.LeaveTypeId,
                    FromDate = DateTime.UtcNow.AddDays(2).Date,
                    ToDate = DateTime.UtcNow.AddDays(3).Date,
                    IsHalfDay = false,
                    RequestedDays = 2,
                    Reason = "Family function to attend",
                    AppliedDate = DateTime.UtcNow.AddDays(-1),
                    Status = "Pending"
                };
                await context.LeaveApplications.AddAsync(sampleLeave);
                await context.SaveChangesAsync();
            }
        }

        // =================================================
        // SEED SALARY STRUCTURES
        // =================================================
        if (!await context.SalaryStructures.AnyAsync())
        {
            var teacherScale = new SalaryStructure
            {
                StructureCode = "SAL-STR-TCH",
                StructureName = "Teaching Staff Scale",
                StaffCategory = "Teacher",
                Branch = "Main Campus",
                Department = "Academics",
                Designation = "Teacher",
                EmploymentType = "Full-time",
                EffectiveDate = DateTime.UtcNow.Date,
                Status = "Active",
                Notes = "Standard scale for teaching staff members.",
                MonthlyGrossSalary = 50000,
                AssignedEmployeesCount = 0,
                PayrollFrequency = "Monthly",
                SalaryPaymentDay = "5",
                PfApplicable = true,
                PfPercentage = 12,
                EsiApplicable = true,
                EsiPercentage = 0.75m,
                ProfessionalTaxApplicable = true,
                ProfessionalTaxAmount = 200,
                RoundOffRule = "Nearest 1"
            };

            teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "Basic Salary", ComponentType = "Earning", Amount = 30000 });
            teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "HRA", ComponentType = "Earning", Amount = 10000 });
            teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "DA", ComponentType = "Earning", Amount = 5000 });
            teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "Travel Allowance", ComponentType = "Earning", Amount = 5000 });
            teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "Employee PF", ComponentType = "Deduction", Amount = 3600 });
            teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "ESI", ComponentType = "Deduction", Amount = 375 });
            teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "Professional Tax", ComponentType = "Deduction", Amount = 200 });

            var adminScale = new SalaryStructure
            {
                StructureCode = "SAL-STR-ADM",
                StructureName = "Non-Teaching Admin Scale",
                StaffCategory = "Staff",
                Branch = "Main Campus",
                Department = "Administration",
                Designation = "Administrator",
                EmploymentType = "Full-time",
                EffectiveDate = DateTime.UtcNow.Date,
                Status = "Active",
                Notes = "Standard scale for administration staff members.",
                MonthlyGrossSalary = 35000,
                AssignedEmployeesCount = 0,
                PayrollFrequency = "Monthly",
                SalaryPaymentDay = "5",
                PfApplicable = true,
                PfPercentage = 12,
                EsiApplicable = false,
                EsiPercentage = 0,
                ProfessionalTaxApplicable = true,
                ProfessionalTaxAmount = 150,
                RoundOffRule = "Nearest 1"
            };

            adminScale.Items.Add(new SalaryStructureItem { ComponentName = "Basic Salary", ComponentType = "Earning", Amount = 20000 });
            adminScale.Items.Add(new SalaryStructureItem { ComponentName = "HRA", ComponentType = "Earning", Amount = 8000 });
            adminScale.Items.Add(new SalaryStructureItem { ComponentName = "DA", ComponentType = "Earning", Amount = 3000 });
            adminScale.Items.Add(new SalaryStructureItem { ComponentName = "Travel Allowance", ComponentType = "Earning", Amount = 4000 });
            adminScale.Items.Add(new SalaryStructureItem { ComponentName = "Employee PF", ComponentType = "Deduction", Amount = 2400 });
            adminScale.Items.Add(new SalaryStructureItem { ComponentName = "Professional Tax", ComponentType = "Deduction", Amount = 150 });

            await context.SalaryStructures.AddRangeAsync(teacherScale, adminScale);
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
    }
}

app.Run();
