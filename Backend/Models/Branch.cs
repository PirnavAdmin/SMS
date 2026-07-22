using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Models
{
	public class Branch
	{
		[Key]
		public long BranchId { get; set; }

		public string BranchCode { get; set; } = string.Empty;
		public string BranchName { get; set; } = string.Empty;
		public bool Status { get; set; } = true;
		public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
	}
}