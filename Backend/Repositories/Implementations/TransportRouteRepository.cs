using Microsoft.EntityFrameworkCore;
using SMS.Api.Common;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class TransportRouteRepository : ITransportRouteRepository
    {
        private readonly AppDbContext _context;

        public TransportRouteRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<PagedResult<TransportRouteDto>> GetAllAsync(
            TransportRouteFilterDto filter)
        {
            IQueryable<TransportRoute> query = _context.TransportRoutes
                .AsNoTracking()
                .Where(x => !x.IsDeleted);

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                string search = filter.Search.Trim().ToLower();

                query = query.Where(x =>
                    x.RouteCode.ToLower().Contains(search) ||
                    x.RouteName.ToLower().Contains(search) ||
                    x.StartLocation.ToLower().Contains(search) ||
                    x.EndLocation.ToLower().Contains(search));
            }

            if (filter.Status.HasValue)
            {
                query = query.Where(x => x.Status == filter.Status.Value);
            }

            query = ApplySorting(
                query,
                filter.SortBy,
                filter.SortOrder);

            int totalCount = await query.CountAsync();

            List<TransportRouteDto> items = await query
                .Skip((filter.PageNumber - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(x => new TransportRouteDto
                {
                    RouteId = x.RouteId,
                    RouteCode = x.RouteCode,
                    RouteName = x.RouteName,
                    StartLocation = x.StartLocation,
                    EndLocation = x.EndLocation,
                    DistanceKm = x.DistanceKm,
                    EstimatedDurationMinutes = x.EstimatedDurationMinutes,
                    EstimatedDurationText =
                        FormatDuration(x.EstimatedDurationMinutes),
                    Description = x.Description,
                    Status = x.Status,
                    StatusText = x.Status ? "Active" : "Inactive",
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt
                })
                .ToListAsync();

            return new PagedResult<TransportRouteDto>
            {
                Items = items,
                PageNumber = filter.PageNumber,
                PageSize = filter.PageSize,
                TotalCount = totalCount
            };
        }

        public async Task<TransportRouteDto?> GetByIdAsync(long routeId)
        {
            return await _context.TransportRoutes
                .AsNoTracking()
                .Where(x =>
                    x.RouteId == routeId &&
                    !x.IsDeleted)
                .Select(x => new TransportRouteDto
                {
                    RouteId = x.RouteId,
                    RouteCode = x.RouteCode,
                    RouteName = x.RouteName,
                    StartLocation = x.StartLocation,
                    EndLocation = x.EndLocation,
                    DistanceKm = x.DistanceKm,
                    EstimatedDurationMinutes = x.EstimatedDurationMinutes,
                    EstimatedDurationText =
                        FormatDuration(x.EstimatedDurationMinutes),
                    Description = x.Description,
                    Status = x.Status,
                    StatusText = x.Status ? "Active" : "Inactive",
                    CreatedAt = x.CreatedAt,
                    UpdatedAt = x.UpdatedAt
                })
                .FirstOrDefaultAsync();
        }

        public async Task<long> CreateAsync(
            CreateTransportRouteDto dto,
            long? userId)
        {
            TransportRoute route = new()
            {
                RouteCode = dto.RouteCode.Trim(),
                RouteName = dto.RouteName.Trim(),
                StartLocation = dto.StartLocation.Trim(),
                EndLocation = dto.EndLocation.Trim(),
                DistanceKm = dto.DistanceKm,
                EstimatedDurationMinutes =
                    dto.EstimatedDurationMinutes,
                Description = string.IsNullOrWhiteSpace(dto.Description)
                    ? null
                    : dto.Description.Trim(),
                Status = dto.Status,
                IsDeleted = false,
                CreatedBy = userId,
                CreatedAt = DateTime.UtcNow
            };

            await _context.TransportRoutes.AddAsync(route);
            await _context.SaveChangesAsync();

            return route.RouteId;
        }

        public async Task<bool> UpdateAsync(
            long routeId,
            UpdateTransportRouteDto dto,
            long? userId)
        {
            TransportRoute? route =
                await _context.TransportRoutes
                    .FirstOrDefaultAsync(x =>
                        x.RouteId == routeId &&
                        !x.IsDeleted);

            if (route is null)
                return false;

            route.RouteCode = dto.RouteCode.Trim();
            route.RouteName = dto.RouteName.Trim();
            route.StartLocation = dto.StartLocation.Trim();
            route.EndLocation = dto.EndLocation.Trim();
            route.DistanceKm = dto.DistanceKm;
            route.EstimatedDurationMinutes =
                dto.EstimatedDurationMinutes;
            route.Description =
                string.IsNullOrWhiteSpace(dto.Description)
                    ? null
                    : dto.Description.Trim();
            route.Status = dto.Status;
            route.UpdatedBy = userId;
            route.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(
            long routeId,
            long? userId)
        {
            TransportRoute? route =
                await _context.TransportRoutes
                    .FirstOrDefaultAsync(x =>
                        x.RouteId == routeId &&
                        !x.IsDeleted);

            if (route is null)
                return false;

            route.IsDeleted = true;
            route.Status = false;
            route.UpdatedBy = userId;
            route.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<IEnumerable<TransportRouteLookupDto>>
            GetLookupAsync(string? search, int limit)
        {
            if (limit < 1)
                limit = 20;

            if (limit > 100)
                limit = 100;

            IQueryable<TransportRoute> query =
                _context.TransportRoutes
                    .AsNoTracking()
                    .Where(x =>
                        !x.IsDeleted &&
                        x.Status);

            if (!string.IsNullOrWhiteSpace(search))
            {
                string normalizedSearch =
                    search.Trim().ToLower();

                query = query.Where(x =>
                    x.RouteCode.ToLower()
                        .Contains(normalizedSearch) ||
                    x.RouteName.ToLower()
                        .Contains(normalizedSearch));
            }

            return await query
                .OrderBy(x => x.RouteName)
                .Take(limit)
                .Select(x => new TransportRouteLookupDto
                {
                    RouteId = x.RouteId,
                    RouteCode = x.RouteCode,
                    RouteName = x.RouteName,
                    DisplayName =
                        x.RouteCode + " - " + x.RouteName
                })
                .ToListAsync();
        }

        public async Task<bool> RouteCodeExistsAsync(
            string routeCode,
            long? excludeRouteId = null)
        {
            string normalizedCode =
                routeCode.Trim().ToLower();

            return await _context.TransportRoutes
                .AsNoTracking()
                .AnyAsync(x =>
                    !x.IsDeleted &&
                    x.RouteCode.ToLower() == normalizedCode &&
                    (!excludeRouteId.HasValue ||
                     x.RouteId != excludeRouteId.Value));
        }

        public async Task<bool> RouteNameExistsAsync(
            string routeName,
            long? excludeRouteId = null)
        {
            string normalizedName =
                routeName.Trim().ToLower();

            return await _context.TransportRoutes
                .AsNoTracking()
                .AnyAsync(x =>
                    !x.IsDeleted &&
                    x.RouteName.ToLower() == normalizedName &&
                    (!excludeRouteId.HasValue ||
                     x.RouteId != excludeRouteId.Value));
        }

        private static IQueryable<TransportRoute> ApplySorting(
            IQueryable<TransportRoute> query,
            string? sortBy,
            string? sortOrder)
        {
            string normalizedSortBy =
                sortBy?.Trim().ToLower() ?? "createdat";

            bool descending =
                string.Equals(
                    sortOrder,
                    "desc",
                    StringComparison.OrdinalIgnoreCase);

            return normalizedSortBy switch
            {
                "routecode" => descending
                    ? query.OrderByDescending(x => x.RouteCode)
                    : query.OrderBy(x => x.RouteCode),

                "routename" => descending
                    ? query.OrderByDescending(x => x.RouteName)
                    : query.OrderBy(x => x.RouteName),

                "startlocation" => descending
                    ? query.OrderByDescending(x => x.StartLocation)
                    : query.OrderBy(x => x.StartLocation),

                "endlocation" => descending
                    ? query.OrderByDescending(x => x.EndLocation)
                    : query.OrderBy(x => x.EndLocation),

                "distancekm" => descending
                    ? query.OrderByDescending(x => x.DistanceKm)
                    : query.OrderBy(x => x.DistanceKm),

                "status" => descending
                    ? query.OrderByDescending(x => x.Status)
                    : query.OrderBy(x => x.Status),

                "createdat" => descending
                    ? query.OrderByDescending(x => x.CreatedAt)
                    : query.OrderBy(x => x.CreatedAt),

                _ => query.OrderByDescending(x => x.CreatedAt)
            };
        }

        private static string FormatDuration(int totalMinutes)
        {
            if (totalMinutes <= 0)
                return "0 min";

            int hours = totalMinutes / 60;
            int minutes = totalMinutes % 60;

            if (hours == 0)
                return $"{minutes} min";

            if (minutes == 0)
                return $"{hours} hr";

            return $"{hours} hr {minutes} min";
        }
    }
}