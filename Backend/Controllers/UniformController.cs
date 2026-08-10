using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UniformController : ControllerBase
    {
        private readonly IUniformService _uniformService;

        public UniformController(IUniformService uniformService)
        {
            _uniformService = uniformService;
        }

        // =========================================================
        // 1. DASHBOARD
        // =========================================================

        [HttpGet("dashboard")]
        [HttpGet("dashboard/metrics")]
        public async Task<IActionResult> GetDashboardMetrics()
        {
            var metrics = await _uniformService.GetDashboardMetricsAsync();
            return Ok(new
            {
                success = true,
                message = "Uniform dashboard metrics retrieved successfully.",
                data = metrics
            });
        }

        // =========================================================
        // 2. UNIFORM TYPES (Configuration Tab 1)
        // =========================================================

        [HttpGet("types")]
        [HttpGet("uniform-types")]
        [HttpGet("configurations")]
        public async Task<IActionResult> GetAllUniformTypes(
            [FromQuery] string? search,
            [FromQuery] string? gender)
        {
            var types = await _uniformService.GetAllUniformTypesAsync(search, gender);
            return Ok(new
            {
                success = true,
                message = "Uniform types retrieved successfully.",
                data = types,
                totalCount = types.Count
            });
        }

        [HttpGet("types/{id}")]
        public async Task<IActionResult> GetUniformTypeById(int id)
        {
            var type = await _uniformService.GetUniformTypeByIdAsync(id);
            return Ok(new
            {
                success = true,
                data = type
            });
        }

        [HttpPost("types")]
        [HttpPost("configurations")]
        public async Task<IActionResult> CreateUniformType([FromBody] CreateUniformTypeDto dto)
        {
            var created = await _uniformService.CreateUniformTypeAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Uniform configuration added successfully.",
                data = created
            });
        }

        [HttpPut("types/{id}")]
        [HttpPut("configurations/{id}")]
        public async Task<IActionResult> UpdateUniformType(int id, [FromBody] CreateUniformTypeDto dto)
        {
            var updated = await _uniformService.UpdateUniformTypeAsync(id, dto);
            return Ok(new
            {
                success = true,
                message = "Uniform configuration updated successfully.",
                data = updated
            });
        }

        [HttpPost("types/{id}/stock")]
        [HttpPost("inventory/{id}/stock")]
        [HttpPost("inventory/{id}/adjust")]
        public async Task<IActionResult> AdjustStock(int id, [FromBody] StockAdjustmentDto dto)
        {
            var updated = await _uniformService.AdjustStockAsync(id, dto);
            return Ok(new
            {
                success = true,
                message = "Stock adjusted successfully.",
                data = updated
            });
        }

        [HttpDelete("types/{id}")]
        [HttpDelete("configurations/{id}")]
        public async Task<IActionResult> DeleteUniformType(int id)
        {
            var deleted = await _uniformService.DeleteUniformTypeAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Uniform configuration deleted successfully."
            });
        }

        // =========================================================
        // 3. UNIFORM CATEGORIES (Configuration Tab 2)
        // =========================================================

        [HttpGet("categories")]
        public async Task<IActionResult> GetAllCategories([FromQuery] string? search)
        {
            var categories = await _uniformService.GetAllCategoriesAsync(search);
            return Ok(new
            {
                success = true,
                data = categories,
                totalCount = categories.Count
            });
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateUniformCategoryDto dto)
        {
            var created = await _uniformService.CreateCategoryAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Category added successfully.",
                data = created
            });
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CreateUniformCategoryDto dto)
        {
            var updated = await _uniformService.UpdateCategoryAsync(id, dto);
            return Ok(new
            {
                success = true,
                message = "Category updated successfully.",
                data = updated
            });
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var deleted = await _uniformService.DeleteCategoryAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Category deleted successfully."
            });
        }

        // =========================================================
        // 4. UNIFORM SIZES (Configuration Tab 3)
        // =========================================================

        [HttpGet("sizes")]
        public async Task<IActionResult> GetAllSizes(
            [FromQuery] string? search,
            [FromQuery] string? gender)
        {
            var sizes = await _uniformService.GetAllSizesAsync(search, gender);
            return Ok(new
            {
                success = true,
                data = sizes,
                totalCount = sizes.Count
            });
        }

        [HttpPost("sizes")]
        public async Task<IActionResult> CreateSize([FromBody] CreateUniformSizeDto dto)
        {
            var created = await _uniformService.CreateSizeAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Size configuration added successfully.",
                data = created
            });
        }

        [HttpPut("sizes/{id}")]
        public async Task<IActionResult> UpdateSize(int id, [FromBody] CreateUniformSizeDto dto)
        {
            var updated = await _uniformService.UpdateSizeAsync(id, dto);
            return Ok(new
            {
                success = true,
                message = "Size configuration updated successfully.",
                data = updated
            });
        }

        [HttpDelete("sizes/{id}")]
        public async Task<IActionResult> DeleteSize(int id)
        {
            var deleted = await _uniformService.DeleteSizeAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Size configuration deleted successfully."
            });
        }

        // =========================================================
        // 5. UNIFORM SUPPLIERS (Configuration Tab 4)
        // =========================================================

        [HttpGet("suppliers")]
        public async Task<IActionResult> GetAllSuppliers([FromQuery] string? search)
        {
            var suppliers = await _uniformService.GetAllSuppliersAsync(search);
            return Ok(new
            {
                success = true,
                data = suppliers,
                totalCount = suppliers.Count
            });
        }

        [HttpPost("suppliers")]
        public async Task<IActionResult> CreateSupplier([FromBody] CreateUniformSupplierDto dto)
        {
            var created = await _uniformService.CreateSupplierAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Supplier added successfully.",
                data = created
            });
        }

        [HttpPut("suppliers/{id}")]
        public async Task<IActionResult> UpdateSupplier(int id, [FromBody] CreateUniformSupplierDto dto)
        {
            var updated = await _uniformService.UpdateSupplierAsync(id, dto);
            return Ok(new
            {
                success = true,
                message = "Supplier updated successfully.",
                data = updated
            });
        }

        [HttpDelete("suppliers/{id}")]
        public async Task<IActionResult> DeleteSupplier(int id)
        {
            var deleted = await _uniformService.DeleteSupplierAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Supplier deleted successfully."
            });
        }

        // =========================================================
        // 6. STUDENT UNIFORM DISTRIBUTION
        // =========================================================

        [HttpGet("distributions")]
        public async Task<IActionResult> GetAllDistributions(
            [FromQuery] string? search,
            [FromQuery] int? studentId)
        {
            var distributions = await _uniformService.GetAllDistributionsAsync(search, studentId);
            return Ok(new
            {
                success = true,
                data = distributions,
                totalCount = distributions.Count
            });
        }

        [HttpPost("distributions")]
        public async Task<IActionResult> IssueUniform([FromBody] CreateStudentUniformDistributionDto dto)
        {
            var issued = await _uniformService.IssueUniformAsync(dto);
            return Ok(new
            {
                success = true,
                message = "Uniform issued to student successfully.",
                data = issued
            });
        }

        [HttpDelete("distributions/{id}")]
        public async Task<IActionResult> DeleteDistribution(int id)
        {
            var deleted = await _uniformService.DeleteDistributionAsync(id);
            return Ok(new
            {
                success = deleted,
                message = "Distribution record deleted successfully."
            });
        }

        // =========================================================
        // 7. UNIFORM REPORTS
        // =========================================================

        [HttpGet("reports")]
        public async Task<IActionResult> GetUniformReports([FromQuery] UniformReportFilterDto filter)
        {
            var reports = await _uniformService.GetFilteredReportsAsync(filter);
            return Ok(new
            {
                success = true,
                data = reports,
                totalCount = reports.Count
            });
        }

        [HttpGet("reports/print")]
        public async Task<IActionResult> PrintUniformReport([FromQuery] UniformReportFilterDto filter)
        {
            var reports = await _uniformService.GetFilteredReportsAsync(filter);
            string title = filter.ReportType ?? "Uniform Stock & Sales Report";

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("<!DOCTYPE html><html><head><meta charset='utf-8'><title>" + title + "</title>");
            sb.AppendLine("<style>");
            sb.AppendLine("body { font-family: 'Segoe UI', Arial, sans-serif; margin: 20px; color: #1e293b; }");
            sb.AppendLine("h1 { color: #0284c7; text-align: center; margin-bottom: 5px; }");
            sb.AppendLine("p.sub { text-align: center; color: #64748b; font-size: 14px; margin-top: 0; margin-bottom: 25px; }");
            sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 15px; }");
            sb.AppendLine("th { background-color: #0284c7; color: white; padding: 10px; font-size: 12px; text-transform: uppercase; text-align: left; }");
            sb.AppendLine("td { padding: 10px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }");
            sb.AppendLine("tr:nth-child(even) { background-color: #f8fafc; }");
            sb.AppendLine("</style></head><body>");
            sb.AppendLine($"<h1>{title}</h1>");
            sb.AppendLine($"<p class='sub'>Generated on {DateTime.Now:yyyy-MM-dd HH:mm:ss} | Pirnav Schools Uniform Management</p>");
            sb.AppendLine("<table><thead><tr><th>Item Name</th><th>Gender</th><th>Size</th><th>Color</th><th>Unit Price</th><th>Available Stock</th><th>Issued Units</th><th>Status</th></tr></thead><tbody>");

            foreach (var item in reports)
            {
                sb.AppendLine($"<tr><td>{item.ItemName}</td><td>{item.Gender}</td><td>{item.Size}</td><td>{item.Color}</td><td>₹{item.UnitPrice:N0}</td><td>{item.AvailableStock} Units</td><td>{item.IssuedUnits}</td><td>{item.Status}</td></tr>");
            }

            sb.AppendLine("</tbody></table>");
            sb.AppendLine("<script>window.onload = function() { window.print(); };</script>");
            sb.AppendLine("</body></html>");

            return Content(sb.ToString(), "text/html");
        }

        [HttpGet("reports/export/pdf")]
        public async Task<IActionResult> ExportUniformReportPdf([FromQuery] UniformReportFilterDto filter)
        {
            var reports = await _uniformService.GetFilteredReportsAsync(filter);
            var jsonBytes = System.Text.Encoding.UTF8.GetBytes(System.Text.Json.JsonSerializer.Serialize(reports));
            return File(jsonBytes, "application/pdf", $"Uniform_Report_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");
        }

        [HttpGet("reports/download")]
        public async Task<IActionResult> DownloadUniformReportCsv([FromQuery] UniformReportFilterDto filter)
        {
            var reports = await _uniformService.GetFilteredReportsAsync(filter);
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("ItemName,Gender,Size,Color,UnitPrice,AvailableStock,IssuedUnits,Status");

            foreach (var r in reports)
            {
                sb.AppendLine($"\"{r.ItemName}\",\"{r.Gender}\",\"{r.Size}\",\"{r.Color}\",{r.UnitPrice},{r.AvailableStock},{r.IssuedUnits},\"{r.Status}\"");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"Uniform_Report_{DateTime.Now:yyyyMMdd}.csv");
        }
    }
}
