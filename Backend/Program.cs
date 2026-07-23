using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SMS.Api.Data;
using SMS.Api.Middleware;
using SMS.Api.Models;
using SMS.Api.Repositories.Implementations;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Implementations;
using SMS.Api.Services.Interfaces;

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

// Authentication
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
builder.Services.AddScoped<
    ISchoolRepository,
    SchoolRepository>();

builder.Services.AddScoped<
    ISchoolService,
    SchoolService>();

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

                ClockSkew = TimeSpan.Zero
            };
    });

builder.Services.AddAuthorization();

// =========================================================
// 4. CONTROLLERS AND SWAGGER
// =========================================================

builder.Services.AddControllers();
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
});

var app = builder.Build();

// =========================================================
// 5. MIDDLEWARE PIPELINE
// =========================================================

app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

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