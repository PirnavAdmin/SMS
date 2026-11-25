using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Ai;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/ai")]
    [Route("api/ai-assistant")]
    [Authorize]
    [Tags("School ERP AI Assistant")]
    public class AiAssistantController : ControllerBase
    {
        private readonly IAiService _aiService;

        public AiAssistantController(IAiService aiService)
        {
            _aiService = aiService;
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            var result = await _aiService.GetUserConversationsAsync(User);
            return Ok(new { success = true, data = result });
        }

        [HttpPost("conversations")]
        public async Task<IActionResult> CreateConversation([FromBody] RenameConversationDto? dto)
        {
            var result = await _aiService.CreateConversationAsync(User, dto?.Title);
            return Ok(new { success = true, data = result });
        }

        [HttpGet("conversations/{conversationId}")]
        public async Task<IActionResult> GetConversationDetail(string conversationId)
        {
            var result = await _aiService.GetConversationDetailAsync(User, conversationId);
            if (result == null)
            {
                return NotFound(new { success = false, message = "Conversation not found." });
            }
            return Ok(new { success = true, data = result });
        }

        [HttpPatch("conversations/{conversationId}")]
        public async Task<IActionResult> RenameConversation(string conversationId, [FromBody] RenameConversationDto dto)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new { success = false, message = "Title is required." });
            }

            var success = await _aiService.RenameConversationAsync(User, conversationId, dto.Title);
            if (!success)
            {
                return NotFound(new { success = false, message = "Conversation not found." });
            }
            return Ok(new { success = true, message = "Conversation renamed successfully." });
        }

        [HttpDelete("conversations/{conversationId}")]
        public async Task<IActionResult> DeleteConversation(string conversationId)
        {
            var success = await _aiService.DeleteConversationAsync(User, conversationId);
            if (!success)
            {
                return NotFound(new { success = false, message = "Conversation not found." });
            }
            return Ok(new { success = true, message = "Conversation deleted successfully." });
        }

        [HttpPost("chat")]
        [HttpPost("message")]
        public async Task<IActionResult> SendChatMessage([FromBody] AiChatRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { success = false, message = "Message text is required." });
            }

            try
            {
                var response = await _aiService.SendChatMessageAsync(User, request);
                return Ok(new { success = true, data = response });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpPost("action/confirm")]
        [HttpPost("confirm-action")]
        public async Task<IActionResult> ConfirmAction([FromBody] AiActionConfirmationRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ConfirmationToken))
            {
                return BadRequest(new { success = false, message = "Confirmation token is required." });
            }

            var response = await _aiService.ConfirmActionAsync(User, request);
            if (!response.Success)
            {
                return BadRequest(new { success = false, message = response.Message });
            }
            return Ok(new { success = true, data = response });
        }

        [HttpGet("suggested-prompts")]
        [HttpGet("suggestions")]
        public async Task<IActionResult> GetSuggestedPrompts()
        {
            var prompts = await _aiService.GetSuggestedPromptsAsync(User);
            return Ok(new { success = true, data = prompts });
        }
    }
}
