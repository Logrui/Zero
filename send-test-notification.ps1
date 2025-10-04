$headers = @{
    "X-API-Key" = "zro_oHkXZMC7u6T1ZbRiB50j9zvzFz7ghXGx"
    "Content-Type" = "application/json"
}

$body = @{
    subject = "Test Notification from Cascade AI"
    body = "This is a test notification sent via the API to verify the notifications system is working correctly. The system successfully received and processed this message!"
    tags = @("Test", "API", "Cascade", "Demo")
    priority = "high"
    userId = "test-user-123"
} | ConvertTo-Json

$url = "http://localhost:8787/notifications/api"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing Notifications API" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "URL: $url"
Write-Host "Method: POST"
Write-Host "API Key: zro_oHkXZMC7u6T1ZbRiB50j9zvzFz7ghXGx"
Write-Host ""
Write-Host "Request Body:" -ForegroundColor Yellow
Write-Host $body
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body -Verbose
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[SUCCESS] Notification Created!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 10)
} catch {
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "[ERROR] Request Failed" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    if ($_.ErrorDetails.Message) {
        Write-Host ""
        Write-Host "Response Details:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message
    }
    Write-Host ""
    
    # Try to check if server is even running
    Write-Host "Checking server connectivity..." -ForegroundColor Yellow
    try {
        $healthCheck = Invoke-WebRequest -Uri "http://localhost:8787" -Method Get -ErrorAction Stop
        Write-Host "[OK] Server is responding on port 8787" -ForegroundColor Green
    } catch {
        Write-Host "[FAIL] Cannot connect to server on port 8787" -ForegroundColor Red
    }
}
