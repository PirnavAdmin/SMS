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
<<<<<<< HEAD
            _logger.LogError(
                ex,
                "Unhandled exception: {Message}",
                ex.Message);

=======
            _logger.LogError(ex, "Unhandled Exception: {Message}", ex.Message);
>>>>>>> eab1909434218961e513f516555570f0fed32a2c
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(
        HttpContext context,
        Exception exception)
    {
        context.Response.ContentType = "application/json";

        var statusCode = HttpStatusCode.InternalServerError;
        var message = "An internal server error occurred.";

        if (exception is AppException appException)
        {
            statusCode = appException.StatusCode;
            message = appException.Message;
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

<<<<<<< HEAD
        var json = JsonSerializer.Serialize(response, jsonOptions);

        return context.Response.WriteAsync(json);
=======
        return context.Response.WriteAsync(JsonSerializer.Serialize(response, jsonOptions));
>>>>>>> eab1909434218961e513f516555570f0fed32a2c
    }
}