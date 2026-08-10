using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class UniformSizeDto
    {
        [JsonPropertyName("sizeId")]
        public int SizeId { get; set; }

        [JsonPropertyName("id")]
        public int Id => SizeId;

        [JsonPropertyName("sizeName")]
        public string SizeName { get; set; } = string.Empty;

        [JsonPropertyName("sizeCodeName")]
        public string SizeCodeName => SizeName;

        [JsonPropertyName("chestSpec")]
        public string ChestSpec { get; set; } = string.Empty;

        [JsonPropertyName("chestWidth")]
        public string ChestWidth => ChestSpec;

        [JsonPropertyName("waistSpec")]
        public string WaistSpec { get; set; } = string.Empty;

        [JsonPropertyName("waistSpecs")]
        public string WaistSpecs => WaistSpec;

        [JsonPropertyName("heightTarget")]
        public string HeightTarget { get; set; } = string.Empty;

        [JsonPropertyName("heightBounds")]
        public string HeightBounds => HeightTarget;

        [JsonPropertyName("ageBracket")]
        public string AgeBracket { get; set; } = string.Empty;

        [JsonPropertyName("ageGroup")]
        public string AgeGroup => AgeBracket;

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUniformSizeDto
    {
        [Required(ErrorMessage = "Size Code Name is required.")]
        [JsonPropertyName("sizeName")]
        public string SizeName { get; set; } = string.Empty;

        [JsonPropertyName("sizeCodeName")]
        public string? SizeCodeNameAlias
        {
            get => SizeName;
            set { if (!string.IsNullOrWhiteSpace(value)) SizeName = value; }
        }

        [JsonPropertyName("chestSpec")]
        public string? ChestSpec { get; set; }

        [JsonPropertyName("chestWidth")]
        public string? ChestWidthAlias
        {
            get => ChestSpec;
            set { if (!string.IsNullOrWhiteSpace(value)) ChestSpec = value; }
        }

        [JsonPropertyName("waistSpec")]
        public string? WaistSpec { get; set; }

        [JsonPropertyName("waistSpecs")]
        public string? WaistSpecsAlias
        {
            get => WaistSpec;
            set { if (!string.IsNullOrWhiteSpace(value)) WaistSpec = value; }
        }

        [JsonPropertyName("heightTarget")]
        public string? HeightTarget { get; set; }

        [JsonPropertyName("heightBounds")]
        public string? HeightBoundsAlias
        {
            get => HeightTarget;
            set { if (!string.IsNullOrWhiteSpace(value)) HeightTarget = value; }
        }

        [JsonPropertyName("ageBracket")]
        public string? AgeBracket { get; set; }

        [JsonPropertyName("ageGroup")]
        public string? AgeGroupAlias
        {
            get => AgeBracket;
            set { if (!string.IsNullOrWhiteSpace(value)) AgeBracket = value; }
        }

        [JsonPropertyName("gender")]
        public string Gender { get; set; } = "Unisex";
    }
}
