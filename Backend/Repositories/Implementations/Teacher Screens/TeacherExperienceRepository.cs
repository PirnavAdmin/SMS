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

public class TeacherExperienceRepository : ITeacherExperienceRepository
{
    private readonly AppDbContext _context;

    public TeacherExperienceRepository(AppDbContext context)
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

    public async Task<List<TeacherExperienceDto>> GetExperiencesByStaffIdAsync(int staffId)
    {
        var records = await _context.StaffExperiences
            .AsNoTracking()
            .Where(e => e.StaffId == staffId)
            .OrderBy(e => e.Id)
            .ToListAsync();

        return records.Select(MapToDto).ToList();
    }

    public async Task<TeacherExperienceDto?> GetExperienceByIdAsync(int staffId, int experienceId)
    {
        var record = await _context.StaffExperiences
            .AsNoTracking()
            .FirstOrDefaultAsync(e => e.StaffId == staffId && e.Id == experienceId);

        if (record == null) return null;
        return MapToDto(record);
    }

    public async Task<TeacherExperienceDto?> AddExperienceAsync(int staffId, CreateTeacherExperienceDto dto)
    {
        var staffExists = await _context.Staff.AnyAsync(s => s.StaffId == staffId && s.IsActive == true);
        if (!staffExists) return null;

        var entity = new StaffExperience
        {
            StaffId = staffId,
            TotalExperience = dto.TotalExperience?.Trim(),
            PreviousSchool = dto.PreviousSchool?.Trim(),
            PreviousOrganization = dto.Organization?.Trim(),
            DesignationHeld = dto.Designation?.Trim(),
            FromDate = dto.JoiningDate,
            ToDate = dto.RelievingDate,
            CertificateFileName = dto.CertificateFileName?.Trim(),
            CertificateFileUrl = dto.CertificateFileUrl?.Trim(),
            CertificateUploadedAt = !string.IsNullOrWhiteSpace(dto.CertificateFileUrl) ? DateTime.UtcNow : null
        };

        _context.StaffExperiences.Add(entity);
        await _context.SaveChangesAsync();

        return MapToDto(entity);
    }

    public async Task<TeacherExperienceDto?> UpdateExperienceAsync(int staffId, int experienceId, UpdateTeacherExperienceDto dto)
    {
        var entity = await _context.StaffExperiences
            .FirstOrDefaultAsync(e => e.StaffId == staffId && e.Id == experienceId);

        if (entity == null) return null;

        if (dto.TotalExperience != null) entity.TotalExperience = dto.TotalExperience.Trim();
        if (dto.PreviousSchool != null) entity.PreviousSchool = dto.PreviousSchool.Trim();
        if (dto.Organization != null) entity.PreviousOrganization = dto.Organization.Trim();
        if (dto.Designation != null) entity.DesignationHeld = dto.Designation.Trim();
        if (dto.JoiningDate.HasValue) entity.FromDate = dto.JoiningDate.Value;
        if (dto.RelievingDate.HasValue) entity.ToDate = dto.RelievingDate.Value;
        if (dto.CertificateFileName != null) entity.CertificateFileName = dto.CertificateFileName.Trim();
        if (dto.CertificateFileUrl != null)
        {
            entity.CertificateFileUrl = dto.CertificateFileUrl.Trim();
            entity.CertificateUploadedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return MapToDto(entity);
    }

    public async Task<List<TeacherExperienceDto>> BulkUpdateExperiencesAsync(int staffId, List<CreateTeacherExperienceDto> dtoList)
    {
        var existing = await _context.StaffExperiences.Where(e => e.StaffId == staffId).ToListAsync();
        _context.StaffExperiences.RemoveRange(existing);

        var newEntities = dtoList.Select(dto => new StaffExperience
        {
            StaffId = staffId,
            TotalExperience = dto.TotalExperience?.Trim(),
            PreviousSchool = dto.PreviousSchool?.Trim(),
            PreviousOrganization = dto.Organization?.Trim(),
            DesignationHeld = dto.Designation?.Trim(),
            FromDate = dto.JoiningDate,
            ToDate = dto.RelievingDate,
            CertificateFileName = dto.CertificateFileName?.Trim(),
            CertificateFileUrl = dto.CertificateFileUrl?.Trim(),
            CertificateUploadedAt = !string.IsNullOrWhiteSpace(dto.CertificateFileUrl) ? DateTime.UtcNow : null
        }).ToList();

        _context.StaffExperiences.AddRange(newEntities);
        await _context.SaveChangesAsync();

        return newEntities.Select(MapToDto).ToList();
    }

    public async Task<bool> DeleteExperienceAsync(int staffId, int experienceId)
    {
        var entity = await _context.StaffExperiences
            .FirstOrDefaultAsync(e => e.StaffId == staffId && e.Id == experienceId);

        if (entity == null) return false;

        _context.StaffExperiences.Remove(entity);
        await _context.SaveChangesAsync();
        return true;
    }

    private static TeacherExperienceDto MapToDto(StaffExperience e)
    {
        return new TeacherExperienceDto
        {
            Id = e.Id,
            StaffId = e.StaffId,
            TotalExperience = e.TotalExperience,
            PreviousSchool = e.PreviousSchool,
            Organization = e.PreviousOrganization,
            Designation = e.DesignationHeld,
            JoiningDate = e.FromDate,
            RelievingDate = e.ToDate,
            CertificateFileName = e.CertificateFileName,
            CertificateFileUrl = e.CertificateFileUrl,
            CertificateUploadedAt = e.CertificateUploadedAt
        };
    }
}
