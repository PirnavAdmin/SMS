namespace SMS.Api.Services.Implementations.StaffManagement;

using SMS.Api.Services.Interfaces.StaffManagement;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Exceptions;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

using SMS.Api.Services.Interfaces;

public class StaffService : IStaffService
{
    private readonly ISchoolRepository _schoolRepository;
    private readonly AppDbContext _context;
    private readonly IEmailNotificationService _emailNotificationService;

    public StaffService(
        ISchoolRepository schoolRepository,
        AppDbContext context,
        IEmailNotificationService emailNotificationService)
    {
        _schoolRepository = schoolRepository;
        _context = context;
        _emailNotificationService = emailNotificationService;
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
            Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email,
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
            IsActive = dto.IsActive ?? true
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
        await SyncTeacherAssignmentsAsync(staff.StaffId, dto.AssignedClasses, dto.AssignedSubjects);

        // Sync staff into users table for authentication
        try
        {
            var isTeaching = (staff.EmployeeCategory ?? "").ToLower().Contains("teach");
            var userRole = isTeaching ? "Teacher" : (!string.IsNullOrWhiteSpace(staff.Designation) ? staff.Designation : "Staff");
            var fullName = $"{staff.FirstName} {staff.LastName}".Trim();
            var mobileNo = !string.IsNullOrWhiteSpace(staff.Phone) ? staff.Phone.Trim() : (!string.IsNullOrWhiteSpace(staff.AlternateMobile) ? staff.AlternateMobile.Trim() : $"STF{staff.StaffId}");

            var existingUser = await _context.Users.FirstOrDefaultAsync(u => 
                (!string.IsNullOrWhiteSpace(staff.Email) && u.Email != null && u.Email.ToLower() == staff.Email.ToLower()) ||
                (!string.IsNullOrWhiteSpace(mobileNo) && u.MobileNumber == mobileNo));

            if (existingUser == null)
            {
                var newUser = new User
                {
                    FullName = fullName,
                    Email = staff.Email,
                    MobileNumber = mobileNo,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1234"),
                    Role = userRole,
                    IsEmailVerified = true,
                    IsMobileVerified = true,
                    CreatedAt = DateTime.UtcNow,
                    SchoolId = null
                };
                await _context.Users.AddAsync(newUser);
                await _context.SaveChangesAsync();
            }
            else
            {
                existingUser.FullName = fullName;
                existingUser.Role = userRole;
                if (!string.IsNullOrWhiteSpace(staff.Email)) existingUser.Email = staff.Email;
                await _context.SaveChangesAsync();
            }

            // Dispatch welcome credentials email asynchronously
            if (!string.IsNullOrWhiteSpace(staff.Email) && staff.Email.Contains('@'))
            {
                var loginId = staff.Email;
                _ = Task.Run(async () =>
                {
                    try
                    {
                        await _emailNotificationService.SendWelcomeCredentialsAsync(
                            recipientEmail: staff.Email!,
                            recipientName: fullName,
                            loginIdentifier: loginId,
                            defaultPassword: "admin1234",
                            roleName: userRole);
                    }
                    catch { /* Ignored */ }
                });
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[StaffService] Failed to auto-create user or send welcome email: {ex.Message}");
        }

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
        staff.Email = string.IsNullOrWhiteSpace(dto.Email) ? null : dto.Email;
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
        if (dto.IsActive.HasValue) staff.IsActive = dto.IsActive.Value;
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
        await SyncTeacherAssignmentsAsync(staff.StaffId, dto.AssignedClasses, dto.AssignedSubjects);
        return MapToStaffResponseDto(staff);
    }

    public async Task<bool> DeleteStaffAsync(int id)
    {
        var staff = await _schoolRepository.GetStaffByIdAsync(id)
            ?? throw new NotFoundException($"Staff member with ID '{id}' not found.");

        // Clean up workload assignments first to prevent foreign key errors
        var existingTa = await _context.TeacherAssignments.Where(a => a.TeacherId == id).ToListAsync();
        if (existingTa.Any())
        {
            _context.TeacherAssignments.RemoveRange(existingTa);
        }

        var existingTsa = await _context.TeacherSubjectAssignments.Where(a => a.StaffId == id).ToListAsync();
        if (existingTsa.Any())
        {
            _context.TeacherSubjectAssignments.RemoveRange(existingTsa);
        }

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

    private StaffResponseDto MapToStaffResponseDto(Staff s)
    {
        var assignments = _context.TeacherAssignments
            .Where(a => a.TeacherId == s.StaffId && a.Role == "Subject Teacher")
            .Include(a => a.ClassGrade)
            .Include(a => a.Subject)
            .ToList();

        var assignedClasses = assignments
            .Where(a => a.ClassGrade != null)
            .Select(a => $"{a.ClassGrade.ClassName}-{a.SectionLetter}")
            .Distinct()
            .ToList();

        var assignedSubjects = assignments
            .Where(a => a.Subject != null && !string.IsNullOrEmpty(a.Subject.SubjectName))
            .Select(a => a.Subject!.SubjectName!)
            .Distinct()
            .ToList();

        return new StaffResponseDto
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
            }).ToList(),
            AssignedClasses = assignedClasses,
            AssignedSubjects = assignedSubjects
        };
    }

    private async Task SyncTeacherAssignmentsAsync(int staffId, List<string> classes, List<string> subjects)
    {
        // 1. Delete existing assignments for this staff member
        var existingTa = await _context.TeacherAssignments.Where(a => a.TeacherId == staffId).ToListAsync();
        if (existingTa.Any())
        {
            _context.TeacherAssignments.RemoveRange(existingTa);
        }

        var existingTsa = await _context.TeacherSubjectAssignments.Where(a => a.StaffId == staffId).ToListAsync();
        if (existingTsa.Any())
        {
            _context.TeacherSubjectAssignments.RemoveRange(existingTsa);
        }

        await _context.SaveChangesAsync();

        if (classes == null || !classes.Any() || subjects == null || !subjects.Any())
        {
            return;
        }

        // 2. Parse and map each class and subject combination
        foreach (var classStr in classes)
        {
            if (string.IsNullOrWhiteSpace(classStr)) continue;

            string className = classStr.Trim();
            string sectionLetter = "A"; // default fallback

            if (classStr.Contains("-"))
            {
                var parts = classStr.Split('-');
                className = parts[0].Trim();
                sectionLetter = parts[1].Trim();
            }

            var classGrade = await _context.Classes
                .FirstOrDefaultAsync(cg => cg.ClassName != null && cg.ClassName.ToLower() == className.ToLower());

            if (classGrade == null) continue;

            var classSection = await _context.ClassSections
                .FirstOrDefaultAsync(cs => cs.ClassId == classGrade.ClassId && cs.SectionName.ToLower() == sectionLetter.ToLower());

            int sectionId = classSection?.SectionId ?? 0;

            foreach (var subjectStr in subjects)
            {
                if (string.IsNullOrWhiteSpace(subjectStr)) continue;

                var subject = await _context.Subjects
                    .FirstOrDefaultAsync(s => (s.SubjectName != null && s.SubjectName.ToLower() == subjectStr.ToLower()) || (s.SubjectCode != null && s.SubjectCode.ToLower() == subjectStr.ToLower()));

                if (subject == null) continue;

                // Create general assignment
                var ta = new TeacherAssignment
                {
                    ClassId = classGrade.ClassId,
                    SectionLetter = sectionLetter,
                    SubjectId = subject.SubjectId,
                    TeacherId = staffId,
                    Role = "Subject Teacher",
                    Status = "Active"
                };
                await _context.TeacherAssignments.AddAsync(ta);

                // Create schedule subject assignment (if section exists)
                if (sectionId > 0)
                {
                    var tsa = new TeacherSubjectAssignment
                    {
                        ClassId = classGrade.ClassId,
                        SectionId = sectionId,
                        SubjectId = subject.SubjectId,
                        StaffId = staffId
                    };
                    await _context.TeacherSubjectAssignments.AddAsync(tsa);
                }
            }
        }

        await _context.SaveChangesAsync();
    }
}
