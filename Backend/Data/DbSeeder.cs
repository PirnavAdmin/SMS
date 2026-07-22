using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;

namespace SMS.Api.Data
{
    public static class DbSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            // Apply any pending EF Core migrations automatically
            await context.Database.MigrateAsync();

            // 1. Seed Initial Roles
            if (!await context.Roles.AnyAsync())
            {
                var roles = new List<Role>
                {
                    new Role { RoleId = 1, RoleName = "SuperAdmin", Description = "System Owner" },
                    new Role { RoleId = 2, RoleName = "Admin", Description = "School Administrator" },
                    new Role { RoleId = 3, RoleName = "Student", Description = "Student Account" },
                    new Role { RoleId = 4, RoleName = "Parent", Description = "Parent Account" }
                };

                await context.Roles.AddRangeAsync(roles);
                await context.SaveChangesAsync();
            }

            // 2. Seed Default Admin User
            if (!await context.Users.AnyAsync(u => u.Email == "admin@pirnavschools.com"))
            {
                var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleId == 2);

                var adminUser = new User
                {
                    FullName = "Rajesh Sharma",
                    Email = "admin@pirnavschools.com",
                    MobileNumber = "9876543210",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1234"),
                    UserType = "Admin",
                    IsEmailVerified = true,
                    IsMobileVerified = true,
                    CreatedAt = DateTime.UtcNow
                };

                if (adminRole != null)
                {
                    adminUser.Roles.Add(adminRole);
                }

                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
            }
        }
    }
}