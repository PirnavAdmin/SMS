using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using SMS.Api.Dtos.Transport.VehicleMaintenance;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Controllers.Transport
{
    [ApiController]
    [Route("api/v1/vehicle-maintenance")]
    [Authorize]
    public class VehicleMaintenanceController : ControllerBase
    {
        private readonly IVehicleMaintenanceService _service;

        public VehicleMaintenanceController(
            IVehicleMaintenanceService service)
        {
            _service = service;
        }

        //-------------------------------------------------------
        // GET ALL
        //-------------------------------------------------------

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] VehicleMaintenanceFilterDto filter)
        {
            var result = await _service.GetAllAsync(filter);

            return Ok(new
            {
                success = true,
                totalCount = result.TotalCount,
                data = result.Items
            });
        }

        //-------------------------------------------------------
        // GET BY ID
        //-------------------------------------------------------

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var result = await _service.GetByIdAsync(id);

            if (result == null)
                return NotFound(new
                {
                    success = false,
                    message = "Vehicle maintenance record not found."
                });

            return Ok(new
            {
                success = true,
                data = result
            });
        }

        //-------------------------------------------------------
        // CREATE
        //-------------------------------------------------------

        [HttpPost]
        public async Task<IActionResult> Create(
            CreateVehicleMaintenanceDto dto)
        {
            var userId = GetUserId();

            var id = await _service.CreateAsync(dto, userId);

            return Ok(new
            {
                success = true,
                message = "Vehicle maintenance created successfully.",
                maintenanceId = id
            });
        }

        //-------------------------------------------------------
        // UPDATE
        //-------------------------------------------------------

        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(
            long id,
            UpdateVehicleMaintenanceDto dto)
        {
            var userId = GetUserId();

            var updated = await _service.UpdateAsync(
                id,
                dto,
                userId);

            return Ok(new
            {
                success = updated,
                message = updated
                    ? "Vehicle maintenance updated successfully."
                    : "Vehicle maintenance not found."
            });
        }

        //-------------------------------------------------------
        // DELETE
        //-------------------------------------------------------

        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var userId = GetUserId();

            var deleted = await _service.DeleteAsync(
                id,
                userId);

            return Ok(new
            {
                success = deleted,
                message = deleted
                    ? "Vehicle maintenance deleted successfully."
                    : "Vehicle maintenance not found."
            });
        }

        //-------------------------------------------------------
        // LOOKUP
        //-------------------------------------------------------

        [HttpGet("lookup")]
        public async Task<IActionResult> Lookup()
        {
            var data = await _service.GetLookupAsync();

            return Ok(new
            {
                success = true,
                data
            });
        }

        //-------------------------------------------------------
        // GET LOGGED-IN USER ID
        //-------------------------------------------------------

        private long GetUserId()
        {
            var claim = User.FindFirst("UserId")
                     ?? User.FindFirst(ClaimTypes.NameIdentifier);

            if (claim == null)
                throw new UnauthorizedAccessException("User not authenticated.");

            return Convert.ToInt64(claim.Value);
        }
    }
}