using SMS.Api.Dtos.Transport.Reports;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class TransportReportService : ITransportReportService
    {
        private readonly ITransportReportRepository _repository;

        public TransportReportService(
            ITransportReportRepository repository)
        {
            _repository = repository;
        }

        //-------------------------------------------------------
        // Common Validation
        //-------------------------------------------------------

        private static void ValidateFilter(ReportFilterDto filter)
        {
            filter ??= new ReportFilterDto();

            if (filter.FromDate.HasValue &&
                filter.ToDate.HasValue &&
                filter.FromDate > filter.ToDate)
            {
                throw new ArgumentException(
                    "From Date cannot be greater than To Date.");
            }

            filter.Search = filter.Search?.Trim();
        }

        //-------------------------------------------------------
        // Vehicle Report
        //-------------------------------------------------------

        public async Task<IEnumerable<VehicleStudentReportDto>>
            GetVehicleWiseAsync(ReportFilterDto filter)
        {
            ValidateFilter(filter);

            return await _repository.GetVehicleWiseAsync(filter);
        }

        //-------------------------------------------------------
        // Route Report
        //-------------------------------------------------------

        public async Task<IEnumerable<RouteStudentReportDto>>
            GetRouteWiseAsync(ReportFilterDto filter)
        {
            ValidateFilter(filter);

            return await _repository.GetRouteWiseAsync(filter);
        }

        //-------------------------------------------------------
        // Pickup Report
        //-------------------------------------------------------

        public async Task<IEnumerable<PickupPointReportDto>>
            GetPickupPointWiseAsync(ReportFilterDto filter)
        {
            ValidateFilter(filter);

            return await _repository.GetPickupPointWiseAsync(filter);
        }

        //-------------------------------------------------------
        // Driver Report
        //-------------------------------------------------------

        public async Task<IEnumerable<DriverVehicleReportDto>>
            GetDriverWiseAsync(ReportFilterDto filter)
        {
            ValidateFilter(filter);

            return await _repository.GetDriverWiseAsync(filter);
        }

        //-------------------------------------------------------
        // Seat Occupancy
        //-------------------------------------------------------

        public async Task<IEnumerable<VehicleStudentReportDto>>
            GetSeatOccupancyAsync(ReportFilterDto filter)
        {
            ValidateFilter(filter);

            return await _repository.GetSeatOccupancyAsync(filter);
        }

        //-------------------------------------------------------
        // Maintenance Report
        //-------------------------------------------------------

        public async Task<IEnumerable<MaintenanceReportDto>>
            GetMaintenanceAsync(ReportFilterDto filter)
        {
            ValidateFilter(filter);

            return await _repository.GetMaintenanceAsync(filter);
        }

        //-------------------------------------------------------
        // Monthly Cost Report
        //-------------------------------------------------------

        public async Task<IEnumerable<MonthlyMaintenanceCostDto>>
            GetMonthlyCostAsync(ReportFilterDto filter)
        {
            ValidateFilter(filter);

            return await _repository.GetMonthlyCostAsync(filter);
        }
    }
}