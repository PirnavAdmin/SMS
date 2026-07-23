using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentTransportAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "student_transport_assignments");
        }
    }
}
