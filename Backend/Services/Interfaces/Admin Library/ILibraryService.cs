namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface ILibraryService
{
    Task<LibraryDropdownOptionsDto> GetLibraryDropdownOptionsAsync();
    Task<List<LibraryBookDto>> GetBookInventoryAsync(string? search, string? category);
    Task<List<IssuedBookRecordDto>> GetIssuedBooksAsync(string? search, string? status);
    Task<LibraryBookDto> AddBookAsync(AddLibraryBookDto dto);
    Task<IssuedBookRecordDto> IssueBookAsync(IssueBookRequestDto dto);
    Task<bool> ReturnBookAsync(ReturnBookRequestDto dto);
}
