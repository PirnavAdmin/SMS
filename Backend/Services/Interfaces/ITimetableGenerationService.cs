namespace SMS.Api.Services.Interfaces;

using System.Threading;
using System.Threading.Tasks;
using SMS.Api.Dtos;

public interface ITimetableGenerationService
{
    Task<GenerateTimetableResponseDto> GenerateTimetableAsync(GenerateTimetableRequestDto dto, CancellationToken cancellationToken = default);
}
