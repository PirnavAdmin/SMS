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
        [HttpGet("inventory")]
        public async Task<IActionResult> GetAllUniformTypes(
            [FromQuery] string? search,
            [FromQuery] string? gender,
            [FromQuery] string? category,
            [FromQuery] string? size,
            [FromQuery] string? status)
        {
            var types = await _uniformService.GetAllUniformTypesAsync(search, gender, category, size, status);
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

        [HttpGet("categories/{id}")]
        public async Task<IActionResult> GetCategoryById(int id)
        {
            var category = await _uniformService.GetCategoryByIdAsync(id);
            return Ok(new
            {
                success = true,
                data = category
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

        [HttpGet("sizes/{id}")]
        public async Task<IActionResult> GetSizeById(int id)
        {
            var size = await _uniformService.GetSizeByIdAsync(id);
            return Ok(new
            {
                success = true,
                data = size
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
        public async Task<IActionResult> GetAllSuppliers(
            [FromQuery] string? search,
            [FromQuery] string? status)
        {
            var suppliers = await _uniformService.GetAllSuppliersAsync(search, status);
            return Ok(new
            {
                success = true,
                data = suppliers,
                totalCount = suppliers.Count
            });
        }

        [HttpGet("suppliers/{id}")]
        public async Task<IActionResult> GetSupplierById(int id)
        {
            var supplier = await _uniformService.GetSupplierByIdAsync(id);
            return Ok(new
            {
                success = true,
                data = supplier
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

        [HttpGet("distributions/{id}")]
        public async Task<IActionResult> GetDistributionById(int id)
        {
            var distribution = await _uniformService.GetDistributionByIdAsync(id);
            return Ok(new
            {
                success = true,
                data = distribution
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

        [HttpGet("distributions/print")]
        public async Task<IActionResult> PrintDistributions([FromQuery] string? search, [FromQuery] int? studentId)
        {
            var distributions = await _uniformService.GetAllDistributionsAsync(search, studentId);
            var sb = new System.Text.StringBuilder();

            sb.AppendLine("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Pirnav Schools - Uniform Kit Distribution Registry</title>");
            sb.AppendLine("<style>");
            sb.AppendLine("body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #0f172a; }");
            sb.AppendLine(".hdr { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }");
            sb.AppendLine(".brand { font-size: 20px; font-weight: 900; color: #0284c7; letter-spacing: 0.5px; }");
            sb.AppendLine(".sub { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; }");
            sb.AppendLine("h2 { text-align: center; color: #0f172a; margin-top: 10px; margin-bottom: 4px; font-size: 16px; text-transform: uppercase; }");
            sb.AppendLine(".meta { text-align: center; font-size: 11px; color: #64748b; margin-bottom: 20px; }");
            sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }");
            sb.AppendLine("th { background-color: #0284c7; color: white; padding: 9px 10px; font-size: 11px; text-transform: uppercase; text-align: left; }");
            sb.AppendLine("td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; }");
            sb.AppendLine("tr:nth-child(even) { background-color: #f8fafc; }");
            sb.AppendLine(".badge { padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 700; text-transform: uppercase; }");
            sb.AppendLine(".issued { background-color: #dcfce7; color: #166534; }");
            sb.AppendLine(".returned { background-color: #f1f5f9; color: #475569; }");
            sb.AppendLine(".ftr { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }");
            sb.AppendLine("</style></head><body>");
            sb.AppendLine("<div class='hdr'><div><div class='brand'>🎓 PIRNAV SCHOOLS</div><div class='sub'>Student Uniform Kit Allocation & Dispatch</div></div><div style='text-align:right; font-size:11px; color:#64748b;'><div>Academic Year: 2026-27</div><div>Campus: Main Campus</div></div></div>");
            sb.AppendLine("<h2>Uniform Kit Allocation & Distribution Registry</h2>");
            sb.AppendLine($"<div class='meta'>Generated on {DateTime.Now:yyyy-MM-dd HH:mm:ss} | Total Records: {distributions.Count}</div>");
            sb.AppendLine("<table><thead><tr><th>Student Name</th><th>Admission No</th><th>Class</th><th>Clothing Item</th><th>Size</th><th>Qty</th><th>Total Amount</th><th>Issue Date</th><th>Status</th></tr></thead><tbody>");

            foreach (var d in distributions)
            {
                string badgeClass = d.Status == "Issued" ? "issued" : "returned";
                sb.AppendLine($"<tr><td><strong>{d.StudentName}</strong></td><td>{d.AdmissionNo}</td><td>{d.ClassName}</td><td>{d.ItemName}</td><td>{d.SizeSpec}</td><td>{d.Quantity}</td><td>₹{d.TotalAmount:N0}</td><td>{d.DistributionDate:yyyy-MM-dd}</td><td><span class='badge {badgeClass}'>{d.Status}</span></td></tr>");
            }

            sb.AppendLine("</tbody></table>");
            sb.AppendLine("<div class='ftr'><div>Generated by Pirnav SMS Uniform ERP Module</div><div>Authorized Signature: ______________________</div></div>");
            sb.AppendLine("<script>window.onload = function() { window.print(); };</script>");
            sb.AppendLine("</body></html>");

            return Content(sb.ToString(), "text/html");
        }

        [HttpGet("distributions/export/pdf")]
        public async Task<IActionResult> ExportDistributionsPdf([FromQuery] string? search, [FromQuery] int? studentId)
        {
            var distributions = await _uniformService.GetAllDistributionsAsync(search, studentId);
            var jsonBytes = System.Text.Encoding.UTF8.GetBytes(System.Text.Json.JsonSerializer.Serialize(distributions));
            return File(jsonBytes, "application/pdf", $"Student_Uniform_Distribution_{DateTime.Now:yyyyMMdd_HHmmss}.pdf");
        }

        [HttpGet("distributions/download")]
        public async Task<IActionResult> DownloadDistributionsCsv([FromQuery] string? search, [FromQuery] int? studentId)
        {
            var distributions = await _uniformService.GetAllDistributionsAsync(search, studentId);
            var sb = new System.Text.StringBuilder();
            sb.AppendLine("AdmissionNo,StudentName,ClassName,TransactionType,ItemName,SizeSpec,Quantity,TotalAmount,DistributionDate,Status");

            foreach (var d in distributions)
            {
                sb.AppendLine($"\"{d.AdmissionNo}\",\"{d.StudentName}\",\"{d.ClassName}\",\"{d.TransactionType}\",\"{d.ItemName}\",\"{d.SizeSpec}\",{d.Quantity},{d.TotalAmount},\"{d.DistributionDate:yyyy-MM-dd}\",\"{d.Status}\"");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"Student_Uniform_Distribution_{DateTime.Now:yyyyMMdd}.csv");
        }

        // =========================================================
        // 7. UNIFORM REPORTS & ANALYTICS
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
            string title = !string.IsNullOrWhiteSpace(filter.ReportType) ? filter.ReportType : "Uniform Inventory & Reports Analytics";

            var sb = new System.Text.StringBuilder();
            sb.AppendLine("<!DOCTYPE html><html><head><meta charset='utf-8'><title>Pirnav Schools - " + title + "</title>");
            sb.AppendLine("<style>");
            sb.AppendLine("body { font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #0f172a; }");
            sb.AppendLine(".hdr { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: 20px; }");
            sb.AppendLine(".brand { font-size: 20px; font-weight: 900; color: #0284c7; letter-spacing: 0.5px; }");
            sb.AppendLine(".sub { font-size: 11px; color: #64748b; font-weight: 700; text-transform: uppercase; }");
            sb.AppendLine("h2 { text-align: center; color: #0f172a; margin-top: 10px; margin-bottom: 4px; font-size: 16px; text-transform: uppercase; }");
            sb.AppendLine(".meta { text-align: center; font-size: 11px; color: #64748b; margin-bottom: 20px; }");
            sb.AppendLine("table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }");
            sb.AppendLine("th { background-color: #0284c7; color: white; padding: 9px 10px; font-size: 11px; text-transform: uppercase; text-align: left; }");
            sb.AppendLine("td { padding: 9px 10px; border-bottom: 1px solid #e2e8f0; }");
            sb.AppendLine("tr:nth-child(even) { background-color: #f8fafc; }");
            sb.AppendLine(".ftr { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }");
            sb.AppendLine("</style></head><body>");
            sb.AppendLine("<div class='hdr'><div><div class='brand'>🎓 PIRNAV SCHOOLS</div><div class='sub'>Uniform Reports & Real-Time Analytics</div></div><div style='text-align:right; font-size:11px; color:#64748b;'><div>Academic Year: 2026-27</div><div>Campus: Main Campus</div></div></div>");
            sb.AppendLine($"<h2>{title}</h2>");
            sb.AppendLine($"<div class='meta'>Generated on {DateTime.Now:yyyy-MM-dd HH:mm:ss} | Total Filtered Records: {reports.Count}</div>");
            sb.AppendLine("<table><thead><tr><th>Item Name</th><th>Category</th><th>Gender</th><th>Size</th><th>Unit Price</th><th>Available Stock</th><th>Issued Units</th><th>Status</th></tr></thead><tbody>");

            foreach (var item in reports)
            {
                sb.AppendLine($"<tr><td><strong>{item.ItemName}</strong></td><td>{item.CategoryName}</td><td>{item.Gender}</td><td>{item.Size}</td><td>₹{item.UnitPrice:N0}</td><td>{item.AvailableStock} Units</td><td>{item.IssuedUnits} Units</td><td>{item.Status}</td></tr>");
            }

            sb.AppendLine("</tbody></table>");
            sb.AppendLine("<div class='ftr'><div>Generated by Pirnav SMS Uniform ERP Module</div><div>Authorized Signature: ______________________</div></div>");
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
            sb.AppendLine("ItemName,CategoryName,Gender,Size,Color,UnitPrice,AvailableStock,IssuedUnits,Status");

            foreach (var r in reports)
            {
                sb.AppendLine($"\"{r.ItemName}\",\"{r.CategoryName}\",\"{r.Gender}\",\"{r.Size}\",\"{r.Color}\",{r.UnitPrice},{r.AvailableStock},{r.IssuedUnits},\"{r.Status}\"");
            }

            var bytes = System.Text.Encoding.UTF8.GetBytes(sb.ToString());
            return File(bytes, "text/csv", $"Uniform_Report_{DateTime.Now:yyyyMMdd}.csv");
        }
    }
}
