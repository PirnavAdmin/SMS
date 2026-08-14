using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace SMS.Api.Dtos
{
    public class UniformSupplierDto
    {
        [JsonPropertyName("supplierId")]
        public int SupplierId { get; set; }

        [JsonPropertyName("id")]
        public int Id => SupplierId;

        [JsonPropertyName("supplierName")]
        public string SupplierName { get; set; } = string.Empty;

        [JsonPropertyName("companyName")]
        public string CompanyName => SupplierName;

        [JsonPropertyName("contactPerson")]
        public string ContactPerson { get; set; } = string.Empty;

        [JsonPropertyName("contactRepresentative")]
        public string ContactRepresentative => ContactPerson;

        [JsonPropertyName("phone")]
        public string Phone { get; set; } = string.Empty;

        [JsonPropertyName("mobileNumber")]
        public string MobileNumber => Phone;

        [JsonPropertyName("mobile")]
        public string Mobile => Phone;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("emailAddress")]
        public string EmailAddress => Email;

        [JsonPropertyName("gstNumber")]
        public string GstNumber { get; set; } = string.Empty;

        [JsonPropertyName("gstRegistrationNo")]
        public string GstRegistrationNo => GstNumber;

        [JsonPropertyName("address")]
        public string Address { get; set; } = string.Empty;

        [JsonPropertyName("warehouseAddress")]
        public string WarehouseAddress => Address;

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("createdAt")]
        public DateTime CreatedAt { get; set; }
    }

    public class CreateUniformSupplierDto
    {
        [Required(ErrorMessage = "Supplier / Company Name is required.")]
        [JsonPropertyName("supplierName")]
        public string SupplierName { get; set; } = string.Empty;

        [JsonPropertyName("companyName")]
        public string? CompanyNameAlias
        {
            get => SupplierName;
            set { if (!string.IsNullOrWhiteSpace(value)) SupplierName = value; }
        }

        [JsonPropertyName("contactPerson")]
        public string? ContactPerson { get; set; }

        [JsonPropertyName("contactRepresentative")]
        public string? ContactRepresentativeAlias
        {
            get => ContactPerson;
            set { if (!string.IsNullOrWhiteSpace(value)) ContactPerson = value; }
        }

        [JsonPropertyName("phone")]
        public string? Phone { get; set; }

        [JsonPropertyName("mobileNumber")]
        public string? MobileNumberAlias
        {
            get => Phone;
            set { if (!string.IsNullOrWhiteSpace(value)) Phone = value; }
        }

        [JsonPropertyName("mobile")]
        public string? MobileAlias
        {
            get => Phone;
            set { if (!string.IsNullOrWhiteSpace(value)) Phone = value; }
        }

        [JsonPropertyName("email")]
        public string? Email { get; set; }

        [JsonPropertyName("emailAddress")]
        public string? EmailAddressAlias
        {
            get => Email;
            set { if (!string.IsNullOrWhiteSpace(value)) Email = value; }
        }

        [JsonPropertyName("gstNumber")]
        public string? GstNumber { get; set; }

        [JsonPropertyName("gstRegistrationNo")]
        public string? GstRegistrationNoAlias
        {
            get => GstNumber;
            set { if (!string.IsNullOrWhiteSpace(value)) GstNumber = value; }
        }

        [JsonPropertyName("address")]
        public string? Address { get; set; }

        [JsonPropertyName("warehouseAddress")]
        public string? WarehouseAddressAlias
        {
            get => Address;
            set { if (!string.IsNullOrWhiteSpace(value)) Address = value; }
        }

        [JsonPropertyName("status")]
        public string Status { get; set; } = "Active";

        [JsonPropertyName("supplierStatus")]
        public string? SupplierStatusAlias
        {
            get => Status;
            set { if (!string.IsNullOrWhiteSpace(value)) Status = value; }
        }
    }
}
