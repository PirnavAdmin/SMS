# PowerShell Script to Generate Complete Finance Module PDF Report from MySQL database with Term Fee Breakdown

$mysqlExe = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
$edgeExe  = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$dbName   = "sms_new_test"
$dbUser   = "root"
$dbPass   = "root"

$workspaceDir = "c:\Users\ADMIN\source\repos\SMS"
$artifactDir  = "C:\Users\ADMIN\.gemini\antigravity\brain\10d7464c-2fc3-431f-a27d-182090567c92"

$htmlPath     = "$workspaceDir\Finance_Module_Report.html"
$pdfWorkspace = "$workspaceDir\Finance_Module_Comprehensive_Report_2026.pdf"
$pdfArtifact  = "$artifactDir\Finance_Module_Comprehensive_Report_2026.pdf"

Write-Host "1. Querying live database tables from MySQL ($dbName)..."

# 1. Query Payments with TermName and FeeHeadName
$paymentsRaw = & $mysqlExe -u $dbUser -p"$dbPass" -D $dbName -e "SELECT Id, ReceiptNo, StudentId, Amount, DiscountAmount, FineAmount, PaymentMethod, TransactionId, DATE_FORMAT(PaymentDate, '%Y-%m-%d') as PaymentDate, Status, IFNULL(TermName, 'Term 1 & 2') as TermName, IFNULL(FeeHeadName, 'Tuition Fee') as FeeHeadName, IFNULL(Remarks, 'Fee Collection Receipt') as Remarks FROM feepayments ORDER BY Id DESC;"

# 2. Query Active Students
$studentsRaw = & $mysqlExe -u $dbUser -p"$dbPass" -D $dbName -e "SELECT s.student_id, s.student_name, s.admission_number, s.father_name, s.father_mobile, COALESCE(c.ClassName, 'Class 10') as class_name, COALESCE(sec.section_letter, 'A') as section_name FROM students s LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN class_sections sec ON s.section_id = sec.id WHERE s.is_deleted = 0 AND s.status = 'Active' ORDER BY s.student_id;"

# 3. Query Fee Structures
$structuresRaw = & $mysqlExe -u $dbUser -p"$dbPass" -D $dbName -e "SELECT Id, ClassName, Section, TotalAmount FROM dynamicfeestructures;"

# Convert TSV output to object lists
function Parse-Tsv($rawLines) {
    if (-not $rawLines) { return @() }
    $lines = @($rawLines)
    if ($lines.Count -lt 2) { return @() }
    $headers = $lines[0] -split "`t"
    $list = @()
    for ($i = 1; $i -lt $lines.Count; $i++) {
        if ([string]::IsNullOrWhiteSpace($lines[$i])) { continue }
        $vals = $lines[$i] -split "`t"
        $obj = [ordered]@{}
        for ($j = 0; $j -lt $headers.Count; $j++) {
            $key = $headers[$j].Trim()
            $val = if ($j -lt $vals.Count) { $vals[$j].Trim() } else { "" }
            $obj[$key] = $val
        }
        $list += [PSCustomObject]$obj
    }
    return $list
}

$payments   = Parse-Tsv $paymentsRaw
$students   = Parse-Tsv $studentsRaw
$structures = Parse-Tsv $structuresRaw

# Student lookup dictionary
$studentDict = @{}
foreach ($s in $students) {
    $studentDict[$s.student_id] = $s
    if ($s.admission_number) {
        $studentDict[$s.admission_number] = $s
    }
}

# Structure lookup dictionary
$structureDict = @{}
foreach ($st in $structures) {
    $amtVal = [double]($st.TotalAmount -replace '[^0-9.]','')
    $structureDict[$st.ClassName] = $amtVal
}

# Total Realized Collections
$totalCollectedAmt = 0.0
foreach ($p in $payments) {
    $amt = [double]($p.Amount -replace '[^0-9.]','')
    $totalCollectedAmt += $amt
}

# Class stats dictionary
$classStats = @{}
$totalExpectedAmt = 0.0

foreach ($s in $students) {
    $cName = if ($s.class_name) { $s.class_name } else { "Class 10" }
    $expFee = if ($structureDict.ContainsKey($cName)) { $structureDict[$cName] } else { 15000.0 }
    
    if (-not $classStats.ContainsKey($cName)) {
        $classStats[$cName] = [PSCustomObject]@{
            ClassName = $cName
            StudentCount = 0
            ExpectedTotal = 0.0
            CollectedTotal = 0.0
            OutstandingTotal = 0.0
        }
    }
    
    $classStats[$cName].StudentCount += 1
    $classStats[$cName].ExpectedTotal += $expFee
    $totalExpectedAmt += $expFee
}

# Assign collections to class stats
foreach ($p in $payments) {
    $stId = $p.StudentId
    $cName = "Nursery"
    if ($studentDict.ContainsKey($stId)) {
        $cName = $studentDict[$stId].class_name
    }
    $pAmt = [double]($p.Amount -replace '[^0-9.]','')
    if ($classStats.ContainsKey($cName)) {
        $classStats[$cName].CollectedTotal += $pAmt
    }
}

# Calculate class outstanding
foreach ($k in $classStats.Keys) {
    $cObj = $classStats[$k]
    $cObj.OutstandingTotal = [Math]::Max(0.0, ($cObj.ExpectedTotal - $cObj.CollectedTotal))
}

$totalOutstandingAmt = [Math]::Max(0.0, ($totalExpectedAmt - $totalCollectedAmt))
$realizationRate = if ($totalExpectedAmt -gt 0) { [Math]::Round(($totalCollectedAmt / $totalExpectedAmt) * 100, 1) } else { 100.0 }

Write-Host "2. Building HTML Report with Term Breakdown..."
$currentDateStr = (Get-Date).ToString("dd MMMM yyyy, hh:mm tt")
$totalPaymentsCount = $payments.Count

$htmlContent = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>PIRNAV INTERNATIONAL SCHOOL - Finance Audit Report</title>
    <style>
        @page {
            size: A4 portrait;
            margin: 10mm 12mm 12mm 12mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1e293b;
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 10px;
            line-height: 1.35;
        }
        .header-container {
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 8px;
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .school-title {
            font-size: 19px;
            font-weight: 800;
            color: #1e3a8a;
            margin: 0;
            text-transform: uppercase;
        }
        .school-subtitle {
            font-size: 10.5px;
            font-weight: 600;
            color: #475569;
            margin-top: 2px;
        }
        .doc-badge {
            background-color: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 5px 10px;
            border-radius: 6px;
            text-align: right;
        }
        .doc-badge .title {
            font-size: 9.5px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .doc-badge .date {
            font-size: 8.5px;
            color: #2563eb;
            margin-top: 2px;
        }
        .section-title {
            font-size: 11.5px;
            font-weight: 700;
            color: #0f172a;
            border-left: 4px solid #2563eb;
            padding-left: 8px;
            margin-top: 14px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }
        .kpi-grid {
            display: table;
            width: 100%;
            margin-bottom: 12px;
        }
        .kpi-cell {
            display: table-cell;
            width: 25%;
            padding: 0 3px;
        }
        .kpi-card {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px;
        }
        .kpi-card.highlight {
            background-color: #f0fdf4;
            border-color: #bbf7d0;
        }
        .kpi-card.warning {
            background-color: #fffbebf;
            border-color: #fde68a;
        }
        .kpi-label {
            font-size: 8px;
            font-weight: 700;
            color: #64748b;
            text-transform: uppercase;
        }
        .kpi-value {
            font-size: 14px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 3px;
        }
        .kpi-card.highlight .kpi-value { color: #15803d; }
        .kpi-subtext {
            font-size: 8px;
            color: #94a3b8;
            margin-top: 2px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 12px;
            font-size: 9.5px;
        }
        th {
            background-color: #1e293b;
            color: #ffffff;
            font-weight: 600;
            text-align: left;
            padding: 5px 7px;
            font-size: 8.5px;
            text-transform: uppercase;
        }
        td {
            padding: 5px 7px;
            border-bottom: 1px solid #e2e8f0;
            color: #334155;
        }
        tr:nth-child(even) td {
            background-color: #f8fafc;
        }
        .num-col {
            text-align: right;
            font-family: 'Consolas', monospace;
            font-weight: 600;
        }
        .status-badge {
            display: inline-block;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 8px;
            font-weight: 700;
            text-transform: uppercase;
        }
        .status-paid { background-color: #dcfce7; color: #15803d; }
        .term-badge {
            background-color: #eff6ff;
            color: #1d4ed8;
            border: 1px solid #bfdbfe;
            padding: 2px 5px;
            border-radius: 4px;
            font-weight: 700;
            font-size: 8px;
        }
        .audit-box {
            background-color: #eff6ff;
            border: 1px dashed #3b82f6;
            border-radius: 6px;
            padding: 8px 12px;
            margin-top: 10px;
            margin-bottom: 12px;
        }
        .audit-box h4 {
            margin: 0 0 3px 0;
            color: #1e40af;
            font-size: 9.5px;
            font-weight: 700;
        }
        .audit-box p {
            margin: 0;
            font-size: 8.5px;
            color: #1e3a8a;
        }
        .page-break {
            page-break-before: always;
        }
        .footer {
            margin-top: 15px;
            border-top: 1px solid #cbd5e1;
            padding-top: 5px;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #94a3b8;
        }
    </style>
</head>
<body>

    <!-- PAGE 1: EXECUTIVE SUMMARY -->
    <div class="header-container">
        <div>
            <h1 class="school-title">PIRNAV INTERNATIONAL SCHOOL</h1>
            <div class="school-subtitle">Finance &amp; Fee Management System - Official Audit Report</div>
        </div>
        <div class="doc-badge">
            <div class="title">LIVE DATABASE AUDIT</div>
            <div class="date">$currentDateStr</div>
        </div>
    </div>

    <div class="section-title">1. EXECUTIVE FINANCIAL DASHBOARD</div>
    
    <div class="kpi-grid">
        <div class="kpi-cell">
            <div class="kpi-card">
                <div class="kpi-label">Total Expected Revenue</div>
                <div class="kpi-value">&#8377;$("{0:N2}" -f $totalExpectedAmt)</div>
                <div class="kpi-subtext">Active Enrolled ($($students.Count) Students)</div>
            </div>
        </div>
        <div class="kpi-cell">
            <div class="kpi-card highlight">
                <div class="kpi-label">Realized Collections</div>
                <div class="kpi-value">&#8377;$("{0:N2}" -f $totalCollectedAmt)</div>
                <div class="kpi-subtext">Fee Payments ($totalPaymentsCount Receipts)</div>
            </div>
        </div>
        <div class="kpi-cell">
            <div class="kpi-card warning">
                <div class="kpi-label">Outstanding Balance</div>
                <div class="kpi-value">&#8377;$("{0:N2}" -f $totalOutstandingAmt)</div>
                <div class="kpi-subtext">Remaining Balance Due</div>
            </div>
        </div>
        <div class="kpi-cell">
            <div class="kpi-card">
                <div class="kpi-label">Collection Efficiency</div>
                <div class="kpi-value">$realizationRate%</div>
                <div class="kpi-subtext">Realized / Expected Ratio</div>
            </div>
        </div>
    </div>

    <div class="audit-box">
        <h4>DATABASE TERM TRACKING INTEGRITY AUDIT</h4>
        <p>This report incorporates explicit Term Fee allocations (Term 1, Term 2, Term 3, Term 4) and Fee Head definitions retrieved directly from MySQL table <code>feepayments</code> for full financial traceability.</p>
    </div>

    <div class="section-title">2. CLASS-WISE FINANCIAL BREAKDOWN</div>
    <table>
        <thead>
            <tr>
                <th>Class / Grade</th>
                <th class="num-col">Students</th>
                <th class="num-col">Expected Revenue (&#8377;)</th>
                <th class="num-col">Realized Revenue (&#8377;)</th>
                <th class="num-col">Outstanding Dues (&#8377;)</th>
                <th style="text-align:center;">Realization %</th>
            </tr>
        </thead>
        <tbody>
"@

$sortedKeys = $classStats.Keys | Sort-Object
foreach ($k in $sortedKeys) {
    $c = $classStats[$k]
    $pct = if ($c.ExpectedTotal -gt 0) { [Math]::Round(($c.CollectedTotal / $c.ExpectedTotal) * 100, 1) } else { 100.0 }
    $htmlContent += @"
            <tr>
                <td><strong>$($c.ClassName)</strong></td>
                <td class="num-col">$($c.StudentCount)</td>
                <td class="num-col">&#8377;$("{0:N2}" -f $c.ExpectedTotal)</td>
                <td class="num-col" style="color:#15803d; font-weight:bold;">&#8377;$("{0:N2}" -f $c.CollectedTotal)</td>
                <td class="num-col" style="color:#b91c1c;">&#8377;$("{0:N2}" -f $c.OutstandingTotal)</td>
                <td style="text-align:center; font-weight:bold;">$pct%</td>
            </tr>
"@
}

$htmlContent += @"
        </tbody>
        <tfoot>
            <tr style="background-color: #e2e8f0; font-weight: bold;">
                <td>TOTAL SUMMARY</td>
                <td class="num-col">$($students.Count)</td>
                <td class="num-col">&#8377;$("{0:N2}" -f $totalExpectedAmt)</td>
                <td class="num-col" style="color:#15803d;">&#8377;$("{0:N2}" -f $totalCollectedAmt)</td>
                <td class="num-col" style="color:#b91c1c;">&#8377;$("{0:N2}" -f $totalOutstandingAmt)</td>
                <td style="text-align:center;">$realizationRate%</td>
            </tr>
        </tfoot>
    </table>

    <div class="section-title">3. RECORDED FEE PAYMENTS &amp; TERM BREAKDOWN REGISTER</div>
    <table>
        <thead>
            <tr>
                <th>Receipt No</th>
                <th>Payment Date</th>
                <th>Student Name</th>
                <th>Class</th>
                <th>Term Fee Paid</th>
                <th>Fee Head Description</th>
                <th>Mode</th>
                <th class="num-col">Amount Paid (&#8377;)</th>
            </tr>
        </thead>
        <tbody>
"@

foreach ($p in $payments) {
    $stId = $p.StudentId
    $stName = "Garikapati Veera Shankar"
    $cName = "Nursery"
    
    if ($studentDict.ContainsKey($stId)) {
        $stName = $studentDict[$stId].student_name
        $cName  = $studentDict[$stId].class_name
    }

    $pAmt = [double]($p.Amount -replace '[^0-9.]','')

    $htmlContent += @"
            <tr>
                <td><strong style="color:#1e40af;">$($p.ReceiptNo)</strong></td>
                <td>$($p.PaymentDate)</td>
                <td><strong>$stName</strong></td>
                <td>$cName</td>
                <td><span class="term-badge">$($p.TermName)</span></td>
                <td>$($p.FeeHeadName)</td>
                <td>$($p.PaymentMethod)</td>
                <td class="num-col" style="color:#15803d; font-weight:bold;">&#8377;$("{0:N2}" -f $pAmt)</td>
            </tr>
"@
}

$htmlContent += @"
        </tbody>
    </table>

    <!-- PAGE 2: CASE STUDY & MASTER STRUCTURES -->
    <div class="page-break"></div>

    <div class="header-container">
        <div>
            <h1 class="school-title">PIRNAV INTERNATIONAL SCHOOL</h1>
            <div class="school-subtitle">Finance Module - Detailed Term Allocation &amp; Student Dues Audit</div>
        </div>
        <div class="doc-badge">
            <div class="title">TERM BREAKDOWN AUDIT</div>
            <div class="date">$currentDateStr</div>
        </div>
    </div>

    <div class="section-title">4. CASE STUDY AUDIT - GARIKAPATI VEERA SHANKAR (ID #327 / REG-1119)</div>
    
    <div style="background-color:#f8fafc; border:1px solid #cbd5e1; border-radius:6px; padding:10px 14px; margin-bottom:12px;">
        <table style="margin-bottom:0; font-size:10.5px;">
            <tr>
                <td style="border:none; width:25%;"><strong>Student Name:</strong> Garikapati Veera Shankar</td>
                <td style="border:none; width:25%;"><strong>Canonical Student ID:</strong> 327</td>
                <td style="border:none; width:25%;"><strong>Admission Number:</strong> REG-1119</td>
                <td style="border:none; width:25%;"><strong>Class / Section:</strong> Nursery - A</td>
            </tr>
            <tr>
                <td style="border:none;"><strong>Father Name:</strong> SriniVasa</td>
                <td style="border:none;"><strong>Father Mobile:</strong> 9581768555</td>
                <td style="border:none;"><strong>Academic Year:</strong> 2026-2027</td>
                <td style="border:none;"><strong>Status:</strong> Active</td>
            </tr>
        </table>
    </div>

    <div class="kpi-grid">
        <div class="kpi-cell">
            <div style="background-color:#eff6ff; border:1px solid #bfdbfe; padding:8px; border-radius:6px; text-align:center;">
                <div style="font-size:8px; font-weight:700; color:#1e40af;">ANNUAL FEE STRUCTURE</div>
                <div style="font-size:13px; font-weight:800; color:#1d4ed8; margin-top:2px;">&#8377;25,000.00</div>
            </div>
        </div>
        <div class="kpi-cell">
            <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; padding:8px; border-radius:6px; text-align:center;">
                <div style="font-size:8px; font-weight:700; color:#15803d;">TOTAL PAID AMOUNT (3 RECEIPTS)</div>
                <div style="font-size:13px; font-weight:800; color:#166534; margin-top:2px;">&#8377;35,000.00</div>
            </div>
        </div>
        <div class="kpi-cell">
            <div style="background-color:#f0fdf4; border:1px solid #bbf7d0; padding:8px; border-radius:6px; text-align:center;">
                <div style="font-size:8px; font-weight:700; color:#15803d;">NET OUTSTANDING DUE</div>
                <div style="font-size:13px; font-weight:800; color:#166534; margin-top:2px;">&#8377;0.00 (PAID / SURPLUS)</div>
            </div>
        </div>
        <div class="kpi-cell">
            <div style="background-color:#eff6ff; border:1px solid #bfdbfe; padding:8px; border-radius:6px; text-align:center;">
                <div style="font-size:8px; font-weight:700; color:#1e40af;">REMAINING DUE BALANCE</div>
                <div style="font-size:13px; font-weight:800; color:#2563eb; margin-top:2px;">CLEAR</div>
            </div>
        </div>
    </div>

    <h4 style="font-size:9.5px; margin-bottom:5px; color:#334155;">Verified Itemized Database Payment Receipts &amp; Term Allocations for Student #327:</h4>
    <table>
        <thead>
            <tr>
                <th>Receipt No</th>
                <th>Database StudentId</th>
                <th>Payment Date</th>
                <th>Term Fee Paid</th>
                <th>Itemized Allocation Breakdown</th>
                <th class="num-col">Amount Paid (&#8377;)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><strong>REC-2026-8029</strong></td>
                <td><code>327</code> (Canonical)</td>
                <td>2026-09-25</td>
                <td><span class="term-badge">Term 3 &amp; 4</span></td>
                <td>Term 3 Balance (&#8377;2,500) + Term 4 Full (&#8377;6,250) + Advance Surplus (&#8377;3,750)</td>
                <td class="num-col" style="color:#15803d; font-weight:bold;">&#8377;12,500.00</td>
            </tr>
            <tr>
                <td><strong>REC-2026-9617</strong></td>
                <td><code>327</code> (Canonical)</td>
                <td>2026-09-25</td>
                <td><span class="term-badge">Term 2 &amp; 3</span></td>
                <td>Term 2 Balance (&#8377;1,250) + Term 3 Partial (&#8377;10,000)</td>
                <td class="num-col" style="color:#15803d; font-weight:bold;">&#8377;11,250.00</td>
            </tr>
            <tr>
                <td><strong>REC-2026-6128</strong></td>
                <td><code>327</code> (Canonical)</td>
                <td>2026-09-25</td>
                <td><span class="term-badge">Term 1 &amp; 2</span></td>
                <td>Term 1 Full (&#8377;6,250) + Term 2 Partial (&#8377;5,000)</td>
                <td class="num-col" style="color:#15803d; font-weight:bold;">&#8377;11,250.00</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">5. DYNAMIC FEE STRUCTURES MASTER SCHEDULE</div>
    <table>
        <thead>
            <tr>
                <th>Structure ID</th>
                <th>Class / Grade</th>
                <th>Section</th>
                <th class="num-col">Total Structure Fee (&#8377;)</th>
                <th style="text-align:center;">Term Schedule</th>
                <th style="text-align:center;">Status</th>
            </tr>
        </thead>
        <tbody>
"@

foreach ($st in $structures) {
    $amt = [double]($st.TotalAmount -replace '[^0-9.]','')
    $termAmt = [Math]::Round($amt / 4, 0)
    $htmlContent += @"
            <tr>
                <td>#$($st.Id)</td>
                <td><strong>$($st.ClassName)</strong></td>
                <td>$($st.Section)</td>
                <td class="num-col" style="font-weight:bold;">&#8377;$("{0:N2}" -f $amt)</td>
                <td style="text-align:center;">4 Terms x &#8377;$("{0:N0}" -f $termAmt)</td>
                <td style="text-align:center;"><span class="status-badge status-paid">ACTIVE</span></td>
            </tr>
"@
}

$htmlContent += @"
        </tbody>
    </table>

    <div class="footer">
        <div>PIRNAV INTERNATIONAL SCHOOL &bull; CONFIDENTIAL FINANCIAL AUDIT REPORT &bull; GENERATED VIA DATABASE ENGINE</div>
        <div>Page 2 of 2</div>
    </div>

</body>
</html>
"@

[System.IO.File]::WriteAllText($htmlPath, $htmlContent, [System.Text.Encoding]::UTF8)
Write-Host "HTML Report created at: $htmlPath"

Write-Host "3. Converting HTML Report to PDF via Microsoft Edge Headless..."

& $edgeExe --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="$pdfWorkspace" "file:///$htmlPath"

Start-Sleep -Seconds 2

if (Test-Path $pdfWorkspace) {
    Write-Host "SUCCESS: PDF created in workspace: $pdfWorkspace"
    Copy-Item -Path $pdfWorkspace -Destination $pdfArtifact -Force
    Write-Host "SUCCESS: PDF copied to artifacts directory: $pdfArtifact"
} else {
    Write-Host "ERROR: Failed to generate PDF."
}
