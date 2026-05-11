param(
  [ValidateSet("start", "stop", "status", "restart")]
  [string]$Action = "status"
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$stateDir = Join-Path $root ".local-dev"
$stateFile = Join-Path $stateDir "state.json"

$apiPort = 3001
$webPort = 4173

$apiWorkdir = Join-Path $root "apps\\api"
$webWorkdir = Join-Path $root "apps\\web"
$apiEntry = Join-Path $apiWorkdir "dist\\main.js"
$apiLog = Join-Path $stateDir "api.log"
$apiErr = Join-Path $stateDir "api.err.log"
$webLog = Join-Path $stateDir "web.log"
$webErr = Join-Path $stateDir "web.err.log"

function Ensure-StateDir {
  if (-not (Test-Path $stateDir)) {
    New-Item -Path $stateDir -ItemType Directory | Out-Null
  }
}

function Resolve-ViteCli {
  $candidates = @(
    (Join-Path $webWorkdir "node_modules\\vite\\bin\\vite.js"),
    (Join-Path $root "node_modules\\vite\\bin\\vite.js")
  )

  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) {
      return $candidate
    }
  }

  return $null
}

function Get-ListenerPid([int]$port) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($null -eq $conn) {
    return $null
  }

  return [int]$conn.OwningProcess
}

function Is-ProcessAlive([int]$processId) {
  if ($processId -le 0) {
    return $false
  }

  $proc = Get-Process -Id $processId -ErrorAction SilentlyContinue
  return ($null -ne $proc)
}

function Read-State {
  if (-not (Test-Path $stateFile)) {
    return $null
  }

  $raw = Get-Content $stateFile -Raw
  if ([string]::IsNullOrWhiteSpace($raw)) {
    return $null
  }

  return ($raw | ConvertFrom-Json)
}

function Save-State($state) {
  Ensure-StateDir
  $state | ConvertTo-Json -Depth 5 | Set-Content -Path $stateFile
}

function Remove-State {
  if (Test-Path $stateFile) {
    Remove-Item -Path $stateFile -Force
  }
}

function Stop-ManagedPid([int]$processId, [string]$label) {
  if (-not (Is-ProcessAlive $processId)) {
    return
  }

  Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
  Write-Output "Stopped $label (PID $processId)."
}

function Ensure-PortFreeOrFail([int]$port, [string]$name) {
  $listenerPid = Get-ListenerPid $port
  if ($null -ne $listenerPid) {
    throw "$name port $port is already in use by PID $listenerPid. Run 'pnpm local:stop' or free the port."
  }
}

function Start-Local {
  Ensure-StateDir

  if (-not (Test-Path $apiEntry)) {
    throw "Missing API build artifact: $apiEntry. Run 'pnpm --filter @sintese/api build' first."
  }

  $viteCli = Resolve-ViteCli
  if ([string]::IsNullOrWhiteSpace($viteCli)) {
    throw "Missing Vite CLI. Checked apps/web/node_modules and root node_modules. Run 'pnpm install' first."
  }

  $existing = Read-State
  if ($null -ne $existing) {
    $apiAlive = Is-ProcessAlive ([int]$existing.apiPid)
    $webAlive = Is-ProcessAlive ([int]$existing.webPid)
    if ($apiAlive -and $webAlive) {
      Write-Output "Already running."
      Show-Status
      return
    }
  }

  Ensure-PortFreeOrFail $apiPort "API"
  Ensure-PortFreeOrFail $webPort "WEB"

  foreach ($file in @($apiLog, $apiErr, $webLog, $webErr)) {
    if (Test-Path $file) {
      Remove-Item -Path $file -Force
    }
  }

  $apiProc = Start-Process -FilePath "node.exe" -ArgumentList @($apiEntry) -WorkingDirectory $apiWorkdir -WindowStyle Hidden -PassThru -RedirectStandardOutput $apiLog -RedirectStandardError $apiErr
  $webProc = Start-Process -FilePath "node.exe" -ArgumentList @($viteCli, "preview", "--host", "127.0.0.1", "--port", "$webPort", "--strictPort") -WorkingDirectory $webWorkdir -WindowStyle Hidden -PassThru -RedirectStandardOutput $webLog -RedirectStandardError $webErr

  $ready = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 500
    $apiPid = Get-ListenerPid $apiPort
    $webPid = Get-ListenerPid $webPort
    if (($null -ne $apiPid) -and ($null -ne $webPid)) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    Stop-ManagedPid ([int]$apiProc.Id) "API"
    Stop-ManagedPid ([int]$webProc.Id) "WEB"
    throw "Startup failed. Check logs: $apiErr and $webErr"
  }

  $state = @{
    startedAt = (Get-Date).ToString("o")
    apiPid    = [int]$apiProc.Id
    webPid    = [int]$webProc.Id
    apiPort   = $apiPort
    webPort   = $webPort
    logs      = @{
      apiOut = $apiLog
      apiErr = $apiErr
      webOut = $webLog
      webErr = $webErr
    }
  }
  Save-State $state

  Write-Output "Local environment started."
  Write-Output "API: http://localhost:$apiPort (PID $($apiProc.Id))"
  Write-Output "WEB: http://localhost:$webPort (PID $($webProc.Id))"
}

function Stop-Local {
  $state = Read-State

  if ($null -ne $state) {
    Stop-ManagedPid ([int]$state.apiPid) "API"
    Stop-ManagedPid ([int]$state.webPid) "WEB"
  }

  foreach ($port in @($apiPort, $webPort)) {
    $listenerPid = Get-ListenerPid $port
    if ($null -ne $listenerPid) {
      Stop-ManagedPid $listenerPid "Port $port owner"
    }
  }

  Remove-State
  Write-Output "Local environment stopped."
}

function Show-Status {
  $state = Read-State
  $apiListener = Get-ListenerPid $apiPort
  $webListener = Get-ListenerPid $webPort

  Write-Output "Status:"
  if ($null -eq $state) {
    Write-Output "  state: no state file"
  } else {
    $apiAlive = Is-ProcessAlive ([int]$state.apiPid)
    $webAlive = Is-ProcessAlive ([int]$state.webPid)
    Write-Output "  state: startedAt=$($state.startedAt)"
    Write-Output "  api managed pid: $($state.apiPid) (alive=$apiAlive)"
    Write-Output "  web managed pid: $($state.webPid) (alive=$webAlive)"
  }

  Write-Output "  api port $apiPort listener pid: $apiListener"
  Write-Output "  web port $webPort listener pid: $webListener"
}

switch ($Action) {
  "start" {
    Start-Local
  }
  "stop" {
    Stop-Local
  }
  "status" {
    Show-Status
  }
  "restart" {
    Stop-Local
    Start-Local
  }
}
