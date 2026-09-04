using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class CustomIdSequenceDto
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

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
        public string StudentIdPrefix { get; set; } = "STU";

        [JsonPropertyName("studentIdStartNo")]
        public int StudentIdStartNo { get; set; } = 1001;

        [JsonPropertyName("studentIdPadding")]
        public int StudentIdPadding { get; set; } = 4;

        [JsonPropertyName("studentIdIncludeYear")]
        public bool StudentIdIncludeYear { get; set; } = true;

        [JsonPropertyName("studentIdSeparator")]
        public string StudentIdSeparator { get; set; } = "-";

        [JsonPropertyName("studentIdPosition")]
        public string StudentIdPosition { get; set; } = "start";

        // Admission No
        [JsonPropertyName("admissionNoPrefix")]
        public string AdmissionNoPrefix { get; set; } = "ADM";

        [JsonPropertyName("admissionNoStartNo")]
        public int AdmissionNoStartNo { get; set; } = 2001;

        [JsonPropertyName("admissionNoPadding")]
        public int AdmissionNoPadding { get; set; } = 4;

        [JsonPropertyName("admissionNoIncludeYear")]
        public bool AdmissionNoIncludeYear { get; set; } = true;

        [JsonPropertyName("admissionNoSeparator")]
        public string AdmissionNoSeparator { get; set; } = "-";

        [JsonPropertyName("admissionNoPosition")]
        public string AdmissionNoPosition { get; set; } = "start";

        // Teaching Staff ID
        [JsonPropertyName("teachingIdPrefix")]
        public string TeachingIdPrefix { get; set; } = "TCH";

        [JsonPropertyName("teachingIdStartNo")]
        public int TeachingIdStartNo { get; set; } = 501;

        [JsonPropertyName("teachingIdPadding")]
        public int TeachingIdPadding { get; set; } = 4;

        [JsonPropertyName("teachingIdIncludeYear")]
        public bool TeachingIdIncludeYear { get; set; } = true;

        [JsonPropertyName("teachingIdSeparator")]
        public string TeachingIdSeparator { get; set; } = "-";

        [JsonPropertyName("teachingIdPosition")]
        public string TeachingIdPosition { get; set; } = "start";

        // Non-Teaching Staff ID
        [JsonPropertyName("nonTeachingIdPrefix")]
        public string NonTeachingIdPrefix { get; set; } = "NTS";

        [JsonPropertyName("nonTeachingIdStartNo")]
        public int NonTeachingIdStartNo { get; set; } = 801;

        [JsonPropertyName("nonTeachingIdPadding")]
        public int NonTeachingIdPadding { get; set; } = 4;

        [JsonPropertyName("nonTeachingIdIncludeYear")]
        public bool NonTeachingIdIncludeYear { get; set; } = true;

        [JsonPropertyName("nonTeachingIdSeparator")]
        public string NonTeachingIdSeparator { get; set; } = "-";

        [JsonPropertyName("nonTeachingIdPosition")]
        public string NonTeachingIdPosition { get; set; } = "start";

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
