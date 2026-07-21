namespace SMS.Api.Repositories.Interfaces;

using SMS.Api.Models;
public interface IOtpRepository
{
    Task InvalidateExistingOtpsAsync(int userId, string purpose);
    Task SaveOtpAsync(OtpVerification otp);
    Task<OtpVerification?> GetLatestActiveOtpAsync(int userId, string purpose); 
    Task<bool> ValidateOtpAsync(int userId, string otpCodeHash, string purpose);
    Task SaveChangesAsync();
}