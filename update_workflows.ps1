
$old = 'x8ki-letl-twmt.n7.xano.io'
$new = 'x1xv-egpg-1mua.b2.xano.io'

Write-Host "Starting Workflow Update..."

# List of files to update (using local paths found)
$files = @(
    "Automatizacion 8AM Kinesiologia.json",
    "Kinesiologia Estética Admin.json",
    "Kinesiologia Estética Cliente.json",
    "Notificación Cancelación Cita Kinesiologia.json"
)

foreach ($filename in $files) {
    $path = Join-Path "c:\Users\matia\OneDrive\Escritorio\kinesiologia\Kinesiologia-Estetica-2" $filename
    if (Test-Path $path) {
        try {
            $content = [System.IO.File]::ReadAllText($path)
            if ($content.Contains($old)) {
                $newContent = $content.Replace($old, $new)
                [System.IO.File]::WriteAllText($path, $newContent)
                Write-Host "Updated: $filename"
            }
            else {
                # Check if it already has the new one
                if ($content.Contains($new)) {
                    Write-Host "Already updated: $filename"
                }
                else {
                    Write-Host "String not found in: $filename (Might not use Xano URL directly?)"
                }
            }
        }
        catch {
            Write-Host "Error updating $filename : $_"
        }
    }
    else {
        Write-Host "File not found: $filename"
    }
}

Write-Host "Workflow Update Complete."
