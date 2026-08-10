using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class UniformRepository : IUniformRepository
    {
        private readonly AppDbContext _context;

        public UniformRepository(AppDbContext context)
        {
            _context = context;
        }

        // Uniform Types
        public async Task<List<UniformType>> GetAllUniformTypesAsync(string? search, string? gender)
        {
            var query = _context.UniformTypes.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(gender) && !gender.Equals("All", StringComparison.OrdinalIgnoreCase) && !gender.Equals("Select Gender (All)", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(u => u.Gender != null && u.Gender.ToLower() == gender.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(u => u.ItemName.ToLower().Contains(s) || (u.Color != null && u.Color.ToLower().Contains(s)) || (u.SchoolWing != null && u.SchoolWing.ToLower().Contains(s)));
            }

            return await query.OrderByDescending(u => u.UniformTypeId).ToListAsync();
        }

        public async Task<UniformType?> GetUniformTypeByIdAsync(int id)
        {
            return await _context.UniformTypes.FirstOrDefaultAsync(u => u.UniformTypeId == id);
        }

        public async Task AddUniformTypeAsync(UniformType item)
        {
            await _context.UniformTypes.AddAsync(item);
        }

        public void RemoveUniformType(UniformType item)
        {
            _context.UniformTypes.Remove(item);
        }

        // Uniform Categories
        public async Task<List<UniformCategory>> GetAllCategoriesAsync(string? search)
        {
            var query = _context.UniformCategories.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(c => c.CategoryName.ToLower().Contains(s) || (c.Description != null && c.Description.ToLower().Contains(s)));
            }

            return await query.OrderBy(c => c.CategoryId).ToListAsync();
        }

        public async Task<UniformCategory?> GetCategoryByIdAsync(int id)
        {
            return await _context.UniformCategories.FirstOrDefaultAsync(c => c.CategoryId == id);
        }

        public async Task AddCategoryAsync(UniformCategory category)
        {
            await _context.UniformCategories.AddAsync(category);
        }

        public void RemoveCategory(UniformCategory category)
        {
            _context.UniformCategories.Remove(category);
        }

        // Uniform Sizes
        public async Task<List<UniformSize>> GetAllSizesAsync(string? search, string? gender)
        {
            var query = _context.UniformSizes.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(gender) && !gender.Equals("All", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(s => s.Gender != null && s.Gender.ToLower() == gender.ToLower());
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(size => size.SizeName.ToLower().Contains(s) || (size.AgeBracket != null && size.AgeBracket.ToLower().Contains(s)));
            }

            return await query.OrderBy(size => size.SizeId).ToListAsync();
        }

        public async Task<UniformSize?> GetSizeByIdAsync(int id)
        {
            return await _context.UniformSizes.FirstOrDefaultAsync(s => s.SizeId == id);
        }

        public async Task AddSizeAsync(UniformSize size)
        {
            await _context.UniformSizes.AddAsync(size);
        }

        public void RemoveSize(UniformSize size)
        {
            _context.UniformSizes.Remove(size);
        }

        // Uniform Suppliers
        public async Task<List<UniformSupplier>> GetAllSuppliersAsync(string? search)
        {
            var query = _context.UniformSuppliers.AsNoTracking().AsQueryable();

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(sp => sp.SupplierName.ToLower().Contains(s) || (sp.ContactPerson != null && sp.ContactPerson.ToLower().Contains(s)));
            }

            return await query.OrderBy(sp => sp.SupplierId).ToListAsync();
        }

        public async Task<UniformSupplier?> GetSupplierByIdAsync(int id)
        {
            return await _context.UniformSuppliers.FirstOrDefaultAsync(sp => sp.SupplierId == id);
        }

        public async Task AddSupplierAsync(UniformSupplier supplier)
        {
            await _context.UniformSuppliers.AddAsync(supplier);
        }

        public void RemoveSupplier(UniformSupplier supplier)
        {
            _context.UniformSuppliers.Remove(supplier);
        }

        // Distributions
        public async Task<List<StudentUniformDistribution>> GetAllDistributionsAsync(string? search, int? studentId)
        {
            var query = _context.StudentUniformDistributions.Include(d => d.UniformType).AsNoTracking().AsQueryable();

            if (studentId.HasValue && studentId.Value > 0)
            {
                query = query.Where(d => d.StudentId == studentId.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                string s = search.Trim().ToLower();
                query = query.Where(d => (d.StudentName != null && d.StudentName.ToLower().Contains(s)) || (d.AdmissionNo != null && d.AdmissionNo.ToLower().Contains(s)) || (d.ItemName != null && d.ItemName.ToLower().Contains(s)));
            }

            return await query.OrderByDescending(d => d.DistributionId).ToListAsync();
        }

        public async Task<StudentUniformDistribution?> GetDistributionByIdAsync(int id)
        {
            return await _context.StudentUniformDistributions.Include(d => d.UniformType).FirstOrDefaultAsync(d => d.DistributionId == id);
        }

        public async Task AddDistributionAsync(StudentUniformDistribution distribution)
        {
            await _context.StudentUniformDistributions.AddAsync(distribution);
        }

        public void RemoveDistribution(StudentUniformDistribution distribution)
        {
            _context.StudentUniformDistributions.Remove(distribution);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}
