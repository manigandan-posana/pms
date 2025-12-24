# MUI v7 Grid Migration Script
# This script will help fix Grid item prop errors

Write-Host "=== MUI v7 Grid Migration Tool ===" -ForegroundColor Cyan
Write-Host ""

$files = @(
    "src\pages\workspace\InwardCreatePage.tsx",
    "src\pages\workspace\UserDashboardPage.tsx",
    "src\pages\admin\DashboardPage.tsx",
    "src\pages\admin\MaterialDirectoryPage.tsx",
    "src\pages\admin\ProjectActivityPage.tsx",
    "src\pages\admin\AdminInwardDetailPage.tsx",
    "src\pages\workspace\InwardDetailPage.tsx",
    "src\pages\admin\AdminOutwardDetailPage.tsx",
    "src\pages\admin\AdminTransferDetailPage.tsx",
    "src\pages\workspace\TransferCreatePage.tsx",
    "src\pages\workspace\TransferDetailPage.tsx",
    "src\pages\workspace\OutwardCreatePage.tsx"
)

Write-Host "Files to process: $($files.Count)" -ForegroundColor Yellow
Write-Host ""

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    
    if (Test-Path $fullPath) {
        Write-Host "Processing: $file" -ForegroundColor Green
        
        $content = Get-Content $fullPath -Raw
        $originalContent = $content
        
        # Pattern 1: item xs={n} md={n} lg={n}
        $content = $content -replace 'item\s+xs=\{(\d+)\}\s+md=\{(\d+)\}\s+lg=\{(\d+)\}', 'item xs={ $1, md: $2, lg: $3 }}'
        
        # Pattern 2: item xs={n} sm={n} md={n}
        $content = $content -replace 'item\s+xs=\{(\d+)\}\s+sm=\{(\d+)\}\s+md=\{(\d+)\}', 'item xs={ $1, sm: $2, md: $3 }}'
        
        # Pattern 3: item xs={n} sm={n} lg={n}
        $content = $content -replace 'item\s+xs=\{(\d+)\}\s+sm=\{(\d+)\}\s+lg=\{(\d+)\}', 'item xs={ $1, sm: $2, lg: $3 }}'
        
        # Pattern 4: item xs={n} md={n}
        $content = $content -replace 'item\s+xs=\{(\d+)\}\s+md=\{(\d+)\}', 'item xs={ $1, md: $2 }}'
        
        # Pattern 5: item xs={n} sm={n}
        $content = $content -replace 'item\s+xs=\{(\d+)\}\s+sm=\{(\d+)\}', 'item xs={ $1, sm: $2 }}'
        
        # Pattern 6: item xs={n} lg={n}
        $content = $content -replace 'item\s+xs=\{(\d+)\}\s+lg=\{(\d+)\}', 'item xs={ $1, lg: $2 }}'
        
        # Pattern 7: item xs={n} (simple case)
        $content = $content -replace 'item\s+xs=\{(\d+)\}', 'item xs={ $1 }}'
        
        if ($content -ne $originalContent) {
            Set-Content -Path $fullPath -Value $content -NoNewline
            Write-Host "  ✓ Fixed Grid props" -ForegroundColor Green
        } else {
            Write-Host "  - No changes needed" -ForegroundColor Gray
        }
    } else {
        Write-Host "  ✗ File not found: $file" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Cyan
Write-Host "Please review the changes and run: npm run build" -ForegroundColor Yellow
