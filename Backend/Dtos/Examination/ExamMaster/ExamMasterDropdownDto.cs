namespace SMS.Api.Dtos.Examination.ExamMaster
{
    public class ExamMasterDropdownDto
    {
        public long Id { get; set; }

        public string Name { get; set; } = string.Empty;

        public string ExamType { get; set; } = string.Empty;

        public string ExamStatus { get; set; } = string.Empty;
    }
}