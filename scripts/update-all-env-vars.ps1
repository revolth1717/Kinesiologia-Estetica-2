# Script para actualizar todas las variables de entorno obsoletas

$files = @(
    "src\app\api\zonas-por-tratamiento\[id]\route.ts",
    "src\app\api\zonas-por-tratamiento\route.ts",
    "src\app\api\user\[id]\route.ts",
    "src\app\api\users\route.ts",
    "src\app\api\order\route.ts",
    "src\app\api\order\bulk\route.ts",
    "src\app\api\order\[id]\route.ts",
    "src\app\api\inventory\route.ts",
    "src\app\api\availability\route.ts",
    "src\app\api\appointment\[id]\route.ts",
    "src\app\api\appointment\user\route.ts",
    "src\app\api\appointment\route.ts",
    "src\app\api\auth\signup\route.ts",
    "src\app\api\auth\login\route.ts",
    "src\app\api\payment\webhook\route.ts"
)

foreach ($file in $files) {
    $path = Join-Path $PSScriptRoot "..\$file"
    if (Test-Path $path) {
        $content = Get-Content $path -Raw
        
        # Reemplazar variables viejas por nuevas
        $content = $content -replace 'process\.env\.NEXT_PUBLIC_CONTENT_API_URL', 'process.env.NEXT_PUBLIC_XANO_CONTENT_API'
        $content = $content -replace 'process\.env\.NEXT_PUBLIC_AUTH_URL', 'process.env.NEXT_PUBLIC_XANO_AUTH_API'
        $content = $content -replace 'process\.env\.XANO_API_URL', 'process.env.NEXT_PUBLIC_XANO_AUTH_API'
        $content = $content -replace 'process\.env\.XANO_AUTH_API_URL', 'process.env.NEXT_PUBLIC_XANO_AUTH_API'
        $content = $content -replace 'process\.env\.XANO_GENERAL_API_URL', 'process.env.NEXT_PUBLIC_XANO_CONTENT_API'
        $content = $content -replace 'process\.env\.NEXT_PUBLIC_API_URL', 'process.env.NEXT_PUBLIC_XANO_CONTENT_API'
        
        Set-Content $path -Value $content -NoNewline
        Write-Host "✅ Actualizado: $file"
    } else {
        Write-Host "❌ No encontrado: $file"
    }
}

Write-Host "`n🎉 Actualización completada!"
