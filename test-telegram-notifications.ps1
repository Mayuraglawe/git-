# Quick Test Script for Telegram Notifications
# Run this in PowerShell to test the implementation

Write-Host "🧪 Testing Telegram Notification Feature..." -ForegroundColor Cyan
Write-Host ""

# Configuration  
$baseUrl = "http://localhost:3001"

# Test 1: Check if server is running
Write-Host "Test 1: Checking if server is running..." -ForegroundColor Yellow
try {
    $pingResponse = Invoke-RestMethod -Uri "$baseUrl/api/ping" -Method GET -ErrorAction Stop
    Write-Host "✅ Server is running!" -ForegroundColor Green
    Write-Host "   Response: $($pingResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Server is not running. Please start with 'pnpm dev'" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check Telegram service status
Write-Host "Test 2: Checking Telegram service status..." -ForegroundColor Yellow
try {
    $statusResponse = Invoke-RestMethod -Uri "$baseUrl/api/telegram/status" -Method GET -ErrorAction Stop
    Write-Host "✅ Telegram service check completed!" -ForegroundColor Green
    Write-Host "   Is Ready: $($statusResponse.status.isReady)" -ForegroundColor Gray
    Write-Host "   Has Token: $($statusResponse.status.hasToken)" -ForegroundColor Gray
    Write-Host "   Has Chat ID: $($statusResponse.status.hasChatId)" -ForegroundColor Gray
    
    if (-not $statusResponse.status.isReady) {
        Write-Host "⚠️  Warning: Telegram service not fully configured" -ForegroundColor Yellow
        Write-Host "   In-app notifications will still work" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  Could not check Telegram status" -ForegroundColor Yellow
    Write-Host "   Error: $_" -ForegroundColor Red
}

Write-Host ""

# Test 3: Create test exam
Write-Host "Test 3: Creating test exam..." -ForegroundColor Yellow
$examBody = @{
    type = "midterm"
    subject = "Automated Test - Data Structures"
    date = "2025-10-15"
    time = "10:00"
    duration = "2 hours"
    instructions = "This is an automated test exam. Bring calculator."
    topics = "Arrays, Trees, Graphs, Hash Tables"
    creator_id = "test_creator_$(Get-Date -Format 'yyyyMMddHHmmss')"
    department_id = "test_dept_1"
} | ConvertTo-Json

try {
    $examResponse = Invoke-RestMethod -Uri "$baseUrl/api/new-generation/exams" `
        -Method POST `
        -ContentType "application/json" `
        -Body $examBody `
        -ErrorAction Stop
    
    Write-Host "✅ Exam created successfully!" -ForegroundColor Green
    Write-Host "   Message: $($examResponse.message)" -ForegroundColor Gray
    Write-Host "   Exam ID: $($examResponse.data.id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📱 Check your Telegram for exam notification!" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to create exam" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host ""

# Test 4: Create test assignment
Write-Host "Test 4: Creating test assignment..." -ForegroundColor Yellow
$assignmentBody = @{
    title = "Automated Test Assignment - Database Project"
    subject = "Database Management Systems"
    dueDate = "2025-10-20"
    dueTime = "23:59"
    description = "Design a complete database schema for a library management system. Include ER diagrams and normalization."
    submissionFormat = "PDF document via email"
    maxMarks = "50"
    creator_id = "test_creator_$(Get-Date -Format 'yyyyMMddHHmmss')"
    department_id = "test_dept_1"
} | ConvertTo-Json

try {
    $assignmentResponse = Invoke-RestMethod -Uri "$baseUrl/api/new-generation/assignments" `
        -Method POST `
        -ContentType "application/json" `
        -Body $assignmentBody `
        -ErrorAction Stop
    
    Write-Host "✅ Assignment created successfully!" -ForegroundColor Green
    Write-Host "   Message: $($assignmentResponse.message)" -ForegroundColor Gray
    Write-Host "   Assignment ID: $($assignmentResponse.data.id)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "📱 Check your Telegram for assignment notification!" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to create assignment" -ForegroundColor Red
    Write-Host "   Error: $_" -ForegroundColor Red
    Write-Host "   Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🎉 Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 What to verify:" -ForegroundColor Yellow
Write-Host "   1. Check your Telegram app for 2 messages" -ForegroundColor White
Write-Host "      - 📝 One for the exam notification" -ForegroundColor White
Write-Host "      - 📚 One for the assignment notification" -ForegroundColor White
Write-Host ""
Write-Host "   2. Check server console for:" -ForegroundColor White
Write-Host "      - ✅ In-app notifications sent" -ForegroundColor White
Write-Host "      - 📱 Telegram notifications sent" -ForegroundColor White
Write-Host ""
Write-Host "   3. Messages should be formatted with:" -ForegroundColor White
Write-Host "      - Emojis (📝 for exam, 📚 for assignment)" -ForegroundColor White
Write-Host "      - All details (subject, date, time, etc.)" -ForegroundColor White
Write-Host "      - Clean, professional layout" -ForegroundColor White
Write-Host ""
Write-Host "If you received the Telegram messages, the feature is working! 🎊" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
