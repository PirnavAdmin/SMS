using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using SMS.Api.Dtos.Teacher;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations;

public class TeacherProfileService : ITeacherProfileService
{
    private readonly ITeacherProfileRepository _repository;

    public TeacherProfileService(ITeacherProfileRepository repository)
    {
        _repository = repository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _repository.GetStaffIdByUserIdOrEmailAsync(userId, email);
    }

    public async Task<TeacherSelfProfileDto?> GetMyProfileAsync(int staffId)
    {
        var staff = await _repository.GetStaffProfileByStaffIdAsync(staffId);
        if (staff == null) return null;

        var assignments = await _repository.GetTeacherAssignmentsByStaffIdAsync(staffId, staff.AcademicYear);

        var dto = new TeacherSelfProfileDto
        {
            StaffId = staff.StaffId,
            EmployeeId = staff.EmployeeId ?? string.Empty,
            FullName = $"{staff.FirstName} {staff.LastName}".Trim(),
            FirstName = staff.FirstName,
            MiddleName = staff.MiddleName,
            LastName = staff.LastName,
            ProfilePhoto = staff.ProfilePhoto,
            Email = staff.Email ?? string.Empty,
            Mobile = staff.Phone,
            Gender = staff.Gender,
            DateOfBirth = staff.DateOfBirth,
            BloodGroup = staff.BloodGroup,
            Address = !string.IsNullOrWhiteSpace(staff.PresentAddress) ? staff.PresentAddress : staff.ResidentialAddress,
            PermanentAddress = staff.PermanentAddress,
            EmergencyContact = staff.AlternateMobile,
            Branch = staff.BranchName ?? "Main Campus",
            Department = staff.Department,
            Designation = staff.Designation,
            JoiningDate = staff.JoiningDate,
            Qualification = !string.IsNullOrWhiteSpace(staff.Qualification) 
                ? staff.Qualification 
                : string.Join(", ", staff.Qualifications.Select(q => q.QualificationDegree).Where(d => !string.IsNullOrEmpty(d))),
            Experience = string.Join("; ", staff.ExperienceRecords.Select(e => $"{e.DesignationHeld} at {e.PreviousOrganization} ({e.TotalExperience})")),
            AssignedClasses = assignments.Classes.Select(c => c.ClassName).Distinct().ToList(),
            AssignedSections = assignments.Sections.Select(s => s.SectionName).Distinct().ToList(),
            AssignedSubjects = assignments.Subjects.Select(s => s.SubjectName).Distinct().ToList(),
            EmploymentStatus = staff.EmploymentType ?? (staff.IsActive == true ? "Active" : "Inactive"),
            ProfileStatus = "Completed"
        };

        return dto;
    }

    public async Task<bool> UpdateMyProfileAsync(int staffId, UpdateMyTeacherProfileDto dto)
    {
        return await _repository.UpdateTeacherProfileAsync(staffId, dto);
    }

    public async Task<TeacherAssignmentsResponseDto> GetMyAssignmentsAsync(int staffId, string? academicYear)
    {
        return await _repository.GetTeacherAssignmentsByStaffIdAsync(staffId, academicYear);
    }
}
