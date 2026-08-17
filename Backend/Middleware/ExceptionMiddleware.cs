using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using SMS.Api.Exceptions;

namespace SMS.Api.Middleware;

public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(
        RequestDelegate next,
        ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(
                ex,
                "Unhandled exception: {Message}",
                ex.Message);

            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = HttpStatusCode.InternalServerError;
        var message = !string.IsNullOrWhiteSpace(exception.Message) ? exception.Message : "An internal server error occurred.";

        if (exception is AppException appException)
        {
            statusCode = appException.StatusCode;
            message = appException.Message;
        }
        else if (exception is InvalidOperationException || exception is ArgumentException)
        {
            statusCode = HttpStatusCode.BadRequest;
            message = exception.Message;
        }
        else if (exception is Microsoft.EntityFrameworkCore.DbUpdateException)
        {
            statusCode = HttpStatusCode.BadRequest;
            message = "This operation could not be completed because this record is referenced by other items in the database (e.g., classes, assignments, or student records).";
        }

        context.Response.StatusCode = (int)statusCode;

        var response = new
        {
            success = false,
            statusCode = context.Response.StatusCode,
            message,
            innerException = exception.InnerException?.Message,
            timestamp = DateTime.UtcNow
        };

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        };

        var json = JsonSerializer.Serialize(response, jsonOptions);

        return context.Response.WriteAsync(json);
    }
}