
$old = 'x8ki-letl-twmt.n7.xano.io'
$new = 'x1xv-egpg-1mua.b2.xano.io'

Write-Host "Starting Wildcard Workflow Update..."

# Get ALL JSON files in the current folder
$files = Get-ChildItem -Path "c:\Users\matia\OneDrive\Escritorio\kinesiologia\Kinesiologia-Estetica-2" -Filter "*.json"

foreach ($file in $files) {
    if ($file.Name -eq "package.json" -or $file.Name -eq "package-lock.json" -or $file.Name -eq "tsconfig.json") {
        continue
    }

    try {
        $content = [System.IO.File]::ReadAllText($file.FullName)
        if ($content.Contains($old)) {
            $newContent = $content.Replace($old, $new)
            [System.IO.File]::WriteAllText($file.FullName, $newContent)
            Write-Host "Updated: $($file.Name)"
        }
        else {
            if ($content.Contains($new)) {
                Write-Host "Already updated: $($file.Name)"
            }
            else {
                # Silent for unrelated jsons
            }
        }
    }
    catch {
        Write-Host "Error updating $($file.Name) : $_"
    }
}

Write-Host "Workflow Update Complete."
