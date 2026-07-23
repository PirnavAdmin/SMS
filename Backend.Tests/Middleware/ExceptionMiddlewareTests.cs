using System;
using System.IO;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Moq;
using SMS.Api.Exceptions;
using SMS.Api.Middleware;
using Xunit;

namespace Backend.Tests.Middleware
{
    public class ExceptionMiddlewareTests
    {
        private readonly Mock<ILogger<ExceptionMiddleware>> _loggerMock;

        public ExceptionMiddlewareTests()
        {
            _loggerMock = new Mock<ILogger<ExceptionMiddleware>>();
        }

        [Fact]
        public async Task InvokeAsync_NoException_CallsNext()
        {
            var context = new DefaultHttpContext();
            bool nextCalled = false;
            RequestDelegate next = (ctx) =>
            {
                nextCalled = true;
                return Task.CompletedTask;
            };

            var middleware = new ExceptionMiddleware(next, _loggerMock.Object);
            await middleware.InvokeAsync(context);

            Assert.True(nextCalled);
        }

        [Fact]
        public async Task InvokeAsync_AppExceptionThrown_ReturnsAppExceptionStatusCodeAndMessage()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();

            RequestDelegate next = (ctx) => throw new NotFoundException("Item not found test");

            var middleware = new ExceptionMiddleware(next, _loggerMock.Object);
            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.NotFound, context.Response.StatusCode);
            Assert.Equal("application/json", context.Response.ContentType);

            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var responseBody = await reader.ReadToEndAsync();

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            Assert.False(root.GetProperty("success").GetBoolean());
            Assert.Equal(404, root.GetProperty("statusCode").GetInt32());
            Assert.Equal("Item not found test", root.GetProperty("message").GetString());
        }

        [Fact]
        public async Task InvokeAsync_GenericExceptionThrown_Returns500InternalServerError()
        {
            var context = new DefaultHttpContext();
            context.Response.Body = new MemoryStream();

            RequestDelegate next = (ctx) => throw new InvalidOperationException("Unhandled DB Error");

            var middleware = new ExceptionMiddleware(next, _loggerMock.Object);
            await middleware.InvokeAsync(context);

            Assert.Equal((int)HttpStatusCode.InternalServerError, context.Response.StatusCode);

            context.Response.Body.Seek(0, SeekOrigin.Begin);
            using var reader = new StreamReader(context.Response.Body);
            var responseBody = await reader.ReadToEndAsync();

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;

            Assert.False(root.GetProperty("success").GetBoolean());
            Assert.Equal(500, root.GetProperty("statusCode").GetInt32());
            Assert.Equal("An internal server error occurred.", root.GetProperty("message").GetString());
        }
    }
}
