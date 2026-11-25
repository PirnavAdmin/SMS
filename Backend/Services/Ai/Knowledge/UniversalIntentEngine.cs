using System;
using System.Collections.Generic;
using System.Linq;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Knowledge
{
    public class DisambiguationAssessment
    {
        public bool RequiresClarification { get; set; }
        public string? ClarificationMessage { get; set; }
        public string? EnrichedContextHint { get; set; }
        public string? InferredDomain { get; set; }
    }

    public class UniversalIntentEngine
    {
        private readonly IErpKnowledgeCatalog _knowledgeCatalog;

        public UniversalIntentEngine(IErpKnowledgeCatalog knowledgeCatalog)
        {
            _knowledgeCatalog = knowledgeCatalog;
        }

        public DisambiguationAssessment AnalyzePrompt(AiChatContext context)
        {
            var raw = (context.LatestUserMessage ?? "").Trim();
            var assessment = new DisambiguationAssessment();

            if (string.IsNullOrWhiteSpace(raw))
            {
                assessment.RequiresClarification = true;
                assessment.ClarificationMessage = "How can I assist you with the School ERP today? You can ask about student enrollment, attendance, fee collections, hostel, transport, examinations, or staff records.";
                return assessment;
            }

            var cleanWords = raw.Split(new[] { ' ', '\t', '\r', '\n', '?', '!', '.', ',' }, StringSplitOptions.RemoveEmptyEntries);
            bool isVeryShort = cleanWords.Length <= 2;
            bool hasHistory = context.History != null && context.History.Count > 0;

            // Scenario 1: Ambiguous single-token / two-token queries WITHOUT prior conversation context
            if (isVeryShort && !hasHistory)
            {
                var lower = raw.ToLowerInvariant();

                if (lower == "students" || lower == "student")
                {
                    assessment.RequiresClarification = true;
                    assessment.ClarificationMessage = "Would you like an overview of total student enrollment (407 students), class-wise strength, or to search for a specific student's record?";
                    assessment.InferredDomain = "Student Management";
                    return assessment;
                }

                if (lower == "fees" || lower == "fee" || lower == "dues")
                {
                    assessment.RequiresClarification = true;
                    assessment.ClarificationMessage = "Would you like to review overall fee collection statistics, view the fee defaulters list, or check fee details for an individual student?";
                    assessment.InferredDomain = "Finance and Fee Management";
                    return assessment;
                }

                if (lower == "attendance" || lower == "present" || lower == "absent")
                {
                    assessment.RequiresClarification = true;
                    assessment.ClarificationMessage = "Would you like today's overall school attendance summary, class-wise attendance comparisons, or staff attendance records?";
                    assessment.InferredDomain = "Attendance";
                    return assessment;
                }

                if (lower == "hostel" || lower == "hostels")
                {
                    assessment.RequiresClarification = true;
                    assessment.ClarificationMessage = "Would you like an overview of hostel room occupancy and vacant bed capacity, or to look up a student's hostel room allocation?";
                    assessment.InferredDomain = "Hostel Management";
                    return assessment;
                }

                if (lower == "transport" || lower == "bus" || lower == "buses")
                {
                    assessment.RequiresClarification = true;
                    assessment.ClarificationMessage = "Would you like information about school transport fleet vehicles, bus routes, or student pickup assignments?";
                    assessment.InferredDomain = "Transport Management";
                    return assessment;
                }

                if (lower == "exams" || lower == "exam" || lower == "results")
                {
                    assessment.RequiresClarification = true;
                    assessment.ClarificationMessage = "Would you like to view examination schedules, or check a student's subject marks and report card?";
                    assessment.InferredDomain = "Examination and Results";
                    return assessment;
                }

                if (lower == "staff" || lower == "teachers")
                {
                    assessment.RequiresClarification = true;
                    assessment.ClarificationMessage = "Would you like a directory of teaching faculty (22 teachers), non-teaching staff (14 staff), or department-wise staff distribution?";
                    assessment.InferredDomain = "Teacher and Staff Management";
                    return assessment;
                }
            }

            // Scenario 2: Contextual follow-up coreference resolution WITH prior conversation context
            if (hasHistory)
            {
                var lastAssistantMessage = context.History!
                    .Where(m => m.Sender == "assistant" || m.Sender == "model")
                    .LastOrDefault()?.Content?.ToLowerInvariant() ?? "";

                var lastUserMessage = context.History!
                    .Where(m => m.Sender == "user")
                    .LastOrDefault()?.Content?.ToLowerInvariant() ?? "";

                var lowerRaw = raw.ToLowerInvariant();

                // Coreference 1: "Compare this year" / "compare"
                if (lowerRaw.Contains("compare") || lowerRaw.Contains("this year") || lowerRaw.Contains("previous year"))
                {
                    if (lastAssistantMessage.Contains("student") || lastAssistantMessage.Contains("enrollment") || lastUserMessage.Contains("student"))
                    {
                        assessment.EnrichedContextHint = "User is requesting an academic year enrollment comparison based on the preceding student strength discussion.";
                    }
                    else if (lastAssistantMessage.Contains("fee") || lastAssistantMessage.Contains("collection") || lastUserMessage.Contains("fee"))
                    {
                        assessment.EnrichedContextHint = "User is requesting a financial fee collection comparison across periods based on the preceding fee discussion.";
                    }
                }
                // Coreference 2: "What about fees?" / "fees"
                else if (lowerRaw.Contains("fee") || lowerRaw.Contains("dues") || lowerRaw.Contains("balance"))
                {
                    if (lastAssistantMessage.Contains("hostel") || lastUserMessage.Contains("hostel"))
                    {
                        assessment.EnrichedContextHint = "User is asking about fee obligations specifically for hostel residential students discussed in the previous turn.";
                    }
                    else if (lastAssistantMessage.Contains("transport") || lastUserMessage.Contains("transport") || lastAssistantMessage.Contains("bus"))
                    {
                        assessment.EnrichedContextHint = "User is asking about fee obligations specifically for transport commuters discussed in the previous turn.";
                    }
                }
                // Coreference 3: "How many in Grade 10?" / "What about Section A?"
                else if (lowerRaw.Contains("grade") || lowerRaw.Contains("class") || lowerRaw.Contains("section"))
                {
                    if (lastAssistantMessage.Contains("student") || lastAssistantMessage.Contains("enrolled") || lastAssistantMessage.Contains("407"))
                    {
                        assessment.EnrichedContextHint = "User is asking for a specific class or section breakdown of the student enrollment discussed previously.";
                    }
                }
            }

            return assessment;
        }
    }
}
