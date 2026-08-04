namespace SMS.Api.Models;

using System;
using System.ComponentModel.DataAnnotations;

public class LibraryBook
{
    [Key]
    public int BookId { get; set; }

    [Required]
    public string Title { get; set; } = string.Empty;

    [Required]
    public string Author { get; set; } = string.Empty;

    public string Category { get; set; } = "Science";

    public string RackLocation { get; set; } = "Rack S-04";

    public int TotalCopies { get; set; } = 15;

    public int AvailableCopies { get; set; } = 11;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class LibraryIssueRecord
{
    [Key]
    public int IssueId { get; set; }

    public int BookId { get; set; }

    public string BookTitle { get; set; } = string.Empty;

    public string BorrowerName { get; set; } = string.Empty;

    public string BorrowerRole { get; set; } = "Student"; // "Student" or "Staff"

    public int? StudentId { get; set; }

    public int? StaffId { get; set; }

    public DateTime IssueDate { get; set; }

    public DateTime DueDate { get; set; }

    public DateTime? ReturnDate { get; set; }

    public decimal FineAmount { get; set; } = 0;

    public string Status { get; set; } = "Issued"; // "Issued", "Overdue", "Returned"

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
