using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class UniformService : IUniformService
    {
        private readonly IUniformRepository _uniformRepo;
        private readonly ISchoolRepository _schoolRepo;

        public UniformService(IUniformRepository uniformRepo, ISchoolRepository schoolRepo)
        {
            _uniformRepo = uniformRepo;
            _schoolRepo = schoolRepo;
        }

        // --- DASHBOARD ---
        public async Task<UniformDashboardMetricsDto> GetDashboardMetricsAsync()
        {
            var types = await GetAllUniformTypesAsync(null, null);
            var distributions = await _uniformRepo.GetAllDistributionsAsync(null, null);

            int totalItems = types.Count;
            int availStock = types.Sum(t => t.AvailableStock);
            int lowStockCount = types.Count(t => t.AvailableStock <= 5);
            int issuedUnits = distributions.Sum(d => d.Quantity);
            decimal totalSales = distributions.Sum(d => d.TotalAmount);
            int outOfStockCount = types.Count(t => t.AvailableStock == 0);

            var categoryStock = types.Select(t => new UniformCategoryStockLevelDto
            {
                CategoryName = t.ItemName,
                TotalUnits = t.AvailableStock
            }).ToList();

            var lowStockAlerts = types.Where(t => t.AvailableStock <= 5).Select(t => new UniformLowStockAlertDto
            {
                ItemName = t.ItemName,
                Category = t.ItemName,
                CurrentStock = t.AvailableStock,
                Status = t.AvailableStock == 0 ? "Out of Stock" : "Low Stock"
            }).ToList();

            return new UniformDashboardMetricsDto
            {
                TotalItems = totalItems,
                AvailableStock = availStock,
                LowStock = lowStockCount,
                IssuedUnits = issuedUnits,
                AdditionalSales = totalSales,
                OutOfStock = outOfStockCount,
                CategoryStockLevels = categoryStock,
                LowStockAlerts = lowStockAlerts
            };
        }

        // --- UNIFORM TYPES (CONFIGURATION TAB 1) ---
        public async Task<List<UniformTypeDto>> GetAllUniformTypesAsync(string? search, string? gender)
        {
            var list = await _uniformRepo.GetAllUniformTypesAsync(search, gender);
            if (list.Count == 0 && string.IsNullOrWhiteSpace(search) && string.IsNullOrWhiteSpace(gender))
            {
                // Seed default items matching Screenshot 2
                var seed1 = new UniformType
                {
                    ItemName = "Summer Polo Shirt",
                    Gender = "Unisex",
                    SchoolWing = "Class 10",
                    Size = "M",
                    Color = "Navy Blue",
                    UnitPrice = 35.00m,
                    AvailableStock = 120,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };
                var seed2 = new UniformType
                {
                    ItemName = "Winter Blazer",
                    Gender = "Male",
                    SchoolWing = "Class 10",
                    Size = "L",
                    Color = "Dark Charcoal",
                    UnitPrice = 85.00m,
                    AvailableStock = 45,
                    Status = "Active",
                    CreatedAt = DateTime.UtcNow
                };

                await _uniformRepo.AddUniformTypeAsync(seed1);
                await _uniformRepo.AddUniformTypeAsync(seed2);
                await _uniformRepo.SaveChangesAsync();

                list = await _uniformRepo.GetAllUniformTypesAsync(search, gender);
            }

            return list.Select(MapToUniformTypeDto).ToList();
        }

        public async Task<UniformTypeDto?> GetUniformTypeByIdAsync(int id)
        {
            var item = await _uniformRepo.GetUniformTypeByIdAsync(id);
            return item != null ? MapToUniformTypeDto(item) : null;
        }

        public async Task<UniformTypeDto> CreateUniformTypeAsync(CreateUniformTypeDto dto)
        {
            var item = new UniformType
            {
                ItemName = dto.ItemName.Trim(),
                Gender = !string.IsNullOrWhiteSpace(dto.Gender) ? dto.Gender.Trim() : "Unisex",
                SchoolWing = !string.IsNullOrWhiteSpace(dto.SchoolWing) ? dto.SchoolWing.Trim() : "Class 10",
                Size = !string.IsNullOrWhiteSpace(dto.Size) ? dto.Size.Trim() : "M",
                Color = !string.IsNullOrWhiteSpace(dto.Color) ? dto.Color.Trim() : "Navy Blue",
                UnitPrice = dto.UnitPrice > 0 ? dto.UnitPrice : 35.00m,
                AvailableStock = dto.AvailableStock >= 0 ? dto.AvailableStock : 50,
                Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _uniformRepo.AddUniformTypeAsync(item);
            await _uniformRepo.SaveChangesAsync();

            return MapToUniformTypeDto(item);
        }

        public async Task<UniformTypeDto> UpdateUniformTypeAsync(int id, CreateUniformTypeDto dto)
        {
            var item = await _uniformRepo.GetUniformTypeByIdAsync(id)
                ?? throw new NotFoundException($"Uniform Type with ID '{id}' not found.");

            item.ItemName = dto.ItemName.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Gender)) item.Gender = dto.Gender.Trim();
            if (!string.IsNullOrWhiteSpace(dto.SchoolWing)) item.SchoolWing = dto.SchoolWing.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Size)) item.Size = dto.Size.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Color)) item.Color = dto.Color.Trim();
            if (dto.UnitPrice > 0) item.UnitPrice = dto.UnitPrice;
            if (dto.AvailableStock >= 0) item.AvailableStock = dto.AvailableStock;
            if (!string.IsNullOrWhiteSpace(dto.Status)) item.Status = dto.Status.Trim();

            await _uniformRepo.SaveChangesAsync();
            return MapToUniformTypeDto(item);
        }

        public async Task<UniformTypeDto> AdjustStockAsync(int id, StockAdjustmentDto dto)
        {
            var item = await _uniformRepo.GetUniformTypeByIdAsync(id)
                ?? throw new NotFoundException($"Uniform item with ID '{id}' not found.");

            string action = dto.Action?.Trim().ToLower() ?? "restock";
            int qty = dto.Quantity > 0 ? dto.Quantity : 10;

            if (action == "restock" || action == "add")
            {
                item.AvailableStock += qty;
            }
            else if (action == "out" || action == "deduct" || action == "remove")
            {
                item.AvailableStock = Math.Max(0, item.AvailableStock - qty);
            }
            else if (action == "adjust" || action == "set")
            {
                item.AvailableStock = Math.Max(0, qty);
            }

            await _uniformRepo.SaveChangesAsync();
            return MapToUniformTypeDto(item);
        }

        public async Task<bool> DeleteUniformTypeAsync(int id)
        {
            var item = await _uniformRepo.GetUniformTypeByIdAsync(id)
                ?? throw new NotFoundException($"Uniform Type with ID '{id}' not found.");

            _uniformRepo.RemoveUniformType(item);
            await _uniformRepo.SaveChangesAsync();
            return true;
        }

        // --- UNIFORM CATEGORIES (CONFIGURATION TAB 2) ---
        public async Task<List<UniformCategoryDto>> GetAllCategoriesAsync(string? search)
        {
            var list = await _uniformRepo.GetAllCategoriesAsync(search);
            if (list.Count == 0 && string.IsNullOrWhiteSpace(search))
            {
                // Seed default categories matching Screenshot 4
                var seeds = new List<UniformCategory>
                {
                    new() { CategoryName = "Shirt", Description = "Regular school uniform shirts" },
                    new() { CategoryName = "Pant", Description = "Regular school uniform trousers" },
                    new() { CategoryName = "Skirt", Description = "Regular school uniform skirts" },
                    new() { CategoryName = "Tie", Description = "School uniform neckties" },
                    new() { CategoryName = "Belt", Description = "School uniform belts" }
                };

                foreach (var s in seeds) await _uniformRepo.AddCategoryAsync(s);
                await _uniformRepo.SaveChangesAsync();
                list = await _uniformRepo.GetAllCategoriesAsync(search);
            }

            return list.Select(MapToCategoryDto).ToList();
        }

        public async Task<UniformCategoryDto?> GetCategoryByIdAsync(int id)
        {
            var item = await _uniformRepo.GetCategoryByIdAsync(id);
            return item != null ? MapToCategoryDto(item) : null;
        }

        public async Task<UniformCategoryDto> CreateCategoryAsync(CreateUniformCategoryDto dto)
        {
            var cat = new UniformCategory
            {
                CategoryName = dto.CategoryName.Trim(),
                Description = dto.Description?.Trim(),
                Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _uniformRepo.AddCategoryAsync(cat);
            await _uniformRepo.SaveChangesAsync();
            return MapToCategoryDto(cat);
        }

        public async Task<UniformCategoryDto> UpdateCategoryAsync(int id, CreateUniformCategoryDto dto)
        {
            var cat = await _uniformRepo.GetCategoryByIdAsync(id)
                ?? throw new NotFoundException($"Uniform Category with ID '{id}' not found.");

            cat.CategoryName = dto.CategoryName.Trim();
            cat.Description = dto.Description?.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Status)) cat.Status = dto.Status.Trim();

            await _uniformRepo.SaveChangesAsync();
            return MapToCategoryDto(cat);
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var cat = await _uniformRepo.GetCategoryByIdAsync(id)
                ?? throw new NotFoundException($"Uniform Category with ID '{id}' not found.");

            _uniformRepo.RemoveCategory(cat);
            await _uniformRepo.SaveChangesAsync();
            return true;
        }

        // --- UNIFORM SIZES (CONFIGURATION TAB 3) ---
        public async Task<List<UniformSizeDto>> GetAllSizesAsync(string? search, string? gender)
        {
            var list = await _uniformRepo.GetAllSizesAsync(search, gender);
            if (list.Count == 0 && string.IsNullOrWhiteSpace(search) && string.IsNullOrWhiteSpace(gender))
            {
                // Seed default sizes matching Screenshot 5
                var seeds = new List<UniformSize>
                {
                    new() { SizeName = "S", ChestSpec = "36\"", WaistSpec = "30\"", HeightTarget = "160cm", AgeBracket = "11-13 yrs", Gender = "Unisex" },
                    new() { SizeName = "M", ChestSpec = "38\"", WaistSpec = "32\"", HeightTarget = "170cm", AgeBracket = "13-15 yrs", Gender = "Unisex" },
                    new() { SizeName = "L", ChestSpec = "40\"", WaistSpec = "34\"", HeightTarget = "175cm", AgeBracket = "15-17 yrs", Gender = "Unisex" },
                    new() { SizeName = "XL", ChestSpec = "42\"", WaistSpec = "36\"", HeightTarget = "180cm", AgeBracket = "17+ yrs", Gender = "Unisex" }
                };

                foreach (var s in seeds) await _uniformRepo.AddSizeAsync(s);
                await _uniformRepo.SaveChangesAsync();
                list = await _uniformRepo.GetAllSizesAsync(search, gender);
            }

            return list.Select(MapToSizeDto).ToList();
        }

        public async Task<UniformSizeDto?> GetSizeByIdAsync(int id)
        {
            var size = await _uniformRepo.GetSizeByIdAsync(id);
            return size != null ? MapToSizeDto(size) : null;
        }

        public async Task<UniformSizeDto> CreateSizeAsync(CreateUniformSizeDto dto)
        {
            var size = new UniformSize
            {
                SizeName = dto.SizeName.Trim(),
                ChestSpec = dto.ChestSpec?.Trim(),
                WaistSpec = dto.WaistSpec?.Trim(),
                HeightTarget = dto.HeightTarget?.Trim(),
                AgeBracket = dto.AgeBracket?.Trim(),
                Gender = !string.IsNullOrWhiteSpace(dto.Gender) ? dto.Gender.Trim() : "Unisex",
                CreatedAt = DateTime.UtcNow
            };

            await _uniformRepo.AddSizeAsync(size);
            await _uniformRepo.SaveChangesAsync();
            return MapToSizeDto(size);
        }

        public async Task<UniformSizeDto> UpdateSizeAsync(int id, CreateUniformSizeDto dto)
        {
            var size = await _uniformRepo.GetSizeByIdAsync(id)
                ?? throw new NotFoundException($"Uniform Size with ID '{id}' not found.");

            size.SizeName = dto.SizeName.Trim();
            size.ChestSpec = dto.ChestSpec?.Trim();
            size.WaistSpec = dto.WaistSpec?.Trim();
            size.HeightTarget = dto.HeightTarget?.Trim();
            size.AgeBracket = dto.AgeBracket?.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Gender)) size.Gender = dto.Gender.Trim();

            await _uniformRepo.SaveChangesAsync();
            return MapToSizeDto(size);
        }

        public async Task<bool> DeleteSizeAsync(int id)
        {
            var size = await _uniformRepo.GetSizeByIdAsync(id)
                ?? throw new NotFoundException($"Uniform Size with ID '{id}' not found.");

            _uniformRepo.RemoveSize(size);
            await _uniformRepo.SaveChangesAsync();
            return true;
        }

        // --- UNIFORM SUPPLIERS (CONFIGURATION TAB 4) ---
        public async Task<List<UniformSupplierDto>> GetAllSuppliersAsync(string? search)
        {
            var list = await _uniformRepo.GetAllSuppliersAsync(search);
            if (list.Count == 0 && string.IsNullOrWhiteSpace(search))
            {
                var seeds = new List<UniformSupplier>
                {
                    new() { SupplierName = "Apex Apparel Group", ContactPerson = "John Miller", Phone = "9876543210", Email = "apex@apparel.com", GstNumber = "29AAAAA1111A1Z1", Status = "Active" },
                    new() { SupplierName = "Elite Uniforms Ltd", ContactPerson = "Sarah Davis", Phone = "8765432109", Email = "sales@eliteuniforms.com", GstNumber = "29BBBBB2222B2Z2", Status = "Active" }
                };

                foreach (var s in seeds) await _uniformRepo.AddSupplierAsync(s);
                await _uniformRepo.SaveChangesAsync();
                list = await _uniformRepo.GetAllSuppliersAsync(search);
            }

            return list.Select(MapToSupplierDto).ToList();
        }

        public async Task<UniformSupplierDto?> GetSupplierByIdAsync(int id)
        {
            var sp = await _uniformRepo.GetSupplierByIdAsync(id);
            return sp != null ? MapToSupplierDto(sp) : null;
        }

        public async Task<UniformSupplierDto> CreateSupplierAsync(CreateUniformSupplierDto dto)
        {
            var sp = new UniformSupplier
            {
                SupplierName = dto.SupplierName.Trim(),
                ContactPerson = dto.ContactPerson?.Trim(),
                Phone = dto.Phone?.Trim(),
                Email = dto.Email?.Trim(),
                GstNumber = !string.IsNullOrWhiteSpace(dto.GstNumber) ? dto.GstNumber.Trim() : "29AAAAA1111A1Z1",
                Address = dto.Address?.Trim(),
                Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _uniformRepo.AddSupplierAsync(sp);
            await _uniformRepo.SaveChangesAsync();
            return MapToSupplierDto(sp);
        }

        public async Task<UniformSupplierDto> UpdateSupplierAsync(int id, CreateUniformSupplierDto dto)
        {
            var sp = await _uniformRepo.GetSupplierByIdAsync(id)
                ?? throw new NotFoundException($"Supplier with ID '{id}' not found.");

            sp.SupplierName = dto.SupplierName.Trim();
            sp.ContactPerson = dto.ContactPerson?.Trim();
            sp.Phone = dto.Phone?.Trim();
            sp.Email = dto.Email?.Trim();
            if (!string.IsNullOrWhiteSpace(dto.GstNumber)) sp.GstNumber = dto.GstNumber.Trim();
            sp.Address = dto.Address?.Trim();
            if (!string.IsNullOrWhiteSpace(dto.Status)) sp.Status = dto.Status.Trim();

            await _uniformRepo.SaveChangesAsync();
            return MapToSupplierDto(sp);
        }

        public async Task<bool> DeleteSupplierAsync(int id)
        {
            var sp = await _uniformRepo.GetSupplierByIdAsync(id)
                ?? throw new NotFoundException($"Supplier with ID '{id}' not found.");

            _uniformRepo.RemoveSupplier(sp);
            await _uniformRepo.SaveChangesAsync();
            return true;
        }

        // --- STUDENT UNIFORM DISTRIBUTION ---
        public async Task<List<StudentUniformDistributionDto>> GetAllDistributionsAsync(string? search, int? studentId)
        {
            var list = await _uniformRepo.GetAllDistributionsAsync(search, studentId);
            return list.Select(MapToDistributionDto).ToList();
        }

        public async Task<StudentUniformDistributionDto> IssueUniformAsync(CreateStudentUniformDistributionDto dto)
        {
            UniformType? item = null;
            if (dto.UniformTypeId.HasValue && dto.UniformTypeId.Value > 0)
            {
                item = await _uniformRepo.GetUniformTypeByIdAsync(dto.UniformTypeId.Value);
            }

            string itemName = item?.ItemName ?? dto.ItemName?.Trim() ?? "Summer Polo Shirt";
            decimal price = item?.UnitPrice ?? (dto.TotalAmount > 0 ? dto.TotalAmount : 35.00m);
            int qty = dto.Quantity > 0 ? dto.Quantity : 1;
            decimal total = dto.TotalAmount > 0 ? dto.TotalAmount : (price * qty);

            var dist = new StudentUniformDistribution
            {
                StudentId = dto.StudentId,
                AdmissionNo = dto.AdmissionNo?.Trim() ?? "REG-1010",
                StudentName = dto.StudentName?.Trim() ?? "Mahesh kamati",
                ClassName = !string.IsNullOrWhiteSpace(dto.ClassName) ? dto.ClassName.Trim() : "Class 10-A",
                TransactionType = !string.IsNullOrWhiteSpace(dto.TransactionType) ? dto.TransactionType.Trim() : "Baseline Distribution (Admission Kit)",
                UniformTypeId = item?.UniformTypeId,
                ItemName = itemName,
                SizeSpec = !string.IsNullOrWhiteSpace(dto.SizeSpec) ? dto.SizeSpec.Trim() : "M",
                Quantity = qty,
                TotalAmount = total,
                DistributionDate = dto.DistributionDate ?? DateTime.UtcNow,
                Notes = dto.Notes?.Trim(),
                PaymentStatus = !string.IsNullOrWhiteSpace(dto.PaymentStatus) ? dto.PaymentStatus.Trim() : "Paid",
                Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status.Trim() : "Issued",
                CreatedAt = DateTime.UtcNow
            };

            if (item != null && item.AvailableStock >= qty)
            {
                item.AvailableStock -= qty;
            }

            await _uniformRepo.AddDistributionAsync(dist);
            await _uniformRepo.SaveChangesAsync();
            return MapToDistributionDto(dist);
        }

        public async Task<bool> DeleteDistributionAsync(int id)
        {
            var dist = await _uniformRepo.GetDistributionByIdAsync(id)
                ?? throw new NotFoundException($"Distribution record with ID '{id}' not found.");

            _uniformRepo.RemoveDistribution(dist);
            await _uniformRepo.SaveChangesAsync();
            return true;
        }

        // --- REPORTS ---
        public async Task<List<UniformReportItemDto>> GetFilteredReportsAsync(UniformReportFilterDto filter)
        {
            var types = await GetAllUniformTypesAsync(filter.Search, filter.Gender);
            var distributions = await _uniformRepo.GetAllDistributionsAsync(filter.Search, null);

            return types.Select(t =>
            {
                int issued = distributions.Where(d => d.UniformTypeId == t.UniformTypeId).Sum(d => d.Quantity);

                return new UniformReportItemDto
                {
                    Id = t.UniformTypeId,
                    ItemName = t.ItemName,
                    CategoryName = t.ItemName,
                    Gender = t.Gender,
                    Size = t.Size,
                    Color = t.Color,
                    UnitPrice = t.UnitPrice,
                    AvailableStock = t.AvailableStock,
                    IssuedUnits = issued,
                    Status = t.Status
                };
            }).ToList();
        }

        // --- MAPPERS ---
        private static UniformTypeDto MapToUniformTypeDto(UniformType u) => new()
        {
            UniformTypeId = u.UniformTypeId,
            ItemName = u.ItemName ?? "",
            CategoryName = u.CategoryName ?? ((u.ItemName != null && u.ItemName.Contains("Shirt")) ? "Shirt" : "Blazer"),
            Gender = u.Gender ?? "Unisex",
            SchoolWing = u.SchoolWing ?? "",
            Size = u.Size ?? "M",
            Color = u.Color ?? "",
            UnitPrice = u.UnitPrice,
            OpeningStock = u.OpeningStock > 0 ? u.OpeningStock : 200,
            AvailableStock = u.AvailableStock,
            MinThreshold = u.MinThreshold > 0 ? u.MinThreshold : 30,
            ReorderPoint = u.ReorderPoint > 0 ? u.ReorderPoint : 50,
            Status = u.Status ?? "Active",
            CreatedAt = u.CreatedAt ?? DateTime.UtcNow
        };

        private static UniformCategoryDto MapToCategoryDto(UniformCategory c) => new()
        {
            CategoryId = c.CategoryId,
            CategoryName = c.CategoryName ?? "",
            Description = c.Description ?? "",
            Status = c.Status ?? "Active",
            CreatedAt = c.CreatedAt ?? DateTime.UtcNow
        };

        private static UniformSizeDto MapToSizeDto(UniformSize s) => new()
        {
            SizeId = s.SizeId,
            SizeName = s.SizeName ?? "",
            ChestSpec = s.ChestSpec ?? "",
            WaistSpec = s.WaistSpec ?? "",
            HeightTarget = s.HeightTarget ?? "",
            AgeBracket = s.AgeBracket ?? "",
            Gender = s.Gender ?? "Unisex",
            CreatedAt = s.CreatedAt ?? DateTime.UtcNow
        };

        private static UniformSupplierDto MapToSupplierDto(UniformSupplier sp) => new()
        {
            SupplierId = sp.SupplierId,
            SupplierName = sp.SupplierName ?? "",
            ContactPerson = sp.ContactPerson ?? "",
            Phone = sp.Phone ?? "",
            Email = sp.Email ?? "",
            GstNumber = sp.GstNumber ?? "29AAAAA1111A1Z1",
            Address = sp.Address ?? "",
            Status = sp.Status ?? "Active",
            CreatedAt = sp.CreatedAt ?? DateTime.UtcNow
        };

        private static StudentUniformDistributionDto MapToDistributionDto(StudentUniformDistribution d) => new()
        {
            DistributionId = d.DistributionId,
            StudentId = d.StudentId,
            AdmissionNo = d.AdmissionNo ?? "",
            StudentName = d.StudentName ?? "",
            ClassName = d.ClassName ?? "Class 10-A",
            TransactionType = d.TransactionType ?? "Baseline Distribution (Admission Kit)",
            UniformTypeId = d.UniformTypeId,
            ItemName = d.ItemName ?? d.UniformType?.ItemName ?? "",
            SizeSpec = d.SizeSpec ?? "M",
            Quantity = d.Quantity,
            TotalAmount = d.TotalAmount,
            DistributionDate = d.DistributionDate ?? DateTime.UtcNow,
            Notes = d.Notes ?? "",
            PaymentStatus = d.PaymentStatus ?? "Paid",
            Status = d.Status ?? "Issued",
            CreatedAt = d.CreatedAt ?? DateTime.UtcNow
        };
    }
}
