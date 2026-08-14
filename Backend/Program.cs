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
using SMS.Api.Repositories.Interfaces.AcademicManagement;
using SMS.Api.Repositories.Implementations;
using SMS.Api.Repositories.Implementations.AcademicManagement;

using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Interfaces.AcademicManagement;
using SMS.Api.Services.Implementations;
using SMS.Api.Services.Implementations.AcademicManagement;

using SMS.Api.Services.Interfaces.StaffManagement;
using SMS.Api.Services.Implementations.StaffManagement;

using SMS.Api.Repositories.Interfaces.Examination;
using SMS.Api.Repositories.Implementations.Examination;
using SMS.Api.Services.Interfaces.Examination;
using SMS.Api.Services.Implementations.Examination;


var builder = WebApplication.CreateBuilder(args);

Console.WriteLine(
    BCrypt.Net.BCrypt.HashPassword("admin1234")
);
// =========================================================
// 1. DATABASE CONNECTION
// =========================================================

var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(
        connectionString,
        new MySqlServerVersion(new Version(8, 0, 30)),
        mysqlOptions =>
            mysqlOptions.UseQuerySplittingBehavior(
                QuerySplittingBehavior.SplitQuery)));


// =========================================================
// 2. DEPENDENCY INJECTION
// =========================================================

// Authentication
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAdminRepository, AdminRepository>();
builder.Services.AddScoped<ISuperAdminRepository, SuperAdminRepository>();

builder.Services.AddScoped<ISuperAdminService, SuperAdminService>();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<IOtpService, OtpService>();


// =========================================================
// TRANSPORT ROUTE
// =========================================================

builder.Services.AddScoped<
    ITransportRouteRepository,
    TransportRouteRepository>();

builder.Services.AddScoped<
    ITransportRouteService,
    TransportRouteService>();


// =========================================================
// PICKUP POINT
// =========================================================

builder.Services.AddScoped<
    IPickupPointRepository,
    PickupPointRepository>();

builder.Services.AddScoped<
    IPickupPointService,
    PickupPointService>();


// =========================================================
// TRANSPORT VEHICLE
// =========================================================

builder.Services.AddScoped<
    ITransportVehicleRepository,
    TransportVehicleRepository>();

builder.Services.AddScoped<
    ITransportVehicleService,
    TransportVehicleService>();


// =========================================================
// TRANSPORT DRIVER
// =========================================================

builder.Services.AddScoped<
    ITransportDriverRepository,
    TransportDriverRepository>();

builder.Services.AddScoped<
    ITransportDriverService,
    TransportDriverService>();


// =========================================================
// TRANSPORT ATTENDANT
// =========================================================

builder.Services.AddScoped<
    ITransportAttendantRepository,
    TransportAttendantRepository>();

builder.Services.AddScoped<
    ITransportAttendantService,
    TransportAttendantService>();


// =========================================================
// VEHICLE ASSIGNMENT
// =========================================================

builder.Services.AddScoped<
    ITransportVehicleAssignmentRepository,
    TransportVehicleAssignmentRepository>();

builder.Services.AddScoped<
    ITransportVehicleAssignmentService,
    TransportVehicleAssignmentService>();


// =========================================================
// STUDENT TRANSPORT ASSIGNMENT
// =========================================================

builder.Services.AddScoped<
    IStudentTransportAssignmentRepository,
    StudentTransportAssignmentRepository>();

builder.Services.AddScoped<
    IStudentTransportAssignmentService,
    StudentTransportAssignmentService>();


// =========================================================
// VEHICLE MAINTENANCE
// =========================================================

builder.Services.AddScoped<
    IVehicleMaintenanceRepository,
    VehicleMaintenanceRepository>();

builder.Services.AddScoped<
    IVehicleMaintenanceService,
    VehicleMaintenanceService>();


// =========================================================
// EXAMINATION
// =========================================================

builder.Services.AddScoped<
    IExamNewRepository,
    ExamNewRepository>();

builder.Services.AddScoped<
    IExamNewService,
    ExamNewService>();

builder.Services.AddScoped<
    IExamScheduleRepository,
    ExamScheduleRepository>();

builder.Services.AddScoped<
    IExamScheduleService,
    ExamScheduleService>();

builder.Services.AddScoped<
    IExamMarksEntryRepository,
    ExamMarksEntryRepository>();

builder.Services.AddScoped<
    IExamMarksEntryService,
    ExamMarksEntryService>();

builder.Services.AddScoped<
    IExamResultsReportsRepository,
    ExamResultsReportsRepository>();

builder.Services.AddScoped<
    IExamResultsReportsService,
    ExamResultsReportsService>();

builder.Services.AddScoped<
    IExamGradingScaleRepository,
    ExamGradingScaleRepository>();

builder.Services.AddScoped<
    IExamGradingScaleService,
    ExamGradingScaleService>();


// =========================================================
// TRANSPORT DASHBOARD
// =========================================================

builder.Services.AddScoped<
    ITransportDashboardRepository,
    TransportDashboardRepository>();

builder.Services.AddScoped<
    ITransportDashboardService,
    TransportDashboardService>();


// =========================================================
// TRANSPORT REPORTS
// =========================================================

builder.Services.AddScoped<
    ITransportReportRepository,
    TransportReportRepository>();

builder.Services.AddScoped<
    ITransportReportService,
    TransportReportService>();


// =========================================================
// TEACHER STUDENT ATTENDANCE
// =========================================================

builder.Services.AddScoped<
    ITeacherStudentAttendanceRepository,
    TeacherStudentAttendanceRepository>();

builder.Services.AddScoped<
    ITeacherStudentAttendanceService,
    TeacherStudentAttendanceService>();


// =========================================================
// TEACHER PROFILE
// =========================================================

builder.Services.AddScoped<
    SMS.Api.Repositories.Interfaces.ITeacherProfileRepository,
    SMS.Api.Repositories.Implementations.TeacherProfileRepository>();

builder.Services.AddScoped<
    SMS.Api.Services.Interfaces.ITeacherProfileService,
    SMS.Api.Services.Implementations.TeacherProfileService>();


// =========================================================
// SCHOOL / ACADEMIC MANAGEMENT
// =========================================================

builder.Services.AddScoped<
    ISchoolRepository,
    SchoolRepository>();

builder.Services.AddScoped<
    ISchoolService,
    SchoolService>();

builder.Services.AddScoped<
    IStaffService,
    StaffService>();


// =========================================================
// TRANSPORT MANAGEMENT
// =========================================================

builder.Services.AddScoped<
    ITransportRepository,
    TransportRepository>();

builder.Services.AddScoped<
    ITransportService,
    TransportService>();


// =========================================================
// HOSTEL ERP
// =========================================================

builder.Services.AddScoped<
    IHostelRepository,
    HostelRepository>();

builder.Services.AddScoped<
    IHostelService,
    HostelService>();


// =========================================================
// UNIFORM MANAGEMENT
// =========================================================

builder.Services.AddScoped<
    SMS.Api.Repositories.Interfaces.IUniformRepository,
    SMS.Api.Repositories.Implementations.UniformRepository>();

builder.Services.AddScoped<
    SMS.Api.Services.Interfaces.IUniformService,
    SMS.Api.Services.Implementations.UniformService>();


// =========================================================
// CLASS TIMETABLE
// =========================================================

builder.Services.AddScoped<
    ITimetableRepository,
    TimetableRepository>();

builder.Services.AddScoped<
    ITimetableService,
    TimetableService>();


// =========================================================
// TEACHER DASHBOARD
// =========================================================

builder.Services.AddScoped<
    ITeacherDashboardRepository,
    TeacherDashboardRepository>();

builder.Services.AddScoped<
    ITeacherDashboardService,
    TeacherDashboardService>();


// =========================================================
// TEACHER ATTENDANCE
// =========================================================

builder.Services.AddScoped<
    ITeacherAttendanceRepository,
    TeacherAttendanceRepository>();

builder.Services.AddScoped<
    ITeacherAttendanceService,
    TeacherAttendanceService>();

// =========================================================
// FINANCE MANAGEMENT
// =========================================================

builder.Services.AddScoped<
    SMS.Api.Repositories.Interfaces.FinanceManagement.IFinanceRepository,
    SMS.Api.Repositories.Implementations.FinanceManagement.FinanceRepository>();

builder.Services.AddScoped<
    SMS.Api.Services.Interfaces.FinanceManagement.IFinanceService,
    SMS.Api.Services.Implementations.FinanceManagement.FinanceService>();


// =========================================================
// 3. JWT AUTHENTICATION
// =========================================================

var jwtKey =
    builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException(
        "Jwt:Key is missing in appsettings.json.");

var jwtIssuer =
    builder.Configuration["Jwt:Issuer"]
    ?? throw new InvalidOperationException(
        "Jwt:Issuer is missing in appsettings.json.");

var jwtAudience =
    builder.Configuration["Jwt:Audience"]
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

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)),

                RoleClaimType =
                    System.Security.Claims.ClaimTypes.Role,

                NameClaimType =
                    System.Security.Claims.ClaimTypes.Name,

                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();


// =========================================================
// 4. CONTROLLERS AND JSON
// =========================================================

builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;

        options.JsonSerializerOptions.PropertyNameCaseInsensitive =
            true;
    });


// =========================================================
// 5. SWAGGER
// =========================================================

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
                    Reference =
                        new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },

                Array.Empty<string>()
            }
        });

    options.CustomSchemaIds(
        type => type.FullName);

    options.ResolveConflictingActions(
        apiDescriptions =>
            apiDescriptions.First());
});


// =========================================================
// 6. CORS
// =========================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowAll",
        policy =>
        {
            policy
                .AllowAnyOrigin()
                .AllowAnyMethod()
                .AllowAnyHeader();
        });
});


// =========================================================
// 7. BUILD APPLICATION
// =========================================================

var app = builder.Build();


// =========================================================
// 8. EXCEPTION HANDLING
// =========================================================

app.UseMiddleware<ExceptionMiddleware>();


// =========================================================
// 9. SWAGGER
// =========================================================

app.UseSwagger();

app.UseSwaggerUI();


// =========================================================
// 10. FORWARDED HEADERS
// =========================================================

app.UseForwardedHeaders(
    new ForwardedHeadersOptions
    {
        ForwardedHeaders =
            ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto
    });


// =========================================================
// IMPORTANT:
// Do NOT use UseHttpsRedirection() here.
//
// ngrok handles HTTPS externally and forwards the request
// to the local ASP.NET Core HTTP endpoint.
// =========================================================


// =========================================================
// 11. CORS
// =========================================================

app.UseCors("AllowAll");


// =========================================================
// 12. AUTHENTICATION / AUTHORIZATION
// =========================================================

app.UseAuthentication();

app.UseAuthorization();


// =========================================================
// 13. CONTROLLERS
// =========================================================

app.MapControllers();


// =========================================================
// 14. APPLICATION HEALTH CHECK
// =========================================================

app.MapGet(
    "/health",
    () =>
        Results.Ok(
            new
            {
                status = "Healthy"
            }));


// =========================================================
// 15. DATABASE HEALTH CHECK
// =========================================================

app.MapGet(
    "/health/db",
    async (AppDbContext db) =>
    {
        try
        {
            bool canConnect =
                await db.Database.CanConnectAsync();

            if (canConnect)
            {
                return Results.Ok(
                    new
                    {
                        status = "Healthy",
                        database = "Connected"
                    });
            }

            return Results.StatusCode(503);
        }
        catch (Exception ex)
        {
            return Results.Problem(
                $"Database connection failed: {ex.Message}",
                statusCode: 503);
        }
    });


// =========================================================
// 16. RUN APPLICATION
// =========================================================

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var logger = services.GetRequiredService<ILogger<Program>>();
        await DbInitializer.InitializeAsync(context, logger);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred during database initialization.");
    }
}

app.Run();