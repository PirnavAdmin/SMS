using Finbuckle.MultiTenant.EntityFrameworkCore.Stores.EFCoreStore;
using Microsoft.EntityFrameworkCore;
using SMS.Api.Models;

namespace SMS.Api.Data
{
    public class TenantStoreDbContext : EFCoreStoreDbContext<AppTenantInfo>
    {
        public TenantStoreDbContext(DbContextOptions<TenantStoreDbContext> options)
            : base(options)
        {
        }

        public DbSet<AppTenantInfo> AppTenants { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<AppTenantInfo>(entity =>
            {
                entity.ToTable("app_tenants");
                entity.HasKey(t => t.Id);
                entity.HasIndex(t => t.Identifier).IsUnique();
                entity.Property(t => t.Identifier).IsRequired().HasMaxLength(64);
                entity.Property(t => t.CompanyName).IsRequired().HasMaxLength(200);
                entity.Property(t => t.PrimaryColor).HasMaxLength(30).HasDefaultValue("#0284c7");
                entity.Property(t => t.LogoUrl).HasMaxLength(500).HasDefaultValue("");
                entity.Property(t => t.IsActive).HasDefaultValue(true);
            });
        }
    }
}
