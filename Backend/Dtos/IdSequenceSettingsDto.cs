using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class CustomIdSequenceDto
    {
        private string _id = string.Empty;
        private string _formatKey = string.Empty;

        [JsonPropertyName("id")]
        public string Id 
        { 
            get => !string.IsNullOrWhiteSpace(_id) ? _id : _formatKey; 
            set => _id = value; 
        }

        [JsonPropertyName("formatKey")]
        public string FormatKey 
        { 
            get => !string.IsNullOrWhiteSpace(_formatKey) ? _formatKey : _id; 
            set => _formatKey = value; 
        }

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("prefix")]
        public string Prefix { get; set; } = "CUST";

        [JsonPropertyName("startNo")]
        public int StartNo { get; set; } = 101;

        [JsonPropertyName("padding")]
        public int Padding { get; set; } = 4;

        [JsonPropertyName("includeYear")]
        public bool IncludeYear { get; set; } = true;

        [JsonPropertyName("separator")]
        public string Separator { get; set; } = "-";

        [JsonPropertyName("position")]
        public string Position { get; set; } = "start"; // start, middle, end
    }

    public class IdSequenceSettingsDto
    {
        // Student ID
        [JsonPropertyName("studentIdPrefix")]
        public string StudentIdPrefix { get; set; } = string.Empty;

        [JsonPropertyName("studentIdStartNo")]
        public int StudentIdStartNo { get; set; } = 0;

        [JsonPropertyName("studentIdPadding")]
        public int StudentIdPadding { get; set; } = 0;

        [JsonPropertyName("studentIdIncludeYear")]
        public bool StudentIdIncludeYear { get; set; } = true;

        [JsonPropertyName("studentIdSeparator")]
        public string StudentIdSeparator { get; set; } = string.Empty;

        [JsonPropertyName("studentIdPosition")]
        public string StudentIdPosition { get; set; } = string.Empty;

        // Admission No
        [JsonPropertyName("admissionNoPrefix")]
        public string AdmissionNoPrefix { get; set; } = string.Empty;

        [JsonPropertyName("admissionNoStartNo")]
        public int AdmissionNoStartNo { get; set; } = 0;

        [JsonPropertyName("admissionNoPadding")]
        public int AdmissionNoPadding { get; set; } = 0;

        [JsonPropertyName("admissionNoIncludeYear")]
        public bool AdmissionNoIncludeYear { get; set; } = true;

        [JsonPropertyName("admissionNoSeparator")]
        public string AdmissionNoSeparator { get; set; } = string.Empty;

        [JsonPropertyName("admissionNoPosition")]
        public string AdmissionNoPosition { get; set; } = string.Empty;

        // Teaching Staff ID
        [JsonPropertyName("teachingIdPrefix")]
        public string TeachingIdPrefix { get; set; } = string.Empty;

        [JsonPropertyName("teachingIdStartNo")]
        public int TeachingIdStartNo { get; set; } = 0;

        [JsonPropertyName("teachingIdPadding")]
        public int TeachingIdPadding { get; set; } = 0;

        [JsonPropertyName("teachingIdIncludeYear")]
        public bool TeachingIdIncludeYear { get; set; } = true;

        [JsonPropertyName("teachingIdSeparator")]
        public string TeachingIdSeparator { get; set; } = string.Empty;

        [JsonPropertyName("teachingIdPosition")]
        public string TeachingIdPosition { get; set; } = string.Empty;

        // Non-Teaching Staff ID
        [JsonPropertyName("nonTeachingIdPrefix")]
        public string NonTeachingIdPrefix { get; set; } = string.Empty;

        [JsonPropertyName("nonTeachingIdStartNo")]
        public int NonTeachingIdStartNo { get; set; } = 0;

        [JsonPropertyName("nonTeachingIdPadding")]
        public int NonTeachingIdPadding { get; set; } = 0;

        [JsonPropertyName("nonTeachingIdIncludeYear")]
        public bool NonTeachingIdIncludeYear { get; set; } = true;

        [JsonPropertyName("nonTeachingIdSeparator")]
        public string NonTeachingIdSeparator { get; set; } = string.Empty;

        [JsonPropertyName("nonTeachingIdPosition")]
        public string NonTeachingIdPosition { get; set; } = string.Empty;

        // Custom Automated Sequences
        [JsonPropertyName("customSequences")]
        public List<CustomIdSequenceDto> CustomSequences { get; set; } = new List<CustomIdSequenceDto>();

        // Complete list of all formats (4 fixed + custom ones) for direct table reflection
        [JsonPropertyName("allFormats")]
        public List<AutomatedIdFormatDto> AllFormats { get; set; } = new List<AutomatedIdFormatDto>();
    }

    public class AutomatedIdFormatDto
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("formatKey")]
        public string FormatKey { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string Name { get; set; } = string.Empty;

        [JsonPropertyName("prefix")]
        public string Prefix { get; set; } = string.Empty;

        [JsonPropertyName("startNo")]
        public int StartNo { get; set; } = 1;

        [JsonPropertyName("padding")]
        public int Padding { get; set; } = 4;

        [JsonPropertyName("includeYear")]
        public bool IncludeYear { get; set; } = true;

        [JsonPropertyName("separator")]
        public string Separator { get; set; } = "-";

        [JsonPropertyName("position")]
        public string Position { get; set; } = "start";

        [JsonPropertyName("isCustom")]
        public bool IsCustom { get; set; } = false;
    }

    public class GeneratedIdResponseDto
    {
        [JsonPropertyName("formatType")]
        public string FormatType { get; set; } = string.Empty;

        [JsonPropertyName("nextId")]
        public string NextId { get; set; } = string.Empty;

        [JsonPropertyName("sequenceNumber")]
        public int SequenceNumber { get; set; }

        [JsonPropertyName("prefix")]
        public string Prefix { get; set; } = string.Empty;
    }
}
