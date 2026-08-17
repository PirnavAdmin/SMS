namespace SMS.Api.Services.Implementations.FinanceManagement;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Services.Interfaces.FinanceManagement;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class FinanceService : IFinanceService
{
    private readonly IFinanceRepository _repo;
    public FinanceService(IFinanceRepository repo) { _repo = repo; }
    
    public async Task<IEnumerable<FeeHeadDto>> GetFeeHeadsAsync() { var list = await _repo.GetFeeHeadsAsync(); return list.Select(x => new FeeHeadDto { Id = x.Id, Name = x.Name, Description = x.Description, Frequency = x.Frequency, DefaultAmount = x.DefaultAmount, IsRefundable = x.IsRefundable, IsTaxable = x.IsTaxable, Category = x.Category, Status = x.Status }); }
    public async Task<FeeHeadDto> CreateFeeHeadAsync(FeeHeadDto dto) { var model = new FeeHead { Name = dto.Name, Description = dto.Description, Frequency = dto.Frequency, DefaultAmount = dto.DefaultAmount, IsRefundable = dto.IsRefundable, IsTaxable = dto.IsTaxable, Category = dto.Category, Status = dto.Status }; var res = await _repo.CreateFeeHeadAsync(model); dto.Id = res.Id; return dto; }
    public async Task<FeeHeadDto> UpdateFeeHeadAsync(int id, FeeHeadDto dto) { var model = new FeeHead { Id = id, Name = dto.Name, Description = dto.Description, Frequency = dto.Frequency, DefaultAmount = dto.DefaultAmount, IsRefundable = dto.IsRefundable, IsTaxable = dto.IsTaxable, Category = dto.Category, Status = dto.Status }; await _repo.UpdateFeeHeadAsync(model); dto.Id = id; return dto; }
    public async Task DeleteFeeHeadAsync(int id) { await _repo.DeleteFeeHeadAsync(id); }
    
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
                : System.Text.Json.JsonSerializer.Deserialize<List<FeeStructureItemDto>>(x.ItemsJson) ?? new List<FeeStructureItemDto>()
        });
    }

    public async Task<DynamicFeeStructureDto> CreateDynamicFeeStructureAsync(DynamicFeeStructureDto dto)
    {
        var model = new DynamicFeeStructure
        {
            Name = dto.Name,
            Description = dto.Description,
            TargetAudience = dto.TargetAudience,
            AcademicYear = dto.AcademicYear,
            Branch = dto.Branch,
            ClassName = dto.ClassName,
            Section = dto.Section,
            StudentCategory = dto.StudentCategory,
            TotalAmount = dto.TotalAmount,
            Status = dto.Status,
            ItemsJson = System.Text.Json.JsonSerializer.Serialize(dto.Items)
        };
        var res = await _repo.CreateDynamicFeeStructureAsync(model);
        dto.Id = res.Id;
        return dto;
    }
    
    public async Task<IEnumerable<StudentFeeAssignmentDto>> GetStudentFeeAssignmentsAsync() { var list = await _repo.GetStudentFeeAssignmentsAsync(); return list.Select(x => new StudentFeeAssignmentDto { Id = x.Id, StudentId = x.StudentId, DynamicFeeStructureId = x.DynamicFeeStructureId, TotalAmount = x.TotalAmount, PaidAmount = x.PaidAmount, DueAmount = x.DueAmount, Status = x.Status, FeePolicy = x.FeePolicy }); }
    public async Task<StudentFeeAssignmentDto> CreateStudentFeeAssignmentAsync(StudentFeeAssignmentDto dto) { var model = new StudentFeeAssignment { StudentId = dto.StudentId, DynamicFeeStructureId = dto.DynamicFeeStructureId, TotalAmount = dto.TotalAmount, PaidAmount = dto.PaidAmount, DueAmount = dto.DueAmount, Status = dto.Status, FeePolicy = dto.FeePolicy }; var res = await _repo.CreateStudentFeeAssignmentAsync(model); dto.Id = res.Id; return dto; }
    
    public async Task<IEnumerable<FeePaymentDto>> GetFeePaymentsAsync() { var list = await _repo.GetFeePaymentsAsync(); return list.Select(x => new FeePaymentDto { Id = x.Id, ReceiptNo = x.ReceiptNo, StudentId = x.StudentId, Amount = x.Amount, DiscountAmount = x.DiscountAmount, FineAmount = x.FineAmount, TransportFee = x.TransportFee, TransactionId = x.TransactionId, PaymentDate = x.PaymentDate, PaymentMethod = x.PaymentMethod, Status = x.Status }); }
    public async Task<FeePaymentDto> CreateFeePaymentAsync(FeePaymentDto dto) { var model = new FeePayment { ReceiptNo = dto.ReceiptNo, StudentId = dto.StudentId, Amount = dto.Amount, DiscountAmount = dto.DiscountAmount, FineAmount = dto.FineAmount, TransportFee = dto.TransportFee, TransactionId = dto.TransactionId, PaymentDate = dto.PaymentDate, PaymentMethod = dto.PaymentMethod, Status = dto.Status }; var res = await _repo.CreateFeePaymentAsync(model); dto.Id = res.Id; return dto; }
}
