# ============================================================
# FLUX WORKSPACE - PowerShell Profile General
# Ruta: C:\Users\jagonzalezm\Documents\JHON GONZALEZ\ADMON\FLUX\$PROFILE.txt
# Cargado automaticamente desde: $PROFILE (Microsoft.PowerShell_profile.ps1)
# ============================================================

# ---- PATH & ENTORNO ----------------------------------------
$env:PATH = "C:\Users\jagonzalezm\nodejs;" + $env:PATH
$env:PATH = "C:\Program Files\Git\cmd;" + $env:PATH
$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH
$env:CLAUDE_CODE_GIT_BASH_PATH = "C:\Users\jagonzalezm\AppData\Local\Programs\Git\bin\bash.exe"

# Politica de ejecucion para sesion actual
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

# ---- VARIABLES DE PROYECTO ---------------------------------
$env:PROJECTS_ROOT = "C:\Users\jagonzalezm\Documents\JHON GONZALEZ\ADMON\FLUX\DEV"
$env:FLUX_ROOT     = "C:\Users\jagonzalezm\Documents\JHON GONZALEZ\ADMON\FLUX"

# ---- ALIASES UTILES ----------------------------------------
Set-Alias -Name ll    -Value Get-ChildItem
Set-Alias -Name which -Value Get-Command
Set-Alias -Name touch -Value New-Item

# Abrir VS Code en el directorio actual
function code-here { & "C:\Users\jagonzalezm\AppData\Local\Programs\Microsoft VS Code\Code.exe" . }

# Navegar rapido a proyectos
function goto-dev  { Set-Location $env:PROJECTS_ROOT }
function goto-flux { Set-Location $env:FLUX_ROOT }

# Git shortcuts
function gs  { git status }
function ga  { git add . }
function gc  { param($msg) git commit -m $msg }
function gp  { git push }
function gpl { git pull }
function glog { git log --oneline --graph --decorate -15 }

# Node / npm shortcuts
function ni  { npm install }
function nr  { param($script) npm run $script }
function nrd { npm run dev }
function nrb { npm run build }

# ---- VERIFICACION DE HERRAMIENTAS AL INICIO ----------------
function Check-DevTools {
    $tools = @{
        "node"   = "node --version"
        "npm"    = "npm --version"
        "git"    = "git --version"
        "python" = "python --version"
    }
    Write-Host "`n[FLUX] Entorno de desarrollo:" -ForegroundColor Cyan
    foreach ($tool in $tools.Keys) {
        try {
            $ver = Invoke-Expression $tools[$tool] 2>$null
            Write-Host "  [OK] $tool $ver" -ForegroundColor Green
        } catch {
            Write-Host "  [--] $tool no encontrado" -ForegroundColor DarkGray
        }
    }
    Write-Host ""
}

# ---- BIENVENIDA --------------------------------------------
function Show-FluxBanner {
    $date = Get-Date -Format "yyyy-MM-dd HH:mm"
    Write-Host "============================================" -ForegroundColor DarkCyan
    Write-Host "  FLUX Workspace  |  $date" -ForegroundColor Cyan
    Write-Host "  Proyectos: $env:PROJECTS_ROOT" -ForegroundColor DarkCyan
    Write-Host "============================================" -ForegroundColor DarkCyan
}

# ---- EJECUTAR AL INICIO ------------------------------------
Show-FluxBanner
Check-DevTools
