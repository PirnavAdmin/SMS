namespace SMS.Api.Repositories.Interfaces.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;

public interface ITeacherDocumentRepository
{
    Task<int?> ResolveStaffIdAsync(int? userId, string? email);
    Task<List<TeacherDocumentDto>> GetDocumentsByStaffIdAsync(int staffId);
    Task<TeacherDocumentDto?> GetDocumentByIdAsync(int staffId, int documentId);
    Task<TeacherDocumentDto?> UploadOrUpdateDocumentAsync(int staffId, CreateOrUpdateTeacherDocumentDto dto);
    Task<List<TeacherDocumentDto>> BulkUpdateDocumentsAsync(int staffId, List<CreateOrUpdateTeacherDocumentDto> dtoList);
    Task<bool> DeleteDocumentAsync(int staffId, int documentId);
}
