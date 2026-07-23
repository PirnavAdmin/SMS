using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SMS.Api.Data;
using SMS.Api.Middlewares;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Repositories.Implementations;
using SMS.Api.Services.Interfaces;
using SMS.Api.Services.Implementations;
var builder = WebApplication.CreateBuilder(args);

// 1. MySQL Connection
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "DefaultConnection is missing in appsettings.json.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString,ServerVersion.AutoDetect(connectionString)));
// 2. Register Repositories and Services
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IOtpRepository, OtpRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IOtpService, OtpService>();



builder.Services.AddScoped<IAdmissionRepository, AdmissionRepository>();
builder.Services.AddScoped<IAdmissionService, AdmissionService>();

builder.Services.AddScoped<IBranchRepository, BranchRepository>();
builder.Services.AddScoped<IBranchService, BranchService>();

builder.Services.AddScoped<ISubjectRepository, SubjectRepository>();
builder.Services.AddScoped<ISubjectService, SubjectService>();
builder.Services.AddScoped<IAcademicRepository,  AcademicRepository>();

builder.Services.AddScoped<IAcademicService,AcademicService>();

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

// 3. Configure JWT Authentication
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
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 4. Configure Swagger UI with JWT Bearer Authorization Lock
builder.Services.AddSwaggerGen(options =>
{
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

// 5. Custom Middleware
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// 6. Pipeline Order (Authentication before Authorization)
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();