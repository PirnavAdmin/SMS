using SMS.Api.Common;
using SMS.Api.Dtos.Transport.StudentTransportAssignment;

namespace SMS.Api.Services.Interfaces
{
    public interface IStudentTransportAssignmentService
    {
        Task<PagedResult<StudentTransportAssignmentDto>> GetAllAsync(
            StudentTransportAssignmentFilterDto filter);

        Task<StudentTransportAssignmentDto?> GetByIdAsync(
            long studentTransportAssignmentId);

        Task<long> CreateAsync(
            CreateStudentTransportAssignmentDto dto,
            long? userId);

        Task<bool> UpdateAsync(
            long studentTransportAssignmentId,
            UpdateStudentTransportAssignmentDto dto,
            long? userId);

        Task<bool> DeleteAsync(
            long studentTransportAssignmentId,
            long? userId);

        Task<IEnumerable<StudentTransportAssignmentLookupDto>>
            GetLookupAsync();
    }
}