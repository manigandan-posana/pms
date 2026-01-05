# FIX: "No static resource api/contractors" Error

## Problem
The backend is returning "No static resource api/contractors" error, which means:
- The old version of the application is still running
- The new ContractorDto and updated controllers haven't been loaded

## Solution

### Step 1: Stop the Running Application

**Option A: Using Task Manager (Windows)**
1. Press `Ctrl + Shift + Esc` to open Task Manager
2. Find "java.exe" processes
3. Right-click on java.exe running "store" or "StoreApplication"
4. Click "End Task"

**Option B: Using PowerShell**
```powershell
# Find Java processes
Get-Process java | Where-Object {$_.CommandLine -match "store"} | Stop-Process -Force

# OR kill all java processes (if no other Java apps running)
Stop-Process -Name "java" -Force
```

**Option C: Using VS Code**
1. Go to the terminal running "Run: StoreApplication"
2. Press `Ctrl + C` to stop it
3. Or click the trash icon to kill the terminal

### Step 2: Rebuild the Application

```powershell
cd E:\PMS\store
.\mvnw clean package -DskipTests
```

### Step 3: Start the Application

**Option A: From VS Code**
1. Open `StoreApplication.java`
2. Click the "Run" button above the `main` method
3. Or press `F5`

**Option B: From Terminal**
```powershell
cd E:\PMS\store
java -jar target\store-0.0.1-SNAPSHOT.jar
```

**Option C: Using Maven**
```powershell
cd E:\PMS\store
.\mvnw spring-boot:run
```

### Step 4: Verify Application Started

Look for these lines in the console:
```
Started StoreApplication in X.XXX seconds
Tomcat started on port 8080 (http)
```

### Step 5: Test the Endpoints

**Test in browser or Postman:**
```
GET http://localhost:8080/api/contractors
GET http://localhost:8080/api/contractors?includeProjects=true
GET http://localhost:8080/api/suppliers
```

## Quick Restart Script

I've created a PowerShell script for you:

```powershell
# Run this to restart the backend
E:\PMS\restart-backend.ps1
```

## Common Issues

### Issue 1: Port 8080 Already in Use
```
Port 8080 is already in use
```
**Solution:** Kill the process using port 8080:
```powershell
# Find process on port 8080
netstat -ano | findstr :8080

# Kill it (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Issue 2: Database Connection Error
```
Unable to connect to MySQL
```
**Solution:** Ensure MySQL is running:
```powershell
# Check if MySQL is running
Get-Service MySQL*

# Start MySQL if not running
Start-Service MySQL80  # or your MySQL service name
```

### Issue 3: "Cannot find or load main class"
**Solution:** Rebuild the application:
```powershell
cd E:\PMS\store
.\mvnw clean compile
```

## What Changed?

The following files were modified/created:
1. `CreateSupplierRequest.java` - Fixed validation
2. `ContractorDto.java` - NEW - Returns contractor with projects
3. `LabourDto.java` - NEW - Returns labour with projects
4. `ContractorController.java` - Enhanced with includeProjects parameter
5. `ContractorService.java` - Added listAllWithProjects() method
6. `SupplierService.java` - Already correct
7. Frontend files - Updated to show project information

All these changes are compiled in the new JAR, but the old application must be stopped first.

## Testing After Restart

### Test 1: Admin Create Common Supplier
1. Login as admin
2. Go to Master Console → Supplier Management
3. Click "Add Supplier"
4. Fill: Name="Test Supplier", Type="MATERIALS"
5. DON'T select projects
6. Click "Add"
7. ✅ Should work without errors

### Test 2: Admin Create Common Contractor
1. Go to Master Console → Contractor Management
2. Click "New Contractor"
3. Fill: Name="Test Contractor", Type="Work"
4. Click "Create"
5. ✅ Should work without errors

### Test 3: View Project Tags
1. In admin view, look at contractors list
2. ✅ Should see "[Common]" badge for new contractor
3. ✅ Should see project badges for project-specific contractors

## Verification Commands

```powershell
# Check if backend is responding
curl http://localhost:8080/api/contractors

# Check build was successful
Test-Path E:\PMS\store\target\store-0.0.1-SNAPSHOT.jar

# Check Java processes
Get-Process java
```

## If Still Not Working

1. Check application logs in terminal for errors
2. Verify all files compiled: `.\mvnw clean compile`
3. Check MySQL is running and accessible
4. Clear browser cache (Ctrl + Shift + Delete)
5. Check network tab in browser DevTools (F12)
