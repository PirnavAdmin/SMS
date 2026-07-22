using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;

namespace SMS.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    // Existing System & Auth DbSets
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

        // --------------------------------------------------
        // Existing Auth & User Configurations
        // --------------------------------------------------
        modelBuilder.Entity<User>().HasKey(u => u.UserId);
        modelBuilder.Entity<User>().HasIndex(u => u.MobileNumber).IsUnique();
        modelBuilder.Entity<Role>().HasKey(r => r.RoleId);

        // Explicitly map UserRoles table and its foreign key columns
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
    }
}