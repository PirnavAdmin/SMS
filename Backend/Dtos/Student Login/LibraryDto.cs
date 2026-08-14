using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos
{
    public class LibraryBookDto
    {
        [JsonPropertyName("bookId")]
        public int BookId { get; set; }

        [JsonPropertyName("id")]
        public int Id => BookId;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("bookTitle")]
        public string BookTitle => Title;

        [JsonPropertyName("author")]
        public string Author { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Science";

        [JsonPropertyName("rackLocation")]
        public string RackLocation { get; set; } = "Rack S-04";

        [JsonPropertyName("rack")]
        public string Rack => RackLocation;

        [JsonPropertyName("totalCopies")]
        public int TotalCopies { get; set; } = 15;

        [JsonPropertyName("availableCopies")]
        public int AvailableCopies { get; set; } = 11;

        [JsonPropertyName("availabilityText")]
        public string AvailabilityText => $"{AvailableCopies} / {TotalCopies} Copies";

        [JsonPropertyName("displayTitle")]
        public string DisplayTitle => $"{Title} ({AvailableCopies} available)";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateLibraryBookDto
    {
        [Required(ErrorMessage = "Book Title is required.")]
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("bookTitle")]
        public string? BookTitleAlias
        {
            get => Title;
            set { if (!string.IsNullOrWhiteSpace(value)) Title = value; }
        }

        [Required(ErrorMessage = "Author is required.")]
        [JsonPropertyName("author")]
        public string Author { get; set; } = string.Empty;

        [JsonPropertyName("category")]
        public string Category { get; set; } = "Science";

        [JsonPropertyName("rackLocation")]
        public string RackLocation { get; set; } = "Rack S-04";

        [JsonPropertyName("rack")]
        public string? RackAlias
        {
            get => RackLocation;
            set { if (!string.IsNullOrWhiteSpace(value)) RackLocation = value; }
        }

        [JsonPropertyName("totalCopies")]
        [JsonConverter(typeof(FlexibleLongConverter))]
        public int TotalCopies { get; set; } = 10;
    }

    public class AddLibraryBookDto : CreateLibraryBookDto
    {
    }

    public class LibraryIssueRecordDto
    {
        [JsonPropertyName("issueId")]
        public int IssueId { get; set; }

        [JsonPropertyName("id")]
        public int Id => IssueId;

        [JsonPropertyName("bookId")]
        public int BookId { get; set; }

        [JsonPropertyName("bookTitle")]
        public string BookTitle { get; set; } = string.Empty;

        [JsonPropertyName("borrowerRole")]
        public string BorrowerRole { get; set; } = "Student";

        [JsonPropertyName("role")]
        public string Role => BorrowerRole;

        [JsonPropertyName("borrowerIdCode")]
        public string BorrowerIdCode { get; set; } = "STU-001";

        [JsonPropertyName("borrowerId")]
        public string BorrowerId => BorrowerIdCode;

        [JsonPropertyName("borrowerName")]
        public string BorrowerName { get; set; } = string.Empty;

        [JsonPropertyName("fullName")]
        public string FullName => BorrowerName;

        [JsonPropertyName("borrower")]
        public string Borrower
        {
            get => $"{BorrowerName} ({BorrowerRole})";
            set { if (!string.IsNullOrWhiteSpace(value)) BorrowerName = value; }
        }

        [JsonPropertyName("borrowerDisplay")]
        public string BorrowerDisplay => $"{BorrowerName} ({BorrowerRole})";

        [JsonPropertyName("issueDate")]
        public string IssueDate { get; set; } = string.Empty;

        [JsonPropertyName("dueDate")]
        public string DueDate { get; set; } = string.Empty;

        [JsonPropertyName("returnDate")]
        public string? ReturnDate { get; set; }

        [JsonPropertyName("fineAmount")]
        public decimal FineAmount { get; set; } = 0;

        [JsonPropertyName("fine")]
        public string Fine
        {
            get => $"₹{FineAmount:N0}";
            set
            {
                if (!string.IsNullOrWhiteSpace(value) && decimal.TryParse(value.Replace("₹", "").Trim(), out var parsed))
                    FineAmount = parsed;
            }
        }

        [JsonPropertyName("fineString")]
        public string FineString => $"₹{FineAmount:N0}";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Issued";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class IssuedBookRecordDto : LibraryIssueRecordDto
    {
    }

    public class IssueBookDto
    {
        [JsonPropertyName("bookId")]
        public int? BookId { get; set; }

        public int BookIdValue => BookId ?? 1;

        [JsonPropertyName("bookTitle")]
        public string? BookTitle { get; set; }

        [JsonPropertyName("borrowerRole")]
        public string BorrowerRole { get; set; } = "Student";

        [JsonPropertyName("role")]
        public string? RoleAlias
        {
            get => BorrowerRole;
            set { if (!string.IsNullOrWhiteSpace(value)) BorrowerRole = value; }
        }

        [JsonPropertyName("borrowerIdCode")]
        public string BorrowerIdCode { get; set; } = "STU-001";

        [JsonPropertyName("borrowerId")]
        public string? BorrowerIdAlias
        {
            get => BorrowerIdCode;
            set { if (!string.IsNullOrWhiteSpace(value)) BorrowerIdCode = value; }
        }

        [JsonPropertyName("memberId")]
        public int? MemberIdAlias
        {
            get => int.TryParse(BorrowerIdCode, out var i) ? i : null;
            set { if (value.HasValue) BorrowerIdCode = value.ToString(); }
        }

        [JsonPropertyName("memberType")]
        public string? MemberTypeAlias
        {
            get => BorrowerRole;
            set { if (!string.IsNullOrWhiteSpace(value)) BorrowerRole = value; }
        }

        [JsonPropertyName("borrowerName")]
        public string BorrowerName { get; set; } = "Unknown";

        [JsonPropertyName("fullName")]
        public string? FullNameAlias
        {
            get => BorrowerName;
            set { if (!string.IsNullOrWhiteSpace(value)) BorrowerName = value; }
        }

        [JsonPropertyName("dueDate")]
        public string DueDate { get; set; } = "2026-08-15";

        [JsonPropertyName("dueReturnDate")]
        public string? DueReturnDate
        {
            get => DueDate;
            set { if (!string.IsNullOrWhiteSpace(value)) DueDate = value; }
        }
    }

    public class IssueBookRequestDto : IssueBookDto
    {
    }

    public class ReturnBookRequestDto
    {
        [JsonPropertyName("issueId")]
        public int IssueId { get; set; }
    }

    public class LibraryBookDropdownOptionDto
    {
        public int BookId { get; set; }
        public string DisplayText { get; set; } = string.Empty;
    }

    public class LibraryDropdownOptionsDto
    {
        public List<string> AcademicYears { get; set; } = new List<string>();
        public List<LibraryBookDropdownOptionDto> Books { get; set; } = new List<LibraryBookDropdownOptionDto>();
        public List<LibraryBookDropdownOptionDto> AvailableBooks
        {
            get => Books;
            set { if (value != null) Books = value; }
        }
    }
}
