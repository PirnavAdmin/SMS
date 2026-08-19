using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.Teacher;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations;

public class TeacherProfileRepository : ITeacherProfileRepository
{
    private readonly AppDbContext _context;

    public TeacherProfileRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int?> GetStaffIdByUserIdOrEmailAsync(int? userId, string? email)
    {
        if (string.IsNullOrWhiteSpace(email) && (!userId.HasValue || userId.Value <= 0))
            return null;

        // 1. Check by User record Email matching Staff Email
        if (!string.IsNullOrWhiteSpace(email))
        {
            var cleanEmail = email.Trim().ToLower();
            var staffByEmail = await _context.Staff
                .AsNoTracking()
                .Where(s => s.IsActive == true && s.Email != null && s.Email.ToLower() == cleanEmail)
                .Select(s => (int?)s.StaffId)
                .FirstOrDefaultAsync();

            if (staffByEmail.HasValue) return staffByEmail;
        }

        // 2. Lookup User by UserId to fetch their registered email/phone if email wasn't passed directly
        if (userId.HasValue && userId.Value > 0)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserId == userId.Value);

            if (user != null)
            {
                if (!string.IsNullOrWhiteSpace(user.Email))
                {
                    var userEmail = user.Email.Trim().ToLower();
                    var staffByUserEmail = await _context.Staff
                        .AsNoTracking()
                        .Where(s => s.IsActive == true && s.Email != null && s.Email.ToLower() == userEmail)
                        .Select(s => (int?)s.StaffId)
                        .FirstOrDefaultAsync();

                    if (staffByUserEmail.HasValue) return staffByUserEmail;
                }

                if (!string.IsNullOrWhiteSpace(user.MobileNumber))
                {
                    var userMobile = user.MobileNumber.Trim();
                    var staffByMobile = await _context.Staff
                        .AsNoTracking()
                        .Where(s => s.IsActive == true && s.Phone != null && s.Phone == userMobile)
                        .Select(s => (int?)s.StaffId)
                        .FirstOrDefaultAsync();

                    if (staffByMobile.HasValue) return staffByMobile;
                }
            }
        }

        return null;
    }

    public async Task<Staff?> GetStaffProfileByStaffIdAsync(int loggedInStaffId)
    {
        // Explicit ownership filtering on StaffId
        return await _context.Staff
            .Include(s => s.Qualifications)
            .Include(s => s.ExperienceRecords)
            .Include(s => s.Documents)
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StaffId == loggedInStaffId && s.IsActive == true);
    }

    public async Task<bool> UpdateTeacherProfileAsync(int loggedInStaffId, UpdateMyTeacherProfileDto dto)
    {
        // Load staff record using logged-in StaffId with strict ownership query
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == loggedInStaffId && s.IsActive == true);

        if (staff == null)
            return false;

        // Update ONLY permitted personal fields
        if (dto.ProfilePhoto != null)
            staff.ProfilePhoto = dto.ProfilePhoto;

        if (dto.Mobile != null)
            staff.Phone = dto.Mobile;

        if (dto.Address != null)
        {
            staff.PresentAddress = dto.Address;
            staff.ResidentialAddress = dto.Address;
        }

        if (dto.EmergencyContact != null)
            staff.AlternateMobile = dto.EmergencyContact;

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<TeacherAssignmentsResponseDto> GetTeacherAssignmentsByStaffIdAsync(int loggedInStaffId, string? academicYear)
    {
        // Load staff with strict ownership filter
        var staff = await _context.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StaffId == loggedInStaffId && s.IsActive == true);

        var result = new TeacherAssignmentsResponseDto
        {
            StaffId = loggedInStaffId,
            EmployeeId = staff?.EmployeeId ?? string.Empty,
            TeacherName = staff != null ? $"{staff.FirstName} {staff.LastName}".Trim() : string.Empty
        };

        if (staff == null) return result;

        // 1. Fetch from TeacherAssignment table with strict ownership filter
        var teacherAssignmentsQuery = _context.TeacherAssignments
            .Include(ta => ta.ClassGrade)
            .Include(ta => ta.Subject)
            .AsNoTracking()
            .Where(ta => ta.TeacherId == loggedInStaffId && ta.Status == "Active");

        var teacherAssignments = await teacherAssignmentsQuery.ToListAsync();

        // 2. Fetch from TeacherSubjectAssignment table with strict ownership filter
        var teacherSubjectAssignmentsQuery = _context.TeacherSubjectAssignments
            .Include(tsa => tsa.ClassGrade)
            .Include(tsa => tsa.ClassSection)
            .Include(tsa => tsa.Subject)
            .AsNoTracking()
            .Where(tsa => tsa.StaffId == loggedInStaffId);

        var teacherSubjectAssignments = await teacherSubjectAssignmentsQuery.ToListAsync();

        // Populate Classes
        var classDict = new Dictionary<int, TeacherClassAssignmentDto>();
        foreach (var ta in teacherAssignments)
        {
            if (ta.ClassGrade != null && !classDict.ContainsKey(ta.ClassId))
            {
                classDict[ta.ClassId] = new TeacherClassAssignmentDto
                {
                    ClassId = ta.ClassId,
                    ClassName = ta.ClassGrade.ClassName ?? string.Empty,
                    Role = ta.Role ?? "Teacher"
                };
            }
        }
        foreach (var tsa in teacherSubjectAssignments)
        {
            if (tsa.ClassGrade != null && !classDict.ContainsKey(tsa.ClassId))
            {
                classDict[tsa.ClassId] = new TeacherClassAssignmentDto
                {
                    ClassId = tsa.ClassId,
                    ClassName = tsa.ClassGrade.ClassName ?? string.Empty,
                    Role = "Subject Teacher"
                };
            }
        }
        result.Classes = classDict.Values.ToList();

        // Populate Sections
        var sectionDict = new Dictionary<string, TeacherSectionAssignmentDto>();
        foreach (var ta in teacherAssignments)
        {
            if (!string.IsNullOrWhiteSpace(ta.SectionLetter))
            {
                var key = $"{ta.ClassId}_{ta.SectionLetter}";
                if (!sectionDict.ContainsKey(key))
                {
                    sectionDict[key] = new TeacherSectionAssignmentDto
                    {
                        SectionId = ta.Id,
                        SectionName = ta.SectionLetter,
                        ClassName = ta.ClassGrade?.ClassName ?? ""
                    };
                }
            }
        }
        foreach (var tsa in teacherSubjectAssignments)
        {
            if (tsa.ClassSection != null)
            {
                var key = $"{tsa.ClassId}_{tsa.ClassSection.SectionName}";
                if (!sectionDict.ContainsKey(key))
                {
                    sectionDict[key] = new TeacherSectionAssignmentDto
                    {
                        SectionId = tsa.SectionId,
                        SectionName = tsa.ClassSection.SectionName,
                        ClassName = tsa.ClassGrade?.ClassName ?? ""
                    };
                }
            }
        }
        result.Sections = sectionDict.Values.ToList();

        // Populate Subjects
        var subjectDict = new Dictionary<string, TeacherSubjectAssignmentDto>();
        foreach (var ta in teacherAssignments)
        {
            if (ta.Subject != null)
            {
                var key = $"{ta.SubjectId}_{ta.ClassId}";
                if (!subjectDict.ContainsKey(key))
                {
                    subjectDict[key] = new TeacherSubjectAssignmentDto
                    {
                        SubjectId = ta.Subject.SubjectId,
                        SubjectName = ta.Subject.SubjectName ?? string.Empty,
                        SubjectCode = ta.Subject.SubjectCode ?? "",
                        ClassName = ta.ClassGrade?.ClassName ?? ""
                    };
                }
            }
        }
        foreach (var tsa in teacherSubjectAssignments)
        {
            if (tsa.Subject != null)
            {
                var key = $"{tsa.Subject.SubjectId}_{tsa.ClassId}";
                if (!subjectDict.ContainsKey(key))
                {
                    subjectDict[key] = new TeacherSubjectAssignmentDto
                    {
                        SubjectId = tsa.Subject.SubjectId,
                        SubjectName = tsa.Subject.SubjectName ?? "",
                        SubjectCode = tsa.Subject.SubjectCode ?? "",
                        ClassName = tsa.ClassGrade?.ClassName ?? ""
                    };
                }
            }
        }

        // If no explicit assignments table records exist, fallback to PrimarySubject from Staff entity
        if (!subjectDict.Any() && !string.IsNullOrWhiteSpace(staff.PrimarySubject))
        {
            subjectDict["primary"] = new TeacherSubjectAssignmentDto
            {
                SubjectId = 0,
                SubjectName = staff.PrimarySubject,
                SubjectCode = staff.Specialization ?? "",
                ClassName = "All Classes"
            };
        }
        result.Subjects = subjectDict.Values.ToList();

        return result;
    }
}
