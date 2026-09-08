namespace SMS.Api.Services.Interfaces;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos;

public interface ITimetableGenerationService
{
    Task<List<TimetableSlotDto>> GenerateTimetableAsync(GenerateTimetableRequestDto dto);
}
