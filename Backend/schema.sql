ALTER DATABASE CHARACTER SET utf8mb4;


CREATE TABLE `academic_years` (
    `academic_year_id` int NOT NULL AUTO_INCREMENT,
    `academic_year_name` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `start_date` date NOT NULL,
    `end_date` date NOT NULL,
    `is_current` tinyint(1) NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT TRUE,
    `is_deleted` tinyint(1) NOT NULL DEFAULT FALSE,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NULL,
    CONSTRAINT `PK_academic_years` PRIMARY KEY (`academic_year_id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `AcademicClass` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `ClassName` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_AcademicClass` PRIMARY KEY (`Id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `audit_logs` (
    `AuditLogId` int NOT NULL AUTO_INCREMENT,
    `UserId` int NULL,
    `UserName` longtext CHARACTER SET utf8mb4 NULL,
    `UserRole` longtext CHARACTER SET utf8mb4 NULL,
    `Action` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Details` longtext CHARACTER SET utf8mb4 NOT NULL,
    `IpAddress` longtext CHARACTER SET utf8mb4 NULL,
    `Timestamp` datetime(6) NOT NULL,
    `SchoolId` int NULL,
    CONSTRAINT `PK_audit_logs` PRIMARY KEY (`AuditLogId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `branches` (
    `BranchId` int NOT NULL AUTO_INCREMENT,
    `BranchName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_branches` PRIMARY KEY (`BranchId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `circulars` (
    `CircularId` int NOT NULL AUTO_INCREMENT,
    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Category` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Content` longtext CHARACTER SET utf8mb4 NOT NULL,
    `TargetAudience` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedDate` datetime(6) NOT NULL,
    `SmsSent` tinyint(1) NOT NULL,
    `EmailSent` tinyint(1) NOT NULL,
    `PushDelivered` tinyint(1) NOT NULL,
    CONSTRAINT `PK_circulars` PRIMARY KEY (`CircularId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `classes` (
    `id` int NOT NULL AUTO_INCREMENT,
    `ClassName` varchar(100) CHARACTER SET utf8mb4 NULL,
    `CampusLocation` varchar(100) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Main Campus',
    `AcademicYear` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT '2026-2027',
    `DisplayOrder` int NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Active',
    `remarks` longtext CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` datetime(6) NULL,
    CONSTRAINT `PK_classes` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `departments` (
    `DepartmentId` int NOT NULL AUTO_INCREMENT,
    `DepartmentName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `DepartmentCode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(500) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Active',
    `CreatedDate` datetime(6) NOT NULL,
    CONSTRAINT `PK_departments` PRIMARY KEY (`DepartmentId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `designation_masters` (
    `id` int NOT NULL AUTO_INCREMENT,
    `designation_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `employee_category` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `created_date` datetime(6) NOT NULL,
    CONSTRAINT `PK_designation_masters` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `employee_competency_assessments` (
    `id` int NOT NULL AUTO_INCREMENT,
    `assessment_name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `assessment_type` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `assessment_category` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `total_marks` int NOT NULL,
    `passing_marks` int NOT NULL,
    `grading_scheme` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `description` longtext CHARACTER SET utf8mb4 NULL,
    `assessment_instructions` longtext CHARACTER SET utf8mb4 NULL,
    `employee_type_filter` varchar(100) CHARACTER SET utf8mb4 NULL,
    `branch_filter` varchar(100) CHARACTER SET utf8mb4 NULL,
    `department_filter` varchar(100) CHARACTER SET utf8mb4 NULL,
    `designation_filter` varchar(100) CHARACTER SET utf8mb4 NULL,
    `scheduled_date` datetime(6) NULL,
    `start_time` varchar(20) CHARACTER SET utf8mb4 NULL,
    `end_time` varchar(20) CHARACTER SET utf8mb4 NULL,
    `assessment_mode` varchar(100) CHARACTER SET utf8mb4 NULL,
    `venue` varchar(250) CHARACTER SET utf8mb4 NULL,
    `main_evaluator` varchar(150) CHARACTER SET utf8mb4 NULL,
    `co_evaluator` varchar(150) CHARACTER SET utf8mb4 NULL,
    `notify_participants` tinyint(1) NOT NULL DEFAULT TRUE,
    `auto_certificates` tinyint(1) NOT NULL DEFAULT TRUE,
    `add_to_calendar` tinyint(1) NOT NULL DEFAULT TRUE,
    `publish_immediately` tinyint(1) NOT NULL DEFAULT TRUE,
    `candidates_count` int NOT NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `created_at` datetime(6) NOT NULL,
    CONSTRAINT `PK_employee_competency_assessments` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `faculty_workshops` (
    `id` int NOT NULL AUTO_INCREMENT,
    `title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `description` longtext CHARACTER SET utf8mb4 NULL,
    `trainer_name` varchar(100) CHARACTER SET utf8mb4 NULL,
    `organization` varchar(150) CHARACTER SET utf8mb4 NULL,
    `venue` varchar(100) CHARACTER SET utf8mb4 NULL,
    `start_date` datetime(6) NULL,
    `end_date` datetime(6) NULL,
    `start_time` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `end_time` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `category` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `target_role_type` varchar(100) CHARACTER SET utf8mb4 NULL,
    `branch` varchar(100) CHARACTER SET utf8mb4 NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `created_at` datetime(6) NOT NULL,
    CONSTRAINT `PK_faculty_workshops` PRIMARY KEY (`id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `holiday_calendars` (
    `HolidayId` int NOT NULL AUTO_INCREMENT,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Type` longtext CHARACTER SET utf8mb4 NOT NULL,
    `FromDate` datetime(6) NOT NULL,
    `ToDate` datetime(6) NOT NULL,
    `ApplicableBranch` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_holiday_calendars` PRIMARY KEY (`HolidayId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `homeworks` (
    `HomeworkId` int NOT NULL AUTO_INCREMENT,
    `ClassName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ClassRoom` longtext CHARACTER SET utf8mb4 NOT NULL,
    `SubjectName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Topic` longtext CHARACTER SET utf8mb4 NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `DueDate` datetime(6) NOT NULL,
    `PublishedTo` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AttachmentFileName` longtext CHARACTER SET utf8mb4 NULL,
    `AttachmentUrl` longtext CHARACTER SET utf8mb4 NULL,
    `TeacherName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `SubmissionsCount` int NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_homeworks` PRIMARY KEY (`HomeworkId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `hostel_blocks` (
    `HostelId` int NOT NULL AUTO_INCREMENT,
    `HostelName` varchar(150) CHARACTER SET utf8mb4 NULL,
    `HostelCode` varchar(50) CHARACTER SET utf8mb4 NULL,
    `HostelType` varchar(50) CHARACTER SET utf8mb4 NULL,
    `WardenName` varchar(150) CHARACTER SET utf8mb4 NULL,
    `PrimaryMobileNumber` varchar(20) CHARACTER SET utf8mb4 NULL,
    `AlternateMobileNumber` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Email` varchar(150) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Address` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_hostel_blocks` PRIMARY KEY (`HostelId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `inventory_items` (
    `InventoryItemId` int NOT NULL AUTO_INCREMENT,
    `ItemName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Category` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Quantity` int NOT NULL,
    `UnitPrice` decimal(18,2) NOT NULL,
    `Location` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Status` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_inventory_items` PRIMARY KEY (`InventoryItemId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `leave_type_configs` (
    `LeaveTypeId` int NOT NULL AUTO_INCREMENT,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Code` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AnnualAllowance` int NOT NULL,
    `CarryForward` tinyint(1) NOT NULL,
    `MaxConsecutiveDays` int NOT NULL,
    `RequiresAttachment` tinyint(1) NOT NULL,
    `IsPaid` tinyint(1) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_leave_type_configs` PRIMARY KEY (`LeaveTypeId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `LibraryBooks` (
    `BookId` int NOT NULL AUTO_INCREMENT,
    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Author` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Category` longtext CHARACTER SET utf8mb4 NOT NULL,
    `RackLocation` longtext CHARACTER SET utf8mb4 NOT NULL,
    `TotalCopies` int NOT NULL,
    `AvailableCopies` int NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_LibraryBooks` PRIMARY KEY (`BookId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `LibraryIssueRecords` (
    `IssueId` int NOT NULL AUTO_INCREMENT,
    `BookId` int NOT NULL,
    `BookTitle` longtext CHARACTER SET utf8mb4 NOT NULL,
    `BorrowerName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `BorrowerRole` longtext CHARACTER SET utf8mb4 NOT NULL,
    `BorrowerIdCode` longtext CHARACTER SET utf8mb4 NOT NULL,
    `StudentId` int NULL,
    `StaffId` int NULL,
    `IssueDate` datetime(6) NOT NULL,
    `DueDate` datetime(6) NOT NULL,
    `ReturnDate` datetime(6) NULL,
    `FineAmount` decimal(65,30) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_LibraryIssueRecords` PRIMARY KEY (`IssueId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `meetings` (
    `MeetingId` int NOT NULL AUTO_INCREMENT,
    `MeetingAudience` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ParticipantType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ParticipantName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ParticipantPhone` longtext CHARACTER SET utf8mb4 NULL,
    `WardStudentName` longtext CHARACTER SET utf8mb4 NULL,
    `WardAdmissionNo` longtext CHARACTER SET utf8mb4 NULL,
    `WardClass` longtext CHARACTER SET utf8mb4 NULL,
    `MeetingTitle` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Agenda` longtext CHARACTER SET utf8mb4 NULL,
    `MeetingMode` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Building` longtext CHARACTER SET utf8mb4 NULL,
    `Floor` longtext CHARACTER SET utf8mb4 NULL,
    `MeetingRoom` longtext CHARACTER SET utf8mb4 NULL,
    `RoomCapacity` int NOT NULL,
    `MeetingDate` datetime(6) NOT NULL,
    `StartTime` longtext CHARACTER SET utf8mb4 NOT NULL,
    `EndTime` longtext CHARACTER SET utf8mb4 NOT NULL,
    `MeetingStatus` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_meetings` PRIMARY KEY (`MeetingId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `new_exam_timetable_slots` (
    `slot_id` int NOT NULL AUTO_INCREMENT,
    `exam_id` int NOT NULL,
    `class_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `section_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `subject_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `subject_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `total_marks` int NOT NULL,
    `exam_date` date NOT NULL,
    `time_slot` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `duration` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `room_hall` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `invigilator_faculty` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_new_exam_timetable_slots` PRIMARY KEY (`slot_id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `new_examinations` (
    `exam_id` int NOT NULL AUTO_INCREMENT,
    `exam_name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `assessment_type` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `academic_term` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `start_date` date NOT NULL,
    `end_date` date NOT NULL,
    `applicable_classes` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `status` varchar(30) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Draft',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_new_examinations` PRIMARY KEY (`exam_id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `new_grading_scale_rules` (
    `rule_id` int NOT NULL AUTO_INCREMENT,
    `exam_type` varchar(100) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'All',
    `grade` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
    `min_marks` decimal(10,2) NOT NULL,
    `max_marks` decimal(10,2) NOT NULL,
    `gpa` decimal(4,2) NOT NULL,
    `pass_fail` varchar(10) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'PASS',
    `remarks` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_new_grading_scale_rules` PRIMARY KEY (`rule_id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `new_student_exam_results` (
    `result_id` int NOT NULL AUTO_INCREMENT,
    `exam_id` int NOT NULL,
    `class_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `section_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `student_id` int NOT NULL,
    `roll_no` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `student_name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `admission_no` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `total_marks_obtained` decimal(10,2) NOT NULL,
    `total_max_marks` decimal(10,2) NOT NULL,
    `percentage` decimal(6,2) NOT NULL,
    `grade` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
    `rank` int NOT NULL,
    `result_status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `calculated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_new_student_exam_results` PRIMARY KEY (`result_id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `new_student_marks_entries` (
    `entry_id` int NOT NULL AUTO_INCREMENT,
    `exam_id` int NOT NULL,
    `class_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `section_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `subject_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `subject_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `roll_no` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `student_name` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `admission_no` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `attendance_status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Present',
    `marks_obtained` decimal(10,2) NOT NULL,
    `max_marks` decimal(10,2) NOT NULL,
    `grade` varchar(10) CHARACTER SET utf8mb4 NOT NULL,
    `evaluator_remarks` varchar(300) CHARACTER SET utf8mb4 NOT NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Draft',
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `PK_new_student_marks_entries` PRIMARY KEY (`entry_id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `payroll_configs` (
    `PayrollConfigId` int NOT NULL AUTO_INCREMENT,
    `PayrollName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Branch` longtext CHARACTER SET utf8mb4 NOT NULL,
    `FinancialYear` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Currency` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `EffectiveFrom` datetime(6) NOT NULL,
    `EffectiveTo` datetime(6) NOT NULL,
    CONSTRAINT `PK_payroll_configs` PRIMARY KEY (`PayrollConfigId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `payslips` (
    `PayslipId` int NOT NULL AUTO_INCREMENT,
    `EmployeeId` longtext CHARACTER SET utf8mb4 NOT NULL,
    `EmployeeName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Department` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Designation` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Month` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Year` int NOT NULL,
    `BasicSalary` decimal(65,30) NOT NULL,
    `HouseRentAllowance` decimal(65,30) NOT NULL,
    `DearnessAllowance` decimal(65,30) NOT NULL,
    `GrossEarnings` decimal(65,30) NOT NULL,
    `ProvidentFund` decimal(65,30) NOT NULL,
    `Esi` decimal(65,30) NOT NULL,
    `TotalDeductions` decimal(65,30) NOT NULL,
    `NetPay` decimal(65,30) NOT NULL,
    `PanNumber` longtext CHARACTER SET utf8mb4 NOT NULL,
    `PfNumber` longtext CHARACTER SET utf8mb4 NOT NULL,
    `EsiNumber` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_payslips` PRIMARY KEY (`PayslipId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `period_settings` (
    `PeriodId` int NOT NULL AUTO_INCREMENT,
    `PeriodName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `StartTime` time(6) NOT NULL,
    `EndTime` time(6) NOT NULL,
    `PeriodType` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `DisplayOrder` int NOT NULL,
    `IsActive` tinyint(1) NOT NULL,
    `IsDeleted` tinyint(1) NOT NULL,
    CONSTRAINT `PK_period_settings` PRIMARY KEY (`PeriodId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `roles` (
    `RoleId` int NOT NULL AUTO_INCREMENT,
    `RoleName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_roles` PRIMARY KEY (`RoleId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `room_type_configs` (
    `RoomTypeId` int NOT NULL AUTO_INCREMENT,
    `RoomTypeSpecification` varchar(150) CHARACTER SET utf8mb4 NULL,
    `BedCapacity` int NOT NULL,
    `AcType` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Description` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_room_type_configs` PRIMARY KEY (`RoomTypeId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `salary_components` (
    `ComponentId` int NOT NULL AUTO_INCREMENT,
    `Name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Category` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Type` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Value` decimal(65,30) NOT NULL,
    `Taxable` tinyint(1) NOT NULL,
    `Mandatory` tinyint(1) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_salary_components` PRIMARY KEY (`ComponentId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `salary_structures` (
    `StructureId` int NOT NULL AUTO_INCREMENT,
    `StructureCode` longtext CHARACTER SET utf8mb4 NOT NULL,
    `StructureName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Branch` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Department` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Designation` longtext CHARACTER SET utf8mb4 NOT NULL,
    `StaffCategory` longtext CHARACTER SET utf8mb4 NOT NULL,
    `EmploymentType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `EffectiveDate` datetime(6) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Notes` longtext CHARACTER SET utf8mb4 NULL,
    `MonthlyGrossSalary` decimal(65,30) NOT NULL,
    `AssignedEmployeesCount` int NOT NULL,
    `PayrollFrequency` longtext CHARACTER SET utf8mb4 NOT NULL,
    `SalaryPaymentDay` longtext CHARACTER SET utf8mb4 NOT NULL,
    `PfApplicable` tinyint(1) NOT NULL,
    `PfPercentage` decimal(65,30) NOT NULL,
    `EsiApplicable` tinyint(1) NOT NULL,
    `EsiPercentage` decimal(65,30) NOT NULL,
    `ProfessionalTaxApplicable` tinyint(1) NOT NULL,
    `ProfessionalTaxAmount` decimal(65,30) NOT NULL,
    `RoundOffRule` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_salary_structures` PRIMARY KEY (`StructureId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `school_events` (
    `EventId` int NOT NULL AUTO_INCREMENT,
    `Title` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Category` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Venue` longtext CHARACTER SET utf8mb4 NOT NULL,
    `StartDate` datetime(6) NOT NULL,
    `EndDate` datetime(6) NOT NULL,
    `Time` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Organizer` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Description` longtext CHARACTER SET utf8mb4 NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ApplicableBranch` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_school_events` PRIMARY KEY (`EventId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `schools` (
    `SchoolId` int NOT NULL AUTO_INCREMENT,
    `SchoolName` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `SchoolCode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `Address` longtext CHARACTER SET utf8mb4 NULL,
    `Phone` longtext CHARACTER SET utf8mb4 NULL,
    `Email` longtext CHARACTER SET utf8mb4 NULL,
    `Website` longtext CHARACTER SET utf8mb4 NULL,
    `PrincipalName` longtext CHARACTER SET utf8mb4 NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_schools` PRIMARY KEY (`SchoolId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `staff` (
    `StaffId` int NOT NULL AUTO_INCREMENT,
    `EmployeeId` longtext CHARACTER SET utf8mb4 NULL,
    `EmployeeCategory` longtext CHARACTER SET utf8mb4 NULL,
    `FirstName` longtext CHARACTER SET utf8mb4 NULL,
    `LastName` longtext CHARACTER SET utf8mb4 NULL,
    `Email` longtext CHARACTER SET utf8mb4 NULL,
    `Phone` longtext CHARACTER SET utf8mb4 NULL,
    `Gender` longtext CHARACTER SET utf8mb4 NULL,
    `DateOfBirth` datetime(6) NULL,
    `ResidentialAddress` longtext CHARACTER SET utf8mb4 NULL,
    `Designation` longtext CHARACTER SET utf8mb4 NULL,
    `Department` longtext CHARACTER SET utf8mb4 NULL,
    `SystemRole` longtext CHARACTER SET utf8mb4 NULL,
    `JoiningDate` datetime(6) NULL,
    `Qualification` longtext CHARACTER SET utf8mb4 NULL,
    `PrimarySubject` longtext CHARACTER SET utf8mb4 NULL,
    `Specialization` longtext CHARACTER SET utf8mb4 NULL,
    `MonthlySalary` decimal(65,30) NULL,
    `GrossSalary` decimal(65,30) NULL,
    `NetSalary` decimal(65,30) NULL,
    `SalaryStructureId` int NULL,
    `SalaryStructureName` longtext CHARACTER SET utf8mb4 NULL,
    `SalaryStructureEffectiveDate` datetime(6) NULL,
    `AccountHolderName` longtext CHARACTER SET utf8mb4 NULL,
    `AccountNumber` longtext CHARACTER SET utf8mb4 NULL,
    `BankName` longtext CHARACTER SET utf8mb4 NULL,
    `BranchName` longtext CHARACTER SET utf8mb4 NULL,
    `IfscCode` longtext CHARACTER SET utf8mb4 NULL,
    `UpiId` longtext CHARACTER SET utf8mb4 NULL,
    `IsActive` tinyint(1) NULL,
    `CasualLeaveBalance` int NOT NULL,
    `SickLeaveBalance` int NOT NULL,
    `EarnedLeaveBalance` int NOT NULL,
    `MiddleName` longtext CHARACTER SET utf8mb4 NULL,
    `AlternateMobile` longtext CHARACTER SET utf8mb4 NULL,
    `AadhaarNumber` longtext CHARACTER SET utf8mb4 NULL,
    `PanNumber` longtext CHARACTER SET utf8mb4 NULL,
    `PresentAddress` longtext CHARACTER SET utf8mb4 NULL,
    `PermanentAddress` longtext CHARACTER SET utf8mb4 NULL,
    `City` longtext CHARACTER SET utf8mb4 NULL,
    `State` longtext CHARACTER SET utf8mb4 NULL,
    `PinCode` longtext CHARACTER SET utf8mb4 NULL,
    `EmploymentType` longtext CHARACTER SET utf8mb4 NULL,
    `ReportingManager` longtext CHARACTER SET utf8mb4 NULL,
    `AcademicYear` longtext CHARACTER SET utf8mb4 NULL,
    `IsClassTeacherEligible` tinyint(1) NULL,
    `BloodGroup` longtext CHARACTER SET utf8mb4 NULL,
    `ProfilePhoto` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_staff` PRIMARY KEY (`StaffId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `student_attendance_sessions` (
    `AttendanceSessionId` int NOT NULL AUTO_INCREMENT,
    `AttendanceDate` date NOT NULL,
    `BranchId` int NOT NULL,
    `AcademicYearId` int NOT NULL,
    `ClassId` int NOT NULL,
    `SectionId` int NOT NULL,
    `SubjectId` int NOT NULL,
    `PeriodId` int NOT NULL,
    `TimetableSlotId` int NULL,
    `MarkedByStaffId` int NOT NULL,
    `IsLocked` tinyint(1) NOT NULL DEFAULT FALSE,
    `LockedByStaffId` int NULL,
    `LockedAt` datetime(6) NULL,
    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_student_attendance_sessions` PRIMARY KEY (`AttendanceSessionId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `system_notifications` (
    `NotificationId` int NOT NULL AUTO_INCREMENT,
    `Title` varchar(200) CHARACTER SET utf8mb4 NOT NULL,
    `Message` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Type` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `IsRead` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `SchoolId` int NULL,
    CONSTRAINT `PK_system_notifications` PRIMARY KEY (`NotificationId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `transport_vehicles` (
    `VehicleId` bigint NOT NULL AUTO_INCREMENT,
    `VehicleNumber` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `RegistrationNumber` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `VehicleName` varchar(100) CHARACTER SET utf8mb4 NULL,
    `VehicleType` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Manufacturer` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Model` varchar(100) CHARACTER SET utf8mb4 NULL,
    `ChassisNumber` longtext CHARACTER SET utf8mb4 NULL,
    `EngineNumber` longtext CHARACTER SET utf8mb4 NULL,
    `GpsDeviceId` longtext CHARACTER SET utf8mb4 NULL,
    `InsuranceNumber` varchar(100) CHARACTER SET utf8mb4 NULL,
    `InsuranceExpiry` datetime(6) NULL,
    `PollutionExpiry` datetime(6) NULL,
    `FitnessExpiry` datetime(6) NULL,
    `Capacity` int NOT NULL,
    `IsAC` tinyint(1) NOT NULL,
    `Status` tinyint(1) NOT NULL DEFAULT TRUE,
    `IsDeleted` tinyint(1) NOT NULL DEFAULT FALSE,
    `CreatedBy` bigint NULL,
    `UpdatedBy` bigint NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_transport_vehicles` PRIMARY KEY (`VehicleId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `uniform_categories` (
    `CategoryId` int NOT NULL AUTO_INCREMENT,
    `CategoryName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `Description` varchar(255) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(50) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_uniform_categories` PRIMARY KEY (`CategoryId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `uniform_sizes` (
    `SizeId` int NOT NULL AUTO_INCREMENT,
    `SizeName` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `ChestSpec` varchar(50) CHARACTER SET utf8mb4 NULL,
    `WaistSpec` varchar(50) CHARACTER SET utf8mb4 NULL,
    `HeightTarget` varchar(50) CHARACTER SET utf8mb4 NULL,
    `AgeBracket` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Gender` varchar(50) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_uniform_sizes` PRIMARY KEY (`SizeId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `uniform_suppliers` (
    `SupplierId` int NOT NULL AUTO_INCREMENT,
    `SupplierName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `ContactPerson` varchar(150) CHARACTER SET utf8mb4 NULL,
    `Phone` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Email` varchar(150) CHARACTER SET utf8mb4 NULL,
    `GstNumber` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Address` varchar(255) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(50) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_uniform_suppliers` PRIMARY KEY (`SupplierId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `uniform_types` (
    `UniformTypeId` int NOT NULL AUTO_INCREMENT,
    `ItemName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Gender` varchar(50) CHARACTER SET utf8mb4 NULL,
    `SchoolWing` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Size` varchar(50) CHARACTER SET utf8mb4 NULL,
    `CategoryName` varchar(100) CHARACTER SET utf8mb4 NULL,
    `Color` varchar(100) CHARACTER SET utf8mb4 NULL,
    `UnitPrice` decimal(18,2) NOT NULL,
    `OpeningStock` int NOT NULL,
    `AvailableStock` int NOT NULL,
    `MinThreshold` int NOT NULL,
    `ReorderPoint` int NOT NULL,
    `Status` varchar(50) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_uniform_types` PRIMARY KEY (`UniformTypeId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `admission_applications` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `RegistrationNo` longtext CHARACTER SET utf8mb4 NULL,
    `ProfilePhotoUrl` longtext CHARACTER SET utf8mb4 NULL,
    `FirstName` longtext CHARACTER SET utf8mb4 NULL,
    `LastName` longtext CHARACTER SET utf8mb4 NULL,
    `DateOfBirth` datetime(6) NULL,
    `Gender` longtext CHARACTER SET utf8mb4 NULL,
    `AppliedClassId` int NULL,
    `BranchName` longtext CHARACTER SET utf8mb4 NULL,
    `BloodGroup` longtext CHARACTER SET utf8mb4 NULL,
    `Religion` longtext CHARACTER SET utf8mb4 NULL,
    `Caste` longtext CHARACTER SET utf8mb4 NULL,
    `FatherName` longtext CHARACTER SET utf8mb4 NULL,
    `MotherName` longtext CHARACTER SET utf8mb4 NULL,
    `FatherContact` longtext CHARACTER SET utf8mb4 NULL,
    `MotherMobileNumber` longtext CHARACTER SET utf8mb4 NULL,
    `AlternateMobileNumber` longtext CHARACTER SET utf8mb4 NULL,
    `ParentEmail` longtext CHARACTER SET utf8mb4 NULL,
    `HouseNo` longtext CHARACTER SET utf8mb4 NULL,
    `Street` longtext CHARACTER SET utf8mb4 NULL,
    `AreaLocality` longtext CHARACTER SET utf8mb4 NULL,
    `City` longtext CHARACTER SET utf8mb4 NULL,
    `District` longtext CHARACTER SET utf8mb4 NULL,
    `State` longtext CHARACTER SET utf8mb4 NULL,
    `PinCode` longtext CHARACTER SET utf8mb4 NULL,
    `NumberOfSiblings` int NULL,
    `ExistingSiblingLookup` longtext CHARACTER SET utf8mb4 NULL,
    `StudentType` longtext CHARACTER SET utf8mb4 NULL,
    `TransportRequired` tinyint(1) NULL,
    `TransportType` longtext CHARACTER SET utf8mb4 NULL,
    `BusRoute` longtext CHARACTER SET utf8mb4 NULL,
    `PickupPoint` longtext CHARACTER SET utf8mb4 NULL,
    `DropPoint` longtext CHARACTER SET utf8mb4 NULL,
    `HostelBlock` longtext CHARACTER SET utf8mb4 NULL,
    `FloorLevel` longtext CHARACTER SET utf8mb4 NULL,
    `HostelRoom` longtext CHARACTER SET utf8mb4 NULL,
    `AvailableBed` longtext CHARACTER SET utf8mb4 NULL,
    `AllocatedBedId` longtext CHARACTER SET utf8mb4 NULL,
    `Scholarship` longtext CHARACTER SET utf8mb4 NULL,
    `Discount` longtext CHARACTER SET utf8mb4 NULL,
    `Status` longtext CHARACTER SET utf8mb4 NULL,
    `IsDeleted` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_admission_applications` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_admission_applications_classes_AppliedClassId` FOREIGN KEY (`AppliedClassId`) REFERENCES `classes` (`id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `admissions` (
    `admission_id` bigint NOT NULL AUTO_INCREMENT,
    `application_no` longtext CHARACTER SET utf8mb4 NOT NULL,
    `student_name` longtext CHARACTER SET utf8mb4 NOT NULL,
    `dob` datetime(6) NULL,
    `gender` longtext CHARACTER SET utf8mb4 NULL,
    `father_name` longtext CHARACTER SET utf8mb4 NULL,
    `father_mobile` longtext CHARACTER SET utf8mb4 NULL,
    `blood_group` longtext CHARACTER SET utf8mb4 NULL,
    `caste` longtext CHARACTER SET utf8mb4 NULL,
    `branch_id` bigint NOT NULL,
    `class_id` int NULL,
    `section_letter` longtext CHARACTER SET utf8mb4 NULL,
    `roll_no` longtext CHARACTER SET utf8mb4 NULL,
    `admission_type` longtext CHARACTER SET utf8mb4 NULL,
    `status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `is_deleted` tinyint(1) NOT NULL,
    `created_by` bigint NULL,
    `created_date` datetime(6) NOT NULL,
    `modified_by` bigint NULL,
    `modified_date` datetime(6) NULL,
    CONSTRAINT `PK_admissions` PRIMARY KEY (`admission_id`),
    CONSTRAINT `FK_admissions_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) CHARACTER SET=utf8mb4;


CREATE TABLE `class_sections` (
    `id` int NOT NULL AUTO_INCREMENT,
    `section_letter` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `class_id` int NOT NULL,
    `capacity` int NOT NULL DEFAULT 40,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Active',
    `remarks` longtext CHARACTER SET utf8mb4 NULL,
    `room_no` varchar(100) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_class_sections` PRIMARY KEY (`id`),
    CONSTRAINT `FK_class_sections_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `subjects` (
    `SubjectId` int NOT NULL AUTO_INCREMENT,
    `SubjectCode` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `SubjectName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `CourseCode` varchar(50) CHARACTER SET utf8mb4 NULL,
    `AcademicClassId` int NULL,
    `DepartmentId` int NOT NULL,
    CONSTRAINT `PK_subjects` PRIMARY KEY (`SubjectId`),
    CONSTRAINT `FK_subjects_AcademicClass_AcademicClassId` FOREIGN KEY (`AcademicClassId`) REFERENCES `AcademicClass` (`Id`),
    CONSTRAINT `FK_subjects_departments_DepartmentId` FOREIGN KEY (`DepartmentId`) REFERENCES `departments` (`DepartmentId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `homework_submissions` (
    `SubmissionId` int NOT NULL AUTO_INCREMENT,
    `HomeworkId` int NOT NULL,
    `StudentId` int NOT NULL,
    `StudentName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `SubmissionDate` datetime(6) NOT NULL,
    `AttachmentUrl` longtext CHARACTER SET utf8mb4 NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `MarksObtained` decimal(65,30) NULL,
    `Feedback` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_homework_submissions` PRIMARY KEY (`SubmissionId`),
    CONSTRAINT `FK_homework_submissions_homeworks_HomeworkId` FOREIGN KEY (`HomeworkId`) REFERENCES `homeworks` (`HomeworkId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `new_exam_subject_configs` (
    `config_id` int NOT NULL AUTO_INCREMENT,
    `exam_id` int NOT NULL,
    `class_name` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `subject_code` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `subject_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `is_active` tinyint(1) NOT NULL DEFAULT TRUE,
    `max_marks` decimal(10,2) NOT NULL DEFAULT 100.0,
    `pass_marks` decimal(10,2) NOT NULL DEFAULT 35.0,
    CONSTRAINT `PK_new_exam_subject_configs` PRIMARY KEY (`config_id`),
    CONSTRAINT `FK_new_exam_subject_configs_new_examinations_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `new_examinations` (`exam_id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `room_masters` (
    `RoomId` int NOT NULL AUTO_INCREMENT,
    `HostelId` int NOT NULL,
    `RoomTypeId` int NOT NULL,
    `FloorLevel` varchar(50) CHARACTER SET utf8mb4 NULL,
    `RoomNumber` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_room_masters` PRIMARY KEY (`RoomId`),
    CONSTRAINT `FK_room_masters_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE CASCADE,
    CONSTRAINT `FK_room_masters_room_type_configs_RoomTypeId` FOREIGN KEY (`RoomTypeId`) REFERENCES `room_type_configs` (`RoomTypeId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `salary_structure_items` (
    `ItemId` int NOT NULL AUTO_INCREMENT,
    `StructureId` int NOT NULL,
    `ComponentName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ComponentType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Amount` decimal(65,30) NOT NULL,
    CONSTRAINT `PK_salary_structure_items` PRIMARY KEY (`ItemId`),
    CONSTRAINT `FK_salary_structure_items_salary_structures_StructureId` FOREIGN KEY (`StructureId`) REFERENCES `salary_structures` (`StructureId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `admins` (
    `AdminId` int NOT NULL AUTO_INCREMENT,
    `FullName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Email` longtext CHARACTER SET utf8mb4 NULL,
    `MobileNumber` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Role` longtext CHARACTER SET utf8mb4 NOT NULL,
    `IsEmailVerified` tinyint(1) NOT NULL,
    `IsMobileVerified` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `SchoolId` int NULL,
    CONSTRAINT `PK_admins` PRIMARY KEY (`AdminId`),
    CONSTRAINT `FK_admins_schools_SchoolId` FOREIGN KEY (`SchoolId`) REFERENCES `schools` (`SchoolId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `users` (
    `UserId` int NOT NULL AUTO_INCREMENT,
    `FullName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Email` longtext CHARACTER SET utf8mb4 NULL,
    `MobileNumber` varchar(255) CHARACTER SET utf8mb4 NOT NULL,
    `PasswordHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Role` longtext CHARACTER SET utf8mb4 NOT NULL,
    `IsEmailVerified` tinyint(1) NOT NULL,
    `IsMobileVerified` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `SchoolId` int NULL,
    CONSTRAINT `PK_users` PRIMARY KEY (`UserId`),
    CONSTRAINT `FK_users_schools_SchoolId` FOREIGN KEY (`SchoolId`) REFERENCES `schools` (`SchoolId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `employee_assessment_candidates` (
    `id` int NOT NULL AUTO_INCREMENT,
    `assessment_id` int NOT NULL,
    `staff_id` int NOT NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `score` decimal(5,2) NULL,
    `grade` varchar(10) CHARACTER SET utf8mb4 NULL,
    `remarks` longtext CHARACTER SET utf8mb4 NULL,
    `certificate_issued` tinyint(1) NOT NULL,
    `certificate_number` varchar(100) CHARACTER SET utf8mb4 NULL,
    `issued_date` datetime(6) NULL,
    CONSTRAINT `PK_employee_assessment_candidates` PRIMARY KEY (`id`),
    CONSTRAINT `FK_employee_assessment_candidates_employee_competency_assessmen~` FOREIGN KEY (`assessment_id`) REFERENCES `employee_competency_assessments` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_employee_assessment_candidates_staff_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `employee_salary_assignments` (
    `AssignmentId` int NOT NULL AUTO_INCREMENT,
    `StaffId` int NOT NULL,
    `StructureId` int NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `EffectiveDate` datetime(6) NOT NULL,
    `AssignedDate` datetime(6) NOT NULL,
    `Reason` longtext CHARACTER SET utf8mb4 NULL,
    `SalaryOverride` tinyint(1) NOT NULL,
    `OverrideBasicSalary` decimal(65,30) NULL,
    `OverrideAllowances` decimal(65,30) NULL,
    `OverrideDeductions` decimal(65,30) NULL,
    `OverrideNetSalary` decimal(65,30) NULL,
    `UpdatedBy` longtext CHARACTER SET utf8mb4 NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_employee_salary_assignments` PRIMARY KEY (`AssignmentId`),
    CONSTRAINT `FK_employee_salary_assignments_salary_structures_StructureId` FOREIGN KEY (`StructureId`) REFERENCES `salary_structures` (`StructureId`) ON DELETE CASCADE,
    CONSTRAINT `FK_employee_salary_assignments_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `faculty_training_participations` (
    `id` int NOT NULL AUTO_INCREMENT,
    `workshop_id` int NOT NULL,
    `staff_id` int NOT NULL,
    `registration_status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `assessment_score` decimal(5,2) NULL,
    `certificate_issued` tinyint(1) NOT NULL,
    `certificate_number` varchar(100) CHARACTER SET utf8mb4 NULL,
    `issued_date` datetime(6) NULL,
    CONSTRAINT `PK_faculty_training_participations` PRIMARY KEY (`id`),
    CONSTRAINT `FK_faculty_training_participations_faculty_workshops_workshop_id` FOREIGN KEY (`workshop_id`) REFERENCES `faculty_workshops` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_faculty_training_participations_staff_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `hostel_wardens` (
    `WardenId` int NOT NULL AUTO_INCREMENT,
    `HostelId` int NOT NULL,
    `StaffId` int NULL,
    `WardenName` varchar(150) CHARACTER SET utf8mb4 NULL,
    `MobileNumber` varchar(20) CHARACTER SET utf8mb4 NULL,
    `AlternateMobile` varchar(20) CHARACTER SET utf8mb4 NULL,
    `EmailAddress` varchar(150) CHARACTER SET utf8mb4 NULL,
    `Designation` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_hostel_wardens` PRIMARY KEY (`WardenId`),
    CONSTRAINT `FK_hostel_wardens_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE CASCADE,
    CONSTRAINT `FK_hostel_wardens_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `leave_applications` (
    `LeaveApplicationId` int NOT NULL AUTO_INCREMENT,
    `StaffId` int NOT NULL,
    `LeaveTypeId` int NOT NULL,
    `FromDate` datetime(6) NOT NULL,
    `ToDate` datetime(6) NOT NULL,
    `IsHalfDay` tinyint(1) NOT NULL,
    `RequestedDays` int NOT NULL,
    `Reason` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AppliedDate` datetime(6) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    CONSTRAINT `PK_leave_applications` PRIMARY KEY (`LeaveApplicationId`),
    CONSTRAINT `FK_leave_applications_leave_type_configs_LeaveTypeId` FOREIGN KEY (`LeaveTypeId`) REFERENCES `leave_type_configs` (`LeaveTypeId`) ON DELETE CASCADE,
    CONSTRAINT `FK_leave_applications_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `Section` (
    `SectionId` int NOT NULL AUTO_INCREMENT,
    `SectionName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AcademicClassId` int NOT NULL,
    `ClassTeacherId` int NULL,
    CONSTRAINT `PK_Section` PRIMARY KEY (`SectionId`),
    CONSTRAINT `FK_Section_AcademicClass_AcademicClassId` FOREIGN KEY (`AcademicClassId`) REFERENCES `AcademicClass` (`Id`) ON DELETE CASCADE,
    CONSTRAINT `FK_Section_staff_ClassTeacherId` FOREIGN KEY (`ClassTeacherId`) REFERENCES `staff` (`StaffId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `staff_attendances` (
    `StaffAttendanceId` int NOT NULL AUTO_INCREMENT,
    `StaffId` int NOT NULL,
    `Date` datetime(6) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `AcademicYear` longtext CHARACTER SET utf8mb4 NULL,
    `Branch` longtext CHARACTER SET utf8mb4 NULL,
    `Department` longtext CHARACTER SET utf8mb4 NULL,
    `Designation` longtext CHARACTER SET utf8mb4 NULL,
    `Remarks` longtext CHARACTER SET utf8mb4 NULL,
    `InTime` longtext CHARACTER SET utf8mb4 NULL,
    `OutTime` longtext CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_staff_attendances` PRIMARY KEY (`StaffAttendanceId`),
    CONSTRAINT `FK_staff_attendances_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `staff_documents` (
    `StaffDocumentId` int NOT NULL AUTO_INCREMENT,
    `StaffId` int NOT NULL,
    `DocumentType` longtext CHARACTER SET utf8mb4 NOT NULL,
    `FileUrl` longtext CHARACTER SET utf8mb4 NULL,
    `IsRequired` tinyint(1) NOT NULL,
    `Status` longtext CHARACTER SET utf8mb4 NOT NULL,
    `UploadedAt` datetime(6) NULL,
    CONSTRAINT `PK_staff_documents` PRIMARY KEY (`StaffDocumentId`),
    CONSTRAINT `FK_staff_documents_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `staff_experiences` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `StaffId` int NOT NULL,
    `PreviousOrganization` varchar(200) CHARACTER SET utf8mb4 NULL,
    `DesignationHeld` varchar(150) CHARACTER SET utf8mb4 NULL,
    `FromDate` datetime(6) NULL,
    `ToDate` datetime(6) NULL,
    `TotalExperience` varchar(50) CHARACTER SET utf8mb4 NULL,
    `ReasonForLeaving` varchar(300) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_staff_experiences` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_staff_experiences_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `staff_qualifications` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `StaffId` int NOT NULL,
    `QualificationDegree` varchar(150) CHARACTER SET utf8mb4 NULL,
    `SpecializationSubject` varchar(150) CHARACTER SET utf8mb4 NULL,
    `InstitutionCollege` varchar(200) CHARACTER SET utf8mb4 NULL,
    `BoardUniversity` varchar(200) CHARACTER SET utf8mb4 NULL,
    `PassingYear` varchar(10) CHARACTER SET utf8mb4 NULL,
    `PercentageCgpa` varchar(20) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_staff_qualifications` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_staff_qualifications_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `teacher_attendance_corrections` (
    `CorrectionId` int NOT NULL AUTO_INCREMENT,
    `StaffId` int NOT NULL,
    `AttendanceDate` date NOT NULL,
    `CurrentInTime` varchar(20) CHARACTER SET utf8mb4 NULL,
    `CurrentOutTime` varchar(20) CHARACTER SET utf8mb4 NULL,
    `RequestedInTime` varchar(20) CHARACTER SET utf8mb4 NULL,
    `RequestedOutTime` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Reason` varchar(500) CHARACTER SET utf8mb4 NOT NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Pending',
    `ApprovedRemarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `ApprovedBy` int NULL,
    `ApprovedAt` datetime(6) NULL,
    `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedAt` datetime NULL,
    CONSTRAINT `PK_teacher_attendance_corrections` PRIMARY KEY (`CorrectionId`),
    CONSTRAINT `FK_teacher_attendance_corrections_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `transport_drivers` (
    `DriverId` bigint NOT NULL AUTO_INCREMENT,
    `DriverName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `LicenceNumber` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `LicenceExpiry` datetime(6) NULL,
    `MobileNumber` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `AlternateMobileNumber` longtext CHARACTER SET utf8mb4 NULL,
    `Email` longtext CHARACTER SET utf8mb4 NULL,
    `Address` longtext CHARACTER SET utf8mb4 NULL,
    `BloodGroup` longtext CHARACTER SET utf8mb4 NULL,
    `EmergencyContactName` longtext CHARACTER SET utf8mb4 NULL,
    `EmergencyContactNumber` longtext CHARACTER SET utf8mb4 NULL,
    `Status` tinyint(1) NOT NULL DEFAULT TRUE,
    `IsDeleted` tinyint(1) NOT NULL DEFAULT FALSE,
    `CreatedBy` bigint NULL,
    `UpdatedBy` bigint NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    `AssignedVehicleId` bigint NULL,
    CONSTRAINT `PK_transport_drivers` PRIMARY KEY (`DriverId`),
    CONSTRAINT `FK_transport_drivers_transport_vehicles_AssignedVehicleId` FOREIGN KEY (`AssignedVehicleId`) REFERENCES `transport_vehicles` (`VehicleId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `transport_routes` (
    `RouteId` bigint NOT NULL AUTO_INCREMENT,
    `RouteCode` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `RouteName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `StartLocation` varchar(150) CHARACTER SET utf8mb4 NULL,
    `EndLocation` varchar(150) CHARACTER SET utf8mb4 NULL,
    `PickupPoint` longtext CHARACTER SET utf8mb4 NULL,
    `DropPoint` longtext CHARACTER SET utf8mb4 NULL,
    `DistanceKm` decimal(10,2) NOT NULL,
    `EstimatedDurationMinutes` int NOT NULL,
    `Description` varchar(500) CHARACTER SET utf8mb4 NULL,
    `MonthlyFee` decimal(65,30) NOT NULL,
    `Status` tinyint(1) NOT NULL DEFAULT TRUE,
    `IsDeleted` tinyint(1) NOT NULL DEFAULT FALSE,
    `CreatedBy` bigint NULL,
    `UpdatedBy` bigint NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    `VehicleId` bigint NULL,
    CONSTRAINT `PK_transport_routes` PRIMARY KEY (`RouteId`),
    CONSTRAINT `FK_transport_routes_transport_vehicles_VehicleId` FOREIGN KEY (`VehicleId`) REFERENCES `transport_vehicles` (`VehicleId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `transport_vehicle_maintenances` (
    `maintenance_id` bigint NOT NULL AUTO_INCREMENT,
    `vehicle_id` bigint NOT NULL,
    `service_type` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `service_date` date NOT NULL,
    `cost` decimal(12,2) NOT NULL DEFAULT 0.0,
    `vendor_center` varchar(150) CHARACTER SET utf8mb4 NULL,
    `next_service_due` date NULL,
    `remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `status` tinyint(1) NOT NULL DEFAULT TRUE,
    `is_deleted` tinyint(1) NOT NULL DEFAULT FALSE,
    `created_by` bigint NULL,
    `updated_by` bigint NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime NULL,
    CONSTRAINT `PK_transport_vehicle_maintenances` PRIMARY KEY (`maintenance_id`),
    CONSTRAINT `FK_transport_vehicle_maintenances_transport_vehicles_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `transport_vehicles` (`VehicleId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `TransportAttendants` (
    `AttendantId` bigint NOT NULL AUTO_INCREMENT,
    `AttendantName` longtext CHARACTER SET utf8mb4 NOT NULL,
    `MobileNumber` longtext CHARACTER SET utf8mb4 NOT NULL,
    `EmployeeId` longtext CHARACTER SET utf8mb4 NULL,
    `Gender` longtext CHARACTER SET utf8mb4 NULL,
    `BranchName` longtext CHARACTER SET utf8mb4 NULL,
    `AlternateMobileNumber` longtext CHARACTER SET utf8mb4 NULL,
    `Address` longtext CHARACTER SET utf8mb4 NULL,
    `BloodGroup` longtext CHARACTER SET utf8mb4 NULL,
    `EmergencyContactName` longtext CHARACTER SET utf8mb4 NULL,
    `EmergencyContactNumber` longtext CHARACTER SET utf8mb4 NULL,
    `AssignedVehicleId` bigint NULL,
    `Status` tinyint(1) NOT NULL,
    `IsDeleted` tinyint(1) NOT NULL,
    `CreatedBy` bigint NULL,
    `UpdatedBy` bigint NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_TransportAttendants` PRIMARY KEY (`AttendantId`),
    CONSTRAINT `FK_TransportAttendants_transport_vehicles_AssignedVehicleId` FOREIGN KEY (`AssignedVehicleId`) REFERENCES `transport_vehicles` (`VehicleId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `student_uniform_distributions` (
    `DistributionId` int NOT NULL AUTO_INCREMENT,
    `StudentId` int NULL,
    `AdmissionNo` varchar(50) CHARACTER SET utf8mb4 NULL,
    `StudentName` varchar(150) CHARACTER SET utf8mb4 NULL,
    `ClassName` varchar(100) CHARACTER SET utf8mb4 NULL,
    `TransactionType` varchar(100) CHARACTER SET utf8mb4 NULL,
    `UniformTypeId` int NULL,
    `ItemName` varchar(150) CHARACTER SET utf8mb4 NULL,
    `SizeSpec` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Quantity` int NOT NULL,
    `TotalAmount` decimal(18,2) NOT NULL,
    `DistributionDate` datetime(6) NULL,
    `Notes` varchar(255) CHARACTER SET utf8mb4 NULL,
    `PaymentStatus` varchar(50) CHARACTER SET utf8mb4 NULL,
    `Status` varchar(50) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_student_uniform_distributions` PRIMARY KEY (`DistributionId`),
    CONSTRAINT `FK_student_uniform_distributions_uniform_types_UniformTypeId` FOREIGN KEY (`UniformTypeId`) REFERENCES `uniform_types` (`UniformTypeId`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `timetable_headers` (
    `HeaderId` int NOT NULL AUTO_INCREMENT,
    `AcademicYear` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `BranchName` varchar(100) CHARACTER SET utf8mb4 NOT NULL,
    `ClassId` int NOT NULL,
    `SectionId` int NOT NULL,
    `Status` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `IncludeSaturday` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_timetable_headers` PRIMARY KEY (`HeaderId`),
    CONSTRAINT `FK_timetable_headers_class_sections_SectionId` FOREIGN KEY (`SectionId`) REFERENCES `class_sections` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_timetable_headers_classes_ClassId` FOREIGN KEY (`ClassId`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `class_subject_mappings` (
    `id` int NOT NULL AUTO_INCREMENT,
    `class_id` int NOT NULL,
    `subject_id` int NOT NULL,
    `weekly_periods` int NOT NULL DEFAULT 5,
    CONSTRAINT `PK_class_subject_mappings` PRIMARY KEY (`id`),
    CONSTRAINT `FK_class_subject_mappings_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_class_subject_mappings_subjects_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`SubjectId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `teacher_assignments` (
    `id` int NOT NULL AUTO_INCREMENT,
    `class_id` int NOT NULL,
    `section_letter` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `subject_id` int NULL,
    `teacher_id` int NOT NULL,
    `role` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `status` varchar(50) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Active',
    CONSTRAINT `PK_teacher_assignments` PRIMARY KEY (`id`),
    CONSTRAINT `FK_teacher_assignments_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_teacher_assignments_staff_teacher_id` FOREIGN KEY (`teacher_id`) REFERENCES `staff` (`StaffId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_teacher_assignments_subjects_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`SubjectId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `teacher_subject_assignments` (
    `AssignmentId` int NOT NULL AUTO_INCREMENT,
    `ClassId` int NOT NULL,
    `SectionId` int NOT NULL,
    `SubjectId` int NOT NULL,
    `StaffId` int NOT NULL,
    CONSTRAINT `PK_teacher_subject_assignments` PRIMARY KEY (`AssignmentId`),
    CONSTRAINT `FK_teacher_subject_assignments_class_sections_SectionId` FOREIGN KEY (`SectionId`) REFERENCES `class_sections` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_teacher_subject_assignments_classes_ClassId` FOREIGN KEY (`ClassId`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
    CONSTRAINT `FK_teacher_subject_assignments_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_teacher_subject_assignments_subjects_SubjectId` FOREIGN KEY (`SubjectId`) REFERENCES `subjects` (`SubjectId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `student_bed_allocations` (
    `AllocationId` int NOT NULL AUTO_INCREMENT,
    `RegistrationNo` varchar(100) CHARACTER SET utf8mb4 NULL,
    `StudentName` varchar(150) CHARACTER SET utf8mb4 NULL,
    `StudentId` int NULL,
    `HostelId` int NOT NULL,
    `RoomId` int NOT NULL,
    `BedNumber` varchar(50) CHARACTER SET utf8mb4 NULL,
    `JoiningDate` datetime(6) NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_student_bed_allocations` PRIMARY KEY (`AllocationId`),
    CONSTRAINT `FK_student_bed_allocations_admission_applications_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `admission_applications` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_student_bed_allocations_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_student_bed_allocations_room_masters_RoomId` FOREIGN KEY (`RoomId`) REFERENCES `room_masters` (`RoomId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `otp_verifications` (
    `OtpId` int NOT NULL AUTO_INCREMENT,
    `UserId` int NULL,
    `AdminId` int NULL,
    `OtpCodeHash` longtext CHARACTER SET utf8mb4 NOT NULL,
    `DeliveryMethod` longtext CHARACTER SET utf8mb4 NOT NULL,
    `Purpose` longtext CHARACTER SET utf8mb4 NOT NULL,
    `ExpiryTime` datetime(6) NOT NULL,
    `IsUsed` tinyint(1) NOT NULL,
    `AttemptCount` int NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    CONSTRAINT `PK_otp_verifications` PRIMARY KEY (`OtpId`),
    CONSTRAINT `FK_otp_verifications_admins_AdminId` FOREIGN KEY (`AdminId`) REFERENCES `admins` (`AdminId`) ON DELETE CASCADE,
    CONSTRAINT `FK_otp_verifications_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `students` (
    `student_id` int NOT NULL AUTO_INCREMENT,
    `admission_number` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `roll_number` varchar(30) CHARACTER SET utf8mb4 NOT NULL,
    `student_name` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `date_of_birth` date NULL,
    `gender` varchar(20) CHARACTER SET utf8mb4 NULL,
    `father_name` varchar(150) CHARACTER SET utf8mb4 NULL,
    `father_mobile` varchar(20) CHARACTER SET utf8mb4 NULL,
    `mother_name` varchar(150) CHARACTER SET utf8mb4 NULL,
    `mother_mobile` varchar(20) CHARACTER SET utf8mb4 NULL,
    `email` varchar(150) CHARACTER SET utf8mb4 NULL,
    `mobile_number` varchar(20) CHARACTER SET utf8mb4 NULL,
    `address` varchar(500) CHARACTER SET utf8mb4 NULL,
    `branch_id` int NOT NULL,
    `academic_year_id` int NOT NULL,
    `class_id` int NOT NULL,
    `section_id` int NOT NULL,
    `status` varchar(20) CHARACTER SET utf8mb4 NOT NULL DEFAULT 'Active',
    `is_deleted` tinyint(1) NOT NULL DEFAULT FALSE,
    `created_by` bigint NULL,
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_by` bigint NULL,
    `updated_at` datetime NULL,
    `AcademicClassId` int NULL,
    `SectionTempId` int NULL,
    CONSTRAINT `PK_students` PRIMARY KEY (`student_id`),
    CONSTRAINT `FK_students_AcademicClass_AcademicClassId` FOREIGN KEY (`AcademicClassId`) REFERENCES `AcademicClass` (`Id`),
    CONSTRAINT `FK_students_Section_SectionTempId` FOREIGN KEY (`SectionTempId`) REFERENCES `Section` (`SectionId`),
    CONSTRAINT `FK_students_academic_years_academic_year_id` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`academic_year_id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_students_branches_branch_id` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`BranchId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_students_class_sections_section_id` FOREIGN KEY (`section_id`) REFERENCES `class_sections` (`id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_students_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `transport_pickup_points` (
    `PickupPointId` bigint NOT NULL AUTO_INCREMENT,
    `RouteId` bigint NOT NULL,
    `PickupPointName` varchar(150) CHARACTER SET utf8mb4 NOT NULL,
    `Landmark` varchar(250) CHARACTER SET utf8mb4 NULL,
    `SequenceNo` int NOT NULL,
    `PickupTime` time(6) NOT NULL,
    `DistanceFromStart` decimal(10,2) NOT NULL,
    `Status` tinyint(1) NOT NULL,
    `IsDeleted` tinyint(1) NOT NULL,
    `CreatedAt` datetime(6) NOT NULL,
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_transport_pickup_points` PRIMARY KEY (`PickupPointId`),
    CONSTRAINT `FK_transport_pickup_points_transport_routes_RouteId` FOREIGN KEY (`RouteId`) REFERENCES `transport_routes` (`RouteId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `transport_vehicle_assignments` (
    `AssignmentId` bigint NOT NULL AUTO_INCREMENT,
    `RouteId` bigint NOT NULL,
    `VehicleId` bigint NOT NULL,
    `DriverId` bigint NOT NULL,
    `EffectiveFrom` datetime(6) NOT NULL,
    `EffectiveTo` datetime(6) NULL,
    `Shift` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Remarks` varchar(255) CHARACTER SET utf8mb4 NULL,
    `Status` tinyint(1) NOT NULL DEFAULT TRUE,
    `IsDeleted` tinyint(1) NOT NULL DEFAULT FALSE,
    CONSTRAINT `PK_transport_vehicle_assignments` PRIMARY KEY (`AssignmentId`),
    CONSTRAINT `FK_transport_vehicle_assignments_transport_drivers_DriverId` FOREIGN KEY (`DriverId`) REFERENCES `transport_drivers` (`DriverId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_transport_vehicle_assignments_transport_routes_RouteId` FOREIGN KEY (`RouteId`) REFERENCES `transport_routes` (`RouteId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_transport_vehicle_assignments_transport_vehicles_VehicleId` FOREIGN KEY (`VehicleId`) REFERENCES `transport_vehicles` (`VehicleId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE TABLE `timetable_slots` (
    `SlotId` int NOT NULL AUTO_INCREMENT,
    `HeaderId` int NOT NULL,
    `PeriodId` int NULL,
    `DayOfWeek` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `StartTime` time(6) NOT NULL,
    `EndTime` time(6) NOT NULL,
    `SubjectId` int NOT NULL,
    `TeacherId` int NOT NULL,
    `RoomNo` varchar(50) CHARACTER SET utf8mb4 NULL,
    CONSTRAINT `PK_timetable_slots` PRIMARY KEY (`SlotId`),
    CONSTRAINT `FK_timetable_slots_period_settings_PeriodId` FOREIGN KEY (`PeriodId`) REFERENCES `period_settings` (`PeriodId`),
    CONSTRAINT `FK_timetable_slots_staff_TeacherId` FOREIGN KEY (`TeacherId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE,
    CONSTRAINT `FK_timetable_slots_subjects_SubjectId` FOREIGN KEY (`SubjectId`) REFERENCES `subjects` (`SubjectId`) ON DELETE CASCADE,
    CONSTRAINT `FK_timetable_slots_timetable_headers_HeaderId` FOREIGN KEY (`HeaderId`) REFERENCES `timetable_headers` (`HeaderId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `hostel_attendances` (
    `AttendanceId` bigint NOT NULL AUTO_INCREMENT,
    `AllocationId` int NOT NULL,
    `Date` datetime(6) NULL,
    `CurfewStatus` varchar(20) CHARACTER SET utf8mb4 NULL,
    `Remarks` varchar(255) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NULL,
    CONSTRAINT `PK_hostel_attendances` PRIMARY KEY (`AttendanceId`),
    CONSTRAINT `FK_hostel_attendances_student_bed_allocations_AllocationId` FOREIGN KEY (`AllocationId`) REFERENCES `student_bed_allocations` (`AllocationId`) ON DELETE CASCADE
) CHARACTER SET=utf8mb4;


CREATE TABLE `student_attendances` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `AttendanceSessionId` int NOT NULL,
    `StudentId` int NULL,
    `Status` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `Remarks` varchar(500) CHARACTER SET utf8mb4 NULL,
    `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `UpdatedAt` datetime(6) NULL,
    CONSTRAINT `PK_student_attendances` PRIMARY KEY (`Id`),
    CONSTRAINT `FK_student_attendances_student_attendance_sessions_AttendanceSe~` FOREIGN KEY (`AttendanceSessionId`) REFERENCES `student_attendance_sessions` (`AttendanceSessionId`) ON DELETE CASCADE,
    CONSTRAINT `FK_student_attendances_students_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `students` (`student_id`)
) CHARACTER SET=utf8mb4;


CREATE TABLE `student_transport_assignments` (
    `StudentTransportAssignmentId` bigint NOT NULL AUTO_INCREMENT,
    `AdmissionNo` varchar(50) CHARACTER SET utf8mb4 NOT NULL,
    `RouteId` bigint NOT NULL,
    `PickupPointId` bigint NOT NULL,
    `VehicleAssignmentId` bigint NOT NULL,
    `EffectiveFrom` datetime(6) NOT NULL,
    `EffectiveTo` datetime(6) NULL,
    `TransportType` varchar(20) CHARACTER SET utf8mb4 NOT NULL,
    `Remarks` varchar(255) CHARACTER SET utf8mb4 NULL,
    `Status` tinyint(1) NOT NULL DEFAULT TRUE,
    `IsDeleted` tinyint(1) NOT NULL DEFAULT FALSE,
    CONSTRAINT `PK_student_transport_assignments` PRIMARY KEY (`StudentTransportAssignmentId`),
    CONSTRAINT `FK_student_transport_assignments_transport_pickup_points_Pickup~` FOREIGN KEY (`PickupPointId`) REFERENCES `transport_pickup_points` (`PickupPointId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_student_transport_assignments_transport_routes_RouteId` FOREIGN KEY (`RouteId`) REFERENCES `transport_routes` (`RouteId`) ON DELETE RESTRICT,
    CONSTRAINT `FK_student_transport_assignments_transport_vehicle_assignments_~` FOREIGN KEY (`VehicleAssignmentId`) REFERENCES `transport_vehicle_assignments` (`AssignmentId`) ON DELETE RESTRICT
) CHARACTER SET=utf8mb4;


CREATE UNIQUE INDEX `IX_academic_years_academic_year_name` ON `academic_years` (`academic_year_name`);


CREATE UNIQUE INDEX `IX_admins_MobileNumber` ON `admins` (`MobileNumber`);


CREATE INDEX `IX_admins_SchoolId` ON `admins` (`SchoolId`);


CREATE INDEX `IX_admission_applications_AppliedClassId` ON `admission_applications` (`AppliedClassId`);


CREATE INDEX `IX_admissions_class_id` ON `admissions` (`class_id`);


CREATE UNIQUE INDEX `IX_class_sections_class_id_section_letter` ON `class_sections` (`class_id`, `section_letter`);


CREATE UNIQUE INDEX `IX_class_subject_mappings_class_id_subject_id` ON `class_subject_mappings` (`class_id`, `subject_id`);


CREATE INDEX `IX_class_subject_mappings_subject_id` ON `class_subject_mappings` (`subject_id`);


CREATE UNIQUE INDEX `IX_departments_DepartmentCode` ON `departments` (`DepartmentCode`);


CREATE INDEX `IX_employee_assessment_candidates_assessment_id` ON `employee_assessment_candidates` (`assessment_id`);


CREATE INDEX `IX_employee_assessment_candidates_staff_id` ON `employee_assessment_candidates` (`staff_id`);


CREATE INDEX `IX_employee_salary_assignments_StaffId` ON `employee_salary_assignments` (`StaffId`);


CREATE INDEX `IX_employee_salary_assignments_StructureId` ON `employee_salary_assignments` (`StructureId`);


CREATE INDEX `IX_faculty_training_participations_staff_id` ON `faculty_training_participations` (`staff_id`);


CREATE INDEX `IX_faculty_training_participations_workshop_id` ON `faculty_training_participations` (`workshop_id`);


CREATE INDEX `IX_homework_submissions_HomeworkId` ON `homework_submissions` (`HomeworkId`);


CREATE INDEX `IX_hostel_attendances_AllocationId` ON `hostel_attendances` (`AllocationId`);


CREATE INDEX `IX_hostel_wardens_HostelId` ON `hostel_wardens` (`HostelId`);


CREATE INDEX `IX_hostel_wardens_StaffId` ON `hostel_wardens` (`StaffId`);


CREATE INDEX `IX_leave_applications_LeaveTypeId` ON `leave_applications` (`LeaveTypeId`);


CREATE INDEX `IX_leave_applications_StaffId` ON `leave_applications` (`StaffId`);


CREATE INDEX `ix_new_exam_subject_configs_exam_class_subject` ON `new_exam_subject_configs` (`exam_id`, `class_name`, `subject_code`);


CREATE INDEX `IX_otp_verifications_AdminId` ON `otp_verifications` (`AdminId`);


CREATE INDEX `IX_otp_verifications_UserId` ON `otp_verifications` (`UserId`);


CREATE INDEX `IX_room_masters_HostelId` ON `room_masters` (`HostelId`);


CREATE INDEX `IX_room_masters_RoomTypeId` ON `room_masters` (`RoomTypeId`);


CREATE INDEX `IX_salary_structure_items_StructureId` ON `salary_structure_items` (`StructureId`);


CREATE INDEX `IX_Section_AcademicClassId` ON `Section` (`AcademicClassId`);


CREATE INDEX `IX_Section_ClassTeacherId` ON `Section` (`ClassTeacherId`);


CREATE INDEX `IX_staff_attendances_StaffId` ON `staff_attendances` (`StaffId`);


CREATE INDEX `IX_staff_documents_StaffId` ON `staff_documents` (`StaffId`);


CREATE INDEX `IX_staff_experiences_StaffId` ON `staff_experiences` (`StaffId`);


CREATE INDEX `IX_staff_qualifications_StaffId` ON `staff_qualifications` (`StaffId`);


CREATE INDEX `IX_student_attendance_sessions_AcademicYearId` ON `student_attendance_sessions` (`AcademicYearId`);


CREATE INDEX `IX_student_attendance_sessions_BranchId` ON `student_attendance_sessions` (`BranchId`);


CREATE INDEX `IX_student_attendance_sessions_ClassId` ON `student_attendance_sessions` (`ClassId`);


CREATE INDEX `IX_student_attendance_sessions_MarkedByStaffId` ON `student_attendance_sessions` (`MarkedByStaffId`);


CREATE INDEX `IX_student_attendance_sessions_PeriodId` ON `student_attendance_sessions` (`PeriodId`);


CREATE INDEX `IX_student_attendance_sessions_SectionId` ON `student_attendance_sessions` (`SectionId`);


CREATE INDEX `IX_student_attendance_sessions_SubjectId` ON `student_attendance_sessions` (`SubjectId`);


CREATE UNIQUE INDEX `UX_StudentAttendanceSession_Sheet` ON `student_attendance_sessions` (`AttendanceDate`, `BranchId`, `AcademicYearId`, `ClassId`, `SectionId`, `SubjectId`, `PeriodId`);


CREATE INDEX `IX_student_attendances_StudentId` ON `student_attendances` (`StudentId`);


CREATE UNIQUE INDEX `UX_StudentAttendance_SessionStudent` ON `student_attendances` (`AttendanceSessionId`, `StudentId`);


CREATE INDEX `IX_student_bed_allocations_HostelId` ON `student_bed_allocations` (`HostelId`);


CREATE INDEX `IX_student_bed_allocations_RegistrationNo_Status` ON `student_bed_allocations` (`RegistrationNo`, `Status`);


CREATE INDEX `IX_student_bed_allocations_RoomId` ON `student_bed_allocations` (`RoomId`);


CREATE INDEX `IX_student_bed_allocations_StudentId` ON `student_bed_allocations` (`StudentId`);


CREATE INDEX `IX_STA_Route_Pickup_Vehicle` ON `student_transport_assignments` (`RouteId`, `PickupPointId`, `VehicleAssignmentId`, `Status`, `IsDeleted`);


CREATE INDEX `IX_student_transport_assignments_AdmissionNo` ON `student_transport_assignments` (`AdmissionNo`);


CREATE INDEX `IX_student_transport_assignments_AdmissionNo_EffectiveFrom_Effe~` ON `student_transport_assignments` (`AdmissionNo`, `EffectiveFrom`, `EffectiveTo`);


CREATE INDEX `IX_student_transport_assignments_PickupPointId` ON `student_transport_assignments` (`PickupPointId`);


CREATE INDEX `IX_student_transport_assignments_RouteId` ON `student_transport_assignments` (`RouteId`);


CREATE INDEX `IX_student_transport_assignments_VehicleAssignmentId` ON `student_transport_assignments` (`VehicleAssignmentId`);


CREATE INDEX `IX_student_uniform_distributions_UniformTypeId` ON `student_uniform_distributions` (`UniformTypeId`);


CREATE INDEX `IX_students_AcademicClassId` ON `students` (`AcademicClassId`);


CREATE INDEX `IX_students_class_id` ON `students` (`class_id`);


CREATE INDEX `ix_students_management_filter` ON `students` (`branch_id`, `academic_year_id`, `class_id`, `section_id`, `status`);


CREATE INDEX `IX_students_section_id` ON `students` (`section_id`);


CREATE INDEX `IX_students_SectionTempId` ON `students` (`SectionTempId`);


CREATE UNIQUE INDEX `ux_students_admission_number` ON `students` (`admission_number`);


CREATE UNIQUE INDEX `ux_students_year_class_section_roll` ON `students` (`academic_year_id`, `class_id`, `section_id`, `roll_number`);


CREATE INDEX `IX_subjects_AcademicClassId` ON `subjects` (`AcademicClassId`);


CREATE INDEX `IX_subjects_DepartmentId` ON `subjects` (`DepartmentId`);


CREATE UNIQUE INDEX `IX_subjects_SubjectCode` ON `subjects` (`SubjectCode`);


CREATE INDEX `IX_teacher_assignments_subject_id` ON `teacher_assignments` (`subject_id`);


CREATE INDEX `IX_teacher_assignments_teacher_id` ON `teacher_assignments` (`teacher_id`);


CREATE UNIQUE INDEX `ux_teacher_assignments_class_sec_role` ON `teacher_assignments` (`class_id`, `section_letter`, `role`);


CREATE INDEX `ix_teacher_attendance_corrections_staff_date` ON `teacher_attendance_corrections` (`StaffId`, `AttendanceDate`);


CREATE UNIQUE INDEX `IX_teacher_subject_assignments_ClassId_SectionId_SubjectId` ON `teacher_subject_assignments` (`ClassId`, `SectionId`, `SubjectId`);


CREATE INDEX `IX_teacher_subject_assignments_SectionId` ON `teacher_subject_assignments` (`SectionId`);


CREATE INDEX `IX_teacher_subject_assignments_StaffId` ON `teacher_subject_assignments` (`StaffId`);


CREATE INDEX `IX_teacher_subject_assignments_SubjectId` ON `teacher_subject_assignments` (`SubjectId`);


CREATE UNIQUE INDEX `IX_timetable_headers_ClassId_SectionId_AcademicYear` ON `timetable_headers` (`ClassId`, `SectionId`, `AcademicYear`);


CREATE INDEX `IX_timetable_headers_SectionId` ON `timetable_headers` (`SectionId`);


CREATE INDEX `IX_timetable_slots_HeaderId_DayOfWeek` ON `timetable_slots` (`HeaderId`, `DayOfWeek`);


CREATE INDEX `IX_timetable_slots_PeriodId` ON `timetable_slots` (`PeriodId`);


CREATE INDEX `IX_timetable_slots_RoomNo_DayOfWeek_StartTime_EndTime` ON `timetable_slots` (`RoomNo`, `DayOfWeek`, `StartTime`, `EndTime`);


CREATE INDEX `IX_timetable_slots_SubjectId` ON `timetable_slots` (`SubjectId`);


CREATE INDEX `IX_timetable_slots_TeacherId_DayOfWeek_StartTime_EndTime` ON `timetable_slots` (`TeacherId`, `DayOfWeek`, `StartTime`, `EndTime`);


CREATE INDEX `IX_transport_drivers_AssignedVehicleId` ON `transport_drivers` (`AssignedVehicleId`);


CREATE UNIQUE INDEX `IX_transport_drivers_LicenceNumber` ON `transport_drivers` (`LicenceNumber`);


CREATE INDEX `IX_transport_drivers_MobileNumber` ON `transport_drivers` (`MobileNumber`);


CREATE INDEX `IX_transport_pickup_points_RouteId_PickupPointName` ON `transport_pickup_points` (`RouteId`, `PickupPointName`);


CREATE INDEX `IX_transport_pickup_points_RouteId_SequenceNo` ON `transport_pickup_points` (`RouteId`, `SequenceNo`);


CREATE INDEX `IX_transport_routes_VehicleId` ON `transport_routes` (`VehicleId`);


CREATE UNIQUE INDEX `ux_transport_routes_route_code` ON `transport_routes` (`RouteCode`);


CREATE INDEX `IX_transport_vehicle_assignments_DriverId` ON `transport_vehicle_assignments` (`DriverId`);


CREATE INDEX `IX_transport_vehicle_assignments_RouteId` ON `transport_vehicle_assignments` (`RouteId`);


CREATE INDEX `IX_transport_vehicle_assignments_RouteId_VehicleId_DriverId_Eff~` ON `transport_vehicle_assignments` (`RouteId`, `VehicleId`, `DriverId`, `EffectiveFrom`);


CREATE INDEX `IX_transport_vehicle_assignments_VehicleId` ON `transport_vehicle_assignments` (`VehicleId`);


CREATE INDEX `IX_TVA_Vehicle_Driver_Route` ON `transport_vehicle_assignments` (`VehicleId`, `DriverId`, `RouteId`, `Status`, `IsDeleted`);


CREATE INDEX `IX_transport_vehicle_maintenance_vehicle_id` ON `transport_vehicle_maintenances` (`vehicle_id`);


CREATE INDEX `IX_VehMaint_Vehicle_ServiceDate_Deleted` ON `transport_vehicle_maintenances` (`vehicle_id`, `service_date`, `is_deleted`);


CREATE UNIQUE INDEX `IX_transport_vehicles_RegistrationNumber` ON `transport_vehicles` (`RegistrationNumber`);


CREATE UNIQUE INDEX `IX_transport_vehicles_VehicleNumber` ON `transport_vehicles` (`VehicleNumber`);


CREATE INDEX `IX_TransportAttendants_AssignedVehicleId` ON `TransportAttendants` (`AssignedVehicleId`);


CREATE UNIQUE INDEX `IX_users_MobileNumber` ON `users` (`MobileNumber`);


CREATE INDEX `IX_users_SchoolId` ON `users` (`SchoolId`);


