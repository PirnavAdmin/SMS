using System;
using System.Collections.Generic;

namespace SMS.Api.Services.Ai.Knowledge
{
    public class ErpModuleCapability
    {
        public string ModuleName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public List<string> Entities { get; set; } = new();
        public List<string> PrimaryTools { get; set; } = new();
        public List<string> AggregateOperations { get; set; } = new();
        public List<string> IndividualOperations { get; set; } = new();
        public List<string> SupportedFilters { get; set; } = new();
        public List<string> BusinessRules { get; set; } = new();
        public List<string> AuthorizedRoles { get; set; } = new();
        public List<string> CrossModuleDependencies { get; set; } = new();
    }

    public class ErpEntityRelationship
    {
        public string SourceEntity { get; set; } = string.Empty;
        public string TargetEntity { get; set; } = string.Empty;
        public string RelationType { get; set; } = string.Empty; // e.g. OneToMany, ManyToOne, ManyToMany
        public string JoinKey { get; set; } = string.Empty;
        public string SemanticDescription { get; set; } = string.Empty;
    }

    public class DisambiguationRule
    {
        public string IntentCategory { get; set; } = string.Empty;
        public string ContextRequirement { get; set; } = string.Empty;
        public string ResolutionStrategy { get; set; } = string.Empty;
        public string ClarificationPrompt { get; set; } = string.Empty;
    }
}
