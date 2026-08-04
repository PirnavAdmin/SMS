namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class LibraryBookDto
{
    public int BookId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Category { get; set; } = "Science";
    public string RackLocation { get; set; } = "Rack S-04";
    public int TotalCopies { get; set; } = 15;
    public int AvailableCopies { get; set; } = 11;
    public string DisplayTitle => $"{Title} ({AvailableCopies} available)";
}

public class AddLibraryBookDto
{
    public string Title { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public string Category { get; set; } = "Science";
    public string RackLocation { get; set; } = "Rack S-05";
    public int TotalCopies { get; set; } = 10;
}

public class IssuedBookRecordDto
{
    public int IssueId { get; set; }
    public int BookId { get; set; }
    public string BookTitle { get; set; } = string.Empty;
    public string Borrower { get; set; } = string.Empty;
    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerRole { get; set; } = "Student";
    public string IssueDate { get; set; } = string.Empty;
    public string DueDate { get; set; } = string.Empty;
    public decimal Fine { get; set; } = 0;
    public string FormattedFine => $"₹{Fine:N0}";
    public string Status { get; set; } = "Issued";
}

public class IssueBookRequestDto
{
    public int BookId { get; set; }
    public string BorrowerName { get; set; } = string.Empty;
    public string BorrowerRole { get; set; } = "Student";
    public string DueReturnDate { get; set; } = string.Empty;
}

public class ReturnBookRequestDto
{
    public int IssueId { get; set; }
    public decimal FinePaid { get; set; } = 0;
}

public class LibraryDropdownOptionsDto
{
    public List<string> AcademicYears { get; set; } = new List<string> { "2027-28", "2026-27", "2025-26" };
    public List<LibraryBookDto> AvailableBooks { get; set; } = new List<LibraryBookDto>();
}
