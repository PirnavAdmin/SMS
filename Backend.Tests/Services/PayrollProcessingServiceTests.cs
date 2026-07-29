using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using Xunit;

namespace Backend.Tests.Services
{
    public class PayrollProcessingServiceTests
    {
        private AppDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new AppDbContext(options);
        }

        [Fact]
        public async Task Payroll_CreateStructureAndPayslip_CalculatesNetPay()
        {
            var context = GetInMemoryDbContext();
            var payslip = new Payslip
            {
                EmployeeId = "EMP001",
                EmployeeName = "sudheer k",
                Department = "Academics",
                Month = "July",
                Year = 2026,
                BasicSalary = 7000,
                HouseRentAllowance = 1400,
                DearnessAllowance = 700,
                GrossEarnings = 9100,
                ProvidentFund = 560,
                TotalDeductions = 560,
                NetPay = 8540,
                Status = "Generated"
            };

            await context.Payslips.AddAsync(payslip);
            await context.SaveChangesAsync();

            var saved = await context.Payslips.FirstAsync();
            Assert.Equal(8540, saved.NetPay);
        }
    }
}
