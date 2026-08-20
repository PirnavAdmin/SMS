namespace SMS.Api.Repositories.Implementations.TeacherScreens;

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Repositories.Interfaces.TeacherScreens;

public class TeacherReviewRepository : ITeacherReviewRepository
{
    private readonly AppDbContext _context;
    private readonly ITeacherPersonalRepository _personalRepository;
    private readonly ITeacherAddressRepository _addressRepository;
    private readonly ITeacherEducationRepository _educationRepository;
    private readonly ITeacherExperienceRepository _experienceRepository;
    private readonly ITeacherBankRepository _bankRepository;
    private readonly ITeacherDocumentRepository _documentRepository;

    public TeacherReviewRepository(
        AppDbContext context,
        ITeacherPersonalRepository personalRepository,
        ITeacherAddressRepository addressRepository,
        ITeacherEducationRepository educationRepository,
        ITeacherExperienceRepository experienceRepository,
        ITeacherBankRepository bankRepository,
        ITeacherDocumentRepository documentRepository)
    {
        _context = context;
        _personalRepository = personalRepository;
        _addressRepository = addressRepository;
        _educationRepository = educationRepository;
        _experienceRepository = experienceRepository;
        _bankRepository = bankRepository;
        _documentRepository = documentRepository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _personalRepository.ResolveStaffIdAsync(userId, email);
    }

    public async Task<TeacherReviewSummaryDto?> GetReviewSummaryByStaffIdAsync(int staffId)
    {
        var staff = await _context.Staff
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null) return null;

        var personal = await _personalRepository.GetPersonalInfoByStaffIdAsync(staffId);
        var address = await _addressRepository.GetAddressByStaffIdAsync(staffId);
        var education = await _educationRepository.GetQualificationsByStaffIdAsync(staffId);
        var experience = await _experienceRepository.GetExperiencesByStaffIdAsync(staffId);
        var bank = await _bankRepository.GetBankDetailsByStaffIdAsync(staffId);
        var documents = await _documentRepository.GetDocumentsByStaffIdAsync(staffId);

        var uploadedCount = documents.Count(d => d.Status == "Uploaded" || !string.IsNullOrWhiteSpace(d.FileUrl));
        var requiredCount = documents.Count(d => d.IsRequired);

        return new TeacherReviewSummaryDto
        {
            StaffId = staffId,
            Personal = personal,
            Address = address,
            Qualifications = education,
            Experiences = experience,
            Bank = bank,
            Documents = documents,
            TotalUploadedDocumentsCount = uploadedCount,
            TotalRequiredDocumentsCount = requiredCount,
            IsProfileComplete = uploadedCount >= requiredCount && personal != null && address != null,
            ProfileStatus = "Completed"
        };
    }

    public async Task<TeacherSubmissionResultDto> SubmitProfileAsync(int staffId, SubmitTeacherProfileDto dto)
    {
        var staff = await _context.Staff
            .FirstOrDefaultAsync(s => s.StaffId == staffId && s.IsActive == true);

        if (staff == null)
        {
            return new TeacherSubmissionResultDto
            {
                Success = false,
                Message = "Active teacher staff record not found.",
                ProfileStatus = "Failed",
                SubmittedAt = DateTime.UtcNow
            };
        }

        var now = DateTime.UtcNow;

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email != null && u.Email.ToLower() == (staff.Email ?? "").ToLower());

        if (user != null)
        {
            user.IsFirstLogin = false;
        }

        await _context.SaveChangesAsync();

        return new TeacherSubmissionResultDto
        {
            Success = true,
            Message = "Teacher profile submitted and marked completed successfully.",
            ProfileStatus = "Completed",
            SubmittedAt = now
        };
    }
}
