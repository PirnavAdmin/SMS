using System.Text.Json.Serialization;

namespace SMS.Api.Dtos.Transport.Driver
{
    public class DriverDocumentDto
    {
        [JsonPropertyName("id")]
        public long Id { get; set; }

        [JsonPropertyName("documentId")]
        public long DocumentId => Id;

        [JsonPropertyName("driverId")]
        public string? DriverId { get; set; }

        [JsonPropertyName("documentCategory")]
        public string DocumentCategory { get; set; } = string.Empty;

        [JsonPropertyName("documentNumber")]
        public string DocumentNumber { get; set; } = string.Empty;

        [JsonPropertyName("certificateNo")]
        public string CertificateNo => DocumentNumber;

        [JsonPropertyName("issueDate")]
        public string IssueDate { get; set; } = string.Empty;

        [JsonPropertyName("expiryDate")]
        public string ExpiryDate { get; set; } = string.Empty;

        [JsonPropertyName("badgeNumber")]
        public string? BadgeNumber { get; set; }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Verified";

        [JsonPropertyName("fileName")]
        public string? FileName { get; set; }

        [JsonPropertyName("fileUrl")]
        public string? FileUrl { get; set; }
    }
}
