namespace SMS.Api.Controllers;

using Microsoft.AspNetCore.Mvc;

// Legacy TransportController routes disabled to avoid AmbiguousMatchException
// with dedicated Transport module controllers (TransportVehicleController, TransportRouteController, TransportDriverController).
[ApiController]
[Route("api/legacy/transport")]
[ApiExplorerSettings(IgnoreApi = true)]
public class LegacyTransportController : ControllerBase
{
}
