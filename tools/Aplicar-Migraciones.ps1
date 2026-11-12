param(
 [string]$Servidor = '(localdb)\MSSQLLocalDB',
 [string]$Base = 'KFitness',
 [switch]$SoloPerfil,
 [switch]$CompraYContacto
)
$ErrorActionPreference = 'Stop'
$sitio = Split-Path $PSScriptRoot -Parent
$folder = Join-Path $sitio 'DataBase'
$migracionesPerfil = @('014_Progreso_Cliente.sql','028_Perfil_Progreso_DatosPersonales.sql','029_Completar_Clientes_Existentes.sql')

$migracionesCompra = @('031_Promocion_Primera_Valoracion_Gratis.sql','032_Plan_Mensual_Contacto.sql')
if ($SoloPerfil -and $CompraYContacto) { throw 'Selecciona una sola opción de migración.' }
if ($SoloPerfil -or $CompraYContacto) {
 $migracionesSeleccionadas = if ($SoloPerfil) { $migracionesPerfil } else { $migracionesCompra }
 if ($PSBoundParameters.ContainsKey('Servidor') -ne $PSBoundParameters.ContainsKey('Base')) {
  throw 'Indica -Servidor y -Base juntos o deja que el script lea la conexión del sitio.'
 }

 if ($PSBoundParameters.ContainsKey('Servidor')) {
  $conexion = New-Object System.Data.SqlClient.SqlConnectionStringBuilder
  $conexion.DataSource = $Servidor
  $conexion.InitialCatalog = $Base
  $conexion.IntegratedSecurity = $true
 } else {
  [xml]$config = Get-Content (Join-Path $sitio 'web.config') -Raw
  $seccion = $config.SelectSingleNode('/configuration/connectionStrings')
  if ($null -ne $seccion -and $seccion.HasAttribute('configSource')) {
   [xml]$externo = Get-Content (Join-Path $sitio ($seccion.GetAttribute('configSource'))) -Raw
   $seccion = $externo.DocumentElement
  }
  $entrada = $null
  if ($null -ne $seccion) { $entrada = $seccion.SelectSingleNode('add[@name="KFitnessConnection"]') }
  if ($null -eq $entrada) { throw 'No se encontró KFitnessConnection en la configuración del sitio.' }
  $conexion = New-Object System.Data.SqlClient.SqlConnectionStringBuilder -ArgumentList ($entrada.GetAttribute('connectionString'))
  if (!$conexion.IntegratedSecurity) {
   throw ('Para conexiones con credenciales SQL, aplica estos scripts desde SSMS en la base del sitio: ' + ($migracionesSeleccionadas -join ', '))
  }
 }

 $conn = New-Object System.Data.SqlClient.SqlConnection -ArgumentList ($conexion.ConnectionString)
 try {
  $conn.Open()
  $tx = $conn.BeginTransaction()
  try {
   foreach ($file in $migracionesSeleccionadas) {
    Write-Host "Aplicando $file en $($conn.DataSource) / $($conn.Database)"
    $sql = [IO.File]::ReadAllText((Join-Path $folder $file), [Text.Encoding]::UTF8)
    foreach ($lote in [regex]::Split($sql, '(?im)^[\t ]*GO[\t ]*\r?$')) {
     if ([string]::IsNullOrWhiteSpace($lote)) { continue }
     $cmd = $conn.CreateCommand()
     try {
      $cmd.Transaction = $tx
      $cmd.CommandText = $lote
      $cmd.CommandTimeout = 60
      [void]$cmd.ExecuteNonQuery()
     } finally { $cmd.Dispose() }
    }
   }
   $tx.Commit()
  } finally { $tx.Dispose() }
 } finally { $conn.Dispose() }
 Write-Host 'Migraciones seleccionadas finalizadas.'
 return
}

if (!(Get-Command sqlcmd -ErrorAction SilentlyContinue)) { throw 'sqlcmd no está instalado o no está en PATH.' }
# Windows authentication only. For hosting, run the scripts through the provider's SQL interface.
foreach ($file in ($migracionesPerfil + @('024_Preflight.sql','024_Rutinas_Editor_Inline.sql','025_Rutinas_Progreso.sql','026_Consultas_Web.sql','027_Correos_Web.sql') + $migracionesCompra)) {
 Write-Host "Aplicando $file en $Servidor / $Base"
 & sqlcmd -S $Servidor -d $Base -E -I -b -f 65001 -i (Join-Path $folder $file)
 if ($LASTEXITCODE -ne 0) { throw "Se detuvo en $file. No continúes ni borres tablas; revisa el error." }
}
Write-Host 'Migraciones finalizadas. Se conservan los datos existentes.'
