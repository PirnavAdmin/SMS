using SMS.Api.Dtos;
using SMS.Api.Exceptions;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;
using SMS.Api.Services.Interfaces;

namespace SMS.Api.Services.Implementations
{
    public class SchoolService : ISchoolService
    {
        private readonly ISchoolRepository _repository;

        public SchoolService(ISchoolRepository repository)
        {
            _repository = repository;
        }

        public async Task<IEnumerable<Subject>> GetAllSubjectsAsync() =>
            await _repository.GetAllSubjectsAsync();

        public async Task CreateSubjectAsync(CreateSubjectDto dto)
        {
            var existing = await _repository.GetSubjectByIdAsync(dto.SubjectId);
            if (existing != null) 
                throw new BadRequestException($"Subject ID '{dto.SubjectId}' already exists.");

            var subject = new Subject
            {
                SubjectId = dto.SubjectId,
                SubjectName = dto.SubjectName,
                CourseCode = dto.CourseCode ?? dto.SubjectId
            };

            await _repository.AddSubjectAsync(subject);
            await _repository.SaveChangesAsync();
        }

        public async Task UpdateSubjectAsync(string id, UpdateSubjectDto dto)
        {
            var subject = await _repository.GetSubjectByIdAsync(id)
                ?? throw new NotFoundException($"Subject with ID '{id}' was not found.");

            subject.SubjectName = dto.SubjectName;
            subject.CourseCode = dto.CourseCode;
            subject.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateSubjectAsync(subject);
            await _repository.SaveChangesAsync();
        }

        public async Task<IEnumerable<Staff>> GetStaffDirectoryAsync(string? search, string? department) =>
            await _repository.GetStaffAsync(search, department);

        public async Task RegisterStaffAsync(RegisterStaffDto dto)
        {
            var existing = await _repository.GetStaffByEmpIdAsync(dto.EmpId);
            if (existing != null) 
                throw new BadRequestException($"Staff member with ID '{dto.EmpId}' already exists.");

            var staff = new Staff
            {
                EmpId = dto.EmpId,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Email = dto.Email,
                Phone = dto.Phone,
                Designation = dto.Designation,
                Department = dto.Department,
                MonthlySalary = dto.MonthlySalary,
                DateOfBirth = dto.DateOfBirth
            };

            await _repository.AddStaffAsync(staff);
            await _repository.SaveChangesAsync();
        }

        public async Task<object> GetClassesOverviewAsync()
        {
            var classes = await _repository.GetClassesWithDetailsAsync();

            return classes.Select(c => new
            {
                c.ClassId,
                c.ClassName,
                Sections = c.Sections.Select(s => new
                {
                    s.SectionId,
                    s.SectionName,
                    s.ClassTeacherEmpId,
                    TeacherFullName = s.ClassTeacher != null ? $"{s.ClassTeacher.FirstName} {s.ClassTeacher.LastName}" : null
                }),
                Subjects = c.CurriculumSubjects.Select(cs => new
                {
                    cs.Subject!.SubjectId,
                    cs.Subject.SubjectName,
                    cs.Subject.CourseCode
                })
            });
        }

        public async Task<long> CreateClassGradeAsync(CreateClassDto dto)
        {
            var classGrade = new ClassGrade
            {
                ClassName = dto.ClassName,
                BranchId = dto.BranchId ?? 1
            };

            await _repository.AddClassGradeAsync(classGrade);
            await _repository.SaveChangesAsync();

            if (dto.Sections != null && dto.Sections.Any())
            {
                var sections = dto.Sections.Select(s => new ClassSection
                {
                    ClassId = classGrade.ClassId,
                    SectionName = s.SectionName,
                    ClassTeacherEmpId = s.ClassTeacherEmpId
                });
                await _repository.AddSectionsAsync(sections);
            }

            if (dto.SubjectIds != null && dto.SubjectIds.Any())
            {
                var subjects = dto.SubjectIds.Select(subId => new ClassCurriculumSubject
                {
                    ClassId = classGrade.ClassId,
                    SubjectId = subId
                });
                await _repository.AddCurriculumSubjectsAsync(subjects);
            }

            await _repository.SaveChangesAsync();
            return classGrade.ClassId;
        }

        public async Task<IEnumerable<AdmissionApplication>> GetAdmissionsAsync(string? search, string? status, string? appliedClass) =>
            await _repository.GetAdmissionsAsync(search, status, appliedClass);

        public async Task<string> SubmitAdmissionAsync(CreateAdmissionDto dto)
        {
            var regNo = $"REG-{new Random().Next(1000, 9999)}";

            var application = new AdmissionApplication
            {
                RegistrationNo = regNo,
                ApplicantFullName = dto.ApplicantFullName,
                AppliedClass = dto.AppliedClass,
                Gender = dto.Gender,
                Dob = dto.Dob,
                BloodGroup = dto.BloodGroup,
                Religion = dto.Religion,
                CasteCategory = dto.CasteCategory,
                FatherFullName = dto.FatherFullName,
                MotherFullName = dto.MotherFullName,
                FatherMobileNo = dto.FatherMobileNo,
                HouseNo = dto.HouseNo,
                Street = dto.Street,
                AreaLocality = dto.AreaLocality,
                City = dto.City,
                District = dto.District,
                State = dto.State,
                PinCode = dto.PinCode,
                NumberOfSiblings = dto.NumberOfSiblings,
                SiblingStudentId = dto.SiblingStudentId,
                StudentType = dto.StudentType,
                TransportRequired = dto.TransportRequired,
                TransportType = dto.TransportType,
                BusRoute = dto.BusRoute,
                PickupPoint = dto.PickupPoint,
                DropPoint = dto.DropPoint,
                HostelBlock = dto.HostelBlock,
                FloorLevel = dto.FloorLevel,
                AllocatedBedId = dto.AllocatedBedId,
                Status = "Pending"
            };

            await _repository.AddAdmissionApplicationAsync(application);
            await _repository.SaveChangesAsync();

            return regNo;
        }

        public async Task UpdateAdmissionStatusAsync(string registrationNo, string status)
        {
            var application = await _repository.GetAdmissionByRegistrationNoAsync(registrationNo)
                ?? throw new NotFoundException($"Admission application '{registrationNo}' was not found.");

            application.Status = status;
            application.UpdatedAt = DateTime.UtcNow;

            await _repository.UpdateAdmissionStatusAsync(application);
            await _repository.SaveChangesAsync();
        }
    }
}