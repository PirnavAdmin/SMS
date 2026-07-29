using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStaffAndMultiModuleFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentTransportAssignments_TransportVehicleAssignments_Vehi~",
                table: "StudentTransportAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_StudentTransportAssignments_transport_pickup_points_PickupPo~",
                table: "StudentTransportAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_StudentTransportAssignments_transport_routes_RouteId",
                table: "StudentTransportAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_TransportDrivers_transport_vehicles_AssignedVehicleId",
                table: "TransportDrivers");

            migrationBuilder.DropForeignKey(
                name: "FK_TransportVehicleAssignments_TransportDrivers_DriverId",
                table: "TransportVehicleAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_TransportVehicleAssignments_transport_routes_RouteId",
                table: "TransportVehicleAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_TransportVehicleAssignments_transport_vehicles_VehicleId",
                table: "TransportVehicleAssignments");

            migrationBuilder.DropIndex(
                name: "ix_transport_routes_status_is_deleted",
                table: "transport_routes");

            migrationBuilder.DropIndex(
                name: "ux_transport_routes_route_name",
                table: "transport_routes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TransportVehicleAssignments",
                table: "TransportVehicleAssignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_TransportDrivers",
                table: "TransportDrivers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StudentTransportAssignments",
                table: "StudentTransportAssignments");

            migrationBuilder.RenameTable(
                name: "TransportVehicleAssignments",
                newName: "transport_vehicle_assignments");

            migrationBuilder.RenameTable(
                name: "TransportDrivers",
                newName: "transport_drivers");

            migrationBuilder.RenameTable(
                name: "StudentTransportAssignments",
                newName: "student_transport_assignments");

            migrationBuilder.RenameColumn(
                name: "status",
                table: "transport_routes",
                newName: "Status");

            migrationBuilder.RenameColumn(
                name: "description",
                table: "transport_routes",
                newName: "Description");

            migrationBuilder.RenameColumn(
                name: "updated_by",
                table: "transport_routes",
                newName: "UpdatedBy");

            migrationBuilder.RenameColumn(
                name: "updated_at",
                table: "transport_routes",
                newName: "UpdatedAt");

            migrationBuilder.RenameColumn(
                name: "start_location",
                table: "transport_routes",
                newName: "StartLocation");

            migrationBuilder.RenameColumn(
                name: "route_name",
                table: "transport_routes",
                newName: "RouteName");

            migrationBuilder.RenameColumn(
                name: "route_code",
                table: "transport_routes",
                newName: "RouteCode");

            migrationBuilder.RenameColumn(
                name: "is_deleted",
                table: "transport_routes",
                newName: "IsDeleted");

            migrationBuilder.RenameColumn(
                name: "estimated_duration_minutes",
                table: "transport_routes",
                newName: "EstimatedDurationMinutes");

            migrationBuilder.RenameColumn(
                name: "end_location",
                table: "transport_routes",
                newName: "EndLocation");

            migrationBuilder.RenameColumn(
                name: "distance_km",
                table: "transport_routes",
                newName: "DistanceKm");

            migrationBuilder.RenameColumn(
                name: "created_by",
                table: "transport_routes",
                newName: "CreatedBy");

            migrationBuilder.RenameColumn(
                name: "created_at",
                table: "transport_routes",
                newName: "CreatedAt");

            migrationBuilder.RenameColumn(
                name: "route_id",
                table: "transport_routes",
                newName: "RouteId");

            migrationBuilder.RenameIndex(
                name: "IX_TransportVehicleAssignments_VehicleId",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_VehicleId");

            migrationBuilder.RenameIndex(
                name: "IX_TransportVehicleAssignments_RouteId_VehicleId_DriverId_Effec~",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_RouteId_VehicleId_DriverId_Eff~");

            migrationBuilder.RenameIndex(
                name: "IX_TransportVehicleAssignments_RouteId",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_RouteId");

            migrationBuilder.RenameIndex(
                name: "IX_TransportVehicleAssignments_DriverId",
                table: "transport_vehicle_assignments",
                newName: "IX_transport_vehicle_assignments_DriverId");

            migrationBuilder.RenameIndex(
                name: "IX_TransportDrivers_MobileNumber",
                table: "transport_drivers",
                newName: "IX_transport_drivers_MobileNumber");

            migrationBuilder.RenameIndex(
                name: "IX_TransportDrivers_LicenceNumber",
                table: "transport_drivers",
                newName: "IX_transport_drivers_LicenceNumber");

            migrationBuilder.RenameIndex(
                name: "IX_TransportDrivers_AssignedVehicleId",
                table: "transport_drivers",
                newName: "IX_transport_drivers_AssignedVehicleId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentTransportAssignments_VehicleAssignmentId",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_VehicleAssignmentId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentTransportAssignments_StudentId_EffectiveFrom_Effectiv~",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_StudentId_EffectiveFrom_Effect~");

            migrationBuilder.RenameIndex(
                name: "IX_StudentTransportAssignments_StudentId",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_StudentId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentTransportAssignments_RouteId",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_RouteId");

            migrationBuilder.RenameIndex(
                name: "IX_StudentTransportAssignments_PickupPointId",
                table: "student_transport_assignments",
                newName: "IX_student_transport_assignments_PickupPointId");

            migrationBuilder.AlterColumn<string>(
                name: "VehicleType",
                table: "transport_vehicles",
                type: "varchar(50)",
                maxLength: 50,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "VehicleName",
                table: "transport_vehicles",
                type: "varchar(100)",
                maxLength: 100,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<bool>(
                name: "Status",
                table: "transport_vehicles",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: true,
                oldClrType: typeof(bool),
                oldType: "tinyint(1)");

            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                table: "transport_vehicles",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "tinyint(1)");

            migrationBuilder.AlterColumn<string>(
                name: "StartLocation",
                table: "transport_routes",
                type: "varchar(150)",
                maxLength: 150,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(150)",
                oldMaxLength: 150)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<string>(
                name: "EndLocation",
                table: "transport_routes",
                type: "varchar(150)",
                maxLength: 150,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "varchar(150)",
                oldMaxLength: 150)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "AccountHolderName",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "AccountNumber",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "BankName",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "BranchName",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "EmployeeCategory",
                table: "Staff",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "IfscCode",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "JoiningDate",
                table: "Staff",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PrimarySubject",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Qualification",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ResidentialAddress",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Specialization",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "SystemRole",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "UpiId",
                table: "Staff",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "AllocatedBedId",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "StudentType",
                table: "AdmissionApplications",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transport_vehicle_assignments",
                table: "transport_vehicle_assignments",
                column: "AssignmentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transport_drivers",
                table: "transport_drivers",
                column: "DriverId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_student_transport_assignments",
                table: "student_transport_assignments",
                column: "StudentTransportAssignmentId");

            migrationBuilder.CreateTable(
                name: "Circulars",
                columns: table => new
                {
                    CircularId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Content = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TargetAudience = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    SmsSent = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    EmailSent = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    PushDelivered = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Circulars", x => x.CircularId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ExamMarks",
                columns: table => new
                {
                    MarkId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ExamId = table.Column<long>(type: "bigint", nullable: false),
                    ExamTitle = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClassName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SectionName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    RollNo = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StudentName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubjectName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MaxMarks = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MarksObtained = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    GradePreview = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsLocked = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamMarks", x => x.MarkId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ExamResults",
                columns: table => new
                {
                    ResultId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ExamId = table.Column<long>(type: "bigint", nullable: false),
                    ExamTitle = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClassName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SectionName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    RollNo = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StudentName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MarksObtained = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    TotalMaxMarks = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Percentage = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    GPA = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    FinalGrade = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PassStatus = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ResultStatus = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamResults", x => x.ResultId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ExamSchedules",
                columns: table => new
                {
                    ScheduleId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ExamId = table.Column<long>(type: "bigint", nullable: false),
                    ExamTitle = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClassName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SectionName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubjectName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExamDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    StartTime = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EndTime = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MaxMarks = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    PassMarks = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    AcademicYear = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BranchName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamSchedules", x => x.ScheduleId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "GradeConfigurations",
                columns: table => new
                {
                    GradeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SchemeName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    GradeLetter = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MinPercentage = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    MaxPercentage = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    GradePoints = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    CriteriaStatus = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GradeConfigurations", x => x.GradeId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "HolidayCalendars",
                columns: table => new
                {
                    HolidayId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Type = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FromDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ToDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ApplicableBranch = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HolidayCalendars", x => x.HolidayId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Homeworks",
                columns: table => new
                {
                    HomeworkId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ClassName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubjectName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DueDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AttachmentFileName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AttachmentUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    TeacherName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmissionsCount = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Homeworks", x => x.HomeworkId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "hostel_blocks",
                columns: table => new
                {
                    HostelId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HostelName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HostelCode = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    HostelType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    WardenName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PrimaryMobileNumber = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AlternateMobileNumber = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Address = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hostel_blocks", x => x.HostelId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "LeaveTypeConfigs",
                columns: table => new
                {
                    LeaveTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Code = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AnnualAllowance = table.Column<int>(type: "int", nullable: false),
                    CarryForward = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    MaxConsecutiveDays = table.Column<int>(type: "int", nullable: false),
                    RequiresAttachment = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsPaid = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaveTypeConfigs", x => x.LeaveTypeId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Meetings",
                columns: table => new
                {
                    MeetingId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    MeetingAudience = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ParticipantType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ParticipantName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ParticipantPhone = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    WardStudentName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    WardAdmissionNo = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    WardClass = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingTitle = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Agenda = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingMode = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Building = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Floor = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingRoom = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RoomCapacity = table.Column<int>(type: "int", nullable: false),
                    MeetingDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    StartTime = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EndTime = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MeetingStatus = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Meetings", x => x.MeetingId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "PayrollConfigs",
                columns: table => new
                {
                    PayrollConfigId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PayrollName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Branch = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FinancialYear = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Currency = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EffectiveFrom = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EffectiveTo = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PayrollConfigs", x => x.PayrollConfigId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Payslips",
                columns: table => new
                {
                    PayslipId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    EmployeeId = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmployeeName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Department = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Designation = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Month = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Year = table.Column<int>(type: "int", nullable: false),
                    BasicSalary = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    HouseRentAllowance = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    DearnessAllowance = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    GrossEarnings = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    ProvidentFund = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Esi = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    TotalDeductions = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    NetPay = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    PanNumber = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PfNumber = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EsiNumber = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Payslips", x => x.PayslipId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "period_settings",
                columns: table => new
                {
                    PeriodId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    PeriodName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StartTime = table.Column<TimeSpan>(type: "time(6)", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time(6)", nullable: false),
                    PeriodType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DisplayOrder = table.Column<int>(type: "int", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsDeleted = table.Column<bool>(type: "tinyint(1)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_period_settings", x => x.PeriodId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "QuestionPapers",
                columns: table => new
                {
                    QuestionPaperId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ExamId = table.Column<long>(type: "bigint", nullable: false),
                    ExamTitle = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClassName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SectionName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubjectName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PaperTitle = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PaperCode = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ExamDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Duration = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MaxMarks = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Instructions = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentFileName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentSize = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    DocumentUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UploadedBy = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UploadedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    PublishStatus = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QuestionPapers", x => x.QuestionPaperId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "room_type_configs",
                columns: table => new
                {
                    RoomTypeId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RoomTypeSpecification = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BedCapacity = table.Column<int>(type: "int", nullable: false),
                    AcType = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_room_type_configs", x => x.RoomTypeId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SalaryComponents",
                columns: table => new
                {
                    ComponentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Type = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Value = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    Taxable = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Mandatory = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalaryComponents", x => x.ComponentId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SalaryStructures",
                columns: table => new
                {
                    StructureId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StructureCode = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StructureName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Branch = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Department = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Designation = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StaffCategory = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmploymentType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EffectiveDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Notes = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MonthlyGrossSalary = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    AssignedEmployeesCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalaryStructures", x => x.StructureId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SchoolEvents",
                columns: table => new
                {
                    EventId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Category = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Venue = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StartDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Time = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Organizer = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ApplicableBranch = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SchoolEvents", x => x.EventId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StaffAttendances",
                columns: table => new
                {
                    StaffAttendanceId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AcademicYear = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Branch = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Department = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Designation = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Remarks = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffAttendances", x => x.StaffAttendanceId);
                    table.ForeignKey(
                        name: "FK_StaffAttendances_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StaffDocuments",
                columns: table => new
                {
                    StaffDocumentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    DocumentType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsRequired = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UploadedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StaffDocuments", x => x.StaffDocumentId);
                    table.ForeignKey(
                        name: "FK_StaffDocuments_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "teacher_subject_assignments",
                columns: table => new
                {
                    AssignmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ClassId = table.Column<int>(type: "int", nullable: false),
                    SectionId = table.Column<int>(type: "int", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_teacher_subject_assignments", x => x.AssignmentId);
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_Classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "ClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_class_sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "class_sections",
                        principalColumn: "SectionId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_teacher_subject_assignments_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "SubjectId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "timetable_headers",
                columns: table => new
                {
                    HeaderId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AcademicYear = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    BranchName = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ClassId = table.Column<int>(type: "int", nullable: false),
                    SectionId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "varchar(30)", maxLength: 30, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IncludeSaturday = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_timetable_headers", x => x.HeaderId);
                    table.ForeignKey(
                        name: "FK_timetable_headers_Classes_ClassId",
                        column: x => x.ClassId,
                        principalTable: "Classes",
                        principalColumn: "ClassId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_timetable_headers_class_sections_SectionId",
                        column: x => x.SectionId,
                        principalTable: "class_sections",
                        principalColumn: "SectionId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "ExamInvigilatorAssignments",
                columns: table => new
                {
                    AssignmentId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    ScheduleId = table.Column<int>(type: "int", nullable: false),
                    SectionName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    StaffName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmployeeId = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExamInvigilatorAssignments", x => x.AssignmentId);
                    table.ForeignKey(
                        name: "FK_ExamInvigilatorAssignments_ExamSchedules_ScheduleId",
                        column: x => x.ScheduleId,
                        principalTable: "ExamSchedules",
                        principalColumn: "ScheduleId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "HomeworkSubmissions",
                columns: table => new
                {
                    SubmissionId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HomeworkId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    StudentName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SubmissionDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    AttachmentUrl = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MarksObtained = table.Column<decimal>(type: "decimal(65,30)", nullable: true),
                    Feedback = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HomeworkSubmissions", x => x.SubmissionId);
                    table.ForeignKey(
                        name: "FK_HomeworkSubmissions_Homeworks_HomeworkId",
                        column: x => x.HomeworkId,
                        principalTable: "Homeworks",
                        principalColumn: "HomeworkId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "hostel_wardens",
                columns: table => new
                {
                    WardenId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HostelId = table.Column<int>(type: "int", nullable: false),
                    StaffId = table.Column<int>(type: "int", nullable: true),
                    WardenName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    MobileNumber = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AlternateMobile = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    EmailAddress = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hostel_wardens", x => x.WardenId);
                    table.ForeignKey(
                        name: "FK_hostel_wardens_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId");
                    table.ForeignKey(
                        name: "FK_hostel_wardens_hostel_blocks_HostelId",
                        column: x => x.HostelId,
                        principalTable: "hostel_blocks",
                        principalColumn: "HostelId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "LeaveApplications",
                columns: table => new
                {
                    LeaveApplicationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StaffId = table.Column<int>(type: "int", nullable: false),
                    LeaveTypeId = table.Column<int>(type: "int", nullable: false),
                    FromDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ToDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    IsHalfDay = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    RequestedDays = table.Column<int>(type: "int", nullable: false),
                    Reason = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AppliedDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LeaveApplications", x => x.LeaveApplicationId);
                    table.ForeignKey(
                        name: "FK_LeaveApplications_LeaveTypeConfigs_LeaveTypeId",
                        column: x => x.LeaveTypeId,
                        principalTable: "LeaveTypeConfigs",
                        principalColumn: "LeaveTypeId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_LeaveApplications_Staff_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "room_masters",
                columns: table => new
                {
                    RoomId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HostelId = table.Column<int>(type: "int", nullable: false),
                    RoomTypeId = table.Column<int>(type: "int", nullable: false),
                    FloorLevel = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RoomNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_room_masters", x => x.RoomId);
                    table.ForeignKey(
                        name: "FK_room_masters_hostel_blocks_HostelId",
                        column: x => x.HostelId,
                        principalTable: "hostel_blocks",
                        principalColumn: "HostelId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_room_masters_room_type_configs_RoomTypeId",
                        column: x => x.RoomTypeId,
                        principalTable: "room_type_configs",
                        principalColumn: "RoomTypeId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "SalaryStructureItems",
                columns: table => new
                {
                    ItemId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StructureId = table.Column<int>(type: "int", nullable: false),
                    ComponentName = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    ComponentType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Amount = table.Column<decimal>(type: "decimal(65,30)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalaryStructureItems", x => x.ItemId);
                    table.ForeignKey(
                        name: "FK_SalaryStructureItems_SalaryStructures_StructureId",
                        column: x => x.StructureId,
                        principalTable: "SalaryStructures",
                        principalColumn: "StructureId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "timetable_slots",
                columns: table => new
                {
                    SlotId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    HeaderId = table.Column<int>(type: "int", nullable: false),
                    PeriodId = table.Column<int>(type: "int", nullable: true),
                    DayOfWeek = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StartTime = table.Column<TimeSpan>(type: "time(6)", nullable: false),
                    EndTime = table.Column<TimeSpan>(type: "time(6)", nullable: false),
                    SubjectId = table.Column<int>(type: "int", nullable: false),
                    TeacherId = table.Column<int>(type: "int", nullable: false),
                    RoomNo = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_timetable_slots", x => x.SlotId);
                    table.ForeignKey(
                        name: "FK_timetable_slots_Staff_TeacherId",
                        column: x => x.TeacherId,
                        principalTable: "Staff",
                        principalColumn: "StaffId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_timetable_slots_period_settings_PeriodId",
                        column: x => x.PeriodId,
                        principalTable: "period_settings",
                        principalColumn: "PeriodId");
                    table.ForeignKey(
                        name: "FK_timetable_slots_subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "subjects",
                        principalColumn: "SubjectId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_timetable_slots_timetable_headers_HeaderId",
                        column: x => x.HeaderId,
                        principalTable: "timetable_headers",
                        principalColumn: "HeaderId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "student_bed_allocations",
                columns: table => new
                {
                    AllocationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    RegistrationNo = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StudentName = table.Column<string>(type: "varchar(150)", maxLength: 150, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    StudentId = table.Column<int>(type: "int", nullable: true),
                    HostelId = table.Column<int>(type: "int", nullable: false),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    BedNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    JoiningDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_student_bed_allocations", x => x.AllocationId);
                    table.ForeignKey(
                        name: "FK_student_bed_allocations_AdmissionApplications_StudentId",
                        column: x => x.StudentId,
                        principalTable: "AdmissionApplications",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_bed_allocations_hostel_blocks_HostelId",
                        column: x => x.HostelId,
                        principalTable: "hostel_blocks",
                        principalColumn: "HostelId",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_student_bed_allocations_room_masters_RoomId",
                        column: x => x.RoomId,
                        principalTable: "room_masters",
                        principalColumn: "RoomId",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "hostel_attendances",
                columns: table => new
                {
                    AttendanceId = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    AllocationId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CurfewStatus = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Remarks = table.Column<string>(type: "varchar(255)", maxLength: 255, nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_hostel_attendances", x => x.AttendanceId);
                    table.ForeignKey(
                        name: "FK_hostel_attendances_student_bed_allocations_AllocationId",
                        column: x => x.AllocationId,
                        principalTable: "student_bed_allocations",
                        principalColumn: "AllocationId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_ExamInvigilatorAssignments_ScheduleId",
                table: "ExamInvigilatorAssignments",
                column: "ScheduleId");

            migrationBuilder.CreateIndex(
                name: "IX_HomeworkSubmissions_HomeworkId",
                table: "HomeworkSubmissions",
                column: "HomeworkId");

            migrationBuilder.CreateIndex(
                name: "IX_hostel_attendances_AllocationId",
                table: "hostel_attendances",
                column: "AllocationId");

            migrationBuilder.CreateIndex(
                name: "IX_hostel_wardens_HostelId",
                table: "hostel_wardens",
                column: "HostelId");

            migrationBuilder.CreateIndex(
                name: "IX_hostel_wardens_StaffId",
                table: "hostel_wardens",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveApplications_LeaveTypeId",
                table: "LeaveApplications",
                column: "LeaveTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_LeaveApplications_StaffId",
                table: "LeaveApplications",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_room_masters_HostelId",
                table: "room_masters",
                column: "HostelId");

            migrationBuilder.CreateIndex(
                name: "IX_room_masters_RoomTypeId",
                table: "room_masters",
                column: "RoomTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_SalaryStructureItems_StructureId",
                table: "SalaryStructureItems",
                column: "StructureId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffAttendances_StaffId",
                table: "StaffAttendances",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_StaffDocuments_StaffId",
                table: "StaffDocuments",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_student_bed_allocations_HostelId",
                table: "student_bed_allocations",
                column: "HostelId");

            migrationBuilder.CreateIndex(
                name: "IX_student_bed_allocations_RegistrationNo_Status",
                table: "student_bed_allocations",
                columns: new[] { "RegistrationNo", "Status" });

            migrationBuilder.CreateIndex(
                name: "IX_student_bed_allocations_RoomId",
                table: "student_bed_allocations",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_student_bed_allocations_StudentId",
                table: "student_bed_allocations",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_ClassId_SectionId_SubjectId",
                table: "teacher_subject_assignments",
                columns: new[] { "ClassId", "SectionId", "SubjectId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_SectionId",
                table: "teacher_subject_assignments",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_StaffId",
                table: "teacher_subject_assignments",
                column: "StaffId");

            migrationBuilder.CreateIndex(
                name: "IX_teacher_subject_assignments_SubjectId",
                table: "teacher_subject_assignments",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_timetable_headers_ClassId_SectionId_AcademicYear",
                table: "timetable_headers",
                columns: new[] { "ClassId", "SectionId", "AcademicYear" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_timetable_headers_SectionId",
                table: "timetable_headers",
                column: "SectionId");

            migrationBuilder.CreateIndex(
                name: "IX_timetable_slots_HeaderId_DayOfWeek",
                table: "timetable_slots",
                columns: new[] { "HeaderId", "DayOfWeek" });

            migrationBuilder.CreateIndex(
                name: "IX_timetable_slots_PeriodId",
                table: "timetable_slots",
                column: "PeriodId");

            migrationBuilder.CreateIndex(
                name: "IX_timetable_slots_RoomNo_DayOfWeek_StartTime_EndTime",
                table: "timetable_slots",
                columns: new[] { "RoomNo", "DayOfWeek", "StartTime", "EndTime" });

            migrationBuilder.CreateIndex(
                name: "IX_timetable_slots_SubjectId",
                table: "timetable_slots",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_timetable_slots_TeacherId_DayOfWeek_StartTime_EndTime",
                table: "timetable_slots",
                columns: new[] { "TeacherId", "DayOfWeek", "StartTime", "EndTime" });

            migrationBuilder.AddForeignKey(
                name: "FK_student_transport_assignments_transport_pickup_points_Pickup~",
                table: "student_transport_assignments",
                column: "PickupPointId",
                principalTable: "transport_pickup_points",
                principalColumn: "PickupPointId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_student_transport_assignments_transport_routes_RouteId",
                table: "student_transport_assignments",
                column: "RouteId",
                principalTable: "transport_routes",
                principalColumn: "RouteId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_student_transport_assignments_transport_vehicle_assignments_~",
                table: "student_transport_assignments",
                column: "VehicleAssignmentId",
                principalTable: "transport_vehicle_assignments",
                principalColumn: "AssignmentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_drivers_transport_vehicles_AssignedVehicleId",
                table: "transport_drivers",
                column: "AssignedVehicleId",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_transport_drivers_DriverId",
                table: "transport_vehicle_assignments",
                column: "DriverId",
                principalTable: "transport_drivers",
                principalColumn: "DriverId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_transport_routes_RouteId",
                table: "transport_vehicle_assignments",
                column: "RouteId",
                principalTable: "transport_routes",
                principalColumn: "RouteId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_assignments_transport_vehicles_VehicleId",
                table: "transport_vehicle_assignments",
                column: "VehicleId",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_student_transport_assignments_transport_pickup_points_Pickup~",
                table: "student_transport_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_student_transport_assignments_transport_routes_RouteId",
                table: "student_transport_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_student_transport_assignments_transport_vehicle_assignments_~",
                table: "student_transport_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_drivers_transport_vehicles_AssignedVehicleId",
                table: "transport_drivers");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_transport_drivers_DriverId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_transport_routes_RouteId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_assignments_transport_vehicles_VehicleId",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropTable(
                name: "Circulars");

            migrationBuilder.DropTable(
                name: "ExamInvigilatorAssignments");

            migrationBuilder.DropTable(
                name: "ExamMarks");

            migrationBuilder.DropTable(
                name: "ExamResults");

            migrationBuilder.DropTable(
                name: "GradeConfigurations");

            migrationBuilder.DropTable(
                name: "HolidayCalendars");

            migrationBuilder.DropTable(
                name: "HomeworkSubmissions");

            migrationBuilder.DropTable(
                name: "hostel_attendances");

            migrationBuilder.DropTable(
                name: "hostel_wardens");

            migrationBuilder.DropTable(
                name: "LeaveApplications");

            migrationBuilder.DropTable(
                name: "Meetings");

            migrationBuilder.DropTable(
                name: "PayrollConfigs");

            migrationBuilder.DropTable(
                name: "Payslips");

            migrationBuilder.DropTable(
                name: "QuestionPapers");

            migrationBuilder.DropTable(
                name: "SalaryComponents");

            migrationBuilder.DropTable(
                name: "SalaryStructureItems");

            migrationBuilder.DropTable(
                name: "SchoolEvents");

            migrationBuilder.DropTable(
                name: "StaffAttendances");

            migrationBuilder.DropTable(
                name: "StaffDocuments");

            migrationBuilder.DropTable(
                name: "teacher_subject_assignments");

            migrationBuilder.DropTable(
                name: "timetable_slots");

            migrationBuilder.DropTable(
                name: "ExamSchedules");

            migrationBuilder.DropTable(
                name: "Homeworks");

            migrationBuilder.DropTable(
                name: "student_bed_allocations");

            migrationBuilder.DropTable(
                name: "LeaveTypeConfigs");

            migrationBuilder.DropTable(
                name: "SalaryStructures");

            migrationBuilder.DropTable(
                name: "period_settings");

            migrationBuilder.DropTable(
                name: "timetable_headers");

            migrationBuilder.DropTable(
                name: "room_masters");

            migrationBuilder.DropTable(
                name: "hostel_blocks");

            migrationBuilder.DropTable(
                name: "room_type_configs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_transport_vehicle_assignments",
                table: "transport_vehicle_assignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_transport_drivers",
                table: "transport_drivers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_student_transport_assignments",
                table: "student_transport_assignments");

            migrationBuilder.DropColumn(
                name: "AccountHolderName",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "AccountNumber",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "BankName",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "BranchName",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "EmployeeCategory",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "IfscCode",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "JoiningDate",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "PrimarySubject",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "Qualification",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "ResidentialAddress",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "Specialization",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "SystemRole",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "UpiId",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "AllocatedBedId",
                table: "AdmissionApplications");

            migrationBuilder.DropColumn(
                name: "StudentType",
                table: "AdmissionApplications");

            migrationBuilder.RenameTable(
                name: "transport_vehicle_assignments",
                newName: "TransportVehicleAssignments");

            migrationBuilder.RenameTable(
                name: "transport_drivers",
                newName: "TransportDrivers");

            migrationBuilder.RenameTable(
                name: "student_transport_assignments",
                newName: "StudentTransportAssignments");

            migrationBuilder.RenameColumn(
                name: "Status",
                table: "transport_routes",
                newName: "status");

            migrationBuilder.RenameColumn(
                name: "Description",
                table: "transport_routes",
                newName: "description");

            migrationBuilder.RenameColumn(
                name: "UpdatedBy",
                table: "transport_routes",
                newName: "updated_by");

            migrationBuilder.RenameColumn(
                name: "UpdatedAt",
                table: "transport_routes",
                newName: "updated_at");

            migrationBuilder.RenameColumn(
                name: "StartLocation",
                table: "transport_routes",
                newName: "start_location");

            migrationBuilder.RenameColumn(
                name: "RouteName",
                table: "transport_routes",
                newName: "route_name");

            migrationBuilder.RenameColumn(
                name: "RouteCode",
                table: "transport_routes",
                newName: "route_code");

            migrationBuilder.RenameColumn(
                name: "IsDeleted",
                table: "transport_routes",
                newName: "is_deleted");

            migrationBuilder.RenameColumn(
                name: "EstimatedDurationMinutes",
                table: "transport_routes",
                newName: "estimated_duration_minutes");

            migrationBuilder.RenameColumn(
                name: "EndLocation",
                table: "transport_routes",
                newName: "end_location");

            migrationBuilder.RenameColumn(
                name: "DistanceKm",
                table: "transport_routes",
                newName: "distance_km");

            migrationBuilder.RenameColumn(
                name: "CreatedBy",
                table: "transport_routes",
                newName: "created_by");

            migrationBuilder.RenameColumn(
                name: "CreatedAt",
                table: "transport_routes",
                newName: "created_at");

            migrationBuilder.RenameColumn(
                name: "RouteId",
                table: "transport_routes",
                newName: "route_id");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_VehicleId",
                table: "TransportVehicleAssignments",
                newName: "IX_TransportVehicleAssignments_VehicleId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_RouteId_VehicleId_DriverId_Eff~",
                table: "TransportVehicleAssignments",
                newName: "IX_TransportVehicleAssignments_RouteId_VehicleId_DriverId_Effec~");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_RouteId",
                table: "TransportVehicleAssignments",
                newName: "IX_TransportVehicleAssignments_RouteId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_vehicle_assignments_DriverId",
                table: "TransportVehicleAssignments",
                newName: "IX_TransportVehicleAssignments_DriverId");

            migrationBuilder.RenameIndex(
                name: "IX_transport_drivers_MobileNumber",
                table: "TransportDrivers",
                newName: "IX_TransportDrivers_MobileNumber");

            migrationBuilder.RenameIndex(
                name: "IX_transport_drivers_LicenceNumber",
                table: "TransportDrivers",
                newName: "IX_TransportDrivers_LicenceNumber");

            migrationBuilder.RenameIndex(
                name: "IX_transport_drivers_AssignedVehicleId",
                table: "TransportDrivers",
                newName: "IX_TransportDrivers_AssignedVehicleId");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_VehicleAssignmentId",
                table: "StudentTransportAssignments",
                newName: "IX_StudentTransportAssignments_VehicleAssignmentId");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_StudentId_EffectiveFrom_Effect~",
                table: "StudentTransportAssignments",
                newName: "IX_StudentTransportAssignments_StudentId_EffectiveFrom_Effectiv~");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_StudentId",
                table: "StudentTransportAssignments",
                newName: "IX_StudentTransportAssignments_StudentId");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_RouteId",
                table: "StudentTransportAssignments",
                newName: "IX_StudentTransportAssignments_RouteId");

            migrationBuilder.RenameIndex(
                name: "IX_student_transport_assignments_PickupPointId",
                table: "StudentTransportAssignments",
                newName: "IX_StudentTransportAssignments_PickupPointId");

            migrationBuilder.UpdateData(
                table: "transport_vehicles",
                keyColumn: "VehicleType",
                keyValue: null,
                column: "VehicleType",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "VehicleType",
                table: "transport_vehicles",
                type: "varchar(50)",
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(50)",
                oldMaxLength: 50,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "transport_vehicles",
                keyColumn: "VehicleName",
                keyValue: null,
                column: "VehicleName",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "VehicleName",
                table: "transport_vehicles",
                type: "varchar(100)",
                maxLength: 100,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(100)",
                oldMaxLength: 100,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AlterColumn<bool>(
                name: "Status",
                table: "transport_vehicles",
                type: "tinyint(1)",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "tinyint(1)",
                oldDefaultValue: true);

            migrationBuilder.AlterColumn<bool>(
                name: "IsDeleted",
                table: "transport_vehicles",
                type: "tinyint(1)",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "tinyint(1)",
                oldDefaultValue: false);

            migrationBuilder.UpdateData(
                table: "transport_routes",
                keyColumn: "start_location",
                keyValue: null,
                column: "start_location",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "start_location",
                table: "transport_routes",
                type: "varchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(150)",
                oldMaxLength: 150,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "transport_routes",
                keyColumn: "end_location",
                keyValue: null,
                column: "end_location",
                value: "");

            migrationBuilder.AlterColumn<string>(
                name: "end_location",
                table: "transport_routes",
                type: "varchar(150)",
                maxLength: 150,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "varchar(150)",
                oldMaxLength: 150,
                oldNullable: true)
                .Annotation("MySql:CharSet", "utf8mb4")
                .OldAnnotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TransportVehicleAssignments",
                table: "TransportVehicleAssignments",
                column: "AssignmentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_TransportDrivers",
                table: "TransportDrivers",
                column: "DriverId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StudentTransportAssignments",
                table: "StudentTransportAssignments",
                column: "StudentTransportAssignmentId");

            migrationBuilder.CreateIndex(
                name: "ix_transport_routes_status_is_deleted",
                table: "transport_routes",
                columns: new[] { "status", "is_deleted" });

            migrationBuilder.CreateIndex(
                name: "ux_transport_routes_route_name",
                table: "transport_routes",
                column: "route_name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_StudentTransportAssignments_TransportVehicleAssignments_Vehi~",
                table: "StudentTransportAssignments",
                column: "VehicleAssignmentId",
                principalTable: "TransportVehicleAssignments",
                principalColumn: "AssignmentId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StudentTransportAssignments_transport_pickup_points_PickupPo~",
                table: "StudentTransportAssignments",
                column: "PickupPointId",
                principalTable: "transport_pickup_points",
                principalColumn: "PickupPointId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_StudentTransportAssignments_transport_routes_RouteId",
                table: "StudentTransportAssignments",
                column: "RouteId",
                principalTable: "transport_routes",
                principalColumn: "route_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TransportDrivers_transport_vehicles_AssignedVehicleId",
                table: "TransportDrivers",
                column: "AssignedVehicleId",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId");

            migrationBuilder.AddForeignKey(
                name: "FK_TransportVehicleAssignments_TransportDrivers_DriverId",
                table: "TransportVehicleAssignments",
                column: "DriverId",
                principalTable: "TransportDrivers",
                principalColumn: "DriverId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TransportVehicleAssignments_transport_routes_RouteId",
                table: "TransportVehicleAssignments",
                column: "RouteId",
                principalTable: "transport_routes",
                principalColumn: "route_id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_TransportVehicleAssignments_transport_vehicles_VehicleId",
                table: "TransportVehicleAssignments",
                column: "VehicleId",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
