using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "AcademicClass",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ClassName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AcademicClass", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Branches",
                columns: table => new
                {
                    BranchId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    BranchName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Branches", x => x.BranchId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Classes",
                columns: table => new
                {
                    ClassId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ClassName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Classes", x => x.ClassId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Roles",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RoleName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Roles", x => x.RoleId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Staff",
                columns: table => new
                {
                    StaffId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FirstName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LastName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Designation = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Department = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MonthlySalary = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    DateOfBirth = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Staff", x => x.StaffId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "transport_drivers",
                columns: table => new
                {
                    driver_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    driver_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    mobile_number = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    alternate_mobile_number = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    licence_number = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    licence_expiry = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    address = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    blood_group = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    emergency_contact_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    emergency_contact_number = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_drivers", x => x.driver_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "transport_routes",
                columns: table => new
                {
                    route_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    route_code = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    route_name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    start_location = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    end_location = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    distance_km = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    estimated_duration_minutes = table.Column<int>(type: "int", nullable: false),
                    description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_routes", x => x.route_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "transport_vehicles",
                columns: table => new
                {
                    vehicle_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    vehicle_number = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    registration_number = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    vehicle_name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    vehicle_type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    capacity = table.Column<int>(type: "int", nullable: false),
                    manufacturer = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    model = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    insurance_number = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    insurance_expiry = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    pollution_expiry = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    fitness_expiry = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_vehicles", x => x.vehicle_id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    FullName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MobileNumber = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PasswordHash = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Role = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsEmailVerified = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsMobileVerified = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Subjects",
                columns: table => new
                {
                    SubjectId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SubjectCode = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubjectName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CourseCode = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AcademicClassId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Subjects", x => x.SubjectId);
                    table.ForeignKey(
                        name: "FK_Subjects_AcademicClass_AcademicClassId",
                        column: x => x.AcademicClassId,
                        principalTable: "AcademicClass",
                        principalColumn: "Id");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "AdmissionApplications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RegistrationNo = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ProfilePhotoUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FirstName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    LastName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DateOfBirth = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Gender = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AppliedClassId = table.Column<int>(type: "int", nullable: false),
                    BranchName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BloodGroup = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Religion = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Caste = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FatherName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MotherName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FatherContact = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MotherMobileNumber = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AlternateMobileNumber = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ParentEmail = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HouseNo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Street = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AreaLocality = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    City = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    District = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    State = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PinCode = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    NumberOfSiblings = table.Column<int>(type: "int", nullable: false),
                    ExistingSiblingLookup = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TransportRequired = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    TransportType = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BusRoute = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PickupPoint = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DropPoint = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HostelBlock = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FloorLevel = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HostelRoom = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AvailableBed = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Scholarship = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Discount = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AdmissionApplications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AdmissionApplications_Classes_AppliedClassId",
                        column: x => x.AppliedClassId,
                        principalTable: "Classes",
                        principalColumn: "ClassId",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ClassSections",
                columns: table => new
                {
                    SectionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SectionName = table.Column<string>(type: "varchar(255)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClassId = table.Column<int>(type: "int", nullable: false),
                    ClassGradeClassId = table.Column<int>(type: "int", nullable: false),
                    ClassTeacherEmpId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassSections", x => x.SectionId);
                    table.ForeignKey(
                        name: "FK_ClassSections_Classes_ClassGradeClassId",
                        column: x => x.ClassGradeClassId,
                        principalTable: "Classes",
                        principalColumn: "ClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassSections_Staff_ClassTeacherEmpId",
                        column: x => x.ClassTeacherEmpId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.SetNull);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Section",
                columns: table => new
                {
                    SectionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SectionName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AcademicClassId = table.Column<int>(type: "int", nullable: false),
                    ClassTeacherId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Section", x => x.SectionId);
                    table.ForeignKey(
                        name: "FK_Section_AcademicClass_AcademicClassId",
                        column: x => x.AcademicClassId,
                        principalTable: "AcademicClass",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Section_Staff_ClassTeacherId",
                        column: x => x.ClassTeacherId,
                        principalTable: "Staff",
                        principalColumn: "StaffId");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "transport_pickup_points",
                columns: table => new
                {
                    pickup_point_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    route_id = table.Column<long>(type: "bigint", nullable: false),
                    pickup_point_name = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    landmark = table.Column<string>(type: "varchar(250)", maxLength: 250, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    sequence_no = table.Column<int>(type: "int", nullable: false),
                    pickup_time = table.Column<TimeSpan>(type: "time(6)", nullable: false),
                    distance_from_start = table.Column<decimal>(type: "decimal(10,2)", precision: 10, scale: 2, nullable: false),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_pickup_points", x => x.pickup_point_id);
                    table.ForeignKey(
                        name: "FK_transport_pickup_points_transport_routes_route_id",
                        column: x => x.route_id,
                        principalTable: "transport_routes",
                        principalColumn: "route_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "transport_vehicle_assignments",
                columns: table => new
                {
                    assignment_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    route_id = table.Column<long>(type: "bigint", nullable: false),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: false),
                    driver_id = table.Column<long>(type: "bigint", nullable: false),
                    assignment_date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    effective_from = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    effective_to = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    shift = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    remarks = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_vehicle_assignments", x => x.assignment_id);
                    table.ForeignKey(
                        name: "FK_transport_vehicle_assignments_transport_drivers_driver_id",
                        column: x => x.driver_id,
                        principalTable: "transport_drivers",
                        principalColumn: "driver_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_transport_vehicle_assignments_transport_routes_route_id",
                        column: x => x.route_id,
                        principalTable: "transport_routes",
                        principalColumn: "route_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_transport_vehicle_assignments_transport_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "transport_vehicles",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "transport_vehicle_maintenance",
                columns: table => new
                {
                    maintenance_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    vehicle_id = table.Column<long>(type: "bigint", nullable: false),
                    service_type = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    service_date = table.Column<DateTime>(type: "date", nullable: false),
                    cost = table.Column<decimal>(type: "decimal(12,2)", precision: 12, scale: 2, nullable: false, defaultValue: 0m),
                    vendor_center = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    next_service_due = table.Column<DateTime>(type: "date", nullable: true),
                    remarks = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime", nullable: false, defaultValueSql: "CURRENT_TIMESTAMP"),
                    updated_at = table.Column<DateTime>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_transport_vehicle_maintenance", x => x.maintenance_id);
                    table.ForeignKey(
                        name: "FK_transport_vehicle_maintenance_transport_vehicles_vehicle_id",
                        column: x => x.vehicle_id,
                        principalTable: "transport_vehicles",
                        principalColumn: "vehicle_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "OtpVerifications",
                columns: table => new
                {
                    OtpId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    OtpCodeHash = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DeliveryMethod = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Purpose = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExpiryTime = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsUsed = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    AttemptCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OtpVerifications", x => x.OtpId);
                    table.ForeignKey(
                        name: "FK_OtpVerifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "UserRoles",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserRoles", x => new { x.RoleId, x.UserId });
                    table.ForeignKey(
                        name: "FK_UserRoles_Roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "Roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserRoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ClassCurriculumSubjects",
                columns: table => new
                {
                    ClassId = table.Column<int>(type: "int", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false),
                    ClassGradeClassId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ClassCurriculumSubjects", x => new { x.ClassId, x.SubjectId });
                    table.ForeignKey(
                        name: "FK_ClassCurriculumSubjects_Classes_ClassGradeClassId",
                        column: x => x.ClassGradeClassId,
                        principalTable: "Classes",
                        principalColumn: "ClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ClassCurriculumSubjects_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "SubjectId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "student_transport_assignments",
                columns: table => new
                {
                    student_transport_assignment_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    student_id = table.Column<long>(type: "bigint", nullable: false),
                    route_id = table.Column<long>(type: "bigint", nullable: false),
                    pickup_point_id = table.Column<long>(type: "bigint", nullable: false),
                    vehicle_assignment_id = table.Column<long>(type: "bigint", nullable: false),
                    effective_from = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    effective_to = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    transport_type = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    remarks = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    status = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: true),
                    is_deleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false),
                    created_by = table.Column<long>(type: "bigint", nullable: true),
                    updated_by = table.Column<long>(type: "bigint", nullable: true),
                    created_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_transport_assignments", x => x.student_transport_assignment_id);
                    table.ForeignKey(
                        name: "FK_student_transport_assignments_transport_pickup_points_pickup~",
                        column: x => x.pickup_point_id,
                        principalTable: "transport_pickup_points",
                        principalColumn: "pickup_point_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_transport_assignments_transport_routes_route_id",
                        column: x => x.route_id,
                        principalTable: "transport_routes",
                        principalColumn: "route_id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_transport_assignments_transport_vehicle_assignments_~",
                        column: x => x.vehicle_assignment_id,
                        principalTable: "transport_vehicle_assignments",
                        principalColumn: "assignment_id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_AdmissionApplications_AppliedClassId",
                table: "AdmissionApplications",
                column: "AppliedClassId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassCurriculumSubjects_ClassGradeClassId",
                table: "ClassCurriculumSubjects",
                column: "ClassGradeClassId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassCurriculumSubjects_SubjectId",
                table: "ClassCurriculumSubjects",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassSections_ClassGradeClassId",
                table: "ClassSections",
                column: "ClassGradeClassId");

            migrationBuilder.CreateIndex(
                name: "IX_ClassSections_ClassId_SectionName",
                table: "ClassSections",
                columns: new[] { "ClassId", "SectionName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ClassSections_ClassTeacherEmpId",
                table: "ClassSections",
                column: "ClassTeacherEmpId");

            migrationBuilder.CreateIndex(
                name: "IX_OtpVerifications_UserId",
                table: "OtpVerifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Section_AcademicClassId",
                table: "Section",
                column: "AcademicClassId");

            migrationBuilder.CreateIndex(
                name: "IX_Section_ClassTeacherId",
                table: "Section",
                column: "ClassTeacherId");

            migrationBuilder.CreateIndex(
                name: "IX_STA_Route_Pickup_Vehicle",
                table: "student_transport_assignments",
                columns: new[] { "route_id", "pickup_point_id", "vehicle_assignment_id", "status", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "IX_student_transport_assignments_pickup_point_id",
                table: "student_transport_assignments",
                column: "pickup_point_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_transport_assignments_route_id",
                table: "student_transport_assignments",
                column: "route_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_transport_assignments_student_id",
                table: "student_transport_assignments",
                column: "student_id");

            migrationBuilder.CreateIndex(
                name: "IX_student_transport_assignments_student_id_effective_from_effe~",
                table: "student_transport_assignments",
                columns: new[] { "student_id", "effective_from", "effective_to" });

            migrationBuilder.CreateIndex(
                name: "IX_student_transport_assignments_vehicle_assignment_id",
                table: "student_transport_assignments",
                column: "vehicle_assignment_id");

            migrationBuilder.CreateIndex(
                name: "IX_Subjects_AcademicClassId",
                table: "Subjects",
                column: "AcademicClassId");

            migrationBuilder.CreateIndex(
                name: "IX_transport_drivers_licence_number",
                table: "transport_drivers",
                column: "licence_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_transport_drivers_mobile_number",
                table: "transport_drivers",
                column: "mobile_number");

            migrationBuilder.CreateIndex(
                name: "IX_transport_pickup_points_route_id_pickup_point_name",
                table: "transport_pickup_points",
                columns: new[] { "route_id", "pickup_point_name" });

            migrationBuilder.CreateIndex(
                name: "IX_transport_pickup_points_route_id_sequence_no",
                table: "transport_pickup_points",
                columns: new[] { "route_id", "sequence_no" });

            migrationBuilder.CreateIndex(
                name: "ix_transport_routes_status_is_deleted",
                table: "transport_routes",
                columns: new[] { "status", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "ux_transport_routes_route_code",
                table: "transport_routes",
                column: "route_code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ux_transport_routes_route_name",
                table: "transport_routes",
                column: "route_name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_assignments_driver_id",
                table: "transport_vehicle_assignments",
                column: "driver_id");

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_assignments_route_id",
                table: "transport_vehicle_assignments",
                column: "route_id");

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_assignments_route_id_vehicle_id_driver_id_~",
                table: "transport_vehicle_assignments",
                columns: new[] { "route_id", "vehicle_id", "driver_id", "effective_from" });

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_assignments_vehicle_id",
                table: "transport_vehicle_assignments",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_TVA_Vehicle_Driver_Route",
                table: "transport_vehicle_assignments",
                columns: new[] { "vehicle_id", "driver_id", "route_id", "status", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicle_maintenance_vehicle_id",
                table: "transport_vehicle_maintenance",
                column: "vehicle_id");

            migrationBuilder.CreateIndex(
                name: "IX_VehMaint_Vehicle_ServiceDate_Deleted",
                table: "transport_vehicle_maintenance",
                columns: new[] { "vehicle_id", "service_date", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicles_registration_number",
                table: "transport_vehicles",
                column: "registration_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_transport_vehicles_vehicle_number",
                table: "transport_vehicles",
                column: "vehicle_number",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_UserId",
                table: "UserRoles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_Users_MobileNumber",
                table: "Users",
                column: "MobileNumber",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AdmissionApplications");

            migrationBuilder.DropTable(
                name: "Branches");

            migrationBuilder.DropTable(
                name: "ClassCurriculumSubjects");

            migrationBuilder.DropTable(
                name: "ClassSections");

            migrationBuilder.DropTable(
                name: "OtpVerifications");

            migrationBuilder.DropTable(
                name: "Section");

            migrationBuilder.DropTable(
                name: "student_transport_assignments");

            migrationBuilder.DropTable(
                name: "transport_vehicle_maintenance");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropTable(
                name: "Subjects");

            migrationBuilder.DropTable(
                name: "Classes");

            migrationBuilder.DropTable(
                name: "Staff");

            migrationBuilder.DropTable(
                name: "transport_pickup_points");

            migrationBuilder.DropTable(
                name: "transport_vehicle_assignments");

            migrationBuilder.DropTable(
                name: "Roles");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "AcademicClass");

            migrationBuilder.DropTable(
                name: "transport_drivers");

            migrationBuilder.DropTable(
                name: "transport_routes");

            migrationBuilder.DropTable(
                name: "transport_vehicles");
        }
    }
}
