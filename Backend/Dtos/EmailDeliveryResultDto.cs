namespace SMS.Api.Dtos;

using System;
using System.Text.Json.Serialization;

public class EmailDeliveryResultDto
{
    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("status")]
    public string Status => Success ? "Email Sent" : "Email Failed";

    [JsonPropertyName("errorMessage")]
    public string? ErrorMessage { get; set; }

    [JsonPropertyName("failureReason")]
    public string? FailureReason => ErrorMessage;

    [JsonPropertyName("sentAt")]
    public DateTime? SentAt { get; set; }

    [JsonPropertyName("providerUsed")]
    public string? ProviderUsed { get; set; }
}
