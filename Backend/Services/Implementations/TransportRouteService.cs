using SMS.Api.Common;
using SMS.Api.Dtos.Transport;
using SMS.Api.Exceptions;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class TransportRouteService : ITransportRouteService
    {
        private readonly ITransportRouteRepository _repository;

        public TransportRouteService(
            ITransportRouteRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedResult<TransportRouteDto>>
            GetAllAsync(TransportRouteFilterDto filter)
        {
            return await _repository.GetAllAsync(filter);
        }

        public async Task<TransportRouteDto?> GetByIdAsync(
            long routeId)
        {
            if (routeId <= 0)
                throw new AppException(
                    "Invalid route ID specified.");

            return await _repository.GetByIdAsync(routeId);
        }

        public async Task<long> CreateAsync(
            CreateTransportRouteDto dto,
            long? userId)
        {
            NormalizeCreateDto(dto);
            ValidateLocations(
                dto.StartLocation,
                dto.EndLocation);

            bool codeExists =
                await _repository.RouteCodeExistsAsync(
                    dto.RouteCode);

            if (codeExists)
                throw new AppException(
                    "Route code already exists.");

            bool nameExists =
                await _repository.RouteNameExistsAsync(
                    dto.RouteName);

            if (nameExists)
                throw new AppException(
                    "Route name already exists.");

            return await _repository.CreateAsync(
                dto,
                userId);
        }

        public async Task<bool> UpdateAsync(
            long routeId,
            UpdateTransportRouteDto dto,
            long? userId)
        {
            if (routeId <= 0)
                throw new AppException(
                    "Invalid route ID specified.");

            TransportRouteDto? existingRoute =
                await _repository.GetByIdAsync(routeId);

            if (existingRoute is null)
                return false;

            NormalizeUpdateDto(dto);
            ValidateLocations(
                dto.StartLocation,
                dto.EndLocation);

            bool codeExists =
                await _repository.RouteCodeExistsAsync(
                    dto.RouteCode,
                    routeId);

            if (codeExists)
                throw new AppException(
                    "Route code already exists.");

            bool nameExists =
                await _repository.RouteNameExistsAsync(
                    dto.RouteName,
                    routeId);

            if (nameExists)
                throw new AppException(
                    "Route name already exists.");

            return await _repository.UpdateAsync(
                routeId,
                dto,
                userId);
        }

        public async Task<bool> DeleteAsync(
            long routeId,
            long? userId)
        {
            if (routeId <= 0)
                throw new AppException(
                    "Invalid route ID specified.");

            return await _repository.DeleteAsync(
                routeId,
                userId);
        }

        public async Task<IEnumerable<TransportRouteLookupDto>>
            GetLookupAsync(string? search, int limit)
        {
            return await _repository.GetLookupAsync(
                search,
                limit);
        }

        private static void NormalizeCreateDto(
            CreateTransportRouteDto dto)
        {
            dto.RouteCode =
                dto.RouteCode.Trim().ToUpperInvariant();

            dto.RouteName = dto.RouteName.Trim();
            dto.StartLocation = dto.StartLocation.Trim();
            dto.EndLocation = dto.EndLocation.Trim();

            dto.Description =
                string.IsNullOrWhiteSpace(dto.Description)
                    ? null
                    : dto.Description.Trim();
        }

        private static void NormalizeUpdateDto(
            UpdateTransportRouteDto dto)
        {
            dto.RouteCode =
                dto.RouteCode.Trim().ToUpperInvariant();

            dto.RouteName = dto.RouteName.Trim();
            dto.StartLocation = dto.StartLocation.Trim();
            dto.EndLocation = dto.EndLocation.Trim();

            dto.Description =
                string.IsNullOrWhiteSpace(dto.Description)
                    ? null
                    : dto.Description.Trim();
        }

        private static void ValidateLocations(
            string startLocation,
            string endLocation)
        {
            if (string.Equals(
                startLocation.Trim(),
                endLocation.Trim(),
                StringComparison.OrdinalIgnoreCase))
            {
                throw new AppException(
                    "Start location and end location cannot be the same.");
            }
        }
    }
}