using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SMS.Api.Migrations
{
	public partial class InitialCreate : Migration
	{
		protected override void Up(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.AlterDatabase()
				.Annotation("MySql:CharSet", "utf8mb4");

			// 1. Roles Table
			migrationBuilder.CreateTable(
				name: "Roles",
				columns: table => new
				{
					RoleId = table.Column<int>(type: "int", nullable: false)
						.Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
					RoleName = table.Column<string>(type: "longtext", nullable: false),
					Description = table.Column<string>(type: "longtext", nullable: true)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Roles", x => x.RoleId);
				})
				.Annotation("MySql:CharSet", "utf8mb4");

			// 2. Users Table
			migrationBuilder.CreateTable(
				name: "Users",
				columns: table => new
				{
					UserId = table.Column<int>(type: "int", nullable: false)
						.Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
					FullName = table.Column<string>(type: "longtext", nullable: false),
					Email = table.Column<string>(type: "longtext", nullable: true),
					MobileNumber = table.Column<string>(type: "varchar(255)", nullable: false),
					PasswordHash = table.Column<string>(type: "longtext", nullable: false),
					UserType = table.Column<string>(type: "longtext", nullable: false),
					IsEmailVerified = table.Column<bool>(type: "tinyint(1)", nullable: false),
					IsMobileVerified = table.Column<bool>(type: "tinyint(1)", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Users", x => x.UserId);
				})
				.Annotation("MySql:CharSet", "utf8mb4");

			// 3. UserRoles Join Table
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

			// 4. OtpVerifications Table
			migrationBuilder.CreateTable(
				name: "OtpVerifications",
				columns: table => new
				{
					OtpId = table.Column<int>(type: "int", nullable: false)
						.Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
					UserId = table.Column<int>(type: "int", nullable: false),
					OtpCodeHash = table.Column<string>(type: "longtext", nullable: false),
					DeliveryMethod = table.Column<string>(type: "longtext", nullable: false),
					Purpose = table.Column<string>(type: "longtext", nullable: false),
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

			// 5. Branches Table
			migrationBuilder.CreateTable(
				name: "Branches",
				columns: table => new
				{
					BranchId = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
					BranchCode = table.Column<string>(type: "longtext", nullable: false),
					BranchName = table.Column<string>(type: "longtext", nullable: false),
					Status = table.Column<bool>(type: "tinyint(1)", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Branches", x => x.BranchId);
				})
				.Annotation("MySql:CharSet", "utf8mb4");

			// 6. Subjects Table
			migrationBuilder.CreateTable(
				name: "Subjects",
				columns: table => new
				{
					SubjectId = table.Column<string>(type: "varchar(255)", nullable: false),
					SubjectName = table.Column<string>(type: "longtext", nullable: false),
					CourseCode = table.Column<string>(type: "longtext", nullable: true),
					Status = table.Column<bool>(type: "tinyint(1)", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
					UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Subjects", x => x.SubjectId);
				})
				.Annotation("MySql:CharSet", "utf8mb4");

			// 7. Staff Table
			migrationBuilder.CreateTable(
				name: "Staff",
				columns: table => new
				{
					EmpId = table.Column<string>(type: "varchar(255)", nullable: false),
					FirstName = table.Column<string>(type: "longtext", nullable: false),
					LastName = table.Column<string>(type: "longtext", nullable: false),
					Email = table.Column<string>(type: "longtext", nullable: false),
					Phone = table.Column<string>(type: "longtext", nullable: true),
					Designation = table.Column<string>(type: "longtext", nullable: false),
					Department = table.Column<string>(type: "longtext", nullable: false),
					MonthlySalary = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
					DateOfBirth = table.Column<DateTime>(type: "datetime(6)", nullable: true),
					BankDetailsSet = table.Column<bool>(type: "tinyint(1)", nullable: false),
					DocsUploadedCount = table.Column<int>(type: "int", nullable: false),
					Status = table.Column<string>(type: "longtext", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
					UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Staff", x => x.EmpId);
				})
				.Annotation("MySql:CharSet", "utf8mb4");

			// 8. Classes Table
			migrationBuilder.CreateTable(
				name: "Classes",
				columns: table => new
				{
					ClassId = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
					BranchId = table.Column<long>(type: "bigint", nullable: true),
					ClassName = table.Column<string>(type: "longtext", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_Classes", x => x.ClassId);
					table.ForeignKey(
						name: "FK_Classes_Branches_BranchId",
						column: x => x.BranchId,
						principalTable: "Branches",
						principalColumn: "BranchId");
				})
				.Annotation("MySql:CharSet", "utf8mb4");

			// 9. ClassSections Table
			migrationBuilder.CreateTable(
				name: "ClassSections",
				columns: table => new
				{
					SectionId = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
					ClassId = table.Column<long>(type: "bigint", nullable: false),
					SectionName = table.Column<string>(type: "varchar(255)", nullable: false),
					ClassTeacherEmpId = table.Column<string>(type: "varchar(255)", nullable: true),
					CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_ClassSections", x => x.SectionId);
					table.ForeignKey(
						name: "FK_ClassSections_Classes_ClassId",
						column: x => x.ClassId,
						principalTable: "Classes",
						principalColumn: "ClassId",
						onDelete: ReferentialAction.Cascade);
					table.ForeignKey(
						name: "FK_ClassSections_Staff_ClassTeacherEmpId",
						column: x => x.ClassTeacherEmpId,
						principalTable: "Staff",
						principalColumn: "EmpId",
						onDelete: ReferentialAction.SetNull);
				})
				.Annotation("MySql:CharSet", "utf8mb4");

			// 10. ClassCurriculumSubjects Bridge Table
			migrationBuilder.CreateTable(
				name: "ClassCurriculumSubjects",
				columns: table => new
				{
					ClassId = table.Column<long>(type: "bigint", nullable: false),
					SubjectId = table.Column<string>(type: "varchar(255)", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_ClassCurriculumSubjects", x => new { x.ClassId, x.SubjectId });
					table.ForeignKey(
						name: "FK_ClassCurriculumSubjects_Classes_ClassId",
						column: x => x.ClassId,
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

			// 11. AdmissionApplications Table
			migrationBuilder.CreateTable(
				name: "AdmissionApplications",
				columns: table => new
				{
					ApplicationId = table.Column<long>(type: "bigint", nullable: false)
						.Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
					RegistrationNo = table.Column<string>(type: "longtext", nullable: false),
					ApplicantFullName = table.Column<string>(type: "longtext", nullable: false),
					AppliedClass = table.Column<string>(type: "longtext", nullable: false),
					Gender = table.Column<string>(type: "longtext", nullable: false),
					Dob = table.Column<DateTime>(type: "datetime(6)", nullable: false),
					BloodGroup = table.Column<string>(type: "longtext", nullable: false),
					Religion = table.Column<string>(type: "longtext", nullable: true),
					CasteCategory = table.Column<string>(type: "longtext", nullable: false),
					FatherFullName = table.Column<string>(type: "longtext", nullable: false),
					MotherFullName = table.Column<string>(type: "longtext", nullable: true),
					FatherMobileNo = table.Column<string>(type: "longtext", nullable: false),
					HouseNo = table.Column<string>(type: "longtext", nullable: true),
					Street = table.Column<string>(type: "longtext", nullable: true),
					AreaLocality = table.Column<string>(type: "longtext", nullable: true),
					City = table.Column<string>(type: "longtext", nullable: true),
					District = table.Column<string>(type: "longtext", nullable: true),
					State = table.Column<string>(type: "longtext", nullable: true),
					PinCode = table.Column<string>(type: "longtext", nullable: true),
					NumberOfSiblings = table.Column<int>(type: "int", nullable: false),
					SiblingStudentId = table.Column<string>(type: "longtext", nullable: true),
					StudentType = table.Column<string>(type: "longtext", nullable: false),
					TransportRequired = table.Column<bool>(type: "tinyint(1)", nullable: false),
					TransportType = table.Column<string>(type: "longtext", nullable: true),
					BusRoute = table.Column<string>(type: "longtext", nullable: true),
					PickupPoint = table.Column<string>(type: "longtext", nullable: true),
					DropPoint = table.Column<string>(type: "longtext", nullable: true),
					HostelBlock = table.Column<string>(type: "longtext", nullable: true),
					FloorLevel = table.Column<string>(type: "longtext", nullable: true),
					AllocatedBedId = table.Column<string>(type: "longtext", nullable: true),
					BranchId = table.Column<long>(type: "bigint", nullable: true),
					Status = table.Column<string>(type: "longtext", nullable: false),
					CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
					UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
				},
				constraints: table =>
				{
					table.PrimaryKey("PK_AdmissionApplications", x => x.ApplicationId);
				})
				.Annotation("MySql:CharSet", "utf8mb4");

			// Indices
			migrationBuilder.CreateIndex(
				name: "IX_Users_MobileNumber",
				table: "Users",
				column: "MobileNumber",
				unique: true);

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
				name: "IX_Classes_BranchId",
				table: "Classes",
				column: "BranchId");

			migrationBuilder.CreateIndex(
				name: "IX_ClassCurriculumSubjects_SubjectId",
				table: "ClassCurriculumSubjects",
				column: "SubjectId");

			migrationBuilder.CreateIndex(
				name: "IX_OtpVerifications_UserId",
				table: "OtpVerifications",
				column: "UserId");

			migrationBuilder.CreateIndex(
				name: "IX_UserRoles_UserId",
				table: "UserRoles",
				column: "UserId");
		}

		protected override void Down(MigrationBuilder migrationBuilder)
		{
			migrationBuilder.DropTable(name: "AdmissionApplications");
			migrationBuilder.DropTable(name: "ClassCurriculumSubjects");
			migrationBuilder.DropTable(name: "ClassSections");
			migrationBuilder.DropTable(name: "OtpVerifications");
			migrationBuilder.DropTable(name: "UserRoles");
			migrationBuilder.DropTable(name: "Classes");
			migrationBuilder.DropTable(name: "Staff");
			migrationBuilder.DropTable(name: "Subjects");
			migrationBuilder.DropTable(name: "Roles");
			migrationBuilder.DropTable(name: "Users");
			migrationBuilder.DropTable(name: "Branches");
		}
	}
}