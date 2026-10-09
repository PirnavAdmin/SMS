namespace SMS.Api.Services.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class LibraryService : ILibraryService
{
    private readonly AppDbContext _context;

    public LibraryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<LibraryDropdownOptionsDto> GetLibraryDropdownOptionsAsync()
    {
        var inventory = await GetBookInventoryAsync(null, null);
        var academicYears = await _context.AcademicYears
            .AsNoTracking()
            .OrderByDescending(a => a.AcademicYearName)
            .Select(a => a.AcademicYearName)
            .ToListAsync();

        return new LibraryDropdownOptionsDto
        {
            AcademicYears = academicYears,
            AvailableBooks = inventory.Select(b => new LibraryBookDropdownOptionDto
            {
                BookId = b.BookId,
                DisplayText = $"{b.Title} ({b.AvailableCopies} available)"
            }).ToList()
        };
    }

    public async Task<List<LibraryBookDto>> GetBookInventoryAsync(string? search, string? category)
    {
        List<LibraryBook> books = new List<LibraryBook>();

        try
        {
            books = await _context.LibraryBooks.AsNoTracking().ToListAsync();
        }
        catch
        {
            // Fallback if DB is offline
        }

        if (!books.Any())
        {
            return new List<LibraryBookDto>();
        }

        var query = books.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(b => b.Title.Contains(search, StringComparison.OrdinalIgnoreCase) || b.Author.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(b => b.Category.Equals(category, StringComparison.OrdinalIgnoreCase));
        }

        return query.Select(b => new LibraryBookDto
        {
            BookId = b.BookId,
            Title = b.Title,
            Author = b.Author,
            Category = b.Category,
            RackLocation = b.RackLocation,
            TotalCopies = b.TotalCopies,
            AvailableCopies = b.AvailableCopies
        }).ToList();
    }

    public async Task<List<IssuedBookRecordDto>> GetIssuedBooksAsync(string? search, string? status)
    {
        List<LibraryIssueRecord> records = new List<LibraryIssueRecord>();

        try
        {
            records = await _context.LibraryIssueRecords.AsNoTracking().ToListAsync();
        }
        catch
        {
            // Fallback if DB is offline
        }

        if (!records.Any())
        {
            return new List<IssuedBookRecordDto>();
        }

        var query = records.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(r => r.BookTitle.Contains(search, StringComparison.OrdinalIgnoreCase) || r.BorrowerName.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(r => r.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        return query.Select(r => new IssuedBookRecordDto
        {
            IssueId = r.IssueId,
            BookId = r.BookId,
            BookTitle = r.BookTitle,
            Borrower = $"{r.BorrowerName} ({r.BorrowerRole})",
            BorrowerName = r.BorrowerName,
            BorrowerRole = r.BorrowerRole,
            IssueDate = r.IssueDate.ToString("yyyy-MM-dd"),
            DueDate = r.DueDate.ToString("yyyy-MM-dd"),
            FineAmount = r.FineAmount,
            Fine = $"₹{r.FineAmount:N0}",
            Status = r.Status
        }).ToList();
    }

    public async Task<LibraryBookDto> AddBookAsync(AddLibraryBookDto dto)
    {
        var book = new LibraryBook
        {
            Title = dto.Title,
            Author = dto.Author,
            Category = dto.Category ?? string.Empty,
            RackLocation = dto.RackLocation ?? string.Empty,
            TotalCopies = dto.TotalCopies > 0 ? dto.TotalCopies : 1,
            AvailableCopies = dto.TotalCopies > 0 ? dto.TotalCopies : 1,
            CreatedAt = DateTime.UtcNow
        };

        await _context.LibraryBooks.AddAsync(book);
        await _context.SaveChangesAsync();

        return new LibraryBookDto
        {
            BookId = book.BookId,
            Title = book.Title,
            Author = book.Author,
            Category = book.Category,
            RackLocation = book.RackLocation,
            TotalCopies = book.TotalCopies,
            AvailableCopies = book.AvailableCopies
        };
    }

    public async Task<IssuedBookRecordDto> IssueBookAsync(IssueBookRequestDto dto)
    {
        int bId = dto.BookId ?? 0;
        var book = bId > 0 ? await _context.LibraryBooks.FindAsync(bId) : null;
        string bookTitle = book?.Title ?? string.Empty;

        if (book != null && book.AvailableCopies > 0)
        {
            book.AvailableCopies -= 1;
        }

        DateTime issueDate = DateTime.UtcNow;
        DateTime dueDate = DateTime.TryParse(dto.DueReturnDate, out var d) ? d : issueDate.AddDays(14);

        var issueRecord = new LibraryIssueRecord
        {
            BookId = bId,
            BookTitle = bookTitle,
            BorrowerName = dto.BorrowerName ?? string.Empty,
            BorrowerRole = dto.BorrowerRole ?? string.Empty,
            IssueDate = issueDate,
            DueDate = dueDate,
            FineAmount = 0,
            Status = "Issued",
            CreatedAt = DateTime.UtcNow
        };

        await _context.LibraryIssueRecords.AddAsync(issueRecord);
        await _context.SaveChangesAsync();

        return new IssuedBookRecordDto
        {
            IssueId = issueRecord.IssueId,
            BookId = issueRecord.BookId,
            BookTitle = issueRecord.BookTitle,
            Borrower = $"{issueRecord.BorrowerName} ({issueRecord.BorrowerRole})",
            BorrowerName = issueRecord.BorrowerName,
            BorrowerRole = issueRecord.BorrowerRole,
            IssueDate = issueRecord.IssueDate.ToString("yyyy-MM-dd"),
            DueDate = issueRecord.DueDate.ToString("yyyy-MM-dd"),
            FineAmount = 0,
            Fine = "₹0",
            Status = "Issued"
        };
    }

    public async Task<bool> ReturnBookAsync(ReturnBookRequestDto dto)
    {
        var record = await _context.LibraryIssueRecords.FindAsync(dto.IssueId);
        if (record != null)
        {
            record.Status = "Returned";
            record.ReturnDate = DateTime.UtcNow;

            var book = await _context.LibraryBooks.FindAsync(record.BookId);
            if (book != null)
            {
                book.AvailableCopies += 1;
            }

            await _context.SaveChangesAsync();
        }
        return true;
    }
}
