namespace SMS.Api.Services.Interfaces.ExaminationNew;

using SMS.Api.Dtos.ExaminationNew;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IExamNewService
{
    Task<ExamConfigOptionsDto> GetExamOptionsAsync();
    Task<ExamDetailsResponseDto?> GetExamDetailsByIdAsync(int examId);
    Task<ExamDetailsResponseDto> SaveExamDetailsAsync(SaveExamDetailsRequestDto request);
    Task<SubjectConfigPageResponseDto?> GetSubjectsForExamAsync(int examId, string? className);
    Task<bool> SaveSubjectsAndProceedAsync(SaveSubjectsAndMarksRequestDto request);
}
