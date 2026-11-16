using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;
using SMS.Api.Models.FinanceManagement;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class BackupService : IBackupService
    {
        private readonly AppDbContext _context;
        private readonly string _backupDir;

        public BackupService(AppDbContext context)
        {
            _context = context;
            _backupDir = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "backups");
            if (!Directory.Exists(_backupDir))
            {
                Directory.CreateDirectory(_backupDir);
            }
        }

        public async Task<BackupStatusDto> GetBackupStatusAsync(int? schoolId)
        {
            var studentCount = await _context.Students.CountAsync();
            var staffCount = await _context.Staff.CountAsync();
            var classCount = await _context.Classes.CountAsync();
            var sectionCount = await _context.ClassSections.CountAsync();
            var subjectCount = await _context.Subjects.CountAsync();
            var feeHeadCount = await _context.FeeHeads.CountAsync();
            var feeStructureCount = await _context.DynamicFeeStructures.CountAsync();
            var academicYearCount = await _context.AcademicYears.CountAsync();
            var branchCount = await _context.Branches.CountAsync();
            var settings = await _context.SchoolSettings.FirstOrDefaultAsync();

            var totalRecords = studentCount + staffCount + classCount + sectionCount +
                               subjectCount + feeHeadCount + feeStructureCount +
                               academicYearCount + branchCount + (settings != null ? 1 : 0);

            // Check latest snapshot date
            string? lastBackupDate = null;
            try
            {
                var files = Directory.GetFiles(_backupDir, "*.json");
                if (files.Length > 0)
                {
                    var latest = files.Select(f => new FileInfo(f)).OrderByDescending(f => f.CreationTimeUtc).FirstOrDefault();
                    if (latest != null)
                    {
                        lastBackupDate = latest.CreationTimeUtc.ToString("yyyy-MM-dd HH:mm:ss UTC");
                    }
                }
            }
            catch { }

            return new BackupStatusDto
            {
                DatabaseEngine = "MySQL 8.0 (InnoDB)",
                SchoolId = schoolId,
                SchoolName = settings?.SchoolName ?? "Institutional Portal",
                TotalRecords = totalRecords,
                LastBackupDate = lastBackupDate,
                Modules = new List<BackupModuleCountDto>
                {
                    new BackupModuleCountDto { Module = "Students & Admissions", Count = studentCount, Description = "Active student directory, parent links, roll numbers & enrollments" },
                    new BackupModuleCountDto { Module = "Faculty & Staff", Count = staffCount, Description = "Staff members, designations, departments & employment roles" },
                    new BackupModuleCountDto { Module = "Classes & Sections", Count = classCount + sectionCount, Description = $"{classCount} Grade Classes and {sectionCount} Classroom Sections" },
                    new BackupModuleCountDto { Module = "Academic Subjects", Count = subjectCount, Description = "Curriculum subject definitions, codes & grade assignments" },
                    new BackupModuleCountDto { Module = "Fee Heads & Structures", Count = feeHeadCount + feeStructureCount, Description = "Institutional fee rules, heads, frequencies & amounts" },
                    new BackupModuleCountDto { Module = "Academic Years & Calendars", Count = academicYearCount, Description = "Academic sessions, term dates, and calendar setups" },
                    new BackupModuleCountDto { Module = "Campus Branches", Count = branchCount, Description = "Registered campus locations, contact information & facilities" },
                    new BackupModuleCountDto { Module = "System Settings & IDs", Count = settings != null ? 1 : 0, Description = "School profile branding, automated ID sequences & system configurations" }
                }
            };
        }

        public async Task<DatabaseBackupPayloadDto> GenerateBackupDataAsync(int? schoolId, string userName, string userRole)
        {
            var settings = await _context.SchoolSettings.AsNoTracking().FirstOrDefaultAsync();
            var automatedIdFormats = await _context.AutomatedIdFormats.AsNoTracking().ToListAsync();
            var branches = await _context.Branches.AsNoTracking().ToListAsync();
            var academicYears = await _context.AcademicYears.AsNoTracking().ToListAsync();
            var departments = await _context.Departments.AsNoTracking().ToListAsync();
            var designations = await _context.DesignationMasters.AsNoTracking().ToListAsync();
            var classes = await _context.Classes.AsNoTracking().ToListAsync();
            var sections = await _context.ClassSections.AsNoTracking().ToListAsync();
            var subjects = await _context.Subjects.AsNoTracking().ToListAsync();
            var feeHeads = await _context.FeeHeads.AsNoTracking().ToListAsync();
            var feeStructures = await _context.DynamicFeeStructures.AsNoTracking().ToListAsync();
            var students = await _context.Students.AsNoTracking().ToListAsync();
            var staff = await _context.Staff.AsNoTracking().ToListAsync();

            var totalRecords = branches.Count + academicYears.Count + departments.Count +
                               designations.Count + classes.Count + sections.Count +
                               subjects.Count + feeHeads.Count + feeStructures.Count +
                               students.Count + staff.Count + (settings != null ? 1 : 0);

            var schoolName = settings?.SchoolName ?? "Institutional Portal";

            return new DatabaseBackupPayloadDto
            {
                FormatVersion = "2.0",
                ExportedAt = DateTime.UtcNow,
                ExportedBy = userName,
                UserRole = userRole,
                SchoolId = schoolId,
                SchoolName = schoolName,
                TotalRecords = totalRecords,
                Settings = settings,
                AutomatedIdFormats = automatedIdFormats.Cast<object>().ToList(),
                Campuses = branches.Cast<object>().ToList(),
                AcademicYears = academicYears.Cast<object>().ToList(),
                Departments = departments.Cast<object>().ToList(),
                Designations = designations.Cast<object>().ToList(),
                Classes = classes.Cast<object>().ToList(),
                Sections = sections.Cast<object>().ToList(),
                Subjects = subjects.Cast<object>().ToList(),
                FeeHeads = feeHeads.Cast<object>().ToList(),
                FeeStructures = feeStructures.Cast<object>().ToList(),
                Students = students.Cast<object>().ToList(),
                Staff = staff.Cast<object>().ToList()
            };
        }

        public async Task<BackupSnapshotItemDto> CreateServerSnapshotAsync(int? schoolId, string userName, string userRole)
        {
            var payload = await GenerateBackupDataAsync(schoolId, userName, userRole);
            var safeName = string.Join("_", (payload.SchoolName ?? "school").Split(Path.GetInvalidFileNameChars())).Replace(" ", "_").ToLower();
            var fileName = $"sms_snapshot_{safeName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
            var filePath = Path.Combine(_backupDir, fileName);

            var jsonOptions = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNameCaseInsensitive = true
            };
            var jsonString = JsonSerializer.Serialize(payload, jsonOptions);
            await File.WriteAllTextAsync(filePath, jsonString);

            var fi = new FileInfo(filePath);

            // Record audit log
            try
            {
                var audit = new AuditLog
                {
                    Action = "Database Backup Snapshot Created",
                    Details = $"Created server backup snapshot '{fileName}' containing {payload.TotalRecords} records across 12 modules.",
                    UserName = userName,
                    UserRole = userRole,
                    Timestamp = DateTime.UtcNow,
                    SchoolId = schoolId,
                    IpAddress = "127.0.0.1"
                };
                _context.AuditLogs.Add(audit);
                await _context.SaveChangesAsync();
            }
            catch { }

            return new BackupSnapshotItemDto
            {
                FileName = fileName,
                FileSizeBytes = fi.Length,
                FileSizeFormatted = FormatBytes(fi.Length),
                CreatedAt = fi.CreationTimeUtc,
                CreatedAtFormatted = fi.CreationTimeUtc.ToString("yyyy-MM-dd HH:mm:ss"),
                CreatedBy = userName,
                TotalRecords = payload.TotalRecords,
                SchoolName = payload.SchoolName
            };
        }

        public async Task<List<BackupSnapshotItemDto>> GetSnapshotsAsync(int? schoolId)
        {
            var list = new List<BackupSnapshotItemDto>();
            if (!Directory.Exists(_backupDir)) return list;

            var files = Directory.GetFiles(_backupDir, "*.json");
            foreach (var filePath in files)
            {
                try
                {
                    var fi = new FileInfo(filePath);
                    var rawText = await File.ReadAllTextAsync(filePath);
                    using var doc = JsonDocument.Parse(rawText);
                    var root = doc.RootElement;

                    string exportedBy = root.TryGetProperty("exportedBy", out var expBy) ? expBy.GetString() ?? "Administrator" : "Administrator";
                    string schoolName = root.TryGetProperty("schoolName", out var scName) ? scName.GetString() ?? "" : "";
                    int totalRecords = root.TryGetProperty("totalRecords", out var tr) ? tr.GetInt32() : 0;
                    DateTime createdAt = root.TryGetProperty("exportedAt", out var expAt) && expAt.TryGetDateTime(out var dt) ? dt : fi.CreationTimeUtc;

                    list.Add(new BackupSnapshotItemDto
                    {
                        FileName = fi.Name,
                        FileSizeBytes = fi.Length,
                        FileSizeFormatted = FormatBytes(fi.Length),
                        CreatedAt = createdAt,
                        CreatedAtFormatted = createdAt.ToString("yyyy-MM-dd HH:mm:ss"),
                        CreatedBy = exportedBy,
                        TotalRecords = totalRecords,
                        SchoolName = schoolName
                    });
                }
                catch
                {
                    var fi = new FileInfo(filePath);
                    list.Add(new BackupSnapshotItemDto
                    {
                        FileName = fi.Name,
                        FileSizeBytes = fi.Length,
                        FileSizeFormatted = FormatBytes(fi.Length),
                        CreatedAt = fi.CreationTimeUtc,
                        CreatedAtFormatted = fi.CreationTimeUtc.ToString("yyyy-MM-dd HH:mm:ss"),
                        CreatedBy = "System",
                        TotalRecords = 0,
                        SchoolName = "Institutional Snapshot"
                    });
                }
            }

            return list.OrderByDescending(s => s.CreatedAt).ToList();
        }

        public async Task<(byte[] bytes, string fileName)> GetSnapshotFileAsync(string fileName)
        {
            var cleanFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(_backupDir, cleanFileName);
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Backup snapshot file '{cleanFileName}' not found.");
            }

            var bytes = await File.ReadAllBytesAsync(filePath);
            return (bytes, cleanFileName);
        }

        public async Task<RestoreResultDto> RestoreFromPayloadAsync(DatabaseBackupPayloadDto payload, int? schoolId, string userName, string userRole)
        {
            if (payload == null)
            {
                throw new ArgumentException("Invalid backup payload.");
            }

            var moduleCounts = new Dictionary<string, int>();
            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            var strategy = _context.Database.CreateExecutionStrategy();
            await strategy.ExecuteAsync(async () =>
            {
                using var transaction = await _context.Database.BeginTransactionAsync();
                try
                {
                    // 1. Settings
                    if (payload.Settings != null)
                    {
                        var settingsJson = JsonSerializer.Serialize(payload.Settings);
                        var settingsObj = JsonSerializer.Deserialize<SchoolSettings>(settingsJson, jsonOptions);
                        if (settingsObj != null)
                        {
                            var existing = await _context.SchoolSettings.FirstOrDefaultAsync();
                            if (existing != null)
                            {
                                if (!string.IsNullOrWhiteSpace(settingsObj.SchoolName)) existing.SchoolName = settingsObj.SchoolName;
                                if (!string.IsNullOrWhiteSpace(settingsObj.Tagline)) existing.Tagline = settingsObj.Tagline;
                                if (!string.IsNullOrWhiteSpace(settingsObj.Address)) existing.Address = settingsObj.Address;
                                if (!string.IsNullOrWhiteSpace(settingsObj.Phone)) existing.Phone = settingsObj.Phone;
                                if (!string.IsNullOrWhiteSpace(settingsObj.Email)) existing.Email = settingsObj.Email;
                                if (!string.IsNullOrWhiteSpace(settingsObj.Website)) existing.Website = settingsObj.Website;
                                if (!string.IsNullOrWhiteSpace(settingsObj.PrincipalName)) existing.PrincipalName = settingsObj.PrincipalName;
                                if (!string.IsNullOrWhiteSpace(settingsObj.LogoUrl)) existing.LogoUrl = settingsObj.LogoUrl;
                                existing.UpdatedAt = DateTime.UtcNow;
                            }
                            else
                            {
                                settingsObj.Id = 0;
                                settingsObj.UpdatedAt = DateTime.UtcNow;
                                _context.SchoolSettings.Add(settingsObj);
                            }
                            moduleCounts["Settings"] = 1;
                        }
                    }

                    // 2. Branches / Campuses
                    if (payload.Campuses != null && payload.Campuses.Any())
                    {
                        int bCount = 0;
                        foreach (var item in payload.Campuses)
                        {
                            var json = JsonSerializer.Serialize(item);
                            var b = JsonSerializer.Deserialize<Branch>(json, jsonOptions);
                            if (b != null && !string.IsNullOrWhiteSpace(b.BranchName))
                            {
                                var existing = await _context.Branches.FirstOrDefaultAsync(x => x.BranchName.ToLower() == b.BranchName.ToLower());
                                if (existing != null)
                                {
                                    existing.Address = b.Address;
                                    existing.Phone = b.Phone;
                                    existing.Email = b.Email;
                                    existing.BranchCode = b.BranchCode;
                                }
                                else
                                {
                                    b.BranchId = 0;
                                    _context.Branches.Add(b);
                                }
                                bCount++;
                            }
                        }
                        moduleCounts["Branches"] = bCount;
                    }

                    // 3. Academic Years
                    if (payload.AcademicYears != null && payload.AcademicYears.Any())
                    {
                        int ayCount = 0;
                        foreach (var item in payload.AcademicYears)
                        {
                            var json = JsonSerializer.Serialize(item);
                            var ay = JsonSerializer.Deserialize<AcademicYear>(json, jsonOptions);
                            if (ay != null && !string.IsNullOrWhiteSpace(ay.AcademicYearName))
                            {
                                var existing = await _context.AcademicYears.FirstOrDefaultAsync(x => x.AcademicYearName.ToLower() == ay.AcademicYearName.ToLower());
                                if (existing != null)
                                {
                                    existing.StartDate = ay.StartDate;
                                    existing.EndDate = ay.EndDate;
                                    existing.IsCurrent = ay.IsCurrent;
                                }
                                else
                                {
                                    ay.AcademicYearId = 0;
                                    _context.AcademicYears.Add(ay);
                                }
                                ayCount++;
                            }
                        }
                        moduleCounts["AcademicYears"] = ayCount;
                    }

                    // 4. Departments
                    if (payload.Departments != null && payload.Departments.Any())
                    {
                        int deptCount = 0;
                        foreach (var item in payload.Departments)
                        {
                            var json = JsonSerializer.Serialize(item);
                            var d = JsonSerializer.Deserialize<Department>(json, jsonOptions);
                            if (d != null && !string.IsNullOrWhiteSpace(d.DepartmentName))
                            {
                                var existing = await _context.Departments.FirstOrDefaultAsync(x => x.DepartmentName.ToLower() == d.DepartmentName.ToLower());
                                if (existing != null)
                                {
                                    existing.DepartmentCode = d.DepartmentCode;
                                    existing.Description = d.Description;
                                }
                                else
                                {
                                    d.DepartmentId = 0;
                                    _context.Departments.Add(d);
                                }
                                deptCount++;
                            }
                        }
                        moduleCounts["Departments"] = deptCount;
                    }

                    // 5. Classes & Sections
                    if (payload.Classes != null && payload.Classes.Any())
                    {
                        int cCount = 0;
                        foreach (var item in payload.Classes)
                        {
                            var json = JsonSerializer.Serialize(item);
                            var c = JsonSerializer.Deserialize<ClassGrade>(json, jsonOptions);
                            if (c != null && !string.IsNullOrWhiteSpace(c.ClassName))
                            {
                                var existing = await _context.Classes.FirstOrDefaultAsync(x => x.ClassName != null && x.ClassName.ToLower() == c.ClassName.ToLower());
                                if (existing == null)
                                {
                                    c.ClassId = 0;
                                    _context.Classes.Add(c);
                                }
                                cCount++;
                            }
                        }
                        moduleCounts["Classes"] = cCount;
                    }

                    // 6. Subjects
                    if (payload.Subjects != null && payload.Subjects.Any())
                    {
                        int subCount = 0;
                        foreach (var item in payload.Subjects)
                        {
                            var json = JsonSerializer.Serialize(item);
                            var s = JsonSerializer.Deserialize<Subject>(json, jsonOptions);
                            if (s != null && !string.IsNullOrWhiteSpace(s.SubjectName))
                            {
                                var existing = await _context.Subjects.FirstOrDefaultAsync(x => x.SubjectName != null && x.SubjectName.ToLower() == s.SubjectName.ToLower());
                                if (existing != null)
                                {
                                    existing.SubjectCode = s.SubjectCode;
                                }
                                else
                                {
                                    s.SubjectId = 0;
                                    _context.Subjects.Add(s);
                                }
                                subCount++;
                            }
                        }
                        moduleCounts["Subjects"] = subCount;
                    }

                    // 7. Fee Heads
                    if (payload.FeeHeads != null && payload.FeeHeads.Any())
                    {
                        int fhCount = 0;
                        foreach (var item in payload.FeeHeads)
                        {
                            var json = JsonSerializer.Serialize(item);
                            var fh = JsonSerializer.Deserialize<FeeHead>(json, jsonOptions);
                            if (fh != null && !string.IsNullOrWhiteSpace(fh.Name))
                            {
                                var existing = await _context.FeeHeads.FirstOrDefaultAsync(x => x.Name.ToLower() == fh.Name.ToLower());
                                if (existing != null)
                                {
                                    existing.Description = fh.Description;
                                    existing.Category = fh.Category;
                                    existing.Frequency = fh.Frequency;
                                }
                                else
                                {
                                    fh.Id = 0;
                                    _context.FeeHeads.Add(fh);
                                }
                                fhCount++;
                            }
                        }
                        moduleCounts["FeeHeads"] = fhCount;
                    }

                    // 8. Students
                    if (payload.Students != null && payload.Students.Any())
                    {
                        int stCount = 0;
                        foreach (var item in payload.Students)
                        {
                            var json = JsonSerializer.Serialize(item);
                            var st = JsonSerializer.Deserialize<Student>(json, jsonOptions);
                            if (st != null && !string.IsNullOrWhiteSpace(st.AdmissionNumber))
                            {
                                var existing = await _context.Students.FirstOrDefaultAsync(x => x.AdmissionNumber == st.AdmissionNumber);
                                if (existing != null)
                                {
                                    existing.StudentName = st.StudentName;
                                    existing.RollNumber = st.RollNumber;
                                    existing.Gender = st.Gender;
                                    existing.FatherName = st.FatherName;
                                    existing.FatherMobile = st.FatherMobile;
                                }
                                else
                                {
                                    st.StudentId = 0;
                                    _context.Students.Add(st);
                                }
                                stCount++;
                            }
                        }
                        moduleCounts["Students"] = stCount;
                    }

                    // 9. Staff
                    if (payload.Staff != null && payload.Staff.Any())
                    {
                        int staffCount = 0;
                        foreach (var item in payload.Staff)
                        {
                            var json = JsonSerializer.Serialize(item);
                            var stf = JsonSerializer.Deserialize<Staff>(json, jsonOptions);
                            if (stf != null && (!string.IsNullOrWhiteSpace(stf.EmployeeId) || !string.IsNullOrWhiteSpace(stf.Email)))
                            {
                                var existing = await _context.Staff.FirstOrDefaultAsync(x =>
                                    (!string.IsNullOrWhiteSpace(stf.EmployeeId) && x.EmployeeId == stf.EmployeeId) ||
                                    (!string.IsNullOrWhiteSpace(stf.Email) && x.Email == stf.Email));
                                if (existing != null)
                                {
                                    existing.FirstName = stf.FirstName;
                                    existing.LastName = stf.LastName;
                                    existing.Designation = stf.Designation;
                                    existing.Department = stf.Department;
                                    existing.Phone = stf.Phone;
                                }
                                else
                                {
                                    stf.StaffId = 0;
                                    _context.Staff.Add(stf);
                                }
                                staffCount++;
                            }
                        }
                        moduleCounts["Staff"] = staffCount;
                    }

                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    throw new InvalidOperationException($"Restore operation failed and was safely rolled back: {ex.Message}", ex);
                }
            });

            var totalRestored = moduleCounts.Values.Sum();

            // Record audit log
            try
            {
                var audit = new AuditLog
                {
                    Action = "Database Backup Restored",
                    Details = $"Restored database snapshot successfully. Synchronized {totalRestored} records across {moduleCounts.Count} modules.",
                    UserName = userName,
                    UserRole = userRole,
                    Timestamp = DateTime.UtcNow,
                    SchoolId = schoolId,
                    IpAddress = "127.0.0.1"
                };
                _context.AuditLogs.Add(audit);
                await _context.SaveChangesAsync();
            }
            catch { }

            return new RestoreResultDto
            {
                Success = true,
                Message = $"System data successfully restored and synchronized. {totalRestored} total records updated across {moduleCounts.Count} modules.",
                RestoredAt = DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"),
                RestoredBy = userName,
                TotalRestored = totalRestored,
                ModuleCounts = moduleCounts
            };
        }

        public async Task<RestoreResultDto> RestoreFromSnapshotFileAsync(string fileName, int? schoolId, string userName, string userRole)
        {
            var cleanFileName = Path.GetFileName(fileName);
            var filePath = Path.Combine(_backupDir, cleanFileName);
            if (!File.Exists(filePath))
            {
                throw new FileNotFoundException($"Backup snapshot '{cleanFileName}' was not found on the server.");
            }

            var jsonString = await File.ReadAllTextAsync(filePath);
            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var payload = JsonSerializer.Deserialize<DatabaseBackupPayloadDto>(jsonString, jsonOptions);

            if (payload == null)
            {
                throw new InvalidOperationException("Backup snapshot file content is invalid or corrupted.");
            }

            return await RestoreFromPayloadAsync(payload, schoolId, userName, userRole);
        }

        public async Task<RestoreResultDto> RestoreFromUploadedFileAsync(IFormFile file, int? schoolId, string userName, string userRole)
        {
            if (file == null || file.Length == 0)
            {
                throw new ArgumentException("No backup file provided.");
            }

            using var reader = new StreamReader(file.OpenReadStream());
            var jsonString = await reader.ReadToEndAsync();
            var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var payload = JsonSerializer.Deserialize<DatabaseBackupPayloadDto>(jsonString, jsonOptions);

            if (payload == null)
            {
                throw new InvalidOperationException("The uploaded file does not contain a valid JSON backup format.");
            }

            // Save copy in snapshots directory for history
            try
            {
                var safeOriginalName = Path.GetFileNameWithoutExtension(file.FileName).Replace(" ", "_");
                var snapshotFileName = $"sms_uploaded_{safeOriginalName}_{DateTime.UtcNow:yyyyMMdd_HHmmss}.json";
                var savePath = Path.Combine(_backupDir, snapshotFileName);
                await File.WriteAllTextAsync(savePath, jsonString);
            }
            catch { }

            return await RestoreFromPayloadAsync(payload, schoolId, userName, userRole);
        }

        private static string FormatBytes(long bytes)
        {
            if (bytes < 1024) return $"{bytes} B";
            if (bytes < 1024 * 1024) return $"{bytes / 1024.0:F1} KB";
            return $"{bytes / (1024.0 * 1024.0):F2} MB";
        }
    }
}
