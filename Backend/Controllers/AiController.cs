using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SMS.Api.Dtos.Ai;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class AiController : ControllerBase
    {
        private readonly IAiService _aiService;

        public AiController(IAiService aiService)
        {
            _aiService = aiService;
        }

        [HttpGet("conversations")]
        public async Task<ActionResult<List<AiConversationSummaryDto>>> GetUserConversations()
        {
            var conversations = await _aiService.GetUserConversationsAsync(User);
            return Ok(conversations);
        }

        [HttpGet("conversations/{id}")]
        public async Task<ActionResult<AiConversationDetailDto>> GetConversationDetail(string id)
        {
            var detail = await _aiService.GetConversationDetailAsync(User, id);
            if (detail == null)
            {
                return NotFound(new { message = "Conversation not found." });
            }
            return Ok(detail);
        }

        [HttpPost("conversations")]
        public async Task<ActionResult<AiConversationSummaryDto>> CreateConversation([FromBody] CreateConversationRequest? request)
        {
            var conversation = await _aiService.CreateConversationAsync(User, request?.Title);
            return Ok(conversation);
        }

        [HttpPut("conversations/{id}/rename")]
        public async Task<IActionResult> RenameConversation(string id, [FromBody] RenameConversationRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Title))
            {
                return BadRequest(new { message = "Title is required." });
            }

            var success = await _aiService.RenameConversationAsync(User, id, request.Title);
            if (!success)
            {
                return NotFound(new { message = "Conversation not found or could not be renamed." });
            }
            return Ok(new { success = true });
        }

        [HttpDelete("conversations/{id}")]
        public async Task<IActionResult> DeleteConversation(string id)
        {
            var success = await _aiService.DeleteConversationAsync(User, id);
            if (!success)
            {
                return NotFound(new { message = "Conversation not found." });
            }
            return Ok(new { success = true });
        }

        [HttpPost("chat")]
        public async Task<ActionResult<AiChatResponseDto>> SendChatMessage([FromBody] AiChatRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Message))
            {
                return BadRequest(new { message = "Message is required." });
            }

            var response = await _aiService.SendChatMessageAsync(User, request);
            return Ok(response);
        }

        [HttpPost("action/confirm")]
        public async Task<ActionResult<AiActionConfirmationResponseDto>> ConfirmAction([FromBody] AiActionConfirmationRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.ConfirmationToken))
            {
                return BadRequest(new { message = "ConfirmationToken is required." });
            }

            var response = await _aiService.ConfirmActionAsync(User, request);
            return Ok(response);
        }

        [HttpGet("prompts")]
        public async Task<ActionResult<List<AiSuggestedPromptDto>>> GetSuggestedPrompts()
        {
            var prompts = await _aiService.GetSuggestedPromptsAsync(User);
            return Ok(prompts);
        }
    }

    public class CreateConversationRequest
    {
        public string? Title { get; set; }
    }

    public class RenameConversationRequest
    {
        public string Title { get; set; } = string.Empty;
    }
}
