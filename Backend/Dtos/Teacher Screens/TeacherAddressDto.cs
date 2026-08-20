namespace SMS.Api.Dtos.TeacherScreens;

using System.ComponentModel.DataAnnotations;

public class TeacherAddressDto
{
    public int StaffId { get; set; }

    public string CurrentAddress { get; set; } = string.Empty;

    public string? PermanentAddress { get; set; }

    public string City { get; set; } = string.Empty;

    public string? District { get; set; }

    public string State { get; set; } = string.Empty;

    public string Country { get; set; } = "India";

    public string PinCode { get; set; } = string.Empty;
}

public class CreateTeacherAddressDto
{
    [Required(ErrorMessage = "Current address is required.")]
    public string CurrentAddress { get; set; } = string.Empty;

    public string? PermanentAddress { get; set; }

    [Required(ErrorMessage = "City is required.")]
    public string City { get; set; } = string.Empty;

    public string? District { get; set; }

    [Required(ErrorMessage = "State is required.")]
    public string State { get; set; } = string.Empty;

    [Required(ErrorMessage = "Country is required.")]
    public string Country { get; set; } = "India";

    [Required(ErrorMessage = "PIN code is required.")]
    public string PinCode { get; set; } = string.Empty;
}

public class UpdateTeacherAddressDto
{
    public string? CurrentAddress { get; set; }

    public string? PermanentAddress { get; set; }

    public string? City { get; set; }

    public string? District { get; set; }

    public string? State { get; set; }

    public string? Country { get; set; }

    public string? PinCode { get; set; }
}
