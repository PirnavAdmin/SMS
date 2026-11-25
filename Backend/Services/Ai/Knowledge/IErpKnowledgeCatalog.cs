using System.Collections.Generic;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Knowledge
{
    public interface IErpKnowledgeCatalog
    {
        IReadOnlyList<ErpModuleCapability> GetAllModules();
        ErpModuleCapability? GetModule(string moduleName);
        IReadOnlyList<ErpEntityRelationship> GetRelationships();
        IReadOnlyList<ErpEntityRelationship> GetRelationshipsForEntity(string entityName);
        string GenerateKnowledgePrompt(AiToolContext context);
    }
}
