using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;

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
        public DbSet<StudentAttendance> StudentAttendances { get; set; } = null!;
        public DbSet<LibraryBook> LibraryBooks { get; set; } = null!;
        public DbSet<LibraryIssueRecord> LibraryIssueRecords { get; set; } = null!;
        public DbSet<LeaveTypeConfig> LeaveTypeConfigs { get; set; } = null!;
        public DbSet<LeaveApplication> LeaveApplications { get; set; } = null!;
        public DbSet<HolidayCalendar> HolidayCalendars { get; set; } = null!;

        public DbSet<ClassGrade> Classes { get; set; } = null!;
        public DbSet<ClassSection> ClassSections { get; set; } = null!;
        public DbSet<ClassCurriculumSubject> ClassCurriculumSubjects { get; set; } = null!;
        public DbSet<AdmissionApplication> AdmissionApplications { get; set; } = null!;
        public DbSet<Admission> Admissions { get; set; } = null!;

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
        public DbSet<Payslip> Payslips { get; set; } = null!;

        // Examination & Invigilation Module
        public DbSet<ExamSchedule> ExamSchedules { get; set; } = null!;
        public DbSet<ExamInvigilatorAssignment> ExamInvigilatorAssignments { get; set; } = null!;
        public DbSet<QuestionPaper> QuestionPapers { get; set; } = null!;
        public DbSet<ExamMark> ExamMarks { get; set; } = null!;
        public DbSet<GradeConfiguration> GradeConfigurations { get; set; } = null!;
        public DbSet<ExamResult> ExamResults { get; set; } = null!;

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


        // =====================================================
        // Examination Module
        // =====================================================

        public DbSet<ExamMaster> ExamMasters => Set<ExamMaster>();

        public DbSet<ExamClass> ExamClasses => Set<ExamClass>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
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

            ConfigurePeriodSetting(modelBuilder);
            ConfigureTeacherSubjectAssignment(modelBuilder);
            ConfigureTimetableHeader(modelBuilder);
            ConfigureTimetableSlot(modelBuilder);
            ConfigureStudentBedAllocation(modelBuilder);

            ConfigureStandardTableNames(modelBuilder);
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
        // Class Curriculum Subject Configuration
        // =====================================================

        private static void ConfigureClassCurriculumSubject(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ClassCurriculumSubject>(entity =>
            {
                entity.ToTable("class_curriculum_subjects");
                entity.HasKey(x => new
                {
                    x.ClassId,
                    x.SubjectId
                });
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

                entity.HasIndex(x => new
                {
                    x.ClassId,
                    x.SectionName
                }).IsUnique();

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
        private static void ConfigureExamMaster(ModelBuilder modelBuilder)
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
                    .HasDatabaseName("ux_exam_title_branch_academic_year");

                entity.HasIndex(x => new
                {
                    x.BranchId,
                    x.AcademicYearId,
                    x.ExamStatus,
                    x.IsDeleted
                })
                    .HasDatabaseName("ix_exam_master_filter");
            });
        }

        private static void ConfigureExamClass(ModelBuilder modelBuilder)
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
                    .HasDatabaseName("ix_exam_classes_class_id");
            });
        }

        private static void ConfigureStandardTableNames(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Branch>().ToTable("branches");
            modelBuilder.Entity<Staff>().ToTable("staff");
            modelBuilder.Entity<StaffDocument>().ToTable("staff_documents");
            modelBuilder.Entity<StaffAttendance>().ToTable("staff_attendances");
            modelBuilder.Entity<LeaveTypeConfig>().ToTable("leave_type_configs");
            modelBuilder.Entity<LeaveApplication>().ToTable("leave_applications");
            modelBuilder.Entity<HolidayCalendar>().ToTable("holiday_calendars");
            modelBuilder.Entity<ClassGrade>().ToTable("classes");
            modelBuilder.Entity<Homework>().ToTable("homeworks");
            modelBuilder.Entity<HomeworkSubmission>().ToTable("homework_submissions");
            modelBuilder.Entity<Circular>().ToTable("circulars");
            modelBuilder.Entity<Meeting>().ToTable("meetings");
            modelBuilder.Entity<SchoolEvent>().ToTable("school_events");
            modelBuilder.Entity<PayrollConfig>().ToTable("payroll_configs");
            modelBuilder.Entity<SalaryComponent>().ToTable("salary_components");
            modelBuilder.Entity<SalaryStructure>().ToTable("salary_structures");
            modelBuilder.Entity<SalaryStructureItem>().ToTable("salary_structure_items");
            modelBuilder.Entity<Payslip>().ToTable("payslips");
            modelBuilder.Entity<ExamSchedule>().ToTable("exam_schedules");
            modelBuilder.Entity<ExamInvigilatorAssignment>().ToTable("exam_invigilator_assignments");
            modelBuilder.Entity<QuestionPaper>().ToTable("question_papers");
            modelBuilder.Entity<ExamMark>().ToTable("exam_marks");
            modelBuilder.Entity<GradeConfiguration>().ToTable("grade_configurations");
            modelBuilder.Entity<ExamResult>().ToTable("exam_results");
            modelBuilder.Entity<HostelWarden>().ToTable("hostel_wardens");
            modelBuilder.Entity<HostelAttendance>().ToTable("hostel_attendances");
            modelBuilder.Entity<School>().ToTable("schools");
            modelBuilder.Entity<AuditLog>().ToTable("audit_logs");
            modelBuilder.Entity<SystemNotification>().ToTable("system_notifications");
            modelBuilder.Entity<Role>().ToTable("roles");
            modelBuilder.Entity<User>().ToTable("users");
            modelBuilder.Entity<OtpVerification>().ToTable("otp_verifications");
            modelBuilder.Entity<HostelBlock>().ToTable("hostel_blocks");
            modelBuilder.Entity<RoomTypeConfig>().ToTable("room_type_configs");
            modelBuilder.Entity<RoomMaster>().ToTable("room_masters");
            modelBuilder.Entity<Admission>().ToTable("students");
        }
    }
}