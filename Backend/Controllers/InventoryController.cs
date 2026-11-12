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
[Route("api/[controller]")]
[Authorize]
[Tags("Inventory Management")]
public class InventoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public InventoryController(AppDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // 1. DROPDOWN CATEGORIES & LOCATIONS
    // =========================================================

    [HttpGet("categories")]
    public IActionResult GetInventoryCategories()
    {
        var categories = new List<string>
        {
            "All Categories",
            "Lab Equipment",
            "Stationery",
            "Sports Equipment",
            "Furniture",
            "Electronics & IT",
            "Library & Books"
        };

        var locations = new List<string>
        {
            "Computer Lab 1",
            "Main Store",
            "Science Lab",
            "Sports Complex",
            "Library Store"
        };

        var statuses = new List<string>
        {
            "All Statuses",
            "In Stock",
            "Low Stock",
            "Out of Stock"
        };

        return Ok(new
        {
            success = true,
            data = new
            {
                categories,
                locations,
                statuses
            }
        });
    }

    // =========================================================
    // 2. GET INVENTORY ITEMS (PAGINATED & FILTERED)
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetAllInventoryItems(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        List<InventoryItemDto> items = new List<InventoryItemDto>();

        try
        {
            var query = _context.InventoryItems.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.ToLower().Trim();
                query = query.Where(i => i.ItemName.ToLower().Contains(s) ||
                                         (i.Category != null && i.Category.ToLower().Contains(s)) ||
                                         (i.Location != null && i.Location.ToLower().Contains(s)));
            }

            if (!string.IsNullOrWhiteSpace(category) && !category.Equals("All Categories", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(i => i.Category != null && i.Category.ToLower() == category.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(status) && !status.Equals("All Statuses", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(i => i.Status != null && i.Status.ToLower() == status.ToLower());
            }

            var list = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();

            if (list.Any())
            {
                items = list.Select(MapToDto).ToList();
            }
        }
        catch
        {
            // Database query fallback
        }

        // Do not seed fallback mock inventory list. Everything should come from the database.

        int totalCount = items.Count;
        int currentPage = page > 0 ? page : 1;
        int currentSize = pageSize > 0 ? pageSize : 10;

        var pagedData = items
            .Skip((currentPage - 1) * currentSize)
            .Take(currentSize)
            .ToList();

        return Ok(new
        {
            success = true,
            message = "Inventory items retrieved successfully.",
            totalCount = totalCount,
            totalEntries = totalCount,
            page = currentPage,
            pageSize = currentSize,
            totalPages = (int)Math.Ceiling((double)totalCount / currentSize),
            data = pagedData
        });
    }

    // =========================================================
    // 3. GET SINGLE INVENTORY ITEM BY ID
    // =========================================================

    [HttpGet("{id}")]
    public async Task<IActionResult> GetInventoryItemById(int id)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { success = false, message = $"Inventory asset '{id}' not found." });
        }

        return Ok(new { success = true, data = MapToDto(item) });
    }

    private static string? ValidateInventoryInput(CreateInventoryItemDto? dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.ItemName))
            return "Item name is required.";
        if (dto.ItemName.Trim().Length > 120)
            return "Item name cannot exceed 120 characters.";
        if (dto.Quantity < 0 || dto.Quantity > 1_000_000)
            return "Quantity must be between 0 and 1,000,000.";
        if (dto.UnitPrice <= 0m || dto.UnitPrice > 100_000_000m)
            return "Unit price must be greater than 0 and cannot exceed 100,000,000.";
        return null;
    }

    // =========================================================
    // 4. CREATE INVENTORY ASSET (POST)
    // =========================================================

    [HttpPost]
    public async Task<IActionResult> CreateInventoryItem([FromBody] CreateInventoryItemDto dto)
    {
        var validationError = ValidateInventoryInput(dto);
        if (validationError != null)
        {
            return BadRequest(new { success = false, message = validationError });
        }

        int qty = dto.Quantity;
        decimal price = dto.UnitPrice;
        string status = qty == 0 ? "Out of Stock" : (qty <= 5 ? "Low Stock" : (string.IsNullOrWhiteSpace(dto.Status) ? "In Stock" : dto.Status.Trim()));

        var item = new InventoryItem
        {
            ItemName = dto.ItemName.Trim(),
            Category = !string.IsNullOrWhiteSpace(dto.Category) ? dto.Category.Trim() : "Lab Equipment",
            Quantity = qty,
            UnitPrice = price,
            Location = !string.IsNullOrWhiteSpace(dto.Location) ? dto.Location.Trim() : "Main Store",
            Status = status,
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryItems.Add(item);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Inventory asset added successfully.",
            data = MapToDto(item)
        });
    }

    // =========================================================
    // 5. UPDATE INVENTORY ASSET (PUT)
    // =========================================================

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateInventoryItem(int id, [FromBody] CreateInventoryItemDto dto)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { success = false, message = $"Inventory asset '{id}' not found." });
        }

        var validationError = ValidateInventoryInput(dto);
        if (validationError != null)
        {
            return BadRequest(new { success = false, message = validationError });
        }

        item.ItemName = dto.ItemName.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Category)) item.Category = dto.Category.Trim();
        item.Quantity = dto.Quantity;
        item.UnitPrice = dto.UnitPrice;
        if (!string.IsNullOrWhiteSpace(dto.Location)) item.Location = dto.Location.Trim();
        if (!string.IsNullOrWhiteSpace(dto.Status)) item.Status = dto.Status.Trim();
        else item.Status = item.Quantity == 0 ? "Out of Stock" : (item.Quantity <= 5 ? "Low Stock" : "In Stock");

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Inventory asset updated successfully.", data = MapToDto(item) });
    }

    // =========================================================
    // 6. DELETE INVENTORY ASSET (DELETE)
    // =========================================================

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteInventoryItem(int id)
    {
        var item = await _context.InventoryItems.FindAsync(id);
        if (item == null)
        {
            return NotFound(new { success = false, message = $"Inventory asset '{id}' not found." });
        }

        _context.InventoryItems.Remove(item);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Inventory asset deleted successfully."
        });
    }

    // --- MAPPER HELPER ---
    private static InventoryItemDto MapToDto(InventoryItem i) => new()
    {
        InventoryItemId = i.InventoryItemId,
        ItemName = i.ItemName ?? "",
        Category = i.Category ?? "Lab Equipment",
        Quantity = i.Quantity,
        UnitPrice = i.UnitPrice,
        Location = i.Location ?? "Computer Lab 1",
        Status = i.Status ?? "In Stock",
        CreatedAt = i.CreatedAt
    };
}
