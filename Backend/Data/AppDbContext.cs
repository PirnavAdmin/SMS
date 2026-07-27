using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;

namespace SMS.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(
            DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // =====================================================
        // Authentication and User Module
        // =====================================================

        public DbSet<User> Users { get; set; } = null!;

        public DbSet<Role> Roles { get; set; } = null!;

        public DbSet<OtpVerification> OtpVerifications { get; set; } = null!;

        // =====================================================
        // Academic, Staff and Admission Modules
        // =====================================================

        public DbSet<Branch> Branches { get; set; } = null!;

        public DbSet<Department> Departments { get; set; } = null!;

        public DbSet<Subject> Subjects { get; set; } = null!;

        public DbSet<Staff> Staff { get; set; } = null!;

        public DbSet<ClassGrade> Classes { get; set; } = null!;

        public DbSet<ClassSection> ClassSections { get; set; } = null!;

        public DbSet<ClassCurriculumSubject> ClassCurriculumSubjects
        {
            get;
            set;
        } = null!;

        public DbSet<AdmissionApplication> AdmissionApplications
        {
            get;
            set;
        } = null!;

        public DbSet<Admission> Admissions { get; set; } = null!;

        // =====================================================
        // Transport Module
        // =====================================================

        public DbSet<TransportRoute> TransportRoutes
            => Set<TransportRoute>();

        public DbSet<PickupPoint> PickupPoints
            => Set<PickupPoint>();

        public DbSet<TransportVehicle> TransportVehicles
            => Set<TransportVehicle>();

        public DbSet<TransportDriver> TransportDrivers
        {
            get;
            set;
        } = null!;

        public DbSet<TransportVehicleAssignment>
            TransportVehicleAssignments
        {
            get;
            set;
        } = null!;

        public DbSet<StudentTransportAssignment>
            StudentTransportAssignments
        {
            get;
            set;
        } = null!;

        public DbSet<VehicleMaintenance> VehicleMaintenances
        {
            get;
            set;
        } = null!;


        // =====================================================
        // Examination Module
        // =====================================================

        public DbSet<ExamMaster> ExamMasters
            => Set<ExamMaster>();

        public DbSet<ExamClass> ExamClasses
            => Set<ExamClass>();

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigureUser(modelBuilder);
            ConfigureRole(modelBuilder);
            ConfigureUserRoles(modelBuilder);
            ConfigureOtpVerification(modelBuilder);

            ConfigureDepartment(modelBuilder);
            ConfigureSubject(modelBuilder);
            ConfigureClassCurriculumSubject(modelBuilder);
            ConfigureClassSection(modelBuilder);
            ConfigureAdmissionApplication(modelBuilder);

            ConfigureTransportRoute(modelBuilder);
            ConfigurePickupPoint(modelBuilder);
            ConfigureTransportVehicle(modelBuilder);
            ConfigureTransportDriver(modelBuilder);
            ConfigureTransportVehicleAssignment(modelBuilder);
            ConfigureStudentTransportAssignment(modelBuilder);
            ConfigureVehicleMaintenance(modelBuilder);
            ConfigureExamMaster(modelBuilder);
            ConfigureExamClass(modelBuilder);
        }

        // =====================================================
        // User Configuration
        // =====================================================

        private static void ConfigureUser(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(x => x.UserId);

                entity.HasIndex(x => x.MobileNumber)
                    .IsUnique();
            });
        }

        // =====================================================
        // Role Configuration
        // =====================================================

        private static void ConfigureRole(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(x => x.RoleId);
            });
        }

        // =====================================================
        // User Roles Configuration
        // =====================================================

        private static void ConfigureUserRoles(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasMany(user => user.Roles)
                .WithMany(role => role.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserRoles",

                    role => role
                        .HasOne<Role>()
                        .WithMany()
                        .HasForeignKey("RoleId"),

                    user => user
                        .HasOne<User>()
                        .WithMany()
                        .HasForeignKey("UserId"));
        }

        // =====================================================
        // OTP Verification Configuration
        // =====================================================

        private static void ConfigureOtpVerification(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<OtpVerification>(entity =>
            {
                entity.HasKey(x => x.OtpId);

                entity.HasOne(x => x.User)
                    .WithMany(user => user.OtpVerifications)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        // =====================================================
        // Department Configuration
        // =====================================================

        private static void ConfigureDepartment(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Department>(entity =>
            {
                entity.HasKey(x => x.DepartmentId);
            });
        }

        // =====================================================
        // Subject Configuration
        // =====================================================

        private static void ConfigureSubject(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Subject>(entity =>
            {
                entity.HasOne(x => x.Department)
                    .WithMany(x => x.Subjects)
                    .HasForeignKey(x => x.DepartmentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // =====================================================
        // Class Curriculum Subject Configuration
        // =====================================================

        private static void ConfigureClassCurriculumSubject(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClassCurriculumSubject>()
                .HasKey(x => new
                {
                    x.ClassId,
                    x.SubjectId
                });
        }

        // =====================================================
        // Class Section Configuration
        // =====================================================

        private static void ConfigureClassSection(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClassSection>(entity =>
            {
                entity.ToTable("section");

                entity.HasKey(x => x.SectionId);

                entity.HasIndex(x => new
                {
                    x.ClassId,
                    x.SectionName
                })
                    .IsUnique();

                entity.Property(x => x.ClassId)
                    .HasColumnName("AcademicClassId");

                entity.Property(x => x.ClassTeacherEmpId)
                    .HasColumnName("ClassTeacherId");

                entity.HasOne(x => x.ClassGrade)
                    .WithMany(x => x.Sections)
                    .HasForeignKey(x => x.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.ClassTeacher)
                    .WithMany()
                    .HasForeignKey(x => x.ClassTeacherEmpId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        // =====================================================
        // Admission Application Configuration
        // =====================================================

        private static void ConfigureAdmissionApplication(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AdmissionApplication>(entity =>
            {
                entity.HasOne(x => x.AppliedClass)
                    .WithMany(classGrade =>
                        classGrade.AdmissionApplications)
                    .HasForeignKey(x => x.AppliedClassId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // =====================================================
        // Transport Route Configuration
        // =====================================================

        private static void ConfigureTransportRoute(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TransportRoute>(entity =>
            {
                entity.ToTable("transport_routes");

                entity.HasKey(x => x.RouteId);

                entity.Property(x => x.RouteId)
                    .HasColumnName("route_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.RouteCode)
                    .HasColumnName("route_code")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(x => x.RouteName)
                    .HasColumnName("route_name")
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.StartLocation)
                    .HasColumnName("start_location")
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.EndLocation)
                    .HasColumnName("end_location")
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.DistanceKm)
                    .HasColumnName("distance_km")
                    .HasPrecision(10, 2);

                entity.Property(x => x.EstimatedDurationMinutes)
                    .HasColumnName(
                        "estimated_duration_minutes");

                entity.Property(x => x.Description)
                    .HasColumnName("description")
                    .HasMaxLength(500);

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasDefaultValue(true);

                entity.Property(x => x.IsDeleted)
                    .HasColumnName("is_deleted")
                    .HasDefaultValue(false);

                entity.Property(x => x.CreatedBy)
                    .HasColumnName("created_by");

                entity.Property(x => x.UpdatedBy)
                    .HasColumnName("updated_by");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at");

                entity.HasIndex(x => x.RouteCode)
                    .IsUnique()
                    .HasDatabaseName(
                        "ux_transport_routes_route_code");

                entity.HasIndex(x => x.RouteName)
                    .IsUnique()
                    .HasDatabaseName(
                        "ux_transport_routes_route_name");

                entity.HasIndex(x => new
                {
                    x.Status,
                    x.IsDeleted
                })
                    .HasDatabaseName(
                        "ix_transport_routes_status_is_deleted");
            });
        }

        // =====================================================
        // Pickup Point Configuration
        // =====================================================

        private static void ConfigurePickupPoint(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PickupPoint>(entity =>
            {
                entity.ToTable("transport_pickup_points");

                entity.HasKey(x => x.PickupPointId);

                entity.Property(x => x.PickupPointName)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.Landmark)
                    .HasMaxLength(250);

                entity.Property(x => x.DistanceFromStart)
                    .HasPrecision(10, 2);

                entity.HasOne(x => x.TransportRoute)
                    .WithMany()
                    .HasForeignKey(x => x.RouteId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(x => new
                {
                    x.RouteId,
                    x.SequenceNo
                });

                entity.HasIndex(x => new
                {
                    x.RouteId,
                    x.PickupPointName
                });
            });
        }

        // =====================================================
        // Transport Vehicle Configuration
        // =====================================================

        private static void ConfigureTransportVehicle(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TransportVehicle>(entity =>
            {
                entity.ToTable("transport_vehicles");

                entity.HasKey(x => x.VehicleId);

                entity.Property(x => x.VehicleNumber)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(x => x.RegistrationNumber)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(x => x.VehicleName)
                    .HasMaxLength(100)
                    .IsRequired();

                entity.Property(x => x.VehicleType)
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(x => x.Manufacturer)
                    .HasMaxLength(100);

                entity.Property(x => x.Model)
                    .HasMaxLength(100);

                entity.Property(x => x.InsuranceNumber)
                    .HasMaxLength(100);

                entity.HasIndex(x => x.VehicleNumber)
                    .IsUnique();

                entity.HasIndex(x => x.RegistrationNumber)
                    .IsUnique();
            });
        }

        // =====================================================
        // Transport Driver Configuration
        // =====================================================

        private static void ConfigureTransportDriver(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TransportDriver>(entity =>
            {
                entity.HasKey(x => x.DriverId);

                entity.HasIndex(x => x.LicenceNumber)
                    .IsUnique();

                entity.HasIndex(x => x.MobileNumber);

                entity.Property(x => x.DriverName)
                    .IsRequired()
                    .HasMaxLength(100);

                entity.Property(x => x.MobileNumber)
                    .IsRequired()
                    .HasMaxLength(20);

                entity.Property(x => x.LicenceNumber)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.Status)
                    .HasDefaultValue(true);

                entity.Property(x => x.IsDeleted)
                    .HasDefaultValue(false);
            });
        }

        // =====================================================
        // Transport Vehicle Assignment Configuration
        // =====================================================

        private static void ConfigureTransportVehicleAssignment(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TransportVehicleAssignment>(
                entity =>
                {
                    entity.HasKey(x => x.AssignmentId);

                    entity.HasOne(x => x.Route)
                        .WithMany()
                        .HasForeignKey(x => x.RouteId)
                        .OnDelete(DeleteBehavior.Restrict);

                    entity.HasOne(x => x.Vehicle)
                        .WithMany()
                        .HasForeignKey(x => x.VehicleId)
                        .OnDelete(DeleteBehavior.Restrict);

                    entity.HasOne(x => x.Driver)
                        .WithMany()
                        .HasForeignKey(x => x.DriverId)
                        .OnDelete(DeleteBehavior.Restrict);

                    entity.HasIndex(x => new
                    {
                        x.RouteId,
                        x.VehicleId,
                        x.DriverId,
                        x.EffectiveFrom
                    });

                    entity.HasIndex(x => x.VehicleId);

                    entity.HasIndex(x => x.DriverId);

                    entity.HasIndex(x => x.RouteId);

                    entity.HasIndex(x => new
                    {
                        x.VehicleId,
                        x.DriverId,
                        x.RouteId,
                        x.Status,
                        x.IsDeleted
                    })
                        .HasDatabaseName(
                            "IX_TVA_Vehicle_Driver_Route");

                    entity.Property(x => x.Status)
                        .HasDefaultValue(true);

                    entity.Property(x => x.IsDeleted)
                        .HasDefaultValue(false);
                });
        }

        // =====================================================
        // Student Transport Assignment Configuration
        // =====================================================

        private static void ConfigureStudentTransportAssignment(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StudentTransportAssignment>(
                entity =>
                {
                    entity.HasKey(
                        x => x.StudentTransportAssignmentId);

                    entity.HasOne(x => x.Route)
                        .WithMany()
                        .HasForeignKey(x => x.RouteId)
                        .OnDelete(DeleteBehavior.Restrict);

                    entity.HasOne(x => x.PickupPoint)
                        .WithMany()
                        .HasForeignKey(x => x.PickupPointId)
                        .OnDelete(DeleteBehavior.Restrict);

                    entity.HasOne(x => x.VehicleAssignment)
                        .WithMany()
                        .HasForeignKey(
                            x => x.VehicleAssignmentId)
                        .OnDelete(DeleteBehavior.Restrict);

                    entity.HasIndex(x => x.StudentId);

                    entity.HasIndex(x => x.RouteId);

                    entity.HasIndex(x => x.PickupPointId);

                    entity.HasIndex(x => x.VehicleAssignmentId);

                    entity.HasIndex(x => new
                    {
                        x.StudentId,
                        x.EffectiveFrom,
                        x.EffectiveTo
                    });

                    entity.HasIndex(x => new
                    {
                        x.RouteId,
                        x.PickupPointId,
                        x.VehicleAssignmentId,
                        x.Status,
                        x.IsDeleted
                    })
                        .HasDatabaseName(
                            "IX_STA_Route_Pickup_Vehicle");

                    entity.Property(x => x.TransportType)
                        .IsRequired()
                        .HasMaxLength(20);

                    entity.Property(x => x.Status)
                        .HasDefaultValue(true);

                    entity.Property(x => x.IsDeleted)
                        .HasDefaultValue(false);
                });
        }

        // =====================================================
        // Vehicle Maintenance Configuration
        // =====================================================

        private static void ConfigureVehicleMaintenance(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<VehicleMaintenance>(entity =>
            {
                entity.ToTable(
                    "transport_vehicle_maintenance");

                entity.HasKey(x => x.MaintenanceId);

                entity.Property(x => x.MaintenanceId)
                    .HasColumnName("maintenance_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.VehicleId)
                    .HasColumnName("vehicle_id")
                    .IsRequired();

                entity.Property(x => x.ServiceType)
                    .HasColumnName("service_type")
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.ServiceDate)
                    .HasColumnName("service_date")
                    .HasColumnType("date")
                    .IsRequired();

                entity.Property(x => x.Cost)
                    .HasColumnName("cost")
                    .HasPrecision(12, 2)
                    .HasDefaultValue(0m);

                entity.Property(x => x.VendorCenter)
                    .HasColumnName("vendor_center")
                    .HasMaxLength(150);

                entity.Property(x => x.NextServiceDue)
                    .HasColumnName("next_service_due")
                    .HasColumnType("date");

                entity.Property(x => x.Remarks)
                    .HasColumnName("remarks")
                    .HasMaxLength(500);

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasDefaultValue(true);

                entity.Property(x => x.IsDeleted)
                    .HasColumnName("is_deleted")
                    .HasDefaultValue(false);

                entity.Property(x => x.CreatedBy)
                    .HasColumnName("created_by");

                entity.Property(x => x.UpdatedBy)
                    .HasColumnName("updated_by");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql(
                        "CURRENT_TIMESTAMP");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasColumnType("datetime");

                entity.HasOne(x => x.Vehicle)
                    .WithMany()
                    .HasForeignKey(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Existing foreign-key index
                entity.HasIndex(x => x.VehicleId)
                    .HasDatabaseName(
                        "IX_transport_vehicle_maintenance_vehicle_id");

                // Transport report performance index
                entity.HasIndex(x => new
                {
                    x.VehicleId,
                    x.ServiceDate,
                    x.IsDeleted
                })
                    .HasDatabaseName(
                        "IX_VehMaint_Vehicle_ServiceDate_Deleted");
            });
        }
        private static void ConfigureExamMaster(
        ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ExamMaster>(entity =>
            {
                entity.ToTable("exam_masters");

                entity.HasKey(x => x.ExamId);

                entity.Property(x => x.ExamId)
                    .HasColumnName("exam_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ExamTitle)
                    .HasColumnName("exam_title")
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.ExamType)
                    .HasColumnName("exam_type")
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(x => x.ExamStatus)
                    .HasColumnName("exam_status")
                    .HasMaxLength(30)
                    .HasDefaultValue("Scheduled")
                    .IsRequired();

                entity.Property(x => x.BranchId)
                    .HasColumnName("branch_id");

                entity.Property(x => x.AcademicYearId)
                    .HasColumnName("academic_year_id");

                entity.Property(x => x.StartDate)
                    .HasColumnName("start_date")
                    .HasColumnType("date");

                entity.Property(x => x.EndDate)
                    .HasColumnName("end_date")
                    .HasColumnType("date");

                entity.Property(x => x.IsDeleted)
                    .HasColumnName("is_deleted")
                    .HasDefaultValue(false);

                entity.Property(x => x.CreatedBy).HasColumnName("created_by");

                entity.Property(x => x.UpdatedBy).HasColumnName("updated_by");

                entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime").HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasColumnType("datetime");

                entity.HasIndex(x => new
                {
                    x.ExamTitle,
                    x.BranchId,
                    x.AcademicYearId
                })
                    .IsUnique()
                    .HasDatabaseName(
                        "ux_exam_title_branch_academic_year");

                entity.HasIndex(x => new
                {
                    x.BranchId,
                    x.AcademicYearId,
                    x.ExamStatus,
                    x.IsDeleted
                })
                    .HasDatabaseName(
                        "ix_exam_master_filter");
            });
        }

        private static void ConfigureExamClass(
            ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ExamClass>(entity =>
            {
                entity.ToTable("exam_classes");

                entity.HasKey(x => new
                {
                    x.ExamId,
                    x.ClassId
                });

                entity.Property(x => x.ExamId)
                    .HasColumnName("exam_id");

                entity.Property(x => x.ClassId)
                    .HasColumnName("class_id");

                entity.HasOne(x => x.Exam)
                    .WithMany(x => x.ExamClasses)
                    .HasForeignKey(x => x.ExamId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Class)
                    .WithMany()
                    .HasForeignKey(x => x.ClassId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(x => x.ClassId)
                    .HasDatabaseName(
                        "ix_exam_classes_class_id");
            });
        }


    }
}