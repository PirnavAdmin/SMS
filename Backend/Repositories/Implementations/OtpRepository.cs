namespace SMS.Api.Repositories.Implementations;

using Microsoft.EntityFrameworkCore;
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

    public async Task InvalidateExistingOtpsAsync(int userId, string purpose)
    {
        var activeOtps = await _context.OtpVerifications
            .Where(o => o.UserId == userId && o.Purpose == purpose && !o.IsUsed)
            .ToListAsync();

        foreach (var otp in activeOtps) otp.IsUsed = true;
    }

    public async Task SaveOtpAsync(OtpVerification otp) => await _context.OtpVerifications.AddAsync(otp);

    public async Task<OtpVerification?> GetLatestActiveOtpAsync(int userId, string purpose)
    {
        return await _context.OtpVerifications
            .Where(o => o.UserId == userId && o.Purpose == purpose && !o.IsUsed)
            .OrderByDescending(o => o.CreatedAt)
            .FirstOrDefaultAsync();
    }

    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();
}