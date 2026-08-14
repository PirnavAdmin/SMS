namespace SMS.Api.Dtos;

using System;

public class LeaveTypeConfigDto
{
    public int LeaveTypeId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public int AnnualAllowance { get; set; }
    public bool CarryForward { get; set; }
    public int MaxConsecutiveDays { get; set; }
    public bool RequiresAttachment { get; set; }
    public bool IsPaid { get; set; }
    public string Status { get; set; } = "Active";
}

public class LeaveApplicationCreateDto
{
    public int StaffId { get; set; }
    public int LeaveTypeId { get; set; }
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public bool IsHalfDay { get; set; }
    public string Reason { get; set; } = string.Empty;
}

public class LeaveApplicationResponseDto
{
    public int LeaveApplicationId { get; set; }
    public int StaffId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string EmployeeCategory { get; set; } = string.Empty;
    public string LeaveTypeName { get; set; } = string.Empty;
    public string LeaveTypeCode { get; set; } = string.Empty;
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public bool IsHalfDay { get; set; }
    public int RequestedDays { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string AppliedDate { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending";
}

public class LeaveBalanceDto
{
    public int StaffId { get; set; }
    public string EmployeeId { get; set; } = string.Empty;
    public string StaffName { get; set; } = string.Empty;
    public string Designation { get; set; } = string.Empty;
    public int CasualLeaveBalance { get; set; }
    public int SickLeaveBalance { get; set; }
    public int EarnedLeaveBalance { get; set; }
    public int TotalRemainingBalance { get; set; }
}

public class HolidayCalendarDto
{
    public int HolidayId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "State";
    public string FromDate { get; set; } = string.Empty;
    public string ToDate { get; set; } = string.Empty;
    public string ApplicableBranch { get; set; } = "Main Campus";
    public string? Description { get; set; }
}

public class UpdateLeaveStatusRequest
{
    public string Status { get; set; } = string.Empty;
}
