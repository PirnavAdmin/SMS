using System;
using MySqlConnector;

try
{
    using var conn = new MySqlConnection("Server=127.0.0.1;Database=sms_new;User=root;Password=root;");
    conn.Open();
    
    Console.WriteLine("=== TABLES AND ROW COUNTS ===");
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "SHOW TABLES;";
        var tables = new System.Collections.Generic.List<string>();
        using (var reader = cmd.ExecuteReader())
        {
            while (reader.Read())
            {
                tables.Add(reader.GetString(0));
            }
        }

        foreach (var table in tables)
        {
            cmd.CommandText = $"SELECT COUNT(*) FROM `{table}`;";
            var count = cmd.ExecuteScalar();
            Console.WriteLine($"- Table: {table} | Row Count: {count}");
        }
    }

    Console.WriteLine("\n=== ACADEMIC CLASSES ===");
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "SELECT ClassId, ClassName, CampusLocation, AcademicYear, Status FROM classes;";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"- ClassId: {reader.GetValue(0)} | ClassName: {reader.GetValue(1)} | Location: {reader.GetValue(2)} | Year: {reader.GetValue(3)} | Status: {reader.GetValue(4)}");
        }
    }

    Console.WriteLine("\n=== CLASS SECTIONS ===");
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "SELECT id, ClassId, section_letter, Capacity, Status FROM class_sections;";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"- SectionId: {reader.GetValue(0)} | ClassId: {reader.GetValue(1)} | Section: {reader.GetValue(2)} | Capacity: {reader.GetValue(3)} | Status: {reader.GetValue(4)}");
        }
    }

    Console.WriteLine("\n=== SUBJECTS ===");
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "SELECT SubjectId, SubjectCode, SubjectName, CourseCode, DepartmentId FROM subjects;";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"- SubjectId: {reader.GetValue(0)} | Code: {reader.GetValue(1)} | Name: {reader.GetValue(2)} | Course: {reader.GetValue(3)} | DeptId: {reader.GetValue(4)}");
        }
    }

    Console.WriteLine("\n=== CLASS SUBJECT MAPPINGS ===");
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "SELECT id, ClassId, SubjectId, section_letter, Status FROM class_subject_mappings;";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"- MappingId: {reader.GetValue(0)} | ClassId: {reader.GetValue(1)} | SubjectId: {reader.GetValue(2)} | Section: {reader.GetValue(3)} | Status: {reader.GetValue(4)}");
        }
    }

    Console.WriteLine("\n=== TEACHER ASSIGNMENTS ===");
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "SELECT id, class_id, section_letter, subject_id, teacher_id, role, status FROM teacher_assignments;";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"- AssignmentId: {reader.GetValue(0)} | ClassId: {reader.GetValue(1)} | Section: {reader.GetValue(2)} | SubjectId: {reader.GetValue(3)} | TeacherId: {reader.GetValue(4)} | Role: {reader.GetValue(5)} | Status: {reader.GetValue(6)}");
        }
    }

    Console.WriteLine("\n=== STAFF DATA ===");
    using (var cmd = conn.CreateCommand())
    {
        cmd.CommandText = "SELECT StaffId, EmployeeId, EmployeeCategory, FirstName, LastName, Designation, Department, IsActive, IsClassTeacherEligible FROM staff LIMIT 20;";
        using var reader = cmd.ExecuteReader();
        while (reader.Read())
        {
            Console.WriteLine($"- StaffId: {reader.GetValue(0)} | EmpId: {reader.GetValue(1)} | Cat: {reader.GetValue(2)} | Name: {reader.GetValue(3)} {reader.GetValue(4)} | Desg: {reader.GetValue(5)} | Dept: {reader.GetValue(6)} | Active: {reader.GetValue(7)} | Eligible: {reader.GetValue(8)}");
        }
    }
}
catch (Exception ex)
{
    Console.WriteLine($"ERROR: {ex.Message}");
}
