namespace SMS.Api.Services.Implementations.TeacherScreens;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos.TeacherScreens;
using SMS.Api.Repositories.Interfaces.TeacherScreens;
using SMS.Api.Services.Interfaces.TeacherScreens;

public class TeacherDocumentService : ITeacherDocumentService
{
    private readonly ITeacherDocumentRepository _repository;

    public TeacherDocumentService(ITeacherDocumentRepository repository)
    {
        _repository = repository;
    }

    public async Task<int?> ResolveStaffIdAsync(int? userId, string? email)
    {
        return await _repository.ResolveStaffIdAsync(userId, email);
    }

    public async Task<List<TeacherDocumentDto>> GetDocumentsAsync(int staffId)
    {
        return await _repository.GetDocumentsByStaffIdAsync(staffId);
    }

    public async Task<TeacherDocumentDto?> GetDocumentByIdAsync(int staffId, int documentId)
    {
        return await _repository.GetDocumentByIdAsync(staffId, documentId);
    }

    public async Task<TeacherDocumentDto?> UploadOrUpdateDocumentAsync(int staffId, CreateOrUpdateTeacherDocumentDto dto)
    {
        return await _repository.UploadOrUpdateDocumentAsync(staffId, dto);
    }

    public async Task<List<TeacherDocumentDto>> BulkUpdateDocumentsAsync(int staffId, List<CreateOrUpdateTeacherDocumentDto> dtoList)
    {
        return await _repository.BulkUpdateDocumentsAsync(staffId, dtoList);
    }

    public async Task<bool> DeleteDocumentAsync(int staffId, int documentId)
    {
        return await _repository.DeleteDocumentAsync(staffId, documentId);
    }
}
