using SMS.Api.Common;
using SMS.Api.Dtos.Transport.StudentTransportAssignment;

namespace SMS.Api.Repositories.Interfaces
{
    public interface IStudentTransportAssignmentRepository
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

        Task<bool> HasOverlappingAssignmentAsync(
            long studentId,
            DateTime effectiveFrom,
            DateTime? effectiveTo,
            long? excludeAssignmentId = null);

        Task<IEnumerable<StudentTransportAssignmentLookupDto>>
            GetLookupAsync();
    }
}