param([Parameter(Mandatory=$true)][string]$Destino)
$ErrorActionPreference = 'Stop'
$source = (Resolve-Path (Split-Path $PSScriptRoot -Parent)).Path
$target = (Resolve-Path $Destino).Path
if ($source.TrimEnd('\') -eq $target.TrimEnd('\')) { throw 'Extrae el paquete en otra carpeta antes de actualizar el sitio existente.' }
if (!(Test-Path (Join-Path $target 'admin.html'))) { throw 'La carpeta destino no parece un sitio KFitness.' }
$backup = Join-Path (Split-Path $target -Parent) ('KFitness-respaldo-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $backup | Out-Null
$skip = @('App_Data','Content','img','.git','.vs','bin','obj')
$fondosActualizacion = @('img\login-premium-bg.jpg', 'img\arena-fondo.png', 'img\hero-fondo-rojo.jpg', 'img\fondo-modales.jpg', 'img\gimnasio-fondo.png')
Get-ChildItem $source -File -Recurse | ForEach-Object {
 $relative = $_.FullName.Substring($source.Length + 1)
 $top = $relative.Split([System.IO.Path]::DirectorySeparatorChar)[0]
 if (($skip -contains $top -and $fondosActualizacion -notcontains $relative) -or $relative -eq 'web.config') { return }
 $dest = Join-Path $target $relative
 if (Test-Path $dest) { $old = Join-Path $backup $relative; New-Item -ItemType Directory -Force (Split-Path $old -Parent) | Out-Null; Copy-Item $dest $old }
 New-Item -ItemType Directory -Force (Split-Path $dest -Parent) | Out-Null
 Copy-Item $_.FullName $dest -Force
}
$configPath = Join-Path $target 'web.config'
Copy-Item $configPath (Join-Path $backup 'web.config')
[xml]$config = Get-Content $configPath -Raw
$runtime = $config.SelectSingleNode('/configuration/system.web/httpRuntime')
if ($null -eq $runtime) { $runtime=$config.CreateElement('httpRuntime'); $null=$config.configuration.'system.web'.AppendChild($runtime) }
$runtime.SetAttribute('maxRequestLength','32768')
$location=$config.SelectSingleNode('/configuration/location[@path="api/admin/routines-save.ashx"]')
if ($null -eq $location) { $location=$config.CreateElement('location');$location.SetAttribute('path','api/admin/routines-save.ashx');$null=$config.configuration.AppendChild($location) }
$node=$location
foreach($name in @('system.webServer','security','requestFiltering','requestLimits')) {
 $child=$node.SelectSingleNode($name)
 if($null -eq $child){$child=$config.CreateElement($name);$null=$node.AppendChild($child)}
 $node=$child
}
$node.SetAttribute('maxAllowedContentLength','33554432')
$config.Save($configPath)
Write-Host "Código actualizado. Respaldo: $backup"
Write-Host 'Se conservaron la conexión, las claves y los archivos de App_Data. Se copiaron los fondos requeridos por la actualización.'
Write-Host 'Siguiente: tools\Aplicar-Migraciones.ps1 y tools\Validar-Compilacion.ps1 desde el sitio actualizado.'
