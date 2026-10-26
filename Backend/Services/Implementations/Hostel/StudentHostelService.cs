namespace SMS.Api.Services.Implementations;

using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

public class StudentHostelService : IStudentHostelService
{
    private readonly AppDbContext _context;

    public StudentHostelService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<HostelDropdownOptionsDto> GetHostelDropdownOptionsAsync()
    {
        var dbYears = await _context.AcademicYears.AsNoTracking().Select(y => y.AcademicYearName).ToListAsync();
        return new HostelDropdownOptionsDto
        {
            AcademicYears = dbYears.Count > 0 ? dbYears : new List<string> { "2026-27" }
        };
    }

    public async Task<StudentHostelResponseDto> GetStudentHostelDetailsAsync(int? studentId, string? academicYear = "2027-28")
    {
        int targetStudentId = studentId ?? 1;

        // Fetch real student details from Students or AdmissionApplications
        var student = await _context.Students.AsNoTracking()
            .Include(s => s.ClassGrade)
            .Include(s => s.Branch)
            .FirstOrDefaultAsync(s => s.StudentId == targetStudentId);

        var admission = await _context.AdmissionApplications.AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == targetStudentId || (student != null && !string.IsNullOrEmpty(student.AdmissionNumber) && a.AdmissionNo == student.AdmissionNumber));

        string resolvedName = student?.StudentName ?? $"{admission?.FirstName} {admission?.LastName}".Trim();
        if (string.IsNullOrWhiteSpace(resolvedName))
        {
            resolvedName = "Student";
        }

        string resolvedType = admission?.StudentType ?? (student != null ? "Non-Residential" : "Non-Residential");

        try
        {
            // Query bed allocation from DB including Hostel and Room navigation properties
            var allocation = await _context.StudentBedAllocations.AsNoTracking()
                .Include(b => b.Hostel)
                .Include(b => b.Room)
                .FirstOrDefaultAsync(b => (b.StudentId == targetStudentId || (student != null && !string.IsNullOrEmpty(student.AdmissionNumber) && b.RegistrationNo == student.AdmissionNumber)) && b.Status != null && b.Status.Equals("Active", StringComparison.OrdinalIgnoreCase));

            if (allocation != null)
            {
                return new StudentHostelResponseDto
                {
                    StudentId = targetStudentId,
                    StudentName = allocation.StudentName ?? resolvedName,
                    StudentType = "Residential",
                    IsHosteller = true,
                    IsAssigned = true,
                    Message = $"{allocation.StudentName ?? resolvedName} is assigned to campus residential facilities.",
                    HostelName = allocation.Hostel?.HostelName ?? "Campus Hostel",
                    HostelType = allocation.Hostel?.HostelType ?? "General",
                    RoomNo = allocation.Room?.RoomNumber ?? "N/A",
                    BedNo = allocation.BedNumber ?? "N/A",
                    WardenName = allocation.Hostel?.WardenName ?? "Hostel Warden",
                    WardenMobile = allocation.Hostel?.PrimaryMobileNumber ?? "",
                    WardenAlternateMobile = ""
                };
            }
        }
        catch
        {
            // Fallback gracefully if database is unreachable
        }

        // Dynamic Non-Residential response
        return new StudentHostelResponseDto
        {
            StudentId = targetStudentId,
            StudentName = resolvedName,
            StudentType = resolvedType,
            IsHosteller = false,
            IsAssigned = false,
            Message = $"{resolvedName} is registered as a {resolvedType} student and is not assigned to any campus residential facilities."
        };
    }
}
