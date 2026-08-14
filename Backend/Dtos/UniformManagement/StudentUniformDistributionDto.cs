using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos
{
    public class StudentUniformDistributionDto
    {
        [JsonPropertyName("distributionId")]
        public int DistributionId { get; set; }

        [JsonPropertyName("id")]
        public int Id => DistributionId;

        [JsonPropertyName("studentId")]
        public int? StudentId { get; set; }

        [JsonPropertyName("admissionNo")]
        public string AdmissionNo { get; set; } = string.Empty;

        [JsonPropertyName("studentName")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = string.Empty;

        [JsonPropertyName("class")]
        public string Class => !string.IsNullOrWhiteSpace(ClassName) ? ClassName : "Class 10-A";

        [JsonPropertyName("transactionType")]
        public string TransactionType { get; set; } = "Baseline Distribution (Admission Kit)";

        [JsonPropertyName("uniformTypeId")]
        public int? UniformTypeId { get; set; }

        [JsonPropertyName("itemName")]
        public string ItemName { get; set; } = string.Empty;

        [JsonPropertyName("clothingItem")]
        public string ClothingItem => ItemName;

        [JsonPropertyName("issuedItem")]
        public string IssuedItem => ItemName;

        [JsonPropertyName("sizeSpec")]
        public string SizeSpec { get; set; } = "M";

        [JsonPropertyName("size")]
        public string Size => SizeSpec;

        [JsonPropertyName("quantity")]
        public int Quantity { get; set; } = 1;

        [JsonPropertyName("qty")]
        public int Qty => Quantity;

        [JsonPropertyName("totalAmount")]
        public decimal TotalAmount { get; set; }

        [JsonPropertyName("totalAmountString")]
        public string TotalAmountString => $"₹{TotalAmount:N0}";

        [JsonPropertyName("distributionDate")]
        public DateTime DistributionDate { get; set; } = DateTime.UtcNow;

        [JsonPropertyName("issueDate")]
        public DateTime IssueDate => DistributionDate;

        [JsonPropertyName("issueDateString")]
        public string IssueDateString => DistributionDate.ToString("dd-MM-yyyy");

        [JsonPropertyName("notes")]
        public string Notes { get; set; } = string.Empty;

        [JsonPropertyName("actionRemarks")]
        public string ActionRemarks => Notes;

        [JsonPropertyName("paymentStatus")]
        public string PaymentStatus { get; set; } = "Paid";

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Issued";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateStudentUniformDistributionDto
    {
        [JsonPropertyName("studentId")]
        public int? StudentId { get; set; }

        [JsonPropertyName("admissionNo")]
        public string? AdmissionNo { get; set; }

        [JsonPropertyName("studentName")]
        public string? StudentName { get; set; }

        [JsonPropertyName("selectStudent")]
        public string? SelectStudentAlias
        {
            get => StudentName;
            set { if (!string.IsNullOrWhiteSpace(value)) StudentName = value; }
        }

        [JsonPropertyName("className")]
        public string? ClassName { get; set; }

        [JsonPropertyName("class")]
        public string? ClassAlias
        {
            get => ClassName;
            set { if (!string.IsNullOrWhiteSpace(value)) ClassName = value; }
        }

        [JsonPropertyName("transactionType")]
        public string? TransactionType { get; set; } = "Baseline Distribution (Admission Kit)";

        [JsonPropertyName("uniformTypeId")]
        public int? UniformTypeId { get; set; }

        [JsonPropertyName("itemName")]
        public string? ItemName { get; set; }

        [JsonPropertyName("selectClothingItem")]
        public string? SelectClothingItemAlias
        {
            get => ItemName;
            set { if (!string.IsNullOrWhiteSpace(value)) ItemName = value; }
        }

        [JsonPropertyName("clothingItem")]
        public string? ClothingItemAlias
        {
            get => ItemName;
            set { if (!string.IsNullOrWhiteSpace(value)) ItemName = value; }
        }

        [JsonPropertyName("sizeSpec")]
        public string? SizeSpec { get; set; } = "M";

        [JsonPropertyName("size")]
        public string? SizeAlias
        {
            get => SizeSpec;
            set { if (!string.IsNullOrWhiteSpace(value)) SizeSpec = value; }
        }

        [JsonPropertyName("quantity")]
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int Quantity { get; set; } = 1;

        [JsonPropertyName("qty")]
        [JsonConverter(typeof(FlexibleIntConverter))]
        public int QtyAlias
        {
            get => Quantity;
            set { if (value > 0) Quantity = value; }
        }

        [JsonPropertyName("totalAmount")]
        [JsonConverter(typeof(FlexibleDecimalConverter))]
        public decimal TotalAmount { get; set; }

        [JsonPropertyName("distributionDate")]
        public DateTime? DistributionDate { get; set; }

        [JsonPropertyName("notes")]
        public string? Notes { get; set; }

        [JsonPropertyName("actionRemarks")]
        public string? ActionRemarksAlias
        {
            get => Notes;
            set { if (!string.IsNullOrWhiteSpace(value)) Notes = value; }
        }

        [JsonPropertyName("paymentStatus")]
        public string? PaymentStatus { get; set; } = "Paid";

        [JsonPropertyName("status")]
        public string? Status { get; set; } = "Issued";
    }
}
