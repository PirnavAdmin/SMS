using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SMS.Api.Models
{
    [Table("SchoolSettings")]
    public class SchoolSettings
    {
        [Key]
        public int Id { get; set; } = 1;

        [MaxLength(250)]
        public string SchoolName { get; set; } = "Pirnav Educational Institutions";

        [MaxLength(250)]
        public string Tagline { get; set; } = "Empowering Minds, Shaping Tomorrow";

        public string Address { get; set; } = "Jain Sadguru Images Capital Park502B, Capital Pk Rd, VIP Hills, Madhapur, HITEC City, Hyderabad, Telangana 500081";

        [MaxLength(50)]
        public string Phone { get; set; } = "+91 9123456789";

        [MaxLength(100)]
        public string Email { get; set; } = "contact@pirnavschools.edu";

        [MaxLength(150)]
        public string Website { get; set; } = "https://pirnavschools.edu";

        [MaxLength(150)]
        public string PrincipalName { get; set; } = "Dr. Eleanor Vance";

        public string LogoUrl { get; set; } = string.Empty;

        [MaxLength(20)]
        public string LogoFormat { get; set; } = "PNG";

        public string CampusesJson { get; set; } = "[]";

        public string CertificateTemplatesJson { get; set; } = "[]";

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
