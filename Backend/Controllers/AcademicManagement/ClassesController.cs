using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Dtos;
using SMS.Api.Dtos.AcademicManagement;
using SMS.Api.Models;
using SMS.Api.Models.AcademicManagement;

namespace SMS.Api.Controllers.AcademicManagement
{
    [ApiController]
    [Route("api/classes")]
    [Authorize]
    [Tags("Academic Classes & Sections")]
    public class ClassesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ClassesController(AppDbContext context)
        {
            _context = context;
        }

        // =========================================================
        // CATEGORY A: CLASS & SECTIONS CRUD
        // =========================================================

        // --- GET ALL TEACHER ASSIGNMENTS (for frontend persistence on reload) ---

        [HttpGet("teacher-assignments")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetAllTeacherAssignments()
        {
            var assignments = await _context.TeacherAssignments
                .AsNoTracking()
                .Include(ta => ta.Teacher)
                .Include(ta => ta.Subject)
                .Include(ta => ta.ClassGrade)
                .Where(ta => ta.Status == "Active")
                .ToListAsync();

            var result = assignments.Select(ta => new
            {
                id = $"TA-{ta.Id}",
                classId = $"CL-{ta.ClassId}",
                className = ta.ClassGrade?.ClassName ?? "",
                section = ta.SectionLetter,
                teacherId = ta.TeacherId.ToString(),
                teacherName = ta.Teacher != null ? $"{ta.Teacher.FirstName} {ta.Teacher.LastName}".Trim() : "",
                subject = ta.Subject?.SubjectName ?? "",
                subjectId = ta.SubjectId,
                role = ta.Role,
                status = ta.Status
            });

            return Ok(new { success = true, data = result });
        }

        [HttpGet]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetClasses()
        {
            var campus = Request.Headers["X-Branch-Id"].ToString();
            if (string.IsNullOrEmpty(campus)) campus = "Main Campus";

            var academicYear = Request.Headers["X-Academic-Year-Id"].ToString();
            if (string.IsNullOrEmpty(academicYear)) academicYear = "2026-2027";

            var classes = await _context.Classes
                .AsNoTracking()
                .Where(c => (c.CampusLocation == campus || string.IsNullOrEmpty(c.CampusLocation)) && 
                            (c.AcademicYear == academicYear || string.IsNullOrEmpty(c.AcademicYear)))
                .Include(c => c.Sections)
                .Include(c => c.SubjectMappings)
                    .ThenInclude(cs => cs.Subject)
                .Include(c => c.TeacherAssignments)
                    .ThenInclude(ta => ta.Teacher)
                .ToListAsync();

            var response = classes.Select(c => new ClassGradeResponseDto
            {
                ClassId = c.ClassId,
                ClassName = c.ClassName ?? "",
                Sections = c.Sections.Select(s =>
                {
                    var classTeacherAssign = c.TeacherAssignments
                        .FirstOrDefault(ta => ta.SectionLetter == s.SectionName && ta.Role == "Class Teacher");

                    return new SectionResponseDto
                    {
                        SectionId = s.SectionId,
                        SectionName = s.SectionName ?? "",
                        ClassTeacherEmpId = classTeacherAssign?.TeacherId,
                        ClassTeacherName = classTeacherAssign != null
                            ? $"{classTeacherAssign.Teacher.FirstName} {classTeacherAssign.Teacher.LastName}"
                            : null,
                        EmployeeId = classTeacherAssign?.Teacher?.EmployeeId
                    };
                }).ToList(),
                CurriculumSubjects = c.SubjectMappings.Select(sm => new SubjectDto
                {
                    SubjectId = sm.Subject.SubjectId,
                    SubjectCode = sm.Subject.SubjectCode ?? "",
                    SubjectName = sm.Subject.SubjectName ?? "",
                    CourseCode = sm.Subject.CourseCode ?? ""
                }).ToList()
            });

            return Ok(response);
        }


        [HttpGet("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetClassById(int id)
        {
            var classObj = await _context.Classes
                .AsNoTracking()
                .Include(c => c.Sections)
                .Include(c => c.SubjectMappings)
                    .ThenInclude(cs => cs.Subject)
                .Include(c => c.TeacherAssignments)
                    .ThenInclude(ta => ta.Teacher)
                .FirstOrDefaultAsync(c => c.ClassId == id);

            if (classObj == null)
            {
                return NotFound(new { success = false, message = $"Class Grade with ID '{id}' not found." });
            }

            var dto = new ClassGradeResponseDto
            {
                ClassId = classObj.ClassId,
                ClassName = classObj.ClassName ?? "",
                Sections = classObj.Sections.Select(s =>
                {
                    var classTeacherAssign = classObj.TeacherAssignments
                        .FirstOrDefault(ta => ta.SectionLetter == s.SectionName && ta.Role == "Class Teacher");

                    return new SectionResponseDto
                    {
                        SectionId = s.SectionId,
                        SectionName = s.SectionName,
                        ClassTeacherEmpId = classTeacherAssign?.TeacherId,
                        ClassTeacherName = classTeacherAssign != null
                            ? $"{classTeacherAssign.Teacher.FirstName} {classTeacherAssign.Teacher.LastName}"
                            : null,
                        EmployeeId = classTeacherAssign?.Teacher?.EmployeeId
                    };
                }).ToList(),
                CurriculumSubjects = classObj.SubjectMappings.Select(sm => new SubjectDto
                {
                    SubjectId = sm.Subject.SubjectId,
                    SubjectCode = sm.Subject.SubjectCode ?? "",
                    SubjectName = sm.Subject.SubjectName ?? "",
                    CourseCode = sm.Subject.CourseCode ?? ""
                }).ToList()
            };

            return Ok(dto);
        }

        [HttpPost]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> CreateClassGrade([FromBody] CreateClassGradeDto dto)
        {
            var campus = Request.Headers["X-Branch-Id"].ToString();
            if (string.IsNullOrEmpty(campus)) campus = "Main Campus";

            var academicYear = Request.Headers["X-Academic-Year-Id"].ToString();
            if (string.IsNullOrEmpty(academicYear)) academicYear = "2026-2027";

            var normalizedInput = NormalizeClassName(dto.Name ?? dto.ClassName);
            var existingClasses = await _context.Classes
                .Where(c => (c.CampusLocation == campus || string.IsNullOrEmpty(c.CampusLocation)) && 
                            (c.AcademicYear == academicYear || string.IsNullOrEmpty(c.AcademicYear)))
                .ToListAsync();

            if (existingClasses.Any(c => NormalizeClassName(c.ClassName ?? "") == normalizedInput))
            {
                return BadRequest(new { success = false, message = "A duplicate class name already exists for this campus and academic year." });
            }

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var classGrade = new ClassGrade
            {
                ClassName = dto.Name ?? dto.ClassName,
                CampusLocation = campus,
                AcademicYear = academicYear,
                Status = "Active",
                CreatedAt = DateTime.UtcNow
            };

            await _context.Classes.AddAsync(classGrade);
            await _context.SaveChangesAsync();

            // Handle sections
            var sectionLetters = dto.SectionNames ?? dto.Sections.Select(s => s.SectionName).ToList();
            if (sectionLetters == null || !sectionLetters.Any())
            {
                sectionLetters = new List<string> { "A" };
            }

            foreach (var secLetter in sectionLetters)
            {
                var section = new ClassSection
                {
                    ClassId = classGrade.ClassId,
                    SectionName = secLetter,
                    Capacity = 40,
                    Status = "Active"
                };
                await _context.ClassSections.AddAsync(section);
            }

            // Handle subjects
            var subjectsInput = dto.Subjects ?? new List<string>();
            foreach (var subName in subjectsInput)
            {
                var subject = await _context.Subjects.FirstOrDefaultAsync(s => s.SubjectName == subName);
                if (subject == null)
                {
                    subject = new Subject
                    {
                        SubjectName = subName,
                        SubjectCode = subName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, subName.Length)) + "101",
                        CourseCode = subName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, subName.Length))
                    };
                    await _context.Subjects.AddAsync(subject);
                    await _context.SaveChangesAsync();
                }

                var mapping = new ClassSubjectMapping
                {
                    ClassId = classGrade.ClassId,
                    SubjectId = subject.SubjectId,
                    WeeklyPeriods = 5
                };
                await _context.ClassSubjectMappings.AddAsync(mapping);
            }

            // Handle teacher assignments
            if (dto.SectionTeachers != null)
            {
                foreach (var kvp in dto.SectionTeachers)
                {
                    var secLetter = kvp.Key;
                    var teacherIdStr = kvp.Value;

                    Staff? staff = null;
                    if (int.TryParse(teacherIdStr, out int staffId))
                    {
                        staff = await _context.Staff.FindAsync(staffId);
                    }
                    if (staff == null)
                    {
                        staff = await _context.Staff.FirstOrDefaultAsync(s => s.EmployeeId == teacherIdStr);
                    }

                    if (staff != null)
                    {
                        var assignment = new TeacherAssignment
                        {
                            ClassId = classGrade.ClassId,
                            SectionLetter = secLetter,
                            TeacherId = staff.StaffId,
                            Role = "Class Teacher",
                            Status = "Active",
                            SubjectId = _context.Subjects.FirstOrDefault()?.SubjectId ?? 1
                        };
                        await _context.TeacherAssignments.AddAsync(assignment);
                    }
                }
            }

            await _context.SaveChangesAsync();
await transaction.CommitAsync();
            await LogAuditActionAsync("Create Class", $"Created class grade '{classGrade.ClassName}' with {sectionLetters.Count} sections.");

            return Ok(new { success = true, id = $"CL-{classGrade.ClassId}", message = "Class created successfully." });
        }

        [HttpPut("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> UpdateClassGrade(int id, [FromBody] CreateClassGradeDto dto)
        {
            var classObj = await _context.Classes.FindAsync(id);
            if (classObj == null)
            {
                return NotFound(new { success = false, message = "Class not found." });
            }

            var campus = classObj.CampusLocation ?? "Main Campus";
            var academicYear = classObj.AcademicYear ?? "2026-2027";

            var newClassName = dto.Name ?? dto.ClassName;
            if (!string.IsNullOrEmpty(newClassName) && newClassName != classObj.ClassName)
            {
                var normalizedInput = NormalizeClassName(newClassName);
                var existingClasses = await _context.Classes
                    .Where(c => (c.CampusLocation == campus || string.IsNullOrEmpty(c.CampusLocation)) && 
                                (c.AcademicYear == academicYear || string.IsNullOrEmpty(c.AcademicYear)) && 
                                c.ClassId != id)
                    .ToListAsync();

                if (existingClasses.Any(c => NormalizeClassName(c.ClassName ?? "") == normalizedInput))
                {
                    return BadRequest(new { success = false, message = "A duplicate class name already exists." });
                }

                classObj.ClassName = newClassName;
            }

            classObj.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await LogAuditActionAsync("Update Class", $"Updated class grade ID {id}.");
            return Ok(new { success = true, message = "Class updated successfully." });
        }

        [HttpDelete("{id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> DeleteClassGrade(int id)
        {
            try
            {
                var classObj = await _context.Classes.FindAsync(id);
                if (classObj == null)
                {
                    return NotFound(new { success = false, message = "Class not found." });
                }

                // Check if students are assigned to this class
                var hasStudents = await _context.Admissions.AnyAsync(s => s.ClassId == id && !s.IsDeleted) ||
                                  await _context.Students.AnyAsync(s => s.ClassId == id && !s.IsDeleted);
                if (hasStudents)
                {
                    return BadRequest(new { success = false, message = "Cannot delete class. Active students are currently assigned to it." });
                }

                _context.Classes.Remove(classObj);
                await _context.SaveChangesAsync();

                await LogAuditActionAsync("Delete Class", $"Deleted class grade '{classObj.ClassName}' (ID {id}).");
                return Ok(new { success = true, message = "Class deleted successfully." });
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { success = false, message = "Cannot delete class. It is currently referenced by other records (e.g., sections, timetables, or student records) in the database." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}", details = ex.InnerException?.Message });
            }
        }

        // --- SECTIONS SUB-ROUTES ---

        [HttpPost("{id:int}/sections")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> AddSection(int id, [FromBody] SectionCreateDto dto)
        {
            var classObj = await _context.Classes.FindAsync(id);
            if (classObj == null)
            {
                return NotFound(new { success = false, message = "Class not found." });
            }

            // Check if section letter already exists in class
            var exists = await _context.ClassSections
                .AnyAsync(s => s.ClassId == id && s.SectionName.ToLower() == dto.SectionLetter.ToLower());

            if (exists)
            {
                return BadRequest(new { success = false, message = $"Section '{dto.SectionLetter}' already exists in this class." });
            }

            var section = new ClassSection
            {
                ClassId = id,
                SectionName = dto.SectionLetter,
                Capacity = dto.Capacity,
                Status = dto.Status,
                Remarks = dto.Remarks
            };

            await _context.ClassSections.AddAsync(section);
            await _context.SaveChangesAsync();

            await LogAuditActionAsync("Add Section", $"Added section '{dto.SectionLetter}' to class ID {id}.");
            return Ok(new { success = true, message = "Section added successfully." });
        }

        [HttpPut("{id:int}/sections/{section_letter}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> UpdateSection(int id, string section_letter, [FromBody] SectionUpdateDto dto)
        {
            var section = await _context.ClassSections
                .FirstOrDefaultAsync(s => s.ClassId == id && s.SectionName.ToLower() == section_letter.ToLower());

            if (section == null)
            {
                return NotFound(new { success = false, message = "Section not found." });
            }

            section.Capacity = dto.Capacity;
            section.Status = dto.Status;
            section.Remarks = dto.Remarks;

            await _context.SaveChangesAsync();
            await LogAuditActionAsync("Update Section", $"Updated section '{section_letter}' in class ID {id}.");
            return Ok(new { success = true, message = "Section updated successfully." });
        }

        [HttpDelete("{id:int}/sections/{section_letter}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> DeleteSection(int id, string section_letter)
        {
            try
            {
                var section = await _context.ClassSections
                    .FirstOrDefaultAsync(s => s.ClassId == id && s.SectionName.ToLower() == section_letter.ToLower());

                if (section == null)
                {
                    return NotFound(new { success = false, message = "Section not found." });
                }

                // Check if students are allocated to this section
                var hasStudents = await _context.Admissions
                    .AnyAsync(s => s.ClassId == id && s.SectionLetter == section_letter && !s.IsDeleted) ||
                                  await _context.Students
                    .AnyAsync(s => s.SectionId == section.SectionId && !s.IsDeleted);

                if (hasStudents)
                {
                    return BadRequest(new { success = false, message = "Cannot delete section. Active students are currently allocated to it." });
                }

                _context.ClassSections.Remove(section);

                // Clean up teacher_assignments for this section
                var assignments = await _context.TeacherAssignments
                    .Where(a => a.ClassId == id && a.SectionLetter.ToLower() == section_letter.ToLower())
                    .ToListAsync();
                _context.TeacherAssignments.RemoveRange(assignments);

                // Also clean up teacher_subject_assignments for this section (cross-module cleanup)
                var tsaAssignments = await _context.TeacherSubjectAssignments
                    .Where(tsa => tsa.ClassId == id && tsa.SectionId == section.SectionId)
                    .ToListAsync();
                _context.TeacherSubjectAssignments.RemoveRange(tsaAssignments);

                await _context.SaveChangesAsync();
                await LogAuditActionAsync("Delete Section", $"Deleted section '{section_letter}' from class ID {id}.");
                return Ok(new { success = true, message = "Section deleted successfully." });
            }
            catch (DbUpdateException)
            {
                return BadRequest(new { success = false, message = "Cannot delete section. It is currently referenced by other records (e.g., timetables, attendance, or student records) in the database." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"An error occurred: {ex.Message}", details = ex.InnerException?.Message });
            }
        }

        // --- SUBJECTS SUB-ROUTES ---

        [HttpPost("{id:int}/subjects")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> MapSubject(int id, [FromBody] SubjectMapDto dto)
        {
            var classObj = await _context.Classes.FindAsync(id);
            if (classObj == null)
            {
                return NotFound(new { success = false, message = "Class not found." });
            }

            var subject = await _context.Subjects
                .FirstOrDefaultAsync(s => s.SubjectName.ToLower() == dto.SubjectName.ToLower());

            if (subject == null)
            {
                subject = new Subject
                {
                    SubjectName = dto.SubjectName,
                    SubjectCode = dto.SubjectName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, dto.SubjectName.Length)) + "101",
                    CourseCode = dto.SubjectName.ToUpper().Replace(" ", "").Substring(0, Math.Min(4, dto.SubjectName.Length))
                };
                await _context.Subjects.AddAsync(subject);
                await _context.SaveChangesAsync();
            }

            // Check duplicate mapping
            var alreadyMapped = await _context.ClassSubjectMappings
                .AnyAsync(sm => sm.ClassId == id && sm.SubjectId == subject.SubjectId);

            if (alreadyMapped)
            {
                return BadRequest(new { success = false, message = "Subject is already mapped to this class." });
            }

            var mapping = new ClassSubjectMapping
            {
                ClassId = id,
                SubjectId = subject.SubjectId,
                WeeklyPeriods = dto.WeeklyPeriods
            };

            await _context.ClassSubjectMappings.AddAsync(mapping);
            await _context.SaveChangesAsync();

            await LogAuditActionAsync("Map Subject", $"Mapped subject '{dto.SubjectName}' to class ID {id}.");
            return Ok(new { success = true, message = "Subject mapped successfully." });
        }

        [HttpDelete("{id:int}/subjects/{subject_id:int}")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> RemoveSubject(int id, int subject_id)
        {
            var mapping = await _context.ClassSubjectMappings
                .FirstOrDefaultAsync(sm => sm.ClassId == id && sm.SubjectId == subject_id);

            if (mapping == null)
            {
                return NotFound(new { success = false, message = "Subject mapping not found." });
            }

            _context.ClassSubjectMappings.Remove(mapping);

            // Clean up teacher assignments for this class and subject
            var assignments = await _context.TeacherAssignments
                .Where(a => a.ClassId == id && a.SubjectId == subject_id)
                .ToListAsync();
            _context.TeacherAssignments.RemoveRange(assignments);

            await _context.SaveChangesAsync();
            await LogAuditActionAsync("Remove Subject", $"Removed subject ID {subject_id} mapping from class ID {id}.");
            return Ok(new { success = true, message = "Subject mapping removed successfully." });
        }

        // --- TEACHERS SUB-ROUTES ---

        [HttpPost("{id:int}/sections/{section_letter}/assign-teacher")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> AssignTeacher(int id, string section_letter, [FromBody] AssignTeacherDto dto)
        {
            var classObj = await _context.Classes.FindAsync(id);
            if (classObj == null)
            {
                return NotFound(new { success = false, message = "Class not found." });
            }

            Staff? staff = null;
            if (int.TryParse(dto.TeacherId, out int staffId))
            {
                staff = await _context.Staff.FindAsync(staffId);
            }
            if (staff == null)
            {
                staff = await _context.Staff.FirstOrDefaultAsync(s => s.EmployeeId == dto.TeacherId);
            }

            if (staff == null)
            {
                return NotFound(new { success = false, message = "Teacher record not found." });
            }

            int subjectId = 0;
            if (!string.IsNullOrEmpty(dto.SubjectName))
            {
                var subject = await _context.Subjects
                    .FirstOrDefaultAsync(s => s.SubjectName.ToLower() == dto.SubjectName.ToLower());
                if (subject != null)
                {
                    subjectId = subject.SubjectId;
                }
            }

            if (subjectId == 0)
            {
                // Fallback to first mapped subject
                var firstMapping = await _context.ClassSubjectMappings
                    .FirstOrDefaultAsync(sm => sm.ClassId == id);
                subjectId = firstMapping?.SubjectId ?? 1;
            }

            if (dto.Role == "Class Teacher")
            {
                // Unassign any existing Class Teacher for this section
                var existingClassTeacher = await _context.TeacherAssignments
                    .FirstOrDefaultAsync(a => a.ClassId == id && a.SectionLetter.ToLower() == section_letter.ToLower() && a.Role == "Class Teacher");

                if (existingClassTeacher != null)
                {
                    _context.TeacherAssignments.Remove(existingClassTeacher);
                }
            }
            else if (dto.Role == "Subject Teacher")
            {
                // Prevent duplicate Subject Teacher for same class/section/subject
                var existingSubjectTeacher = await _context.TeacherAssignments
                    .FirstOrDefaultAsync(a => a.ClassId == id && a.SectionLetter.ToLower() == section_letter.ToLower() && a.SubjectId == subjectId && a.Role == "Subject Teacher");

                if (existingSubjectTeacher != null)
                {
                    _context.TeacherAssignments.Remove(existingSubjectTeacher);
                }

                // Also sync to teacher_subject_assignments (used by Timetable & Attendance modules)
                var section = await _context.ClassSections
                    .FirstOrDefaultAsync(s => s.ClassId == id && s.SectionName.ToLower() == section_letter.ToLower());

                if (section != null && subjectId > 0)
                {
                    var existingTsa = await _context.TeacherSubjectAssignments
                        .FirstOrDefaultAsync(tsa => tsa.ClassId == id && tsa.SectionId == section.SectionId && tsa.SubjectId == subjectId);

                    if (existingTsa != null)
                    {
                        existingTsa.StaffId = staff.StaffId;
                    }
                    else
                    {
                        await _context.TeacherSubjectAssignments.AddAsync(new TeacherSubjectAssignment
                        {
                            ClassId = id,
                            SectionId = section.SectionId,
                            SubjectId = subjectId,
                            StaffId = staff.StaffId
                        });
                    }
                }
            }

            var assignment = new TeacherAssignment
            {
                ClassId = id,
                SectionLetter = section_letter,
                TeacherId = staff.StaffId,
                Role = dto.Role,
                Status = "Active",
                SubjectId = subjectId
            };

            await _context.TeacherAssignments.AddAsync(assignment);
            await _context.SaveChangesAsync();

            await LogAuditActionAsync("Assign Teacher", $"Assigned teacher '{staff.FirstName} {staff.LastName}' as {dto.Role} to section '{section_letter}' in class ID {id}.");
            return Ok(new { success = true, message = "Teacher assigned successfully." });
        }

        [HttpDelete("{id:int}/sections/{section_letter}/subjects/{subject_id:int}/unassign-teacher")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> UnassignTeacher(int id, string section_letter, int subject_id)
        {
            // Remove from teacher_assignments
            var assignments = await _context.TeacherAssignments
                .Where(a => a.ClassId == id && a.SectionLetter.ToLower() == section_letter.ToLower() && a.SubjectId == subject_id)
                .ToListAsync();
            _context.TeacherAssignments.RemoveRange(assignments);

            // Also remove from teacher_subject_assignments
            var section = await _context.ClassSections
                .FirstOrDefaultAsync(s => s.ClassId == id && s.SectionName.ToLower() == section_letter.ToLower());

            if (section != null)
            {
                var tsaRecords = await _context.TeacherSubjectAssignments
                    .Where(tsa => tsa.ClassId == id && tsa.SectionId == section.SectionId && tsa.SubjectId == subject_id)
                    .ToListAsync();
                _context.TeacherSubjectAssignments.RemoveRange(tsaRecords);
            }

            await _context.SaveChangesAsync();
            await LogAuditActionAsync("Unassign Teacher", $"Unassigned teacher from subject ID {subject_id} in class ID {id}, section '{section_letter}'.");
            return Ok(new { success = true, message = "Teacher unassigned successfully." });
        }

        // --- STUDENTS SUB-ROUTES ---

        [HttpGet("{id:int}/students")]
        [Authorize(Roles = "SuperAdmin,Admin,Teacher,Principal")]
        public async Task<IActionResult> GetClassStudents(int id, [FromQuery] string? section)
        {
            var classObj = await _context.Classes.FindAsync(id);
            if (classObj == null)
            {
                return NotFound(new { success = false, message = "Class not found." });
            }

            var query = _context.Admissions
                .Where(s => s.ClassId == id && !s.IsDeleted);

            if (!string.IsNullOrEmpty(section))
            {
                query = query.Where(s => s.SectionLetter.ToLower() == section.ToLower());
            }

            var students = await query.ToListAsync();

            var response = students.Select(s =>
            {
                var names = (s.StudentName ?? "").Split(new[] { ' ' }, 2);
                var fName = names.Length > 0 ? names[0] : "";
                var lName = names.Length > 1 ? names[1] : "";

                return new StudentResponseDto
                {
                    Id = $"STD-{s.AdmissionId}",
                    AdmissionNo = s.ApplicationNo ?? "",
                    RollNo = s.RollNo,
                    FirstName = fName,
                    LastName = lName,
                    Gender = s.Gender ?? "Male",
                    Dob = s.Dob?.ToString("yyyy-MM-dd") ?? "",
                    ClassName = classObj.ClassName ?? "",
                    Section = s.SectionLetter ?? "",
                    FatherName = s.FatherName ?? "",
                    FatherPhone = s.FatherMobile ?? "",
                    Email = s.FatherMobile != null ? $"{s.FatherMobile}@school.com" : "",
                    Status = s.Status == "Enrolled" || s.Status == "Active" ? "Active" : "Inactive",
                    TotalFee = 45000,
                    PaidFee = 30000,
                    DueFee = 15000,
                    AttendancePct = 92.5,
                    Gpa = 8.5
                };
            }).ToList();

            return Ok(response);
        }

        [HttpPut("/api/students/{student_id}/allocate")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> AllocateStudent(string student_id, [FromBody] StudentAllocateDto dto)
        {
            // Parse student ID (assuming format is "STD-123" or "123")
            long dbStudentId = 0;
            if (student_id.StartsWith("STD-"))
            {
                long.TryParse(student_id.Replace("STD-", ""), out dbStudentId);
            }
            else
            {
                long.TryParse(student_id, out dbStudentId);
            }

            var student = await _context.Admissions.FindAsync(dbStudentId);
            if (student == null)
            {
                return NotFound(new { success = false, message = "Student not found." });
            }

            if (student.ClassId == null)
            {
                return BadRequest(new { success = false, message = "Student is not assigned to any class yet." });
            }

            if (string.IsNullOrWhiteSpace(dto.SectionLetter) || 
                dto.SectionLetter.Equals("Unassigned", System.StringComparison.OrdinalIgnoreCase) || 
                dto.SectionLetter.Equals("None", System.StringComparison.OrdinalIgnoreCase))
            {
                student.SectionLetter = null;
                student.RollNo = null;
                await _context.SaveChangesAsync();
                await LogAuditActionAsync("Deallocate Student", $"De-allocated student '{student.StudentName}' (ID {dbStudentId}).");
                return Ok(new { success = true, message = "Student de-allocated successfully." });
            }

            // Check capacity constraint
            var section = await _context.ClassSections
                .FirstOrDefaultAsync(s => s.ClassId == student.ClassId && s.SectionName.ToLower() == dto.SectionLetter.ToLower());

            if (section == null)
            {
                return NotFound(new { success = false, message = "Target section not found in this class." });
            }

            var currentCount = await _context.Admissions
                .CountAsync(s => s.ClassId == student.ClassId && s.SectionLetter.ToLower() == dto.SectionLetter.ToLower() && !s.IsDeleted);

            if (currentCount >= section.Capacity)
            {
                return BadRequest(new { success = false, message = $"Cannot allocate student. Section {dto.SectionLetter} seat limit of {section.Capacity} has been reached." });
            }

            student.SectionLetter = dto.SectionLetter;
            student.RollNo = dto.RollNo ?? $"R-{currentCount + 1}";

            await _context.SaveChangesAsync();
            await LogAuditActionAsync("Allocate Student", $"Allocated student '{student.StudentName}' (ID {dbStudentId}) to section '{dto.SectionLetter}' with roll no '{student.RollNo}'.");

            return Ok(new { success = true, message = $"Allocated student to Section {dto.SectionLetter} successfully." });
        }

        [HttpPost("{id:int}/auto-allocate")]
        [Authorize(Roles = "SuperAdmin,Admin,Principal")]
        public async Task<IActionResult> AutoAllocate(int id)
        {
            var classObj = await _context.Classes.FindAsync(id);
            if (classObj == null)
            {
                return NotFound(new { success = false, message = "Class not found." });
            }

            var sections = await _context.ClassSections
                .Where(s => s.ClassId == id && s.Status == "Active")
                .ToListAsync();

            if (!sections.Any())
            {
                return BadRequest(new { success = false, message = "Please configure active class sections first." });
            }

            var unassignedStudents = await _context.Admissions
                .Where(s => s.ClassId == id && (s.SectionLetter == null || s.SectionLetter == "") && !s.IsDeleted)
                .ToListAsync();

            if (!unassignedStudents.Any())
            {
                return Ok(new { success = true, message = "There are no unassigned students left." });
            }

            int allocatedCount = 0;
            foreach (var student in unassignedStudents)
            {
                // Find section with minimum count of students that is below capacity
                var sectionStudentsCounts = new Dictionary<string, int>();
                foreach (var sec in sections)
                {
                    var count = await _context.Admissions
                        .CountAsync(s => s.ClassId == id && s.SectionLetter.ToLower() == sec.SectionName.ToLower() && !s.IsDeleted);
                    sectionStudentsCounts[sec.SectionName] = count;
                }

                var targetSection = sections
                    .Where(sec => sectionStudentsCounts[sec.SectionName] < sec.Capacity)
                    .OrderBy(sec => sectionStudentsCounts[sec.SectionName])
                    .FirstOrDefault();

                if (targetSection == null)
                {
                    break; // All sections full
                }

                var currentSectionCount = sectionStudentsCounts[targetSection.SectionName];
                student.SectionLetter = targetSection.SectionName;
                student.RollNo = $"R-{currentSectionCount + 1}";
                allocatedCount++;
            }

            await _context.SaveChangesAsync();
            await LogAuditActionAsync("Auto Allocate Students", $"Allocated {allocatedCount} students evenly to sections in class '{classObj.ClassName}' (ID {id}).");

            return Ok(new { success = true, count = allocatedCount, message = $"Auto-allocated {allocatedCount} students evenly among active sections." });
        }

        // =========================================================
        // PRIVATE HELPER METHODS
        // =========================================================

        private string NormalizeClassName(string name)
        {
            if (string.IsNullOrEmpty(name)) return "";
            var normalized = name.ToLowerInvariant();
            normalized = normalized.Replace("class", "").Replace("grade", "").Replace("std", "").Replace("standard", "").Trim();
            return normalized;
        }

        private async Task LogAuditActionAsync(string action, string details)
        {
            int? userId = null;
            var userIdClaim = User.FindFirst("id")?.Value ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int uid))
            {
                userId = uid;
            }

            var log = new AuditLog
            {
                UserId = userId,
                UserName = User.Identity?.Name ?? "Admin",
                UserRole = User.FindFirst(ClaimTypes.Role)?.Value ?? "Admin",
                Action = action,
                Details = details,
                IpAddress = Request.HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1",
                Timestamp = DateTime.UtcNow
            };

            await _context.AuditLogs.AddAsync(log);
            await _context.SaveChangesAsync();
        }
    }
}