<#
.SYNOPSIS
    Run non-destructive diagnostic checks on the PVE host (192.168.1.100).
.DESCRIPTION
    Collects system info, container listing, storage usage, and core service health
    without altering any state on the host.
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $false)]
    [string]$HostName = "192.168.1.100",

    [Parameter(Mandatory = $false)]
    [string]$User = "root"
)

$target = "$User@$HostName"
Write-Host "=== Gathering Health Diagnostics from $target ===" -ForegroundColor Cyan

$diagnosticScript = @'
echo "=== SYSTEM & PVE VERSION ==="
uname -a
pveversion -v 2>/dev/null || pveversion

echo -e "\n=== UPTIME & LOAD ==="
uptime

echo -e "\n=== MEMORY USAGE ==="
free -h

echo -e "\n=== ROOT FILESYSTEM & STORAGE ==="
df -h /
pvesm status 2>/dev/null || true

echo -e "\n=== PVE CORE SERVICES ==="
systemctl is-active pveproxy pvedaemon pvestatd pve-cluster 2>/dev/null || true

echo -e "\n=== LXC CONTAINERS ==="
pct list 2>/dev/null || true

echo -e "\n=== UPGRADABLE PACKAGES CHECK ==="
apt list --upgradable 2>/dev/null | head -n 15 || true
'@

ssh -o ConnectTimeout=10 -o BatchMode=yes $target $diagnosticScript

