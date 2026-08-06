namespace SMS.Api.Repositories.Interfaces;

using SMS.Api.Models;
public interface IOtpRepository
{
    Task InvalidateExistingOtpsAsync(int? userId, int? adminId, string purpose);
    Task SaveOtpAsync(OtpVerification otp);
    Task<OtpVerification?> GetLatestActiveOtpAsync(int? userId, int? adminId, string purpose); 
    Task<bool> ValidateOtpAsync(int? userId, int? adminId, string otpCodeHash, string purpose);
    Task SaveChangesAsync();
}