using System.Net;

namespace SMS.Api.Exceptions
{
    public class AppException : Exception
    {
        public HttpStatusCode StatusCode { get; }

        public AppException(string message, HttpStatusCode statusCode = HttpStatusCode.InternalServerError)
            : base(message)
        {
            StatusCode = statusCode;
        }
    }

    public class NotFoundException : AppException
    {
        public NotFoundException(string message)
            : base(message, HttpStatusCode.NotFound) { }
    }

    public class BadRequestException : AppException
    {
        public BadRequestException(string message)
            : base(message, HttpStatusCode.BadRequest) { }
    }
}