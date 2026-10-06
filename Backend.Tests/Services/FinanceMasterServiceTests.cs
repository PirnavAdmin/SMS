namespace Backend.Tests.Services;

using Moq;
using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Services.Implementations.FinanceManagement;
using System.Collections.Generic;
using System.Threading.Tasks;
using Xunit;

public class FinanceMasterServiceTests
{
    private readonly Mock<IFinanceMasterRepository> _repoMock;
    private readonly FinanceMasterService _service;

    public FinanceMasterServiceTests()
    {
        _repoMock = new Mock<IFinanceMasterRepository>();
        _service = new FinanceMasterService(_repoMock.Object);
    }

    [Fact]
    public async Task GetAccountsAsync_ReturnsAccountsFromRepository()
    {
        var accounts = new List<FinancialAccountDto>
        {
            new FinancialAccountDto { Id = 1, AccountName = "Main Bank Account (HDFC)", CurrentBalance = 500000m },
            new FinancialAccountDto { Id = 2, AccountName = "School Petty Cash", CurrentBalance = 25000m }
        };

        _repoMock.Setup(r => r.GetAccountsAsync()).ReturnsAsync(accounts);

        var result = await _service.GetAccountsAsync();

        Assert.Equal(2, result.Count);
        _repoMock.Verify(r => r.GetAccountsAsync(), Times.Once);
    }

    [Fact]
    public async Task DeleteAccountAsync_DelegatesToRepositoryAndReturnsTrue()
    {
        _repoMock.Setup(r => r.DeleteAccountAsync(1)).ReturnsAsync(true);

        var result = await _service.DeleteAccountAsync(1);

        Assert.True(result);
        _repoMock.Verify(r => r.DeleteAccountAsync(1), Times.Once);
    }
}
