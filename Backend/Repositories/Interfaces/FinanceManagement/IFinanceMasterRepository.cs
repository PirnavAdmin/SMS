namespace SMS.Api.Repositories.Interfaces.FinanceManagement;

using SMS.Api.Dtos.FinanceManagement;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IFinanceMasterRepository
{
    // Transactions & General Ledger
    Task<List<FinanceTransactionDto>> GetTransactionsAsync(
        string? search, string? type, string? module, string? category, string? paymentMode, string? status, int page, int pageSize);
    Task<FinanceTransactionSummaryDto> GetTransactionSummaryAsync();
    Task<FinanceTransactionDto> CreateTransactionAsync(CreateTransactionRequestDto request);
    Task<bool> ReverseTransactionAsync(int id, ReverseTransactionRequestDto request);

    // Bank Accounts & Categories
    Task<List<FinancialAccountDto>> GetAccountsAsync();
    Task<FinancialAccountDto> CreateAccountAsync(FinancialAccountDto account);
    Task<bool> UpdateAccountAsync(int id, FinancialAccountDto account);
    Task<bool> DeleteAccountAsync(int id);
    Task<List<FinancialCategoryDto>> GetCategoriesAsync(string? type);
    Task<FinancialCategoryDto> CreateCategoryAsync(FinancialCategoryDto category);
    Task<bool> UpdateCategoryAsync(int id, FinancialCategoryDto category);
    Task<bool> DeleteCategoryAsync(int id);

    // Budgets
    Task<List<FinancialBudgetDto>> GetBudgetsAsync(string? academicYear);
    Task<FinancialBudgetDto> SaveBudgetAsync(FinancialBudgetDto budget);
    Task<bool> UpdateBudgetAsync(int id, FinancialBudgetDto budget);

    // Refund Management
    Task<List<FeeRefundRequestDto>> GetRefundRequestsAsync(string? status);
    Task<FeeRefundRequestDto> CreateRefundRequestAsync(CreateRefundRequestDto request);
    Task<bool> ProcessRefundRequestAsync(int id, ProcessRefundRequestDto request);

    // Finance Setup & Settings
    Task<FeeScheduleConfigDto> GetFeeScheduleAsync(string? academicYear);
    Task<bool> SaveFeeScheduleAsync(FeeScheduleConfigDto schedule);
    Task<FinanceSettingsDto> GetFinanceSettingsAsync();
    Task<bool> UpdateFinanceSettingsAsync(FinanceSettingsDto settings);

    // Reports Hub
    Task<FinanceReportsSummaryDto> GetReportsSummaryAsync(string? academicYear);
    Task<DailyCollectionReportResponseDto> GetDailyCollectionReportAsync(string? date);
    Task<List<ClassWiseCollectionReportRowDto>> GetClassWiseCollectionReportAsync(string? academicYear);

    // Scholarships
    Task<List<ScholarshipMasterDto>> GetScholarshipsAsync(string? search, string? type, string? status);
    Task<ScholarshipMasterDto?> GetScholarshipByIdAsync(int id);
    Task<ScholarshipMasterDto> CreateScholarshipAsync(ScholarshipMasterDto scholarship);
    Task<ScholarshipMasterDto?> UpdateScholarshipAsync(int id, ScholarshipMasterDto scholarship);
    Task<bool> DeleteScholarshipAsync(int id);

    // Student Awarded Scholarships
    Task<List<StudentScholarshipAwardDto>> GetStudentScholarshipsAsync(string? search, string? className, int? scholarshipId);
    Task<StudentScholarshipAwardDto> AwardScholarshipToStudentAsync(AwardScholarshipRequestDto request);
    Task<bool> RevokeStudentScholarshipAsync(int id);

    // Discounts & Concessions
    Task<List<DiscountRuleDto>> GetDiscountsAsync(string? search, string? type, string? mode, string? status);
    Task<DiscountRuleDto?> GetDiscountByIdAsync(int id);
    Task<DiscountRuleDto> CreateDiscountAsync(DiscountRuleDto discount);
    Task<DiscountRuleDto?> UpdateDiscountAsync(int id, DiscountRuleDto discount);
    Task<bool> DeleteDiscountAsync(int id);

    // Student Granted Concessions
    Task<List<StudentDiscountDto>> GetStudentDiscountsAsync(string? search, string? className, int? discountId);
    Task<StudentDiscountDto> GrantDiscountToStudentAsync(GrantDiscountRequestDto request);
    Task<bool> RemoveStudentDiscountAsync(int id);

    // Late Fine Rules
    Task<List<FineRuleDto>> GetFineRulesAsync(string? search, string? status);
    Task<FineRuleDto?> GetFineRuleByIdAsync(int id);
    Task<FineRuleDto> CreateFineRuleAsync(FineRuleDto rule);
    Task<FineRuleDto?> UpdateFineRuleAsync(int id, FineRuleDto rule);
    Task<bool> DeleteFineRuleAsync(int id);

    // Hostel Fee Configurations
    Task<List<FinanceHostelConfigDto>> GetHostelFeeConfigsAsync(string? search, string? hostelId, string? status);
    Task<FinanceHostelConfigDto?> GetHostelFeeConfigByIdAsync(int id);
    Task<FinanceHostelConfigDto> CreateHostelFeeConfigAsync(CreateFinanceHostelConfigDto dto);
    Task<FinanceHostelConfigDto?> UpdateHostelFeeConfigAsync(int id, CreateFinanceHostelConfigDto dto);
    Task<bool> DeleteHostelFeeConfigAsync(int id);

    // Uniform Fee Configurations
    Task<List<FinanceUniformConfigDto>> GetUniformFeeConfigsAsync(string? search, string? className, string? academicYear, string? status);
    Task<FinanceUniformConfigDto?> GetUniformFeeConfigByIdAsync(int id);
    Task<FinanceUniformConfigDto> CreateUniformFeeConfigAsync(CreateFinanceUniformConfigDto dto);
    Task<FinanceUniformConfigDto?> UpdateUniformFeeConfigAsync(int id, CreateFinanceUniformConfigDto dto);
    Task<bool> DeleteUniformFeeConfigAsync(int id);
}