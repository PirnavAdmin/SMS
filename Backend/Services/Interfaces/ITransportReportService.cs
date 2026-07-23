using SMS.Api.Dtos.Transport.Reports;

namespace SMS.Api.Services.Interfaces
{
    public interface ITransportReportService
    {
        Task<IEnumerable<VehicleStudentReportDto>> GetVehicleWiseAsync(ReportFilterDto filter);

        Task<IEnumerable<RouteStudentReportDto>> GetRouteWiseAsync(ReportFilterDto filter);

        Task<IEnumerable<PickupPointReportDto>> GetPickupPointWiseAsync(ReportFilterDto filter);

        Task<IEnumerable<DriverVehicleReportDto>> GetDriverWiseAsync(ReportFilterDto filter);

        Task<IEnumerable<VehicleStudentReportDto>> GetSeatOccupancyAsync(ReportFilterDto filter);

        Task<IEnumerable<MaintenanceReportDto>> GetMaintenanceAsync(ReportFilterDto filter);

        Task<IEnumerable<MonthlyMaintenanceCostDto>> GetMonthlyCostAsync(ReportFilterDto filter);
    }
}