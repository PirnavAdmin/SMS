using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models.Ai
{
    [Table("ai_conversations")]
    public class AiConversation
    {
        [Key]
        [Column("id")]
        [StringLength(64)]
        public string Id { get; set; } = string.Empty;

        [Column("TenantId")]
        [StringLength(64)]
        public string? TenantId { get; set; } = "tenant-default";

        [Column("user_id")]
        public int UserId { get; set; }

        [Column("user_role")]
        [StringLength(50)]
        public string UserRole { get; set; } = "Admin";

        [Column("title")]
        [StringLength(255)]
        public string Title { get; set; } = "New Conversation";

        [Column("school_id")]
        public int? SchoolId { get; set; }

        [Column("branch_id")]
        public int? BranchId { get; set; }

        [Column("academic_year_id")]
        public int? AcademicYearId { get; set; }

        [Column("is_pinned")]
        public bool IsPinned { get; set; }

        [Column("is_deleted")]
        public bool IsDeleted { get; set; }

        [Column("created_at")]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Column("updated_at")]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<AiChatMessage> Messages { get; set; } = new List<AiChatMessage>();
    }
}
