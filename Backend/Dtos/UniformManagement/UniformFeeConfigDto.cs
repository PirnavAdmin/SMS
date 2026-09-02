using System;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using SMS.Api.Common;

namespace SMS.Api.Dtos
{
    public class UniformFeeConfigDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = "Class 10";

        [JsonPropertyName("classGrade")]
        public string ClassGrade => ClassName;

        [JsonPropertyName("packageOrItemName")]
        public string PackageOrItemName { get; set; } = "Full Kit";

        [JsonPropertyName("uniformPackage")]
        public string UniformPackage => PackageOrItemName;

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";

        [JsonPropertyName("academicYear")]
        public string AcademicYear { get; set; } = "2025-2026";

        [JsonPropertyName("feeAmount")]
        [JsonConverter(typeof(FlexibleDecimalConverter))]
        public decimal FeeAmount { get; set; } = 3500.00m;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUniformFeeConfigDto
    {
        [Required(ErrorMessage = "Class Name is required.")]
        [JsonPropertyName("className")]
        public string ClassName { get; set; } = "Class 10";

        [JsonPropertyName("classGrade")]
        public string? ClassGradeAlias
        {
            get => ClassName;
            set { if (!string.IsNullOrWhiteSpace(value)) ClassName = value; }
        }

        [Required(ErrorMessage = "Uniform Package / Item Name is required.")]
        [JsonPropertyName("packageOrItemName")]
        public string PackageOrItemName { get; set; } = "Full Kit";

        [JsonPropertyName("uniformPackage")]
        public string? UniformPackageAlias
        {
            get => PackageOrItemName;
            set { if (!string.IsNullOrWhiteSpace(value)) PackageOrItemName = value; }
        }

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";

        [JsonPropertyName("academicYear")]
        public string AcademicYear { get; set; } = "2025-2026";

        [JsonPropertyName("feeAmount")]
        [JsonConverter(typeof(FlexibleDecimalConverter))]
        public decimal FeeAmount { get; set; } = 3500.00m;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";
    }
}
