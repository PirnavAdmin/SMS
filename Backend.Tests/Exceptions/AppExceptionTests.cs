using System.Net;
using SMS.Api.Exceptions;
using Xunit;

namespace Backend.Tests.Exceptions
{
    public class AppExceptionTests
    {
        [Fact]
        public void AppException_Initialization_SetsMessageAndStatusCode()
        {
            var ex = new AppException("Custom error message", HttpStatusCode.Forbidden);

            Assert.Equal("Custom error message", ex.Message);
            Assert.Equal(HttpStatusCode.Forbidden, ex.StatusCode);
        }

        [Fact]
        public void NotFoundException_Initialization_SetsStatusCode404()
        {
            var ex = new NotFoundException("Resource not found");

            Assert.Equal("Resource not found", ex.Message);
            Assert.Equal(HttpStatusCode.NotFound, ex.StatusCode);
        }

        [Fact]
        public void BadRequestException_Initialization_SetsStatusCode400()
        {
            var ex = new BadRequestException("Invalid data");

            Assert.Equal("Invalid data", ex.Message);
            Assert.Equal(HttpStatusCode.BadRequest, ex.StatusCode);
        }

        [Fact]
        public void UnauthorizedException_Initialization_SetsStatusCode401()
        {
            var ex1 = new UnauthorizedException();
            var ex2 = new UnauthorizedException("Custom unauthorized");

            Assert.Equal("Unauthorized access.", ex1.Message);
            Assert.Equal(HttpStatusCode.Unauthorized, ex1.StatusCode);
            Assert.Equal("Custom unauthorized", ex2.Message);
            Assert.Equal(HttpStatusCode.Unauthorized, ex2.StatusCode);
        }

        [Fact]
        public void ConflictException_Initialization_SetsStatusCode409()
        {
            var ex = new ConflictException("Data conflict");

            Assert.Equal("Data conflict", ex.Message);
            Assert.Equal(HttpStatusCode.Conflict, ex.StatusCode);
        }
    }
}
