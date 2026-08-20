namespace SMS.Api.Repositories.Implementations.TeacherScreens;

using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces.TeacherScreens;

public class TeacherBankRepository : ITeacherBankRepository
{
    private readonly AppDbContext _context;

    public TeacherBankRepository(AppDbContext context)
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

    public async Task<TeacherBankDto?> GetBankDetailsByStaffIdAsync(int staffId)
    {
        var staff = await _context.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        return MapToDto(staff);
    }

    public async Task<TeacherBankDto?> CreateBankDetailsAsync(int staffId, CreateTeacherBankDto dto)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.AccountHolderName)) staff.AccountHolderName = dto.AccountHolderName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.BankName)) staff.BankName = dto.BankName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Branch)) staff.BranchName = dto.Branch.Trim();
        if (!string.IsNullOrWhiteSpace(dto.AccountNumber)) staff.AccountNumber = dto.AccountNumber.Trim();
        if (!string.IsNullOrWhiteSpace(dto.IfscCode)) staff.IfscCode = dto.IfscCode.Trim().ToUpper();
        if (dto.UpiId != null) staff.UpiId = dto.UpiId.Trim();

        await _context.SaveChangesAsync();
        return MapToDto(staff);
    }

    public async Task<TeacherBankDto?> UpdateBankDetailsAsync(int staffId, UpdateTeacherBankDto dto)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.AccountHolderName)) staff.AccountHolderName = dto.AccountHolderName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.BankName)) staff.BankName = dto.BankName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Branch)) staff.BranchName = dto.Branch.Trim();
        if (!string.IsNullOrWhiteSpace(dto.AccountNumber)) staff.AccountNumber = dto.AccountNumber.Trim();
        if (!string.IsNullOrWhiteSpace(dto.IfscCode)) staff.IfscCode = dto.IfscCode.Trim().ToUpper();
        if (dto.UpiId != null) staff.UpiId = dto.UpiId.Trim();

        await _context.SaveChangesAsync();
        return MapToDto(staff);
    }

    public async Task<bool> DeleteBankDetailsAsync(int staffId)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return false;

        staff.AccountHolderName = null;
        staff.BankName = null;
        staff.BranchName = null;
        staff.AccountNumber = null;
        staff.IfscCode = null;
        staff.UpiId = null;

        await _context.SaveChangesAsync();
        return true;
    }

    private static TeacherBankDto MapToDto(Staff staff)
    {
        return new TeacherBankDto
        {
            StaffId = staff.StaffId,
            AccountHolderName = staff.AccountHolderName ?? string.Empty,
            BankName = staff.BankName ?? string.Empty,
            Branch = staff.BranchName ?? string.Empty,
            AccountNumber = staff.AccountNumber ?? string.Empty,
            IfscCode = staff.IfscCode ?? string.Empty,
            UpiId = staff.UpiId
        };
    }
}
