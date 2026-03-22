$ErrorActionPreference = "Stop"

$md = "C:\Users\user\Documents\Playground\tokenfc\token_fc_mvp_documento_atualizado.md"
$html = "C:\Users\user\Documents\Playground\tokenfc\token_fc_mvp_documento_atualizado.tmp.html"
$pdf = "C:\Users\user\Documents\Playground\tokenfc\token_fc_mvp_documento_atualizado.pdf"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

& "npx.cmd" marked $md -o $html

$style = @'
<style>
body { font-family: Arial, Helvetica, sans-serif; margin: 40px auto; max-width: 980px; line-height: 1.5; color: #111; }
h1, h2, h3 { line-height: 1.2; }
pre, code { font-family: Consolas, monospace; }
pre { background: #f6f8fa; padding: 12px; border-radius: 8px; overflow: auto; }
code { background: #f6f8fa; padding: 2px 4px; border-radius: 4px; }
a { color: #0b57d0; text-decoration: none; }
ul, ol { padding-left: 24px; }
hr { border: 0; border-top: 1px solid #ddd; margin: 24px 0; }
</style>
'@

$content = Get-Content -Path $html -Raw
if ($content -notmatch "<head>") {
  $content = $style + $content
} else {
  $content = $content -replace "<head>", ("<head>" + [Environment]::NewLine + $style)
}

Set-Content -Path $html -Value $content -Encoding UTF8
& $chrome --headless=new --disable-gpu --print-to-pdf=$pdf $html
Remove-Item $html -Force
Get-Item $pdf | Select-Object FullName, LastWriteTime, Length
