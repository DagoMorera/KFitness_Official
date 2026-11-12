param([string]$Sitio = (Split-Path $PSScriptRoot -Parent))
$ErrorActionPreference = 'Stop'
$framework = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\aspnet_compiler.exe'
if (!(Test-Path $framework)) { $framework = Join-Path $env:WINDIR 'Microsoft.NET\Framework\v4.0.30319\aspnet_compiler.exe' }
if (!(Test-Path $framework)) { throw 'Instala ASP.NET .NET Framework 4.8 antes de compilar.' }
$target = Join-Path ([System.IO.Path]::GetTempPath()) ('KFitness-build-' + [guid]::NewGuid().ToString('N'))
& $framework -v / -p (Resolve-Path $Sitio).Path -f $target
if ($LASTEXITCODE -ne 0) { throw 'La compilación falló. Conserva la salida completa para corregirla.' }
Write-Host "Compilación ASP.NET correcta. Resultado temporal: $target"
Write-Host 'No se ejecutaron solicitudes HTTP ni operaciones funcionales.'
