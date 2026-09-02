namespace SMS.Api.Services.Implementations.FinanceManagement;

using SMS.Api.Dtos.FinanceManagement;
using SMS.Api.Repositories.Interfaces.FinanceManagement;
using SMS.Api.Services.Interfaces.FinanceManagement;
using System.Collections.Generic;
using System.Threading.Tasks;

public class FinanceMasterService : IFinanceMasterService
{
    private readonly IFinanceMasterRepository _repository;

    public FinanceMasterService(IFinanceMasterRepository repository)
    {
        _repository = repository;
    }

    public Task<List<FinanceTransactionDto>> GetTransactionsAsync(
        string? search, string? type, string? module, string? category, string? paymentMode, string? status, int page, int pageSize)
    {
        return _repository.GetTransactionsAsync(search, type, module, category, paymentMode, status, page, pageSize);
    }

    public Task<FinanceTransactionSummaryDto> GetTransactionSummaryAsync()
    {
        return _repository.GetTransactionSummaryAsync();
    }

    public Task<FinanceTransactionDto> CreateTransactionAsync(CreateTransactionRequestDto request)
    {
        return _repository.CreateTransactionAsync(request);
    }

    public Task<bool> ReverseTransactionAsync(int id, ReverseTransactionRequestDto request)
    {
        return _repository.ReverseTransactionAsync(id, request);
    }

    public Task<List<FinancialAccountDto>> GetAccountsAsync()
    {
        return _repository.GetAccountsAsync();
    }

    public Task<FinancialAccountDto> CreateAccountAsync(FinancialAccountDto account)
    {
        return _repository.CreateAccountAsync(account);
    }

    public Task<bool> UpdateAccountAsync(int id, FinancialAccountDto account)
    {
        return _repository.UpdateAccountAsync(id, account);
    }

    public Task<bool> DeleteAccountAsync(int id)
    {
        return _repository.DeleteAccountAsync(id);
    }

    public Task<List<FinancialCategoryDto>> GetCategoriesAsync(string? type)
    {
        return _repository.GetCategoriesAsync(type);
    }

    public Task<FinancialCategoryDto> CreateCategoryAsync(FinancialCategoryDto category)
    {
        return _repository.CreateCategoryAsync(category);
    }

    public Task<bool> UpdateCategoryAsync(int id, FinancialCategoryDto category)
    {
        return _repository.UpdateCategoryAsync(id, category);
    }

    public Task<bool> DeleteCategoryAsync(int id)
    {
        return _repository.DeleteCategoryAsync(id);
    }

    public Task<List<FinancialBudgetDto>> GetBudgetsAsync(string? academicYear)
    {
        return _repository.GetBudgetsAsync(academicYear);
    }

    public Task<FinancialBudgetDto> SaveBudgetAsync(FinancialBudgetDto budget)
    {
        return _repository.SaveBudgetAsync(budget);
    }

    public Task<bool> UpdateBudgetAsync(int id, FinancialBudgetDto budget)
    {
        return _repository.UpdateBudgetAsync(id, budget);
    }

    public Task<List<FeeRefundRequestDto>> GetRefundRequestsAsync(string? status)
    {
        return _repository.GetRefundRequestsAsync(status);
    }

    public Task<FeeRefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto request)
    {
        return _repository.CreateRefundRequestAsync(request);
    }

    public Task<bool> ProcessRefundRequestAsync(int id, ProcessRefundRequestDto request)
    {
        return _repository.ProcessRefundRequestAsync(id, request);
    }

    public Task<FeeScheduleConfigDto> GetFeeScheduleAsync(string? academicYear)
    {
        return _repository.GetFeeScheduleAsync(academicYear);
    }

    public Task<bool> SaveFeeScheduleAsync(FeeScheduleConfigDto schedule)
    {
        return _repository.SaveFeeScheduleAsync(schedule);
    }

    public Task<FinanceSettingsDto> GetFinanceSettingsAsync()
    {
        return _repository.GetFinanceSettingsAsync();
    }

    public Task<bool> UpdateFinanceSettingsAsync(FinanceSettingsDto settings)
    {
        return _repository.UpdateFinanceSettingsAsync(settings);
    }

    public Task<FinanceReportsSummaryDto> GetReportsSummaryAsync(string? academicYear)
    {
        return _repository.GetReportsSummaryAsync(academicYear);
    }

    public Task<DailyCollectionReportResponseDto> GetDailyCollectionReportAsync(string? date)
    {
        return _repository.GetDailyCollectionReportAsync(date);
    }

    public Task<List<ClassWiseCollectionReportRowDto>> GetClassWiseCollectionReportAsync(string? academicYear)
    {
        return _repository.GetClassWiseCollectionReportAsync(academicYear);
    }

    public Task<List<ScholarshipMasterDto>> GetScholarshipsAsync(string? search, string? type, string? status)
    {
        return _repository.GetScholarshipsAsync(search, type, status);
    }

    public Task<ScholarshipMasterDto?> GetScholarshipByIdAsync(int id)
    {
        return _repository.GetScholarshipByIdAsync(id);
    }

    public Task<ScholarshipMasterDto> CreateScholarshipAsync(ScholarshipMasterDto scholarship)
    {
        return _repository.CreateScholarshipAsync(scholarship);
    }

    public Task<ScholarshipMasterDto?> UpdateScholarshipAsync(int id, ScholarshipMasterDto scholarship)
    {
        return _repository.UpdateScholarshipAsync(id, scholarship);
    }

    public Task<bool> DeleteScholarshipAsync(int id)
    {
        return _repository.DeleteScholarshipAsync(id);
    }

    public Task<List<StudentScholarshipAwardDto>> GetStudentScholarshipsAsync(string? search, string? className, int? scholarshipId)
    {
        return _repository.GetStudentScholarshipsAsync(search, className, scholarshipId);
    }

    public Task<StudentScholarshipAwardDto> AwardScholarshipToStudentAsync(AwardScholarshipRequestDto request)
    {
        return _repository.AwardScholarshipToStudentAsync(request);
    }

    public Task<bool> RevokeStudentScholarshipAsync(int id)
    {
        return _repository.RevokeStudentScholarshipAsync(id);
    }

    public Task<List<DiscountRuleDto>> GetDiscountsAsync(string? search, string? type, string? mode, string? status)
    {
        return _repository.GetDiscountsAsync(search, type, mode, status);
    }

    public Task<DiscountRuleDto?> GetDiscountByIdAsync(int id)
    {
        return _repository.GetDiscountByIdAsync(id);
    }

    public Task<DiscountRuleDto> CreateDiscountAsync(DiscountRuleDto discount)
    {
        return _repository.CreateDiscountAsync(discount);
    }

    public Task<DiscountRuleDto?> UpdateDiscountAsync(int id, DiscountRuleDto discount)
    {
        return _repository.UpdateDiscountAsync(id, discount);
    }

    public Task<bool> DeleteDiscountAsync(int id)
    {
        return _repository.DeleteDiscountAsync(id);
    }

    public Task<List<StudentDiscountDto>> GetStudentDiscountsAsync(string? search, string? className, int? discountId)
    {
        return _repository.GetStudentDiscountsAsync(search, className, discountId);
    }

    public Task<StudentDiscountDto> GrantDiscountToStudentAsync(GrantDiscountRequestDto request)
    {
        return _repository.GrantDiscountToStudentAsync(request);
    }

    public Task<bool> RemoveStudentDiscountAsync(int id)
    {
        return _repository.RemoveStudentDiscountAsync(id);
    }

    public Task<List<FineRuleDto>> GetFineRulesAsync(string? search, string? status)
    {
        return _repository.GetFineRulesAsync(search, status);
    }

    public Task<FineRuleDto?> GetFineRuleByIdAsync(int id)
    {
        return _repository.GetFineRuleByIdAsync(id);
    }

    public Task<FineRuleDto> CreateFineRuleAsync(FineRuleDto rule)
    {
        return _repository.CreateFineRuleAsync(rule);
    }

    public Task<FineRuleDto?> UpdateFineRuleAsync(int id, FineRuleDto rule)
    {
        return _repository.UpdateFineRuleAsync(id, rule);
    }

    public Task<bool> DeleteFineRuleAsync(int id)
    {
        return _repository.DeleteFineRuleAsync(id);
    }

    public Task<List<FinanceHostelConfigDto>> GetHostelFeeConfigsAsync(string? search, string? hostelId, string? status)
    {
        return _repository.GetHostelFeeConfigsAsync(search, hostelId, status);
    }

    public Task<FinanceHostelConfigDto?> GetHostelFeeConfigByIdAsync(int id)
    {
        return _repository.GetHostelFeeConfigByIdAsync(id);
    }

    public Task<FinanceHostelConfigDto> CreateHostelFeeConfigAsync(CreateFinanceHostelConfigDto dto)
    {
        return _repository.CreateHostelFeeConfigAsync(dto);
    }

    public Task<FinanceHostelConfigDto?> UpdateHostelFeeConfigAsync(int id, CreateFinanceHostelConfigDto dto)
    {
        return _repository.UpdateHostelFeeConfigAsync(id, dto);
    }

    public Task<bool> DeleteHostelFeeConfigAsync(int id)
    {
        return _repository.DeleteHostelFeeConfigAsync(id);
    }

    public Task<List<FinanceUniformConfigDto>> GetUniformFeeConfigsAsync(string? search, string? className, string? academicYear, string? status)
    {
        return _repository.GetUniformFeeConfigsAsync(search, className, academicYear, status);
    }

    public Task<FinanceUniformConfigDto?> GetUniformFeeConfigByIdAsync(int id)
    {
        return _repository.GetUniformFeeConfigByIdAsync(id);
    }

    public Task<FinanceUniformConfigDto> CreateUniformFeeConfigAsync(CreateFinanceUniformConfigDto dto)
    {
        return _repository.CreateUniformFeeConfigAsync(dto);
    }

    public Task<FinanceUniformConfigDto?> UpdateUniformFeeConfigAsync(int id, CreateFinanceUniformConfigDto dto)
    {
        return _repository.UpdateUniformFeeConfigAsync(id, dto);
    }

    public Task<bool> DeleteUniformFeeConfigAsync(int id)
    {
        return _repository.DeleteUniformFeeConfigAsync(id);
    }
}