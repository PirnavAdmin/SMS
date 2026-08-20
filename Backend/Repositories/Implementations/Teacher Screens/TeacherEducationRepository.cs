namespace SMS.Api.Repositories.Implementations.TeacherScreens;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces.TeacherScreens;

public class TeacherEducationRepository : ITeacherEducationRepository
{
    private readonly AppDbContext _context;

    public TeacherEducationRepository(AppDbContext context)
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

    public async Task<List<TeacherEducationDto>> GetQualificationsByStaffIdAsync(int staffId)
    {
        var records = await _context.StaffQualifications
            .AsNoTracking()
            .Where(q => q.StaffId == staffId)
            .OrderBy(q => q.Id)
            .ToListAsync();

        return records.Select(MapToDto).ToList();
    }

    public async Task<TeacherEducationDto?> GetQualificationByIdAsync(int staffId, int qualificationId)
    {
        var record = await _context.StaffQualifications
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.StaffId == staffId && q.Id == qualificationId);

        if (record == null) return null;
        return MapToDto(record);
    }

    public async Task<TeacherEducationDto?> AddQualificationAsync(int staffId, CreateTeacherEducationDto dto)
    {
        var staffExists = await _context.Staff.AnyAsync(s => s.StaffId == staffId && s.IsActive == true);
        if (!staffExists) return null;

        var entity = new StaffQualification
        {
            StaffId = staffId,
            QualificationDegree = dto.HighestQualification?.Trim(),
            BoardUniversity = dto.BoardUniversity?.Trim(),
            PassingYear = dto.Year?.Trim(),
            PercentageCgpa = dto.Percentage?.Trim(),
            BEd = dto.BEd?.Trim(),
            MEd = dto.MEd?.Trim(),
            PhD = dto.PhD?.Trim(),
            SpecializationSubject = dto.Specialization?.Trim()
        };

        _context.StaffQualifications.Add(entity);
        await _context.SaveChangesAsync();

        // Also update primary qualification summary on Staff entity
        var primaryQual = dto.HighestQualification?.Trim();
        if (!string.IsNullOrWhiteSpace(primaryQual))
        {
            var staff = await _context.Staff.FindAsync(staffId);
            if (staff != null)
            {
                staff.Qualification = primaryQual;
                if (!string.IsNullOrWhiteSpace(dto.Specialization))
                {
                    staff.Specialization = dto.Specialization.Trim();
                }
                await _context.SaveChangesAsync();
            }
        }

        return MapToDto(entity);
    }

    public async Task<TeacherEducationDto?> UpdateQualificationAsync(int staffId, int qualificationId, UpdateTeacherEducationDto dto)
    {
        var entity = await _context.StaffQualifications
            .FirstOrDefaultAsync(q => q.StaffId == staffId && q.Id == qualificationId);

        if (entity == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.HighestQualification)) entity.QualificationDegree = dto.HighestQualification.Trim();
        if (!string.IsNullOrWhiteSpace(dto.BoardUniversity)) entity.BoardUniversity = dto.BoardUniversity.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Year)) entity.PassingYear = dto.Year.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Percentage)) entity.PercentageCgpa = dto.Percentage.Trim();
        if (dto.BEd != null) entity.BEd = dto.BEd.Trim();
        if (dto.MEd != null) entity.MEd = dto.MEd.Trim();
        if (dto.PhD != null) entity.PhD = dto.PhD.Trim();
        if (dto.Specialization != null) entity.SpecializationSubject = dto.Specialization.Trim();

        await _context.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<List<TeacherEducationDto>> BulkUpdateQualificationsAsync(int staffId, List<CreateTeacherEducationDto> dtoList)
    {
        var existing = await _context.StaffQualifications.Where(q => q.StaffId == staffId).ToListAsync();
        _context.StaffQualifications.RemoveRange(existing);

        var newEntities = dtoList.Select(dto => new StaffQualification
        {
            StaffId = staffId,
            QualificationDegree = dto.HighestQualification?.Trim(),
            BoardUniversity = dto.BoardUniversity?.Trim(),
            PassingYear = dto.Year?.Trim(),
            PercentageCgpa = dto.Percentage?.Trim(),
            BEd = dto.BEd?.Trim(),
            MEd = dto.MEd?.Trim(),
            PhD = dto.PhD?.Trim(),
            SpecializationSubject = dto.Specialization?.Trim()
        }).ToList();

        _context.StaffQualifications.AddRange(newEntities);
        await _context.SaveChangesAsync();

        if (dtoList.Count > 0 && !string.IsNullOrWhiteSpace(dtoList[0].HighestQualification))
        {
            var staff = await _context.Staff.FindAsync(staffId);
            if (staff != null)
            {
                if (dtoList[0].HighestQualification != null) staff.Qualification = dtoList[0].HighestQualification!.Trim();
                if (!string.IsNullOrWhiteSpace(dtoList[0].Specialization))
                {
                    staff.Specialization = dtoList[0].Specialization!.Trim();
                }
                await _context.SaveChangesAsync();
            }
        }

        return newEntities.Select(MapToDto).ToList();
    }

    public async Task<bool> DeleteQualificationAsync(int staffId, int qualificationId)
    {
        var entity = await _context.StaffQualifications
            .FirstOrDefaultAsync(q => q.StaffId == staffId && q.Id == qualificationId);

        if (entity == null) return false;

        _context.StaffQualifications.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static TeacherEducationDto MapToDto(StaffQualification q)
    {
        return new TeacherEducationDto
        {
            Id = q.Id,
            StaffId = q.StaffId,
            HighestQualification = q.QualificationDegree ?? string.Empty,
            BoardUniversity = q.BoardUniversity ?? string.Empty,
            Year = q.PassingYear ?? string.Empty,
            Percentage = q.PercentageCgpa ?? string.Empty,
            BEd = q.BEd,
            MEd = q.MEd,
            PhD = q.PhD,
            Specialization = q.SpecializationSubject
        };
    }
}
