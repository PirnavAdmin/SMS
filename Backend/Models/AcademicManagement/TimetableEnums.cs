namespace SMS.Api.Models;

public enum TimetableStatus
{
    Draft,
    Published,
    Archived
}

public enum TimetableConflictType
{
    TeacherConflict,
    RoomConflict,
    WeeklyLimit
}
