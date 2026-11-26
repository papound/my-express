<#
.SYNOPSIS
    Execute a command on the Proxmox VE host (192.168.1.100) via SSH as root.
.DESCRIPTION
    Wraps SSH execution to root@192.168.1.100 with standard options and error handling.
.PARAMETER Command
    The command string to execute remotely.
.PARAMETER TimeoutSeconds
    Connection timeout in seconds (default: 15).
.EXAMPLE
    .\ssh_pve.ps1 -Command "pct list"
#>

[CmdletBinding()]
param (
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Command,

    [Parameter(Mandatory = $false)]
    [string]$HostName = "192.168.1.100",

    [Parameter(Mandatory = $false)]
    [string]$User = "root",

    [Parameter(Mandatory = $false)]
    [int]$TimeoutSeconds = 15
)

$target = "$User@$HostName"
$sshArgs = @(
    "-o", "ConnectTimeout=$TimeoutSeconds",
    "-o", "StrictHostKeyChecking=accept-new",
    "-o", "BatchMode=yes",
    $target,
    $Command
)

try {
    & ssh.exe @sshArgs
}
catch {
    Write-Error "Failed to execute SSH command on $target : $_"
    exit 1
}

