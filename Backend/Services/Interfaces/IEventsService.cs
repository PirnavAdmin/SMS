namespace SMS.Api.Services.Interfaces;

using SMS.Api.Dtos;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IEventsService
{
    Task<EventsOptionsDto> GetEventsOptionsAsync();
    Task<List<CalendarEventDto>> GetCalendarEventsAsync(int? month, int? year, string? academicYear);
    Task<List<UpcomingEventAgendaDto>> GetUpcomingEventsAsync(string? search, string? date, string? category, string? academicYear);
    Task<List<SchoolHolidayDto>> GetSchoolHolidaysAsync(string? academicYear);
}
