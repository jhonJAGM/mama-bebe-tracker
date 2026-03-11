# ============================================================
# PowerShell Profile - Microsoft.PowerShell_profile.ps1
# Carga automatica del perfil FLUX en cada sesion de PS / VS Code
# ============================================================

$FluxProfile = "C:\Users\jagonzalezm\Documents\JHON GONZALEZ\ADMON\FLUX\profile.ps1"

if (Test-Path $FluxProfile) {
    . $FluxProfile
} else {
    Write-Warning "[FLUX] Perfil no encontrado en: $FluxProfile"
}
