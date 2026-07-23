using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

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
            var defaultRoles = new List<Role>
            {
                new Role { RoleName = "SuperAdmin", Description = "System Owner" },
                new Role { RoleName = "Admin", Description = "School Administrator" },
                new Role { RoleName = "Teacher", Description = "Teacher / Faculty" },
                new Role { RoleName = "Student", Description = "Student Account" },
                new Role { RoleName = "Parent", Description = "Parent / Guardian" }
            };

            foreach (var r in defaultRoles)
            {
                if (!await context.Roles.AnyAsync(x => x.RoleName == r.RoleName))
                {
                    await context.Roles.AddAsync(r);
                }
            }
            await context.SaveChangesAsync();

            // 2. Seed Default Admin User
            if (!await context.Users.AnyAsync(u => u.Email == "admin@pirnavschools.com"))
            {
                var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Admin")
                             ?? await context.Roles.FirstOrDefaultAsync(r => r.RoleName == "SuperAdmin");

                var adminUser = new User
                {
                    FullName = "Rajesh Sharma",
                    Email = "admin@pirnavschools.com",
                    MobileNumber = "9876543210",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("admin1234"),
                    Role = adminRole?.RoleName ?? "Admin",
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