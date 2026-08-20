using System;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos;

public class CircularDto
{
    private string _title = string.Empty;
    private string _category = "SPORTS • ALL";
    private string _content = string.Empty;
    private string _targetAudience = "ALL";
    private string _createdDate = DateTime.UtcNow.ToString("yyyy-MM-dd");

    [JsonPropertyName("circularId")]
    public int CircularId { get; set; }

    [JsonPropertyName("id")]
    public int Id
    {
        get => CircularId;
        set { if (value > 0) CircularId = value; }
    }

    [JsonPropertyName("title")]
    public string Title
    {
        get => _title;
        set { if (!string.IsNullOrWhiteSpace(value)) _title = value; }
    }

    [JsonPropertyName("circularHeadline")]
    public string? CircularHeadlineAlias
    {
        get => _title;
        set { if (!string.IsNullOrWhiteSpace(value)) _title = value; }
    }

    [JsonPropertyName("headline")]
    public string? HeadlineAlias
    {
        get => _title;
        set { if (!string.IsNullOrWhiteSpace(value)) _title = value; }
    }

    [JsonPropertyName("category")]
    public string Category
    {
        get => _category;
        set { if (!string.IsNullOrWhiteSpace(value)) _category = value; }
    }

    [JsonPropertyName("categoryTag")]
    public string? CategoryTagAlias
    {
        get => _category;
        set { if (!string.IsNullOrWhiteSpace(value)) _category = value; }
    }

    [JsonPropertyName("content")]
    public string Content
    {
        get => _content;
        set { if (!string.IsNullOrWhiteSpace(value)) _content = value; }
    }

    [JsonPropertyName("messageContent")]
    public string? MessageContentAlias
    {
        get => _content;
        set { if (!string.IsNullOrWhiteSpace(value)) _content = value; }
    }

    [JsonPropertyName("circularText")]
    public string? CircularTextAlias
    {
        get => _content;
        set { if (!string.IsNullOrWhiteSpace(value)) _content = value; }
    }

    [JsonPropertyName("targetAudience")]
    public string TargetAudience
    {
        get => _targetAudience;
        set { if (!string.IsNullOrWhiteSpace(value)) _targetAudience = value; }
    }

    [JsonPropertyName("audience")]
    public string? AudienceAlias
    {
        get => _targetAudience;
        set { if (!string.IsNullOrWhiteSpace(value)) _targetAudience = value; }
    }

    [JsonPropertyName("createdDate")]
    public string CreatedDate
    {
        get => _createdDate;
        set { if (!string.IsNullOrWhiteSpace(value)) _createdDate = value; }
    }

    [JsonPropertyName("broadcastDate")]
    public string? BroadcastDateAlias
    {
        get => _createdDate;
        set { if (!string.IsNullOrWhiteSpace(value)) _createdDate = value; }
    }

    [JsonPropertyName("date")]
    public string? DateAlias
    {
        get => _createdDate;
        set { if (!string.IsNullOrWhiteSpace(value)) _createdDate = value; }
    }

    [JsonPropertyName("author")]
    public string Author { get; set; } = "School Administration";

    [JsonPropertyName("deliveredCount")]
    public int DeliveredCount { get; set; } = 1420;

    [JsonPropertyName("isPinned")]
    public bool IsPinned { get; set; } = false;

    [JsonPropertyName("smsSent")]
    public bool SmsSent { get; set; } = true;

    [JsonPropertyName("smsAlert")]
    public bool? SmsAlertAlias
    {
        get => SmsSent;
        set { if (value.HasValue) SmsSent = value.Value; }
    }

    [JsonPropertyName("sendSMS")]
    public bool? SendSMSAlias
    {
        get => SmsSent;
        set { if (value.HasValue) SmsSent = value.Value; }
    }

    [JsonPropertyName("emailSent")]
    public bool EmailSent { get; set; } = true;

    [JsonPropertyName("emailBlast")]
    public bool? EmailBlastAlias
    {
        get => EmailSent;
        set { if (value.HasValue) EmailSent = value.Value; }
    }

    [JsonPropertyName("sendEmail")]
    public bool? SendEmailAlias
    {
        get => EmailSent;
        set { if (value.HasValue) EmailSent = value.Value; }
    }

    [JsonPropertyName("pushDelivered")]
    public bool PushDelivered { get; set; } = true;

    [JsonPropertyName("appPush")]
    public bool? AppPushAlias
    {
        get => PushDelivered;
        set { if (value.HasValue) PushDelivered = value.Value; }
    }

    [JsonPropertyName("sendPush")]
    public bool? SendPushAlias
    {
        get => PushDelivered;
        set { if (value.HasValue) PushDelivered = value.Value; }
    }
}
