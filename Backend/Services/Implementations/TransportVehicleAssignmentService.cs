using Microsoft.EntityFrameworkCore;
using SMS.Api.Common;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.VehicleAssignment;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class TransportVehicleAssignmentService
        : ITransportVehicleAssignmentService
    {
        private readonly ITransportVehicleAssignmentRepository _repository;
        private readonly AppDbContext _context;

        public TransportVehicleAssignmentService(
            ITransportVehicleAssignmentRepository repository,
            AppDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        public async Task<PagedResult<TransportVehicleAssignmentDto>> GetAllAsync(
            TransportVehicleAssignmentFilterDto filter)
        {
            filter.PageNumber = filter.PageNumber < 1
                ? 1
                : filter.PageNumber;

            filter.PageSize = filter.PageSize < 1
                ? 10
                : filter.PageSize;

            if (filter.PageSize > 100)
                filter.PageSize = 100;

            return await _repository.GetAllAsync(filter);
        }

        public async Task<TransportVehicleAssignmentDto?> GetByIdAsync(
            long assignmentId)
        {
            if (assignmentId <= 0)
                return null;

            return await _repository.GetByIdAsync(assignmentId);
        }

        public async Task<long> CreateAsync(
            CreateTransportVehicleAssignmentDto dto,
            long? userId)
        {
            await ValidateAssignmentAsync(
                dto.RouteId,
                dto.VehicleId,
                dto.DriverId,
                dto.EffectiveFrom,
                dto.EffectiveTo);

            var vehicleAssigned = await _repository.IsVehicleAssignedAsync(
                dto.VehicleId,
                dto.EffectiveFrom,
                dto.EffectiveTo);

            if (vehicleAssigned)
            {
                throw new InvalidOperationException(
                    "The selected vehicle is already assigned during the specified date range.");
            }

            var driverAssigned = await _repository.IsDriverAssignedAsync(
                dto.DriverId,
                dto.EffectiveFrom,
                dto.EffectiveTo);

            if (driverAssigned)
            {
                throw new InvalidOperationException(
                    "The selected driver is already assigned during the specified date range.");
            }

            return await _repository.CreateAsync(dto, userId);
        }

        public async Task<bool> UpdateAsync(
            long assignmentId,
            UpdateTransportVehicleAssignmentDto dto,
            long? userId)
        {
            if (assignmentId <= 0)
                return false;

            var existing = await _repository.GetByIdAsync(assignmentId);

            if (existing == null)
                return false;

            await ValidateAssignmentAsync(
                dto.RouteId,
                dto.VehicleId,
                dto.DriverId,
                dto.EffectiveFrom,
                dto.EffectiveTo);

            var vehicleAssigned = await _repository.IsVehicleAssignedAsync(
                dto.VehicleId,
                dto.EffectiveFrom,
                dto.EffectiveTo,
                assignmentId);

            if (vehicleAssigned)
            {
                throw new InvalidOperationException(
                    "The selected vehicle is already assigned during the specified date range.");
            }

            var driverAssigned = await _repository.IsDriverAssignedAsync(
                dto.DriverId,
                dto.EffectiveFrom,
                dto.EffectiveTo,
                assignmentId);

            if (driverAssigned)
            {
                throw new InvalidOperationException(
                    "The selected driver is already assigned during the specified date range.");
            }

            return await _repository.UpdateAsync(
                assignmentId,
                dto,
                userId);
        }

        public async Task<bool> DeleteAsync(
            long assignmentId,
            long? userId)
        {
            if (assignmentId <= 0)
                return false;

            return await _repository.DeleteAsync(
                assignmentId,
                userId);
        }

        public async Task<IEnumerable<TransportVehicleAssignmentLookupDto>>
            GetLookupAsync()
        {
            return await _repository.GetLookupAsync();
        }

        private async Task ValidateAssignmentAsync(
            long routeId,
            long vehicleId,
            long driverId,
            DateTime effectiveFrom,
            DateTime? effectiveTo)
        {
            if (routeId <= 0)
                throw new ArgumentException("A valid route is required.");

            if (vehicleId <= 0)
                throw new ArgumentException("A valid vehicle is required.");

            if (driverId <= 0)
                throw new ArgumentException("A valid driver is required.");

            if (effectiveTo.HasValue &&
                effectiveTo.Value.Date < effectiveFrom.Date)
            {
                throw new ArgumentException(
                    "Effective To date cannot be earlier than Effective From date.");
            }

            var routeExists = await _context.TransportRoutes
                .AsNoTracking()
                .AnyAsync(x =>
                    x.RouteId == routeId &&
                    !x.IsDeleted &&
                    x.Status);

            if (!routeExists)
            {
                throw new InvalidOperationException(
                    "The selected route does not exist or is inactive.");
            }

            var vehicleExists = await _context.TransportVehicles
                .AsNoTracking()
                .AnyAsync(x =>
                    x.VehicleId == vehicleId &&
                    !x.IsDeleted &&
                    x.Status);

            if (!vehicleExists)
            {
                throw new InvalidOperationException(
                    "The selected vehicle does not exist or is inactive.");
            }

            var driver = await _context.TransportDrivers
                .AsNoTracking()
                .Where(x =>
                    x.DriverId == driverId &&
                    !x.IsDeleted &&
                    x.Status)
                .Select(x => new
                {
                    x.DriverId,
                    x.LicenceExpiry
                })
                .FirstOrDefaultAsync();

            if (driver == null)
            {
                throw new InvalidOperationException(
                    "The selected driver does not exist or is inactive.");
            }

            if (driver.LicenceExpiry.HasValue &&
                driver.LicenceExpiry.Value.Date < effectiveFrom.Date)
            {
                throw new InvalidOperationException(
                    "The selected driver's licence expires before the assignment starts.");
            }
        }
    }
}