using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Models.Examination;

namespace SMS.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // =====================================================
        // Authentication and User Module
        // =====================================================

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Admin> Admins { get; set; } = null!;
        public DbSet<School> Schools { get; set; } = null!;
        public DbSet<AuditLog> AuditLogs { get; set; } = null!;
        public DbSet<SystemNotification> SystemNotifications { get; set; } = null!;

        public DbSet<Role> Roles { get; set; } = null!;

        public DbSet<OtpVerification> OtpVerifications { get; set; } = null!;


        // =====================================================
        // Academic, Staff and Admission Modules
        // =====================================================

        public DbSet<Branch> Branches { get; set; } = null!;

        public DbSet<Department> Departments { get; set; } = null!;

        public DbSet<Subject> Subjects { get; set; } = null!;

        public DbSet<Staff> Staff { get; set; } = null!;
        public DbSet<StaffDocument> StaffDocuments { get; set; } = null!;
        public DbSet<StaffAttendance> StaffAttendances { get; set; } = null!;
        public DbSet<StaffQualification> StaffQualifications { get; set; } = null!;
        public DbSet<StaffExperience> StaffExperiences { get; set; } = null!;
        public DbSet<TeacherAttendanceCorrection> TeacherAttendanceCorrections { get; set; } = null!;
        public DbSet<LibraryBook> LibraryBooks { get; set; } = null!;
        public DbSet<LibraryIssueRecord> LibraryIssueRecords { get; set; } = null!;
        public DbSet<LeaveTypeConfig> LeaveTypeConfigs { get; set; } = null!;
        public DbSet<LeaveApplication> LeaveApplications { get; set; } = null!;
        public DbSet<HolidayCalendar> HolidayCalendars { get; set; } = null!;

        public DbSet<ClassGrade> Classes { get; set; } = null!;
        public DbSet<ClassSection> ClassSections { get; set; } = null!;
        public DbSet<ClassSubjectMapping> ClassSubjectMappings { get; set; } = null!;
        public DbSet<TeacherAssignment> TeacherAssignments { get; set; } = null!;
        public DbSet<AdmissionApplication> AdmissionApplications { get; set; } = null!;
        public DbSet<Admission> Admissions { get; set; } = null!;
        public DbSet<SMS.Api.Models.AcademicManagement.DesignationMaster> DesignationMasters { get; set; } = null!;

        // Homework Module
        public DbSet<Homework> Homeworks { get; set; } = null!;
        public DbSet<HomeworkSubmission> HomeworkSubmissions { get; set; } = null!;

        // Communications Module
        public DbSet<Circular> Circulars { get; set; } = null!;
        public DbSet<Meeting> Meetings { get; set; } = null!;

        // Academic Calendar & Events Module
        public DbSet<SchoolEvent> SchoolEvents { get; set; } = null!;

        // HR & Payroll Module
        public DbSet<PayrollConfig> PayrollConfigs { get; set; } = null!;
        public DbSet<SalaryComponent> SalaryComponents { get; set; } = null!;
        public DbSet<SalaryStructure> SalaryStructures { get; set; } = null!;
        public DbSet<SalaryStructureItem> SalaryStructureItems { get; set; } = null!;
        public DbSet<EmployeeSalaryAssignment> EmployeeSalaryAssignments { get; set; } = null!;
        public DbSet<Payslip> Payslips { get; set; } = null!;

        // Examination Module
        public DbSet<NewExamination> NewExaminations { get; set; } = null!;
        public DbSet<NewExamSubjectConfig> NewExamSubjectConfigs { get; set; } = null!;
        public DbSet<NewExamTimetableSlot> NewExamTimetableSlots { get; set; } = null!;
        public DbSet<NewStudentExamResult> NewStudentExamResults { get; set; } = null!;
        public DbSet<NewGradingScaleRule> NewGradingScaleRules { get; set; } = null!;
        public DbSet<NewStudentMarksEntry> NewStudentMarksEntries { get; set; } = null!;

        // Uniform Module
        public DbSet<UniformType> UniformTypes { get; set; } = null!;
        public DbSet<UniformCategory> UniformCategories { get; set; } = null!;
        public DbSet<UniformSize> UniformSizes { get; set; } = null!;
        public DbSet<UniformSupplier> UniformSuppliers { get; set; } = null!;
        public DbSet<StudentUniformDistribution> StudentUniformDistributions { get; set; } = null!;

        // Inventory & Attendants
        public DbSet<TransportAttendant> TransportAttendants { get; set; } = null!;
        public DbSet<InventoryItem> InventoryItems { get; set; } = null!;

        // =====================================================
        // Transport Module
        // =====================================================

        public DbSet<TransportRoute> TransportRoutes => Set<TransportRoute>();

        public DbSet<PickupPoint> PickupPoints => Set<PickupPoint>();

        public DbSet<TransportVehicle> TransportVehicles => Set<TransportVehicle>();

        public DbSet<TransportDriver> TransportDrivers { get; set; } = null!;

        public DbSet<TransportVehicleAssignment> TransportVehicleAssignments { get; set; } = null!;

        public DbSet<StudentTransportAssignment> StudentTransportAssignments { get; set; } = null!;

        public DbSet<VehicleMaintenance> VehicleMaintenances { get; set; } = null!;

        // =====================================================
        // Hostel ERP Module
        // =====================================================

        public DbSet<HostelBlock> HostelBlocks { get; set; } = null!;
        public DbSet<RoomTypeConfig> RoomTypeConfigs { get; set; } = null!;
        public DbSet<RoomMaster> RoomMasters { get; set; } = null!;
        public DbSet<HostelWarden> HostelWardens { get; set; } = null!;
        public DbSet<StudentBedAllocation> StudentBedAllocations { get; set; } = null!;
        public DbSet<HostelAttendance> HostelAttendances { get; set; } = null!;


        // =====================================================
        // Timetable Module
        // =====================================================

        public DbSet<PeriodSetting> PeriodSettings { get; set; } = null!;
        public DbSet<TeacherSubjectAssignment> TeacherSubjectAssignments { get; set; } = null!;
        public DbSet<TimetableHeader> TimetableHeaders { get; set; } = null!;
        public DbSet<TimetableSlot> TimetableSlots { get; set; } = null!;
        //student
        public DbSet<Student> Students { get; set; } = null!;
        public DbSet<AcademicYear> AcademicYears { get; set; } = null!;
        public DbSet<StudentAttendanceSession> StudentAttendanceSessions { get; set; } = null!;
        public DbSet<StudentAttendance> StudentAttendances { get; set; } = null!;
        //public DbSet<AdmissionApplication> AdmissionApplications { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigureUser(modelBuilder);
            ConfigureAdmin(modelBuilder);
            ConfigureRole(modelBuilder);
            ConfigureUserRoles(modelBuilder);
            ConfigureAdminRoles(modelBuilder);
            ConfigureOtpVerification(modelBuilder);

            ConfigureDepartment(modelBuilder);
            ConfigureSubject(modelBuilder);
            ConfigureClassGrade(modelBuilder);
            ConfigureClassSubjectMapping(modelBuilder);
            ConfigureTeacherAssignment(modelBuilder);
            ConfigureClassSection(modelBuilder);
            ConfigureAdmissionApplication(modelBuilder);

            ConfigureTransportRoute(modelBuilder);
            ConfigurePickupPoint(modelBuilder);
            ConfigureTransportVehicle(modelBuilder);
            ConfigureTransportDriver(modelBuilder);
            ConfigureTransportVehicleAssignment(modelBuilder);
            ConfigureStudentTransportAssignment(modelBuilder);
            ConfigureVehicleMaintenance(modelBuilder);

            ConfigurePeriodSetting(modelBuilder);
            ConfigureTeacherSubjectAssignment(modelBuilder);
            ConfigureTimetableHeader(modelBuilder);
            ConfigureTimetableSlot(modelBuilder);
            ConfigureStudentBedAllocation(modelBuilder);
            ConfigureTeacherAttendanceCorrection(modelBuilder);
            ConfigureAdmission(modelBuilder);
            ConfigureDesignationMaster(modelBuilder);
            ConfigureStaffRelations(modelBuilder);

            ConfigureStandardTableNames(modelBuilder);
            ConfigureAcademicYear(modelBuilder);
            ConfigureStudent(modelBuilder);
            ConfigureStudentAttendanceSession(modelBuilder);
            ConfigureStudentAttendance(modelBuilder);
            ConfigureNewExamination(modelBuilder);
            ConfigureNewExamSubjectConfig(modelBuilder);
            ConfigureNewExamTimetableSlot(modelBuilder);
            ConfigureNewGradingScaleRule(modelBuilder);
            ConfigureNewStudentExamResult(modelBuilder);
            ConfigureNewStudentMarksEntry(modelBuilder);
        }

        private static void ConfigureTeacherAttendanceCorrection(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TeacherAttendanceCorrection>(entity =>
            {
                entity.ToTable("teacher_attendance_corrections");

                entity.HasKey(x => x.CorrectionId);

                entity.Property(x => x.AttendanceDate)
                    .HasColumnType("date")
                    .IsRequired();

                entity.Property(x => x.CurrentInTime)
                    .HasMaxLength(20);

                entity.Property(x => x.CurrentOutTime)
                    .HasMaxLength(20);

                entity.Property(x => x.RequestedInTime)
                    .HasMaxLength(20);

                entity.Property(x => x.RequestedOutTime)
                    .HasMaxLength(20);

                entity.Property(x => x.Reason)
                    .HasMaxLength(500)
                    .IsRequired();

                entity.Property(x => x.Status)
                    .HasMaxLength(20)
                    .HasDefaultValue("Pending")
                    .IsRequired();

                entity.Property(x => x.ApprovedRemarks)
                    .HasMaxLength(500);

                entity.Property(x => x.CreatedAt)
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnType("datetime");

                entity.HasIndex(x => new { x.StaffId, x.AttendanceDate })
                    .HasDatabaseName("ix_teacher_attendance_corrections_staff_date");

                entity.HasOne(x => x.Staff)
                    .WithMany()
                    .HasForeignKey(x => x.StaffId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private static void ConfigurePeriodSetting(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<PeriodSetting>(entity =>
            {
                entity.ToTable("period_settings");
                entity.HasKey(x => x.PeriodId);
                entity.Property(x => x.PeriodName).HasMaxLength(100).IsRequired();
                entity.Property(x => x.PeriodType).HasMaxLength(50).IsRequired();
            });
        }

        private static void ConfigureTeacherSubjectAssignment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TeacherSubjectAssignment>(entity =>
            {
                entity.ToTable("teacher_subject_assignments");
                entity.HasKey(x => x.AssignmentId);
                entity.HasIndex(x => new { x.ClassId, x.SectionId, x.SubjectId }).IsUnique();
                entity.HasOne(x => x.Staff)
                    .WithMany()
                    .HasForeignKey(x => x.StaffId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        private static void ConfigureTimetableHeader(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TimetableHeader>(entity =>
            {
                entity.ToTable("timetable_headers");
                entity.HasKey(x => x.HeaderId);
                entity.HasIndex(x => new { x.ClassId, x.SectionId, x.AcademicYear }).IsUnique();
            });
        }

        private static void ConfigureTimetableSlot(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TimetableSlot>(entity =>
            {
                entity.ToTable("timetable_slots");
                entity.HasKey(x => x.SlotId);
                entity.HasIndex(x => new { x.HeaderId, x.DayOfWeek });
                entity.HasIndex(x => new { x.TeacherId, x.DayOfWeek, x.StartTime, x.EndTime });
                entity.HasIndex(x => new { x.RoomNo, x.DayOfWeek, x.StartTime, x.EndTime });
            });
        }

        private static void ConfigureStudentBedAllocation(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StudentBedAllocation>(entity =>
            {
                entity.ToTable("student_bed_allocations");
                entity.HasKey(x => x.AllocationId);
                entity.Property(x => x.RegistrationNo).HasMaxLength(100).IsRequired(false);
                entity.Property(x => x.StudentName).HasMaxLength(150).IsRequired(false);
                entity.HasIndex(x => new { x.RegistrationNo, x.Status });
                entity.HasOne(x => x.Student)
                    .WithMany()
                    .HasForeignKey(x => x.StudentId)
                    .IsRequired(false)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.Hostel)
                    .WithMany(x => x.Allocations)
                    .HasForeignKey(x => x.HostelId)
                    .OnDelete(DeleteBehavior.Restrict);
                entity.HasOne(x => x.Room)
                    .WithMany(x => x.Allocations)
                    .HasForeignKey(x => x.RoomId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // =====================================================
        // User Configuration
        // =====================================================

        private static void ConfigureUser(ModelBuilder modelBuilder)
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

        private static void ConfigureRole(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Role>(entity =>
            {
                entity.HasKey(x => x.RoleId);
            });
        }

        // =====================================================
        // User Roles Configuration
        // =====================================================

        private static void ConfigureUserRoles(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<User>()
                .HasMany(user => user.Roles)
                .WithMany(role => role.Users)
                .UsingEntity<Dictionary<string, object>>(
                    "user_roles",

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
        // Admin Configuration
        // =====================================================

        private static void ConfigureAdmin(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Admin>(entity =>
            {
                entity.HasKey(x => x.AdminId);

                entity.HasIndex(x => x.MobileNumber)
                    .IsUnique();
            });
        }

        // =====================================================
        // Admin Roles Configuration
        // =====================================================

        private static void ConfigureAdminRoles(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Admin>()
                .HasMany(admin => admin.Roles)
                .WithMany(role => role.Admins)
                .UsingEntity<Dictionary<string, object>>(
                    "admin_roles_junction",

                    role => role
                        .HasOne<Role>()
                        .WithMany()
                        .HasForeignKey("RoleId"),

                    admin => admin
                        .HasOne<Admin>()
                        .WithMany()
                        .HasForeignKey("AdminId"));
        }

        // =====================================================
        // OTP Verification Configuration
        // =====================================================

        private static void ConfigureOtpVerification(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<OtpVerification>(entity =>
            {
                entity.HasKey(x => x.OtpId);

                entity.HasOne(x => x.User)
                    .WithMany(user => user.OtpVerifications)
                    .HasForeignKey(x => x.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Admin)
                    .WithMany(admin => admin.OtpVerifications)
                    .HasForeignKey(x => x.AdminId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        // =====================================================
        // Department Configuration
        // =====================================================

        private static void ConfigureDepartment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Department>(entity =>
            {
                entity.ToTable("departments");

                entity.HasKey(x => x.DepartmentId);

                entity.Property(x => x.DepartmentId)
                    .HasColumnName("DepartmentId")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.DepartmentName)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.DepartmentCode)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.Description)
                    .HasMaxLength(500);

                entity.Property(x => x.Status)
                    .IsRequired()
                    .HasMaxLength(20)
                    .HasDefaultValue("Active");

                entity.HasIndex(x => x.DepartmentCode)
                    .IsUnique();
            });
        }

        // =====================================================
        // Subject Configuration
        // =====================================================

        private static void ConfigureSubject(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Subject>(entity =>
            {
                entity.ToTable("subjects");

                entity.HasKey(x => x.SubjectId);

                entity.Property(x => x.SubjectId)
                    .HasColumnName("SubjectId")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.SubjectCode)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.SubjectName)
                    .IsRequired()
                    .HasMaxLength(150);

                entity.Property(x => x.CourseCode)
                    .HasMaxLength(50);

                entity.Property(x => x.DepartmentId)
                    .HasColumnName("DepartmentId")
                    .IsRequired();

                entity.HasIndex(x => x.SubjectCode)
                    .IsUnique();

                entity.HasOne(x => x.Department)
                    .WithMany(x => x.Subjects)
                    .HasForeignKey(x => x.DepartmentId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // =====================================================
        // Class Grade Configuration
        // =====================================================

        private static void ConfigureClassGrade(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClassGrade>(entity =>
            {
                entity.ToTable("classes");

                entity.HasKey(x => x.ClassId);

                entity.Property(x => x.ClassId)
                    .HasColumnName("id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ClassName)
                    .HasColumnName("ClassName")
                    .HasMaxLength(100);

                entity.Property(x => x.CampusLocation)
                    .HasColumnName("CampusLocation")
                    .HasMaxLength(100)
                    .HasDefaultValue("Main Campus");

                entity.Property(x => x.AcademicYear)
                    .HasColumnName("AcademicYear")
                    .HasMaxLength(20)
                    .HasDefaultValue("2026-2027");

                entity.Property(x => x.DisplayOrder)
                    .HasColumnName("DisplayOrder");

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasMaxLength(20)
                    .HasDefaultValue("Active");

                entity.Property(x => x.Remarks)
                    .HasColumnName("remarks");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("CreatedAt")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at");
            });
        }

        // =====================================================
        // Class Subject Mapping Configuration
        // =====================================================

        private static void ConfigureClassSubjectMapping(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClassSubjectMapping>(entity =>
            {
                entity.ToTable("class_subject_mappings");
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id).HasColumnName("id");
                entity.Property(x => x.ClassId).HasColumnName("class_id");
                entity.Property(x => x.SubjectId).HasColumnName("subject_id");
                entity.Property(x => x.WeeklyPeriods).HasColumnName("weekly_periods").HasDefaultValue(5);

                entity.HasIndex(x => new { x.ClassId, x.SubjectId }).IsUnique();

                entity.HasOne(x => x.ClassGrade)
                    .WithMany(c => c.SubjectMappings)
                    .HasForeignKey(x => x.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Subject)
                    .WithMany(s => s.SubjectMappings)
                    .HasForeignKey(x => x.SubjectId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // =====================================================
        // Teacher Assignment Configuration
        // =====================================================

        private static void ConfigureTeacherAssignment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TeacherAssignment>(entity =>
            {
                entity.ToTable("teacher_assignments");
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Id).HasColumnName("id");
                entity.Property(x => x.ClassId).HasColumnName("class_id");
                entity.Property(x => x.SectionLetter).HasColumnName("section_letter").IsRequired().HasMaxLength(50);
                entity.Property(x => x.SubjectId).HasColumnName("subject_id");
                entity.Property(x => x.TeacherId).HasColumnName("teacher_id");
                entity.Property(x => x.Role).HasColumnName("role").IsRequired().HasMaxLength(50);
                entity.Property(x => x.Status).HasColumnName("status").IsRequired().HasMaxLength(50).HasDefaultValue("Active");

                entity.HasIndex(x => new { x.ClassId, x.SectionLetter, x.Role })
                    .HasDatabaseName("ux_teacher_assignments_class_sec_role")
                    .IsUnique();

                entity.HasOne(x => x.ClassGrade)
                    .WithMany(c => c.TeacherAssignments)
                    .HasForeignKey(x => x.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Subject)
                    .WithMany()
                    .HasForeignKey(x => x.SubjectId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(x => x.Teacher)
                    .WithMany()
                    .HasForeignKey(x => x.TeacherId)
                    .OnDelete(DeleteBehavior.Restrict);
            });
        }

        // =====================================================
        // Class Section Configuration
        // =====================================================

        private static void ConfigureClassSection(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClassSection>(entity =>
            {
                entity.ToTable("class_sections");
                entity.HasKey(x => x.SectionId);

                entity.Property(x => x.SectionId).HasColumnName("id");
                entity.Property(x => x.ClassId).HasColumnName("class_id");
                entity.Property(x => x.SectionName).HasColumnName("section_letter").IsRequired().HasMaxLength(50);
                entity.Property(x => x.Capacity).HasColumnName("capacity").HasDefaultValue(40);
                entity.Property(x => x.Status).HasColumnName("status").IsRequired().HasMaxLength(20).HasDefaultValue("Active");
                entity.Property(x => x.Remarks).HasColumnName("remarks");

                entity.HasIndex(x => new { x.ClassId, x.SectionName }).IsUnique();

                entity.HasOne(x => x.ClassGrade)
                    .WithMany(x => x.Sections)
                    .HasForeignKey(x => x.ClassId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        // =====================================================
        // Admission Application Configuration
        // =====================================================

        private static void ConfigureAdmissionApplication(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AdmissionApplication>(entity =>
            {
                entity.ToTable("admission_applications");
                entity.HasQueryFilter(x => !x.IsDeleted);
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

        private static void ConfigureTransportRoute(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TransportRoute>(entity =>
            {
                entity.ToTable("transport_routes");

                entity.HasKey(x => x.RouteId);

                entity.Property(x => x.RouteCode)
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(x => x.RouteName)
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.StartLocation)
                    .HasMaxLength(150);

                entity.Property(x => x.EndLocation)
                    .HasMaxLength(150);

                entity.Property(x => x.DistanceKm)
                    .HasPrecision(10, 2);

                entity.Property(x => x.Description)
                    .HasMaxLength(500);

                entity.Property(x => x.Status)
                    .HasDefaultValue(true);

                entity.Property(x => x.IsDeleted)
                    .HasDefaultValue(false);

                entity.HasIndex(x => x.RouteCode)
                    .IsUnique()
                    .HasDatabaseName("ux_transport_routes_route_code");
            });
        }

        // =====================================================
        // Pickup Point Configuration
        // =====================================================

        private static void ConfigurePickupPoint(ModelBuilder modelBuilder)
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

        private static void ConfigureTransportVehicle(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TransportVehicle>(entity =>
            {
                entity.ToTable("transport_vehicles");

                entity.HasKey(x => x.VehicleId);

                entity.HasIndex(x => x.VehicleNumber)
                    .IsUnique();

                entity.HasIndex(x => x.RegistrationNumber)
                    .IsUnique();

                entity.Property(x => x.VehicleNumber)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.RegistrationNumber)
                    .IsRequired()
                    .HasMaxLength(50);

                entity.Property(x => x.VehicleName)
                    .HasMaxLength(100);

                entity.Property(x => x.VehicleType)
                    .HasMaxLength(50);

                entity.Property(x => x.Manufacturer)
                    .HasMaxLength(100);

                entity.Property(x => x.Model)
                    .HasMaxLength(100);

                entity.Property(x => x.InsuranceNumber)
                    .HasMaxLength(100);

                entity.Property(x => x.Status)
                    .HasDefaultValue(true);

                entity.Property(x => x.IsDeleted)
                    .HasDefaultValue(false);
            });
        }

        // =====================================================
        // Transport Driver Configuration
        // =====================================================

        private static void ConfigureTransportDriver(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TransportDriver>(entity =>
            {
                entity.ToTable("transport_drivers");

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

        private static void ConfigureTransportVehicleAssignment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<TransportVehicleAssignment>(
                entity =>
                {
                    entity.ToTable("transport_vehicle_assignments");

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
                        .HasDatabaseName("IX_TVA_Vehicle_Driver_Route");

                    entity.Property(x => x.Status)
                        .HasDefaultValue(true);

                    entity.Property(x => x.IsDeleted)
                        .HasDefaultValue(false);
                });
        }

        // =====================================================
        // Student Transport Assignment Configuration
        // =====================================================

        private static void ConfigureStudentTransportAssignment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StudentTransportAssignment>(
                entity =>
                {
                    entity.ToTable("student_transport_assignments");

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

                    entity.Property(x => x.AdmissionNo)
                        .HasMaxLength(50)
                        .IsRequired();

                    entity.HasIndex(x => x.AdmissionNo);

                    entity.HasIndex(x => x.RouteId);

                    entity.HasIndex(x => x.PickupPointId);

                    entity.HasIndex(x => x.VehicleAssignmentId);

                    entity.HasIndex(x => new
                    {
                        x.AdmissionNo,
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
                        .HasDatabaseName("IX_STA_Route_Pickup_Vehicle");

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

        private static void ConfigureVehicleMaintenance(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<VehicleMaintenance>(entity =>
            {
                entity.ToTable(
                    "transport_vehicle_maintenances");

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
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasColumnType("datetime");

                entity.HasOne(x => x.Vehicle)
                    .WithMany()
                    .HasForeignKey(x => x.VehicleId)
                    .OnDelete(DeleteBehavior.Restrict);

                // Existing foreign-key index
                entity.HasIndex(x => x.VehicleId)
                    .HasDatabaseName("IX_transport_vehicle_maintenance_vehicle_id");

                // Transport report performance index
                entity.HasIndex(x => new
                {
                    x.VehicleId,
                    x.ServiceDate,
                    x.IsDeleted
                })
                    .HasDatabaseName("IX_VehMaint_Vehicle_ServiceDate_Deleted");
            });
        }

        private static void ConfigureStandardTableNames(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Branch>().ToTable("branches");
            modelBuilder.Entity<Staff>().ToTable("staff");
            modelBuilder.Entity<StaffDocument>().ToTable("staff_documents");
            modelBuilder.Entity<StaffAttendance>().ToTable("staff_attendances");
            modelBuilder.Entity<StaffQualification>().ToTable("staff_qualifications");
            modelBuilder.Entity<StaffExperience>().ToTable("staff_experiences");
            modelBuilder.Entity<LeaveTypeConfig>().ToTable("leave_type_configs");
            modelBuilder.Entity<LeaveApplication>().ToTable("leave_applications");
            modelBuilder.Entity<HolidayCalendar>().ToTable("holiday_calendars");
            modelBuilder.Entity<Homework>().ToTable("homeworks");
            modelBuilder.Entity<HomeworkSubmission>().ToTable("homework_submissions");
            modelBuilder.Entity<Circular>().ToTable("circulars");
            modelBuilder.Entity<Meeting>().ToTable("meetings");
            modelBuilder.Entity<SchoolEvent>().ToTable("school_events");
            modelBuilder.Entity<PayrollConfig>().ToTable("payroll_configs");
            modelBuilder.Entity<SalaryComponent>().ToTable("salary_components");
            modelBuilder.Entity<SalaryStructure>().ToTable("salary_structures");
            modelBuilder.Entity<SalaryStructureItem>().ToTable("salary_structure_items");
            modelBuilder.Entity<EmployeeSalaryAssignment>().ToTable("employee_salary_assignments");
            modelBuilder.Entity<Payslip>().ToTable("payslips");
            modelBuilder.Entity<HostelWarden>().ToTable("hostel_wardens");
            modelBuilder.Entity<HostelAttendance>().ToTable("hostel_attendances");
            modelBuilder.Entity<School>().ToTable("schools");
            modelBuilder.Entity<AuditLog>().ToTable("audit_logs");
            modelBuilder.Entity<SystemNotification>().ToTable("system_notifications");
            modelBuilder.Entity<Role>().ToTable("roles");
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<Admin>().ToTable("admins");
            modelBuilder.Entity<OtpVerification>().ToTable("otp_verifications");
            modelBuilder.Entity<HostelBlock>().ToTable("hostel_blocks");
            modelBuilder.Entity<RoomTypeConfig>().ToTable("room_type_configs");
            modelBuilder.Entity<RoomMaster>().ToTable("room_masters");
        }
        private static void ConfigureAcademicYear(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AcademicYear>(entity =>
            {
                entity.ToTable("academic_years");

                entity.HasKey(x => x.AcademicYearId);

                entity.Property(x => x.AcademicYearName)
                    .HasColumnName("academic_year_name")
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(x => x.StartDate)
                    .HasColumnName("start_date")
                    .HasColumnType("date");

                entity.Property(x => x.EndDate)
                    .HasColumnName("end_date")
                    .HasColumnType("date");

                entity.Property(x => x.IsCurrent)
                    .HasColumnName("is_current");

                entity.Property(x => x.IsActive)
                    .HasColumnName("is_active")
                    .HasDefaultValue(true);

                entity.Property(x => x.IsDeleted)
                    .HasColumnName("is_deleted")
                    .HasDefaultValue(false);

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasColumnType("datetime");

                entity.HasIndex(x => x.AcademicYearName)
                    .IsUnique();

                entity.HasQueryFilter(x => !x.IsDeleted);
            });
        }

        private static void ConfigureStudent(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Student>(entity =>
            {
                entity.ToTable("students");

                entity.HasKey(x => x.StudentId);

                entity.Property(x => x.StudentId)
                    .HasColumnName("student_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.AdmissionNumber)
                    .HasColumnName("admission_number")
                    .HasMaxLength(50)
                    .IsRequired();

                entity.Property(x => x.RollNumber)
                    .HasColumnName("roll_number")
                    .HasMaxLength(30)
                    .IsRequired();

                entity.Property(x => x.StudentName)
                    .HasColumnName("student_name")
                    .HasMaxLength(150)
                    .IsRequired();

                entity.Property(x => x.DateOfBirth)
                    .HasColumnName("date_of_birth")
                    .HasColumnType("date");

                entity.Property(x => x.Gender)
                    .HasColumnName("gender")
                    .HasMaxLength(20);

                entity.Property(x => x.FatherName)
                    .HasColumnName("father_name")
                    .HasMaxLength(150);

                entity.Property(x => x.FatherMobile)
                    .HasColumnName("father_mobile")
                    .HasMaxLength(20);

                entity.Property(x => x.MotherName)
                    .HasColumnName("mother_name")
                    .HasMaxLength(150);

                entity.Property(x => x.MotherMobile)
                    .HasColumnName("mother_mobile")
                    .HasMaxLength(20);

                entity.Property(x => x.Email)
                    .HasColumnName("email")
                    .HasMaxLength(150);

                entity.Property(x => x.MobileNumber)
                    .HasColumnName("mobile_number")
                    .HasMaxLength(20);

                entity.Property(x => x.Address)
                    .HasColumnName("address")
                    .HasMaxLength(500);

                entity.Property(x => x.BranchId)
                    .HasColumnName("branch_id")
                    .IsRequired();

                entity.Property(x => x.AcademicYearId)
                    .HasColumnName("academic_year_id")
                    .IsRequired();

                entity.Property(x => x.ClassId)
                    .HasColumnName("class_id")
                    .IsRequired();

                entity.Property(x => x.SectionId)
                    .HasColumnName("section_id")
                    .IsRequired();

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasMaxLength(20)
                    .HasDefaultValue("Active")
                    .IsRequired();

                entity.Property(x => x.IsDeleted)
                    .HasColumnName("is_deleted")
                    .HasDefaultValue(false);

                entity.Property(x => x.CreatedBy)
                    .HasColumnName("created_by");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");

                entity.Property(x => x.UpdatedBy)
                    .HasColumnName("updated_by");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasColumnType("datetime");

                entity.HasIndex(x => x.AdmissionNumber)
                    .IsUnique()
                    .HasDatabaseName("ux_students_admission_number");

                entity.HasIndex(x => new
                {
                    x.AcademicYearId,
                    x.ClassId,
                    x.SectionId,
                    x.RollNumber
                })
                    .IsUnique()
                    .HasDatabaseName("ux_students_year_class_section_roll");

                entity.HasIndex(x => new
                {
                    x.BranchId,
                    x.AcademicYearId,
                    x.ClassId,
                    x.SectionId,
                    x.Status
                })
                    .HasDatabaseName("ix_students_management_filter");

                entity.HasOne(x => x.Branch)
                    .WithMany(x => x.Students)
                    .HasForeignKey(x => x.BranchId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.AcademicYear)
                    .WithMany(x => x.Students)
                    .HasForeignKey(x => x.AcademicYearId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.ClassGrade)
                    .WithMany(x => x.Students)
                    .HasForeignKey(x => x.ClassId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(x => x.ClassSection)
                    .WithMany(x => x.Students)
                    .HasForeignKey(x => x.SectionId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasQueryFilter(x => !x.IsDeleted);
            });
        }
        private static void ConfigureStudentAttendanceSession(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StudentAttendanceSession>(entity =>
            {
                entity.ToTable("student_attendance_sessions");
                entity.HasKey(x => x.AttendanceSessionId);

                entity.Property(x => x.AttendanceDate)
                    .HasColumnType("date")
                    .IsRequired();

                entity.Property(x => x.IsLocked)
                    .HasDefaultValue(false);

                entity.Property(x => x.CreatedAt)
                    .HasColumnType("datetime(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnType("datetime(6)");

                entity.HasIndex(x => new
                {
                    x.AttendanceDate,
                    x.BranchId,
                    x.AcademicYearId,
                    x.ClassId,
                    x.SectionId,
                    x.SubjectId,
                    x.PeriodId
                })
                    .IsUnique()
                    .HasDatabaseName("UX_StudentAttendanceSession_Sheet");

                entity.HasIndex(x => x.BranchId);
                entity.HasIndex(x => x.AcademicYearId);
                entity.HasIndex(x => x.ClassId);
                entity.HasIndex(x => x.SectionId);
                entity.HasIndex(x => x.SubjectId);
                entity.HasIndex(x => x.PeriodId);
                entity.HasIndex(x => x.MarkedByStaffId);
            });
        }

        private static void ConfigureStudentAttendance(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StudentAttendance>(entity =>
            {
                entity.ToTable("student_attendances");
                entity.HasKey(x => x.Id);

                entity.Property(x => x.Status)
                    .HasMaxLength(20)
                    .IsRequired();

                entity.Property(x => x.Remarks)
                    .HasMaxLength(500);

                entity.Property(x => x.CreatedAt)
                    .HasColumnType("datetime(6)")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP(6)");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnType("datetime(6)");

                entity.HasIndex(x => new
                {
                    x.AttendanceSessionId,
                    x.StudentId
                })
                    .IsUnique()
                    .HasDatabaseName("UX_StudentAttendance_SessionStudent");

                entity.HasIndex(x => x.StudentId);

                entity.HasOne(x => x.AttendanceSession)
                    .WithMany(x => x.AttendanceRecords)
                    .HasForeignKey(x => x.AttendanceSessionId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private static void ConfigureAdmission(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Admission>(entity =>
            {
                entity.HasOne<ClassGrade>()
                    .WithMany()
                    .HasForeignKey(x => x.ClassId)
                    .OnDelete(DeleteBehavior.SetNull);
            });
        }

        private static void ConfigureDesignationMaster(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<SMS.Api.Models.AcademicManagement.DesignationMaster>(entity =>
            {
                entity.ToTable("designation_masters");
                entity.HasKey(x => x.Id);
                entity.Property(x => x.DesignationName).HasMaxLength(150).IsRequired();
                entity.Property(x => x.EmployeeCategory).HasMaxLength(50).IsRequired();
                entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
            });
        }

        private static void ConfigureStaffRelations(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<StaffQualification>(entity =>
            {
                entity.HasKey(x => x.Id);
                entity.HasOne(x => x.Staff)
                    .WithMany(s => s.Qualifications)
                    .HasForeignKey(x => x.StaffId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StaffExperience>(entity =>
            {
                entity.HasKey(x => x.Id);
                entity.HasOne(x => x.Staff)
                    .WithMany(s => s.ExperienceRecords)
                    .HasForeignKey(x => x.StaffId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private static void ConfigureNewExamination(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NewExamination>(entity =>
            {
                entity.ToTable("new_examinations");
                entity.HasKey(x => x.ExamId);

                entity.Property(x => x.ExamId)
                    .HasColumnName("exam_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ExamName)
                    .HasColumnName("exam_name")
                    .HasMaxLength(200)
                    .IsRequired();

                entity.Property(x => x.AssessmentType)
                    .HasColumnName("assessment_type")
                    .HasMaxLength(100);

                entity.Property(x => x.AcademicTerm)
                    .HasColumnName("academic_term")
                    .HasMaxLength(100);

                entity.Property(x => x.StartDate)
                    .HasColumnName("start_date")
                    .HasColumnType("date");

                entity.Property(x => x.EndDate)
                    .HasColumnName("end_date")
                    .HasColumnType("date");

                entity.Property(x => x.ApplicableClasses)
                    .HasColumnName("applicable_classes")
                    .HasMaxLength(500);

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasMaxLength(30)
                    .HasDefaultValue("Draft");

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
        }

        private static void ConfigureNewExamSubjectConfig(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NewExamSubjectConfig>(entity =>
            {
                entity.ToTable("new_exam_subject_configs");
                entity.HasKey(x => x.ConfigId);

                entity.Property(x => x.ConfigId)
                    .HasColumnName("config_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ExamId)
                    .HasColumnName("exam_id");

                entity.Property(x => x.ClassName)
                    .HasColumnName("class_name")
                    .HasMaxLength(100);

                entity.Property(x => x.SubjectCode)
                    .HasColumnName("subject_code")
                    .HasMaxLength(50);

                entity.Property(x => x.SubjectName)
                    .HasColumnName("subject_name")
                    .HasMaxLength(150);

                entity.Property(x => x.IsActive)
                    .HasColumnName("is_active")
                    .HasDefaultValue(true);

                entity.Property(x => x.MaxMarks)
                    .HasColumnName("max_marks")
                    .HasPrecision(10, 2)
                    .HasDefaultValue(100m);

                entity.Property(x => x.PassMarks)
                    .HasColumnName("pass_marks")
                    .HasPrecision(10, 2)
                    .HasDefaultValue(35m);

                entity.HasOne<NewExamination>()
                    .WithMany(e => e.SubjectConfigs)
                    .HasForeignKey(x => x.ExamId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(x => new { x.ExamId, x.ClassName, x.SubjectCode })
                    .HasDatabaseName("ix_new_exam_subject_configs_exam_class_subject");
            });
        }

        private static void ConfigureNewExamTimetableSlot(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NewExamTimetableSlot>(entity =>
            {
                entity.ToTable("new_exam_timetable_slots");
                entity.HasKey(x => x.SlotId);

                entity.Property(x => x.SlotId)
                    .HasColumnName("slot_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ExamId)
                    .HasColumnName("exam_id");

                entity.Property(x => x.ClassName)
                    .HasColumnName("class_name")
                    .HasMaxLength(100);

                entity.Property(x => x.SectionName)
                    .HasColumnName("section_name")
                    .HasMaxLength(100);

                entity.Property(x => x.SubjectCode)
                    .HasColumnName("subject_code")
                    .HasMaxLength(50);

                entity.Property(x => x.SubjectName)
                    .HasColumnName("subject_name")
                    .HasMaxLength(150);

                entity.Property(x => x.TotalMarks)
                    .HasColumnName("total_marks");

                entity.Property(x => x.ExamDate)
                    .HasColumnName("exam_date")
                    .HasColumnType("date");

                entity.Property(x => x.TimeSlot)
                    .HasColumnName("time_slot")
                    .HasMaxLength(100);

                entity.Property(x => x.Duration)
                    .HasColumnName("duration")
                    .HasMaxLength(50);

                entity.Property(x => x.RoomHall)
                    .HasColumnName("room_hall")
                    .HasMaxLength(100);

                entity.Property(x => x.InvigilatorFaculty)
                    .HasColumnName("invigilator_faculty")
                    .HasMaxLength(150);

                entity.Property(x => x.CreatedAt)
                    .HasColumnName("created_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
        }

        private static void ConfigureNewGradingScaleRule(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NewGradingScaleRule>(entity =>
            {
                entity.ToTable("new_grading_scale_rules");
                entity.HasKey(x => x.RuleId);

                entity.Property(x => x.RuleId)
                    .HasColumnName("rule_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ExamType)
                    .HasColumnName("exam_type")
                    .HasMaxLength(100)
                    .HasDefaultValue("All");

                entity.Property(x => x.Grade)
                    .HasColumnName("grade")
                    .HasMaxLength(10);

                entity.Property(x => x.MinMarks)
                    .HasColumnName("min_marks")
                    .HasPrecision(10, 2);

                entity.Property(x => x.MaxMarks)
                    .HasColumnName("max_marks")
                    .HasPrecision(10, 2);

                entity.Property(x => x.Gpa)
                    .HasColumnName("gpa")
                    .HasPrecision(4, 2);

                entity.Property(x => x.PassFail)
                    .HasColumnName("pass_fail")
                    .HasMaxLength(10)
                    .HasDefaultValue("PASS");

                entity.Property(x => x.Remarks)
                    .HasColumnName("remarks")
                    .HasMaxLength(200);

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
        }

        private static void ConfigureNewStudentExamResult(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NewStudentExamResult>(entity =>
            {
                entity.ToTable("new_student_exam_results");
                entity.HasKey(x => x.ResultId);

                entity.Property(x => x.ResultId)
                    .HasColumnName("result_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ExamId).HasColumnName("exam_id");
                entity.Property(x => x.StudentId).HasColumnName("student_id");
                entity.Property(x => x.ClassName).HasColumnName("class_name").HasMaxLength(100);
                entity.Property(x => x.SectionName).HasColumnName("section_name").HasMaxLength(100);
                entity.Property(x => x.RollNo).HasColumnName("roll_no").HasMaxLength(50);
                entity.Property(x => x.AdmissionNo).HasColumnName("admission_no").HasMaxLength(50);
                entity.Property(x => x.StudentName).HasColumnName("student_name").HasMaxLength(200);

                entity.Property(x => x.TotalMarksObtained)
                    .HasColumnName("total_marks_obtained")
                    .HasPrecision(10, 2);

                entity.Property(x => x.TotalMaxMarks)
                    .HasColumnName("total_max_marks")
                    .HasPrecision(10, 2);

                entity.Property(x => x.Percentage)
                    .HasColumnName("percentage")
                    .HasPrecision(6, 2);

                entity.Property(x => x.Grade).HasColumnName("grade").HasMaxLength(10);
                entity.Property(x => x.Rank).HasColumnName("rank");
                entity.Property(x => x.ResultStatus).HasColumnName("result_status").HasMaxLength(20);

                entity.Property(x => x.CalculatedAt)
                    .HasColumnName("calculated_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
        }

        private static void ConfigureNewStudentMarksEntry(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<NewStudentMarksEntry>(entity =>
            {
                entity.ToTable("new_student_marks_entries");
                entity.HasKey(x => x.EntryId);

                entity.Property(x => x.EntryId)
                    .HasColumnName("entry_id")
                    .ValueGeneratedOnAdd();

                entity.Property(x => x.ExamId).HasColumnName("exam_id");
                entity.Property(x => x.SubjectCode).HasColumnName("subject_code").HasMaxLength(50);
                entity.Property(x => x.SubjectName).HasColumnName("subject_name").HasMaxLength(150);
                entity.Property(x => x.ClassName).HasColumnName("class_name").HasMaxLength(100);
                entity.Property(x => x.SectionName).HasColumnName("section_name").HasMaxLength(100);
                entity.Property(x => x.RollNo).HasColumnName("roll_no").HasMaxLength(50);
                entity.Property(x => x.AdmissionNo).HasColumnName("admission_no").HasMaxLength(50);
                entity.Property(x => x.StudentName).HasColumnName("student_name").HasMaxLength(200);

                entity.Property(x => x.AttendanceStatus)
                    .HasColumnName("attendance_status")
                    .HasMaxLength(20)
                    .HasDefaultValue("Present");

                entity.Property(x => x.MarksObtained)
                    .HasColumnName("marks_obtained")
                    .HasPrecision(10, 2);

                entity.Property(x => x.MaxMarks)
                    .HasColumnName("max_marks")
                    .HasPrecision(10, 2);

                entity.Property(x => x.Grade).HasColumnName("grade").HasMaxLength(10);

                entity.Property(x => x.EvaluatorRemarks)
                    .HasColumnName("evaluator_remarks")
                    .HasMaxLength(300);

                entity.Property(x => x.Status)
                    .HasColumnName("status")
                    .HasMaxLength(20)
                    .HasDefaultValue("Draft");

                entity.Property(x => x.UpdatedAt)
                    .HasColumnName("updated_at")
                    .HasColumnType("datetime")
                    .HasDefaultValueSql("CURRENT_TIMESTAMP");
            });
        }
    }
}
