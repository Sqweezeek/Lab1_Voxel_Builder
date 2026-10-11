param(
    [int]$Port = 8080
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")
try {
    $listener.Start()
    Write-Host "==================================================" -ForegroundColor Cyan
    Write-Host " VoxelCraft 3D Studio Server running at:          " -ForegroundColor Green
    Write-Host " http://localhost:$Port/                           " -ForegroundColor Yellow
    Write-Host " Press Ctrl+C to stop the server                  " -ForegroundColor Gray
    Write-Host "==================================================" -ForegroundColor Cyan

    $baseDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    if (-not $baseDir) { $baseDir = (Get-Location).Path }

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $urlPath = $request.Url.LocalPath
        if ($urlPath -eq "/" -or [string]::IsNullOrEmpty($urlPath)) {
            $urlPath = "/index.html"
        }

        $localPath = Join-Path $baseDir ($urlPath.TrimStart('/').Replace('/', '\'))

        if (Test-Path $localPath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $ext = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".png"  { "image/png" }
                ".obj"  { "text/plain" }
                default { "application/octet-stream" }
            }
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    }
} finally {
    $listener.Stop()
}
