using SMS.Api.Dtos;

namespace SMS.Api.Services.Interfaces
{
    public interface IUniformService
    {
        // Dashboard
        Task<UniformDashboardMetricsDto> GetDashboardMetricsAsync();

        // Uniform Types (Configuration Tab 1)
        Task<List<UniformTypeDto>> GetAllUniformTypesAsync(string? search, string? gender, string? category = null, string? size = null, string? status = null);
        Task<UniformTypeDto?> GetUniformTypeByIdAsync(int id);
        Task<UniformTypeDto> CreateUniformTypeAsync(CreateUniformTypeDto dto);
        Task<UniformTypeDto> UpdateUniformTypeAsync(int id, CreateUniformTypeDto dto);
        Task<UniformTypeDto> AdjustStockAsync(int id, StockAdjustmentDto dto);
        Task<bool> DeleteUniformTypeAsync(int id);

        // Uniform Categories (Configuration Tab 2)
        Task<List<UniformCategoryDto>> GetAllCategoriesAsync(string? search);
        Task<UniformCategoryDto?> GetCategoryByIdAsync(int id);
        Task<UniformCategoryDto> CreateCategoryAsync(CreateUniformCategoryDto dto);
        Task<UniformCategoryDto> UpdateCategoryAsync(int id, CreateUniformCategoryDto dto);
        Task<bool> DeleteCategoryAsync(int id);

        // Uniform Sizes (Configuration Tab 3)
        Task<List<UniformSizeDto>> GetAllSizesAsync(string? search, string? gender);
        Task<UniformSizeDto?> GetSizeByIdAsync(int id);
        Task<UniformSizeDto> CreateSizeAsync(CreateUniformSizeDto dto);
        Task<UniformSizeDto> UpdateSizeAsync(int id, CreateUniformSizeDto dto);
        Task<bool> DeleteSizeAsync(int id);

        // Uniform Suppliers (Configuration Tab 4)
        Task<List<UniformSupplierDto>> GetAllSuppliersAsync(string? search, string? status = null);
        Task<UniformSupplierDto?> GetSupplierByIdAsync(int id);
        Task<UniformSupplierDto> CreateSupplierAsync(CreateUniformSupplierDto dto);
        Task<UniformSupplierDto> UpdateSupplierAsync(int id, CreateUniformSupplierDto dto);
        Task<bool> DeleteSupplierAsync(int id);

        // Student Uniform Distribution
        Task<List<StudentUniformDistributionDto>> GetAllDistributionsAsync(string? search, int? studentId);
        Task<StudentUniformDistributionDto?> GetDistributionByIdAsync(int id);
        Task<StudentUniformDistributionDto> IssueUniformAsync(CreateStudentUniformDistributionDto dto);
        Task<StudentUniformDistributionDto> ReturnUniformAsync(int id, ReturnUniformDto dto);
        Task<StudentUniformDistributionDto> ExchangeUniformAsync(int id, ExchangeUniformDto dto);
        Task<bool> DeleteDistributionAsync(int id);

        // Reports
        Task<List<UniformReportItemDto>> GetFilteredReportsAsync(UniformReportFilterDto filter);
    }
}
