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

public class TeacherDocumentRepository : ITeacherDocumentRepository
{
    private readonly AppDbContext _context;

    private static readonly string[] StandardRequiredDocTitles = new[]
    {
        "Passport Photo",
        "Aadhaar Card",
        "PAN Card",
        "Degree Certificate",
        "B.Ed./M.Ed. (if applicable)",
        "Experience Certificate",
        "Joining Letter",
        "Bank Passbook"
    };

    public TeacherDocumentRepository(AppDbContext context)
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

    public async Task<List<TeacherDocumentDto>> GetDocumentsByStaffIdAsync(int staffId)
    {
        var existingDocs = await _context.StaffDocuments
            .AsNoTracking()
            .Where(d => d.StaffId == staffId)
            .ToListAsync();

        var existingDict = existingDocs.ToDictionary(d => NormalizeTitle(d.DocumentType), StringComparer.OrdinalIgnoreCase);

        var resultList = new List<TeacherDocumentDto>();

        foreach (var reqTitle in StandardRequiredDocTitles)
        {
            var normKey = NormalizeTitle(reqTitle);
            if (existingDict.TryGetValue(normKey, out var doc))
            {
                resultList.Add(MapToDto(doc));
            }
            else
            {
                resultList.Add(new TeacherDocumentDto
                {
                    Id = 0,
                    StaffId = staffId,
                    DocumentTitle = reqTitle,
                    DocumentType = reqTitle.Contains("Optional", StringComparison.OrdinalIgnoreCase) || reqTitle.Contains("if applicable", StringComparison.OrdinalIgnoreCase) ? "Optional" : "Required",
                    FileUrl = null,
                    FileName = null,
                    IsRequired = !reqTitle.Contains("if applicable", StringComparison.OrdinalIgnoreCase),
                    Status = "Pending",
                    UploadedAt = null
                });
            }
        }

        foreach (var doc in existingDocs)
        {
            var normKey = NormalizeTitle(doc.DocumentType);
            if (!StandardRequiredDocTitles.Any(t => NormalizeTitle(t) == normKey))
            {
                resultList.Add(MapToDto(doc));
            }
        }

        return resultList;
    }

    public async Task<TeacherDocumentDto?> GetDocumentByIdAsync(int staffId, int documentId)
    {
        var doc = await _context.StaffDocuments
            .AsNoTracking()
            .FirstOrDefaultAsync(d => d.StaffId == staffId && d.StaffDocumentId == documentId);

        if (doc == null) return null;
        return MapToDto(doc);
    }

    public async Task<TeacherDocumentDto?> UploadOrUpdateDocumentAsync(int staffId, CreateOrUpdateTeacherDocumentDto dto)
    {
        var staffExists = await _context.Staff.AnyAsync(s => s.StaffId == staffId && s.IsActive == true);
        if (!staffExists) return null;

        var title = dto.DocumentTitle.Trim();
        var normTitle = NormalizeTitle(title);

        var existingDoc = await _context.StaffDocuments
            .FirstOrDefaultAsync(d => d.StaffId == staffId && d.DocumentType.ToLower() == normTitle);

        if (existingDoc == null)
        {
            existingDoc = new StaffDocument
            {
                StaffId = staffId,
                DocumentType = title,
                FileUrl = dto.FileUrl.Trim(),
                IsRequired = dto.IsRequired,
                Status = "Uploaded",
                UploadedAt = DateTime.UtcNow
            };
            _context.StaffDocuments.Add(existingDoc);
        }
        else
        {
            existingDoc.DocumentType = title;
            existingDoc.FileUrl = dto.FileUrl.Trim();
            existingDoc.IsRequired = dto.IsRequired;
            existingDoc.Status = "Uploaded";
            existingDoc.UploadedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        if (normTitle.Contains("passport photo"))
        {
            var staff = await _context.Staff.FindAsync(staffId);
            if (staff != null)
            {
                staff.ProfilePhoto = dto.FileUrl.Trim();
                await _context.SaveChangesAsync();
            }
        }

        return MapToDto(existingDoc);
    }

    public async Task<List<TeacherDocumentDto>> BulkUpdateDocumentsAsync(int staffId, List<CreateOrUpdateTeacherDocumentDto> dtoList)
    {
        foreach (var dto in dtoList)
        {
            await UploadOrUpdateDocumentAsync(staffId, dto);
        }
        return await GetDocumentsByStaffIdAsync(staffId);
    }

    public async Task<bool> DeleteDocumentAsync(int staffId, int documentId)
    {
        var doc = await _context.StaffDocuments
            .FirstOrDefaultAsync(d => d.StaffId == staffId && d.StaffDocumentId == documentId);

        if (doc == null) return false;

        _context.StaffDocuments.Remove(doc);
        await _context.SaveChangesAsync();
        return true;
    }

    private static string NormalizeTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title)) return string.Empty;
        return title.ToLower().Replace(" ", "").Replace(".", "").Replace("/", "").Replace("-", "");
    }

    private static TeacherDocumentDto MapToDto(StaffDocument d)
    {
        var fileName = !string.IsNullOrWhiteSpace(d.FileUrl) ? System.IO.Path.GetFileName(d.FileUrl) : null;
        return new TeacherDocumentDto
        {
            Id = d.StaffDocumentId,
            StaffId = d.StaffId,
            DocumentTitle = d.DocumentType,
            DocumentType = d.IsRequired ? "Required" : "Optional",
            FileUrl = d.FileUrl,
            FileName = fileName,
            IsRequired = d.IsRequired,
            Status = !string.IsNullOrWhiteSpace(d.FileUrl) ? "Uploaded" : (d.Status ?? "Pending"),
            UploadedAt = d.UploadedAt
        };
    }
}
