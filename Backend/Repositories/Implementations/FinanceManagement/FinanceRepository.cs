namespace SMS.Api.Repositories.Implementations.FinanceManagement;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class FinanceRepository : IFinanceRepository
{
    private readonly AppDbContext _context;

    public FinanceRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<FeeHead>> GetFeeHeadsAsync()
    {
        return await _context.FeeHeads.ToListAsync();
    }

    public async Task<FeeHead> CreateFeeHeadAsync(FeeHead feeHead)
    {
        _context.FeeHeads.Add(feeHead);
        await _context.SaveChangesAsync();
        return feeHead;
    }

    public async Task<FeeHead> UpdateFeeHeadAsync(FeeHead feeHead)
    {
        _context.FeeHeads.Update(feeHead);
        await _context.SaveChangesAsync();
        return feeHead;
    }

    public async Task DeleteFeeHeadAsync(int id)
    {
        var item = await _context.FeeHeads.FindAsync(id);
        if (item != null)
        {
            _context.FeeHeads.Remove(item);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<DynamicFeeStructure>> GetDynamicFeeStructuresAsync()
    {
        return await _context.DynamicFeeStructures.ToListAsync();
    }

    public async Task<DynamicFeeStructure?> GetDynamicFeeStructureByIdAsync(int id)
    {
        return await _context.DynamicFeeStructures.FindAsync(id);
    }

    public async Task<DynamicFeeStructure> CreateDynamicFeeStructureAsync(DynamicFeeStructure structure)
    {
        _context.DynamicFeeStructures.Add(structure);
        await _context.SaveChangesAsync();
        return structure;
    }

    public async Task<DynamicFeeStructure> UpdateDynamicFeeStructureAsync(DynamicFeeStructure structure)
    {
        _context.DynamicFeeStructures.Update(structure);
        await _context.SaveChangesAsync();
        return structure;
    }

    public async Task DeleteDynamicFeeStructureAsync(int id)
    {
        var item = await _context.DynamicFeeStructures.FindAsync(id);
        if (item != null)
        {
            _context.DynamicFeeStructures.Remove(item);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<StudentFeeAssignment>> GetStudentFeeAssignmentsAsync()
    {
        return await _context.StudentFeeAssignments.ToListAsync();
    }

    public async Task<StudentFeeAssignment?> GetStudentFeeAssignmentByIdAsync(int id)
    {
        return await _context.StudentFeeAssignments.FirstOrDefaultAsync(x => x.Id == id);
    }

    public async Task<StudentFeeAssignment> CreateStudentFeeAssignmentAsync(StudentFeeAssignment assignment)
    {
        _context.StudentFeeAssignments.Add(assignment);
        await _context.SaveChangesAsync();
        return assignment;
    }

    public async Task<StudentFeeAssignment> UpdateStudentFeeAssignmentAsync(StudentFeeAssignment assignment)
    {
        _context.StudentFeeAssignments.Update(assignment);
        await _context.SaveChangesAsync();
        return assignment;
    }

    public async Task DeleteStudentFeeAssignmentAsync(int id)
    {
        var item = await _context.StudentFeeAssignments.FirstOrDefaultAsync(x => x.Id == id);
        if (item != null)
        {
            _context.StudentFeeAssignments.Remove(item);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<IEnumerable<FeePayment>> GetFeePaymentsAsync()
    {
        return await _context.FeePayments.ToListAsync();
    }

    public async Task<FeePayment> CreateFeePaymentAsync(FeePayment payment)
    {
        _context.FeePayments.Add(payment);
        await _context.SaveChangesAsync();
        return payment;
    }
}