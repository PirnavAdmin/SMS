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
        var list = await _context.FeeHeads.ToListAsync();
        if (list.Count == 0)
        {
            var seed = new List<FeeHead>
            {
                new FeeHead { Name = "Tuition Fee", Category = "Tuition", Frequency = "Quarterly", DefaultAmount = 25000, Status = "Active", Description = "{\"code\":\"FH-101\",\"mandatory\":true,\"displayOrder\":1,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Admission Fee", Category = "Admission", Frequency = "One Time", DefaultAmount = 5000, Status = "Active", Description = "{\"code\":\"FH-102\",\"mandatory\":true,\"displayOrder\":2,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Textbook & Material Fee", Category = "Books", Frequency = "Annual", DefaultAmount = 4000, Status = "Active", Description = "{\"code\":\"FH-103\",\"mandatory\":true,\"displayOrder\":3,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Uniform Package Fee", Category = "Uniform", Frequency = "Annual", DefaultAmount = 3500, Status = "Active", Description = "{\"code\":\"FH-104\",\"mandatory\":true,\"displayOrder\":4,\"taxPercentage\":5,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Science & Computer Lab Fee", Category = "Lab", Frequency = "Quarterly", DefaultAmount = 2000, Status = "Active", Description = "{\"code\":\"FH-105\",\"mandatory\":false,\"displayOrder\":5,\"taxPercentage\":0,\"applicableClasses\":[\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Library & Digital Resource Fee", Category = "Library", Frequency = "Annual", DefaultAmount = 1500, Status = "Active", Description = "{\"code\":\"FH-106\",\"mandatory\":true,\"displayOrder\":6,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Sports & Physical Fitness Fee", Category = "Sports", Frequency = "Annual", DefaultAmount = 1500, Status = "Active", Description = "{\"code\":\"FH-107\",\"mandatory\":false,\"displayOrder\":7,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Examination & Assessment Fee", Category = "Exam", Frequency = "Half Yearly", DefaultAmount = 2500, Status = "Active", Description = "{\"code\":\"FH-108\",\"mandatory\":true,\"displayOrder\":8,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Bus Transportation Fee", Category = "Transport", Frequency = "Monthly", DefaultAmount = 3000, Status = "Active", Description = "{\"code\":\"FH-109\",\"mandatory\":false,\"displayOrder\":9,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Hostel Accommodation Fee", Category = "Hostel", Frequency = "Quarterly", DefaultAmount = 18000, Status = "Active", Description = "{\"code\":\"FH-110\",\"mandatory\":false,\"displayOrder\":10,\"taxPercentage\":0,\"applicableClasses\":[\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Co-Curricular & Activity Fee", Category = "Activity", Frequency = "Annual", DefaultAmount = 1200, Status = "Active", Description = "{\"code\":\"FH-111\",\"mandatory\":false,\"displayOrder\":11,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" },
                new FeeHead { Name = "Miscellaneous & Contingency Fee", Category = "Miscellaneous", Frequency = "Custom", DefaultAmount = 1000, Status = "Active", Description = "{\"code\":\"FH-112\",\"mandatory\":false,\"displayOrder\":12,\"taxPercentage\":0,\"applicableClasses\":[\"Nursery\",\"LKG\",\"UKG\",\"Class 1\",\"Class 2\",\"Class 3\",\"Class 4\",\"Class 5\",\"Class 6\",\"Class 7\",\"Class 8\",\"Class 9\",\"Class 10\"]}" }
            };

            await _context.FeeHeads.AddRangeAsync(seed);
            await _context.SaveChangesAsync();
            list = await _context.FeeHeads.ToListAsync();
        }
        return list;
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
        var list = await _context.DynamicFeeStructures.ToListAsync();
        if (list.Count == 0)
        {
            var seedStructures = new List<DynamicFeeStructure>
            {
                new DynamicFeeStructure
                {
                    Name = "Class 1 Fee Structure",
                    ClassName = "Class 1",
                    AcademicYear = "2026-2027",
                    Branch = "Main Campus",
                    Section = "All Sections",
                    StudentCategory = "General",
                    TotalAmount = 38000m,
                    Status = "Active",
                    ItemsJson = "[{\"FeeHeadId\":1,\"FeeHeadName\":\"Tuition Fee\",\"Category\":\"Tuition\",\"Amount\":25000},{\"FeeHeadId\":2,\"FeeHeadName\":\"Admission Fee\",\"Category\":\"Admission\",\"Amount\":5000},{\"FeeHeadId\":3,\"FeeHeadName\":\"Textbook & Material Fee\",\"Category\":\"Books\",\"Amount\":4000},{\"FeeHeadId\":4,\"FeeHeadName\":\"Uniform Package Fee\",\"Category\":\"Uniform\",\"Amount\":3500},{\"FeeHeadId\":6,\"FeeHeadName\":\"Library & Digital Resource Fee\",\"Category\":\"Library\",\"Amount\":500}]"
                },
                new DynamicFeeStructure
                {
                    Name = "Class 2 Fee Structure",
                    ClassName = "Class 2",
                    AcademicYear = "2026-2027",
                    Branch = "Main Campus",
                    Section = "All Sections",
                    StudentCategory = "General",
                    TotalAmount = 67190m,
                    Status = "Active",
                    ItemsJson = "[{\"FeeHeadId\":1,\"FeeHeadName\":\"Tuition Fee\",\"Category\":\"Tuition\",\"Amount\":45000},{\"FeeHeadId\":2,\"FeeHeadName\":\"Admission Fee\",\"Category\":\"Admission\",\"Amount\":5000},{\"FeeHeadId\":3,\"FeeHeadName\":\"Textbook & Material Fee\",\"Category\":\"Books\",\"Amount\":4000},{\"FeeHeadId\":4,\"FeeHeadName\":\"Uniform Package Fee\",\"Category\":\"Uniform\",\"Amount\":3500},{\"FeeHeadId\":5,\"FeeHeadName\":\"Science & Computer Lab Fee\",\"Category\":\"Lab\",\"Amount\":2000},{\"FeeHeadId\":6,\"FeeHeadName\":\"Library & Digital Resource Fee\",\"Category\":\"Library\",\"Amount\":1500},{\"FeeHeadId\":8,\"FeeHeadName\":\"Examination & Assessment Fee\",\"Category\":\"Exam\",\"Amount\":2500},{\"FeeHeadId\":9,\"FeeHeadName\":\"Bus Transportation Fee\",\"Category\":\"Transport\",\"Amount\":3690}]"
                },
                new DynamicFeeStructure
                {
                    Name = "Class 3 Fee Structure",
                    ClassName = "Class 3",
                    AcademicYear = "2026-2027",
                    Branch = "Main Campus",
                    Section = "All Sections",
                    StudentCategory = "General",
                    TotalAmount = 42000m,
                    Status = "Active",
                    ItemsJson = "[{\"FeeHeadId\":1,\"FeeHeadName\":\"Tuition Fee\",\"Category\":\"Tuition\",\"Amount\":28000},{\"FeeHeadId\":2,\"FeeHeadName\":\"Admission Fee\",\"Category\":\"Admission\",\"Amount\":5000},{\"FeeHeadId\":3,\"FeeHeadName\":\"Textbook & Material Fee\",\"Category\":\"Books\",\"Amount\":4000},{\"FeeHeadId\":4,\"FeeHeadName\":\"Uniform Package Fee\",\"Category\":\"Uniform\",\"Amount\":3500},{\"FeeHeadId\":6,\"FeeHeadName\":\"Library & Digital Resource Fee\",\"Category\":\"Library\",\"Amount\":1500}]"
                },
                new DynamicFeeStructure
                {
                    Name = "Class 4 Fee Structure",
                    ClassName = "Class 4",
                    AcademicYear = "2026-2027",
                    Branch = "Main Campus",
                    Section = "All Sections",
                    StudentCategory = "General",
                    TotalAmount = 45000m,
                    Status = "Active",
                    ItemsJson = "[{\"FeeHeadId\":1,\"FeeHeadName\":\"Tuition Fee\",\"Category\":\"Tuition\",\"Amount\":30000},{\"FeeHeadId\":2,\"FeeHeadName\":\"Admission Fee\",\"Category\":\"Admission\",\"Amount\":5000},{\"FeeHeadId\":3,\"FeeHeadName\":\"Textbook & Material Fee\",\"Category\":\"Books\",\"Amount\":4500},{\"FeeHeadId\":4,\"FeeHeadName\":\"Uniform Package Fee\",\"Category\":\"Uniform\",\"Amount\":3500},{\"FeeHeadId\":6,\"FeeHeadName\":\"Library & Digital Resource Fee\",\"Category\":\"Library\",\"Amount\":2000}]"
                },
                new DynamicFeeStructure
                {
                    Name = "Class 5 Fee Structure",
                    ClassName = "Class 5",
                    AcademicYear = "2026-2027",
                    Branch = "Main Campus",
                    Section = "All Sections",
                    StudentCategory = "General",
                    TotalAmount = 48000m,
                    Status = "Active",
                    ItemsJson = "[{\"FeeHeadId\":1,\"FeeHeadName\":\"Tuition Fee\",\"Category\":\"Tuition\",\"Amount\":32000},{\"FeeHeadId\":2,\"FeeHeadName\":\"Admission Fee\",\"Category\":\"Admission\",\"Amount\":5000},{\"FeeHeadId\":3,\"FeeHeadName\":\"Textbook & Material Fee\",\"Category\":\"Books\",\"Amount\":5000},{\"FeeHeadId\":4,\"FeeHeadName\":\"Uniform Package Fee\",\"Category\":\"Uniform\",\"Amount\":3500},{\"FeeHeadId\":8,\"FeeHeadName\":\"Examination & Assessment Fee\",\"Category\":\"Exam\",\"Amount\":2500}]"
                },
                new DynamicFeeStructure
                {
                    Name = "Class 9 Fee Structure",
                    ClassName = "Class 9",
                    AcademicYear = "2026-2027",
                    Branch = "Main Campus",
                    Section = "All Sections",
                    StudentCategory = "General",
                    TotalAmount = 62000m,
                    Status = "Active",
                    ItemsJson = "[{\"FeeHeadId\":1,\"FeeHeadName\":\"Tuition Fee\",\"Category\":\"Tuition\",\"Amount\":42000},{\"FeeHeadId\":2,\"FeeHeadName\":\"Admission Fee\",\"Category\":\"Admission\",\"Amount\":5000},{\"FeeHeadId\":3,\"FeeHeadName\":\"Textbook & Material Fee\",\"Category\":\"Books\",\"Amount\":6000},{\"FeeHeadId\":4,\"FeeHeadName\":\"Uniform Package Fee\",\"Category\":\"Uniform\",\"Amount\":4000},{\"FeeHeadId\":5,\"FeeHeadName\":\"Science & Computer Lab Fee\",\"Category\":\"Lab\",\"Amount\":2500},{\"FeeHeadId\":8,\"FeeHeadName\":\"Examination & Assessment Fee\",\"Category\":\"Exam\",\"Amount\":2500}]"
                },
                new DynamicFeeStructure
                {
                    Name = "Class 10 Fee Structure",
                    ClassName = "Class 10",
                    AcademicYear = "2026-2027",
                    Branch = "Main Campus",
                    Section = "All Sections",
                    StudentCategory = "General",
                    TotalAmount = 78000m,
                    Status = "Active",
                    ItemsJson = "[{\"FeeHeadId\":1,\"FeeHeadName\":\"Tuition Fee\",\"Category\":\"Tuition\",\"Amount\":52000},{\"FeeHeadId\":2,\"FeeHeadName\":\"Admission Fee\",\"Category\":\"Admission\",\"Amount\":6000},{\"FeeHeadId\":3,\"FeeHeadName\":\"Textbook & Material Fee\",\"Category\":\"Books\",\"Amount\":7000},{\"FeeHeadId\":4,\"FeeHeadName\":\"Uniform Package Fee\",\"Category\":\"Uniform\",\"Amount\":4000},{\"FeeHeadId\":5,\"FeeHeadName\":\"Science & Computer Lab Fee\",\"Category\":\"Lab\",\"Amount\":4000},{\"FeeHeadId\":6,\"FeeHeadName\":\"Library & Digital Resource Fee\",\"Category\":\"Library\",\"Amount\":2000},{\"FeeHeadId\":8,\"FeeHeadName\":\"Examination & Assessment Fee\",\"Category\":\"Exam\",\"Amount\":3000}]"
                }
            };

            await _context.DynamicFeeStructures.AddRangeAsync(seedStructures);
            await _context.SaveChangesAsync();
            list = await _context.DynamicFeeStructures.ToListAsync();
        }
        return list;
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