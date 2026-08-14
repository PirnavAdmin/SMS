using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class UniformCategoryDto
    {
        [JsonPropertyName("categoryId")]
        public int CategoryId { get; set; }

        [JsonPropertyName("id")]
        public int Id => CategoryId;

        [JsonPropertyName("categoryName")]
        public string CategoryName { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name => CategoryName;

        [JsonPropertyName("description")]
        public string Description { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUniformCategoryDto
    {
        private string _categoryName = string.Empty;

        [JsonPropertyName("categoryName")]
        public string CategoryName
        {
            get => _categoryName;
            set => _categoryName = value;
        }

        [JsonPropertyName("name")]
        public string NameAlias
        {
            get => _categoryName;
            set { if (!string.IsNullOrWhiteSpace(value)) _categoryName = value; }
        }

        [JsonPropertyName("description")]
        public string? Description { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";
    }
}

