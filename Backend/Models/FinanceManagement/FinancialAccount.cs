using System;
using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models.FinanceManagement;

public class FinancialAccount
{
    [Key]
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = "Bank"; // Cash, Bank, Petty Cash
    public string BankName { get; set; } = string.Empty;
    public string AccountNumberMasked { get; set; } = string.Empty;
    public decimal OpeningBalance { get; set; }
    public decimal CurrentBalance { get; set; }
    public string Status { get; set; } = "Active";
}
