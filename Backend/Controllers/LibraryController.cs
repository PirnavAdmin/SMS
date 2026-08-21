namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

[ApiController]
[Route("api/library")]
[AllowAnonymous]
[Tags("Digital Library Catalog & Circulation Desk")]
public class LibraryController : ControllerBase
{
    private readonly AppDbContext _context;

    public LibraryController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // ROLE CHECK HELPER: READ-ONLY FOR ADMIN
    // =========================================================
    private bool IsAdminUser()
    {
        string? role = User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value
                       ?? Request.Headers["X-User-Role"].FirstOrDefault()
                       ?? Request.Headers["User-Role"].FirstOrDefault();

        if (string.IsNullOrWhiteSpace(role)) return false;

        return role.Equals("Admin", StringComparison.OrdinalIgnoreCase) || role.Equals("Administrator", StringComparison.OrdinalIgnoreCase);
    }

    private IActionResult? CheckAdminReadOnly()
    {
        if (IsAdminUser())
        {
            return StatusCode(403, new
            {
                success = false,
                message = "Administrator is in Read-Only Mode (View Purpose Only). Only Librarians can modify inventory and manage book circulation."
            });
        }
        return null;
    }

    // =========================================================
    // 1. DROPDOWN OPTIONS & LOOKUPS
    // =========================================================

    [HttpGet("options")]
    public async Task<IActionResult> GetLibraryOptions()
    {
        var roles = new List<string> { "Student", "Staff", "Teacher" };
        var categories = new List<string> { "All", "Science", "Mathematics", "Computer Science", "Literature & Fiction", "History & Civics", "General Knowledge" };
        var statuses = new List<string> { "All", "Issued", "Overdue", "Returned" };

        var books = await _context.LibraryBooks.AsNoTracking().Where(b => b.AvailableCopies > 0).ToListAsync();
        if (!books.Any())
        {
            await SeedDefaultLibraryDataAsync();
            books = await _context.LibraryBooks.AsNoTracking().Where(b => b.AvailableCopies > 0).ToListAsync();
        }

        var booksDropdown = books.Select(b => new
        {
            bookId = b.BookId,
            id = b.BookId,
            title = b.Title,
            availableCopies = b.AvailableCopies,
            displayText = $"{b.Title} ({b.AvailableCopies} available)"
        }).ToList();

        return Ok(new
        {
            success = true,
            data = new
            {
                roles,
                categories,
                statuses,
                books = booksDropdown
            }
        });
    }

    // =========================================================
    // 2. BOOKS CATALOG (PAGINATED & FILTERED)
    // =========================================================

    [HttpGet("inventory")]
    [HttpGet("books")]
    public async Task<IActionResult> GetBookInventory(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.LibraryBooks.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase) && !category.Equals("All Categories", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(b => b.Category != null && b.Category.ToLower().Contains(category.ToLower()));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            query = query.Where(b => b.Title.ToLower().Contains(s) || b.Author.ToLower().Contains(s) || (b.RackLocation != null && b.RackLocation.ToLower().Contains(s)));
        }

        var list = await query.OrderByDescending(b => b.CreatedAt).ToListAsync();

        if (!list.Any() && string.IsNullOrWhiteSpace(search) && (string.IsNullOrWhiteSpace(category) || category.Equals("All", StringComparison.OrdinalIgnoreCase) || category.Equals("All Categories", StringComparison.OrdinalIgnoreCase)))
        {
            await SeedDefaultLibraryDataAsync();
            list = await _context.LibraryBooks.AsNoTracking().OrderByDescending(b => b.CreatedAt).ToListAsync();
        }

        var dtos = list.Select(MapBookToDto).ToList();

        int totalCount = dtos.Count;
        int currentPage = page > 0 ? page : 1;
        int currentSize = pageSize > 0 ? pageSize : 10;

        var pagedData = dtos.Skip((currentPage - 1) * currentSize).Take(currentSize).ToList();

        return Ok(new
        {
            success = true,
            message = "Book inventory retrieved successfully.",
            totalCount,
            totalEntries = totalCount,
            page = currentPage,
            pageSize = currentSize,
            totalPages = (int)Math.Ceiling((double)totalCount / currentSize),
            data = pagedData
        });
    }

    [HttpGet("books/{id:int}")]
    public async Task<IActionResult> GetBookById(int id)
    {
        var b = await _context.LibraryBooks.FindAsync(id);
        if (b == null) return NotFound(new { success = false, message = "Book not found." });

        return Ok(new { success = true, data = MapBookToDto(b) });
    }

    [HttpPost("books")]
    public async Task<IActionResult> CreateBook([FromBody] CreateLibraryBookDto dto)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Author))
        {
            return BadRequest(new { success = false, message = "Book Title and Author are required." });
        }

        int copies = dto.TotalCopies > 0 ? dto.TotalCopies : 10;

        var entity = new LibraryBook
        {
            Title = dto.Title.Trim(),
            Author = dto.Author.Trim(),
            Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim() : "Science",
            RackLocation = !string.IsNullOrWhiteSpace(dto.RackLocation) ? dto.RackLocation.Trim() : "Rack S-05",
            TotalCopies = copies,
            AvailableCopies = copies,
            CreatedAt = DateTime.UtcNow
        };

        await _context.LibraryBooks.AddAsync(entity);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Book registered in library catalog successfully.",
            data = MapBookToDto(entity)
        });
    }

    [HttpPut("books/{id:int}")]
    public async Task<IActionResult> UpdateBook(int id, [FromBody] CreateLibraryBookDto dto)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        var b = await _context.LibraryBooks.FindAsync(id);
        if (b == null) return NotFound(new { success = false, message = "Book not found." });

        if (!string.IsNullOrWhiteSpace(dto.Title)) b.Title = dto.Title.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Author)) b.Author = dto.Author.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Category)) b.Category = dto.Category.Trim();
        if (!string.IsNullOrWhiteSpace(dto.RackLocation)) b.RackLocation = dto.RackLocation.Trim();
        if (dto.TotalCopies > 0)
        {
            int diff = dto.TotalCopies - b.TotalCopies;
            b.TotalCopies = dto.TotalCopies;
            b.AvailableCopies = Math.Max(0, b.AvailableCopies + diff);
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Book updated successfully in database.", data = MapBookToDto(b) });
    }

    [HttpDelete("books/{id:int}")]
    public async Task<IActionResult> DeleteBook(int id)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        var b = await _context.LibraryBooks.FindAsync(id);
        if (b != null)
        {
            _context.LibraryBooks.Remove(b);
            await _context.SaveChangesAsync();
        }

        return Ok(new { success = true, message = "Book removed from catalog successfully." });
    }

    // =========================================================
    // 3. CATEGORIES, AUTHORS & RACKS MASTERS
    // =========================================================

    [HttpGet("categories")]
    public IActionResult GetCategoriesMaster()
    {
        var categories = new List<object>
        {
            new { id = "SCI", code = "SCI", name = "Science & Physics", count = 45, description = "Physics, Chemistry & Biology textbooks" },
            new { id = "MATH", code = "MATH", name = "Mathematics", count = 30, description = "Algebra, Geometry & Calculus reference books" },
            new { id = "CS", code = "CS", name = "Computer Science", count = 25, description = "Programming, Data Structures & AI guides" },
            new { id = "LIT", code = "LIT", name = "Literature & Fiction", count = 40, description = "Classic & Modern English Literature" },
            new { id = "HIS", code = "HIS", name = "History & Civics", count = 20, description = "World History & Indian Constitution" }
        };

        return Ok(new { success = true, data = categories });
    }

    [HttpGet("authors")]
    public IActionResult GetAuthorsDirectory()
    {
        var authors = new List<object>
        {
            new { id = 1, name = "Halliday & Resnick", publisher = "Wiley India", biography = "Renowned physicists and educators", titlesPublished = 15 },
            new { id = 2, name = "R.D. Sharma", publisher = "Dhanpat Rai Publications", biography = "Prominent Mathematics author", titlesPublished = 20 },
            new { id = 3, name = "E. Balagurusamy", publisher = "McGraw Hill", biography = "Computer Science & Programming pioneer", titlesPublished = 12 },
            new { id = 4, name = "William Shakespeare", publisher = "Penguin Classics", biography = "English playwright and poet", titlesPublished = 18 }
        };

        return Ok(new { success = true, data = authors });
    }

    [HttpGet("racks")]
    public IActionResult GetRacksLocations()
    {
        var racks = new List<object>
        {
            new { rack = "Rack A-01", shelf = "Shelf 1", location = "Science Wing, 1st Floor", capacity = 50, occupied = 32 },
            new { rack = "Rack A-01", shelf = "Shelf 2", location = "Science Wing, 1st Floor", capacity = 50, occupied = 18 },
            new { rack = "Rack A-01", shelf = "Shelf 3", location = "Science Wing, 1st Floor", capacity = 50, occupied = 10 },
            new { rack = "Rack B-02", shelf = "Shelf 1", location = "Maths Wing, 1st Floor", capacity = 40, occupied = 25 },
            new { rack = "Rack B-02", shelf = "Shelf 2", location = "Maths Wing, 1st Floor", capacity = 40, occupied = 15 },
            new { rack = "Rack C-03", shelf = "Shelf 1", location = "CS & Tech Lab, 2nd Floor", capacity = 45, occupied = 20 },
            new { rack = "Rack C-03", shelf = "Shelf 2", location = "CS & Tech Lab, 2nd Floor", capacity = 45, occupied = 8 }
        };

        return Ok(new { success = true, data = racks });
    }

    [HttpGet("members")]
    public async Task<IActionResult> GetLibraryMembers()
    {
        var members = new List<object>
        {
            new { memberId = "STU-001", name = "Alexander Wright", role = "Student", classOrDept = "Class 10-A", activeIssues = 1, finePending = 50 },
            new { memberId = "STF-101", name = "Rajesh Sharma", role = "Staff", classOrDept = "Academics", activeIssues = 0, finePending = 0 }
        };

        return Ok(new { success = true, data = members });
    }

    // =========================================================
    // 4. ISSUED BOOKS & OVERDUES (CIRCULATION DESK)
    // =========================================================

    [HttpGet("issued")]
    [HttpGet("issued-books")]
    public async Task<IActionResult> GetIssuedBooks(
        [FromQuery] string? search,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        var query = _context.LibraryIssueRecords.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.Status != null && r.Status.ToLower() == status.ToLower());
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            string s = search.ToLower().Trim();
            query = query.Where(r => r.BookTitle.ToLower().Contains(s) || r.BorrowerName.ToLower().Contains(s) || r.BorrowerIdCode.ToLower().Contains(s));
        }

        var list = await query.OrderByDescending(r => r.IssueDate).ToListAsync();

        if (!list.Any() && string.IsNullOrWhiteSpace(search) && (string.IsNullOrWhiteSpace(status) || status.Equals("All", StringComparison.OrdinalIgnoreCase)))
        {
            await SeedDefaultLibraryDataAsync();
            list = await _context.LibraryIssueRecords.AsNoTracking().OrderByDescending(r => r.IssueDate).ToListAsync();
        }

        var dtos = list.Select(MapIssueRecordToDto).ToList();

        int totalCount = dtos.Count;
        int currentPage = page > 0 ? page : 1;
        int currentSize = pageSize > 0 ? pageSize : 10;

        var pagedData = dtos.Skip((currentPage - 1) * currentSize).Take(currentSize).ToList();

        return Ok(new
        {
            success = true,
            message = "Issued books retrieved successfully.",
            totalCount,
            totalEntries = totalCount,
            page = currentPage,
            pageSize = currentSize,
            totalPages = (int)Math.Ceiling((double)totalCount / currentSize),
            data = pagedData
        });
    }

    [HttpPost("issue")]
    [HttpPost("issued-books")]
    public async Task<IActionResult> IssueBook([FromBody] IssueBookDto dto)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        string bTitle = !string.IsNullOrWhiteSpace(dto.BookTitle) ? dto.BookTitle.Trim() : "Fundamentals of Physics";
        int bId = dto.BookId.HasValue && dto.BookId.Value > 0 ? dto.BookId.Value : 1;

        DateTime iDate = DateTime.UtcNow;
        DateTime dDate = DateTime.UtcNow.AddDays(14);
        if (!string.IsNullOrWhiteSpace(dto.DueDate) && DateTime.TryParse(dto.DueDate, out var parsedDue))
        {
            dDate = parsedDue;
        }

        var entity = new LibraryIssueRecord
        {
            BookId = bId,
            BookTitle = bTitle,
            BorrowerRole = !string.IsNullOrWhiteSpace(dto.BorrowerRole) ? dto.BorrowerRole.Trim() : "Student",
            BorrowerIdCode = !string.IsNullOrWhiteSpace(dto.BorrowerIdCode) ? dto.BorrowerIdCode.Trim() : "STU-001",
            BorrowerName = !string.IsNullOrWhiteSpace(dto.BorrowerName) ? dto.BorrowerName.Trim() : "Alexander Wright",
            IssueDate = iDate,
            DueDate = dDate,
            FineAmount = 0,
            Status = "Issued",
            CreatedAt = DateTime.UtcNow
        };

        await _context.LibraryIssueRecords.AddAsync(entity);

        var book = await _context.LibraryBooks.FindAsync(bId);
        if (book != null && book.AvailableCopies > 0)
        {
            book.AvailableCopies -= 1;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Book issued successfully by Librarian.",
            data = MapIssueRecordToDto(entity)
        });
    }

    [HttpPost("issued-books/{id:int}/return")]
    [HttpPut("issued-books/{id:int}/return")]
    public async Task<IActionResult> ReturnBook(int id)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        var record = await _context.LibraryIssueRecords.FindAsync(id);
        if (record == null) return NotFound(new { success = false, message = "Issue record not found." });

        record.Status = "Returned";
        record.ReturnDate = DateTime.UtcNow;

        var book = await _context.LibraryBooks.FindAsync(record.BookId);
        if (book != null)
        {
            book.AvailableCopies = Math.Min(book.TotalCopies, book.AvailableCopies + 1);
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Book returned successfully to inventory.", data = MapIssueRecordToDto(record) });
    }

    [HttpPost("issued-books/{id:int}/renew")]
    public async Task<IActionResult> RenewBook(int id, [FromBody] dynamic? body)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        var record = await _context.LibraryIssueRecords.FindAsync(id);
        if (record == null) return NotFound(new { success = false, message = "Issue record not found." });

        record.DueDate = record.DueDate.AddDays(14);
        record.Status = "Issued";

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Book issue extended by 14 days.", data = MapIssueRecordToDto(record) });
    }

    // =========================================================
    // 5. FINES & MANAGEMENT
    // =========================================================

    [HttpGet("fines")]
    public IActionResult GetFinesManagement()
    {
        var fines = new List<object>
        {
            new { fineId = 1, borrowerName = "Alexander Wright", borrowerRole = "Student", bookTitle = "Fundamentals of Physics", overdueDays = 5, fineAmount = 50, status = "Pending" }
        };

        return Ok(new
        {
            success = true,
            totalCollected = 25,
            totalPending = 50,
            data = fines
        });
    }

    [HttpPost("fines/{id:int}/collect")]
    public async Task<IActionResult> CollectFine(int id)
    {
        var readOnlyCheck = CheckAdminReadOnly();
        if (readOnlyCheck != null) return readOnlyCheck;

        return Ok(new { success = true, message = "Fine collected and receipt generated by Librarian." });
    }

    // =========================================================
    // SEEDER HELPER
    // =========================================================

    private async Task SeedDefaultLibraryDataAsync()
    {
        // Do not seed default library data. Everything should come from the database.
        await Task.CompletedTask;
    }

    // --- MAPPER HELPERS ---
    private static LibraryBookDto MapBookToDto(LibraryBook b) => new()
    {
        BookId = b.BookId,
        Title = b.Title ?? "",
        Author = b.Author ?? "",
        Category = b.Category ?? "Science",
        RackLocation = b.RackLocation ?? "Rack S-04",
        TotalCopies = b.TotalCopies,
        AvailableCopies = b.AvailableCopies,
        CreatedAt = b.CreatedAt
    };

    private static LibraryIssueRecordDto MapIssueRecordToDto(LibraryIssueRecord r) => new()
    {
        IssueId = r.IssueId,
        BookId = r.BookId,
        BookTitle = r.BookTitle ?? "",
        BorrowerRole = r.BorrowerRole ?? "Student",
        BorrowerIdCode = r.BorrowerIdCode ?? "STU-001",
        BorrowerName = r.BorrowerName ?? "",
        IssueDate = r.IssueDate.ToString("yyyy-MM-dd"),
        DueDate = r.DueDate.ToString("yyyy-MM-dd"),
        ReturnDate = r.ReturnDate.HasValue ? r.ReturnDate.Value.ToString("yyyy-MM-dd") : null,
        FineAmount = r.FineAmount,
        Status = r.Status ?? "Issued",
        CreatedAt = r.CreatedAt
    };
}
