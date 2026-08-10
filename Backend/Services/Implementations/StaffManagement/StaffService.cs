namespace SMS.Api.Services.Implementations.StaffManagement;

using SMS.Api.Services.Interfaces.StaffManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Exceptions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class StaffService : IStaffService
{
    private readonly ISchoolRepository _schoolRepository;
    private readonly AppDbContext _context;

    public StaffService(ISchoolRepository schoolRepository, AppDbContext context)
    {
        _schoolRepository = schoolRepository;
        _context = context;
    }

    public async Task<string> GetNextEmployeeIdAsync()
    {
        var existingIds = await _schoolRepository.GetAllEmployeeIdsAsync();
        int maxNumber = 0;

        foreach (var id in existingIds)
        {
            if (string.IsNullOrWhiteSpace(id)) continue;
            var match = System.Text.RegularExpressions.Regex.Match(id, @"\d+");
            if (match.Success && int.TryParse(match.Value, out int num))
            {
                if (num > maxNumber) maxNumber = num;
            }
        }

        int nextNumber = maxNumber + 1;
        return $"EMP{nextNumber:D3}";
    }

    public async Task<List<StaffResponseDto>> GetAllStaffAsync(string? search, string? department)
    {
        var list = await _schoolRepository.GetAllStaffAsync(search, department);
        return list.Select(s => MapToStaffResponseDto(s)).ToList();
    }

    public async Task<StaffResponseDto> GetStaffByIdAsync(int id)
    {
        var staff = await _schoolRepository.GetStaffByIdAsync(id)
            ?? throw new NotFoundException($"Staff member with ID '{id}' not found.");
        return MapToStaffResponseDto(staff);
    }

    public async Task<List<StaffDropdownDto>> GetTeachersForDropdownAsync(string? search)
    {
        var list = await _schoolRepository.GetTeachersForDropdownAsync(search);
        return list.Select(t => new StaffDropdownDto
        {
            StaffId = t.StaffId,
            EmployeeId = t.EmployeeId ?? "",
            FullName = $"{t.FirstName} {t.LastName}".Trim(),
            Designation = t.Designation ?? "",
            Department = t.Department ?? ""
        }).ToList();
    }

    public async Task<List<TeacherDto>> GetAllTeachersAsync(string? search, string? subject)
    {
        var list = await _schoolRepository.GetAllTeachersAsync(search, subject);
        return list.Select(s => MapToTeacherDto(s)).ToList();
    }

    public async Task<TeacherDto?> GetTeacherByIdAsync(int id)
    {
        var staff = await _schoolRepository.GetStaffByIdAsync(id);
        if (staff != null) return MapToTeacherDto(staff);
        return null;
    }

    private static TeacherDto MapToTeacherDto(Staff s)
    {
        string subjectName = !string.IsNullOrWhiteSpace(s.PrimarySubject) ? s.PrimarySubject : (!string.IsNullOrWhiteSpace(s.Department) ? s.Department : "General");
        string subjectCode = ExtractSubjectCode(subjectName, s.Specialization);
        // BUG-016 FIX: use the dedicated IsClassTeacherEligible flag, not a Designation string guess
        bool isClassTeacher = s.IsClassTeacherEligible == true;

        return new TeacherDto
        {
            Id = s.StaffId,
            EmployeeId = s.EmployeeId ?? "",
            FirstName = s.FirstName ?? "",
            LastName = s.LastName ?? "",
            Subject = subjectName,
            SubjectCode = subjectCode,
            Phone = s.Phone ?? "",
            Email = s.Email ?? "",
            Designation = s.Designation ?? "Teacher",
            Department = s.Department ?? "",
            Qualification = s.Qualification ?? "",
            IsClassTeacher = isClassTeacher,
            IsActive = s.IsActive ?? true
        };
    }

    private static string ExtractSubjectCode(string subject, string? specialization)
    {
        // BUG-015 FIX: derive a reasonable code from the actual subject name rather than
        // only handling a hard-coded list that gives every non-listed subject "SUB-100".
        var subLower = subject.ToLower();
        if (subLower.Contains("math")) return "MAT-101";
        if (subLower.Contains("physic")) return "PHY-102";
        if (subLower.Contains("english")) return "ENG-103";
        if (subLower.Contains("chem")) return "CHE-104";
        if (subLower.Contains("computer") || subLower.Contains(" cs")) return "CS-105";
        if (subLower.Contains("physical ed") || subLower.Contains("sports") || subLower == "pe") return "PE-106";
        if (subLower.Contains("bio")) return "BIO-107";
        if (subLower.Contains("history")) return "HIS-108";
        if (subLower.Contains("geograph")) return "GEO-109";
        if (subLower.Contains("econom")) return "ECO-110";
        if (subLower.Contains("hindi")) return "HIN-111";
        if (subLower.Contains("social")) return "SST-112";

        // Generic fallback: first 3 uppercase letters of subject name + sequential code
        var prefix = new string(subject.Where(char.IsLetter).Take(3).ToArray()).ToUpper();
        return string.IsNullOrEmpty(prefix) ? "GEN-100" : $"{prefix}-100";
    }

    public async Task<StaffResponseDto> CreateStaffAsync(StaffCreateDto dto)
    {
        var empId = !string.IsNullOrWhiteSpace(dto.EmployeeId) 
            ? dto.EmployeeId 
            : await GetNextEmployeeIdAsync();

        var staff = new Staff
        {
            EmployeeId = empId,
            EmployeeCategory = string.IsNullOrWhiteSpace(dto.EmployeeCategory) ? "Teaching Staff" : dto.EmployeeCategory,
            FirstName = dto.FirstName,
            MiddleName = dto.MiddleName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            AlternateMobile = dto.AlternateMobile,
            Gender = dto.Gender,
            ResidentialAddress = dto.ResidentialAddress,
            BloodGroup = dto.BloodGroup,
            AadhaarNumber = dto.AadhaarNumber,
            PanNumber = dto.PanNumber,
            PresentAddress = dto.PresentAddress,
            PermanentAddress = dto.PermanentAddress,
            City = dto.City,
            State = dto.State,
            PinCode = dto.PinCode,
            Designation = dto.Designation,
            Department = dto.Department,
            SystemRole = dto.SystemRole,
            Qualification = dto.Qualification,
            EmploymentType = dto.EmploymentType,
            ReportingManager = dto.ReportingManager,
            AcademicYear = dto.AcademicYear,
            IsClassTeacherEligible = dto.IsClassTeacherEligible,
            PrimarySubject = dto.PrimarySubject,
            Specialization = dto.Specialization,
            MonthlySalary = dto.MonthlySalary,
            AccountHolderName = dto.AccountHolderName,
            AccountNumber = dto.AccountNumber,
            BankName = dto.BankName,
            BranchName = dto.BranchName,
            IfscCode = dto.IfscCode,
            UpiId = dto.UpiId,
            IsActive = true
        };

        if (DateTime.TryParse(dto.DateOfBirth, out var parsedDob)) staff.DateOfBirth = parsedDob;
        if (DateTime.TryParse(dto.JoiningDate, out var parsedJoining)) staff.JoiningDate = parsedJoining;

        if (dto.Qualifications != null)
        {
            foreach (var q in dto.Qualifications)
            {
                staff.Qualifications.Add(new StaffQualification
                {
                    QualificationDegree = q.QualificationDegree,
                    SpecializationSubject = q.SpecializationSubject,
                    InstitutionCollege = q.InstitutionCollege,
                    BoardUniversity = q.BoardUniversity,
                    PassingYear = q.PassingYear,
                    PercentageCgpa = q.PercentageCgpa
                });
            }
        }

        if (dto.ExperienceRecords != null)
        {
            foreach (var e in dto.ExperienceRecords)
            {
                DateTime? fromDate = DateTime.TryParse(e.FromDate, out var fd) ? fd : null;
                DateTime? toDate = DateTime.TryParse(e.ToDate, out var td) ? td : null;
                staff.ExperienceRecords.Add(new StaffExperience
                {
                    PreviousOrganization = e.PreviousOrganization,
                    DesignationHeld = e.DesignationHeld,
                    FromDate = fromDate,
                    ToDate = toDate,
                    TotalExperience = e.TotalExperience,
                    ReasonForLeaving = e.ReasonForLeaving
                });
            }
        }

        if (dto.Documents != null)
        {
            foreach (var d in dto.Documents)
            {
                staff.Documents.Add(new StaffDocument
                {
                    DocumentType = d.DocumentType,
                    FileUrl = d.FileUrl,
                    IsRequired = d.IsRequired,
                    Status = d.Status,
                    UploadedAt = DateTime.TryParse(d.UploadedAt, out var ua) ? ua : DateTime.UtcNow
                });
            }
        }

        await _schoolRepository.AddStaffAsync(staff);
        await _schoolRepository.SaveChangesAsync();
        return MapToStaffResponseDto(staff);
    }

    public async Task<StaffResponseDto> UpdateStaffAsync(int id, StaffCreateDto dto)
    {
        var staff = await _schoolRepository.GetStaffByIdAsync(id)
            ?? throw new NotFoundException($"Staff member with ID '{id}' not found.");

        if (!string.IsNullOrWhiteSpace(dto.EmployeeCategory)) staff.EmployeeCategory = dto.EmployeeCategory;
        staff.FirstName = dto.FirstName;
        staff.MiddleName = dto.MiddleName;
        staff.LastName = dto.LastName;
        staff.Email = dto.Email;
        staff.Phone = dto.Phone;
        staff.AlternateMobile = dto.AlternateMobile;
        if (dto.Gender != null) staff.Gender = dto.Gender;
        if (dto.ResidentialAddress != null) staff.ResidentialAddress = dto.ResidentialAddress;
        staff.BloodGroup = dto.BloodGroup;
        staff.AadhaarNumber = dto.AadhaarNumber;
        staff.PanNumber = dto.PanNumber;
        staff.PresentAddress = dto.PresentAddress;
        staff.PermanentAddress = dto.PermanentAddress;
        staff.City = dto.City;
        staff.State = dto.State;
        staff.PinCode = dto.PinCode;
        staff.Designation = dto.Designation;
        staff.Department = dto.Department;
        if (dto.SystemRole != null) staff.SystemRole = dto.SystemRole;
        if (dto.Qualification != null) staff.Qualification = dto.Qualification;
        staff.EmploymentType = dto.EmploymentType;
        staff.ReportingManager = dto.ReportingManager;
        staff.AcademicYear = dto.AcademicYear;
        staff.IsClassTeacherEligible = dto.IsClassTeacherEligible;
        if (dto.PrimarySubject != null) staff.PrimarySubject = dto.PrimarySubject;
        if (dto.Specialization != null) staff.Specialization = dto.Specialization;
        staff.MonthlySalary = dto.MonthlySalary;

        if (dto.AccountHolderName != null) staff.AccountHolderName = dto.AccountHolderName;
        if (dto.AccountNumber != null) staff.AccountNumber = dto.AccountNumber;
        if (dto.BankName != null) staff.BankName = dto.BankName;
        if (dto.BranchName != null) staff.BranchName = dto.BranchName;
        if (dto.IfscCode != null) staff.IfscCode = dto.IfscCode;
        if (dto.UpiId != null) staff.UpiId = dto.UpiId;

        if (DateTime.TryParse(dto.DateOfBirth, out var parsedDob)) staff.DateOfBirth = parsedDob;
        if (DateTime.TryParse(dto.JoiningDate, out var parsedJoining)) staff.JoiningDate = parsedJoining;

        // Sync Qualifications
        staff.Qualifications.Clear();
        if (dto.Qualifications != null)
        {
            foreach (var q in dto.Qualifications)
            {
                staff.Qualifications.Add(new StaffQualification
                {
                    QualificationDegree = q.QualificationDegree,
                    SpecializationSubject = q.SpecializationSubject,
                    InstitutionCollege = q.InstitutionCollege,
                    BoardUniversity = q.BoardUniversity,
                    PassingYear = q.PassingYear,
                    PercentageCgpa = q.PercentageCgpa
                });
            }
        }

        // Sync Experience Records
        staff.ExperienceRecords.Clear();
        if (dto.ExperienceRecords != null)
        {
            foreach (var e in dto.ExperienceRecords)
            {
                DateTime? fromDate = DateTime.TryParse(e.FromDate, out var fd) ? fd : null;
                DateTime? toDate = DateTime.TryParse(e.ToDate, out var td) ? td : null;
                staff.ExperienceRecords.Add(new StaffExperience
                {
                    PreviousOrganization = e.PreviousOrganization,
                    DesignationHeld = e.DesignationHeld,
                    FromDate = fromDate,
                    ToDate = toDate,
                    TotalExperience = e.TotalExperience,
                    ReasonForLeaving = e.ReasonForLeaving
                });
            }
        }

        // Sync Documents
        staff.Documents.Clear();
        if (dto.Documents != null)
        {
            foreach (var d in dto.Documents)
            {
                staff.Documents.Add(new StaffDocument
                {
                    DocumentType = d.DocumentType,
                    FileUrl = d.FileUrl,
                    IsRequired = d.IsRequired,
                    Status = d.Status,
                    UploadedAt = DateTime.TryParse(d.UploadedAt, out var ua) ? ua : DateTime.UtcNow
                });
            }
        }

        await _schoolRepository.SaveChangesAsync();
        return MapToStaffResponseDto(staff);
    }

    public async Task<bool> DeleteStaffAsync(int id)
    {
        var staff = await _schoolRepository.GetStaffByIdAsync(id)
            ?? throw new NotFoundException($"Staff member with ID '{id}' not found.");
        _schoolRepository.RemoveStaff(staff);
        await _schoolRepository.SaveChangesAsync();
        return true;
    }

    public async Task<DailyAttendanceSummaryDto> GetDailyAttendanceSummaryAsync(string date, string? department)
    {
        DateTime parsedDate = DateTime.TryParse(date, out var d) ? d : DateTime.UtcNow.Date;
        var attendances = await _schoolRepository.GetStaffAttendanceAsync(parsedDate, department);
        var allStaff = await _schoolRepository.GetAllStaffAsync(null, department);

        int total = allStaff.Count;
        int present = attendances.Count(a => a.Status.Equals("Present", StringComparison.OrdinalIgnoreCase));
        int absent = attendances.Count(a => a.Status.Equals("Absent", StringComparison.OrdinalIgnoreCase));
        int onLeave = attendances.Count(a => a.Status.Equals("On Leave", StringComparison.OrdinalIgnoreCase));
        int halfDay = attendances.Count(a => a.Status.Equals("Half Day", StringComparison.OrdinalIgnoreCase));

        double rate = total > 0 ? Math.Round(((double)present / total) * 100, 1) : 0;

        var holidays = await _schoolRepository.GetAllHolidaysAsync();
        var matchedHoliday = holidays.FirstOrDefault(h => parsedDate.Date >= h.FromDate.Date && parsedDate.Date <= h.ToDate.Date);

        return new DailyAttendanceSummaryDto
        {
            TotalStaff = total,
            PresentCount = present,
            AbsentCount = absent,
            OnLeaveCount = onLeave,
            HalfDayCount = halfDay,
            PresenceRatePercentage = rate,
            HolidayAlert = matchedHoliday != null ? $"Selected date is configured as a school holiday: {matchedHoliday.Name} ({matchedHoliday.Type} Holiday). Attendance is read-only unless overridden." : null
        };
    }

    public async Task<List<StaffAttendanceResponseDto>> GetDailyAttendanceAsync(string date, string? department)
    {
        DateTime parsedDate = DateTime.TryParse(date, out var d) ? d : DateTime.UtcNow.Date;
        var attendances = await _schoolRepository.GetStaffAttendanceAsync(parsedDate, department);

        return attendances.Select(a => new StaffAttendanceResponseDto
        {
            StaffAttendanceId = a.StaffAttendanceId,
            StaffId = a.StaffId,
            EmployeeId = a.Staff?.EmployeeId ?? string.Empty,
            FullName = a.Staff != null ? $"{a.Staff.FirstName} {a.Staff.LastName}".Trim() : string.Empty,
            Date = a.Date.ToString("yyyy-MM-dd"),
            Status = a.Status,
            Department = a.Department,
            Designation = a.Designation,
            Remarks = a.Remarks,
            InTime = a.InTime,
            OutTime = a.OutTime
        }).ToList();
    }

    public async Task<List<StaffAttendanceResponseDto>> GetMonthlyAttendanceAsync(int month, int year, string? department)
    {
        var attendances = await _schoolRepository.GetStaffAttendanceMonthlyAsync(month, year, department);

        return attendances.Select(a => new StaffAttendanceResponseDto
        {
            StaffAttendanceId = a.StaffAttendanceId,
            StaffId = a.StaffId,
            EmployeeId = a.Staff?.EmployeeId ?? string.Empty,
            FullName = a.Staff != null ? $"{a.Staff.FirstName} {a.Staff.LastName}".Trim() : string.Empty,
            Date = a.Date.ToString("yyyy-MM-dd"),
            Status = a.Status,
            Department = a.Department,
            Designation = a.Designation,
            Remarks = a.Remarks,
            InTime = a.InTime,
            OutTime = a.OutTime
        }).ToList();
    }

    public async Task<bool> SaveBulkAttendanceAsync(BulkAttendanceDto dto)
    {
        DateTime parsedDate = DateTime.TryParse(dto.Date, out var d) ? d : DateTime.UtcNow.Date;

        var existingAttendances = await _context.StaffAttendances
            .Where(sa => sa.Date.Date == parsedDate.Date)
            .ToListAsync();

        var existingMap = existingAttendances
            .GroupBy(a => a.StaffId)
            .ToDictionary(g => g.Key, g => g.First());

        foreach (var rec in dto.Records)
        {
            var staff = await _schoolRepository.GetStaffByIdAsync(rec.StaffId);
            if (staff == null) continue;

            if (existingMap.TryGetValue(rec.StaffId, out var existing))
            {
                existing.Status = rec.Status;
                existing.Remarks = rec.Remarks;
                existing.InTime = rec.InTime;
                existing.OutTime = rec.OutTime;
                existing.Department = staff.Department;
                existing.Designation = staff.Designation;
                if (dto.AcademicYear != null) existing.AcademicYear = dto.AcademicYear;
                if (dto.Branch != null) existing.Branch = dto.Branch;
            }
            else
            {
                var newRec = new StaffAttendance
                {
                    StaffId = staff.StaffId,
                    Date = parsedDate,
                    Status = rec.Status,
                    AcademicYear = dto.AcademicYear ?? "2026-2027",
                    Branch = dto.Branch ?? "Main Campus",
                    Department = staff.Department,
                    Designation = staff.Designation,
                    Remarks = rec.Remarks,
                    InTime = rec.InTime,
                    OutTime = rec.OutTime
                };
                await _context.StaffAttendances.AddAsync(newRec);
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    private static StaffResponseDto MapToStaffResponseDto(Staff s) => new()
    {
        StaffId = s.StaffId,
        EmployeeId = s.EmployeeId ?? "",
        EmployeeCategory = s.EmployeeCategory ?? "",
        FirstName = s.FirstName ?? "",
        MiddleName = s.MiddleName,
        LastName = s.LastName ?? "",
        Email = s.Email ?? "",
        Phone = s.Phone,
        AlternateMobile = s.AlternateMobile,
        Gender = s.Gender,
        DateOfBirth = s.DateOfBirth?.ToString("yyyy-MM-dd"),
        BloodGroup = s.BloodGroup,
        ResidentialAddress = s.ResidentialAddress,
        AadhaarNumber = s.AadhaarNumber,
        PanNumber = s.PanNumber,
        PresentAddress = s.PresentAddress,
        PermanentAddress = s.PermanentAddress,
        City = s.City,
        State = s.State,
        PinCode = s.PinCode,
        Designation = s.Designation ?? "",
        Department = s.Department ?? "",
        SystemRole = s.SystemRole,
        JoiningDate = s.JoiningDate?.ToString("yyyy-MM-dd"),
        Qualification = s.Qualification,
        EmploymentType = s.EmploymentType,
        ReportingManager = s.ReportingManager,
        AcademicYear = s.AcademicYear,
        IsClassTeacherEligible = s.IsClassTeacherEligible,
        PrimarySubject = s.PrimarySubject,
        Specialization = s.Specialization,
        MonthlySalary = s.MonthlySalary ?? 0m,
        AccountHolderName = s.AccountHolderName,
        AccountNumber = s.AccountNumber,
        BankName = s.BankName,
        BranchName = s.BranchName,
        IfscCode = s.IfscCode,
        UpiId = s.UpiId,
        IsActive = s.IsActive ?? true,
        Qualifications = s.Qualifications.Select(q => new StaffQualificationDto
        {
            Id = q.Id,
            QualificationDegree = q.QualificationDegree,
            SpecializationSubject = q.SpecializationSubject,
            InstitutionCollege = q.InstitutionCollege,
            BoardUniversity = q.BoardUniversity,
            PassingYear = q.PassingYear,
            PercentageCgpa = q.PercentageCgpa
        }).ToList(),
        ExperienceRecords = s.ExperienceRecords.Select(e => new StaffExperienceDto
        {
            Id = e.Id,
            PreviousOrganization = e.PreviousOrganization,
            DesignationHeld = e.DesignationHeld,
            FromDate = e.FromDate?.ToString("yyyy-MM-dd"),
            ToDate = e.ToDate?.ToString("yyyy-MM-dd"),
            TotalExperience = e.TotalExperience,
            ReasonForLeaving = e.ReasonForLeaving
        }).ToList(),
        Documents = s.Documents.Select(d => new StaffDocumentDto
        {
            StaffDocumentId = d.StaffDocumentId,
            StaffId = d.StaffId,
            DocumentType = d.DocumentType,
            FileUrl = d.FileUrl,
            IsRequired = d.IsRequired,
            Status = d.Status,
            UploadedAt = d.UploadedAt?.ToString("yyyy-MM-dd HH:mm:ss")
        }).ToList()
    };
}
