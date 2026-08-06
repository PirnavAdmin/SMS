namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface ICommunicationService
{
    Task<CommunicationOptionsDto> GetCommunicationOptionsAsync();
    Task<List<BroadcastNotificationDto>> GetBroadcastNotificationsAsync(string? academicYear, string? category);
    Task<List<CommunicationMeetingDto>> GetMeetingsAsync(string? audience, string? mode, string? status, string? search, string? academicYear);
}
