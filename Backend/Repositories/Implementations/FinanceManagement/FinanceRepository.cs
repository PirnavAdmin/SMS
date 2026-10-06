namespace SMS.Api.Repositories.Implementations.FinanceManagement;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
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
        var existing = await _context.FeeHeads.FindAsync(feeHead.Id);
        if (existing != null)
        {
            existing.Code = feeHead.Code;
            existing.Name = feeHead.Name;
            existing.Category = feeHead.Category;
            existing.Frequency = feeHead.Frequency;
            existing.DefaultAmount = feeHead.DefaultAmount;
            existing.Mandatory = feeHead.Mandatory;
            existing.IsRefundable = feeHead.IsRefundable;
            existing.IsTaxable = feeHead.IsTaxable;
            existing.TaxPercentage = feeHead.TaxPercentage;
            existing.DisplayOrder = feeHead.DisplayOrder;
            existing.Status = feeHead.Status;
            existing.Description = feeHead.Description;
            await _context.SaveChangesAsync();
            return existing;
        }

        _context.FeeHeads.Update(feeHead);
        await _context.SaveChangesAsync();
        return feeHead;
    }

    public async Task DeleteFeeHeadAsync(int id)
    {
        var item = await _context.FeeHeads.FindAsync(id);
        if (item != null)
        {
            var headIdStr = id.ToString();
            var headName = item.Name?.Trim();

            // Cascade removal: clean up any Fee Structure containing this deleted fee head
            var structures = await _context.DynamicFeeStructures.ToListAsync();
            foreach (var s in structures)
            {
                if (string.IsNullOrWhiteSpace(s.ItemsJson))
                    continue;

                try
                {
                    var items = JsonSerializer.Deserialize<List<FeeStructureItemDto>>(s.ItemsJson);
                    if (items != null && items.Count > 0)
                    {
                        var remainingItems = items.Where(i =>
                            !string.Equals(i.FeeHeadId, headIdStr, StringComparison.OrdinalIgnoreCase) &&
                            (string.IsNullOrEmpty(headName) || !string.Equals(i.FeeHeadName?.Trim(), headName, StringComparison.OrdinalIgnoreCase))
                        ).ToList();

                        if (remainingItems.Count != items.Count)
                        {
                            var cat = (s.TargetAudience ?? "").Trim().ToLowerInvariant();
                            bool isTuitionOrOthers = cat == "" || cat == "tuition" || cat == "tuition fee" || cat == "others" || cat == "other" || cat == "general";

                            if (remainingItems.Count == 0 && isTuitionOrOthers)
                            {
                                _context.DynamicFeeStructures.Remove(s);
                                var linked = await _context.StudentFeeAssignments.Where(a => a.DynamicFeeStructureId == s.Id).ToListAsync();
                                if (linked.Count > 0)
                                {
                                    _context.StudentFeeAssignments.RemoveRange(linked);
                                }
                            }
                            else
                            {
                                s.ItemsJson = JsonSerializer.Serialize(remainingItems);
                                s.TotalAmount = remainingItems.Sum(x => x.Amount);
                                _context.DynamicFeeStructures.Update(s);

                                var linked = await _context.StudentFeeAssignments.Where(a => a.DynamicFeeStructureId == s.Id).ToListAsync();
                                foreach (var la in linked)
                                {
                                    la.TotalAmount = s.TotalAmount;
                                    la.DueAmount = Math.Max(0m, s.TotalAmount - la.PaidAmount);
                                    _context.StudentFeeAssignments.Update(la);
                                }
                            }
                        }
                    }
                }
                catch
                {
                    // Ignore JSON parsing failures on legacy structures
                }
            }

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
        var existing = await _context.DynamicFeeStructures.FindAsync(structure.Id);
        if (existing != null)
        {
            existing.Name = structure.Name;
            existing.Description = structure.Description;
            existing.TargetAudience = structure.TargetAudience;
            existing.AcademicYear = structure.AcademicYear;
            existing.Branch = structure.Branch;
            existing.ClassName = structure.ClassName;
            existing.Section = structure.Section;
            existing.StudentCategory = structure.StudentCategory;
            existing.TotalAmount = structure.TotalAmount;
            existing.Status = structure.Status;
            existing.ItemsJson = structure.ItemsJson;
            await _context.SaveChangesAsync();
            return existing;
        }

        _context.DynamicFeeStructures.Add(structure);
        await _context.SaveChangesAsync();
        return structure;
    }

    public async Task DeleteDynamicFeeStructureAsync(int id)
    {
        var item = await _context.DynamicFeeStructures.FindAsync(id);
        if (item != null)
        {
            _context.DynamicFeeStructures.Remove(item);
        }

        var linkedAssignments = await _context.StudentFeeAssignments
            .Where(a => a.DynamicFeeStructureId == id)
            .ToListAsync();
        if (linkedAssignments.Count > 0)
        {
            _context.StudentFeeAssignments.RemoveRange(linkedAssignments);
        }

        await _context.SaveChangesAsync();
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
        if (!string.IsNullOrEmpty(payment.StudentId) && int.TryParse(payment.StudentId, out int rawId))
        {
            bool existsInStudents = await _context.Students.AnyAsync(s => s.StudentId == rawId);
            if (!existsInStudents)
            {
                var admission = await _context.Admissions.FirstOrDefaultAsync(a => a.AdmissionId == rawId);
                if (admission != null && !string.IsNullOrEmpty(admission.ApplicationNo))
                {
                    var resolvedStudent = await _context.Students.FirstOrDefaultAsync(s =>
                        s.AdmissionNumber == admission.ApplicationNo);
                    if (resolvedStudent != null)
                    {
                        payment.StudentId = resolvedStudent.StudentId.ToString();
                    }
                }
            }
        }

        _context.FeePayments.Add(payment);
        await _context.SaveChangesAsync();
        return payment;
    }
}