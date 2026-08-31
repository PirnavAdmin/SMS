namespace SMS.Api.Helpers;

public static class RoleHelper
{
    public const string SuperAdmin = "Super Admin";
    public const string Admin = "Admin";
    public const string Principal = "Principal";
    public const string Teacher = "Teacher";
    public const string HostelWarden = "Hostel Warden";
    public const string TransportManager = "Transport Manager";
    public const string Driver = "Driver";
    public const string Librarian = "Librarian";
    public const string Accountant = "Accountant";
    public const string HR = "HR";
    public const string Receptionist = "Receptionist";
    public const string Staff = "Staff";
    public const string Student = "Student";
    public const string Parent = "Parent";

    public static string NormalizeRoleName(string? roleOrDesignation, string? employeeCategory = null, string? department = null)
    {
        var raw = $"{roleOrDesignation} {employeeCategory} {department}".Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(raw)) return Staff;

        if (raw.Contains("superadmin") || raw.Contains("super admin") || raw.Contains("system owner"))
            return Admin;

        if (raw.Contains("admin") || raw.Contains("administrator"))
            return Admin;

        if (raw.Contains("principal") || raw.Contains("headmaster") || raw.Contains("headmistress") || raw.Contains("director"))
            return Principal;

        if (raw.Contains("warden") || raw.Contains("hostel"))
            return HostelWarden;

        if (raw.Contains("driver") || raw.Contains("bus driver") || raw.Contains("bus attendant") || raw.Contains("conductor") || raw.Contains("chauffeur"))
            return Driver;

        if (raw.Contains("transport manager") || raw.Contains("transport incharge") || raw.Contains("transport head") || raw.Contains("transport admin") || raw.Contains("transport"))
            return TransportManager;

        if (raw.Contains("librar"))
            return Librarian;

        if (raw.Contains("account") || raw.Contains("finance") || raw.Contains("cashier") || raw.Contains("bursar"))
            return Accountant;

        if (raw.Contains("hr") || raw.Contains("human resource") || raw.Contains("recruiter"))
            return HR;

        if (raw.Contains("reception") || raw.Contains("front desk") || raw.Contains("clerk") || raw.Contains("operator"))
            return Receptionist;

        if ((employeeCategory ?? "").ToLowerInvariant().Contains("teach") || raw.Contains("teach") || raw.Contains("faculty") || raw.Contains("professor") || raw.Contains("lecturer"))
            return Teacher;

        if (raw.Contains("student") || raw.Contains("pupil") || raw.Contains("scholar"))
            return Student;

        if (raw.Contains("parent") || raw.Contains("guardian") || raw.Contains("father") || raw.Contains("mother"))
            return Parent;

        return Staff;
    }
}
