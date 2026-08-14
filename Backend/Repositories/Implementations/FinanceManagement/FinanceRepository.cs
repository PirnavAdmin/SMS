namespace SMS.Api.Repositories.Implementations.FinanceManagement;
using SMS.Api.Data;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Threading.Tasks;

public class FinanceRepository : IFinanceRepository
{
    private readonly AppDbContext _context;
    public FinanceRepository(AppDbContext context) { _context = context; }
    
    public async Task<IEnumerable<FeeHead>> GetFeeHeadsAsync() => await _context.FeeHeads.ToListAsync();
    public async Task<FeeHead> CreateFeeHeadAsync(FeeHead feeHead) { _context.FeeHeads.Add(feeHead); await _context.SaveChangesAsync(); return feeHead; }
    public async Task<FeeHead> UpdateFeeHeadAsync(FeeHead feeHead) { _context.FeeHeads.Update(feeHead); await _context.SaveChangesAsync(); return feeHead; }
    public async Task DeleteFeeHeadAsync(int id) { var item = await _context.FeeHeads.FindAsync(id); if (item != null) { _context.FeeHeads.Remove(item); await _context.SaveChangesAsync(); } }
    
    public async Task<IEnumerable<DynamicFeeStructure>> GetDynamicFeeStructuresAsync() => await _context.DynamicFeeStructures.ToListAsync();
    public async Task<DynamicFeeStructure> CreateDynamicFeeStructureAsync(DynamicFeeStructure structure) { _context.DynamicFeeStructures.Add(structure); await _context.SaveChangesAsync(); return structure; }
    
    public async Task<IEnumerable<StudentFeeAssignment>> GetStudentFeeAssignmentsAsync() => await _context.StudentFeeAssignments.ToListAsync();
    public async Task<StudentFeeAssignment> CreateStudentFeeAssignmentAsync(StudentFeeAssignment assignment) { _context.StudentFeeAssignments.Add(assignment); await _context.SaveChangesAsync(); return assignment; }
    
    public async Task<IEnumerable<FeePayment>> GetFeePaymentsAsync() => await _context.FeePayments.ToListAsync();
    public async Task<FeePayment> CreateFeePaymentAsync(FeePayment payment) { _context.FeePayments.Add(payment); await _context.SaveChangesAsync(); return payment; }
}
