# Proxmox VE Troubleshooting Runbook

Procedures for diagnosing and resolving issues on Proxmox VE host `192.168.1.100` via SSH (`root`).

---

## 1. System Health & Core Daemons Check

Proxmox relies on several key systemd daemons:
- `pveproxy`: Web GUI & API reverse proxy (port 8006).
- `pvedaemon`: PVE API daemon handling background tasks.
- `pvestatd`: PVE status daemon (gathers VM/CT metrics).
- `corosync`: Cluster engine (if clustered).
- `pve-cluster`: Cluster file system (`/etc/pve`).

### Diagnostic commands (Safe / Read-Only):
```bash
# Check status of PVE services
ssh root@192.168.1.100 "systemctl is-active pveproxy pvedaemon pvestatd pve-cluster"

# Check detailed status of failed units
ssh root@192.168.1.100 "systemctl --failed"

# View recent service logs
ssh root@192.168.1.100 "journalctl -u pveproxy -n 50 --no-pager"
ssh root@192.168.1.100 "journalctl -u pvedaemon -n 50 --no-pager"
```

### Remediation (Approval Required):
```bash
# Restart Web GUI proxy if unresponsive
ssh root@192.168.1.100 "systemctl restart pveproxy"

# Restart API daemon
ssh root@192.168.1.100 "systemctl restart pvedaemon"
```

---

## 2. Storage & Disk Space Issues

Storage exhaustion is a common cause of container freeze or PVE task failures.

### Diagnostic commands (Safe / Read-Only):
```bash
# Check filesystem utilization
ssh root@192.168.1.100 "df -h"

# Check Proxmox storage definitions and availability
ssh root@192.168.1.100 "pvesm status"

# Check ZFS pools (if applicable)
ssh root@192.168.1.100 "zpool status -x; zfs list"

# Check LVM / Thin pools (if applicable)
ssh root@192.168.1.100 "lvs; vgs"

# Find large files in /var/log or /tmp
ssh root@192.168.1.100 "du -sh /var/log/* | sort -hr | head -n 10"
```

### Remediation (Approval Required):
- Trimming journalctl:
  `ssh root@192.168.1.100 "journalctl --vacuum-time=7d"`
- Removing stale ISOs or templates from storage after approval.

---

## 3. Container Locking & Startup Issues

If a container shows `status: locked (backup)` or fails to start:

### Diagnostic commands (Safe / Read-Only):
```bash
# Check container configuration for locks
ssh root@192.168.1.100 "grep -i 'lock' /etc/pve/lxc/<vmid>.conf 2>/dev/null"

# Run debug start for container
ssh root@192.168.1.100 "pct start <vmid> --debug"
```

### Remediation (Approval Required):
```bash
# Unlock container (verify no running backup first!)
ssh root@192.168.1.100 "pct unlock <vmid>"
```

---

## 4. Network Connectivity Issues

### Diagnostic commands (Safe / Read-Only):
```bash
# Check interface states and IPs
ssh root@192.168.1.100 "ip -br a; ip r"

# Check bridge configuration
ssh root@192.168.1.100 "cat /etc/network/interfaces"

# Check DNS resolution
ssh root@192.168.1.100 "cat /etc/resolv.conf; getent hosts proxmox.com"
```

### Remediation (Approval Required):
Modifying `/etc/network/interfaces` carries a high risk of disconnection.
Always verify backup copy `/etc/network/interfaces.bak` exists before applying changes:
```bash
ssh root@192.168.1.100 "cp /etc/network/interfaces /etc/network/interfaces.bak.$(date +%F)"
ssh root@192.168.1.100 "ifreload -a"
```

