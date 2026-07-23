using Microsoft.EntityFrameworkCore;
using SMS.Api.Common;
using SMS.Api.Data;
using SMS.Api.Dtos.Transport.StudentTransportAssignment;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class StudentTransportAssignmentService
        : IStudentTransportAssignmentService
    {
        private readonly IStudentTransportAssignmentRepository _repository;
        private readonly AppDbContext _context;

        private static readonly string[] AllowedTransportTypes =
        {
            "Pickup",
            "Drop",
            "Both"
        };

        public StudentTransportAssignmentService(
            IStudentTransportAssignmentRepository repository,
            AppDbContext context)
        {
            _repository = repository;
            _context = context;
        }

        // ---------------------------------------------------------
        // Get All
        // ---------------------------------------------------------
        public async Task<PagedResult<StudentTransportAssignmentDto>>
            GetAllAsync(StudentTransportAssignmentFilterDto filter)
        {
            filter.PageNumber = filter.PageNumber < 1
                ? 1
                : filter.PageNumber;

            filter.PageSize = filter.PageSize < 1
                ? 10
                : Math.Min(filter.PageSize, 100);

            return await _repository.GetAllAsync(filter);
        }

        // ---------------------------------------------------------
        // Get By Id
        // ---------------------------------------------------------
        public async Task<StudentTransportAssignmentDto?> GetByIdAsync(
            long studentTransportAssignmentId)
        {
            if (studentTransportAssignmentId <= 0)
                return null;

            return await _repository.GetByIdAsync(
                studentTransportAssignmentId);
        }

        // ---------------------------------------------------------
        // Create
        // ---------------------------------------------------------
        public async Task<long> CreateAsync(
            CreateStudentTransportAssignmentDto dto,
            long? userId)
        {
            NormalizeDto(dto);

            await ValidateAssignmentAsync(
                dto.StudentId,
                dto.RouteId,
                dto.PickupPointId,
                dto.VehicleAssignmentId,
                dto.EffectiveFrom,
                dto.EffectiveTo,
                dto.TransportType);

            var overlapExists =
                await _repository.HasOverlappingAssignmentAsync(
                    dto.StudentId,
                    dto.EffectiveFrom,
                    dto.EffectiveTo);

            if (overlapExists)
            {
                throw new InvalidOperationException(
                    "The selected student already has an active transport assignment during the specified date range.");
            }

            return await _repository.CreateAsync(dto, userId);
        }

        // ---------------------------------------------------------
        // Update
        // ---------------------------------------------------------
        public async Task<bool> UpdateAsync(
            long studentTransportAssignmentId,
            UpdateStudentTransportAssignmentDto dto,
            long? userId)
        {
            if (studentTransportAssignmentId <= 0)
                return false;

            var existing = await _repository.GetByIdAsync(
                studentTransportAssignmentId);

            if (existing == null)
                return false;

            NormalizeDto(dto);

            await ValidateAssignmentAsync(
                dto.StudentId,
                dto.RouteId,
                dto.PickupPointId,
                dto.VehicleAssignmentId,
                dto.EffectiveFrom,
                dto.EffectiveTo,
                dto.TransportType);

            var overlapExists =
                await _repository.HasOverlappingAssignmentAsync(
                    dto.StudentId,
                    dto.EffectiveFrom,
                    dto.EffectiveTo,
                    studentTransportAssignmentId);

            if (overlapExists)
            {
                throw new InvalidOperationException(
                    "The selected student already has another active transport assignment during the specified date range.");
            }

            return await _repository.UpdateAsync(
                studentTransportAssignmentId,
                dto,
                userId);
        }

        // ---------------------------------------------------------
        // Delete
        // ---------------------------------------------------------
        public async Task<bool> DeleteAsync(
            long studentTransportAssignmentId,
            long? userId)
        {
            if (studentTransportAssignmentId <= 0)
                return false;

            return await _repository.DeleteAsync(
                studentTransportAssignmentId,
                userId);
        }

        // ---------------------------------------------------------
        // Lookup
        // ---------------------------------------------------------
        public async Task<
            IEnumerable<StudentTransportAssignmentLookupDto>>
            GetLookupAsync()
        {
            return await _repository.GetLookupAsync();
        }

        // ---------------------------------------------------------
        // Validate Assignment
        // ---------------------------------------------------------
        private async Task ValidateAssignmentAsync(
            long studentId,
            long routeId,
            long pickupPointId,
            long vehicleAssignmentId,
            DateTime effectiveFrom,
            DateTime? effectiveTo,
            string transportType)
        {
            // Student validation
            if (studentId <= 0)
            {
                throw new ArgumentException(
                    "A valid student is required.");
            }

            // Route validation
            if (routeId <= 0)
            {
                throw new ArgumentException(
                    "A valid route is required.");
            }

            // Pickup-point validation
            if (pickupPointId <= 0)
            {
                throw new ArgumentException(
                    "A valid pickup point is required.");
            }

            // Vehicle-assignment validation
            if (vehicleAssignmentId <= 0)
            {
                throw new ArgumentException(
                    "A valid vehicle assignment is required.");
            }

            // Effective From validation
            if (effectiveFrom == default)
            {
                throw new ArgumentException(
                    "Effective From date is required.");
            }

            // Effective To validation
            if (effectiveTo.HasValue &&
                effectiveTo.Value.Date < effectiveFrom.Date)
            {
                throw new ArgumentException(
                    "Effective To date cannot be earlier than Effective From date.");
            }

            // Transport type validation
            if (!AllowedTransportTypes.Contains(
                    transportType,
                    StringComparer.OrdinalIgnoreCase))
            {
                throw new ArgumentException(
                    "Transport Type must be Pickup, Drop, or Both.");
            }

            // -----------------------------------------------------
            // Validate Route
            // -----------------------------------------------------
            var route = await _context.TransportRoutes
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.RouteId == routeId);

            if (route == null)
            {
                throw new InvalidOperationException(
                    $"Route ID {routeId} was not found.");
            }

            if (route.IsDeleted)
            {
                throw new InvalidOperationException(
                    $"Route ID {routeId} has been deleted.");
            }

            if (!route.Status)
            {
                throw new InvalidOperationException(
                    $"Route ID {routeId} is inactive.");
            }

            // -----------------------------------------------------
            // Validate Pickup Point
            // -----------------------------------------------------
            var pickupPoint = await _context.PickupPoints
                .AsNoTracking()
                .FirstOrDefaultAsync(x =>
                    x.PickupPointId == pickupPointId);

            if (pickupPoint == null)
            {
                throw new InvalidOperationException(
                    $"Pickup point ID {pickupPointId} was not found.");
            }

            if (pickupPoint.RouteId != routeId)
            {
                throw new InvalidOperationException(
                    $"Pickup point ID {pickupPointId} belongs to route ID " +
                    $"{pickupPoint.RouteId}, but the selected route ID is {routeId}.");
            }

            if (pickupPoint.IsDeleted)
            {
                throw new InvalidOperationException(
                    $"Pickup point ID {pickupPointId} has been deleted.");
            }

            if (!pickupPoint.Status)
            {
                throw new InvalidOperationException(
                    $"Pickup point ID {pickupPointId} is inactive.");
            }

            // -----------------------------------------------------
            // Validate Vehicle Assignment
            // -----------------------------------------------------
            var vehicleAssignment = await _context
                .TransportVehicleAssignments
                .AsNoTracking()
                .Where(x =>
                    x.AssignmentId == vehicleAssignmentId)
                .Select(x => new
                {
                    x.AssignmentId,
                    x.RouteId,
                    x.EffectiveFrom,
                    x.EffectiveTo,
                    x.IsDeleted,
                    x.Status,

                    VehicleExists = x.Vehicle != null,
                    VehicleActive =
                        x.Vehicle != null &&
                        !x.Vehicle.IsDeleted &&
                        x.Vehicle.Status,

                    DriverExists = x.Driver != null,
                    DriverActive =
                        x.Driver != null &&
                        !x.Driver.IsDeleted &&
                        x.Driver.Status
                })
                .FirstOrDefaultAsync();

            if (vehicleAssignment == null)
            {
                throw new InvalidOperationException(
                    $"Vehicle assignment ID {vehicleAssignmentId} was not found.");
            }

            if (vehicleAssignment.RouteId != routeId)
            {
                throw new InvalidOperationException(
                    $"Vehicle assignment ID {vehicleAssignmentId} belongs to route ID " +
                    $"{vehicleAssignment.RouteId}, but the selected route ID is {routeId}.");
            }

            if (vehicleAssignment.IsDeleted)
            {
                throw new InvalidOperationException(
                    $"Vehicle assignment ID {vehicleAssignmentId} has been deleted.");
            }

            if (!vehicleAssignment.Status)
            {
                throw new InvalidOperationException(
                    $"Vehicle assignment ID {vehicleAssignmentId} is inactive.");
            }

            if (!vehicleAssignment.VehicleExists)
            {
                throw new InvalidOperationException(
                    "No vehicle is linked to the selected vehicle assignment.");
            }

            if (!vehicleAssignment.VehicleActive)
            {
                throw new InvalidOperationException(
                    "The vehicle linked to the selected assignment is inactive or deleted.");
            }

            if (!vehicleAssignment.DriverExists)
            {
                throw new InvalidOperationException(
                    "No driver is linked to the selected vehicle assignment.");
            }

            if (!vehicleAssignment.DriverActive)
            {
                throw new InvalidOperationException(
                    "The driver linked to the selected assignment is inactive or deleted.");
            }

            // -----------------------------------------------------
            // Validate Assignment Date Range
            // -----------------------------------------------------
            var assignmentStart =
                vehicleAssignment.EffectiveFrom.Date;

            var assignmentEnd =
                vehicleAssignment.EffectiveTo?.Date;

            if (effectiveFrom.Date < assignmentStart)
            {
                throw new InvalidOperationException(
                    $"Student assignment cannot start before the vehicle assignment start date " +
                    $"{assignmentStart:yyyy-MM-dd}.");
            }

            if (assignmentEnd.HasValue)
            {
                if (!effectiveTo.HasValue)
                {
                    throw new InvalidOperationException(
                        $"Effective To date is required because the vehicle assignment ends on " +
                        $"{assignmentEnd.Value:yyyy-MM-dd}.");
                }

                if (effectiveTo.Value.Date > assignmentEnd.Value)
                {
                    throw new InvalidOperationException(
                        $"Student assignment cannot end after the vehicle assignment end date " +
                        $"{assignmentEnd.Value:yyyy-MM-dd}.");
                }
            }
        }

        // ---------------------------------------------------------
        // Normalize Create DTO
        // ---------------------------------------------------------
        private static void NormalizeDto(
            CreateStudentTransportAssignmentDto dto)
        {
            dto.TransportType = NormalizeTransportType(
                dto.TransportType);

            dto.Remarks = string.IsNullOrWhiteSpace(dto.Remarks)
                ? null
                : dto.Remarks.Trim();
        }

        // ---------------------------------------------------------
        // Normalize Update DTO
        // ---------------------------------------------------------
        private static void NormalizeDto(
            UpdateStudentTransportAssignmentDto dto)
        {
            dto.TransportType = NormalizeTransportType(
                dto.TransportType);

            dto.Remarks = string.IsNullOrWhiteSpace(dto.Remarks)
                ? null
                : dto.Remarks.Trim();
        }

        // ---------------------------------------------------------
        // Normalize Transport Type
        // ---------------------------------------------------------
        private static string NormalizeTransportType(
            string? transportType)
        {
            var value = transportType?.Trim();

            if (string.IsNullOrWhiteSpace(value))
                return string.Empty;

            return value.ToLowerInvariant() switch
            {
                "pickup" => "Pickup",
                "drop" => "Drop",
                "both" => "Both",
                _ => value
            };
        }
    }
}