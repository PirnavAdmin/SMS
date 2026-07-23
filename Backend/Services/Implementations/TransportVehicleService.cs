using SMS.Api.Common;
using SMS.Api.Dtos.Transport.Vehicle;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class TransportVehicleService : ITransportVehicleService
    {
        private readonly ITransportVehicleRepository _repository;

        public TransportVehicleService(ITransportVehicleRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedResult<TransportVehicleDto>> GetAllAsync(
            TransportVehicleFilterDto filter)
        {
            return await _repository.GetAllAsync(filter);
        }

        public async Task<TransportVehicleDto?> GetByIdAsync(long vehicleId)
        {
            return await _repository.GetByIdAsync(vehicleId);
        }

        public async Task<long> CreateAsync(
            CreateTransportVehicleDto dto,
            long? userId)
        {
            var exists = await _repository.ExistsAsync(
                dto.VehicleNumber,
                dto.RegistrationNumber);

            if (exists)
                throw new Exception("Vehicle Number or Registration Number already exists.");

            return await _repository.CreateAsync(dto, userId);
        }

        public async Task<bool> UpdateAsync(
            long vehicleId,
            UpdateTransportVehicleDto dto,
            long? userId)
        {
            var exists = await _repository.ExistsAsync(
                dto.VehicleNumber,
                dto.RegistrationNumber,
                vehicleId);

            if (exists)
                throw new Exception("Vehicle Number or Registration Number already exists.");

            return await _repository.UpdateAsync(
                vehicleId,
                dto,
                userId);
        }

        public async Task<bool> DeleteAsync(
            long vehicleId,
            long? userId)
        {
            return await _repository.DeleteAsync(vehicleId, userId);
        }

        public async Task<IEnumerable<TransportVehicleLookupDto>> GetLookupAsync()
        {
            return await _repository.GetLookupAsync();
        }
    }
}