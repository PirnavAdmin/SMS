namespace SMS.Api.Models;

using System.ComponentModel.DataAnnotations;

public class Branch
{
	[Key]
	public int BranchId { get; set; }

	[Required]
	public string BranchName { get; set; } = string.Empty; // e.g., "Main Campus"
}