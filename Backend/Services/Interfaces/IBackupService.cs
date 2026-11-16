using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using SMS.Api.Dtos;

namespace SMS.Api.Services.Interfaces
{
    public interface IBackupService
    {
        Task<BackupStatusDto> GetBackupStatusAsync(int? schoolId);
        Task<DatabaseBackupPayloadDto> GenerateBackupDataAsync(int? schoolId, string userName, string userRole);
        Task<BackupSnapshotItemDto> CreateServerSnapshotAsync(int? schoolId, string userName, string userRole);
        Task<List<BackupSnapshotItemDto>> GetSnapshotsAsync(int? schoolId);
        Task<(byte[] bytes, string fileName)> GetSnapshotFileAsync(string fileName);
        Task<RestoreResultDto> RestoreFromPayloadAsync(DatabaseBackupPayloadDto payload, int? schoolId, string userName, string userRole);
        Task<RestoreResultDto> RestoreFromSnapshotFileAsync(string fileName, int? schoolId, string userName, string userRole);
        Task<RestoreResultDto> RestoreFromUploadedFileAsync(IFormFile file, int? schoolId, string userName, string userRole);
    }
}
