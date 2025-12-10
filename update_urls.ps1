
$old = 'x8ki-letl-twmt.n7.xano.io'
$new = 'x1xv-egpg-1mua.b2.xano.io'

Write-Host "Starting Update (Compat Mode)..."

function Update-File($path) {
    if (Test-Path $path) {
        try {
            $content = [System.IO.File]::ReadAllText($path)
            if ($content.Contains($old)) {
                $newContent = $content.Replace($old, $new)
                [System.IO.File]::WriteAllText($path, $newContent)
                Write-Host "Updated: $path"
            }
        }
        catch {
            Write-Host "Error updating $path : $_"
        }
    }
}

# Update .env.local
Update-File 'c:\Users\matia\OneDrive\Escritorio\kinesiologia\Kinesiologia-Estetica-2\.env.local'

# Update Kinesiologia estetica.json
Update-File 'c:\Users\matia\OneDrive\Escritorio\kinesiologia\Kinesiologia-Estetica-2\Kinesiologia estetica.json'

# Update src files
$files = Get-ChildItem -Path "c:\Users\matia\OneDrive\Escritorio\kinesiologia\Kinesiologia-Estetica-2\src" -Recurse -Include *.ts, *.tsx, *.js
foreach ($file in $files) {
    Update-File $file.FullName
}

Write-Host "Update Complete."
