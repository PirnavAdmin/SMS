using SMS.Api.Models;

namespace SMS.Api.Repositories.Interfaces
{
    public interface IUniformRepository
    {
        // Uniform Types
        Task<List<UniformType>> GetAllUniformTypesAsync(string? search, string? gender);
        Task<UniformType?> GetUniformTypeByIdAsync(int id);
        Task AddUniformTypeAsync(UniformType item);
        void RemoveUniformType(UniformType item);

        // Uniform Categories
        Task<List<UniformCategory>> GetAllCategoriesAsync(string? search);
        Task<UniformCategory?> GetCategoryByIdAsync(int id);
        Task AddCategoryAsync(UniformCategory category);
        void RemoveCategory(UniformCategory category);

        // Uniform Sizes
        Task<List<UniformSize>> GetAllSizesAsync(string? search, string? gender);
        Task<UniformSize?> GetSizeByIdAsync(int id);
        Task AddSizeAsync(UniformSize size);
        void RemoveSize(UniformSize size);

        // Uniform Suppliers
        Task<List<UniformSupplier>> GetAllSuppliersAsync(string? search);
        Task<UniformSupplier?> GetSupplierByIdAsync(int id);
        Task AddSupplierAsync(UniformSupplier supplier);
        void RemoveSupplier(UniformSupplier supplier);

        // Distributions
        Task<List<StudentUniformDistribution>> GetAllDistributionsAsync(string? search, int? studentId);
        Task<StudentUniformDistribution?> GetDistributionByIdAsync(int id);
        Task AddDistributionAsync(StudentUniformDistribution distribution);
        void RemoveDistribution(StudentUniformDistribution distribution);

        Task SaveChangesAsync();
    }
}
