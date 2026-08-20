namespace SMS.Api.Repositories.Implementations.TeacherScreens;

using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces.TeacherScreens;

public class TeacherAddressRepository : ITeacherAddressRepository
{
    private readonly AppDbContext _context;

    public TeacherAddressRepository(AppDbContext context)
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

    public async Task<TeacherAddressDto?> GetAddressByStaffIdAsync(int staffId)
    {
        var staff = await _context.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        return MapToDto(staff);
    }

    public async Task<TeacherAddressDto?> CreateAddressAsync(int staffId, CreateTeacherAddressDto dto)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.CurrentAddress))
        {
            staff.PresentAddress = dto.CurrentAddress.Trim();
            staff.ResidentialAddress = dto.CurrentAddress.Trim();
        }
        if (dto.PermanentAddress != null) staff.PermanentAddress = dto.PermanentAddress.Trim();
        if (!string.IsNullOrWhiteSpace(dto.City)) staff.City = dto.City.Trim();
        if (dto.District != null) staff.District = dto.District.Trim();
        if (!string.IsNullOrWhiteSpace(dto.State)) staff.State = dto.State.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Country)) staff.Country = dto.Country.Trim();
        if (!string.IsNullOrWhiteSpace(dto.PinCode)) staff.PinCode = dto.PinCode.Trim();

        await _context.SaveChangesAsync();
        return MapToDto(staff);
    }

    public async Task<TeacherAddressDto?> UpdateAddressAsync(int staffId, UpdateTeacherAddressDto dto)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.CurrentAddress))
        {
            staff.PresentAddress = dto.CurrentAddress.Trim();
            staff.ResidentialAddress = dto.CurrentAddress.Trim();
        }
        if (dto.PermanentAddress != null) staff.PermanentAddress = dto.PermanentAddress.Trim();
        if (!string.IsNullOrWhiteSpace(dto.City)) staff.City = dto.City.Trim();
        if (dto.District != null) staff.District = dto.District.Trim();
        if (!string.IsNullOrWhiteSpace(dto.State)) staff.State = dto.State.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Country)) staff.Country = dto.Country.Trim();
        if (!string.IsNullOrWhiteSpace(dto.PinCode)) staff.PinCode = dto.PinCode.Trim();

        await _context.SaveChangesAsync();
        return MapToDto(staff);
    }

    public async Task<bool> DeleteAddressAsync(int staffId)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return false;

        staff.PresentAddress = null;
        staff.ResidentialAddress = null;
        staff.PermanentAddress = null;
        staff.City = null;
        staff.District = null;
        staff.State = null;
        staff.Country = null;
        staff.PinCode = null;

        await _context.SaveChangesAsync();
        return true;
    }

    private static TeacherAddressDto MapToDto(Staff staff)
    {
        return new TeacherAddressDto
        {
            StaffId = staff.StaffId,
            CurrentAddress = staff.PresentAddress ?? staff.ResidentialAddress ?? string.Empty,
            PermanentAddress = staff.PermanentAddress,
            City = staff.City ?? string.Empty,
            District = staff.District,
            State = staff.State ?? string.Empty,
            Country = staff.Country ?? "India",
            PinCode = staff.PinCode ?? string.Empty
        };
    }
}
