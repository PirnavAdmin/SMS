namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
using MySqlConnector;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

public class OtpRepository : IOtpRepository
{
    private readonly AppDbContext _context;

    public OtpRepository(AppDbContext context)
    {
        _context = context;
    }

    // Call sp_SaveOtp (it handles invalidating old OTPs internally before inserting the new one)
    public async Task SaveOtpAsync(OtpVerification otp)
    {
        // Default expiry to 5 minutes if not explicitly set
        int expiryMinutes = (int)(otp.ExpiryTime - DateTime.UtcNow).TotalMinutes;
        if (expiryMinutes <= 0) expiryMinutes = 5;

        await _context.Database.ExecuteSqlRawAsync(
            "CALL sp_SaveOtp({0}, {1}, {2}, {3}, {4})",
            otp.UserId,
            otp.OtpCodeHash,
            otp.DeliveryMethod,
            otp.Purpose,
            expiryMinutes
        );
    }

    // Invalidate existing OTPs explicitly if called separately
    public async Task InvalidateExistingOtpsAsync(int userId, string purpose)
    {
        await _context.Database.ExecuteSqlRawAsync(
            "UPDATE OtpVerifications SET IsUsed = TRUE WHERE UserId = {0} AND Purpose = {1} AND IsUsed = FALSE",
            userId,
            purpose
        );
    }

    // Call sp_ValidateOtp to handle validation, expiration check, and attempt counts
    public async Task<bool> ValidateOtpAsync(int userId, string otpCodeHash, string purpose)
    {
        try
        {
            await _context.Database.ExecuteSqlRawAsync(
                "CALL sp_ValidateOtp({0}, {1}, {2})",
                userId,
                otpCodeHash,
                purpose
            );

            return true; // Execution completed without SQL error (valid OTP)
        }
        catch (MySqlException ex) when (ex.Number == 1644) // Catches SIGNAL SQLSTATE '45000'
        {
            // Catches procedure errors (e.g. 'Invalid OTP code', 'OTP expired', or attempt limit exceeded)
            Console.WriteLine($"[OTP VALIDATION FAILED]: {ex.Message}");
            return false;
        }
    }

    // Fetch latest active OTP record if needed by service
    public async Task<OtpVerification?> GetLatestActiveOtpAsync(int userId, string purpose)
    {
        return await _context.OtpVerifications
            .Where(o => o.UserId == userId && o.Purpose == purpose && !o.IsUsed)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}