namespace SMS.Api.Services.Implementations.FinanceManagement;

using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Services.Interfaces.FinanceManagement;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;

public class FinanceService : IFinanceService
{
    private readonly IFinanceRepository _repo;

    public FinanceService(IFinanceRepository repo)
    {
        _repo = repo;
    }

    private class FeeHeadMetadata
    {
        public string? code { get; set; }
        public bool? mandatory { get; set; }
        public int? displayOrder { get; set; }
        public decimal? taxPercentage { get; set; }
        public List<string>? applicableClasses { get; set; }
        public List<string>? applicableBranches { get; set; }
    }

    public async Task<IEnumerable<FeeHeadDto>> GetFeeHeadsAsync()
    {
        var list = await _repo.GetFeeHeadsAsync();
        var dtos = new List<FeeHeadDto>();

        foreach (var x in list)
        {
            var dto = new FeeHeadDto
            {
                Id = x.Id,
                Name = x.Name,
                Code = $"FH-{x.Id:D3}",
                Category = x.Category,
                Frequency = x.Frequency,
                DefaultAmount = x.DefaultAmount,
                IsRefundable = x.IsRefundable,
                IsTaxable = x.IsTaxable,
                Status = x.Status ?? "Active",
                Description = x.Description ?? "",
                Mandatory = true,
                DisplayOrder = x.Id,
                TaxPercentage = 0,
                ApplicableClasses = new List<string> { "Nursery", "LKG", "UKG", "Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8", "Class 9", "Class 10" },
                ApplicableBranches = new List<string> { "Main Campus" }
            };

            if (!string.IsNullOrEmpty(x.Description) && x.Description.Trim().StartsWith("{"))
            {
                try
                {
                    var meta = JsonSerializer.Deserialize<FeeHeadMetadata>(x.Description);
                    if (meta != null)
                    {
                        if (!string.IsNullOrEmpty(meta.code)) dto.Code = meta.code;
                        if (meta.mandatory.HasValue) dto.Mandatory = meta.mandatory.Value;
                        if (meta.displayOrder.HasValue) dto.DisplayOrder = meta.displayOrder.Value;
                        if (meta.taxPercentage.HasValue) dto.TaxPercentage = meta.taxPercentage.Value;
                        if (meta.applicableClasses != null && meta.applicableClasses.Count > 0) dto.ApplicableClasses = meta.applicableClasses;
                        if (meta.applicableBranches != null && meta.applicableBranches.Count > 0) dto.ApplicableBranches = meta.applicableBranches;
                    }
                }
                catch { }
            }

            dtos.Add(dto);
        }

        return dtos.OrderBy(d => d.DisplayOrder);
    }

    public async Task<FeeHeadDto> CreateFeeHeadAsync(FeeHeadDto dto)
    {
        var meta = new FeeHeadMetadata
        {
            code = string.IsNullOrEmpty(dto.Code) ? $"FH-{Random.Shared.Next(100, 999)}" : dto.Code,
            mandatory = dto.Mandatory,
            displayOrder = dto.DisplayOrder > 0 ? dto.DisplayOrder : 1,
            taxPercentage = dto.TaxPercentage,
            applicableClasses = dto.ApplicableClasses ?? new List<string>(),
            applicableBranches = dto.ApplicableBranches ?? new List<string> { "Main Campus" }
        };

        var model = new FeeHead
        {
            Name = dto.Name,
            Category = dto.Category,
            Frequency = dto.Frequency,
            DefaultAmount = dto.DefaultAmount,
            IsRefundable = dto.IsRefundable,
            IsTaxable = dto.IsTaxable || dto.TaxPercentage > 0,
            Status = dto.Status ?? "Active",
            Description = JsonSerializer.Serialize(meta)
        };

        var res = await _repo.CreateFeeHeadAsync(model);
        dto.Id = res.Id;
        dto.Code = meta.code;
        return dto;
    }

    public async Task<FeeHeadDto> UpdateFeeHeadAsync(int id, FeeHeadDto dto)
    {
        var meta = new FeeHeadMetadata
        {
            code = string.IsNullOrEmpty(dto.Code) ? $"FH-{id:D3}" : dto.Code,
            mandatory = dto.Mandatory,
            displayOrder = dto.DisplayOrder > 0 ? dto.DisplayOrder : id,
            taxPercentage = dto.TaxPercentage,
            applicableClasses = dto.ApplicableClasses ?? new List<string>(),
            applicableBranches = dto.ApplicableBranches ?? new List<string> { "Main Campus" }
        };

        var model = new FeeHead
        {
            Id = id,
            Name = dto.Name,
            Category = dto.Category,
            Frequency = dto.Frequency,
            DefaultAmount = dto.DefaultAmount,
            IsRefundable = dto.IsRefundable,
            IsTaxable = dto.IsTaxable || dto.TaxPercentage > 0,
            Status = dto.Status ?? "Active",
            Description = JsonSerializer.Serialize(meta)
        };

        await _repo.UpdateFeeHeadAsync(model);
        dto.Id = id;
        return dto;
    }

    public async Task<FeeHeadDto?> ToggleFeeHeadStatusAsync(int id)
    {
        var heads = await _repo.GetFeeHeadsAsync();
        var item = heads.FirstOrDefault(h => h.Id == id);
        if (item == null) return null;

        item.Status = item.Status == "Active" ? "Inactive" : "Active";
        await _repo.UpdateFeeHeadAsync(item);

        var dtos = await GetFeeHeadsAsync();
        return dtos.FirstOrDefault(d => d.Id == id);
    }

    public async Task DeleteFeeHeadAsync(int id)
    {
        await _repo.DeleteFeeHeadAsync(id);
    }

    public async Task<IEnumerable<DynamicFeeStructureDto>> GetDynamicFeeStructuresAsync()
    {
        var list = await _repo.GetDynamicFeeStructuresAsync();
        return list.Select(x => new DynamicFeeStructureDto
        {
            Id = x.Id,
            Name = x.Name,
            Description = x.Description,
            TargetAudience = x.TargetAudience,
            AcademicYear = x.AcademicYear,
            Branch = x.Branch,
            ClassName = x.ClassName,
            Section = x.Section,
            StudentCategory = x.StudentCategory,
            TotalAmount = x.TotalAmount,
            Status = x.Status,
            Items = string.IsNullOrEmpty(x.ItemsJson)
                ? new List<FeeStructureItemDto>()
                : JsonSerializer.Deserialize<List<FeeStructureItemDto>>(x.ItemsJson) ?? new List<FeeStructureItemDto>()
        });
    }

    public async Task<DynamicFeeStructureDto?> GetDynamicFeeStructureByIdAsync(int id)
    {
        var x = await _repo.GetDynamicFeeStructureByIdAsync(id);
        if (x == null) return null;
        return new DynamicFeeStructureDto
        {
            Id = x.Id,
            Name = x.Name,
            Description = x.Description,
            TargetAudience = x.TargetAudience,
            AcademicYear = x.AcademicYear,
            Branch = x.Branch,
            ClassName = x.ClassName,
            Section = x.Section,
            StudentCategory = x.StudentCategory,
            TotalAmount = x.TotalAmount,
            Status = x.Status,
            Items = string.IsNullOrEmpty(x.ItemsJson)
                ? new List<FeeStructureItemDto>()
                : JsonSerializer.Deserialize<List<FeeStructureItemDto>>(x.ItemsJson) ?? new List<FeeStructureItemDto>()
        };
    }

    public async Task<DynamicFeeStructureDto> CreateDynamicFeeStructureAsync(DynamicFeeStructureDto dto)
    {
        var model = new DynamicFeeStructure
        {
            Name = string.IsNullOrEmpty(dto.Name) ? $"{dto.ClassName} Fee Structure" : dto.Name,
            Description = dto.Description,
            TargetAudience = dto.TargetAudience,
            AcademicYear = string.IsNullOrEmpty(dto.AcademicYear) ? "2026-2027" : dto.AcademicYear,
            Branch = string.IsNullOrEmpty(dto.Branch) ? "Main Campus" : dto.Branch,
            ClassName = dto.ClassName,
            Section = string.IsNullOrEmpty(dto.Section) ? "All Sections" : dto.Section,
            StudentCategory = string.IsNullOrEmpty(dto.StudentCategory) ? "General" : dto.StudentCategory,
            TotalAmount = dto.TotalAmount > 0 ? dto.TotalAmount : (dto.Items != null ? dto.Items.Sum(i => i.Amount) : 0),
            Status = dto.Status ?? "Active",
            ItemsJson = JsonSerializer.Serialize(dto.Items ?? new List<FeeStructureItemDto>())
        };
        var res = await _repo.CreateDynamicFeeStructureAsync(model);
        dto.Id = res.Id;
        dto.TotalAmount = model.TotalAmount;
        dto.Name = model.Name;
        return dto;
    }

    public async Task<DynamicFeeStructureDto?> UpdateDynamicFeeStructureAsync(int id, DynamicFeeStructureDto dto)
    {
        var model = new DynamicFeeStructure
        {
            Id = id,
            Name = string.IsNullOrEmpty(dto.Name) ? $"{dto.ClassName} Fee Structure" : dto.Name,
            Description = dto.Description,
            TargetAudience = dto.TargetAudience,
            AcademicYear = string.IsNullOrEmpty(dto.AcademicYear) ? "2026-2027" : dto.AcademicYear,
            Branch = string.IsNullOrEmpty(dto.Branch) ? "Main Campus" : dto.Branch,
            ClassName = dto.ClassName,
            Section = string.IsNullOrEmpty(dto.Section) ? "All Sections" : dto.Section,
            StudentCategory = string.IsNullOrEmpty(dto.StudentCategory) ? "General" : dto.StudentCategory,
            TotalAmount = dto.TotalAmount > 0 ? dto.TotalAmount : (dto.Items != null ? dto.Items.Sum(i => i.Amount) : 0),
            Status = dto.Status ?? "Active",
            ItemsJson = JsonSerializer.Serialize(dto.Items ?? new List<FeeStructureItemDto>())
        };
        var res = await _repo.UpdateDynamicFeeStructureAsync(model);
        dto.Id = id;
        dto.TotalAmount = model.TotalAmount;
        dto.Name = model.Name;
        return dto;
    }

    public async Task DeleteDynamicFeeStructureAsync(int id)
    {
        await _repo.DeleteDynamicFeeStructureAsync(id);
    }

    public async Task<IEnumerable<StudentFeeAssignmentDto>> GetStudentFeeAssignmentsAsync()
    {
        var list = await _repo.GetStudentFeeAssignmentsAsync();
        return list.Select(x => new StudentFeeAssignmentDto
        {
            Id = x.Id,
            StudentId = x.StudentId,
            DynamicFeeStructureId = x.DynamicFeeStructureId,
            TotalAmount = x.TotalAmount,
            PaidAmount = x.PaidAmount,
            DueAmount = x.DueAmount,
            Status = x.Status,
            FeePolicy = string.IsNullOrWhiteSpace(x.FeePolicy) ? "Full Annual Fee" : x.FeePolicy
        });
    }

    public async Task<StudentFeeAssignmentDto?> GetStudentFeeAssignmentByIdAsync(int id)
    {
        var x = await _repo.GetStudentFeeAssignmentByIdAsync(id);
        if (x == null) return null;
        return new StudentFeeAssignmentDto
        {
            Id = x.Id,
            StudentId = x.StudentId,
            DynamicFeeStructureId = x.DynamicFeeStructureId,
            TotalAmount = x.TotalAmount,
            PaidAmount = x.PaidAmount,
            DueAmount = x.DueAmount,
            Status = x.Status,
            FeePolicy = string.IsNullOrWhiteSpace(x.FeePolicy) ? "Full Annual Fee" : x.FeePolicy
        };
    }

    public async Task<StudentFeeAssignmentDto> CreateStudentFeeAssignmentAsync(StudentFeeAssignmentDto dto)
    {
        var existing = (await _repo.GetStudentFeeAssignmentsAsync()).FirstOrDefault(x => x.StudentId == dto.StudentId);
        if (existing != null)
        {
            existing.DynamicFeeStructureId = dto.DynamicFeeStructureId ?? existing.DynamicFeeStructureId;
            existing.TotalAmount = dto.TotalAmount > 0 ? dto.TotalAmount : existing.TotalAmount;
            existing.DueAmount = existing.TotalAmount - existing.PaidAmount;
            existing.FeePolicy = !string.IsNullOrWhiteSpace(dto.FeePolicy) ? dto.FeePolicy : existing.FeePolicy;
            existing.Status = !string.IsNullOrWhiteSpace(dto.Status) ? dto.Status : "Active";
            await _repo.UpdateStudentFeeAssignmentAsync(existing);
            dto.Id = existing.Id;
            return dto;
        }

        var model = new StudentFeeAssignment
        {
            StudentId = dto.StudentId,
            DynamicFeeStructureId = dto.DynamicFeeStructureId,
            TotalAmount = dto.TotalAmount,
            PaidAmount = dto.PaidAmount,
            DueAmount = dto.TotalAmount - dto.PaidAmount,
            Status = string.IsNullOrWhiteSpace(dto.Status) ? "Active" : dto.Status,
            FeePolicy = string.IsNullOrWhiteSpace(dto.FeePolicy) ? "Full Annual Fee" : dto.FeePolicy
        };
        var res = await _repo.CreateStudentFeeAssignmentAsync(model);
        dto.Id = res.Id;
        return dto;
    }

    public async Task<List<StudentFeeAssignmentDto>> BulkAssignStudentFeesAsync(BulkFeeAssignmentRequestDto request)
    {
        var results = new List<StudentFeeAssignmentDto>();
        decimal defaultTotal = request.TotalAmount ?? 0m;

        if (defaultTotal <= 0 && request.DynamicFeeStructureId.HasValue)
        {
            var dfs = await _repo.GetDynamicFeeStructureByIdAsync(request.DynamicFeeStructureId.Value);
            if (dfs != null)
            {
                defaultTotal = dfs.TotalAmount;
            }
        }

        foreach (var studentId in request.StudentIds)
        {
            var dto = new StudentFeeAssignmentDto
            {
                StudentId = studentId,
                DynamicFeeStructureId = request.DynamicFeeStructureId,
                TotalAmount = defaultTotal,
                PaidAmount = 0,
                DueAmount = defaultTotal,
                Status = "Active",
                FeePolicy = string.IsNullOrWhiteSpace(request.FeePolicy) ? "Full Annual Fee" : request.FeePolicy,
                AssignedDate = DateTime.Now.ToString("yyyy-MM-dd")
            };

            var saved = await CreateStudentFeeAssignmentAsync(dto);
            results.Add(saved);
        }

        return results;
    }

    public async Task<StudentFeeAssignmentDto> SaveCustomStudentFeeAssignmentAsync(CustomFeeAssignmentRequestDto request)
    {
        decimal total = request.TotalAmount;
        if (total <= 0 && request.Breakdown != null && request.Breakdown.Any())
        {
            total = request.Breakdown.Sum(b => b.AssignedAmount);
        }

        var dto = new StudentFeeAssignmentDto
        {
            StudentId = request.StudentId,
            DynamicFeeStructureId = request.DynamicFeeStructureId,
            TotalAmount = total,
            PaidAmount = 0,
            DueAmount = total,
            Status = "Active",
            FeePolicy = string.IsNullOrWhiteSpace(request.FeePolicy) ? "Monthly Pro-rated Fee" : request.FeePolicy,
            AdjustmentReason = request.AdjustmentReason,
            AssignedDate = request.AdmissionDate ?? DateTime.Now.ToString("yyyy-MM-dd")
        };

        return await CreateStudentFeeAssignmentAsync(dto);
    }

    public async Task<StudentFeeAssignmentDto?> UpdateStudentFeeAssignmentAsync(int id, StudentFeeAssignmentDto dto)
    {
        var existing = await _repo.GetStudentFeeAssignmentByIdAsync(id);
        if (existing == null) return null;

        existing.DynamicFeeStructureId = dto.DynamicFeeStructureId ?? existing.DynamicFeeStructureId;
        existing.TotalAmount = dto.TotalAmount;
        existing.PaidAmount = dto.PaidAmount;
        existing.DueAmount = dto.TotalAmount - dto.PaidAmount;
        existing.Status = string.IsNullOrWhiteSpace(dto.Status) ? existing.Status : dto.Status;
        existing.FeePolicy = string.IsNullOrWhiteSpace(dto.FeePolicy) ? existing.FeePolicy : dto.FeePolicy;

        var updated = await _repo.UpdateStudentFeeAssignmentAsync(existing);
        dto.Id = updated.Id;
        return dto;
    }

    public async Task<bool> DeleteStudentFeeAssignmentAsync(int id)
    {
        var existing = await _repo.GetStudentFeeAssignmentByIdAsync(id);
        if (existing == null) return false;

        await _repo.DeleteStudentFeeAssignmentAsync(id);
        return true;
    }

    public async Task<IEnumerable<FeePaymentDto>> GetFeePaymentsAsync()
    {
        var list = await _repo.GetFeePaymentsAsync();
        return list.Select(x => new FeePaymentDto
        {
            Id = x.Id,
            ReceiptNo = x.ReceiptNo,
            StudentId = x.StudentId,
            Amount = x.Amount,
            DiscountAmount = x.DiscountAmount,
            FineAmount = x.FineAmount,
            TransportFee = x.TransportFee,
            PaymentMethod = x.PaymentMethod,
            TransactionId = x.TransactionId,
            PaymentDate = x.PaymentDate,
            Status = x.Status
        });
    }

    public async Task<FeePaymentDto> CreateFeePaymentAsync(FeePaymentDto dto)
    {
        var model = new FeePayment
        {
            ReceiptNo = dto.ReceiptNo,
            StudentId = dto.StudentId,
            Amount = dto.Amount,
            DiscountAmount = dto.DiscountAmount,
            FineAmount = dto.FineAmount,
            TransportFee = dto.TransportFee,
            PaymentMethod = dto.PaymentMethod,
            TransactionId = dto.TransactionId,
            PaymentDate = dto.PaymentDate == default ? DateTime.UtcNow : dto.PaymentDate,
            Status = dto.Status
        };
        var res = await _repo.CreateFeePaymentAsync(model);
        dto.Id = res.Id;
        return dto;
    }
}