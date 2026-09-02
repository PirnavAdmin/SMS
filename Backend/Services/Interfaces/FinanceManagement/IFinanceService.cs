namespace SMS.Api.Services.Interfaces.FinanceManagement;
using SMS.Api.Dtos.FinanceManagement;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IFinanceService
{
    Task<IEnumerable<FeeHeadDto>> GetFeeHeadsAsync();
    Task<FeeHeadDto> CreateFeeHeadAsync(FeeHeadDto feeHead);
    Task<FeeHeadDto> UpdateFeeHeadAsync(int id, FeeHeadDto feeHead);
    Task<FeeHeadDto?> ToggleFeeHeadStatusAsync(int id);
    Task DeleteFeeHeadAsync(int id);
    
    Task<IEnumerable<DynamicFeeStructureDto>> GetDynamicFeeStructuresAsync();
    Task<DynamicFeeStructureDto?> GetDynamicFeeStructureByIdAsync(int id);
    Task<DynamicFeeStructureDto> CreateDynamicFeeStructureAsync(DynamicFeeStructureDto structure);
    Task<DynamicFeeStructureDto?> UpdateDynamicFeeStructureAsync(int id, DynamicFeeStructureDto structure);
    Task DeleteDynamicFeeStructureAsync(int id);
    
    Task<IEnumerable<StudentFeeAssignmentDto>> GetStudentFeeAssignmentsAsync();
    Task<StudentFeeAssignmentDto> CreateStudentFeeAssignmentAsync(StudentFeeAssignmentDto assignment);
    
    Task<IEnumerable<FeePaymentDto>> GetFeePaymentsAsync();
    Task<FeePaymentDto> CreateFeePaymentAsync(FeePaymentDto payment);
}
