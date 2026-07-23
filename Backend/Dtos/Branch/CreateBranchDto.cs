using System.ComponentModel.DataAnnotations;

namespace SMS.Api.Dtos.Branch
{
    public class CreateBranchDto
    {
        [Required(ErrorMessage = "Branch name is required.")]
        [StringLength(100)]
        public string BranchName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Address is required.")]
        [StringLength(200)]
        public string Address { get; set; } = string.Empty;

        [Required(ErrorMessage = "City is required.")]
        [StringLength(100)]
        public string City { get; set; } = string.Empty;

        [Required(ErrorMessage = "State is required.")]
        [StringLength(100)]
        public string State { get; set; } = string.Empty;

        [Required(ErrorMessage = "Pincode is required.")]
        [RegularExpression(@"^\d{6}$", ErrorMessage = "Pincode must be 6 digits.")]
        public string Pincode { get; set; } = string.Empty;

        [Required(ErrorMessage = "Contact number is required.")]
        [RegularExpression(@"^[6-9]\d{9}$", ErrorMessage = "Enter a valid 10-digit mobile number.")]
        public string ContactNumber { get; set; } = string.Empty;

        [EmailAddress(ErrorMessage = "Invalid email address.")]
        [StringLength(150)]
        public string? Email { get; set; }
    }
}