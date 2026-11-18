$port = 3000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")

try {
    $listener.Start()
    Write-Output "HTTP Server listening on http://localhost:$port/"
} catch {
    Write-Error "Failed to start HttpListener: $_"
    exit 1
}

$htmlPath = Join-Path $PSScriptRoot "index.html"
if (-not (Test-Path $htmlPath)) {
    $htmlContent = "<h1>ApexCommerce</h1>"
} else {
    $htmlContent = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $url = $request.Url.LocalPath
        $method = $request.HttpMethod

        # Add CORS Headers
        $response.Headers.Add("Access-Control-Allow-Origin", "*")
        $response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        $response.Headers.Add("Access-Control-Allow-Headers", "Content-Type, Authorization")

        if ($method -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        if ($url -eq "/health") {
            $response.ContentType = "application/json"
            $json = '{"status":"healthy","service":"apex-commerce","environment":"local"}'
            $bytes = [System.Text.Encoding]::UTF8.GetBytes($json)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # Default: Serve HTML storefront application
        $response.ContentType = "text/html; charset=utf-8"
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($htmlContent)
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        $response.Close()
    } catch {
        # Keep listening if one request fails
    }
}
