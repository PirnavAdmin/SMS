    using Microsoft.EntityFrameworkCore;
    using SMS.Api.Models;

    namespace SMS.Api.Data;

    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

        // Existing System & Auth DbSets
        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Role> Roles { get; set; } = null!;
        public DbSet<OtpVerification> OtpVerifications { get; set; } = null!;
    public DbSet<User> Users { get; set; } = null!;

    public DbSet<Role> Roles { get; set; } = null!;

    public DbSet<OtpVerification> OtpVerifications { get; set; } = null!;

        // Academic, Staff, & Admission DbSets
        public DbSet<Branch> Branches { get; set; } = null!;
        public DbSet<Subject> Subjects { get; set; } = null!;
        public DbSet<Staff> Staff { get; set; } = null!;
        public DbSet<ClassGrade> Classes { get; set; } = null!;
        public DbSet<ClassSection> ClassSections { get; set; } = null!;
        public DbSet<ClassCurriculumSubject> ClassCurriculumSubjects { get; set; } = null!;
        public DbSet<AdmissionApplication> AdmissionApplications { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
   

    public DbSet<TransportRoute> TransportRoutes =>Set<TransportRoute>();
    public DbSet<PickupPoint> PickupPoints => Set<PickupPoint>();
    public DbSet<TransportVehicle> TransportVehicles => Set<TransportVehicle>();
    public DbSet<TransportDriver> TransportDrivers { get; set; }
    public DbSet<TransportVehicleAssignment> TransportVehicleAssignments { get; set; }
    public DbSet<StudentTransportAssignment> StudentTransportAssignments { get; set; }
    public DbSet<VehicleMaintenance> VehicleMaintenances { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

            // --------------------------------------------------
            // Existing Auth & User Configurations
            // --------------------------------------------------
            modelBuilder.Entity<User>().HasKey(u => u.UserId);
            modelBuilder.Entity<User>().HasIndex(u => u.MobileNumber).IsUnique();
            modelBuilder.Entity<Role>().HasKey(r => r.RoleId);
        //---------------------------------------------------
        // User
        //---------------------------------------------------

            // Explicitly map UserRoles table and its foreign key columns
            modelBuilder.Entity<User>()
                .HasMany(u => u.Roles)
                .WithMany(r => r.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "UserRoles",
                    j => j.HasOne<Role>().WithMany().HasForeignKey("RoleId"),
                    j => j.HasOne<User>().WithMany().HasForeignKey("UserId")
                );
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.UserId);

            entity.HasIndex(u => u.MobileNumber)
                .IsUnique();
        });

        //---------------------------------------------------
        // Role
        //---------------------------------------------------

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(r => r.RoleId);
        });

        //---------------------------------------------------
        // User Roles
        //---------------------------------------------------

        modelBuilder.Entity<User>()
            .HasMany(u => u.Roles)
            .WithMany(r => r.Users)
            .UsingEntity<Dictionary<string, object>>(
                "UserRoles",
                right => right
                    .HasOne<Role>()
                    .WithMany()
                    .HasForeignKey("RoleId"),
                left => left
                    .HasOne<User>()
                    .WithMany()
                    .HasForeignKey("UserId"));

            modelBuilder.Entity<OtpVerification>().HasKey(o => o.OtpId);
        //---------------------------------------------------
        // OTP Verification
        //---------------------------------------------------

            modelBuilder.Entity<OtpVerification>()
                .HasOne(o => o.User)
                .WithMany(u => u.OtpVerifications)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // --------------------------------------------------
            // Academic & HR Module Configurations
            // --------------------------------------------------

            // Composite Primary Key for ClassCurriculumSubject (Many-to-Many Bridge)
            modelBuilder.Entity<ClassCurriculumSubject>()
                .HasKey(ccs => new { ccs.ClassId, ccs.SubjectId });

            // Unique Constraint for Section Name per Class (e.g., Section A unique under Class 10)
            modelBuilder.Entity<ClassSection>()
                .HasIndex(cs => new { cs.ClassId, cs.SectionName })
                .IsUnique();

            // Foreign Key Relationship for Class Section Class Teacher (Null-on-delete)
            modelBuilder.Entity<ClassSection>()
                .HasOne(cs => cs.ClassTeacher)
                .WithMany()
                .HasForeignKey(cs => cs.ClassTeacherEmpId)
                .OnDelete(DeleteBehavior.SetNull);

            // Foreign Key Relationship for Admission Application Applied Class
            modelBuilder.Entity<AdmissionApplication>()
                .HasOne(a => a.AppliedClass)
                .WithMany(c => c.AdmissionApplications)
                .HasForeignKey(a => a.AppliedClassId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
        modelBuilder.Entity<OtpVerification>(entity =>
        {
            entity.HasKey(o => o.OtpId);

            entity.HasOne(o => o.User)
                .WithMany(u => u.OtpVerifications)
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        //---------------------------------------------------
        // Transport Route
        //---------------------------------------------------

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
                .HasColumnName("estimated_duration_minutes");

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
                .HasDatabaseName("ux_transport_routes_route_code");

            entity.HasIndex(x => x.RouteName)
                .IsUnique()
                .HasDatabaseName("ux_transport_routes_route_name");

            entity.HasIndex(x => new
            {
                x.Status,
                x.IsDeleted
            })
            .HasDatabaseName(
                "ix_transport_routes_status_is_deleted");
        });
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

            entity.HasIndex(x => x.RegistrationNumber).IsUnique();
        });
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
        modelBuilder.Entity<TransportVehicleAssignment>(entity =>
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

            entity.Property(x => x.Status)
                .HasDefaultValue(true);

            entity.Property(x => x.IsDeleted)
                .HasDefaultValue(false);
        });
        modelBuilder.Entity<StudentTransportAssignment>(entity =>
        {
            entity.HasKey(x => x.StudentTransportAssignmentId);

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
                .HasForeignKey(x => x.VehicleAssignmentId)
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

            entity.Property(x => x.TransportType)
                .IsRequired()
                .HasMaxLength(20);

            entity.Property(x => x.Status)
                .HasDefaultValue(true);

            entity.Property(x => x.IsDeleted)
                .HasDefaultValue(false);
        });
        modelBuilder.Entity<VehicleMaintenance>(entity =>
        {
            entity.ToTable("transport_vehicle_maintenance");

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

            entity.Property(x => x.CreatedAt).HasColumnName("created_at").HasColumnType("datetime")
            .HasDefaultValueSql("CURRENT_TIMESTAMP");

            entity.Property(x => x.UpdatedAt)
    .HasColumnName("updated_at")
    .HasColumnType("datetime");

            entity.HasOne(x => x.Vehicle)
                .WithMany()
                .HasForeignKey(x => x.VehicleId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<StudentTransportAssignment>()
    .HasIndex(x => new
    {
        x.RouteId,
        x.PickupPointId,
        x.VehicleAssignmentId,
        x.Status,
        x.IsDeleted
    });

        modelBuilder.Entity<TransportVehicleAssignment>()
            .HasIndex(x => new
            {
                x.VehicleId,
                x.DriverId,
                x.RouteId,
                x.Status,
                x.IsDeleted
            });

        modelBuilder.Entity<VehicleMaintenance>(entity =>
        {
            // Keep the foreign-key index.
            entity.HasIndex(x => x.VehicleId)
    .HasDatabaseName("IX_transport_vehicle_maintenance_vehicle_id");

            // Report-performance index with a short MySQL-safe name.
            entity.HasIndex(x => new
            {
                x.VehicleId,
                x.ServiceDate,
                x.IsDeleted
            })
 .HasDatabaseName("IX_VehMaint_Vehicle_ServiceDate_Deleted");
        });
        modelBuilder.Entity<TransportVehicleAssignment>()
            .HasIndex(x => new
            {
                x.VehicleId,
                x.DriverId,
                x.RouteId,
                x.Status,
                x.IsDeleted
            });
    }
}