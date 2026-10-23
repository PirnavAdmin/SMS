using System;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class EligibleHostelStudentDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("studentId")]
        public int? StudentId { get; set; }

        [JsonPropertyName("applicationId")]
        public int? ApplicationId { get; set; }

        [JsonPropertyName("studentName")]
        public string StudentName { get; set; } = string.Empty;

        [JsonPropertyName("admissionNo")]
        public string AdmissionNo { get; set; } = string.Empty;

        [JsonPropertyName("registrationNo")]
        public string RegistrationNo { get; set; } = string.Empty;

        [JsonPropertyName("className")]
        public string ClassName { get; set; } = string.Empty;

        [JsonPropertyName("section")]
        public string Section { get; set; } = string.Empty;

        [JsonPropertyName("studentType")]
        public string StudentType { get; set; } = "Residential";

        [JsonPropertyName("requiredSecurityDeposit")]
        public decimal RequiredSecurityDeposit { get; set; }

        [JsonPropertyName("paidSecurityDeposit")]
        public decimal PaidSecurityDeposit { get; set; }

        [JsonPropertyName("isSecurityDepositPaid")]
        public bool IsSecurityDepositPaid { get; set; }

        [JsonPropertyName("paymentStatus")]
        public string PaymentStatus { get; set; } = "Paid";

        [JsonPropertyName("hostelBlock")]
        public string? HostelBlock { get; set; }

        [JsonPropertyName("hostelRoom")]
        public string? HostelRoom { get; set; }

        [JsonPropertyName("bedNumber")]
        public string? BedNumber { get; set; }
    }
}
