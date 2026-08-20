namespace SMS.Api.Repositories.Implementations.TeacherScreens;

using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces.TeacherScreens;

public class TeacherPersonalRepository : ITeacherPersonalRepository
{
    private readonly AppDbContext _context;

    public TeacherPersonalRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        if (!string.IsNullOrWhiteSpace(email))
        {
            var cleanEmail = email.Trim().ToLower();
            var staff = await _context.Staff
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.IsActive == true && s.Email != null && s.Email.ToLower() == cleanEmail);
            if (staff != null) return staff.StaffId;
        }

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
                    var staff = await _context.Staff
                        .AsNoTracking()
                        .FirstOrDefaultAsync(s => s.IsActive == true && s.Email != null && s.Email.ToLower() == userEmail);
                    if (staff != null) return staff.StaffId;
                }

                if (!string.IsNullOrWhiteSpace(user.MobileNumber))
                {
                    var mobile = user.MobileNumber.Trim();
                    var staff = await _context.Staff
                        .AsNoTracking()
                        .FirstOrDefaultAsync(s => s.IsActive == true && s.Phone != null && s.Phone == mobile);
                    if (staff != null) return staff.StaffId;
                }
            }
        }

        return null;
    }

    public async Task<TeacherPersonalInfoDto?> GetPersonalInfoByStaffIdAsync(int staffId)
    {
        var staff = await _context.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        return MapToDto(staff);
    }

    public async Task<TeacherPersonalInfoDto?> CreatePersonalInfoAsync(int staffId, CreateTeacherPersonalInfoDto dto)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.FirstName)) staff.FirstName = dto.FirstName.Trim();
        if (dto.MiddleName != null) staff.MiddleName = dto.MiddleName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.LastName)) staff.LastName = dto.LastName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Gender)) staff.Gender = dto.Gender.Trim();
        if (dto.DateOfBirth != default) staff.DateOfBirth = dto.DateOfBirth;
        if (dto.BloodGroup != null) staff.BloodGroup = dto.BloodGroup.Trim();
        if (dto.AlternateMobile != null) staff.AlternateMobile = dto.AlternateMobile.Trim();
        if (dto.Nationality != null) staff.Nationality = dto.Nationality.Trim();
        if (dto.Religion != null) staff.Religion = dto.Religion.Trim();
        if (dto.MaritalStatus != null) staff.MaritalStatus = dto.MaritalStatus.Trim();
        if (dto.FatherName != null) staff.FatherName = dto.FatherName.Trim();
        if (dto.MotherName != null) staff.MotherName = dto.MotherName.Trim();
        if (dto.ProfilePhoto != null) staff.ProfilePhoto = dto.ProfilePhoto.Trim();

        await _context.SaveChangesAsync();
        return MapToDto(staff);
    }

    public async Task<TeacherPersonalInfoDto?> UpdatePersonalInfoAsync(int staffId, UpdateTeacherPersonalInfoDto dto)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.FirstName)) staff.FirstName = dto.FirstName.Trim();
        if (dto.MiddleName != null) staff.MiddleName = dto.MiddleName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.LastName)) staff.LastName = dto.LastName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Gender)) staff.Gender = dto.Gender.Trim();
        if (dto.DateOfBirth.HasValue) staff.DateOfBirth = dto.DateOfBirth.Value;
        if (dto.BloodGroup != null) staff.BloodGroup = dto.BloodGroup.Trim();
        if (dto.AlternateMobile != null) staff.AlternateMobile = dto.AlternateMobile.Trim();
        if (dto.Nationality != null) staff.Nationality = dto.Nationality.Trim();
        if (dto.Religion != null) staff.Religion = dto.Religion.Trim();
        if (dto.MaritalStatus != null) staff.MaritalStatus = dto.MaritalStatus.Trim();
        if (dto.FatherName != null) staff.FatherName = dto.FatherName.Trim();
        if (dto.MotherName != null) staff.MotherName = dto.MotherName.Trim();
        if (dto.ProfilePhoto != null) staff.ProfilePhoto = dto.ProfilePhoto.Trim();

        await _context.SaveChangesAsync();
        return MapToDto(staff);
    }

    public async Task<bool> DeletePersonalInfoAsync(int staffId)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return false;

        staff.MiddleName = null;
        staff.BloodGroup = null;
        staff.AlternateMobile = null;
        staff.Nationality = null;
        staff.Religion = null;
        staff.MaritalStatus = null;
        staff.FatherName = null;
        staff.MotherName = null;
        staff.ProfilePhoto = null;

        await _context.SaveChangesAsync();
        return true;
    }

    private static TeacherPersonalInfoDto MapToDto(Staff staff)
    {
        return new TeacherPersonalInfoDto
        {
            StaffId = staff.StaffId,
            EmployeeId = staff.EmployeeId,
            FirstName = staff.FirstName ?? string.Empty,
            MiddleName = staff.MiddleName,
            LastName = staff.LastName ?? string.Empty,
            Gender = staff.Gender ?? string.Empty,
            DateOfBirth = staff.DateOfBirth,
            BloodGroup = staff.BloodGroup,
            AlternateMobile = staff.AlternateMobile,
            Nationality = staff.Nationality,
            Religion = staff.Religion,
            MaritalStatus = staff.MaritalStatus,
            FatherName = staff.FatherName,
            MotherName = staff.MotherName,
            Email = staff.Email,
            Phone = staff.Phone,
            ProfilePhoto = staff.ProfilePhoto
        };
    }
}
