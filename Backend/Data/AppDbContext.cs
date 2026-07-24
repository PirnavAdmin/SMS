namespace SMS.Api.Data;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;
using System.Collections.Generic;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // System & Auth DbSets
    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Role> Roles { get; set; } = null!;
    public DbSet<OtpVerification> OtpVerifications { get; set; } = null!;

    // Academic, HR & Admission DbSets
    public DbSet<Branch> Branches { get; set; } = null!;
    public DbSet<Subject> Subjects { get; set; } = null!;
    public DbSet<Staff> Staff { get; set; } = null!;
    public DbSet<ClassGrade> Classes { get; set; } = null!;
    public DbSet<ClassSection> ClassSections { get; set; } = null!;
    public DbSet<ClassCurriculumSubject> ClassCurriculumSubjects { get; set; } = null!;
    public DbSet<AdmissionApplication> AdmissionApplications { get; set; } = null!;

    // Transport Management DbSets
    public DbSet<TransportRoute> TransportRoutes { get; set; } = null!;
    public DbSet<PickupPoint> PickupPoints { get; set; } = null!;
    public DbSet<TransportVehicle> TransportVehicles { get; set; } = null!;
    public DbSet<TransportDriver> TransportDrivers { get; set; } = null!;
    public DbSet<TransportVehicleAssignment> TransportVehicleAssignments { get; set; } = null!;
    public DbSet<StudentTransportAssignment> StudentTransportAssignments { get; set; } = null!;
    public DbSet<VehicleMaintenance> VehicleMaintenances { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // --------------------------------------------------
        // Auth Configurations
        // --------------------------------------------------
        modelBuilder.Entity<User>().HasKey(u => u.UserId);
        modelBuilder.Entity<User>().HasIndex(u => u.MobileNumber).IsUnique();
        modelBuilder.Entity<Role>().HasKey(r => r.RoleId);

        modelBuilder.Entity<User>()
            .HasMany(u => u.Roles)
            .WithMany(r => r.Users)
            .UsingEntity<Dictionary<string, object>>(
                "UserRoles",
                j => j.HasOne<Role>().WithMany().HasForeignKey("RoleId"),
                j => j.HasOne<User>().WithMany().HasForeignKey("UserId")
            );

        modelBuilder.Entity<OtpVerification>().HasKey(o => o.OtpId);

        modelBuilder.Entity<OtpVerification>()
            .HasOne(o => o.User)
            .WithMany(u => u.OtpVerifications)
            .HasForeignKey(o => o.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        // --------------------------------------------------
        // Academic & HR Module Configurations
        // --------------------------------------------------
        modelBuilder.Entity<ClassCurriculumSubject>()
            .HasKey(ccs => new { ccs.ClassId, ccs.SubjectId });

        modelBuilder.Entity<ClassSection>()
            .HasIndex(cs => new { cs.ClassId, cs.SectionName })
            .IsUnique();

        modelBuilder.Entity<ClassSection>()
            .HasOne(cs => cs.ClassTeacher)
            .WithMany()
            .HasForeignKey(cs => cs.ClassTeacherEmpId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<AdmissionApplication>()
            .HasOne(a => a.AppliedClass)
            .WithMany(c => c.AdmissionApplications)
            .HasForeignKey(a => a.AppliedClassId)
            .OnDelete(DeleteBehavior.Restrict);

        // --------------------------------------------------
        // Transport Module Configurations
        // --------------------------------------------------
        modelBuilder.Entity<TransportVehicle>().ToTable("transport_vehicles").HasKey(v => v.VehicleId);
        modelBuilder.Entity<TransportRoute>().ToTable("transport_routes").HasKey(r => r.RouteId);
        modelBuilder.Entity<TransportDriver>().ToTable("transport_drivers").HasKey(d => d.DriverId);
        modelBuilder.Entity<PickupPoint>().ToTable("transport_pickup_points").HasKey(p => p.PickupPointId);
        modelBuilder.Entity<TransportVehicleAssignment>().ToTable("transport_vehicle_assignments").HasKey(a => a.AssignmentId);
        modelBuilder.Entity<StudentTransportAssignment>().ToTable("student_transport_assignments").HasKey(sa => sa.StudentTransportAssignmentId);
        modelBuilder.Entity<VehicleMaintenance>().ToTable("transport_vehicle_maintenance").HasKey(m => m.MaintenanceId);
    }
}