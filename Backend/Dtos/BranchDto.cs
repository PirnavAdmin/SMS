using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class BranchDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("branchId")]
        public int BranchId { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("branchName")]
        public string BranchNameAlias
        {
            get => Name;
            set { if (!string.IsNullOrWhiteSpace(value)) Name = value; }
        }

        [JsonPropertyName("code")]
        public string Code { get; set; } = string.Empty;

        [JsonPropertyName("branchCode")]
        public string BranchCodeAlias
        {
            get => Code;
            set { if (!string.IsNullOrWhiteSpace(value)) Code = value; }
        }

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("contactPhone")]
        public string ContactPhoneAlias
        {
            get => Phone;
            set { if (!string.IsNullOrWhiteSpace(value)) Phone = value; }
        }

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";
    }
}
