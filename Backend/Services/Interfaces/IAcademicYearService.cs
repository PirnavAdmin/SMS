namespace SMS.Api.Services.Interfaces;

using System.Collections.Generic;
using System.Threading.Tasks;
using SMS.Api.Dtos;

public interface IAcademicYearService
{
    Task<string> GetCurrentAcademicYearAsync();
    Task<List<AcademicYearDto>> GetAllAcademicYearsAsync();
}
