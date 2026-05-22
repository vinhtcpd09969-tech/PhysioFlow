Write-Host "Checking if Docker is running..."
docker ps >$null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Starting Docker Desktop..."
    Start-Process -FilePath "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    # Wait for Docker to start (up to 90 seconds)
    $seconds = 0
    while ($seconds -lt 90) {
        docker ps >$null 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Docker daemon is ready!"
            break
        }
        Start-Sleep -Seconds 5
        $seconds += 5
        Write-Host "Waiting for Docker daemon... ($seconds/90s)"
    }
} else {
    Write-Host "Docker daemon is already running."
}

# Run docker-compose up
Write-Host "Starting Docker Compose services..."
docker-compose up -d

# Wait for database container to be healthy / up
Write-Host "Waiting for database container to start..."
Start-Sleep -Seconds 8

# Check if physioflow_db is running
$containers = docker ps --filter "name=physioflow_db" --format "{{.Names}}"
if ($containers -contains "physioflow_db") {
    Write-Host "physioflow_db is running!"
} else {
    Write-Host "Error: physioflow_db container is not running."
    exit 1
}

# Create database and restore backup if needed
Write-Host "Checking database status..."
# Check if database office_care exists
$dbExists = docker exec physioflow_db psql -U postgres -lqt | Select-String -Pattern "office_care"

if ($dbExists) {
    Write-Host "Database 'office_care' already exists."
} else {
    Write-Host "Creating database 'office_care'..."
    docker exec physioflow_db psql -U postgres -c "CREATE DATABASE office_care;"
    
    Write-Host "Copying backup file to container..."
    docker cp office_care_backup.sql physioflow_db:/tmp/office_care_backup.sql
    
    Write-Host "Restoring database from backup..."
    docker exec physioflow_db psql -U postgres -d office_care -f /tmp/office_care_backup.sql
    Write-Host "Database restored successfully!"
}
