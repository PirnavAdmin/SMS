namespace SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Models.FinanceManagement;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IFinanceRepository
{
    Task<IEnumerable<FeeHead>> GetFeeHeadsAsync();
    Task<FeeHead> CreateFeeHeadAsync(FeeHead feeHead);
    Task<FeeHead> UpdateFeeHeadAsync(FeeHead feeHead);
    Task DeleteFeeHeadAsync(int id);
    
    Task<IEnumerable<DynamicFeeStructure>> GetDynamicFeeStructuresAsync();
    Task<DynamicFeeStructure> CreateDynamicFeeStructureAsync(DynamicFeeStructure structure);
    
    Task<IEnumerable<StudentFeeAssignment>> GetStudentFeeAssignmentsAsync();
    Task<StudentFeeAssignment> CreateStudentFeeAssignmentAsync(StudentFeeAssignment assignment);
    
    Task<IEnumerable<FeePayment>> GetFeePaymentsAsync();
    Task<FeePayment> CreateFeePaymentAsync(FeePayment payment);
}
