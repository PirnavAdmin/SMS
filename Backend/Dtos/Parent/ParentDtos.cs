using System;
using System.Collections.Generic;

namespace SMS.Api.Dtos.Parent
{
    public class ParentChildDto
    {
        public int StudentId { get; set; }
        public string AdmissionNumber { get; set; } = string.Empty;
        public string RollNumber { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public int ClassId { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public int SectionId { get; set; }
        public string SectionName { get; set; } = string.Empty;
        public string? Gender { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? ProfilePhoto { get; set; }
    }

    public class ParentStudentDetailsDto
    {
        public int StudentId { get; set; }
        public string AdmissionNumber { get; set; } = string.Empty;
        public string RollNumber { get; set; } = string.Empty;
        public string StudentName { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        public string? BloodGroup { get; set; } = "O+";
        public string? BoardType { get; set; } = "CBSE";
        public string? StudentType { get; set; } = "Day Scholar";
        public DateTime? JoiningDate { get; set; }
        public string? CasteCategory { get; set; } = "General";
        public string? FatherName { get; set; }
        public string? FatherMobile { get; set; }
        public string? MotherName { get; set; }
        public string? MotherMobile { get; set; }
        public string? Email { get; set; }
        public string? MobileNumber { get; set; }
        public string? Address { get; set; }
        public string ClassName { get; set; } = string.Empty;
        public string SectionName { get; set; } = string.Empty;
        public string BranchName { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
    }

    public class ParentDashboardSummaryDto
    {
        public int StudentId { get; set; }
        public string StudentName { get; set; } = string.Empty;
        public string ClassName { get; set; } = string.Empty;
        public string SectionName { get; set; } = string.Empty;
        public int AttendancePercentage { get; set; }
        public decimal FeeDueAmount { get; set; }
        public int PendingHomeworkCount { get; set; }
        public ParentStudentDetailsDto StudentInfo { get; set; } = new ParentStudentDetailsDto();
        public List<ParentEventItemDto> UpcomingEvents { get; set; } = new List<ParentEventItemDto>();
        public List<ParentNoticeDto> Notices { get; set; } = new List<ParentNoticeDto>();
    }

    public class ParentEventItemDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Event, Holiday, Exam
    }

    public class ParentCommunicationDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string TargetAudience { get; set; } = "ALL";
        public string Category { get; set; } = "URGENT";
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = "09:30 AM";
        public string Author { get; set; } = "Principal Office";
        public bool IsPinned { get; set; } = true;
        public int RecipientsCount { get; set; } = 1420;
        public string DeliveryChannels { get; set; } = "SMS & Email";
    }

    public class ParentNoticeDto
    {
        public string Date { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = "notice";
    }

    public class ParentAttendanceLogDto
    {
        public int AttendanceId { get; set; }
        public string Date { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty; // Present, Absent, Late, HalfDay
        public string? Remarks { get; set; }
        public string? CheckInTime { get; set; }
        public string? CheckOutTime { get; set; }
    }

    public class ParentAttendanceSummaryDto
    {
        public int TotalDays { get; set; }
        public int PresentDays { get; set; }
        public int AbsentDays { get; set; }
        public int LateDays { get; set; }
        public int HalfDays { get; set; }
        public int Percentage { get; set; }
        public List<ParentAttendanceLogDto> Logs { get; set; } = new List<ParentAttendanceLogDto>();
    }

    public class ParentTimetableSlotDto
    {
        public string PeriodName { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string SubjectName { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public string DayOfWeek { get; set; } = string.Empty;
        public string RoomNo { get; set; } = string.Empty;
    }

    public class ParentTimetableDayDto
    {
        public string DayOfWeek { get; set; } = string.Empty;
        public List<ParentTimetableSlotDto> Slots { get; set; } = new List<ParentTimetableSlotDto>();
    }

    public class ParentHomeworkItemDto
    {
        public int HomeworkId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string AssignedDate { get; set; } = string.Empty;
        public string DueDate { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending"; // Pending, Submitted, Evaluated
    }

    public class ParentExamSubjectResultDto
    {
        public string SubjectName { get; set; } = string.Empty;
        public decimal MaxMarks { get; set; }
        public decimal PassMarks { get; set; }
        public decimal MarksObtained { get; set; }
        public string Grade { get; set; } = string.Empty;
        public string Remarks { get; set; } = string.Empty;
    }

    public class ParentExamResultReportDto
    {
        public int ExamId { get; set; }
        public string ExamName { get; set; } = string.Empty;
        public string AcademicYear { get; set; } = string.Empty;
        public decimal TotalMaxMarks { get; set; }
        public decimal TotalObtainedMarks { get; set; }
        public decimal Percentage { get; set; }
        public string OverallGrade { get; set; } = string.Empty;
        public string ResultStatus { get; set; } = "Pass";
        public List<ParentExamSubjectResultDto> SubjectResults { get; set; } = new List<ParentExamSubjectResultDto>();
    }

    public class ParentFeeItemDto
    {
        public int FeeId { get; set; }
        public string FeeHeadName { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public decimal PaidAmount { get; set; }
        public decimal BalanceDue { get; set; }
        public string DueDate { get; set; } = string.Empty;
        public string Status { get; set; } = "Paid"; // Paid, Partial, Overdue, Pending
    }

    public class ParentFeeSummaryDto
    {
        public decimal TotalFee { get; set; }
        public decimal TotalPaid { get; set; }
        public decimal TotalDue { get; set; }
        public List<ParentFeeItemDto> FeeItems { get; set; } = new List<ParentFeeItemDto>();
    }

    public class ParentFeePaymentRequestDto
    {
        public int StudentId { get; set; }
        public List<string> FeeItemIds { get; set; } = new List<string>();
        public decimal AmountPaid { get; set; }
        public string PaymentMode { get; set; } = "Online (Credit Card)";
        public string PaymentType { get; set; } = "Selected"; // "Due", "All", "Selected"
    }

    public class ParentFeePaymentResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public string ReceiptNo { get; set; } = string.Empty;
        public string Date { get; set; } = string.Empty;
        public decimal AmountPaid { get; set; }
        public string PaymentMode { get; set; } = string.Empty;
        public string Term { get; set; } = string.Empty;
    }

    public class ParentTeacherInfoDto
    {
        public int TeacherId { get; set; }
        public string TeacherName { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Designation { get; set; } = string.Empty;
        public string SubjectTaught { get; set; } = string.Empty;
        public string SubjectCode { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string ProfilePhoto { get; set; } = string.Empty;
        public bool IsClassTeacher { get; set; }
    }

    public class ParentTransportInfoDto
    {
        public bool IsAssigned { get; set; }
        public string RouteName { get; set; } = string.Empty;
        public string VehicleNumber { get; set; } = string.Empty;
        public string PickupPoint { get; set; } = string.Empty;
        public string PickupTime { get; set; } = string.Empty;
        public string DropTime { get; set; } = string.Empty;
        public string DriverName { get; set; } = string.Empty;
        public string DriverPhone { get; set; } = string.Empty;
    }

    public class ParentHostelInfoDto
    {
        public bool IsAllocated { get; set; }
        public string HostelName { get; set; } = string.Empty;
        public string BlockName { get; set; } = string.Empty;
        public string RoomNumber { get; set; } = string.Empty;
        public string BedNumber { get; set; } = string.Empty;
        public string RoomType { get; set; } = string.Empty;
        public string WardenName { get; set; } = string.Empty;
        public string WardenPhone { get; set; } = string.Empty;
    }
}
