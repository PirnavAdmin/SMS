using Microsoft.EntityFrameworkCore;
using SMS.Api.Data;
using SMS.Api.Models;
using SMS.Api.Repositories.Interfaces;

namespace SMS.Api.Repositories.Implementations
{
    public class OtpRepository : IOtpRepository
    {
        private readonly AppDbContext _context;

        public OtpRepository(AppDbContext context)
        {
            _context = context;
        }

        // Replaces CALL sp_SaveOtp
        public async Task SaveOtpAsync(OtpVerification otp)
        {
            // 1. Invalidate any active/unused OTPs for this user and purpose
            await InvalidateExistingOtpsAsync(otp.UserId, otp.Purpose);

            // 2. Set default expiry (5 minutes) if ExpiryTime is not explicitly set
            if (otp.ExpiryTime <= DateTime.UtcNow)
            {
                otp.ExpiryTime = DateTime.UtcNow.AddMinutes(5);
            }

            // 3. Add the new OTP record via EF Core
            await _context.OtpVerifications.AddAsync(otp);
            await _context.SaveChangesAsync();
        }

        // Invalidate active OTPs for user/purpose
        public async Task InvalidateExistingOtpsAsync(int userId, string purpose)
        {
            var activeOtps = await _context.OtpVerifications
                .Where(o => o.UserId == userId && o.Purpose == purpose && !o.IsUsed)
                .ToListAsync();

            foreach (var existingOtp in activeOtps)
            {
                existingOtp.IsUsed = true;
            }

            if (activeOtps.Any())
            {
                await _context.SaveChangesAsync();
            }
        }

        // Replaces CALL sp_ValidateOtp
        public async Task<bool> ValidateOtpAsync(int userId, string otpCodeHash, string purpose)
        {
            // Fetch the latest active (unused) OTP record
            var activeOtp = await GetLatestActiveOtpAsync(userId, purpose);

            if (activeOtp == null)
            {
                return false; // No active OTP found
            }

            // 1. Check if expired
            if (activeOtp.ExpiryTime <= DateTime.UtcNow)
            {
                activeOtp.IsUsed = true; // Mark expired OTP as used/invalid
                await _context.SaveChangesAsync();
                return false;
            }

            // 2. Check maximum attempts (e.g., limit to 3 attempts)
            if (activeOtp.AttemptCount >= 3)
            {
                activeOtp.IsUsed = true; // Lock OTP due to too many attempts
                await _context.SaveChangesAsync();
                return false;
            }

            // 3. Increment attempt count
            activeOtp.AttemptCount++;

            // 4. Verify code hash
            if (activeOtp.OtpCodeHash != otpCodeHash)
            {
                await _context.SaveChangesAsync();
                return false;
            }

            // 5. Success: Mark OTP as used
            activeOtp.IsUsed = true;
            await _context.SaveChangesAsync();

            return true;
        }

        // Fetch latest active OTP record
        public async Task<OtpVerification?> GetLatestActiveOtpAsync(int userId, string purpose)
        {
            return await _context.OtpVerifications
                .Where(o => o.UserId == userId && o.Purpose == purpose && !o.IsUsed)
                .OrderByDescending(o => o.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
    }
}