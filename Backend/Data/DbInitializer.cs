using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SMS.Api.Data
{
    public static class DbInitializer
    {
        private record ColumnMetadata(string Table, string Column);

        private class ColumnMetadataComparer : IEqualityComparer<ColumnMetadata>
        {
            public bool Equals(ColumnMetadata? x, ColumnMetadata? y)
            {
                if (x == null && y == null) return true;
                if (x == null || y == null) return false;
                return string.Equals(x.Table, y.Table, StringComparison.OrdinalIgnoreCase) &&
                       string.Equals(x.Column, y.Column, StringComparison.OrdinalIgnoreCase);
            }

            public int GetHashCode(ColumnMetadata obj)
            {
                if (obj == null) return 0;
                return StringComparer.OrdinalIgnoreCase.GetHashCode(obj.Table) ^
                       StringComparer.OrdinalIgnoreCase.GetHashCode(obj.Column);
            }
        }

        public static async Task InitializeAsync(AppDbContext context, ILogger logger)
        {
            // =========================================================
            // 1. DATABASE CONNECTIVITY AND ACCESSIBILITY CHECK
            // =========================================================
            bool isDbReachable = false;
            try
            {
                var dbConnection = context.Database.GetDbConnection();
                var connStr = dbConnection.ConnectionString;
                if (!connStr.Contains("Connection Timeout", StringComparison.OrdinalIgnoreCase) && 
                    !connStr.Contains("Connect Timeout", StringComparison.OrdinalIgnoreCase))
                {
                    connStr += ";Connection Timeout=2;";
                }
                using var conn = new MySqlConnector.MySqlConnection(connStr);
                await conn.OpenAsync();
                isDbReachable = true;
                await conn.CloseAsync();
            }
            catch (Exception ex)
            {
                logger.LogWarning($"[Database Connection Check] Database is unreachable. Skipping migrations and seeds. Error: {ex.Message}");
                return;
            }

            if (!isDbReachable) return;

            // Ensure EF Core Database and Schema are Created
            try { await context.Database.EnsureCreatedAsync(); } catch { }

            // =========================================================
            // 2. SCHEMA METADATA PRE-FETCH FOR LIGHTWEIGHT RUN
            // =========================================================
            var existingTables = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var existingColumns = new HashSet<ColumnMetadata>(new ColumnMetadataComparer());

            try
            {
                var conn = context.Database.GetDbConnection();
                var wasOpen = conn.State == System.Data.ConnectionState.Open;
                if (!wasOpen) await conn.OpenAsync();

                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE();";
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            existingTables.Add(reader.GetString(0));
                        }
                    }

                    cmd.CommandText = "SELECT TABLE_NAME, COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE();";
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            existingColumns.Add(new ColumnMetadata(reader.GetString(0), reader.GetString(1)));
                        }
                    }
                }

                if (!wasOpen) await conn.CloseAsync();
            }
            catch (Exception ex)
            {
                logger.LogWarning($"[DbInitializer] Failed to pre-fetch table/column metadata: {ex.Message}. Proceeding with fallback check.");
            }

            // Run unconditional schema check for hostel_wardens before the fast bypass
            try
            {
                var conn = context.Database.GetDbConnection();
                var wasOpen = conn.State == System.Data.ConnectionState.Open;
                if (!wasOpen) await conn.OpenAsync();

                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_wardens' AND COLUMN_NAME = 'Designation';";
                    var hasDesignation = Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;

                    if (!hasDesignation)
                    {
                        cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'hostel_wardens';";
                        var hasTable = Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
                        if (hasTable)
                        {
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` DROP FOREIGN KEY `fk_wardens_block`;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` CHANGE COLUMN `FullName` `WardenName` varchar(150) NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` CHANGE COLUMN `Email` `EmailAddress` varchar(150) NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` CHANGE COLUMN `BlockId` `HostelId` int NOT NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` ADD COLUMN `AlternateMobile` varchar(20) NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` ADD COLUMN `Designation` varchar(50) NOT NULL DEFAULT 'Warden';"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` ADD COLUMN `CreatedAt` datetime(6) NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` ADD CONSTRAINT `FK_hostel_wardens_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE CASCADE;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `hostel_wardens` ADD CONSTRAINT `FK_hostel_wardens_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`);"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            
                            logger.LogInformation("[DbInitializer] Successfully migrated hostel_wardens table to include new schema columns.");
                        }
                    }

                    // Check class_sections table migration
                    cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'class_sections' AND COLUMN_NAME = 'id';";
                    var hasClassSectionsId = Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;

                    if (!hasClassSectionsId)
                    {
                        cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'class_sections';";
                        var hasTable = Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
                        if (hasTable)
                        {
                            try { cmd.CommandText = "SET FOREIGN_KEY_CHECKS = 0;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `class_sections` CHANGE COLUMN `SectionId` `id` int NOT NULL AUTO_INCREMENT;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `class_sections` CHANGE COLUMN `AcademicClassId` `class_id` int NOT NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `class_sections` CHANGE COLUMN `SectionName` `section_letter` varchar(50) NOT NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `class_sections` ADD COLUMN `capacity` int NOT NULL DEFAULT 40;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `class_sections` ADD COLUMN `status` varchar(20) NOT NULL DEFAULT 'Active';"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `class_sections` ADD COLUMN `remarks` longtext NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "ALTER TABLE `class_sections` ADD COLUMN `room_no` varchar(100) NULL;"; await cmd.ExecuteNonQueryAsync(); } catch { }
                            try { cmd.CommandText = "SET FOREIGN_KEY_CHECKS = 1;"; await cmd.ExecuteNonQueryAsync(); } catch { }

                            logger.LogInformation("[DbInitializer] Successfully migrated class_sections table to include new schema columns.");
                        }
                    }
                }

                if (!wasOpen) await conn.CloseAsync();
            }
            catch (Exception ex)
            {
                logger.LogWarning($"[DbInitializer] Failed running unconditional hostel_wardens schema check: {ex.Message}");
            }

            // =========================================================
            // 3. FAST SHIFT BYPASS IF FULLY INITIALIZED
            // =========================================================
            var coreTables = new[] { "users", "roles", "user_roles", "admins", "departments", "subjects", "classes", "class_sections", "staff", "transport_vehicles", "transport_routes", "transport_drivers" };
            bool allCoreTablesExist = coreTables.All(t => existingTables.Contains(t));
            if (allCoreTablesExist)
            {
                try
                {
                    // Check if roles are populated and at least one admin exists
                    bool hasRoles = await context.Roles.AnyAsync();
                    bool hasAdmins = await context.Admins.AnyAsync();
                    if (hasRoles && hasAdmins)
                    {
                        logger.LogInformation("[DbInitializer] Database is already initialized. Skipping DDL, schema upgrades, and seeds.");
                        return;
                    }
                }
                catch (Exception ex)
                {
                    logger.LogWarning($"[DbInitializer] Fast bypass check errored: {ex.Message}. Proceeding with full schema inspection.");
                }
            }

            logger.LogInformation("[DbInitializer] Starting database schema validation and seeding...");

            // =========================================================
            // 4. DYNAMIC UPGRADES AND TRIGGER CREATION
            // =========================================================
            try
            {
                var dbConnection = context.Database.GetDbConnection();
                var dbName = dbConnection.Database;
                var wasOpen = dbConnection.State == System.Data.ConnectionState.Open;
                if (!wasOpen) await dbConnection.OpenAsync();

                // Upgrade/Recreate trigger
                using (var cmd = dbConnection.CreateCommand())
                {
                    try
                    {
                        cmd.CommandText = "DROP TRIGGER IF EXISTS `trg_admissionapplications_before_insert`;";
                        await cmd.ExecuteNonQueryAsync();

                        cmd.CommandText = "DROP TRIGGER IF EXISTS `trg_admission_applications_before_insert`;";
                        await cmd.ExecuteNonQueryAsync();

                        cmd.CommandText = @"
                            CREATE TRIGGER `trg_admission_applications_before_insert` BEFORE INSERT ON `admission_applications`
                            FOR EACH ROW
                            BEGIN
                                DECLARE max_num INT;
                                SELECT COALESCE(MAX(CAST(SUBSTRING(RegistrationNo, 5) AS UNSIGNED)), 1000)
                                INTO max_num
                                FROM `admission_applications`
                                WHERE RegistrationNo LIKE 'REG-%';
                                SET NEW.RegistrationNo = CONCAT('REG-', max_num + 1);
                            END;";
                        await cmd.ExecuteNonQueryAsync();
                        logger.LogInformation("[DbInitializer] Recreated trigger `trg_admission_applications_before_insert` successfully.");
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning($"[DbInitializer] Trigger creation warning: {ex.Message}");
                    }
                }

                if (!wasOpen) await dbConnection.CloseAsync();
            }
            catch (Exception ex)
            {
                logger.LogError($"[DbInitializer] Dynamic upgrades failed: {ex.Message}");
            }

            // =========================================================
            // 5. TABLE SCHEMAS DDL BLOCK
            // =========================================================
            var tableSqls = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
            {
                { "departments", @"CREATE TABLE IF NOT EXISTS `departments` (
                    `DepartmentId` int NOT NULL AUTO_INCREMENT,
                    `DepartmentName` varchar(150) NOT NULL,
                    `DepartmentCode` varchar(50) NOT NULL,
                    `Description` varchar(500) NULL,
                    `Status` varchar(20) NOT NULL DEFAULT 'Active',
                    `CreatedDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`DepartmentId`),
                    UNIQUE KEY `ux_departments_code` (`DepartmentCode`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "subjects", @"CREATE TABLE IF NOT EXISTS `subjects` (
                    `SubjectId` int NOT NULL AUTO_INCREMENT,
                    `SubjectCode` varchar(50) NOT NULL,
                    `SubjectName` varchar(150) NOT NULL,
                    `CourseCode` varchar(50) NULL,
                    `DepartmentId` int NOT NULL DEFAULT 1,
                    PRIMARY KEY (`SubjectId`),
                    UNIQUE KEY `ux_subjects_code` (`SubjectCode`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "classes", @"CREATE TABLE IF NOT EXISTS `classes` (
                    `ClassId` int NOT NULL AUTO_INCREMENT,
                    `ClassName` varchar(100) NOT NULL,
                    PRIMARY KEY (`ClassId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "class_sections", @"CREATE TABLE IF NOT EXISTS `class_sections` (
                    `id` int NOT NULL AUTO_INCREMENT,
                    `section_letter` varchar(50) NOT NULL,
                    `class_id` int NOT NULL,
                    `capacity` int NOT NULL DEFAULT 40,
                    `status` varchar(20) NOT NULL DEFAULT 'Active',
                    `remarks` longtext NULL,
                    `room_no` varchar(100) NULL,
                    PRIMARY KEY (`id`),
                    CONSTRAINT `FK_class_sections_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`ClassId`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "class_curriculum_subjects", @"CREATE TABLE IF NOT EXISTS `class_curriculum_subjects` (
                    `ClassId` int NOT NULL,
                    `SubjectId` int NOT NULL,
                    PRIMARY KEY (`ClassId`, `SubjectId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "staff", @"CREATE TABLE IF NOT EXISTS `staff` (
                    `StaffId` int NOT NULL AUTO_INCREMENT,
                    `EmployeeId` varchar(50) NOT NULL,
                    `FirstName` varchar(100) NOT NULL,
                    `LastName` varchar(100) NOT NULL,
                    `Email` varchar(150) NULL,
                    `Phone` varchar(20) NULL,
                    `Designation` varchar(100) NULL,
                    `Department` varchar(100) NULL,
                    `MonthlySalary` decimal(18,2) NOT NULL DEFAULT 0,
                    `DateOfBirth` datetime NULL,
                    `IsActive` tinyint(1) NOT NULL DEFAULT 1,
                    PRIMARY KEY (`StaffId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "transport_vehicles", @"CREATE TABLE IF NOT EXISTS `transport_vehicles` (
                    `VehicleId` bigint NOT NULL AUTO_INCREMENT,
                    `VehicleNumber` varchar(50) NOT NULL,
                    `RegistrationNumber` varchar(50) NOT NULL,
                    `VehicleName` varchar(100) NOT NULL DEFAULT '',
                    `VehicleType` varchar(50) NOT NULL DEFAULT 'Bus',
                    `Manufacturer` varchar(100) NOT NULL DEFAULT '',
                    `Model` varchar(100) NOT NULL DEFAULT '',
                    `InsuranceNumber` varchar(100) NOT NULL DEFAULT '',
                    `InsuranceExpiry` datetime(6) NULL,
                    `PollutionExpiry` datetime(6) NULL,
                    `FitnessExpiry` datetime(6) NULL,
                    `Capacity` int NOT NULL DEFAULT 40,
                    `IsAC` tinyint(1) NOT NULL DEFAULT 1,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    PRIMARY KEY (`VehicleId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "transport_routes", @"CREATE TABLE IF NOT EXISTS `transport_routes` (
                    `RouteId` bigint NOT NULL AUTO_INCREMENT,
                    `RouteCode` varchar(30) NOT NULL,
                    `RouteName` varchar(150) NOT NULL,
                    `StartLocation` varchar(150) NOT NULL DEFAULT '',
                    `EndLocation` varchar(150) NOT NULL DEFAULT '',
                    `PickupPoint` varchar(255) NULL,
                    `DropPoint` varchar(255) NULL,
                    `DistanceKm` decimal(10,2) NOT NULL DEFAULT 0,
                    `EstimatedDurationMinutes` int NOT NULL DEFAULT 30,
                    `Description` varchar(500) NULL,
                    `MonthlyFee` decimal(18,2) NOT NULL DEFAULT 0,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    `VehicleId` bigint NULL,
                    PRIMARY KEY (`RouteId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "transport_drivers", @"CREATE TABLE IF NOT EXISTS `transport_drivers` (
                    `DriverId` bigint NOT NULL AUTO_INCREMENT,
                    `DriverName` varchar(100) NOT NULL,
                    `LicenceNumber` varchar(50) NOT NULL,
                    `LicenceExpiry` datetime(6) NULL,
                    `MobileNumber` varchar(20) NOT NULL,
                    `AlternateMobileNumber` varchar(20) NOT NULL DEFAULT '',
                    `Address` varchar(255) NOT NULL DEFAULT '',
                    `BloodGroup` varchar(10) NOT NULL DEFAULT '',
                    `EmergencyContactName` varchar(100) NOT NULL DEFAULT '',
                    `EmergencyContactNumber` varchar(20) NOT NULL DEFAULT '',
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    `AssignedVehicleId` bigint NULL,
                    PRIMARY KEY (`DriverId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "transport_pickup_points", @"CREATE TABLE IF NOT EXISTS `transport_pickup_points` (
                    `PickupPointId` bigint NOT NULL AUTO_INCREMENT,
                    `PointName` varchar(150) NOT NULL,
                    `Latitude` decimal(10,8) NULL,
                    `Longitude` decimal(11,8) NULL,
                    `Description` varchar(500) NULL,
                    `DistanceKm` decimal(10,2) NOT NULL DEFAULT 0,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    PRIMARY KEY (`PickupPointId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "transport_vehicle_assignments", @"CREATE TABLE IF NOT EXISTS `transport_vehicle_assignments` (
                    `AssignmentId` bigint NOT NULL AUTO_INCREMENT,
                    `VehicleId` bigint NOT NULL,
                    `RouteId` bigint NOT NULL,
                    `DriverId` bigint NOT NULL,
                    `AttendantId` bigint NOT NULL,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    `Shift` varchar(20) NULL,
                    PRIMARY KEY (`AssignmentId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "student_transport_assignments", @"CREATE TABLE IF NOT EXISTS `student_transport_assignments` (
                    `StudentAssignmentId` bigint NOT NULL AUTO_INCREMENT,
                    `StudentId` bigint NOT NULL,
                    `RouteId` bigint NOT NULL,
                    `PickupPointId` bigint NOT NULL,
                    `Status` tinyint(1) NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    `Remarks` varchar(255) NULL,
                    `AdmissionNo` varchar(50) NOT NULL DEFAULT '',
                    PRIMARY KEY (`StudentAssignmentId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "transport_vehicle_maintenances", @"CREATE TABLE IF NOT EXISTS `transport_vehicle_maintenances` (
                    `MaintenanceId` bigint NOT NULL AUTO_INCREMENT,
                    `VehicleId` bigint NOT NULL,
                    `MaintenanceType` varchar(50) NOT NULL,
                    `MaintenanceDate` datetime(6) NOT NULL,
                    `Description` varchar(500) NULL,
                    `Cost` decimal(18,2) NOT NULL DEFAULT 0,
                    `NextServiceDueDate` datetime(6) NULL,
                    `Status` varchar(30) NOT NULL DEFAULT 'Pending',
                    `CreatedBy` bigint NULL,
                    `UpdatedBy` bigint NULL,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `UpdatedAt` datetime(6) NULL,
                    PRIMARY KEY (`MaintenanceId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "hostel_blocks", @"CREATE TABLE IF NOT EXISTS `hostel_blocks` (
                    `BlockId` int NOT NULL AUTO_INCREMENT,
                    `BlockName` varchar(100) NOT NULL,
                    `Description` varchar(255) NULL,
                    `Status` varchar(20) NOT NULL DEFAULT 'Active',
                    PRIMARY KEY (`BlockId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "room_type_configs", @"CREATE TABLE IF NOT EXISTS `room_type_configs` (
                    `RoomTypeId` int NOT NULL AUTO_INCREMENT,
                    `TypeName` varchar(100) NOT NULL,
                    `BaseFee` decimal(18,2) NOT NULL,
                    `Description` varchar(255) NULL,
                    `Status` varchar(20) NOT NULL DEFAULT 'Active',
                    PRIMARY KEY (`RoomTypeId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "room_masters", @"CREATE TABLE IF NOT EXISTS `room_masters` (
                    `RoomId` int NOT NULL AUTO_INCREMENT,
                    `RoomNumber` varchar(50) NOT NULL,
                    `BlockId` int NOT NULL,
                    `RoomTypeId` int NOT NULL,
                    `FloorNo` int NOT NULL,
                    `TotalBeds` int NOT NULL,
                    `AvailableBeds` int NOT NULL,
                    `Status` varchar(20) NOT NULL DEFAULT 'Available',
                    PRIMARY KEY (`RoomId`),
                    CONSTRAINT `fk_rooms_block` FOREIGN KEY (`BlockId`) REFERENCES `hostel_blocks` (`BlockId`) ON DELETE CASCADE,
                    CONSTRAINT `fk_rooms_type` FOREIGN KEY (`RoomTypeId`) REFERENCES `room_type_configs` (`RoomTypeId`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "hostel_wardens", @"CREATE TABLE IF NOT EXISTS `hostel_wardens` (
                    `WardenId` int NOT NULL AUTO_INCREMENT,
                    `HostelId` int NOT NULL,
                    `StaffId` int NULL,
                    `WardenName` varchar(150) NULL,
                    `MobileNumber` varchar(20) NULL,
                    `AlternateMobile` varchar(20) NULL,
                    `EmailAddress` varchar(150) NULL,
                    `Designation` varchar(50) NOT NULL DEFAULT 'Warden',
                    `CreatedAt` datetime(6) NULL,
                    CONSTRAINT `PK_hostel_wardens` PRIMARY KEY (`WardenId`),
                    CONSTRAINT `FK_hostel_wardens_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE CASCADE,
                    CONSTRAINT `FK_hostel_wardens_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "student_bed_allocations", @"CREATE TABLE IF NOT EXISTS `student_bed_allocations` (
                    `AllocationId` int NOT NULL AUTO_INCREMENT,
                    `RoomId` int NOT NULL,
                    `BedNumber` varchar(20) NOT NULL,
                    `AllocationDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    `ReleaseDate` datetime NULL,
                    `MonthlyRent` decimal(18,2) NOT NULL,
                    `SecurityDeposit` decimal(18,2) NOT NULL,
                    `Status` varchar(20) NOT NULL DEFAULT 'Allocated',
                    `RegistrationNo` varchar(100) NULL,
                    `StudentName` varchar(150) NULL,
                    `StudentId` int NULL,
                    PRIMARY KEY (`AllocationId`),
                    CONSTRAINT `fk_allocations_room` FOREIGN KEY (`RoomId`) REFERENCES `room_masters` (`RoomId`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "hostel_attendances", @"CREATE TABLE IF NOT EXISTS `hostel_attendances` (
                    `AttendanceId` int NOT NULL AUTO_INCREMENT,
                    `AllocationId` int NOT NULL,
                    `AttendanceDate` datetime NOT NULL,
                    `Status` varchar(20) NOT NULL DEFAULT 'Present',
                    `Remarks` varchar(255) NULL,
                    `RecordedBy` varchar(100) NULL,
                    PRIMARY KEY (`AttendanceId`),
                    CONSTRAINT `fk_attendance_allocation` FOREIGN KEY (`AllocationId`) REFERENCES `student_bed_allocations` (`AllocationId`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "period_settings", @"CREATE TABLE IF NOT EXISTS `period_settings` (
                    `PeriodId` int NOT NULL AUTO_INCREMENT,
                    `PeriodName` varchar(100) NOT NULL,
                    `StartTime` time NOT NULL,
                    `EndTime` time NOT NULL,
                    `PeriodType` varchar(50) NOT NULL DEFAULT 'Teaching Period',
                    `DisplayOrder` int NOT NULL DEFAULT 1,
                    `IsDeleted` tinyint(1) NOT NULL DEFAULT 0,
                    PRIMARY KEY (`PeriodId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "teacher_subject_assignments", @"CREATE TABLE IF NOT EXISTS `teacher_subject_assignments` (
                    `AssignmentId` int NOT NULL AUTO_INCREMENT,
                    `ClassId` int NOT NULL,
                    `SectionId` int NOT NULL,
                    `SubjectId` int NOT NULL,
                    `StaffId` int NOT NULL,
                    PRIMARY KEY (`AssignmentId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "timetable_headers", @"CREATE TABLE IF NOT EXISTS `timetable_headers` (
                    `TimetableId` int NOT NULL AUTO_INCREMENT,
                    `ClassId` int NOT NULL,
                    `SectionId` int NOT NULL,
                    `AcademicYear` varchar(50) NOT NULL,
                    `Status` varchar(20) NOT NULL DEFAULT 'Draft',
                    `CreatedBy` varchar(100) NULL,
                    `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`TimetableId`),
                    UNIQUE KEY `ux_timetable_header` (`ClassId`,`SectionId`,`AcademicYear`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "timetable_slots", @"CREATE TABLE IF NOT EXISTS `timetable_slots` (
                    `SlotId` int NOT NULL AUTO_INCREMENT,
                    `TimetableId` int NOT NULL,
                    `DayOfWeek` varchar(20) NOT NULL,
                    `PeriodId` int NOT NULL,
                    `SubjectId` int NOT NULL,
                    `TeacherId` int NOT NULL,
                    PRIMARY KEY (`SlotId`),
                    CONSTRAINT `fk_slots_header` FOREIGN KEY (`TimetableId`) REFERENCES `timetable_headers` (`TimetableId`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "homeworks", @"CREATE TABLE IF NOT EXISTS `homeworks` (
                    `HomeworkId` int NOT NULL AUTO_INCREMENT,
                    `ClassName` varchar(150) NOT NULL DEFAULT 'Class 10-A',
                    `SubjectName` varchar(150) NOT NULL DEFAULT 'Mathematics',
                    `Title` varchar(255) NOT NULL DEFAULT 'Homework',
                    `Topic` varchar(255) NULL,
                    `Description` longtext NULL,
                    `DueDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `PublishedTo` varchar(100) NOT NULL DEFAULT 'Entire Class',
                    `Status` varchar(50) NOT NULL DEFAULT 'PUBLISHED',
                    `AttachmentFileName` varchar(255) NULL,
                    `AttachmentUrl` varchar(500) NULL,
                    `TeacherName` varchar(150) NOT NULL DEFAULT 'Teacher',
                    `SubmissionsCount` int NOT NULL DEFAULT 0,
                    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                    `ClassRoom` varchar(150) NOT NULL DEFAULT 'Class 10-A',
                    PRIMARY KEY (`HomeworkId`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "homework_submissions", @"CREATE TABLE IF NOT EXISTS `homework_submissions` (
                    `SubmissionId` int NOT NULL AUTO_INCREMENT,
                    `HomeworkId` int NOT NULL,
                    `StudentAdmissionNo` varchar(50) NOT NULL,
                    `StudentName` varchar(150) NOT NULL,
                    `SubmissionDate` datetime(6) NOT NULL,
                    `SubmittedFileName` varchar(255) NULL,
                    `SubmittedFileUrl` varchar(500) NULL,
                    `Status` varchar(50) NOT NULL DEFAULT 'Submitted',
                    `MarksObtained` decimal(10,2) NULL,
                    `Feedback` longtext NULL,
                    PRIMARY KEY (`SubmissionId`),
                    CONSTRAINT `fk_hw_submissions_homework` FOREIGN KEY (`HomeworkId`) REFERENCES `homeworks` (`HomeworkId`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" },

                { "user_roles", @"CREATE TABLE IF NOT EXISTS `user_roles` (
                    `UserId` int NOT NULL,
                    `RoleId` int NOT NULL,
                    PRIMARY KEY (`UserId`, `RoleId`),
                    CONSTRAINT `fk_user_roles_user` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE,
                    CONSTRAINT `fk_user_roles_role` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`RoleId`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;" }
            };

            foreach (var kvp in tableSqls)
            {
                if (!existingTables.Contains(kvp.Key))
                {
                    try
                    {
                        await context.Database.ExecuteSqlRawAsync(kvp.Value);
                        logger.LogInformation($"[DbInitializer] Created missing table `{kvp.Key}`.");
                    }
                    catch (Exception ex)
                    {
                        logger.LogError($"[DbInitializer] Failed to create table `{kvp.Key}`: {ex.Message}");
                    }
                }
            }

            // =========================================================
            // 6. COLUMN VERIFICATION & UPGRADES BLOCK
            // =========================================================
            void EnsureColumnExists(string table, string column, string columnDef)
            {
                var meta = new ColumnMetadata(table, column);
                if (existingColumns.Contains(meta))
                {
                    return; // Already exists, fast skip!
                }

                try
                {
                    context.Database.ExecuteSqlRaw($"ALTER TABLE `{table}` ADD COLUMN `{column}` {columnDef};");
                    logger.LogInformation($"[DbInitializer] Added column `{column}` to table `{table}`.");
                }
                catch (Exception ex)
                {
                    logger.LogError($"[DbInitializer] Error adding column `{column}` to table `{table}`: {ex.Message}");
                }
            }

            EnsureColumnExists("Subjects", "DepartmentId", "int NOT NULL DEFAULT 1");
            EnsureColumnExists("subjects", "DepartmentId", "int NOT NULL DEFAULT 1");
            EnsureColumnExists("transport_routes", "VehicleId", "bigint NULL");
            EnsureColumnExists("transport_routes", "PickupPoint", "varchar(255) NULL");
            EnsureColumnExists("transport_routes", "DropPoint", "varchar(255) NULL");
            EnsureColumnExists("transport_routes", "RouteName", "varchar(150) NULL");
            EnsureColumnExists("transport_routes", "RouteCode", "varchar(30) NULL");
            EnsureColumnExists("transport_routes", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
            EnsureColumnExists("transport_drivers", "AssignedVehicleId", "bigint NULL");
            EnsureColumnExists("transport_drivers", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
            EnsureColumnExists("transport_pickup_points", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
            EnsureColumnExists("transport_vehicle_assignments", "Shift", "varchar(20) NULL");
            EnsureColumnExists("transport_vehicle_assignments", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
            EnsureColumnExists("student_transport_assignments", "Remarks", "varchar(255) NULL");
            EnsureColumnExists("student_transport_assignments", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
            EnsureColumnExists("hostel_wardens", "StaffId", "int NULL");
            EnsureColumnExists("hostel_wardens", "WardenName", "varchar(150) NULL");
            EnsureColumnExists("hostel_wardens", "EmailAddress", "varchar(150) NULL");
            EnsureColumnExists("hostel_wardens", "HostelId", "int NOT NULL DEFAULT 1");
            EnsureColumnExists("hostel_wardens", "AlternateMobile", "varchar(20) NULL");
            EnsureColumnExists("hostel_wardens", "Designation", "varchar(50) NOT NULL DEFAULT 'Warden'");
            EnsureColumnExists("hostel_wardens", "CreatedAt", "datetime(6) NULL");
            EnsureColumnExists("admission_applications", "StudentType", "varchar(50) NOT NULL DEFAULT 'Day Scholar'");
            EnsureColumnExists("admission_applications", "AllocatedBedId", "varchar(50) NULL");
            EnsureColumnExists("admission_applications", "IsDeleted", "tinyint(1) NOT NULL DEFAULT 0");
            EnsureColumnExists("student_bed_allocations", "RegistrationNo", "varchar(100) NULL");
            EnsureColumnExists("student_bed_allocations", "StudentName", "varchar(150) NULL");
            EnsureColumnExists("student_bed_allocations", "StudentId", "int NULL");
            EnsureColumnExists("student_transport_assignments", "AdmissionNo", "varchar(50) NOT NULL DEFAULT ''");
            EnsureColumnExists("student_transport_assignments", "StudentId", "bigint NULL");
            EnsureColumnExists("transport_routes", "Description", "varchar(500) NULL");
            EnsureColumnExists("homeworks", "ClassRoom", "varchar(150) NOT NULL DEFAULT 'Class 10-A'");
            EnsureColumnExists("homeworks", "ClassName", "varchar(150) NOT NULL DEFAULT 'Class 10-A'");
            EnsureColumnExists("homeworks", "SubjectName", "varchar(150) NOT NULL DEFAULT 'Mathematics'");
            EnsureColumnExists("homeworks", "Title", "varchar(255) NOT NULL DEFAULT 'Homework'");
            EnsureColumnExists("homeworks", "Topic", "varchar(255) NULL");
            EnsureColumnExists("homeworks", "Description", "longtext NULL");
            EnsureColumnExists("homeworks", "DueDate", "datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            EnsureColumnExists("homeworks", "PublishedTo", "varchar(100) NOT NULL DEFAULT 'Entire Class'");
            EnsureColumnExists("homeworks", "Status", "varchar(50) NOT NULL DEFAULT 'PUBLISHED'");
            EnsureColumnExists("homeworks", "AttachmentFileName", "varchar(255) NULL");
            EnsureColumnExists("homeworks", "AttachmentUrl", "varchar(500) NULL");
            EnsureColumnExists("homeworks", "TeacherName", "varchar(150) NOT NULL DEFAULT 'Teacher'");
            EnsureColumnExists("homeworks", "SubmissionsCount", "int NOT NULL DEFAULT 0");
            EnsureColumnExists("homeworks", "CreatedAt", "datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)");
            EnsureColumnExists("staff", "ProfilePhoto", "longtext NULL");
            EnsureColumnExists("Staff", "ProfilePhoto", "longtext NULL");
            EnsureColumnExists("users", "SchoolId", "int NULL");

            var staffTables = new[] { "staff" };
            foreach (var tbl in staffTables)
            {
                EnsureColumnExists(tbl, "AccountHolderName", "varchar(150) NULL");
                EnsureColumnExists(tbl, "AccountNumber", "varchar(50) NULL");
                EnsureColumnExists(tbl, "BankName", "varchar(150) NULL");
                EnsureColumnExists(tbl, "BranchName", "varchar(150) NULL");
                EnsureColumnExists(tbl, "IfscCode", "varchar(50) NULL");
                EnsureColumnExists(tbl, "UpiId", "varchar(100) NULL");
                EnsureColumnExists(tbl, "Gender", "varchar(20) NULL");
                EnsureColumnExists(tbl, "ResidentialAddress", "varchar(500) NULL");
                EnsureColumnExists(tbl, "EmployeeCategory", "varchar(100) NULL");
                EnsureColumnExists(tbl, "JoiningDate", "datetime NULL");
                EnsureColumnExists(tbl, "Qualification", "varchar(150) NULL");
                EnsureColumnExists(tbl, "PrimarySubject", "varchar(150) NULL");
                EnsureColumnExists(tbl, "Specialization", "varchar(150) NULL");
                EnsureColumnExists(tbl, "SystemRole", "varchar(100) NULL");
                EnsureColumnExists(tbl, "CasualLeaveBalance", "int NOT NULL DEFAULT 10");
                EnsureColumnExists(tbl, "SickLeaveBalance", "int NOT NULL DEFAULT 10");
                EnsureColumnExists(tbl, "EarnedLeaveBalance", "int NOT NULL DEFAULT 15");
                EnsureColumnExists(tbl, "GrossSalary", "decimal(18,2) NULL");
                EnsureColumnExists(tbl, "NetSalary", "decimal(18,2) NULL");
                EnsureColumnExists(tbl, "SalaryStructureId", "int NULL");
                EnsureColumnExists(tbl, "SalaryStructureName", "varchar(150) NULL");
                EnsureColumnExists(tbl, "SalaryStructureEffectiveDate", "datetime NULL");
            }

            try
            {
                await context.Database.ExecuteSqlRawAsync("UPDATE `staff` SET `FirstName` = '' WHERE `FirstName` IS NULL;");
                await context.Database.ExecuteSqlRawAsync("UPDATE `staff` SET `LastName` = '' WHERE `LastName` IS NULL;");
                await context.Database.ExecuteSqlRawAsync("UPDATE `staff` SET `Email` = '' WHERE `Email` IS NULL;");
                await context.Database.ExecuteSqlRawAsync("UPDATE `staff` SET `EmployeeId` = CONCAT('EMP', `StaffId`) WHERE `EmployeeId` IS NULL OR `EmployeeId` = '';");
                await context.Database.ExecuteSqlRawAsync("UPDATE `staff` SET `EmployeeCategory` = 'Non-Teaching Staff' WHERE `Designation` LIKE '%Warden%' OR `Designation` LIKE '%Driver%' OR `Designation` LIKE '%Security%';");
                await context.Database.ExecuteSqlRawAsync("UPDATE `staff` SET `EmployeeCategory` = 'Teaching Staff' WHERE (`EmployeeCategory` IS NULL OR `EmployeeCategory` = '') AND (`Designation` LIKE '%Teacher%' OR `Designation` LIKE '%Faculty%' OR `Designation` LIKE '%Professor%' OR `Designation` LIKE '%Lead%' OR `Designation` LIKE '%Mathematics%' OR `Designation` LIKE '%Science%');");
                await context.Database.ExecuteSqlRawAsync("UPDATE `staff` SET `EmployeeCategory` = 'Non-Teaching Staff' WHERE `EmployeeCategory` IS NULL OR `EmployeeCategory` = '';");
                await context.Database.ExecuteSqlRawAsync("UPDATE `subjects` SET `SubjectCode` = CONCAT('SUB', `SubjectId`) WHERE `SubjectCode` IS NULL OR `SubjectCode` = '';");
                await context.Database.ExecuteSqlRawAsync("UPDATE `subjects` SET `SubjectName` = 'General Subject' WHERE `SubjectName` IS NULL OR `SubjectName` = '';");
            }
            catch (Exception ex)
            {
                logger.LogWarning($"[DbInitializer] Failed updates: {ex.Message}");
            }

            try
            {
                EnsureColumnExists("otp_verifications", "UserId", "int NULL");
                EnsureColumnExists("otp_verifications", "AdminId", "int NULL");
                
                bool constraintExists = false;
                try
                {
                    var conn = context.Database.GetDbConnection();
                    var connState = conn.State;
                    if (connState != System.Data.ConnectionState.Open) await conn.OpenAsync();
                    using (var cmd = conn.CreateCommand())
                    {
                        cmd.CommandText = "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = DATABASE() AND CONSTRAINT_NAME = 'fk_otp_admins' AND CONSTRAINT_TYPE = 'FOREIGN KEY';";
                        var result = await cmd.ExecuteScalarAsync();
                        if (result != null && Convert.ToInt32(result) > 0)
                        {
                            constraintExists = true;
                        }
                    }
                    if (connState != System.Data.ConnectionState.Open) await conn.CloseAsync();
                }
                catch { }

                if (!constraintExists)
                {
                    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `otp_verifications` ADD CONSTRAINT `fk_otp_admins` FOREIGN KEY (`AdminId`) REFERENCES `admins` (`AdminId`) ON DELETE CASCADE;"); } catch { }
                }

                var hasUsersTable = false;
                var hasUserRolesTable = false;
                try
                {
                    using var cmd = context.Database.GetDbConnection().CreateCommand();
                    var dbName = context.Database.GetDbConnection().Database;
                    cmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '{dbName}' AND TABLE_NAME = 'users'";
                    
                    var connState = context.Database.GetDbConnection().State;
                    if (connState != System.Data.ConnectionState.Open) await context.Database.GetDbConnection().OpenAsync();
                    
                    hasUsersTable = Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
                    
                    cmd.CommandText = $"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = '{dbName}' AND TABLE_NAME = 'user_roles'";
                    hasUserRolesTable = Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0;
                    
                    if (connState != System.Data.ConnectionState.Open) await context.Database.GetDbConnection().CloseAsync();
                }
                catch { }

                if (hasUsersTable)
                {
                    await context.Database.ExecuteSqlRawAsync(@"
                        INSERT INTO `admins` (`FullName`, `Email`, `MobileNumber`, `PasswordHash`, `Role`, `IsEmailVerified`, `IsMobileVerified`, `CreatedAt`, `SchoolId`)
                        SELECT `FullName`, `Email`, `MobileNumber`, `PasswordHash`, 'Admin', `IsEmailVerified`, `IsMobileVerified`, `CreatedAt`, `SchoolId`
                        FROM `users`
                        WHERE `Role` = 'Admin' AND `MobileNumber` NOT IN (SELECT `MobileNumber` FROM `admins`);");
                }

                if (hasUsersTable && hasUserRolesTable)
                {
                    await context.Database.ExecuteSqlRawAsync(@"
                        INSERT INTO `admin_roles_junction` (`AdminId`, `RoleId`)
                        SELECT a.`AdminId`, ur.`RoleId`
                        FROM `user_roles` ur
                        JOIN `users` u ON u.`UserId` = ur.`UserId`
                        JOIN `admins` a ON a.`MobileNumber` = u.`MobileNumber`
                        WHERE u.`Role` = 'Admin' AND NOT EXISTS (
                            SELECT 1 FROM `admin_roles_junction` arj WHERE arj.`AdminId` = a.`AdminId` AND arj.`RoleId` = ur.`RoleId`
                        );");

                    await context.Database.ExecuteSqlRawAsync(@"
                        DELETE ur
                        FROM `user_roles` ur
                        JOIN `users` u ON u.`UserId` = ur.`UserId`
                        WHERE u.`Role` = 'Admin';");
                }

                if (hasUsersTable)
                {
                    await context.Database.ExecuteSqlRawAsync("DELETE FROM `users` WHERE `Role` = 'Admin';");
                }

                // Migrate hostel_wardens old schema to new structure
                try
                {
                    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `hostel_wardens` DROP FOREIGN KEY `fk_wardens_block`;"); } catch { }
                    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `hostel_wardens` CHANGE COLUMN `FullName` `WardenName` varchar(150) NULL;"); } catch { }
                    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `hostel_wardens` CHANGE COLUMN `Email` `EmailAddress` varchar(150) NULL;"); } catch { }
                    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `hostel_wardens` CHANGE COLUMN `BlockId` `HostelId` int NOT NULL;"); } catch { }
                    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `hostel_wardens` ADD CONSTRAINT `FK_hostel_wardens_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE CASCADE;"); } catch { }
                    try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE `hostel_wardens` ADD CONSTRAINT `FK_hostel_wardens_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`);"); } catch { }
                }
                catch { }
            }
            catch (Exception ex)
            {
                logger.LogWarning($"[DbInitializer] Migration block error: {ex.Message}");
            }

            // Seeding has been removed per user request.
            logger.LogInformation("[DbInitializer] Database schema validation and setup completed successfully (seeding disabled).");
            return;

            // =========================================================
            // 7. ENTITY SEEDING
            // =========================================================
            
            // Seed Roles
            var defaultRoles = new[]
            {
                new Role { RoleName = "SuperAdmin", Description = "System Owner" },
                new Role { RoleName = "Admin", Description = "School Administrator" },
                new Role { RoleName = "Teacher", Description = "Teacher / Faculty" },
                new Role { RoleName = "Warden", Description = "Hostel Warden / Supervisor" },
                new Role { RoleName = "Student", Description = "Student Account" },
                new Role { RoleName = "Parent", Description = "Parent / Guardian" }
            };

            var existingRoles = await context.Roles.Select(r => r.RoleName).ToListAsync();
            foreach (var role in defaultRoles)
            {
                if (!existingRoles.Contains(role.RoleName, StringComparer.OrdinalIgnoreCase))
                {
                    await context.Roles.AddAsync(role);
                }
            }
            await context.SaveChangesAsync();

            var superAdminRole = await context.Roles.FirstOrDefaultAsync(x => x.RoleName == "SuperAdmin");
            var adminRole = await context.Roles.FirstOrDefaultAsync(x => x.RoleName == "Admin");

            // Seed Admin User
            const string adminEmail = "admin@pirnavschools.com";
            var adminUser = await context.Users.FirstOrDefaultAsync(x => x.Email == adminEmail);

            if (adminUser == null)
            {
                adminUser = new User
                {
                    FullName = "Dr. Eleanor Vance",
                    Email = adminEmail,
                    MobileNumber = "9876543210",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1234"),
                    Role = "Admin",
                    IsEmailVerified = true,
                    IsMobileVerified = true,
                    CreatedAt = DateTime.UtcNow
                };

                if (adminRole != null) adminUser.Roles.Add(adminRole);
                if (superAdminRole != null) adminUser.Roles.Add(superAdminRole);

                await context.Users.AddAsync(adminUser);
            }
            else
            {
                adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1234");
                adminUser.Role = "Admin";

                if (adminRole != null && adminUser.Roles.All(x => x.RoleName != "Admin"))
                {
                    adminUser.Roles.Add(adminRole);
                }
                if (superAdminRole != null && adminUser.Roles.All(x => x.RoleName != "SuperAdmin"))
                {
                    adminUser.Roles.Add(superAdminRole);
                }
            }
            await context.SaveChangesAsync();

            // Seed other portal users
            var teacherRole = await context.Roles.FirstOrDefaultAsync(x => x.RoleName == "Teacher");
            var studentRole = await context.Roles.FirstOrDefaultAsync(x => x.RoleName == "Student");
            var parentRole = await context.Roles.FirstOrDefaultAsync(x => x.RoleName == "Parent");

            var portalUsers = new[]
            {
                new { FullName = "Robert Teacher", Email = "teacher@pirnavschools.com", Mobile = "9876543221", Password = "Teacher@123", Role = teacherRole },
                new { FullName = "Arjun Student", Email = "student@pirnavschools.com", Mobile = "9876543222", Password = "Student@123", Role = studentRole },
                new { FullName = "Kumar Parent", Email = "parent@pirnavschools.com", Mobile = "9876543223", Password = "Parent@123", Role = parentRole }
            };

            foreach (var pu in portalUsers)
            {
                if (pu.Role == null) continue;
                var existingUser = await context.Users.FirstOrDefaultAsync(x => x.Email == pu.Email || x.MobileNumber == pu.Mobile);
                if (existingUser == null)
                {
                    var newUser = new User
                    {
                        FullName = pu.FullName,
                        Email = pu.Email,
                        MobileNumber = pu.Mobile,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(pu.Password),
                        Role = pu.Role.RoleName,
                        IsEmailVerified = true,
                        IsMobileVerified = true,
                        CreatedAt = DateTime.UtcNow
                    };
                    newUser.Roles.Add(pu.Role);
                    await context.Users.AddAsync(newUser);
                }
                else
                {
                    existingUser.Role = pu.Role.RoleName;
                    if (existingUser.Roles.All(x => x.RoleId != pu.Role.RoleId))
                    {
                        existingUser.Roles.Add(pu.Role);
                    }
                }
            }
            await context.SaveChangesAsync();

            // Seed Departments
            var departmentSeeds = new[]
            {
                new Department { DepartmentName = "Mathematics", DepartmentCode = "DEPT-MTH", Description = "Department of Mathematics", Status = "Active" },
                new Department { DepartmentName = "Science", DepartmentCode = "DEPT-SCI", Description = "Department of Science", Status = "Active" },
                new Department { DepartmentName = "Languages", DepartmentCode = "DEPT-LNG", Description = "Department of Languages", Status = "Active" }
            };

            var existingDepts = await context.Departments.Select(d => d.DepartmentCode).ToListAsync();
            foreach (var d in departmentSeeds)
            {
                if (!existingDepts.Contains(d.DepartmentCode, StringComparer.OrdinalIgnoreCase))
                {
                    await context.Departments.AddAsync(d);
                }
            }
            await context.SaveChangesAsync();

            // Seed Subjects
            var mathDept = await context.Departments.FirstOrDefaultAsync(x => x.DepartmentCode == "DEPT-MTH");
            var sciDept = await context.Departments.FirstOrDefaultAsync(x => x.DepartmentCode == "DEPT-SCI");
            var langDept = await context.Departments.FirstOrDefaultAsync(x => x.DepartmentCode == "DEPT-LNG");

            var subjectSeeds = new[]
            {
                new Subject { SubjectCode = "SUB-MTH10", SubjectName = "Algebra & Geometry", CourseCode = "MATH-10", DepartmentId = mathDept?.DepartmentId ?? 1 },
                new Subject { SubjectCode = "SUB-PHY10", SubjectName = "Physics", CourseCode = "PHY-10", DepartmentId = sciDept?.DepartmentId ?? 2 },
                new Subject { SubjectCode = "SUB-CHM10", SubjectName = "Chemistry", CourseCode = "CHEM-10", DepartmentId = sciDept?.DepartmentId ?? 2 },
                new Subject { SubjectCode = "SUB-ENG10", SubjectName = "English Literature", CourseCode = "ENG-10", DepartmentId = langDept?.DepartmentId ?? 3 }
            };

            var existingSubjects = await context.Subjects.Select(s => s.SubjectCode).ToListAsync();
            foreach (var s in subjectSeeds)
            {
                if (!existingSubjects.Contains(s.SubjectCode, StringComparer.OrdinalIgnoreCase))
                {
                    await context.Subjects.AddAsync(s);
                }
            }
            await context.SaveChangesAsync();

            // Seed Classes, Sections and Assignments
            var mathSubject = await context.Subjects.FirstOrDefaultAsync(x => x.SubjectCode == "SUB-MTH10");
            var defaultSubjectId = mathSubject?.SubjectId ?? 1;

            var staff1 = await context.Staff.FirstOrDefaultAsync(s => s.FirstName == "Robert" || s.StaffId == 1);
            var staff2 = await context.Staff.FirstOrDefaultAsync(s => s.FirstName == "Alice" || s.StaffId == 2);

            for (int classNumber = 1; classNumber <= 12; classNumber++)
            {
                var className = $"Class {classNumber}";
                var classGrade = await context.Classes.FirstOrDefaultAsync(x => x.ClassName == className);

                if (classGrade == null)
                {
                    classGrade = new ClassGrade { ClassName = className };
                    await context.Classes.AddAsync(classGrade);
                    await context.SaveChangesAsync();

                    if (classNumber == 1)
                    {
                        await context.ClassSections.AddAsync(new ClassSection { ClassId = classGrade.ClassId, SectionName = "A" });
                        if (staff1 != null)
                        {
                            await context.TeacherAssignments.AddAsync(new TeacherAssignment
                            {
                                ClassId = classGrade.ClassId,
                                SectionLetter = "A",
                                TeacherId = staff1.StaffId,
                                SubjectId = defaultSubjectId,
                                Role = "Class Teacher",
                                Status = "Active"
                            });
                        }
                    }
                    else if (classNumber == 2)
                    {
                        await context.ClassSections.AddAsync(new ClassSection { ClassId = classGrade.ClassId, SectionName = "A" });
                        if (staff2 != null)
                        {
                            await context.TeacherAssignments.AddAsync(new TeacherAssignment
                            {
                                ClassId = classGrade.ClassId,
                                SectionLetter = "A",
                                TeacherId = staff2.StaffId,
                                SubjectId = defaultSubjectId,
                                Role = "Class Teacher",
                                Status = "Active"
                            });
                        }
                    }
                    else if (classNumber == 9)
                    {
                        await context.ClassSections.AddRangeAsync(
                            new ClassSection { ClassId = classGrade.ClassId, SectionName = "A" },
                            new ClassSection { ClassId = classGrade.ClassId, SectionName = "B" }
                        );
                        if (staff1 != null)
                        {
                            await context.TeacherAssignments.AddAsync(new TeacherAssignment
                            {
                                ClassId = classGrade.ClassId,
                                SectionLetter = "A",
                                TeacherId = staff1.StaffId,
                                SubjectId = defaultSubjectId,
                                Role = "Class Teacher",
                                Status = "Active"
                            });
                        }
                        if (staff2 != null)
                        {
                            await context.TeacherAssignments.AddAsync(new TeacherAssignment
                            {
                                ClassId = classGrade.ClassId,
                                SectionLetter = "B",
                                TeacherId = staff2.StaffId,
                                SubjectId = defaultSubjectId,
                                Role = "Class Teacher",
                                Status = "Active"
                            });
                        }
                    }
                    await context.SaveChangesAsync();
                }
            }

            // Seed Admission Applications
            {
                var firstClass = await context.Classes.OrderBy(x => x.ClassId).FirstOrDefaultAsync();
                var class10 = await context.Classes.FirstOrDefaultAsync(x => x.ClassName == "Class 10");
                var class9 = await context.Classes.FirstOrDefaultAsync(x => x.ClassName == "Class 9");

                if (firstClass != null)
                {
                    var c10Id = class10?.ClassId ?? firstClass.ClassId;
                    var c9Id = class9?.ClassId ?? firstClass.ClassId;

                    var seedApps = new List<AdmissionApplication>
                    {
                        new AdmissionApplication { RegistrationNo = "REG-1001", FirstName = "Alexander", LastName = "Wright", DateOfBirth = new DateTime(2012, 8, 15), Gender = "Male", AppliedClassId = c10Id, BranchName = "North Branch", FatherName = "Robert Wright", FatherContact = "9876543210", Status = "Enrolled", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1002", FirstName = "Rahul", LastName = "Sharma", DateOfBirth = new DateTime(2012, 5, 15), Gender = "Male", AppliedClassId = c10Id, BranchName = "North Branch", FatherName = "Aman Sharma", FatherContact = "+1 (555) 019-2831", Status = "Rejected", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1003", FirstName = "Priya", LastName = "Patel", DateOfBirth = new DateTime(2012, 8, 22), Gender = "Female", AppliedClassId = c10Id, BranchName = "Main Campus", FatherName = "Rajesh Patel", FatherContact = "+1 (555) 019-3829", Status = "Deleted", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1004", FirstName = "Sneha", LastName = "Reddy", DateOfBirth = new DateTime(2013, 9, 28), Gender = "Female", AppliedClassId = c9Id, BranchName = "North Branch", FatherName = "Prasad Reddy", FatherContact = "+1 (555) 019-7832", Status = "Enrolled", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1005", FirstName = "Alex", LastName = "Wright", DateOfBirth = new DateTime(2000, 1, 9), Gender = "Male", AppliedClassId = c10Id, BranchName = "North Branch", FatherName = "Robert Wright", FatherContact = "9876543210", Status = "Pending", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1006", FirstName = "sample", LastName = "sample", DateOfBirth = new DateTime(2000, 1, 9), Gender = "Male", AppliedClassId = c10Id, BranchName = "West Campus", FatherName = "sample", FatherContact = "9999999999", Status = "Pending", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1007", FirstName = "Narendra", LastName = "Modi", DateOfBirth = new DateTime(1999, 12, 14), Gender = "Male", AppliedClassId = c10Id, BranchName = "North Branch", FatherName = "Damodardas", FatherContact = "8888888888", Status = "Pending", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1008", FirstName = "Gokul", LastName = "Raj", DateOfBirth = new DateTime(2016, 2, 1), Gender = "Male", AppliedClassId = c10Id, BranchName = "Main Campus", FatherName = "Shankar", FatherContact = "8998897887", Status = "Enrolled", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1009", FirstName = "Veera", LastName = "Garikapati", DateOfBirth = new DateTime(2004, 10, 26), Gender = "Male", AppliedClassId = c10Id, BranchName = "Hyderabad", FatherName = "Srinivasa Rao", FatherContact = "9581768555", Status = "Enrolled", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1010", FirstName = "nagaraj", LastName = "kamati", DateOfBirth = new DateTime(2011, 6, 15), Gender = "Male", AppliedClassId = c10Id, BranchName = "Main Campus", FatherName = "Basappa", FatherContact = "9999999999", Status = "Pending", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1011", FirstName = "nagaraj", LastName = "kamati", DateOfBirth = new DateTime(2011, 6, 15), Gender = "Male", AppliedClassId = firstClass.ClassId, BranchName = "Main Campus", FatherName = "Basappa", FatherContact = "9999999999", Status = "pending", CreatedAt = DateTime.UtcNow },
                        new AdmissionApplication { RegistrationNo = "REG-1012", FirstName = "Rahul", LastName = "Kumar", DateOfBirth = new DateTime(2011, 6, 15), Gender = "Male", AppliedClassId = c10Id, BranchName = "Main Campus", FatherName = "Rajesh", FatherContact = "9999999999", Status = "Deleted", CreatedAt = DateTime.UtcNow }
                    };

                    foreach (var seedApp in seedApps)
                    {
                        var existingApp = await context.AdmissionApplications.FirstOrDefaultAsync(x => x.RegistrationNo == seedApp.RegistrationNo);
                        if (existingApp == null)
                        {
                            await context.AdmissionApplications.AddAsync(seedApp);
                        }
                        else
                        {
                            existingApp.BranchName = seedApp.BranchName;
                            existingApp.Status = seedApp.Status;
                            existingApp.AppliedClassId = seedApp.AppliedClassId;
                            if (existingApp.FirstName == "sample" || string.IsNullOrEmpty(existingApp.FirstName)) existingApp.FirstName = seedApp.FirstName;
                            if (existingApp.LastName == "sample" || string.IsNullOrEmpty(existingApp.LastName)) existingApp.LastName = seedApp.LastName;
                        }
                    }
                    await context.SaveChangesAsync();
                }
            }

            // Sync Admissions -> Students
            try
            {
                var conn = context.Database.GetDbConnection();
                var connState = conn.State;
                if (connState != System.Data.ConnectionState.Open) await conn.OpenAsync();

                bool tablesReady = false;
                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = @"
                        SET FOREIGN_KEY_CHECKS=0;
                        CREATE TABLE IF NOT EXISTS `academic_years` (
                            `academic_year_id` int NOT NULL AUTO_INCREMENT,
                            `academic_year_name` varchar(20) NOT NULL,
                            `start_date` date NOT NULL,
                            `end_date` date NOT NULL,
                            `is_current` tinyint(1) NOT NULL,
                            `is_active` tinyint(1) NOT NULL,
                            `is_deleted` tinyint(1) NOT NULL,
                            `created_at` datetime(6) NOT NULL,
                            `updated_at` datetime(6) NULL,
                            PRIMARY KEY (`academic_year_id`)
                        ) CHARACTER SET=utf8mb4;
                        SET FOREIGN_KEY_CHECKS=1;
                    ";
                    await cmd.ExecuteNonQueryAsync();
                }

                using (var cmd = conn.CreateCommand())
                {
                    cmd.CommandText = @"
                        SELECT COUNT(*) FROM information_schema.tables
                        WHERE table_schema = DATABASE()
                        AND table_name IN ('academic_years', 'branches', 'students', 'admissions', 'class_sections')";
                    var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
                    tablesReady = count >= 5;
                }

                if (connState != System.Data.ConnectionState.Open) await conn.CloseAsync();

                if (tablesReady)
                {
                    if (!await context.Branches.AnyAsync())
                    {
                        var branch = new Branch { BranchName = "Main Campus" };
                        await context.Branches.AddAsync(branch);
                        await context.SaveChangesAsync();
                    }

                    if (!await context.AcademicYears.AnyAsync())
                    {
                        var academicYear = new AcademicYear
                        {
                            AcademicYearName = "2025-2026",
                            StartDate = new DateTime(2025, 6, 1),
                            EndDate = new DateTime(2026, 5, 31),
                            IsCurrent = true,
                            IsActive = true,
                            IsDeleted = false,
                            CreatedAt = DateTime.UtcNow
                        };
                        await context.AcademicYears.AddAsync(academicYear);
                        await context.SaveChangesAsync();
                    }

                    var classesList = await context.Classes.ToListAsync();
                    foreach (var cls in classesList)
                    {
                        var hasSection = await context.ClassSections.AnyAsync(cs => cs.ClassId == cls.ClassId);
                        if (!hasSection)
                        {
                            await context.ClassSections.AddAsync(new ClassSection
                            {
                                ClassId = cls.ClassId,
                                SectionName = "A"
                            });
                        }
                    }
                    await context.SaveChangesAsync();

                    var defaultBranch = await context.Branches.FirstOrDefaultAsync();
                    var defaultAcademicYear = await context.AcademicYears.FirstOrDefaultAsync();

                    if (defaultBranch != null && defaultAcademicYear != null)
                    {
                        var activeAdmissions = await context.Admissions
                            .Where(a => !a.IsDeleted && (a.Status == "Enrolled" || a.Status == "Active"))
                            .ToListAsync();

                        foreach (var admission in activeAdmissions)
                        {
                            if (admission.ClassId == null || string.IsNullOrEmpty(admission.SectionLetter)) continue;

                            var sectionObj = await context.ClassSections
                                .FirstOrDefaultAsync(s => s.ClassId == admission.ClassId && s.SectionName.ToLower() == admission.SectionLetter.ToLower());
                            if (sectionObj == null) continue;

                            var existing = await context.Students
                                .FirstOrDefaultAsync(s => s.AdmissionNumber == admission.ApplicationNo);

                            if (existing != null)
                            {
                                existing.SectionId = sectionObj.SectionId;
                                existing.RollNumber = admission.RollNo ?? existing.RollNumber;
                                existing.Status = "Active";
                            }
                            else
                            {
                                var student = new Student
                                {
                                    AdmissionNumber = admission.ApplicationNo ?? $"ADM-{admission.AdmissionId}",
                                    RollNumber = admission.RollNo ?? $"R-{admission.AdmissionId}",
                                    StudentName = admission.StudentName,
                                    DateOfBirth = admission.Dob,
                                    Gender = admission.Gender,
                                    FatherName = admission.FatherName,
                                    FatherMobile = admission.FatherMobile,
                                    BranchId = defaultBranch.BranchId,
                                    AcademicYearId = defaultAcademicYear.AcademicYearId,
                                    ClassId = admission.ClassId.Value,
                                    SectionId = sectionObj.SectionId,
                                    Status = "Active",
                                    CreatedAt = DateTime.UtcNow
                                };
                                await context.Students.AddAsync(student);
                            }
                        }
                        await context.SaveChangesAsync();
                    }
                }
                else
                {
                    logger.LogWarning("Admissions→Students sync skipped: one or more required tables do not exist yet.");
                }
            }
            catch (Exception syncEx)
            {
                logger.LogWarning(syncEx, "Admissions→Students startup sync failed.");
            }

            // Seed Period Settings
            if (!await context.PeriodSettings.AnyAsync(p => !p.IsDeleted))
            {
                var defaultPeriods = new[]
                {
                    new PeriodSetting { PeriodName = "Period 1", StartTime = new TimeSpan(8, 30, 0), EndTime = new TimeSpan(9, 15, 0), PeriodType = "Teaching Period", DisplayOrder = 1 },
                    new PeriodSetting { PeriodName = "Period 2", StartTime = new TimeSpan(9, 15, 0), EndTime = new TimeSpan(10, 0, 0), PeriodType = "Teaching Period", DisplayOrder = 2 },
                    new PeriodSetting { PeriodName = "Morning Break", StartTime = new TimeSpan(10, 0, 0), EndTime = new TimeSpan(10, 15, 0), PeriodType = "Break / Recess", DisplayOrder = 3 },
                    new PeriodSetting { PeriodName = "Period 3", StartTime = new TimeSpan(10, 15, 0), EndTime = new TimeSpan(11, 0, 0), PeriodType = "Teaching Period", DisplayOrder = 4 },
                    new PeriodSetting { PeriodName = "Period 4", StartTime = new TimeSpan(11, 0, 0), EndTime = new TimeSpan(11, 45, 0), PeriodType = "Teaching Period", DisplayOrder = 5 },
                    new PeriodSetting { PeriodName = "Lunch Break", StartTime = new TimeSpan(11, 45, 0), EndTime = new TimeSpan(12, 30, 0), PeriodType = "Break / Recess", DisplayOrder = 6 },
                    new PeriodSetting { PeriodName = "Period 5", StartTime = new TimeSpan(12, 30, 0), EndTime = new TimeSpan(13, 15, 0), PeriodType = "Teaching Period", DisplayOrder = 7 },
                    new PeriodSetting { PeriodName = "Period 6", StartTime = new TimeSpan(13, 15, 0), EndTime = new TimeSpan(14, 0, 0), PeriodType = "Teaching Period", DisplayOrder = 8 }
                };
                await context.PeriodSettings.AddRangeAsync(defaultPeriods);
                await context.SaveChangesAsync();
            }

            // Seed Teacher Subject Assignments
            if (!await context.TeacherSubjectAssignments.AnyAsync())
            {
                var firstClass = await context.Classes.FirstOrDefaultAsync();
                var firstSec = await context.ClassSections.FirstOrDefaultAsync();
                var firstSub = await context.Subjects.FirstOrDefaultAsync();
                var firstTeacher = await context.Staff.FirstOrDefaultAsync(s => s.IsActive == true);

                if (firstClass != null && firstSec != null && firstSub != null && firstTeacher != null)
                {
                    var sampleAssignment = new TeacherSubjectAssignment
                    {
                        ClassId = firstClass.ClassId,
                        SectionId = firstSec.SectionId,
                        SubjectId = firstSub.SubjectId,
                        StaffId = firstTeacher.StaffId
                    };
                    await context.TeacherSubjectAssignments.AddAsync(sampleAssignment);
                    await context.SaveChangesAsync();
                }
            }

            // Seed Leave Type Config
            if (!await context.LeaveTypeConfigs.AnyAsync())
            {
                var defaultLeaveTypes = new[]
                {
                    new LeaveTypeConfig { Name = "Casual Leave", Code = "CL", AnnualAllowance = 10, CarryForward = false, MaxConsecutiveDays = 3, RequiresAttachment = false, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Sick Leave", Code = "SL", AnnualAllowance = 12, CarryForward = true, MaxConsecutiveDays = 5, RequiresAttachment = true, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Earned Leave", Code = "EL", AnnualAllowance = 15, CarryForward = true, MaxConsecutiveDays = 10, RequiresAttachment = true, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Maternity Leave", Code = "ML", AnnualAllowance = 90, CarryForward = false, MaxConsecutiveDays = 90, RequiresAttachment = true, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Paternity Leave", Code = "PL", AnnualAllowance = 15, CarryForward = false, MaxConsecutiveDays = 15, RequiresAttachment = true, IsPaid = true, Status = "Active" },
                    new LeaveTypeConfig { Name = "Loss of Pay", Code = "LOP", AnnualAllowance = 0, CarryForward = false, MaxConsecutiveDays = 30, RequiresAttachment = false, IsPaid = false, Status = "Active" }
                };
                await context.LeaveTypeConfigs.AddRangeAsync(defaultLeaveTypes);
                await context.SaveChangesAsync();
            }

            // Seed Leave Applications
            if (!await context.LeaveApplications.AnyAsync())
            {
                var teacher = await context.Staff.FirstOrDefaultAsync(s => s.EmployeeCategory == "Teacher" || s.SystemRole == "Teacher");
                var clType = await context.LeaveTypeConfigs.FirstOrDefaultAsync(l => l.Code == "CL");
                if (teacher != null && clType != null)
                {
                    var sampleLeave = new LeaveApplication
                    {
                        StaffId = teacher.StaffId,
                        LeaveTypeId = clType.LeaveTypeId,
                        FromDate = DateTime.UtcNow.AddDays(2).Date,
                        ToDate = DateTime.UtcNow.AddDays(3).Date,
                        IsHalfDay = false,
                        RequestedDays = 2,
                        Reason = "Family function to attend",
                        AppliedDate = DateTime.UtcNow.AddDays(-1),
                        Status = "Pending"
                    };
                    await context.LeaveApplications.AddAsync(sampleLeave);
                    await context.SaveChangesAsync();
                }
            }

            // Seed Salary Structures
            if (!await context.SalaryStructures.AnyAsync())
            {
                var teacherScale = new SalaryStructure
                {
                    StructureCode = "SAL-STR-TCH",
                    StructureName = "Teaching Staff Scale",
                    StaffCategory = "Teacher",
                    Branch = "Main Campus",
                    Department = "Academics",
                    Designation = "Teacher",
                    EmploymentType = "Full-time",
                    EffectiveDate = DateTime.UtcNow.Date,
                    Status = "Active",
                    Notes = "Standard scale for teaching staff members.",
                    MonthlyGrossSalary = 50000,
                    AssignedEmployeesCount = 0,
                    PayrollFrequency = "Monthly",
                    SalaryPaymentDay = "5",
                    PfApplicable = true,
                    PfPercentage = 12,
                    EsiApplicable = true,
                    EsiPercentage = 0.75m,
                    ProfessionalTaxApplicable = true,
                    ProfessionalTaxAmount = 200,
                    RoundOffRule = "Nearest 1"
                };

                teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "Basic Salary", ComponentType = "Earning", Amount = 30000 });
                teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "HRA", ComponentType = "Earning", Amount = 10000 });
                teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "DA", ComponentType = "Earning", Amount = 5000 });
                teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "Travel Allowance", ComponentType = "Earning", Amount = 5000 });
                teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "Employee PF", ComponentType = "Deduction", Amount = 3600 });
                teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "ESI", ComponentType = "Deduction", Amount = 375 });
                teacherScale.Items.Add(new SalaryStructureItem { ComponentName = "Professional Tax", ComponentType = "Deduction", Amount = 200 });

                var adminScale = new SalaryStructure
                {
                    StructureCode = "SAL-STR-ADM",
                    StructureName = "Non-Teaching Admin Scale",
                    StaffCategory = "Staff",
                    Branch = "Main Campus",
                    Department = "Administration",
                    Designation = "Administrator",
                    EmploymentType = "Full-time",
                    EffectiveDate = DateTime.UtcNow.Date,
                    Status = "Active",
                    Notes = "Standard scale for administration staff members.",
                    MonthlyGrossSalary = 35000,
                    AssignedEmployeesCount = 0,
                    PayrollFrequency = "Monthly",
                    SalaryPaymentDay = "5",
                    PfApplicable = true,
                    PfPercentage = 12,
                    EsiApplicable = false,
                    EsiPercentage = 0,
                    ProfessionalTaxApplicable = true,
                    ProfessionalTaxAmount = 150,
                    RoundOffRule = "Nearest 1"
                };

                adminScale.Items.Add(new SalaryStructureItem { ComponentName = "Basic Salary", ComponentType = "Earning", Amount = 20000 });
                adminScale.Items.Add(new SalaryStructureItem { ComponentName = "HRA", ComponentType = "Earning", Amount = 8000 });
                adminScale.Items.Add(new SalaryStructureItem { ComponentName = "DA", ComponentType = "Earning", Amount = 3000 });
                adminScale.Items.Add(new SalaryStructureItem { ComponentName = "Travel Allowance", ComponentType = "Earning", Amount = 4000 });
                adminScale.Items.Add(new SalaryStructureItem { ComponentName = "Employee PF", ComponentType = "Deduction", Amount = 2400 });
                adminScale.Items.Add(new SalaryStructureItem { ComponentName = "Professional Tax", ComponentType = "Deduction", Amount = 150 });

                await context.SalaryStructures.AddRangeAsync(teacherScale, adminScale);
                await context.SaveChangesAsync();
            }

            logger.LogInformation("[DbInitializer] Database schema validation and seeding completed successfully.");
        }
    }
}
