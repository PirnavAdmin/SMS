using System.Net;

namespace SMS.Api.Exceptions;

public class TimetableConflictException : AppException
{
    public TimetableConflictException(string message)
        : base(message, HttpStatusCode.BadRequest) { }
}

public class PeriodOverlapException : AppException
{
    public PeriodOverlapException(string message)
        : base(message, HttpStatusCode.BadRequest) { }
}

public class SubjectQuotaExceededException : AppException
{
    public SubjectQuotaExceededException(string message)
        : base(message, HttpStatusCode.BadRequest) { }
}
