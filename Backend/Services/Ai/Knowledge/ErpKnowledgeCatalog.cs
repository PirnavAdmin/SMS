using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using SMS.Api.Services.Ai.Interfaces;

namespace SMS.Api.Services.Ai.Knowledge
{
    public class ErpKnowledgeCatalog : IErpKnowledgeCatalog
    {
        private readonly List<ErpModuleCapability> _modules;
        private readonly List<ErpEntityRelationship> _relationships;

        public ErpKnowledgeCatalog()
        {
            _modules = InitializeModules();
            _relationships = InitializeRelationships();
        }

        public IReadOnlyList<ErpModuleCapability> GetAllModules() => _modules.AsReadOnly();

        public ErpModuleCapability? GetModule(string moduleName) =>
            _modules.FirstOrDefault(m => m.ModuleName.Equals(moduleName, StringComparison.OrdinalIgnoreCase));

        public IReadOnlyList<ErpEntityRelationship> GetRelationships() => _relationships.AsReadOnly();

        public IReadOnlyList<ErpEntityRelationship> GetRelationshipsForEntity(string entityName) =>
            _relationships.Where(r => r.SourceEntity.Equals(entityName, StringComparison.OrdinalIgnoreCase) ||
                                      r.TargetEntity.Equals(entityName, StringComparison.OrdinalIgnoreCase))
                          .ToList().AsReadOnly();

        public string GenerateKnowledgePrompt(AiToolContext context)
        {
            var sb = new StringBuilder();
            sb.AppendLine("=== PIRNAV SCHOOL MANAGEMENT SYSTEM (SMS) ERP KNOWLEDGE CATALOG ===");
            sb.AppendLine($"Current Session Scope: Branch='{context.BranchName ?? "All Branches"}', AcademicYear='{context.AcademicYear ?? "2026-27"}', Role='{context.UserRole}'.");
            sb.AppendLine();
            sb.AppendLine("### 1. IMPLEMENTED ERP MODULES & CAPABILITIES:");
            foreach (var m in _modules)
            {
                sb.AppendLine($"- **{m.ModuleName}**: {m.Description}");
                sb.AppendLine($"  - Tools: {string.Join(", ", m.PrimaryTools)}");
                sb.AppendLine($"  - Aggregate Operations: {string.Join(", ", m.AggregateOperations)}");
                sb.AppendLine($"  - Individual Operations: {string.Join(", ", m.IndividualOperations)}");
                sb.AppendLine($"  - Filters: {string.Join(", ", m.SupportedFilters)}");
            }

            sb.AppendLine();
            sb.AppendLine("### 2. CROSS-MODULE ENTITY RELATIONSHIP GRAPH:");
            sb.AppendLine("The ERP links entities across modules through the following verified foreign keys:");
            foreach (var r in _relationships)
            {
                sb.AppendLine($"- {r.SourceEntity} --[{r.RelationType}]--> {r.TargetEntity} via `{r.JoinKey}`: {r.SemanticDescription}");
            }

            sb.AppendLine();
            sb.AppendLine("### 3. INVESTIGATION & REASONING GUIDELINES:");
            sb.AppendLine("1. **Aggregate Counts vs Individual Records**: For overall strength, enrollment numbers, class size, demographics, or population questions, call `student_get_overview` (returns 407 total students = 172 enrolled + 235 admitted). Never call `student_search` for total counts.");
            sb.AppendLine("2. **Disambiguation & Context Resolution**:");
            sb.AppendLine("   - When a prompt is shorthand or incomplete (e.g. 'Compare this year', 'What about fees?'), check the recent conversation history to infer the exact entity or module.");
            sb.AppendLine("   - If recent context concerned enrollment, 'Compare this year' refers to enrollment comparison across academic years.");
            sb.AppendLine("   - If recent context concerned hostel, 'What about fees?' refers to hostel fees.");
            sb.AppendLine("   - If a prompt is a single isolated word with NO prior context (e.g. 'Students', 'Fees'), ask a polite, concise clarifying question instead of executing arbitrary tools.");
            sb.AppendLine("   - Never force clarification when the intended meaning is reasonably obvious.");
            sb.AppendLine("3. **Cross-Module Reasoning (Multi-Tool Calling)**:");
            sb.AppendLine("   - If the user asks a question involving multiple domains (e.g. 'Students using transport with unpaid fees', 'Hostel students with attendance issues'), invoke both relevant tools.");
            sb.AppendLine("   - Synthesize the combined data into a unified, clear response.");
            sb.AppendLine("4. **Zero Fabrication**: Only state facts retrieved from the tool outputs. If a record or category is not found, state clearly that no records exist in the database.");

            return sb.ToString();
        }

        private static List<ErpModuleCapability> InitializeModules()
        {
            return new List<ErpModuleCapability>
            {
                new ErpModuleCapability
                {
                    ModuleName = "Student Management",
                    Description = "Student directory, demographics, official school-wide student strength (407 total students = 172 enrolled + 235 admitted applications), class enrollment, and profiles.",
                    Entities = new() { "Student", "ClassGrade", "ClassSection", "Branch" },
                    PrimaryTools = new() { "student_get_overview", "student_search", "student_get_details" },
                    AggregateOperations = new() { "Total student enrollment", "Class-wise student strength", "Gender distribution", "Branch-wise student count" },
                    IndividualOperations = new() { "Search student by name/roll/admission number", "Get student full profile", "View academic status" },
                    SupportedFilters = new() { "className", "sectionName", "branchName", "academicYear", "query", "studentId" },
                    BusinessRules = new() { "Total school strength includes enrolled students + active admitted applications (407).", "Students can only belong to one active section per academic year." },
                    AuthorizedRoles = new() { "Admin", "SuperAdmin", "Principal", "Teacher", "Staff", "Parent", "Student" },
                    CrossModuleDependencies = new() { "Attendance", "Fee Management", "Hostel", "Transport", "Examinations" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Parent Management",
                    Description = "Parent directory, guardian details, and parent-child linked student mappings.",
                    Entities = new() { "Parent", "ParentStudentMapping", "Student" },
                    PrimaryTools = new() { "parent_get_children" },
                    AggregateOperations = new() { "Total registered parents" },
                    IndividualOperations = new() { "Get children linked to authenticated parent", "Parent contact verification" },
                    SupportedFilters = new() { "parentEmail", "parentUserId" },
                    BusinessRules = new() { "Parents can only view records of their actively mapped children." },
                    AuthorizedRoles = new() { "Admin", "Parent" },
                    CrossModuleDependencies = new() { "Student Management", "Fee Management", "Attendance" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Teacher and Staff Management",
                    Description = "Teaching faculty (22 teachers), non-teaching staff (14 staff), department assignments, and contact details.",
                    Entities = new() { "Staff", "Department", "TeacherAssignment" },
                    PrimaryTools = new() { "admin_get_staff_list" },
                    AggregateOperations = new() { "Total staff count (36)", "Teaching staff strength (22)", "Non-teaching staff strength (14)", "Department-wise staff breakdown" },
                    IndividualOperations = new() { "Search staff by name or role", "Get teacher assigned classes" },
                    SupportedFilters = new() { "role", "department", "searchQuery" },
                    BusinessRules = new() { "Teachers have assigned subjects and class sections." },
                    AuthorizedRoles = new() { "Admin", "SuperAdmin", "Principal" },
                    CrossModuleDependencies = new() { "Academic Management", "Timetable", "Attendance" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Admissions",
                    Description = "New student admission applications (235 applications), status tracking (Submitted, Under Review, Approved, Enrolled), and entrance metrics.",
                    Entities = new() { "AdmissionApplication", "AcademicYear", "Branch" },
                    PrimaryTools = new() { "admission_get_overview" },
                    AggregateOperations = new() { "Total application count", "Status-wise breakdown", "Grade-wise application distribution" },
                    IndividualOperations = new() { "Search application by applicant name or form number", "Track admission status" },
                    SupportedFilters = new() { "academicYear", "status", "className" },
                    BusinessRules = new() { "Approved applications convert to enrolled Students upon fee settlement." },
                    AuthorizedRoles = new() { "Admin", "SuperAdmin", "Principal" },
                    CrossModuleDependencies = new() { "Student Management", "Finance and Fee Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Academic Management",
                    Description = "Curriculum structures, 14 classes, sections (A, B, C), and subject-class mappings.",
                    Entities = new() { "ClassGrade", "ClassSection", "Subject", "ClassSubjectMapping", "TimetableEntry" },
                    PrimaryTools = new() { "admin_get_classes_sections", "timetable_get_schedule" },
                    AggregateOperations = new() { "Total classes count (14)", "Total sections count", "Class capacity" },
                    IndividualOperations = new() { "List sections for a class", "View class curriculum" },
                    SupportedFilters = new() { "branchId", "className" },
                    BusinessRules = new() { "Each class grade has one or more sections." },
                    AuthorizedRoles = new() { "Admin", "Principal", "Teacher" },
                    CrossModuleDependencies = new() { "Timetable", "Examinations", "Student Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Attendance",
                    Description = "Daily and monthly attendance tracking for students and staff, absence logs, and class comparisons.",
                    Entities = new() { "StudentAttendance", "StaffAttendance" },
                    PrimaryTools = new() { "attendance_get_daily_summary", "attendance_get_class_comparison" },
                    AggregateOperations = new() { "Today's overall student attendance percentage", "Present/Absent counts", "Class attendance rankings" },
                    IndividualOperations = new() { "Student monthly attendance record", "Staff daily punch log" },
                    SupportedFilters = new() { "date", "className", "sectionName" },
                    BusinessRules = new() { "Attendance is recorded daily per section for morning and afternoon sessions." },
                    AuthorizedRoles = new() { "Admin", "Principal", "Teacher", "Parent", "Student" },
                    CrossModuleDependencies = new() { "Student Management", "Teacher and Staff Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Finance and Fee Management",
                    Description = "Fee structures, fee heads (Tuition, Transport, Hostel, Lab, Library, Admission), payment installments, and student fee profiles.",
                    Entities = new() { "DynamicFeeStructure", "FeeHead", "FeeSchedule", "FeePayment" },
                    PrimaryTools = new() { "fee_get_student_profile", "fee_get_collection_stats", "fee_get_defaulters" },
                    AggregateOperations = new() { "Total fee collection", "Pending dues total", "Collection breakdown by fee head" },
                    IndividualOperations = new() { "Student fee balance and receipt history", "Pending installment schedule" },
                    SupportedFilters = new() { "studentQuery", "academicYear", "fromDate", "toDate", "minDueAmount", "className" },
                    BusinessRules = new() { "Fee payments are reconciled against active fee heads and dynamic structures." },
                    AuthorizedRoles = new() { "Admin", "Accountant", "Principal", "Parent", "Student" },
                    CrossModuleDependencies = new() { "Student Management", "Hostel Management", "Transport Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Fee Collection and Payment History",
                    Description = "Real-time fee receipts, transaction logs, collection trends, and fee defaulter identification.",
                    Entities = new() { "FeePayment", "FeeTransaction", "FeeReceipt" },
                    PrimaryTools = new() { "fee_get_collection_stats", "fee_get_defaulters" },
                    AggregateOperations = new() { "Daily/Monthly fee collection volume", "Defaulter count", "Outstanding balance sum" },
                    IndividualOperations = new() { "Payment receipt retrieval", "Transaction verification" },
                    SupportedFilters = new() { "academicYear", "fromDate", "toDate", "className", "minDueAmount" },
                    BusinessRules = new() { "Defaulter list includes all students with overdue balances exceeding threshold." },
                    AuthorizedRoles = new() { "Admin", "Accountant", "Principal" },
                    CrossModuleDependencies = new() { "Finance and Fee Management", "Student Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Transport Management",
                    Description = "School bus fleet (buses, vans), transport routes, pickup stops, assigned drivers, and student passenger allocations.",
                    Entities = new() { "TransportVehicle", "TransportRoute", "TransportStop", "StudentTransportAssignment" },
                    PrimaryTools = new() { "transport_get_fleet_info", "transport_get_route_details" },
                    AggregateOperations = new() { "Total fleet vehicle count", "Total active routes", "Total passenger capacity vs allocation" },
                    IndividualOperations = new() { "Route stop timings", "Assigned vehicle for route", "Driver contact details" },
                    SupportedFilters = new() { "routeNumber", "vehicleNumber", "routeName" },
                    BusinessRules = new() { "Student transport assignments link students to specific routes and stops with transport fees." },
                    AuthorizedRoles = new() { "Admin", "Principal", "Teacher", "Parent", "Student" },
                    CrossModuleDependencies = new() { "Student Management", "Finance and Fee Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Hostel Management",
                    Description = "Hostel buildings (Boys, Girls), room configurations, bed capacities, wardens, and student room allocations.",
                    Entities = new() { "Hostel", "HostelRoom", "HostelAllocation" },
                    PrimaryTools = new() { "hostel_get_occupancy_overview" },
                    AggregateOperations = new() { "Total hostel bed capacity", "Occupied beds count", "Available vacant beds", "Occupancy percentage" },
                    IndividualOperations = new() { "Student room allocation details", "Room occupancy status" },
                    SupportedFilters = new() { "hostelName", "hostelType" },
                    BusinessRules = new() { "Hostel residents incur hostel accommodation and mess fees." },
                    AuthorizedRoles = new() { "Admin", "Principal", "Staff", "Parent", "Student" },
                    CrossModuleDependencies = new() { "Student Management", "Finance and Fee Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Examination and Results",
                    Description = "Examination terms (Quarterly, Mid-Term, Annual), schedules, student grade reports, subject marks, and rank lists.",
                    Entities = new() { "Exam", "ExamSchedule", "ExamResult", "Subject" },
                    PrimaryTools = new() { "exam_get_student_results", "exam_get_schedules" },
                    AggregateOperations = new() { "Class grade pass rate", "Subject performance averages" },
                    IndividualOperations = new() { "Student report card marks", "Exam timetable for class" },
                    SupportedFilters = new() { "studentQuery", "className", "examName", "academicYear" },
                    BusinessRules = new() { "Exam results are recorded per subject with maximum and passing marks." },
                    AuthorizedRoles = new() { "Admin", "Principal", "Teacher", "Parent", "Student" },
                    CrossModuleDependencies = new() { "Student Management", "Academic Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Library Management",
                    Description = "Book inventory, ISBN catalog, author listings, book checkout issues, and return due dates.",
                    Entities = new() { "LibraryBook", "BookIssue" },
                    PrimaryTools = new() { "library_search_catalog" },
                    AggregateOperations = new() { "Total book titles", "Total catalog volumes", "Available copies in circulation" },
                    IndividualOperations = new() { "Book search by title/author/ISBN", "Check copy availability" },
                    SupportedFilters = new() { "title", "author", "category", "isbn" },
                    BusinessRules = new() { "Books can be checked out by students or staff with return due dates." },
                    AuthorizedRoles = new() { "Admin", "Principal", "Teacher", "Staff", "Parent", "Student" },
                    CrossModuleDependencies = new() { "Student Management", "Teacher and Staff Management" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Uniform Management",
                    Description = "School uniform stock items, sizes (S, M, L, XL), gender variants, inventory balance, and distribution logs.",
                    Entities = new() { "UniformItem", "UniformInventory", "UniformDistribution" },
                    PrimaryTools = new() { "uniform_get_inventory" },
                    AggregateOperations = new() { "Total uniform stock on hand", "Low stock alerts" },
                    IndividualOperations = new() { "Item size availability check", "Stock distribution record" },
                    SupportedFilters = new() { "itemName", "size", "gender" },
                    BusinessRules = new() { "Uniform sets are assigned to students upon admission." },
                    AuthorizedRoles = new() { "Admin", "Staff", "Principal" },
                    CrossModuleDependencies = new() { "Student Management", "Admissions" }
                },
                new ErpModuleCapability
                {
                    ModuleName = "Organization and School Management",
                    Description = "School organization details, affiliated branches (e.g. Madhapur Branch), campuses, and active academic years (2026-27).",
                    Entities = new() { "School", "Branch", "AcademicYear" },
                    PrimaryTools = new() { "org_get_profile" },
                    AggregateOperations = new() { "Total campuses/branches", "Active academic year dates" },
                    IndividualOperations = new() { "School contact and address", "Branch facilities profile" },
                    SupportedFilters = new() { "branchId", "academicYearId" },
                    BusinessRules = new() { "All operations, classes, and records are scoped to an active school and branch." },
                    AuthorizedRoles = new() { "Admin", "SuperAdmin", "Principal", "Teacher", "Staff", "Parent", "Student" },
                    CrossModuleDependencies = new() { "All Modules" }
                }
            };
        }

        private static List<ErpEntityRelationship> InitializeRelationships()
        {
            return new List<ErpEntityRelationship>
            {
                new ErpEntityRelationship
                {
                    SourceEntity = "Student",
                    TargetEntity = "ClassGrade",
                    RelationType = "ManyToOne",
                    JoinKey = "Student.ClassId -> ClassGrade.ClassId",
                    SemanticDescription = "Enrolled students belong to exactly one ClassGrade (e.g. Class 10)."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Student",
                    TargetEntity = "ClassSection",
                    RelationType = "ManyToOne",
                    JoinKey = "Student.SectionId -> ClassSection.SectionId",
                    SemanticDescription = "Enrolled students belong to a specific section within their class (e.g. Section A)."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Student",
                    TargetEntity = "AdmissionApplication",
                    RelationType = "OneToOne",
                    JoinKey = "Student.AdmissionNumber -> AdmissionApplication.ApplicationNumber",
                    SemanticDescription = "Students originate from an accepted Admission Application."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Student",
                    TargetEntity = "StudentAttendance",
                    RelationType = "OneToMany",
                    JoinKey = "Student.StudentId -> StudentAttendance.StudentId",
                    SemanticDescription = "Daily attendance records are logged per student."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Student",
                    TargetEntity = "FeePayment",
                    RelationType = "OneToMany",
                    JoinKey = "Student.StudentId -> FeePayment.StudentId",
                    SemanticDescription = "Payments, fee receipts, and outstanding dues are recorded per student."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Student",
                    TargetEntity = "HostelAllocation",
                    RelationType = "OneToMany",
                    JoinKey = "Student.StudentId -> HostelAllocation.StudentId",
                    SemanticDescription = "Residential students have hostel room and bed allocations."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Student",
                    TargetEntity = "StudentTransportAssignment",
                    RelationType = "OneToMany",
                    JoinKey = "Student.StudentId -> StudentTransportAssignment.StudentId",
                    SemanticDescription = "Commuting students are assigned to a transport bus route and pickup stop."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Student",
                    TargetEntity = "ExamResult",
                    RelationType = "OneToMany",
                    JoinKey = "Student.StudentId -> ExamResult.StudentId",
                    SemanticDescription = "Students receive exam marks and grades across subjects."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Staff",
                    TargetEntity = "TeacherAssignment",
                    RelationType = "OneToMany",
                    JoinKey = "Staff.StaffId -> TeacherAssignment.TeacherId",
                    SemanticDescription = "Teaching faculty members are assigned to specific classes, sections, and subjects."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Staff",
                    TargetEntity = "Department",
                    RelationType = "ManyToOne",
                    JoinKey = "Staff.DepartmentId -> Department.DepartmentId",
                    SemanticDescription = "Staff members belong to administrative or academic departments."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "TransportRoute",
                    TargetEntity = "TransportVehicle",
                    RelationType = "ManyToOne",
                    JoinKey = "TransportRoute.VehicleId -> TransportVehicle.VehicleId",
                    SemanticDescription = "Transport routes are serviced by dedicated vehicles and drivers."
                },
                new ErpEntityRelationship
                {
                    SourceEntity = "Hostel",
                    TargetEntity = "HostelRoom",
                    RelationType = "OneToMany",
                    JoinKey = "Hostel.HostelId -> HostelRoom.HostelId",
                    SemanticDescription = "Hostel buildings contain multiple residential rooms with fixed bed capacities."
                }
            };
        }
    }
}
