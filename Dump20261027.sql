-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: sms_new_test
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `__efmigrationshistory`
--

DROP TABLE IF EXISTS `__efmigrationshistory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `__efmigrationshistory` (
  `MigrationId` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductVersion` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`MigrationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `academic_years`
--

DROP TABLE IF EXISTS `academic_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academic_years` (
  `academic_year_id` int NOT NULL AUTO_INCREMENT,
  `academic_year_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`academic_year_id`),
  UNIQUE KEY `IX_academic_years_academic_year_name` (`academic_year_name`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `academicclass`
--

DROP TABLE IF EXISTS `academicclass`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `academicclass` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ClassName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admin_roles_junction`
--

DROP TABLE IF EXISTS `admin_roles_junction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_roles_junction` (
  `AdminId` int NOT NULL,
  `RoleId` int NOT NULL,
  PRIMARY KEY (`AdminId`,`RoleId`),
  KEY `IX_admin_roles_junction_RoleId` (`RoleId`),
  CONSTRAINT `FK_admin_roles_junction_admins_AdminId` FOREIGN KEY (`AdminId`) REFERENCES `admins` (`AdminId`) ON DELETE CASCADE,
  CONSTRAINT `FK_admin_roles_junction_roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`RoleId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admins`
--

DROP TABLE IF EXISTS `admins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admins` (
  `AdminId` int NOT NULL AUTO_INCREMENT,
  `FullName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MobileNumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PasswordHash` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsEmailVerified` tinyint(1) NOT NULL,
  `IsMobileVerified` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `SchoolId` int DEFAULT NULL,
  `Avatar` text,
  PRIMARY KEY (`AdminId`),
  UNIQUE KEY `IX_admins_MobileNumber` (`MobileNumber`),
  KEY `IX_admins_SchoolId` (`SchoolId`),
  CONSTRAINT `FK_admins_schools_SchoolId` FOREIGN KEY (`SchoolId`) REFERENCES `schools` (`SchoolId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `admission_applications`
--

DROP TABLE IF EXISTS `admission_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admission_applications` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `RegistrationNo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ProfilePhotoUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FirstName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `LastName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DateOfBirth` datetime(6) DEFAULT NULL,
  `Gender` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AppliedClassId` int DEFAULT NULL,
  `BranchName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BloodGroup` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Religion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Caste` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FatherName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MotherName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FatherContact` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MotherMobileNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AlternateMobileNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ParentEmail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `HouseNo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Street` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AreaLocality` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `City` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `District` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `State` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PinCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `NumberOfSiblings` int DEFAULT NULL,
  `ExistingSiblingLookup` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `StudentType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TransportRequired` tinyint(1) DEFAULT NULL,
  `TransportType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BusRoute` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PickupPoint` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DropPoint` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `HostelBlock` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FloorLevel` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `HostelRoom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AvailableBed` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AllocatedBedId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Scholarship` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Discount` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsDeleted` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `AdmissionNo` varchar(100) DEFAULT NULL,
  `HostelSecurityDepositPaid` tinyint(1) NOT NULL DEFAULT '0',
  `SecurityDepositAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `SecurityDepositReceiptNo` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_admission_applications_AppliedClassId` (`AppliedClassId`),
  CONSTRAINT `FK_admission_applications_classes_AppliedClassId` FOREIGN KEY (`AppliedClassId`) REFERENCES `classes` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=1616 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `trg_admission_applications_before_insert` BEFORE INSERT ON `admission_applications` FOR EACH ROW BEGIN
                            DECLARE max_num INT;
                            SELECT COALESCE(MAX(CAST(SUBSTRING(RegistrationNo, 5) AS UNSIGNED)), 1000)
                            INTO max_num
                            FROM `admission_applications`
                            WHERE RegistrationNo LIKE 'REG-%';
                            SET NEW.RegistrationNo = CONCAT('REG-', max_num + 1);
                        END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;

--
-- Table structure for table `admissions`
--

DROP TABLE IF EXISTS `admissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admissions` (
  `admission_id` bigint NOT NULL AUTO_INCREMENT,
  `application_no` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `student_name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `dob` datetime(6) DEFAULT NULL,
  `gender` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `father_name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `father_mobile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `blood_group` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `caste` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `branch_id` bigint NOT NULL,
  `class_id` int DEFAULT NULL,
  `section_letter` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `roll_no` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `admission_type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_deleted` tinyint(1) NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_date` datetime(6) NOT NULL,
  `modified_by` bigint DEFAULT NULL,
  `modified_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`admission_id`),
  KEY `IX_admissions_class_id` (`class_id`),
  CONSTRAINT `FK_admissions_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=833 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `AuditLogId` int NOT NULL AUTO_INCREMENT,
  `UserId` int DEFAULT NULL,
  `UserName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `UserRole` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Action` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IpAddress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Timestamp` datetime(6) NOT NULL,
  `SchoolId` int DEFAULT NULL,
  PRIMARY KEY (`AuditLogId`)
) ENGINE=InnoDB AUTO_INCREMENT=1369 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `automated_id_formats`
--

DROP TABLE IF EXISTS `automated_id_formats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `automated_id_formats` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `FormatKey` varchar(100) NOT NULL,
  `Name` varchar(150) NOT NULL,
  `Prefix` varchar(50) NOT NULL DEFAULT '',
  `StartNo` int NOT NULL DEFAULT '1',
  `Padding` int NOT NULL DEFAULT '4',
  `IncludeYear` tinyint(1) NOT NULL DEFAULT '1',
  `Separator` varchar(10) NOT NULL DEFAULT '-',
  `Position` varchar(20) NOT NULL DEFAULT 'start',
  `IsCustom` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `ux_automated_id_key` (`FormatKey`)
) ENGINE=InnoDB AUTO_INCREMENT=1058 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `BranchId` int NOT NULL AUTO_INCREMENT,
  `BranchName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BranchCode` varchar(50) DEFAULT 'MAIN',
  `Address` text,
  `Phone` varchar(50) DEFAULT NULL,
  `Email` varchar(100) DEFAULT NULL,
  `Status` varchar(20) DEFAULT 'Active',
  PRIMARY KEY (`BranchId`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `circulars`
--

DROP TABLE IF EXISTS `circulars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `circulars` (
  `CircularId` int NOT NULL AUTO_INCREMENT,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Category` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Content` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TargetAudience` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `SmsSent` tinyint(1) NOT NULL,
  `EmailSent` tinyint(1) NOT NULL,
  `PushDelivered` tinyint(1) NOT NULL,
  `Author` varchar(150) DEFAULT 'School Administration',
  `DeliveredCount` int NOT NULL DEFAULT '1420',
  `IsPinned` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`CircularId`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_curriculum_subjects`
--

DROP TABLE IF EXISTS `class_curriculum_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_curriculum_subjects` (
  `ClassId` int NOT NULL,
  `SubjectId` int NOT NULL,
  PRIMARY KEY (`ClassId`,`SubjectId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_sections`
--

DROP TABLE IF EXISTS `class_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_sections` (
  `id` int NOT NULL AUTO_INCREMENT,
  `section_letter` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `class_id` int NOT NULL,
  `capacity` int NOT NULL DEFAULT '40',
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Active',
  `remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `room_no` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_class_sections_class_id_section_letter` (`class_id`,`section_letter`),
  CONSTRAINT `FK_class_sections_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `class_subject_mappings`
--

DROP TABLE IF EXISTS `class_subject_mappings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_subject_mappings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `subject_id` int NOT NULL,
  `weekly_periods` int NOT NULL DEFAULT '5',
  PRIMARY KEY (`id`),
  UNIQUE KEY `IX_class_subject_mappings_class_id_subject_id` (`class_id`,`subject_id`),
  KEY `IX_class_subject_mappings_subject_id` (`subject_id`),
  CONSTRAINT `FK_class_subject_mappings_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_class_subject_mappings_subjects_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`SubjectId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=172 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `classes`
--

DROP TABLE IF EXISTS `classes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ClassName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CampusLocation` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Main Campus',
  `AcademicYear` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT '2026-2027',
  `DisplayOrder` int DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Active',
  `remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) DEFAULT NULL,
  `Capacity` int DEFAULT NULL,
  `ClassTeacher` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `departments` (
  `DepartmentId` int NOT NULL AUTO_INCREMENT,
  `DepartmentName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DepartmentCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Active',
  `CreatedDate` datetime(6) NOT NULL,
  `HeadOfDepartment` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `head_of_department` varchar(150) DEFAULT NULL,
  `category` varchar(50) DEFAULT 'Teaching',
  PRIMARY KEY (`DepartmentId`),
  UNIQUE KEY `IX_departments_DepartmentCode` (`DepartmentCode`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `designation_masters`
--

DROP TABLE IF EXISTS `designation_masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `designation_masters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `designation_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `employee_category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_date` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `discounts`
--

DROP TABLE IF EXISTS `discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discounts` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(150) NOT NULL,
  `Code` varchar(50) NOT NULL,
  `Type` varchar(50) NOT NULL DEFAULT 'Sibling Discount',
  `Mode` varchar(30) NOT NULL DEFAULT 'Percentage',
  `Value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `Description` longtext,
  `Status` varchar(30) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `Code` (`Code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `dynamicfeestructures`
--

DROP TABLE IF EXISTS `dynamicfeestructures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dynamicfeestructures` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TargetAudience` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AcademicYear` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Branch` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ClassName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Section` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StudentCategory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TotalAmount` decimal(65,30) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `items_json` longtext,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_assessment_candidates`
--

DROP TABLE IF EXISTS `employee_assessment_candidates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_assessment_candidates` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_id` int NOT NULL,
  `staff_id` int NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `score` decimal(5,2) DEFAULT NULL,
  `grade` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `certificate_issued` tinyint(1) NOT NULL,
  `certificate_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `issued_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_employee_assessment_candidates_assessment_id` (`assessment_id`),
  KEY `IX_employee_assessment_candidates_staff_id` (`staff_id`),
  CONSTRAINT `FK_employee_assessment_candidates_employee_competency_assessmen~` FOREIGN KEY (`assessment_id`) REFERENCES `employee_competency_assessments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_employee_assessment_candidates_staff_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_competency_assessments`
--

DROP TABLE IF EXISTS `employee_competency_assessments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_competency_assessments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `assessment_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `assessment_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `assessment_category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `total_marks` int NOT NULL,
  `passing_marks` int NOT NULL,
  `grading_scheme` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `assessment_instructions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `employee_type_filter` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `branch_filter` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `department_filter` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `designation_filter` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `scheduled_date` datetime(6) DEFAULT NULL,
  `start_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `end_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `assessment_mode` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `venue` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `main_evaluator` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `co_evaluator` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `notify_participants` tinyint(1) NOT NULL DEFAULT '1',
  `auto_certificates` tinyint(1) NOT NULL DEFAULT '1',
  `add_to_calendar` tinyint(1) NOT NULL DEFAULT '1',
  `publish_immediately` tinyint(1) NOT NULL DEFAULT '1',
  `candidates_count` int NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `employee_salary_assignments`
--

DROP TABLE IF EXISTS `employee_salary_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_salary_assignments` (
  `AssignmentId` int NOT NULL AUTO_INCREMENT,
  `StaffId` int NOT NULL,
  `StructureId` int NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EffectiveDate` datetime(6) NOT NULL,
  `AssignedDate` datetime(6) NOT NULL,
  `Reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `SalaryOverride` tinyint(1) NOT NULL,
  `OverrideBasicSalary` decimal(65,30) DEFAULT NULL,
  `OverrideAllowances` decimal(65,30) DEFAULT NULL,
  `OverrideDeductions` decimal(65,30) DEFAULT NULL,
  `OverrideNetSalary` decimal(65,30) DEFAULT NULL,
  `UpdatedBy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`AssignmentId`),
  KEY `IX_employee_salary_assignments_StaffId` (`StaffId`),
  KEY `IX_employee_salary_assignments_StructureId` (`StructureId`),
  CONSTRAINT `FK_employee_salary_assignments_salary_structures_StructureId` FOREIGN KEY (`StructureId`) REFERENCES `salary_structures` (`StructureId`) ON DELETE CASCADE,
  CONSTRAINT `FK_employee_salary_assignments_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ExpenseNo` varchar(100) NOT NULL DEFAULT '',
  `Date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Category` varchar(255) NOT NULL DEFAULT '',
  `Vendor` varchar(255) NOT NULL DEFAULT '',
  `Description` longtext,
  `Amount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `FinancialAccountId` int DEFAULT NULL,
  `PaymentMethod` varchar(50) NOT NULL DEFAULT 'Cash',
  `ReferenceNo` varchar(100) NOT NULL DEFAULT '',
  `Status` varchar(50) NOT NULL DEFAULT 'Approved',
  `AcademicYearId` int NOT NULL DEFAULT '0',
  `BranchId` int NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `faculty_training_participations`
--

DROP TABLE IF EXISTS `faculty_training_participations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculty_training_participations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `workshop_id` int NOT NULL,
  `staff_id` int NOT NULL,
  `registration_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `assessment_score` decimal(5,2) DEFAULT NULL,
  `certificate_issued` tinyint(1) NOT NULL,
  `certificate_number` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `issued_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `IX_faculty_training_participations_staff_id` (`staff_id`),
  KEY `IX_faculty_training_participations_workshop_id` (`workshop_id`),
  CONSTRAINT `FK_faculty_training_participations_faculty_workshops_workshop_id` FOREIGN KEY (`workshop_id`) REFERENCES `faculty_workshops` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_faculty_training_participations_staff_staff_id` FOREIGN KEY (`staff_id`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `faculty_workshops`
--

DROP TABLE IF EXISTS `faculty_workshops`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faculty_workshops` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `trainer_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `organization` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `venue` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `start_date` datetime(6) DEFAULT NULL,
  `end_date` datetime(6) DEFAULT NULL,
  `start_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `end_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `category` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `target_role_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `branch` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fee_schedule_monthly_dates`
--

DROP TABLE IF EXISTS `fee_schedule_monthly_dates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_schedule_monthly_dates` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `FeeScheduleId` varchar(100) NOT NULL,
  `MonthIndex` int NOT NULL,
  `MonthName` varchar(50) NOT NULL,
  `DueDate` varchar(50) NOT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  KEY `idx_fsmd_feeschedule` (`FeeScheduleId`),
  CONSTRAINT `fk_fsmd_feeschedule` FOREIGN KEY (`FeeScheduleId`) REFERENCES `fee_schedules` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fee_schedule_terms`
--

DROP TABLE IF EXISTS `fee_schedule_terms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_schedule_terms` (
  `Id` varchar(100) NOT NULL,
  `FeeScheduleId` varchar(100) NOT NULL,
  `Sequence` int NOT NULL DEFAULT '1',
  `TermName` varchar(100) NOT NULL,
  `StartDate` varchar(50) NOT NULL,
  `EndDate` varchar(50) NOT NULL,
  `DueDate` varchar(50) NOT NULL,
  `PercentageShare` decimal(5,2) NOT NULL DEFAULT '25.00',
  `Status` varchar(50) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `DueDateMode` varchar(20) NOT NULL DEFAULT 'AUTO',
  `DueDateOffsetDays` int NOT NULL DEFAULT '45',
  PRIMARY KEY (`Id`),
  KEY `idx_fst_feeschedule` (`FeeScheduleId`),
  CONSTRAINT `fk_fst_feeschedule` FOREIGN KEY (`FeeScheduleId`) REFERENCES `fee_schedules` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `fee_schedules`
--

DROP TABLE IF EXISTS `fee_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fee_schedules` (
  `Id` varchar(100) NOT NULL,
  `AcademicYear` varchar(50) NOT NULL,
  `NumberOfTerms` int NOT NULL DEFAULT '4',
  `Status` varchar(50) NOT NULL DEFAULT 'Published',
  `AnnualDueDate` varchar(50) NOT NULL DEFAULT '2026-04-15',
  `OneTimeDueDate` varchar(50) NOT NULL DEFAULT '2026-04-15',
  `terms_json` longtext,
  `monthly_config_json` longtext,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `ApplySameDayToAllMonths` tinyint(1) NOT NULL DEFAULT '1',
  `MonthlyDueDay` int NOT NULL DEFAULT '5',
  `DueDateOffsetDays` int NOT NULL DEFAULT '45',
  PRIMARY KEY (`Id`),
  UNIQUE KEY `uk_fee_schedules_ay` (`AcademicYear`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feeheads`
--

DROP TABLE IF EXISTS `feeheads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feeheads` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Frequency` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DefaultAmount` decimal(65,30) NOT NULL,
  `IsRefundable` tinyint(1) NOT NULL,
  `IsTaxable` tinyint(1) NOT NULL,
  `Category` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Code` varchar(50) NOT NULL DEFAULT '',
  `Mandatory` tinyint(1) NOT NULL DEFAULT '1',
  `TaxPercentage` decimal(18,2) NOT NULL DEFAULT '0.00',
  `DisplayOrder` int NOT NULL DEFAULT '1',
  `hostel_config_json` longtext,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `feepayments`
--

DROP TABLE IF EXISTS `feepayments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `feepayments` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ReceiptNo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StudentId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Amount` decimal(65,30) NOT NULL,
  `DiscountAmount` decimal(65,30) NOT NULL,
  `FineAmount` decimal(65,30) NOT NULL,
  `TransportFee` decimal(65,30) NOT NULL,
  `TransactionId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PaymentDate` datetime(6) NOT NULL,
  `PaymentMethod` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TermName` longtext,
  `FeeHeadName` longtext,
  `Remarks` longtext,
  `PaidItemsJson` longtext,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `financial_budgets`
--

DROP TABLE IF EXISTS `financial_budgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financial_budgets` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(150) NOT NULL,
  `Department` varchar(100) DEFAULT NULL,
  `AcademicYear` varchar(50) NOT NULL,
  `Branch` varchar(100) NOT NULL,
  `BranchId` int DEFAULT NULL,
  `AllocatedAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Status` varchar(50) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `financialaccounts`
--

DROP TABLE IF EXISTS `financialaccounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `financialaccounts` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL DEFAULT '',
  `Type` varchar(50) NOT NULL DEFAULT 'Bank',
  `BankName` varchar(255) NOT NULL DEFAULT '',
  `AccountNumberMasked` varchar(100) NOT NULL DEFAULT '',
  `OpeningBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `CurrentBalance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Status` varchar(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `global_letter_settings`
--

DROP TABLE IF EXISTS `global_letter_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `global_letter_settings` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `SignatoryName` varchar(200) DEFAULT NULL,
  `SignatoryTitle` varchar(200) DEFAULT NULL,
  `ProbationMonths` int NOT NULL DEFAULT '6',
  `NoticePeriodDays` int NOT NULL DEFAULT '30',
  `SignatureImageUrl` longtext,
  `SealImageUrl` longtext,
  `MasterTermsJson` longtext,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `holiday_calendars`
--

DROP TABLE IF EXISTS `holiday_calendars`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holiday_calendars` (
  `HolidayId` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FromDate` datetime(6) NOT NULL,
  `ToDate` datetime(6) NOT NULL,
  `ApplicableBranch` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`HolidayId`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homework_submissions`
--

DROP TABLE IF EXISTS `homework_submissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `homework_submissions` (
  `SubmissionId` int NOT NULL AUTO_INCREMENT,
  `HomeworkId` int NOT NULL,
  `StudentId` int NOT NULL,
  `StudentName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SubmissionDate` datetime(6) NOT NULL,
  `AttachmentUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `MarksObtained` decimal(65,30) DEFAULT NULL,
  `Feedback` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`SubmissionId`),
  KEY `IX_homework_submissions_HomeworkId` (`HomeworkId`),
  CONSTRAINT `FK_homework_submissions_homeworks_HomeworkId` FOREIGN KEY (`HomeworkId`) REFERENCES `homeworks` (`HomeworkId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `homeworks`
--

DROP TABLE IF EXISTS `homeworks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `homeworks` (
  `HomeworkId` int NOT NULL AUTO_INCREMENT,
  `ClassName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ClassRoom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SubjectName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Topic` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DueDate` datetime(6) NOT NULL,
  `PublishedTo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AttachmentFileName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AttachmentUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TeacherName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SubmissionsCount` int NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`HomeworkId`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hostel_attendances`
--

DROP TABLE IF EXISTS `hostel_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_attendances` (
  `AttendanceId` bigint NOT NULL AUTO_INCREMENT,
  `AllocationId` int NOT NULL,
  `Date` datetime(6) DEFAULT NULL,
  `CurfewStatus` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`AttendanceId`),
  KEY `IX_hostel_attendances_AllocationId` (`AllocationId`),
  CONSTRAINT `FK_hostel_attendances_student_bed_allocations_AllocationId` FOREIGN KEY (`AllocationId`) REFERENCES `student_bed_allocations` (`AllocationId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hostel_blocks`
--

DROP TABLE IF EXISTS `hostel_blocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_blocks` (
  `HostelId` int NOT NULL AUTO_INCREMENT,
  `HostelName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `HostelCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `HostelType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `WardenName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PrimaryMobileNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `AlternateMobileNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `hostel_name` varchar(150) DEFAULT NULL,
  `hostel_code` varchar(50) DEFAULT NULL,
  `hostel_type` varchar(50) DEFAULT 'Boys Hostel',
  `TotalFloors` int NOT NULL DEFAULT '1',
  `total_floors` int NOT NULL DEFAULT '1',
  `warden_name` varchar(150) DEFAULT NULL,
  `primary_mobile_number` varchar(20) DEFAULT NULL,
  `alternate_mobile_number` varchar(20) DEFAULT NULL,
  `created_at` datetime(6) DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`HostelId`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hostel_fee_configs`
--

DROP TABLE IF EXISTS `hostel_fee_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_fee_configs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `HostelId` varchar(50) NOT NULL,
  `HostelName` varchar(150) NOT NULL DEFAULT '',
  `RoomTypeId` varchar(50) NOT NULL DEFAULT '',
  `RoomTypeName` varchar(150) NOT NULL DEFAULT '',
  `RoomId` varchar(50) DEFAULT NULL,
  `RoomNo` varchar(50) NOT NULL DEFAULT 'All Rooms',
  `AcType` varchar(30) NOT NULL DEFAULT 'All',
  `SharingType` varchar(50) NOT NULL DEFAULT 'All',
  `StartClass` varchar(50) DEFAULT NULL,
  `EndClass` varchar(50) DEFAULT NULL,
  `ClassRange` varchar(100) DEFAULT NULL,
  `ApplicableClasses` text,
  `AcademicYear` varchar(50) NOT NULL DEFAULT '2025-2026',
  `Branch` varchar(100) NOT NULL DEFAULT '',
  `FeePlan` varchar(50) NOT NULL DEFAULT 'Annual',
  `HostelFee` decimal(18,2) NOT NULL DEFAULT '0.00',
  `SecurityDeposit` decimal(18,2) NOT NULL DEFAULT '0.00',
  `ApplicableTermsJson` text,
  `EffectiveFrom` varchar(30) NOT NULL DEFAULT '',
  `Status` varchar(30) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hostel_outpasses`
--

DROP TABLE IF EXISTS `hostel_outpasses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_outpasses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `student_name` varchar(200) NOT NULL,
  `admission_no` varchar(50) DEFAULT NULL,
  `hostel_name` varchar(100) DEFAULT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  `request_type` varchar(50) NOT NULL DEFAULT 'Local Outpass',
  `reason` longtext,
  `out_date` datetime(6) NOT NULL,
  `expected_return_date` datetime(6) NOT NULL,
  `actual_return_date` datetime(6) DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'Pending Approval',
  `approved_by` varchar(150) DEFAULT NULL,
  `remarks` longtext,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hostel_transfer_vacate_requests`
--

DROP TABLE IF EXISTS `hostel_transfer_vacate_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_transfer_vacate_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `student_name` varchar(200) NOT NULL,
  `admission_no` varchar(50) DEFAULT NULL,
  `action_type` varchar(50) NOT NULL DEFAULT 'Room Transfer',
  `current_room` varchar(150) DEFAULT NULL,
  `destination_hostel_id` int DEFAULT NULL,
  `destination_hostel_name` varchar(150) DEFAULT NULL,
  `destination_room_id` int DEFAULT NULL,
  `destination_room_number` varchar(50) DEFAULT NULL,
  `destination_bed_number` varchar(50) DEFAULT NULL,
  `reason` longtext,
  `status` varchar(30) NOT NULL DEFAULT 'Approved',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `hostel_wardens`
--

DROP TABLE IF EXISTS `hostel_wardens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hostel_wardens` (
  `WardenId` int NOT NULL AUTO_INCREMENT,
  `HostelId` int NOT NULL,
  `StaffId` int DEFAULT NULL,
  `WardenName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MobileNumber` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `AlternateMobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EmailAddress` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Designation` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `hostel_id` int NOT NULL DEFAULT '1',
  `staff_id` int DEFAULT NULL,
  `warden_name` varchar(150) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `floor_level` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`WardenId`),
  KEY `IX_hostel_wardens_HostelId` (`HostelId`),
  KEY `IX_hostel_wardens_StaffId` (`StaffId`),
  CONSTRAINT `FK_hostel_wardens_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE CASCADE,
  CONSTRAINT `FK_hostel_wardens_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`)
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `InventoryItemId` int NOT NULL AUTO_INCREMENT,
  `ItemName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Category` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Quantity` int NOT NULL,
  `UnitPrice` decimal(18,2) NOT NULL,
  `Location` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`InventoryItemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leave_applications`
--

DROP TABLE IF EXISTS `leave_applications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_applications` (
  `LeaveApplicationId` int NOT NULL AUTO_INCREMENT,
  `StaffId` int NOT NULL,
  `LeaveTypeId` int NOT NULL,
  `FromDate` datetime(6) NOT NULL,
  `ToDate` datetime(6) NOT NULL,
  `IsHalfDay` tinyint(1) NOT NULL,
  `RequestedDays` int NOT NULL,
  `Reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AppliedDate` datetime(6) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ApproverRemarks` longtext,
  `ApprovedBy` longtext,
  PRIMARY KEY (`LeaveApplicationId`),
  KEY `IX_leave_applications_LeaveTypeId` (`LeaveTypeId`),
  KEY `IX_leave_applications_StaffId` (`StaffId`),
  CONSTRAINT `FK_leave_applications_leave_type_configs_LeaveTypeId` FOREIGN KEY (`LeaveTypeId`) REFERENCES `leave_type_configs` (`LeaveTypeId`) ON DELETE CASCADE,
  CONSTRAINT `FK_leave_applications_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `leave_type_configs`
--

DROP TABLE IF EXISTS `leave_type_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leave_type_configs` (
  `LeaveTypeId` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AnnualAllowance` int NOT NULL,
  `CarryForward` tinyint(1) NOT NULL,
  `MaxConsecutiveDays` int NOT NULL,
  `RequiresAttachment` tinyint(1) NOT NULL,
  `IsPaid` tinyint(1) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`LeaveTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `ledgerentries`
--

DROP TABLE IF EXISTS `ledgerentries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ledgerentries` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TransactionDate` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TransactionType` varchar(100) NOT NULL DEFAULT 'Fee Payment',
  `ReferenceNo` varchar(100) NOT NULL DEFAULT '',
  `FinancialAccountId` int DEFAULT NULL,
  `StudentId` int DEFAULT NULL,
  `AdmissionNo` varchar(100) NOT NULL DEFAULT '',
  `Debit` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Credit` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Balance` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Particulars` longtext,
  `Category` varchar(100) NOT NULL DEFAULT 'Income',
  `AcademicYearId` int NOT NULL DEFAULT '0',
  `BranchId` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `librarian_attendances`
--

DROP TABLE IF EXISTS `librarian_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `librarian_attendances` (
  `AttendanceId` int NOT NULL AUTO_INCREMENT,
  `Date` datetime(6) NOT NULL,
  `StaffName` varchar(255) NOT NULL,
  `EmployeeCode` varchar(100) NOT NULL DEFAULT '',
  `ShiftDetails` varchar(255) DEFAULT NULL,
  `CheckInTime` varchar(50) DEFAULT NULL,
  `CheckOutTime` varchar(50) DEFAULT NULL,
  `TotalHours` double NOT NULL DEFAULT '0',
  `Status` varchar(50) NOT NULL DEFAULT '',
  `DutyRemarks` longtext,
  PRIMARY KEY (`AttendanceId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `library_timetable_slots`
--

DROP TABLE IF EXISTS `library_timetable_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `library_timetable_slots` (
  `SlotId` int NOT NULL AUTO_INCREMENT,
  `DayOfWeek` varchar(50) NOT NULL,
  `PeriodNumber` int NOT NULL DEFAULT '1',
  `PeriodName` varchar(100) NOT NULL DEFAULT '',
  `StartTime` varchar(50) NOT NULL DEFAULT '',
  `EndTime` varchar(50) NOT NULL DEFAULT '',
  `ClassName` varchar(100) DEFAULT NULL,
  `Section` varchar(50) DEFAULT NULL,
  `Subject` varchar(150) NOT NULL DEFAULT '',
  `AssignedLibrarian` varchar(255) NOT NULL DEFAULT '',
  `IsFreeSlot` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`SlotId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `librarybooks`
--

DROP TABLE IF EXISTS `librarybooks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `librarybooks` (
  `BookId` int NOT NULL AUTO_INCREMENT,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Author` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Category` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RackLocation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TotalCopies` int NOT NULL,
  `AvailableCopies` int NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`BookId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `libraryissuerecords`
--

DROP TABLE IF EXISTS `libraryissuerecords`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `libraryissuerecords` (
  `IssueId` int NOT NULL AUTO_INCREMENT,
  `BookId` int NOT NULL,
  `BookTitle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BorrowerName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BorrowerRole` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BorrowerIdCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StudentId` int DEFAULT NULL,
  `StaffId` int DEFAULT NULL,
  `IssueDate` datetime(6) NOT NULL,
  `DueDate` datetime(6) NOT NULL,
  `ReturnDate` datetime(6) DEFAULT NULL,
  `FineAmount` decimal(65,30) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`IssueId`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `meetings` (
  `MeetingId` int NOT NULL AUTO_INCREMENT,
  `MeetingAudience` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ParticipantType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ParticipantName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ParticipantPhone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `WardStudentName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `WardAdmissionNo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `WardClass` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MeetingTitle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Agenda` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MeetingMode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Building` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Floor` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MeetingRoom` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `RoomCapacity` int NOT NULL,
  `MeetingDate` datetime(6) NOT NULL,
  `StartTime` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EndTime` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `MeetingStatus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `OnlineMeetingUrl` varchar(500) DEFAULT NULL,
  `Priority` varchar(50) DEFAULT 'Normal',
  `AttendancePolicy` varchar(50) DEFAULT 'Mandatory',
  `Recurrence` varchar(100) DEFAULT 'None (One-time)',
  `TotalRecipients` int NOT NULL DEFAULT '47',
  PRIMARY KEY (`MeetingId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_exam_subject_configs`
--

DROP TABLE IF EXISTS `new_exam_subject_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_exam_subject_configs` (
  `config_id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL,
  `class_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subject_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subject_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `max_marks` decimal(10,2) NOT NULL DEFAULT '100.00',
  `pass_marks` decimal(10,2) NOT NULL DEFAULT '35.00',
  PRIMARY KEY (`config_id`),
  KEY `ix_new_exam_subject_configs_exam_class_subject` (`exam_id`,`class_name`,`subject_code`),
  CONSTRAINT `FK_new_exam_subject_configs_new_examinations_exam_id` FOREIGN KEY (`exam_id`) REFERENCES `new_examinations` (`exam_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=229 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_exam_timetable_slots`
--

DROP TABLE IF EXISTS `new_exam_timetable_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_exam_timetable_slots` (
  `slot_id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL,
  `class_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `section_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subject_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subject_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `total_marks` int NOT NULL,
  `exam_date` date NOT NULL,
  `time_slot` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `duration` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `room_hall` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `invigilator_faculty` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`slot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_examinations`
--

DROP TABLE IF EXISTS `new_examinations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_examinations` (
  `exam_id` int NOT NULL AUTO_INCREMENT,
  `exam_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `assessment_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `academic_term` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `applicable_classes` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Draft',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`exam_id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_grading_scale_rules`
--

DROP TABLE IF EXISTS `new_grading_scale_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_grading_scale_rules` (
  `rule_id` int NOT NULL AUTO_INCREMENT,
  `exam_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'All',
  `grade` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `min_marks` decimal(10,2) NOT NULL,
  `max_marks` decimal(10,2) NOT NULL,
  `gpa` decimal(4,2) NOT NULL,
  `pass_fail` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'PASS',
  `remarks` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_student_exam_results`
--

DROP TABLE IF EXISTS `new_student_exam_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_student_exam_results` (
  `result_id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL,
  `class_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `section_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `student_id` int NOT NULL,
  `roll_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `student_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `admission_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `total_marks_obtained` decimal(10,2) NOT NULL,
  `total_max_marks` decimal(10,2) NOT NULL,
  `percentage` decimal(6,2) NOT NULL,
  `grade` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `rank` int NOT NULL,
  `result_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `calculated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`result_id`)
) ENGINE=InnoDB AUTO_INCREMENT=183 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `new_student_marks_entries`
--

DROP TABLE IF EXISTS `new_student_marks_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `new_student_marks_entries` (
  `entry_id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL,
  `class_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `section_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subject_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subject_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `roll_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `student_name` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `admission_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `attendance_status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Present',
  `marks_obtained` decimal(10,2) NOT NULL,
  `max_marks` decimal(10,2) NOT NULL,
  `grade` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `evaluator_remarks` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Draft',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`entry_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3371 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_verifications` (
  `OtpId` int NOT NULL AUTO_INCREMENT,
  `UserId` int DEFAULT NULL,
  `AdminId` int DEFAULT NULL,
  `OtpCodeHash` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DeliveryMethod` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Purpose` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ExpiryTime` datetime(6) NOT NULL,
  `IsUsed` tinyint(1) NOT NULL,
  `AttemptCount` int NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`OtpId`),
  KEY `IX_otp_verifications_AdminId` (`AdminId`),
  KEY `IX_otp_verifications_UserId` (`UserId`),
  CONSTRAINT `fk_otp_admins` FOREIGN KEY (`AdminId`) REFERENCES `admins` (`AdminId`) ON DELETE CASCADE,
  CONSTRAINT `FK_otp_verifications_admins_AdminId` FOREIGN KEY (`AdminId`) REFERENCES `admins` (`AdminId`) ON DELETE CASCADE,
  CONSTRAINT `FK_otp_verifications_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payroll_configs`
--

DROP TABLE IF EXISTS `payroll_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_configs` (
  `PayrollConfigId` int NOT NULL AUTO_INCREMENT,
  `PayrollName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Branch` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FinancialYear` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Currency` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EffectiveFrom` datetime(6) NOT NULL,
  `EffectiveTo` datetime(6) NOT NULL,
  `leave_rules_json` longtext,
  `attendance_rules_json` longtext,
  `deduction_rules_json` longtext,
  `cycle_json` longtext,
  `overtime_json` longtext,
  `LeaveRulesJson` longtext,
  `AttendanceRulesJson` longtext,
  `DeductionRulesJson` longtext,
  `CycleJson` longtext,
  `OvertimeJson` longtext,
  PRIMARY KEY (`PayrollConfigId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payroll_runs`
--

DROP TABLE IF EXISTS `payroll_runs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payroll_runs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `EmployeeId` varchar(100) NOT NULL,
  `EmployeeName` varchar(255) DEFAULT NULL,
  `EmpId` varchar(100) DEFAULT NULL,
  `Branch` varchar(255) DEFAULT NULL,
  `Department` varchar(255) DEFAULT NULL,
  `EmployeeCategory` varchar(100) DEFAULT NULL,
  `PayrollMonth` varchar(100) NOT NULL,
  `GrossSalary` decimal(18,2) NOT NULL,
  `LeaveDeduction` decimal(18,2) NOT NULL,
  `OtherDeductions` decimal(18,2) NOT NULL,
  `NetSalary` decimal(18,2) NOT NULL,
  `Status` varchar(100) NOT NULL DEFAULT 'Pending',
  `SalaryStructureId` varchar(100) DEFAULT NULL,
  `ConfigurationId` varchar(100) DEFAULT NULL,
  `EarningsJson` longtext,
  `DeductionsJson` longtext,
  `LeaveDetailsJson` longtext,
  `ManualAdjustmentsJson` longtext,
  `Notes` text,
  `ProcessedDate` varchar(100) DEFAULT NULL,
  `LockedDate` varchar(100) DEFAULT NULL,
  `PaymentDate` varchar(100) DEFAULT NULL,
  `WorkflowStage` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `payslips`
--

DROP TABLE IF EXISTS `payslips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslips` (
  `PayslipId` int NOT NULL AUTO_INCREMENT,
  `EmployeeId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EmployeeName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Department` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Designation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Month` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Year` int NOT NULL,
  `BasicSalary` decimal(65,30) NOT NULL,
  `HouseRentAllowance` decimal(65,30) NOT NULL,
  `DearnessAllowance` decimal(65,30) NOT NULL,
  `GrossEarnings` decimal(65,30) NOT NULL,
  `ProvidentFund` decimal(65,30) NOT NULL,
  `Esi` decimal(65,30) NOT NULL,
  `TotalDeductions` decimal(65,30) NOT NULL,
  `NetPay` decimal(65,30) NOT NULL,
  `PanNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PfNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EsiNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `EmpId` longtext,
  `EmployeeCategory` longtext,
  `Branch` longtext,
  `LeaveDeduction` decimal(18,2) NOT NULL DEFAULT '0.00',
  `LopDeduction` decimal(18,2) NOT NULL DEFAULT '0.00',
  `EarningsJson` longtext,
  `DeductionsJson` longtext,
  `LeaveDetailsJson` longtext,
  `BankAccount` longtext,
  `DisbursedDate` longtext,
  `PaymentDate` longtext,
  PRIMARY KEY (`PayslipId`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `period_settings`
--

DROP TABLE IF EXISTS `period_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `period_settings` (
  `PeriodId` int NOT NULL AUTO_INCREMENT,
  `PeriodName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StartTime` time(6) NOT NULL,
  `EndTime` time(6) NOT NULL,
  `PeriodType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DisplayOrder` int NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  PRIMARY KEY (`PeriodId`)
) ENGINE=InnoDB AUTO_INCREMENT=171 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `RoleId` int NOT NULL AUTO_INCREMENT,
  `RoleName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`RoleId`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `room_masters`
--

DROP TABLE IF EXISTS `room_masters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_masters` (
  `RoomId` int NOT NULL AUTO_INCREMENT,
  `HostelId` int NOT NULL,
  `RoomTypeId` int NOT NULL,
  `FloorLevel` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `RoomNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `hostel_id` int NOT NULL DEFAULT '1',
  `room_type_id` int NOT NULL DEFAULT '1',
  `floor_level` varchar(50) DEFAULT NULL,
  `room_number` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`RoomId`),
  KEY `IX_room_masters_HostelId` (`HostelId`),
  KEY `IX_room_masters_RoomTypeId` (`RoomTypeId`),
  CONSTRAINT `FK_room_masters_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE CASCADE,
  CONSTRAINT `FK_room_masters_room_type_configs_RoomTypeId` FOREIGN KEY (`RoomTypeId`) REFERENCES `room_type_configs` (`RoomTypeId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=283 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `room_type_configs`
--

DROP TABLE IF EXISTS `room_type_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `room_type_configs` (
  `RoomTypeId` int NOT NULL AUTO_INCREMENT,
  `RoomTypeSpecification` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `BedCapacity` int NOT NULL,
  `AcType` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `room_type_specification` varchar(150) DEFAULT NULL,
  `bed_capacity` int NOT NULL DEFAULT '1',
  `ac_type` varchar(20) DEFAULT 'Non-AC',
  `layout_note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`RoomTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salary_components`
--

DROP TABLE IF EXISTS `salary_components`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_components` (
  `ComponentId` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Category` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Value` decimal(65,30) NOT NULL,
  `Taxable` tinyint(1) NOT NULL,
  `Mandatory` tinyint(1) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`ComponentId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salary_structure_items`
--

DROP TABLE IF EXISTS `salary_structure_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_structure_items` (
  `ItemId` int NOT NULL AUTO_INCREMENT,
  `StructureId` int NOT NULL,
  `ComponentName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ComponentType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Amount` decimal(65,30) NOT NULL,
  PRIMARY KEY (`ItemId`),
  KEY `IX_salary_structure_items_StructureId` (`StructureId`),
  CONSTRAINT `FK_salary_structure_items_salary_structures_StructureId` FOREIGN KEY (`StructureId`) REFERENCES `salary_structures` (`StructureId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=164 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `salary_structures`
--

DROP TABLE IF EXISTS `salary_structures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salary_structures` (
  `StructureId` int NOT NULL AUTO_INCREMENT,
  `StructureCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StructureName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Branch` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Department` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Designation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StaffCategory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EmploymentType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EffectiveDate` datetime(6) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MonthlyGrossSalary` decimal(65,30) NOT NULL,
  `AssignedEmployeesCount` int NOT NULL,
  `PayrollFrequency` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SalaryPaymentDay` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PfApplicable` tinyint(1) NOT NULL,
  `PfPercentage` decimal(65,30) NOT NULL,
  `EsiApplicable` tinyint(1) NOT NULL,
  `EsiPercentage` decimal(65,30) NOT NULL,
  `ProfessionalTaxApplicable` tinyint(1) NOT NULL,
  `ProfessionalTaxAmount` decimal(65,30) NOT NULL,
  `RoundOffRule` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`StructureId`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `scholarships`
--

DROP TABLE IF EXISTS `scholarships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `scholarships` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(150) NOT NULL,
  `Code` varchar(50) NOT NULL,
  `Type` varchar(50) NOT NULL DEFAULT 'Merit',
  `DiscountType` varchar(30) NOT NULL DEFAULT 'Percentage',
  `Percentage` decimal(10,2) NOT NULL DEFAULT '0.00',
  `FixedAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `ApplicableFeeHeadIdsJson` longtext,
  `ApplicableClassesJson` longtext,
  `StartDate` varchar(30) NOT NULL DEFAULT '2026-04-01',
  `EndDate` varchar(30) NOT NULL DEFAULT '2027-03-31',
  `Eligibility` varchar(255) DEFAULT NULL,
  `Description` longtext,
  `Status` varchar(30) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `Code` (`Code`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `school_events`
--

DROP TABLE IF EXISTS `school_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_events` (
  `EventId` int NOT NULL AUTO_INCREMENT,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Category` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Venue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StartDate` datetime(6) NOT NULL,
  `EndDate` datetime(6) NOT NULL,
  `Time` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Organizer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ApplicableBranch` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`EventId`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schools`
--

DROP TABLE IF EXISTS `schools`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schools` (
  `SchoolId` int NOT NULL AUTO_INCREMENT,
  `SchoolName` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SchoolCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Website` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PrincipalName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`SchoolId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `schoolsettings`
--

DROP TABLE IF EXISTS `schoolsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schoolsettings` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `SchoolName` varchar(250) NOT NULL DEFAULT 'Pirnav Educational Institutions',
  `Tagline` varchar(250) NOT NULL DEFAULT 'Empowering Minds, Shaping Tomorrow',
  `Address` text NOT NULL,
  `Phone` varchar(50) NOT NULL DEFAULT '+91 9123456789',
  `Email` varchar(100) NOT NULL DEFAULT 'contact@pirnavschools.edu',
  `Website` varchar(150) NOT NULL DEFAULT 'https://pirnavschools.edu',
  `PrincipalName` varchar(150) NOT NULL DEFAULT 'Dr. Eleanor Vance',
  `LogoUrl` text,
  `LogoFormat` varchar(20) NOT NULL DEFAULT 'PNG',
  `CampusesJson` longtext NOT NULL,
  `CertificateTemplatesJson` longtext NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `IdSequenceSettingsJson` longtext,
  `UserProfileJson` longtext,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `section`
--

DROP TABLE IF EXISTS `section`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `section` (
  `SectionId` int NOT NULL AUTO_INCREMENT,
  `SectionName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AcademicClassId` int NOT NULL,
  `ClassTeacherId` int DEFAULT NULL,
  PRIMARY KEY (`SectionId`),
  KEY `IX_Section_AcademicClassId` (`AcademicClassId`),
  KEY `IX_Section_ClassTeacherId` (`ClassTeacherId`),
  CONSTRAINT `FK_Section_AcademicClass_AcademicClassId` FOREIGN KEY (`AcademicClassId`) REFERENCES `academicclass` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Section_staff_ClassTeacherId` FOREIGN KEY (`ClassTeacherId`) REFERENCES `staff` (`StaffId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `StaffId` int NOT NULL AUTO_INCREMENT,
  `EmployeeId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EmployeeCategory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FirstName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `LastName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Gender` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DateOfBirth` datetime(6) DEFAULT NULL,
  `ResidentialAddress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Designation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Department` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `SystemRole` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `JoiningDate` datetime(6) DEFAULT NULL,
  `Qualification` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PrimarySubject` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Specialization` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MonthlySalary` decimal(65,30) DEFAULT NULL,
  `GrossSalary` decimal(65,30) DEFAULT NULL,
  `NetSalary` decimal(65,30) DEFAULT NULL,
  `SalaryStructureId` int DEFAULT NULL,
  `SalaryStructureName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `SalaryStructureEffectiveDate` datetime(6) DEFAULT NULL,
  `AccountHolderName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AccountNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BankName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BranchName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IfscCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `UpiId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsActive` tinyint(1) DEFAULT NULL,
  `CasualLeaveBalance` int NOT NULL,
  `SickLeaveBalance` int NOT NULL,
  `EarnedLeaveBalance` int NOT NULL,
  `MiddleName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AlternateMobile` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AadhaarNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PanNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PresentAddress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PermanentAddress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `City` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `State` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PinCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EmploymentType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ReportingManager` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AcademicYear` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsClassTeacherEligible` tinyint(1) DEFAULT NULL,
  `BloodGroup` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ProfilePhoto` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Country` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `District` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `FatherName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MaritalStatus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MotherName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Nationality` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Religion` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`StaffId`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_attendances`
--

DROP TABLE IF EXISTS `staff_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_attendances` (
  `StaffAttendanceId` int NOT NULL AUTO_INCREMENT,
  `StaffId` int NOT NULL,
  `Date` datetime(6) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AcademicYear` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Branch` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Department` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Designation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `InTime` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `OutTime` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`StaffAttendanceId`),
  KEY `IX_staff_attendances_StaffId` (`StaffId`),
  CONSTRAINT `FK_staff_attendances_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=93 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_documents`
--

DROP TABLE IF EXISTS `staff_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_documents` (
  `StaffDocumentId` int NOT NULL AUTO_INCREMENT,
  `StaffId` int NOT NULL,
  `DocumentType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FileUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsRequired` tinyint(1) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `UploadedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`StaffDocumentId`),
  KEY `IX_staff_documents_StaffId` (`StaffId`),
  CONSTRAINT `FK_staff_documents_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_experiences`
--

DROP TABLE IF EXISTS `staff_experiences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_experiences` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StaffId` int NOT NULL,
  `PreviousOrganization` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `DesignationHeld` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `FromDate` datetime(6) DEFAULT NULL,
  `ToDate` datetime(6) DEFAULT NULL,
  `TotalExperience` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ReasonForLeaving` varchar(300) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_staff_experiences_StaffId` (`StaffId`),
  CONSTRAINT `FK_staff_experiences_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_letters`
--

DROP TABLE IF EXISTS `staff_letters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_letters` (
  `Id` varchar(100) NOT NULL,
  `LetterNumber` varchar(100) NOT NULL,
  `LetterType` varchar(50) NOT NULL DEFAULT 'offer',
  `StaffId` varchar(50) DEFAULT NULL,
  `StaffEmpId` varchar(50) DEFAULT NULL,
  `StaffName` varchar(200) NOT NULL,
  `Designation` varchar(150) DEFAULT NULL,
  `Department` varchar(150) DEFAULT NULL,
  `Branch` varchar(150) DEFAULT NULL,
  `IssueDate` varchar(50) DEFAULT NULL,
  `GeneratedBy` varchar(150) DEFAULT NULL,
  `Status` varchar(50) DEFAULT 'Issued',
  `PayloadJson` longtext,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `staff_qualifications`
--

DROP TABLE IF EXISTS `staff_qualifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_qualifications` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StaffId` int NOT NULL,
  `QualificationDegree` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `SpecializationSubject` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `InstitutionCollege` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `BoardUniversity` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PassingYear` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PercentageCgpa` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_staff_qualifications_StaffId` (`StaffId`),
  CONSTRAINT `FK_staff_qualifications_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_attendance_sessions`
--

DROP TABLE IF EXISTS `student_attendance_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendance_sessions` (
  `AttendanceSessionId` int NOT NULL AUTO_INCREMENT,
  `AttendanceDate` date NOT NULL,
  `BranchId` int NOT NULL,
  `AcademicYearId` int NOT NULL,
  `ClassId` int NOT NULL,
  `SectionId` int NOT NULL,
  `SubjectId` int NOT NULL,
  `PeriodId` int NOT NULL,
  `TimetableSlotId` int DEFAULT NULL,
  `MarkedByStaffId` int NOT NULL,
  `IsLocked` tinyint(1) NOT NULL DEFAULT '0',
  `LockedByStaffId` int DEFAULT NULL,
  `LockedAt` datetime(6) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`AttendanceSessionId`),
  UNIQUE KEY `UX_StudentAttendanceSession_Sheet` (`AttendanceDate`,`BranchId`,`AcademicYearId`,`ClassId`,`SectionId`,`SubjectId`,`PeriodId`),
  KEY `IX_student_attendance_sessions_AcademicYearId` (`AcademicYearId`),
  KEY `IX_student_attendance_sessions_BranchId` (`BranchId`),
  KEY `IX_student_attendance_sessions_ClassId` (`ClassId`),
  KEY `IX_student_attendance_sessions_MarkedByStaffId` (`MarkedByStaffId`),
  KEY `IX_student_attendance_sessions_PeriodId` (`PeriodId`),
  KEY `IX_student_attendance_sessions_SectionId` (`SectionId`),
  KEY `IX_student_attendance_sessions_SubjectId` (`SubjectId`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_attendances`
--

DROP TABLE IF EXISTS `student_attendances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_attendances` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `AttendanceSessionId` int NOT NULL,
  `StudentId` int DEFAULT NULL,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Remarks` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UX_StudentAttendance_SessionStudent` (`AttendanceSessionId`,`StudentId`),
  KEY `IX_student_attendances_StudentId` (`StudentId`),
  CONSTRAINT `FK_student_attendances_student_attendance_sessions_AttendanceSe~` FOREIGN KEY (`AttendanceSessionId`) REFERENCES `student_attendance_sessions` (`AttendanceSessionId`) ON DELETE CASCADE,
  CONSTRAINT `FK_student_attendances_students_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `students` (`student_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1030 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_bed_allocations`
--

DROP TABLE IF EXISTS `student_bed_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_bed_allocations` (
  `AllocationId` int NOT NULL AUTO_INCREMENT,
  `RegistrationNo` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `StudentName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `StudentId` int DEFAULT NULL,
  `HostelId` int NOT NULL,
  `RoomId` int NOT NULL,
  `BedNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `JoiningDate` datetime(6) DEFAULT NULL,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `hostel_id` int NOT NULL DEFAULT '1',
  `room_id` int NOT NULL DEFAULT '1',
  `bed_number` varchar(50) DEFAULT NULL,
  `joining_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`AllocationId`),
  KEY `IX_student_bed_allocations_HostelId` (`HostelId`),
  KEY `IX_student_bed_allocations_RegistrationNo_Status` (`RegistrationNo`,`Status`),
  KEY `IX_student_bed_allocations_RoomId` (`RoomId`),
  KEY `IX_student_bed_allocations_StudentId` (`StudentId`),
  CONSTRAINT `FK_student_bed_allocations_admission_applications_StudentId` FOREIGN KEY (`StudentId`) REFERENCES `admission_applications` (`Id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_student_bed_allocations_hostel_blocks_HostelId` FOREIGN KEY (`HostelId`) REFERENCES `hostel_blocks` (`HostelId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_student_bed_allocations_room_masters_RoomId` FOREIGN KEY (`RoomId`) REFERENCES `room_masters` (`RoomId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_discounts`
--

DROP TABLE IF EXISTS `student_discounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_discounts` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StudentId` varchar(50) NOT NULL,
  `StudentName` varchar(150) NOT NULL,
  `AdmissionNo` varchar(50) DEFAULT NULL,
  `ClassName` varchar(50) DEFAULT NULL,
  `Section` varchar(20) DEFAULT NULL,
  `DiscountId` int NOT NULL,
  `DiscountName` varchar(150) NOT NULL,
  `DiscountCode` varchar(50) NOT NULL,
  `Mode` varchar(30) NOT NULL DEFAULT 'Percentage',
  `Value` decimal(10,2) NOT NULL DEFAULT '0.00',
  `AppliedDate` varchar(30) NOT NULL,
  `Status` varchar(30) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_fee_assignments`
--

DROP TABLE IF EXISTS `student_fee_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_fee_assignments` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StudentId` varchar(50) NOT NULL,
  `DynamicFeeStructureId` int DEFAULT NULL,
  `TotalAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `PaidAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `DueAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Status` varchar(50) NOT NULL DEFAULT 'Active',
  `FeePolicy` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_images`
--

DROP TABLE IF EXISTS `student_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_images` (
  `file_id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `stored_file_name` varchar(255) NOT NULL,
  `content_type` varchar(100) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` bigint NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`file_id`),
  KEY `FK_student_images_students_student_id` (`student_id`),
  CONSTRAINT `FK_student_images_students_student_id` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_promotion_histories`
--

DROP TABLE IF EXISTS `student_promotion_histories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_promotion_histories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `admission_no` varchar(50) NOT NULL,
  `student_name` varchar(150) NOT NULL,
  `from_academic_year` varchar(50) NOT NULL,
  `to_academic_year` varchar(50) NOT NULL,
  `from_class` varchar(50) NOT NULL,
  `to_class` varchar(50) NOT NULL,
  `from_section` varchar(20) NOT NULL,
  `to_section` varchar(20) NOT NULL,
  `overall_pct` decimal(5,2) NOT NULL DEFAULT '0.00',
  `grade` varchar(10) NOT NULL DEFAULT 'A',
  `final_result` varchar(20) NOT NULL DEFAULT 'PASS',
  `status` varchar(30) NOT NULL DEFAULT 'Promoted',
  `remarks` varchar(255) DEFAULT NULL,
  `promotion_date` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_scholarships`
--

DROP TABLE IF EXISTS `student_scholarships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_scholarships` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StudentId` varchar(50) NOT NULL,
  `StudentName` varchar(150) NOT NULL,
  `AdmissionNo` varchar(50) DEFAULT NULL,
  `ClassName` varchar(50) DEFAULT NULL,
  `Section` varchar(20) DEFAULT NULL,
  `ScholarshipId` int NOT NULL,
  `ScholarshipName` varchar(150) NOT NULL,
  `ScholarshipCode` varchar(50) NOT NULL,
  `DiscountType` varchar(30) NOT NULL DEFAULT 'Percentage',
  `DiscountValue` decimal(10,2) NOT NULL DEFAULT '0.00',
  `AppliedDate` varchar(30) NOT NULL,
  `Status` varchar(30) NOT NULL DEFAULT 'Active',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_transport_assignments`
--

DROP TABLE IF EXISTS `student_transport_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_transport_assignments` (
  `StudentTransportAssignmentId` bigint NOT NULL AUTO_INCREMENT,
  `AdmissionNo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RouteId` bigint NOT NULL,
  `PickupPointId` bigint NOT NULL,
  `VehicleAssignmentId` bigint NOT NULL,
  `EffectiveFrom` datetime(6) NOT NULL,
  `EffectiveTo` datetime(6) DEFAULT NULL,
  `TransportType` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` tinyint(1) NOT NULL DEFAULT '1',
  `IsDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `StudentId` bigint DEFAULT NULL,
  PRIMARY KEY (`StudentTransportAssignmentId`),
  KEY `IX_STA_Route_Pickup_Vehicle` (`RouteId`,`PickupPointId`,`VehicleAssignmentId`,`Status`,`IsDeleted`),
  KEY `IX_student_transport_assignments_AdmissionNo` (`AdmissionNo`),
  KEY `IX_student_transport_assignments_AdmissionNo_EffectiveFrom_Effe~` (`AdmissionNo`,`EffectiveFrom`,`EffectiveTo`),
  KEY `IX_student_transport_assignments_PickupPointId` (`PickupPointId`),
  KEY `IX_student_transport_assignments_RouteId` (`RouteId`),
  KEY `IX_student_transport_assignments_VehicleAssignmentId` (`VehicleAssignmentId`),
  CONSTRAINT `FK_student_transport_assignments_transport_pickup_points_Pickup~` FOREIGN KEY (`PickupPointId`) REFERENCES `transport_pickup_points` (`PickupPointId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_student_transport_assignments_transport_routes_RouteId` FOREIGN KEY (`RouteId`) REFERENCES `transport_routes` (`RouteId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_student_transport_assignments_transport_vehicle_assignments_~` FOREIGN KEY (`VehicleAssignmentId`) REFERENCES `transport_vehicle_assignments` (`AssignmentId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=253 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `student_uniform_distributions`
--

DROP TABLE IF EXISTS `student_uniform_distributions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_uniform_distributions` (
  `DistributionId` int NOT NULL AUTO_INCREMENT,
  `StudentId` int DEFAULT NULL,
  `AdmissionNo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `StudentName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ClassName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `TransactionType` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UniformTypeId` int DEFAULT NULL,
  `ItemName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `SizeSpec` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Quantity` int NOT NULL,
  `TotalAmount` decimal(18,2) NOT NULL,
  `DistributionDate` datetime(6) DEFAULT NULL,
  `Notes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PaymentStatus` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`DistributionId`),
  KEY `IX_student_uniform_distributions_UniformTypeId` (`UniformTypeId`),
  CONSTRAINT `FK_student_uniform_distributions_uniform_types_UniformTypeId` FOREIGN KEY (`UniformTypeId`) REFERENCES `uniform_types` (`UniformTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=124 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `studentfeeassignments`
--

DROP TABLE IF EXISTS `studentfeeassignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `studentfeeassignments` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `StudentId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DynamicFeeStructureId` int DEFAULT NULL,
  `TotalAmount` decimal(65,30) NOT NULL,
  `PaidAmount` decimal(65,30) NOT NULL,
  `DueAmount` decimal(65,30) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FeePolicy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` int NOT NULL AUTO_INCREMENT,
  `admission_number` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `roll_number` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `student_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `father_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `father_mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `mother_name` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `mother_mobile` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `mobile_number` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `address` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `branch_id` int NOT NULL,
  `academic_year_id` int NOT NULL,
  `class_id` int NOT NULL,
  `section_id` int NOT NULL,
  `status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Active',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_by` bigint DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `AcademicClassId` int DEFAULT NULL,
  `SectionTempId` int DEFAULT NULL,
  `avatar` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`student_id`),
  UNIQUE KEY `ux_students_admission_number` (`admission_number`),
  UNIQUE KEY `ux_students_year_class_section_roll` (`academic_year_id`,`class_id`,`section_id`,`roll_number`),
  KEY `IX_students_AcademicClassId` (`AcademicClassId`),
  KEY `IX_students_class_id` (`class_id`),
  KEY `ix_students_management_filter` (`branch_id`,`academic_year_id`,`class_id`,`section_id`,`status`),
  KEY `IX_students_section_id` (`section_id`),
  KEY `IX_students_SectionTempId` (`SectionTempId`),
  CONSTRAINT `FK_students_academic_years_academic_year_id` FOREIGN KEY (`academic_year_id`) REFERENCES `academic_years` (`academic_year_id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_students_AcademicClass_AcademicClassId` FOREIGN KEY (`AcademicClassId`) REFERENCES `academicclass` (`Id`),
  CONSTRAINT `FK_students_branches_branch_id` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`BranchId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_students_class_sections_section_id` FOREIGN KEY (`section_id`) REFERENCES `class_sections` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_students_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `FK_students_Section_SectionTempId` FOREIGN KEY (`SectionTempId`) REFERENCES `section` (`SectionId`)
) ENGINE=InnoDB AUTO_INCREMENT=1524 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subject_teacher_allocations`
--

DROP TABLE IF EXISTS `subject_teacher_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subject_teacher_allocations` (
  `id` varchar(50) NOT NULL,
  `class_name` varchar(100) NOT NULL,
  `section` varchar(50) NOT NULL,
  `subject_name` varchar(100) DEFAULT NULL,
  `teacher_name` varchar(150) NOT NULL,
  `role` varchar(50) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `SubjectId` int NOT NULL AUTO_INCREMENT,
  `SubjectCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SubjectName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CourseCode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `AcademicClassId` int DEFAULT NULL,
  `DepartmentId` int NOT NULL,
  PRIMARY KEY (`SubjectId`),
  UNIQUE KEY `IX_subjects_SubjectCode` (`SubjectCode`),
  KEY `IX_subjects_AcademicClassId` (`AcademicClassId`),
  KEY `IX_subjects_DepartmentId` (`DepartmentId`),
  CONSTRAINT `FK_subjects_AcademicClass_AcademicClassId` FOREIGN KEY (`AcademicClassId`) REFERENCES `academicclass` (`Id`),
  CONSTRAINT `FK_subjects_departments_DepartmentId` FOREIGN KEY (`DepartmentId`) REFERENCES `departments` (`DepartmentId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `system_notifications`
--

DROP TABLE IF EXISTS `system_notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_notifications` (
  `NotificationId` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsRead` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `SchoolId` int DEFAULT NULL,
  PRIMARY KEY (`NotificationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teacher_assignments`
--

DROP TABLE IF EXISTS `teacher_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_assignments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `class_id` int NOT NULL,
  `section_letter` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `subject_id` int DEFAULT NULL,
  `teacher_id` int NOT NULL,
  `role` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `ux_teacher_assignments_class_sec_subj_role` (`class_id`,`section_letter`,`subject_id`,`role`),
  KEY `IX_teacher_assignments_subject_id` (`subject_id`),
  KEY `IX_teacher_assignments_teacher_id` (`teacher_id`),
  KEY `IX_teacher_assignments_class_id` (`class_id`),
  CONSTRAINT `FK_teacher_assignments_classes_class_id` FOREIGN KEY (`class_id`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_teacher_assignments_staff_teacher_id` FOREIGN KEY (`teacher_id`) REFERENCES `staff` (`StaffId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_teacher_assignments_subjects_subject_id` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`SubjectId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=809 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teacher_attendance_corrections`
--

DROP TABLE IF EXISTS `teacher_attendance_corrections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_attendance_corrections` (
  `CorrectionId` int NOT NULL AUTO_INCREMENT,
  `StaffId` int NOT NULL,
  `AttendanceDate` date NOT NULL,
  `CurrentInTime` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CurrentOutTime` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `RequestedInTime` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `RequestedOutTime` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Reason` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL DEFAULT 'Pending',
  `ApprovedRemarks` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ApprovedBy` int DEFAULT NULL,
  `ApprovedAt` datetime(6) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`CorrectionId`),
  KEY `ix_teacher_attendance_corrections_staff_date` (`StaffId`,`AttendanceDate`),
  CONSTRAINT `FK_teacher_attendance_corrections_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teacher_subject_assignments`
--

DROP TABLE IF EXISTS `teacher_subject_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_subject_assignments` (
  `AssignmentId` int NOT NULL AUTO_INCREMENT,
  `ClassId` int NOT NULL,
  `SectionId` int NOT NULL,
  `SubjectId` int NOT NULL,
  `StaffId` int NOT NULL,
  PRIMARY KEY (`AssignmentId`),
  UNIQUE KEY `IX_teacher_subject_assignments_ClassId_SectionId_SubjectId` (`ClassId`,`SectionId`,`SubjectId`),
  KEY `IX_teacher_subject_assignments_SectionId` (`SectionId`),
  KEY `IX_teacher_subject_assignments_StaffId` (`StaffId`),
  KEY `IX_teacher_subject_assignments_SubjectId` (`SubjectId`),
  CONSTRAINT `FK_teacher_subject_assignments_class_sections_SectionId` FOREIGN KEY (`SectionId`) REFERENCES `class_sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_teacher_subject_assignments_classes_ClassId` FOREIGN KEY (`ClassId`) REFERENCES `classes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_teacher_subject_assignments_staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`StaffId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_teacher_subject_assignments_subjects_SubjectId` FOREIGN KEY (`SubjectId`) REFERENCES `subjects` (`SubjectId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=312 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `teacher_substitutions`
--

DROP TABLE IF EXISTS `teacher_substitutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_substitutions` (
  `SubstitutionId` int NOT NULL AUTO_INCREMENT,
  `Date` datetime NOT NULL,
  `DayOfWeek` varchar(20) NOT NULL,
  `SlotId` int DEFAULT NULL,
  `PeriodId` int DEFAULT NULL,
  `PeriodName` varchar(50) DEFAULT NULL,
  `StartTime` time NOT NULL,
  `EndTime` time NOT NULL,
  `ClassId` int DEFAULT NULL,
  `ClassName` varchar(50) DEFAULT NULL,
  `SectionId` int DEFAULT NULL,
  `SectionName` varchar(50) DEFAULT NULL,
  `SubjectId` int DEFAULT NULL,
  `SubjectName` varchar(100) DEFAULT NULL,
  `OriginalTeacherId` int NOT NULL,
  `OriginalTeacherName` varchar(100) DEFAULT NULL,
  `SubstituteTeacherId` int NOT NULL,
  `SubstituteTeacherName` varchar(100) DEFAULT NULL,
  `RoomNo` varchar(50) DEFAULT NULL,
  `Reason` varchar(150) DEFAULT NULL,
  `LeaveApplicationId` int DEFAULT NULL,
  `Status` varchar(30) NOT NULL DEFAULT 'Assigned',
  `Remarks` varchar(255) DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `CreatedBy` varchar(100) DEFAULT NULL,
  `AcademicYear` varchar(50) DEFAULT NULL,
  `BranchName` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`SubstitutionId`),
  KEY `ix_sub_date_substitute` (`Date`,`SubstituteTeacherId`),
  KEY `ix_sub_date_original` (`Date`,`OriginalTeacherId`),
  KEY `ix_sub_date_status` (`Date`,`Status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `timetable_headers`
--

DROP TABLE IF EXISTS `timetable_headers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetable_headers` (
  `HeaderId` int NOT NULL AUTO_INCREMENT,
  `AcademicYear` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BranchName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ClassId` int NOT NULL,
  `SectionId` int NOT NULL,
  `Status` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IncludeSaturday` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`HeaderId`),
  UNIQUE KEY `IX_timetable_headers_ClassId_SectionId_AcademicYear` (`ClassId`,`SectionId`,`AcademicYear`),
  KEY `IX_timetable_headers_SectionId` (`SectionId`),
  CONSTRAINT `FK_timetable_headers_class_sections_SectionId` FOREIGN KEY (`SectionId`) REFERENCES `class_sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `FK_timetable_headers_classes_ClassId` FOREIGN KEY (`ClassId`) REFERENCES `classes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `timetable_slots`
--

DROP TABLE IF EXISTS `timetable_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `timetable_slots` (
  `SlotId` int NOT NULL AUTO_INCREMENT,
  `HeaderId` int NOT NULL,
  `PeriodId` int DEFAULT NULL,
  `DayOfWeek` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StartTime` time(6) NOT NULL,
  `EndTime` time(6) NOT NULL,
  `SubjectId` int NOT NULL,
  `TeacherId` int NOT NULL,
  `RoomNo` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  PRIMARY KEY (`SlotId`),
  KEY `IX_timetable_slots_HeaderId_DayOfWeek` (`HeaderId`,`DayOfWeek`),
  KEY `IX_timetable_slots_PeriodId` (`PeriodId`),
  KEY `IX_timetable_slots_RoomNo_DayOfWeek_StartTime_EndTime` (`RoomNo`,`DayOfWeek`,`StartTime`,`EndTime`),
  KEY `IX_timetable_slots_SubjectId` (`SubjectId`),
  KEY `IX_timetable_slots_TeacherId_DayOfWeek_StartTime_EndTime` (`TeacherId`,`DayOfWeek`,`StartTime`,`EndTime`),
  CONSTRAINT `FK_timetable_slots_period_settings_PeriodId` FOREIGN KEY (`PeriodId`) REFERENCES `period_settings` (`PeriodId`),
  CONSTRAINT `FK_timetable_slots_staff_TeacherId` FOREIGN KEY (`TeacherId`) REFERENCES `staff` (`StaffId`) ON DELETE CASCADE,
  CONSTRAINT `FK_timetable_slots_subjects_SubjectId` FOREIGN KEY (`SubjectId`) REFERENCES `subjects` (`SubjectId`) ON DELETE CASCADE,
  CONSTRAINT `FK_timetable_slots_timetable_headers_HeaderId` FOREIGN KEY (`HeaderId`) REFERENCES `timetable_headers` (`HeaderId`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2240 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transport_attendants`
--

DROP TABLE IF EXISTS `transport_attendants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_attendants` (
  `AttendantId` bigint NOT NULL AUTO_INCREMENT,
  `AttendantName` varchar(255) NOT NULL,
  `MobileNumber` varchar(100) NOT NULL,
  `EmployeeId` varchar(100) DEFAULT NULL,
  `Gender` varchar(20) DEFAULT NULL,
  `BranchName` varchar(255) DEFAULT NULL,
  `AlternateMobileNumber` varchar(100) DEFAULT NULL,
  `Address` text,
  `BloodGroup` varchar(10) DEFAULT NULL,
  `EmergencyContactName` varchar(255) DEFAULT NULL,
  `EmergencyContactNumber` varchar(100) DEFAULT NULL,
  `AssignedVehicleId` bigint DEFAULT NULL,
  `Status` tinyint(1) NOT NULL DEFAULT '1',
  `IsDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedBy` bigint DEFAULT NULL,
  `UpdatedBy` bigint DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`AttendantId`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transport_driver_documents`
--

DROP TABLE IF EXISTS `transport_driver_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_driver_documents` (
  `Id` bigint NOT NULL AUTO_INCREMENT,
  `DriverId` varchar(100) NOT NULL,
  `DocumentCategory` varchar(100) DEFAULT NULL,
  `DocumentNumber` varchar(100) DEFAULT NULL,
  `IssueDate` varchar(50) DEFAULT NULL,
  `ExpiryDate` varchar(50) DEFAULT NULL,
  `BadgeNumber` varchar(100) DEFAULT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Verified',
  `FileName` varchar(255) DEFAULT NULL,
  `FileUrl` varchar(500) DEFAULT NULL,
  `IsDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`Id`),
  KEY `ix_driver_id` (`DriverId`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transport_drivers`
--

DROP TABLE IF EXISTS `transport_drivers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_drivers` (
  `DriverId` bigint NOT NULL AUTO_INCREMENT,
  `DriverName` varchar(255) DEFAULT NULL,
  `LicenceNumber` varchar(50) DEFAULT NULL,
  `LicenceExpiry` datetime(6) DEFAULT NULL,
  `MobileNumber` varchar(100) DEFAULT NULL,
  `AlternateMobileNumber` varchar(100) DEFAULT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Address` text,
  `BloodGroup` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EmergencyContactName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EmergencyContactNumber` varchar(100) DEFAULT NULL,
  `Status` tinyint(1) NOT NULL DEFAULT '1',
  `IsDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedBy` bigint DEFAULT NULL,
  `UpdatedBy` bigint DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `AssignedVehicleId` bigint DEFAULT NULL,
  `EmployeeId` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`DriverId`),
  UNIQUE KEY `IX_transport_drivers_LicenceNumber` (`LicenceNumber`),
  KEY `IX_transport_drivers_AssignedVehicleId` (`AssignedVehicleId`),
  KEY `IX_transport_drivers_MobileNumber` (`MobileNumber`),
  CONSTRAINT `FK_transport_drivers_transport_vehicles_AssignedVehicleId` FOREIGN KEY (`AssignedVehicleId`) REFERENCES `transport_vehicles` (`VehicleId`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transport_pickup_points`
--

DROP TABLE IF EXISTS `transport_pickup_points`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_pickup_points` (
  `PickupPointId` bigint NOT NULL AUTO_INCREMENT,
  `RouteId` bigint NOT NULL,
  `PickupPointName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Landmark` varchar(250) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `SequenceNo` int NOT NULL,
  `PickupTime` time(6) NOT NULL,
  `DistanceFromStart` decimal(10,2) NOT NULL,
  `Status` tinyint(1) NOT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `DropTime` time(6) NOT NULL DEFAULT '16:15:00.000000',
  `MonthlyFee` decimal(10,2) NOT NULL DEFAULT '1200.00',
  PRIMARY KEY (`PickupPointId`),
  KEY `IX_transport_pickup_points_RouteId_PickupPointName` (`RouteId`,`PickupPointName`),
  KEY `IX_transport_pickup_points_RouteId_SequenceNo` (`RouteId`,`SequenceNo`),
  CONSTRAINT `FK_transport_pickup_points_transport_routes_RouteId` FOREIGN KEY (`RouteId`) REFERENCES `transport_routes` (`RouteId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=942 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transport_routes`
--

DROP TABLE IF EXISTS `transport_routes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_routes` (
  `RouteId` bigint NOT NULL AUTO_INCREMENT,
  `RouteCode` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RouteName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StartLocation` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `EndLocation` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `PickupPoint` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DropPoint` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DistanceKm` decimal(10,2) NOT NULL,
  `EstimatedDurationMinutes` int NOT NULL,
  `Description` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `MonthlyFee` decimal(65,30) NOT NULL,
  `Status` tinyint(1) NOT NULL DEFAULT '1',
  `IsDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedBy` bigint DEFAULT NULL,
  `UpdatedBy` bigint DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  `VehicleId` bigint DEFAULT NULL,
  `MinRangeKm` decimal(18,2) NOT NULL DEFAULT '5.00',
  `NonAcBaseFare` decimal(18,2) NOT NULL DEFAULT '1000.00',
  `NonAcRatePerKm` decimal(18,2) NOT NULL DEFAULT '100.00',
  `AcBaseFare` decimal(18,2) NOT NULL DEFAULT '1200.00',
  `AcRatePerKm` decimal(18,2) NOT NULL DEFAULT '150.00',
  PRIMARY KEY (`RouteId`),
  UNIQUE KEY `ux_transport_routes_route_code` (`RouteCode`),
  KEY `IX_transport_routes_VehicleId` (`VehicleId`),
  CONSTRAINT `FK_transport_routes_transport_vehicles_VehicleId` FOREIGN KEY (`VehicleId`) REFERENCES `transport_vehicles` (`VehicleId`)
) ENGINE=InnoDB AUTO_INCREMENT=137 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transport_vehicle_assignments`
--

DROP TABLE IF EXISTS `transport_vehicle_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_vehicle_assignments` (
  `AssignmentId` bigint NOT NULL AUTO_INCREMENT,
  `RouteId` bigint NOT NULL,
  `VehicleId` bigint NOT NULL,
  `DriverId` bigint NOT NULL,
  `EffectiveFrom` datetime(6) NOT NULL,
  `EffectiveTo` datetime(6) DEFAULT NULL,
  `Shift` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Remarks` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` tinyint(1) NOT NULL DEFAULT '1',
  `IsDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `AssignmentDate` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `AttendantId` bigint DEFAULT NULL,
  `BranchName` varchar(100) DEFAULT NULL,
  `AcademicYear` varchar(50) DEFAULT NULL,
  `MorningTripTime` varchar(50) DEFAULT NULL,
  `EveningTripTime` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`AssignmentId`),
  KEY `IX_transport_vehicle_assignments_DriverId` (`DriverId`),
  KEY `IX_transport_vehicle_assignments_RouteId` (`RouteId`),
  KEY `IX_transport_vehicle_assignments_RouteId_VehicleId_DriverId_Eff~` (`RouteId`,`VehicleId`,`DriverId`,`EffectiveFrom`),
  KEY `IX_transport_vehicle_assignments_VehicleId` (`VehicleId`),
  KEY `IX_TVA_Vehicle_Driver_Route` (`VehicleId`,`DriverId`,`RouteId`,`Status`,`IsDeleted`),
  CONSTRAINT `FK_transport_vehicle_assignments_transport_drivers_DriverId` FOREIGN KEY (`DriverId`) REFERENCES `transport_drivers` (`DriverId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_transport_vehicle_assignments_transport_routes_RouteId` FOREIGN KEY (`RouteId`) REFERENCES `transport_routes` (`RouteId`) ON DELETE RESTRICT,
  CONSTRAINT `FK_transport_vehicle_assignments_transport_vehicles_VehicleId` FOREIGN KEY (`VehicleId`) REFERENCES `transport_vehicles` (`VehicleId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=76 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transport_vehicle_maintenances`
--

DROP TABLE IF EXISTS `transport_vehicle_maintenances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_vehicle_maintenances` (
  `maintenance_id` bigint NOT NULL AUTO_INCREMENT,
  `vehicle_id` bigint NOT NULL,
  `service_type` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `service_date` date NOT NULL,
  `cost` decimal(12,2) NOT NULL DEFAULT '0.00',
  `vendor_center` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `next_service_due` date DEFAULT NULL,
  `remarks` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `status` tinyint(1) NOT NULL DEFAULT '1',
  `is_deleted` tinyint(1) NOT NULL DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`maintenance_id`),
  KEY `IX_transport_vehicle_maintenance_vehicle_id` (`vehicle_id`),
  KEY `IX_VehMaint_Vehicle_ServiceDate_Deleted` (`vehicle_id`,`service_date`,`is_deleted`),
  CONSTRAINT `FK_transport_vehicle_maintenances_transport_vehicles_vehicle_id` FOREIGN KEY (`vehicle_id`) REFERENCES `transport_vehicles` (`VehicleId`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transport_vehicles`
--

DROP TABLE IF EXISTS `transport_vehicles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transport_vehicles` (
  `VehicleId` bigint NOT NULL AUTO_INCREMENT,
  `VehicleNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RegistrationNumber` varchar(50) DEFAULT NULL,
  `VehicleName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `VehicleType` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Manufacturer` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Model` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ChassisNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EngineNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `GpsDeviceId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `InsuranceNumber` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `InsuranceExpiry` datetime(6) DEFAULT NULL,
  `PollutionExpiry` datetime(6) DEFAULT NULL,
  `FitnessExpiry` datetime(6) DEFAULT NULL,
  `Capacity` int NOT NULL,
  `IsAC` tinyint(1) NOT NULL,
  `Status` tinyint(1) NOT NULL DEFAULT '1',
  `IsDeleted` tinyint(1) NOT NULL DEFAULT '0',
  `CreatedBy` bigint DEFAULT NULL,
  `UpdatedBy` bigint DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`VehicleId`),
  UNIQUE KEY `IX_transport_vehicles_VehicleNumber` (`VehicleNumber`),
  UNIQUE KEY `IX_transport_vehicles_RegistrationNumber` (`RegistrationNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `transportattendants`
--

DROP TABLE IF EXISTS `transportattendants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transportattendants` (
  `AttendantId` bigint NOT NULL AUTO_INCREMENT,
  `AttendantName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `MobileNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `EmployeeId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Gender` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BranchName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AlternateMobileNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BloodGroup` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EmergencyContactName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EmergencyContactNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AssignedVehicleId` bigint DEFAULT NULL,
  `Status` tinyint(1) NOT NULL,
  `IsDeleted` tinyint(1) NOT NULL,
  `CreatedBy` bigint DEFAULT NULL,
  `UpdatedBy` bigint DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`AttendantId`),
  KEY `IX_TransportAttendants_AssignedVehicleId` (`AssignedVehicleId`),
  CONSTRAINT `FK_TransportAttendants_transport_vehicles_AssignedVehicleId` FOREIGN KEY (`AssignedVehicleId`) REFERENCES `transport_vehicles` (`VehicleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniform_categories`
--

DROP TABLE IF EXISTS `uniform_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uniform_categories` (
  `CategoryId` int NOT NULL AUTO_INCREMENT,
  `CategoryName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`CategoryId`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniform_sizes`
--

DROP TABLE IF EXISTS `uniform_sizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uniform_sizes` (
  `SizeId` int NOT NULL AUTO_INCREMENT,
  `SizeName` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ChestSpec` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `WaistSpec` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `HeightTarget` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `AgeBracket` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Gender` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `ShoulderSpec` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`SizeId`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniform_suppliers`
--

DROP TABLE IF EXISTS `uniform_suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uniform_suppliers` (
  `SupplierId` int NOT NULL AUTO_INCREMENT,
  `SupplierName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ContactPerson` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Email` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `GstNumber` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Address` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`SupplierId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `uniform_types`
--

DROP TABLE IF EXISTS `uniform_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `uniform_types` (
  `UniformTypeId` int NOT NULL AUTO_INCREMENT,
  `ItemName` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Gender` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `SchoolWing` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Size` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CategoryName` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `Color` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `UnitPrice` decimal(18,2) NOT NULL,
  `OpeningStock` int NOT NULL,
  `AvailableStock` int NOT NULL,
  `MinThreshold` int NOT NULL,
  `ReorderPoint` int NOT NULL,
  `Status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `CreatedAt` datetime(6) DEFAULT NULL,
  `IncludedItemsJson` longtext,
  PRIMARY KEY (`UniformTypeId`)
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `RoleId` int NOT NULL,
  `UserId` int NOT NULL,
  PRIMARY KEY (`RoleId`,`UserId`),
  KEY `IX_user_roles_UserId` (`UserId`),
  CONSTRAINT `FK_user_roles_roles_RoleId` FOREIGN KEY (`RoleId`) REFERENCES `roles` (`RoleId`) ON DELETE CASCADE,
  CONSTRAINT `FK_user_roles_users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`UserId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `UserId` int NOT NULL AUTO_INCREMENT,
  `FullName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MobileNumber` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PasswordHash` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsEmailVerified` tinyint(1) NOT NULL,
  `IsMobileVerified` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `SchoolId` int DEFAULT NULL,
  `Avatar` text,
  PRIMARY KEY (`UserId`),
  UNIQUE KEY `IX_users_MobileNumber` (`MobileNumber`),
  KEY `IX_users_SchoolId` (`SchoolId`),
  CONSTRAINT `FK_users_schools_SchoolId` FOREIGN KEY (`SchoolId`) REFERENCES `schools` (`SchoolId`)
) ENGINE=InnoDB AUTO_INCREMENT=780 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping events for database 'sms_new_test'
--

--
-- Dumping routines for database 'sms_new_test'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-27  9:39:51
