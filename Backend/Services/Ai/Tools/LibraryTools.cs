using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using SMS.Api.Dtos;
using SMS.Api.Services.Ai.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Ai.Tools
{
    public class LibraryCatalogTool : IAiTool
    {
        private readonly ILibraryService _libraryService;

        public LibraryCatalogTool(ILibraryService libraryService)
        {
            _libraryService = libraryService;
        }

        public string Name => "library_search_catalog";
        public string Description => "Searches the school library book inventory, checks availability of copies, rack locations, and tracks issued/overdue books.";
        public string ParametersJsonSchema => @"
        {
            ""type"": ""object"",
            ""properties"": {
                ""search"": { ""type"": ""string"", ""description"": ""Title, author, category, or borrower name"" },
                ""category"": { ""type"": ""string"", ""description"": ""Book category/genre"" },
                ""checkIssuedOnly"": { ""type"": ""boolean"", ""description"": ""True to check currently issued and overdue books"" }
            }
        }";

        public string[] AllowedRoles => new[] { "Admin", "SuperAdmin", "Super Admin", "Principal", "Librarian", "Teacher", "Student", "Parent", "Staff" };

        public async Task<AiToolResult> ExecuteAsync(AiToolContext context, JsonElement arguments)
        {
            var search = arguments.TryGetProperty("search", out var sElem) ? sElem.GetString()?.Trim() : null;
            var category = arguments.TryGetProperty("category", out var cElem) ? cElem.GetString()?.Trim() : null;
            bool checkIssued = arguments.TryGetProperty("checkIssuedOnly", out var iElem) && iElem.GetBoolean();

            if (checkIssued)
            {
                var issued = await _libraryService.GetIssuedBooksAsync(search, null);
                if (issued == null || issued.Count == 0)
                {
                    return AiToolResult.Ok("No issued books currently found matching query.");
                }

                var issuedRows = issued.Select(b =>
                {
                    DateTime.TryParse(b.DueDate, out var parsedDue);
                    var isOverdue = parsedDue != default && parsedDue < DateTime.Today && (b.Status ?? "").ToUpper() == "ISSUED";
                    return new
                    {
                        BookTitle = b.BookTitle,
                        BorrowerName = b.BorrowerName,
                        BorrowerRole = b.BorrowerRole,
                        IssueDate = b.IssueDate,
                        DueDate = b.DueDate,
                        Status = b.Status,
                        OverdueDays = isOverdue ? (DateTime.Today - parsedDue).Days : 0
                    };
                }).ToList();

                int overdueCount = issuedRows.Count(x => x.OverdueDays > 0);
                string summary = $"Found {issued.Count} issued book record(s), with {overdueCount} overdue item(s).";
                return AiToolResult.Ok(summary, issuedRows, "table", new
                {
                    title = "Library Issued & Overdue Books Log",
                    columns = new[] { "BookTitle", "BorrowerName", "BorrowerRole", "IssueDate", "DueDate", "Status", "OverdueDays" },
                    rows = issuedRows
                });
            }

            var books = await _libraryService.GetBookInventoryAsync(search, category);
            if (books == null || books.Count == 0)
            {
                return AiToolResult.Ok($"No books found in the library matching '{search ?? category}'.");
            }

            var rows = books.Select(b => new
            {
                Title = b.BookTitle,
                Author = b.Author,
                Category = b.Category,
                TotalCopies = b.TotalCopies,
                AvailableCopies = b.AvailableCopies,
                Status = b.AvailableCopies > 0 ? "AVAILABLE" : "OUT OF STOCK",
                ShelfLocation = !string.IsNullOrWhiteSpace(b.RackLocation) ? b.RackLocation : "General Stacks"
            }).ToList();

            int totalAvail = rows.Sum(r => r.AvailableCopies);
            string invSummary = $"Found {books.Count} book title(s) in catalog. Total available copies: {totalAvail}.";

            return AiToolResult.Ok(invSummary, rows, "table", new
            {
                title = "Library Book Inventory",
                columns = new[] { "Title", "Author", "Category", "TotalCopies", "AvailableCopies", "Status", "ShelfLocation" },
                rows = rows.Take(30).ToList()
            });
        }
    }
}
