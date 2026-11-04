param(
    [string]$FullName,
    [string]$Email,
    [string]$MobileNumber,
    [string]$Password,
    [string]$ApiUrl = "http://localhost:5000"
)

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   SMS - CREATE SUPER ADMIN UTILITY       " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Interactive prompts if parameters were omitted
if ([string]::IsNullOrWhiteSpace($FullName)) {
    $FullName = Read-Host "Enter Super Admin Full Name"
}
if ([string]::IsNullOrWhiteSpace($Email)) {
    $Email = Read-Host "Enter Super Admin Email"
}
if ([string]::IsNullOrWhiteSpace($MobileNumber)) {
    $MobileNumber = Read-Host "Enter Mobile Number"
}
if ([string]::IsNullOrWhiteSpace($Password)) {
    $Password = Read-Host "Enter Secure Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password)
    $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
}

if ([string]::IsNullOrWhiteSpace($FullName) -or [string]::IsNullOrWhiteSpace($Email) -or [string]::IsNullOrWhiteSpace($MobileNumber) -or [string]::IsNullOrWhiteSpace($Password)) {
    Write-Host "[Error] All fields (Full Name, Email, Mobile Number, Password) are required." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Creating Super Admin account for $Email..." -ForegroundColor Gray

# Attempt creation via Backend API endpoint
try {
    $body = @{
        fullName = $FullName.Trim()
        email = $Email.Trim()
        mobileNumber = $MobileNumber.Trim()
        password = $Password
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$ApiUrl/api/superadmin/create-superadmin" `
                                  -Method Post `
                                  -Body $body `
                                  -Headers $headers `
                                  -TimeoutSec 10 `
                                  -ErrorAction Stop

    Write-Host "[SUCCESS] Super Admin created successfully!" -ForegroundColor Green
    Write-Host "User ID:   $($response.userId)" -ForegroundColor Green
    Write-Host "Full Name: $($response.fullName)" -ForegroundColor Green
    Write-Host "Email:     $($response.email)" -ForegroundColor Green
    Write-Host "Roles:     $($response.roles -join ', ')" -ForegroundColor Green
    exit 0
}
catch {
    Write-Host "[Error] Failed to create Super Admin: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Ensure the Backend API is running on $ApiUrl (or pass -ApiUrl http://localhost:<port>)." -ForegroundColor White
    Write-Host "2. You can also open the Web Application in your browser: if no Super Admin exists, the first-time setup screen will guide you through creating it." -ForegroundColor White
    exit 1
}
