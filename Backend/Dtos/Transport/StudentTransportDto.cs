namespace SMS.Api.Dtos;

using System.Collections.Generic;

public class StudentTransportResponseDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string ClassName { get; set; } = string.Empty;
    public string AdmissionNo { get; set; } = string.Empty;
    public string StudentType { get; set; } = "Non-Residential";
    public bool IsHosteller { get; set; } = false;
    public bool HasTransportAccess { get; set; } = true;
    public string Message { get; set; } = string.Empty;

    public bool RfidBoarded { get; set; } = false;
    public string RfidBoardingStatus { get; set; } = string.Empty;
    public string EtaMinutes { get; set; } = string.Empty;

    public string RouteNumber { get; set; } = string.Empty;
    public string RouteName { get; set; } = string.Empty;
    public string PickupStop { get; set; } = string.Empty;
    public string MorningPickupTime { get; set; } = string.Empty;
    public string EveningDropTime { get; set; } = string.Empty;

    public string BusNumber { get; set; } = string.Empty;
    public string RegistrationNumber { get; set; } = string.Empty;
    public string DriverName { get; set; } = string.Empty;
    public string DriverPhone { get; set; } = string.Empty;
    public string AttendantName { get; set; } = string.Empty;
    public string AttendantPhone { get; set; } = string.Empty;
    public string GpsStatus { get; set; } = string.Empty;
}

public class TransportDropdownOptionsDto
{
    public List<string> AcademicYears { get; set; } = new List<string> { "2027-28", "2026-27", "2025-26" };
}
