using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTeacherUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_admissionapplications_Classes_AppliedClassId",
                table: "admissionapplications");

            migrationBuilder.DropForeignKey(
                name: "FK_class_sections_Classes_AcademicClassId",
                table: "class_sections");

            migrationBuilder.DropForeignKey(
                name: "FK_class_sections_Staff_ClassTeacherId",
                table: "class_sections");

            migrationBuilder.DropForeignKey(
                name: "FK_ClassCurriculumSubjects_Classes_ClassGradeClassId",
                table: "ClassCurriculumSubjects");

            migrationBuilder.DropForeignKey(
                name: "FK_ClassCurriculumSubjects_subjects_SubjectId",
                table: "ClassCurriculumSubjects");

            migrationBuilder.DropForeignKey(
                name: "FK_exam_classes_Classes_class_id",
                table: "exam_classes");

            migrationBuilder.DropForeignKey(
                name: "FK_ExamInvigilatorAssignments_ExamSchedules_ScheduleId",
                table: "ExamInvigilatorAssignments");

            migrationBuilder.DropForeignKey(
                name: "FK_HomeworkSubmissions_Homeworks_HomeworkId",
                table: "HomeworkSubmissions");

            migrationBuilder.DropForeignKey(
                name: "FK_hostel_wardens_Staff_StaffId",
                table: "hostel_wardens");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveApplications_LeaveTypeConfigs_LeaveTypeId",
                table: "LeaveApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_LeaveApplications_Staff_StaffId",
                table: "LeaveApplications");

            migrationBuilder.DropForeignKey(
                name: "FK_OtpVerifications_Users_UserId",
                table: "OtpVerifications");

            migrationBuilder.DropForeignKey(
                name: "FK_SalaryStructureItems_SalaryStructures_StructureId",
                table: "SalaryStructureItems");

            migrationBuilder.DropForeignKey(
                name: "FK_Section_Staff_ClassTeacherId",
                table: "Section");

            migrationBuilder.DropForeignKey(
                name: "FK_StaffAttendances_Staff_StaffId",
                table: "StaffAttendances");

            migrationBuilder.DropForeignKey(
                name: "FK_StaffDocuments_Staff_StaffId",
                table: "StaffDocuments");

            migrationBuilder.DropForeignKey(
                name: "FK_student_bed_allocations_admissionapplications_StudentId",
                table: "student_bed_allocations");

            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subject_assignments_Classes_ClassId",
                table: "teacher_subject_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subject_assignments_Staff_StaffId",
                table: "teacher_subject_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_timetable_headers_Classes_ClassId",
                table: "timetable_headers");

            migrationBuilder.DropForeignKey(
                name: "FK_timetable_slots_Staff_TeacherId",
                table: "timetable_slots");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_maintenance_transport_vehicles_vehicle_id",
                table: "transport_vehicle_maintenance");

            migrationBuilder.DropTable(
                name: "UserRoles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Users",
                table: "Users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Staff",
                table: "Staff");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Roles",
                table: "Roles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Payslips",
                table: "Payslips");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Meetings",
                table: "Meetings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Homeworks",
                table: "Homeworks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Classes",
                table: "Classes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Circulars",
                table: "Circulars");

            migrationBuilder.DropPrimaryKey(
                name: "PK_Branches",
                table: "Branches");

            migrationBuilder.DropPrimaryKey(
                name: "PK_transport_vehicle_maintenance",
                table: "transport_vehicle_maintenance");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StaffDocuments",
                table: "StaffDocuments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_StaffAttendances",
                table: "StaffAttendances");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SchoolEvents",
                table: "SchoolEvents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SalaryStructures",
                table: "SalaryStructures");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SalaryStructureItems",
                table: "SalaryStructureItems");

            migrationBuilder.DropPrimaryKey(
                name: "PK_SalaryComponents",
                table: "SalaryComponents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_QuestionPapers",
                table: "QuestionPapers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_PayrollConfigs",
                table: "PayrollConfigs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_OtpVerifications",
                table: "OtpVerifications");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LeaveTypeConfigs",
                table: "LeaveTypeConfigs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_LeaveApplications",
                table: "LeaveApplications");

            migrationBuilder.DropPrimaryKey(
                name: "PK_HomeworkSubmissions",
                table: "HomeworkSubmissions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_HolidayCalendars",
                table: "HolidayCalendars");

            migrationBuilder.DropPrimaryKey(
                name: "PK_GradeConfigurations",
                table: "GradeConfigurations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ExamSchedules",
                table: "ExamSchedules");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ExamResults",
                table: "ExamResults");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ExamMarks",
                table: "ExamMarks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ExamInvigilatorAssignments",
                table: "ExamInvigilatorAssignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_ClassCurriculumSubjects",
                table: "ClassCurriculumSubjects");

            migrationBuilder.DropPrimaryKey(
                name: "PK_admissions",
                table: "admissions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_admissionapplications",
                table: "admissionapplications");

            migrationBuilder.RenameTable(
                name: "Users",
                newName: "users");

            migrationBuilder.RenameTable(
                name: "Staff",
                newName: "staff");

            migrationBuilder.RenameTable(
                name: "Roles",
                newName: "roles");

            migrationBuilder.RenameTable(
                name: "Payslips",
                newName: "payslips");

            migrationBuilder.RenameTable(
                name: "Meetings",
                newName: "meetings");

            migrationBuilder.RenameTable(
                name: "Homeworks",
                newName: "homeworks");

            migrationBuilder.RenameTable(
                name: "Classes",
                newName: "classes");

            migrationBuilder.RenameTable(
                name: "Circulars",
                newName: "circulars");

            migrationBuilder.RenameTable(
                name: "Branches",
                newName: "branches");

            migrationBuilder.RenameTable(
                name: "transport_vehicle_maintenance",
                newName: "transport_vehicle_maintenances");

            migrationBuilder.RenameTable(
                name: "StaffDocuments",
                newName: "staff_documents");

            migrationBuilder.RenameTable(
                name: "StaffAttendances",
                newName: "staff_attendances");

            migrationBuilder.RenameTable(
                name: "SchoolEvents",
                newName: "school_events");

            migrationBuilder.RenameTable(
                name: "SalaryStructures",
                newName: "salary_structures");

            migrationBuilder.RenameTable(
                name: "SalaryStructureItems",
                newName: "salary_structure_items");

            migrationBuilder.RenameTable(
                name: "SalaryComponents",
                newName: "salary_components");

            migrationBuilder.RenameTable(
                name: "QuestionPapers",
                newName: "question_papers");

            migrationBuilder.RenameTable(
                name: "PayrollConfigs",
                newName: "payroll_configs");

            migrationBuilder.RenameTable(
                name: "OtpVerifications",
                newName: "otp_verifications");

            migrationBuilder.RenameTable(
                name: "LeaveTypeConfigs",
                newName: "leave_type_configs");

            migrationBuilder.RenameTable(
                name: "LeaveApplications",
                newName: "leave_applications");

            migrationBuilder.RenameTable(
                name: "HomeworkSubmissions",
                newName: "homework_submissions");

            migrationBuilder.RenameTable(
                name: "HolidayCalendars",
                newName: "holiday_calendars");

            migrationBuilder.RenameTable(
                name: "GradeConfigurations",
                newName: "grade_configurations");

            migrationBuilder.RenameTable(
                name: "ExamSchedules",
                newName: "exam_schedules");

            migrationBuilder.RenameTable(
                name: "ExamResults",
                newName: "exam_results");

            migrationBuilder.RenameTable(
                name: "ExamMarks",
                newName: "exam_marks");

            migrationBuilder.RenameTable(
                name: "ExamInvigilatorAssignments",
                newName: "exam_invigilator_assignments");

            migrationBuilder.RenameTable(
                name: "ClassCurriculumSubjects",
                newName: "class_curriculum_subjects");

            migrationBuilder.RenameTable(
                name: "admissions",
                newName: "students");

            migrationBuilder.RenameTable(
                name: "admissionapplications",
                newName: "admission_applications");

            migrationBuilder.RenameIndex(
                name: "IX_Users_MobileNumber",
                table: "users",
                newName: "IX_users_MobileNumber");

            migrationBuilder.RenameIndex(
                name: "IX_StaffDocuments_StaffId",
                table: "staff_documents",
                newName: "IX_staff_documents_StaffId");

            migrationBuilder.RenameIndex(
                name: "IX_StaffAttendances_StaffId",
                table: "staff_attendances",
                newName: "IX_staff_attendances_StaffId");

            migrationBuilder.RenameIndex(
                name: "IX_SalaryStructureItems_StructureId",
                table: "salary_structure_items",
                newName: "IX_salary_structure_items_StructureId");

            migrationBuilder.RenameIndex(
                name: "IX_OtpVerifications_UserId",
                table: "otp_verifications",
                newName: "IX_otp_verifications_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_LeaveApplications_StaffId",
                table: "leave_applications",
                newName: "IX_leave_applications_StaffId");

            migrationBuilder.RenameIndex(
                name: "IX_LeaveApplications_LeaveTypeId",
                table: "leave_applications",
                newName: "IX_leave_applications_LeaveTypeId");

            migrationBuilder.RenameIndex(
                name: "IX_HomeworkSubmissions_HomeworkId",
                table: "homework_submissions",
                newName: "IX_homework_submissions_HomeworkId");

            migrationBuilder.RenameIndex(
                name: "IX_ExamInvigilatorAssignments_ScheduleId",
                table: "exam_invigilator_assignments",
                newName: "IX_exam_invigilator_assignments_ScheduleId");

            migrationBuilder.RenameIndex(
                name: "IX_ClassCurriculumSubjects_SubjectId",
                table: "class_curriculum_subjects",
                newName: "IX_class_curriculum_subjects_SubjectId");

            migrationBuilder.RenameIndex(
                name: "IX_ClassCurriculumSubjects_ClassGradeClassId",
                table: "class_curriculum_subjects",
                newName: "IX_class_curriculum_subjects_ClassGradeClassId");

            migrationBuilder.RenameIndex(
                name: "IX_admissionapplications_AppliedClassId",
                table: "admission_applications",
                newName: "IX_admission_applications_AppliedClassId");

            migrationBuilder.AddColumn<int>(
                name: "SchoolId",
                table: "users",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InTime",
                table: "staff_attendances",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "OutTime",
                table: "staff_attendances",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddPrimaryKey(
                name: "PK_users",
                table: "users",
                column: "UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_staff",
                table: "staff",
                column: "StaffId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_roles",
                table: "roles",
                column: "RoleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_payslips",
                table: "payslips",
                column: "PayslipId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_meetings",
                table: "meetings",
                column: "MeetingId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_homeworks",
                table: "homeworks",
                column: "HomeworkId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_classes",
                table: "classes",
                column: "ClassId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_circulars",
                table: "circulars",
                column: "CircularId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_branches",
                table: "branches",
                column: "BranchId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transport_vehicle_maintenances",
                table: "transport_vehicle_maintenances",
                column: "maintenance_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_staff_documents",
                table: "staff_documents",
                column: "StaffDocumentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_staff_attendances",
                table: "staff_attendances",
                column: "StaffAttendanceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_school_events",
                table: "school_events",
                column: "EventId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_salary_structures",
                table: "salary_structures",
                column: "StructureId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_salary_structure_items",
                table: "salary_structure_items",
                column: "ItemId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_salary_components",
                table: "salary_components",
                column: "ComponentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_question_papers",
                table: "question_papers",
                column: "QuestionPaperId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_payroll_configs",
                table: "payroll_configs",
                column: "PayrollConfigId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_otp_verifications",
                table: "otp_verifications",
                column: "OtpId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_leave_type_configs",
                table: "leave_type_configs",
                column: "LeaveTypeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_leave_applications",
                table: "leave_applications",
                column: "LeaveApplicationId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_homework_submissions",
                table: "homework_submissions",
                column: "SubmissionId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_holiday_calendars",
                table: "holiday_calendars",
                column: "HolidayId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_grade_configurations",
                table: "grade_configurations",
                column: "GradeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_exam_schedules",
                table: "exam_schedules",
                column: "ScheduleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_exam_results",
                table: "exam_results",
                column: "ResultId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_exam_marks",
                table: "exam_marks",
                column: "MarkId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_exam_invigilator_assignments",
                table: "exam_invigilator_assignments",
                column: "AssignmentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_class_curriculum_subjects",
                table: "class_curriculum_subjects",
                columns: new[] { "ClassId", "SubjectId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_students",
                table: "students",
                column: "admission_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_admission_applications",
                table: "admission_applications",
                column: "Id");

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    AuditLogId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    UserName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UserRole = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Action = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Details = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IpAddress = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Timestamp = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    SchoolId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_audit_logs", x => x.AuditLogId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "schools",
                columns: table => new
                {
                    SchoolId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    SchoolName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    SchoolCode = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Address = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Phone = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Email = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Website = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    PrincipalName = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Status = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_schools", x => x.SchoolId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "system_notifications",
                columns: table => new
                {
                    NotificationId = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    Title = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Message = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Type = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IsRead = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    SchoolId = table.Column<int>(type: "int", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_system_notifications", x => x.NotificationId);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "user_roles",
                columns: table => new
                {
                    RoleId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_user_roles", x => new { x.RoleId, x.UserId });
                    table.ForeignKey(
                        name: "FK_user_roles_roles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "roles",
                        principalColumn: "RoleId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_user_roles_users_UserId",
                        column: x => x.UserId,
                        principalTable: "users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_users_SchoolId",
                table: "users",
                column: "SchoolId");

            migrationBuilder.CreateIndex(
                name: "IX_user_roles_UserId",
                table: "user_roles",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_admission_applications_classes_AppliedClassId",
                table: "admission_applications",
                column: "AppliedClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_class_curriculum_subjects_classes_ClassGradeClassId",
                table: "class_curriculum_subjects",
                column: "ClassGradeClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_class_curriculum_subjects_subjects_SubjectId",
                table: "class_curriculum_subjects",
                column: "SubjectId",
                principalTable: "subjects",
                principalColumn: "SubjectId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_class_sections_classes_AcademicClassId",
                table: "class_sections",
                column: "AcademicClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_class_sections_staff_ClassTeacherId",
                table: "class_sections",
                column: "ClassTeacherId",
                principalTable: "staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_exam_classes_classes_class_id",
                table: "exam_classes",
                column: "class_id",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_exam_invigilator_assignments_exam_schedules_ScheduleId",
                table: "exam_invigilator_assignments",
                column: "ScheduleId",
                principalTable: "exam_schedules",
                principalColumn: "ScheduleId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_homework_submissions_homeworks_HomeworkId",
                table: "homework_submissions",
                column: "HomeworkId",
                principalTable: "homeworks",
                principalColumn: "HomeworkId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_hostel_wardens_staff_StaffId",
                table: "hostel_wardens",
                column: "StaffId",
                principalTable: "staff",
                principalColumn: "StaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_leave_applications_leave_type_configs_LeaveTypeId",
                table: "leave_applications",
                column: "LeaveTypeId",
                principalTable: "leave_type_configs",
                principalColumn: "LeaveTypeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_leave_applications_staff_StaffId",
                table: "leave_applications",
                column: "StaffId",
                principalTable: "staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_otp_verifications_users_UserId",
                table: "otp_verifications",
                column: "UserId",
                principalTable: "users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_salary_structure_items_salary_structures_StructureId",
                table: "salary_structure_items",
                column: "StructureId",
                principalTable: "salary_structures",
                principalColumn: "StructureId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Section_staff_ClassTeacherId",
                table: "Section",
                column: "ClassTeacherId",
                principalTable: "staff",
                principalColumn: "StaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_staff_attendances_staff_StaffId",
                table: "staff_attendances",
                column: "StaffId",
                principalTable: "staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_staff_documents_staff_StaffId",
                table: "staff_documents",
                column: "StaffId",
                principalTable: "staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_student_bed_allocations_admission_applications_StudentId",
                table: "student_bed_allocations",
                column: "StudentId",
                principalTable: "admission_applications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subject_assignments_classes_ClassId",
                table: "teacher_subject_assignments",
                column: "ClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subject_assignments_staff_StaffId",
                table: "teacher_subject_assignments",
                column: "StaffId",
                principalTable: "staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_timetable_headers_classes_ClassId",
                table: "timetable_headers",
                column: "ClassId",
                principalTable: "classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_timetable_slots_staff_TeacherId",
                table: "timetable_slots",
                column: "TeacherId",
                principalTable: "staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_maintenances_transport_vehicles_vehicle_id",
                table: "transport_vehicle_maintenances",
                column: "vehicle_id",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_users_schools_SchoolId",
                table: "users",
                column: "SchoolId",
                principalTable: "schools",
                principalColumn: "SchoolId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_admission_applications_classes_AppliedClassId",
                table: "admission_applications");

            migrationBuilder.DropForeignKey(
                name: "FK_class_curriculum_subjects_classes_ClassGradeClassId",
                table: "class_curriculum_subjects");

            migrationBuilder.DropForeignKey(
                name: "FK_class_curriculum_subjects_subjects_SubjectId",
                table: "class_curriculum_subjects");

            migrationBuilder.DropForeignKey(
                name: "FK_class_sections_classes_AcademicClassId",
                table: "class_sections");

            migrationBuilder.DropForeignKey(
                name: "FK_class_sections_staff_ClassTeacherId",
                table: "class_sections");

            migrationBuilder.DropForeignKey(
                name: "FK_exam_classes_classes_class_id",
                table: "exam_classes");

            migrationBuilder.DropForeignKey(
                name: "FK_exam_invigilator_assignments_exam_schedules_ScheduleId",
                table: "exam_invigilator_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_homework_submissions_homeworks_HomeworkId",
                table: "homework_submissions");

            migrationBuilder.DropForeignKey(
                name: "FK_hostel_wardens_staff_StaffId",
                table: "hostel_wardens");

            migrationBuilder.DropForeignKey(
                name: "FK_leave_applications_leave_type_configs_LeaveTypeId",
                table: "leave_applications");

            migrationBuilder.DropForeignKey(
                name: "FK_leave_applications_staff_StaffId",
                table: "leave_applications");

            migrationBuilder.DropForeignKey(
                name: "FK_otp_verifications_users_UserId",
                table: "otp_verifications");

            migrationBuilder.DropForeignKey(
                name: "FK_salary_structure_items_salary_structures_StructureId",
                table: "salary_structure_items");

            migrationBuilder.DropForeignKey(
                name: "FK_Section_staff_ClassTeacherId",
                table: "Section");

            migrationBuilder.DropForeignKey(
                name: "FK_staff_attendances_staff_StaffId",
                table: "staff_attendances");

            migrationBuilder.DropForeignKey(
                name: "FK_staff_documents_staff_StaffId",
                table: "staff_documents");

            migrationBuilder.DropForeignKey(
                name: "FK_student_bed_allocations_admission_applications_StudentId",
                table: "student_bed_allocations");

            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subject_assignments_classes_ClassId",
                table: "teacher_subject_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_teacher_subject_assignments_staff_StaffId",
                table: "teacher_subject_assignments");

            migrationBuilder.DropForeignKey(
                name: "FK_timetable_headers_classes_ClassId",
                table: "timetable_headers");

            migrationBuilder.DropForeignKey(
                name: "FK_timetable_slots_staff_TeacherId",
                table: "timetable_slots");

            migrationBuilder.DropForeignKey(
                name: "FK_transport_vehicle_maintenances_transport_vehicles_vehicle_id",
                table: "transport_vehicle_maintenances");

            migrationBuilder.DropForeignKey(
                name: "FK_users_schools_SchoolId",
                table: "users");

            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "schools");

            migrationBuilder.DropTable(
                name: "system_notifications");

            migrationBuilder.DropTable(
                name: "user_roles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_users",
                table: "users");

            migrationBuilder.DropIndex(
                name: "IX_users_SchoolId",
                table: "users");

            migrationBuilder.DropPrimaryKey(
                name: "PK_staff",
                table: "staff");

            migrationBuilder.DropPrimaryKey(
                name: "PK_roles",
                table: "roles");

            migrationBuilder.DropPrimaryKey(
                name: "PK_payslips",
                table: "payslips");

            migrationBuilder.DropPrimaryKey(
                name: "PK_meetings",
                table: "meetings");

            migrationBuilder.DropPrimaryKey(
                name: "PK_homeworks",
                table: "homeworks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_classes",
                table: "classes");

            migrationBuilder.DropPrimaryKey(
                name: "PK_circulars",
                table: "circulars");

            migrationBuilder.DropPrimaryKey(
                name: "PK_branches",
                table: "branches");

            migrationBuilder.DropPrimaryKey(
                name: "PK_transport_vehicle_maintenances",
                table: "transport_vehicle_maintenances");

            migrationBuilder.DropPrimaryKey(
                name: "PK_students",
                table: "students");

            migrationBuilder.DropPrimaryKey(
                name: "PK_staff_documents",
                table: "staff_documents");

            migrationBuilder.DropPrimaryKey(
                name: "PK_staff_attendances",
                table: "staff_attendances");

            migrationBuilder.DropPrimaryKey(
                name: "PK_school_events",
                table: "school_events");

            migrationBuilder.DropPrimaryKey(
                name: "PK_salary_structures",
                table: "salary_structures");

            migrationBuilder.DropPrimaryKey(
                name: "PK_salary_structure_items",
                table: "salary_structure_items");

            migrationBuilder.DropPrimaryKey(
                name: "PK_salary_components",
                table: "salary_components");

            migrationBuilder.DropPrimaryKey(
                name: "PK_question_papers",
                table: "question_papers");

            migrationBuilder.DropPrimaryKey(
                name: "PK_payroll_configs",
                table: "payroll_configs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_otp_verifications",
                table: "otp_verifications");

            migrationBuilder.DropPrimaryKey(
                name: "PK_leave_type_configs",
                table: "leave_type_configs");

            migrationBuilder.DropPrimaryKey(
                name: "PK_leave_applications",
                table: "leave_applications");

            migrationBuilder.DropPrimaryKey(
                name: "PK_homework_submissions",
                table: "homework_submissions");

            migrationBuilder.DropPrimaryKey(
                name: "PK_holiday_calendars",
                table: "holiday_calendars");

            migrationBuilder.DropPrimaryKey(
                name: "PK_grade_configurations",
                table: "grade_configurations");

            migrationBuilder.DropPrimaryKey(
                name: "PK_exam_schedules",
                table: "exam_schedules");

            migrationBuilder.DropPrimaryKey(
                name: "PK_exam_results",
                table: "exam_results");

            migrationBuilder.DropPrimaryKey(
                name: "PK_exam_marks",
                table: "exam_marks");

            migrationBuilder.DropPrimaryKey(
                name: "PK_exam_invigilator_assignments",
                table: "exam_invigilator_assignments");

            migrationBuilder.DropPrimaryKey(
                name: "PK_class_curriculum_subjects",
                table: "class_curriculum_subjects");

            migrationBuilder.DropPrimaryKey(
                name: "PK_admission_applications",
                table: "admission_applications");

            migrationBuilder.DropColumn(
                name: "SchoolId",
                table: "users");

            migrationBuilder.DropColumn(
                name: "InTime",
                table: "staff_attendances");

            migrationBuilder.DropColumn(
                name: "OutTime",
                table: "staff_attendances");

            migrationBuilder.RenameTable(
                name: "users",
                newName: "Users");

            migrationBuilder.RenameTable(
                name: "staff",
                newName: "Staff");

            migrationBuilder.RenameTable(
                name: "roles",
                newName: "Roles");

            migrationBuilder.RenameTable(
                name: "payslips",
                newName: "Payslips");

            migrationBuilder.RenameTable(
                name: "meetings",
                newName: "Meetings");

            migrationBuilder.RenameTable(
                name: "homeworks",
                newName: "Homeworks");

            migrationBuilder.RenameTable(
                name: "classes",
                newName: "Classes");

            migrationBuilder.RenameTable(
                name: "circulars",
                newName: "Circulars");

            migrationBuilder.RenameTable(
                name: "branches",
                newName: "Branches");

            migrationBuilder.RenameTable(
                name: "transport_vehicle_maintenances",
                newName: "transport_vehicle_maintenance");

            migrationBuilder.RenameTable(
                name: "students",
                newName: "admissions");

            migrationBuilder.RenameTable(
                name: "staff_documents",
                newName: "StaffDocuments");

            migrationBuilder.RenameTable(
                name: "staff_attendances",
                newName: "StaffAttendances");

            migrationBuilder.RenameTable(
                name: "school_events",
                newName: "SchoolEvents");

            migrationBuilder.RenameTable(
                name: "salary_structures",
                newName: "SalaryStructures");

            migrationBuilder.RenameTable(
                name: "salary_structure_items",
                newName: "SalaryStructureItems");

            migrationBuilder.RenameTable(
                name: "salary_components",
                newName: "SalaryComponents");

            migrationBuilder.RenameTable(
                name: "question_papers",
                newName: "QuestionPapers");

            migrationBuilder.RenameTable(
                name: "payroll_configs",
                newName: "PayrollConfigs");

            migrationBuilder.RenameTable(
                name: "otp_verifications",
                newName: "OtpVerifications");

            migrationBuilder.RenameTable(
                name: "leave_type_configs",
                newName: "LeaveTypeConfigs");

            migrationBuilder.RenameTable(
                name: "leave_applications",
                newName: "LeaveApplications");

            migrationBuilder.RenameTable(
                name: "homework_submissions",
                newName: "HomeworkSubmissions");

            migrationBuilder.RenameTable(
                name: "holiday_calendars",
                newName: "HolidayCalendars");

            migrationBuilder.RenameTable(
                name: "grade_configurations",
                newName: "GradeConfigurations");

            migrationBuilder.RenameTable(
                name: "exam_schedules",
                newName: "ExamSchedules");

            migrationBuilder.RenameTable(
                name: "exam_results",
                newName: "ExamResults");

            migrationBuilder.RenameTable(
                name: "exam_marks",
                newName: "ExamMarks");

            migrationBuilder.RenameTable(
                name: "exam_invigilator_assignments",
                newName: "ExamInvigilatorAssignments");

            migrationBuilder.RenameTable(
                name: "class_curriculum_subjects",
                newName: "ClassCurriculumSubjects");

            migrationBuilder.RenameTable(
                name: "admission_applications",
                newName: "admissionapplications");

            migrationBuilder.RenameIndex(
                name: "IX_users_MobileNumber",
                table: "Users",
                newName: "IX_Users_MobileNumber");

            migrationBuilder.RenameIndex(
                name: "IX_staff_documents_StaffId",
                table: "StaffDocuments",
                newName: "IX_StaffDocuments_StaffId");

            migrationBuilder.RenameIndex(
                name: "IX_staff_attendances_StaffId",
                table: "StaffAttendances",
                newName: "IX_StaffAttendances_StaffId");

            migrationBuilder.RenameIndex(
                name: "IX_salary_structure_items_StructureId",
                table: "SalaryStructureItems",
                newName: "IX_SalaryStructureItems_StructureId");

            migrationBuilder.RenameIndex(
                name: "IX_otp_verifications_UserId",
                table: "OtpVerifications",
                newName: "IX_OtpVerifications_UserId");

            migrationBuilder.RenameIndex(
                name: "IX_leave_applications_StaffId",
                table: "LeaveApplications",
                newName: "IX_LeaveApplications_StaffId");

            migrationBuilder.RenameIndex(
                name: "IX_leave_applications_LeaveTypeId",
                table: "LeaveApplications",
                newName: "IX_LeaveApplications_LeaveTypeId");

            migrationBuilder.RenameIndex(
                name: "IX_homework_submissions_HomeworkId",
                table: "HomeworkSubmissions",
                newName: "IX_HomeworkSubmissions_HomeworkId");

            migrationBuilder.RenameIndex(
                name: "IX_exam_invigilator_assignments_ScheduleId",
                table: "ExamInvigilatorAssignments",
                newName: "IX_ExamInvigilatorAssignments_ScheduleId");

            migrationBuilder.RenameIndex(
                name: "IX_class_curriculum_subjects_SubjectId",
                table: "ClassCurriculumSubjects",
                newName: "IX_ClassCurriculumSubjects_SubjectId");

            migrationBuilder.RenameIndex(
                name: "IX_class_curriculum_subjects_ClassGradeClassId",
                table: "ClassCurriculumSubjects",
                newName: "IX_ClassCurriculumSubjects_ClassGradeClassId");

            migrationBuilder.RenameIndex(
                name: "IX_admission_applications_AppliedClassId",
                table: "admissionapplications",
                newName: "IX_admissionapplications_AppliedClassId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Users",
                table: "Users",
                column: "UserId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Staff",
                table: "Staff",
                column: "StaffId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Roles",
                table: "Roles",
                column: "RoleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Payslips",
                table: "Payslips",
                column: "PayslipId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Meetings",
                table: "Meetings",
                column: "MeetingId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Homeworks",
                table: "Homeworks",
                column: "HomeworkId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Classes",
                table: "Classes",
                column: "ClassId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Circulars",
                table: "Circulars",
                column: "CircularId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_Branches",
                table: "Branches",
                column: "BranchId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_transport_vehicle_maintenance",
                table: "transport_vehicle_maintenance",
                column: "maintenance_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_admissions",
                table: "admissions",
                column: "admission_id");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StaffDocuments",
                table: "StaffDocuments",
                column: "StaffDocumentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_StaffAttendances",
                table: "StaffAttendances",
                column: "StaffAttendanceId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SchoolEvents",
                table: "SchoolEvents",
                column: "EventId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SalaryStructures",
                table: "SalaryStructures",
                column: "StructureId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SalaryStructureItems",
                table: "SalaryStructureItems",
                column: "ItemId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_SalaryComponents",
                table: "SalaryComponents",
                column: "ComponentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_QuestionPapers",
                table: "QuestionPapers",
                column: "QuestionPaperId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_PayrollConfigs",
                table: "PayrollConfigs",
                column: "PayrollConfigId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_OtpVerifications",
                table: "OtpVerifications",
                column: "OtpId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LeaveTypeConfigs",
                table: "LeaveTypeConfigs",
                column: "LeaveTypeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_LeaveApplications",
                table: "LeaveApplications",
                column: "LeaveApplicationId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_HomeworkSubmissions",
                table: "HomeworkSubmissions",
                column: "SubmissionId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_HolidayCalendars",
                table: "HolidayCalendars",
                column: "HolidayId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_GradeConfigurations",
                table: "GradeConfigurations",
                column: "GradeId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ExamSchedules",
                table: "ExamSchedules",
                column: "ScheduleId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ExamResults",
                table: "ExamResults",
                column: "ResultId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ExamMarks",
                table: "ExamMarks",
                column: "MarkId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ExamInvigilatorAssignments",
                table: "ExamInvigilatorAssignments",
                column: "AssignmentId");

            migrationBuilder.AddPrimaryKey(
                name: "PK_ClassCurriculumSubjects",
                table: "ClassCurriculumSubjects",
                columns: new[] { "ClassId", "SubjectId" });

            migrationBuilder.AddPrimaryKey(
                name: "PK_admissionapplications",
                table: "admissionapplications",
                column: "Id");

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

            migrationBuilder.CreateIndex(
                name: "IX_UserRoles_UserId",
                table: "UserRoles",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_admissionapplications_Classes_AppliedClassId",
                table: "admissionapplications",
                column: "AppliedClassId",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_class_sections_Classes_AcademicClassId",
                table: "class_sections",
                column: "AcademicClassId",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_class_sections_Staff_ClassTeacherId",
                table: "class_sections",
                column: "ClassTeacherId",
                principalTable: "Staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_ClassCurriculumSubjects_Classes_ClassGradeClassId",
                table: "ClassCurriculumSubjects",
                column: "ClassGradeClassId",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_ClassCurriculumSubjects_subjects_SubjectId",
                table: "ClassCurriculumSubjects",
                column: "SubjectId",
                principalTable: "subjects",
                principalColumn: "SubjectId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_exam_classes_Classes_class_id",
                table: "exam_classes",
                column: "class_id",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ExamInvigilatorAssignments_ExamSchedules_ScheduleId",
                table: "ExamInvigilatorAssignments",
                column: "ScheduleId",
                principalTable: "ExamSchedules",
                principalColumn: "ScheduleId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_HomeworkSubmissions_Homeworks_HomeworkId",
                table: "HomeworkSubmissions",
                column: "HomeworkId",
                principalTable: "Homeworks",
                principalColumn: "HomeworkId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_hostel_wardens_Staff_StaffId",
                table: "hostel_wardens",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "StaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveApplications_LeaveTypeConfigs_LeaveTypeId",
                table: "LeaveApplications",
                column: "LeaveTypeId",
                principalTable: "LeaveTypeConfigs",
                principalColumn: "LeaveTypeId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_LeaveApplications_Staff_StaffId",
                table: "LeaveApplications",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_OtpVerifications_Users_UserId",
                table: "OtpVerifications",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "UserId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_SalaryStructureItems_SalaryStructures_StructureId",
                table: "SalaryStructureItems",
                column: "StructureId",
                principalTable: "SalaryStructures",
                principalColumn: "StructureId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Section_Staff_ClassTeacherId",
                table: "Section",
                column: "ClassTeacherId",
                principalTable: "Staff",
                principalColumn: "StaffId");

            migrationBuilder.AddForeignKey(
                name: "FK_StaffAttendances_Staff_StaffId",
                table: "StaffAttendances",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_StaffDocuments_Staff_StaffId",
                table: "StaffDocuments",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_student_bed_allocations_admissionapplications_StudentId",
                table: "student_bed_allocations",
                column: "StudentId",
                principalTable: "admissionapplications",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subject_assignments_Classes_ClassId",
                table: "teacher_subject_assignments",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_teacher_subject_assignments_Staff_StaffId",
                table: "teacher_subject_assignments",
                column: "StaffId",
                principalTable: "Staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_timetable_headers_Classes_ClassId",
                table: "timetable_headers",
                column: "ClassId",
                principalTable: "Classes",
                principalColumn: "ClassId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_timetable_slots_Staff_TeacherId",
                table: "timetable_slots",
                column: "TeacherId",
                principalTable: "Staff",
                principalColumn: "StaffId",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_transport_vehicle_maintenance_transport_vehicles_vehicle_id",
                table: "transport_vehicle_maintenance",
                column: "vehicle_id",
                principalTable: "transport_vehicles",
                principalColumn: "VehicleId",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
