# Proxmox LXC Container Management Runbook

Reference guide for managing LXC containers on Proxmox VE (PVE v9.1.9) via `pct`.

All commands are run over SSH to `root@192.168.1.100`.

---

## 1. Discovery and Inspection (Safe / Read-Only)

```bash
# List all containers with status, VMID, name
ssh root@192.168.1.100 "pct list"

# Check status of specific container
ssh root@192.168.1.100 "pct status <vmid>"

# View configuration of container
ssh root@192.168.1.100 "pct config <vmid>"

# View current container CPU, memory, and network usage
ssh root@192.168.1.100 "pct cpus <vmid>; pct df <vmid>"

# Check snapshots of a container
ssh root@192.168.1.100 "pct listsnapshot <vmid>"
```

---

## 2. Container Lifecycle Operations (Approval Required)

Always request approval before starting, stopping, restarting, or destroying containers.

### Start / Stop / Restart
```bash
# Start container
ssh root@192.168.1.100 "pct start <vmid>"

# Graceful shutdown (sends SIGTERM / OS shutdown)
ssh root@192.168.1.100 "pct shutdown <vmid>"

# Force stop (immediate termination)
ssh root@192.168.1.100 "pct stop <vmid>"

# Reboot container
ssh root@192.168.1.100 "pct reboot <vmid>"
```

### Snapshots (Recommended before any major inside changes)
```bash
# Create snapshot
ssh root@192.168.1.100 "pct snapshot <vmid> snap_$(date +%Y%m%d_%H%M%S) --description 'Pre-change snapshot'"

# Rollback snapshot
ssh root@192.168.1.100 "pct rollback <vmid> <snapshot_name>"

# Delete snapshot
ssh root@192.168.1.100 "pct delsnapshot <vmid> <snapshot_name>"
```

---

## 3. Container Configuration and Resource Tuning (Approval Required)

```bash
# Adjust RAM (e.g. 2048 MB) and Swap (512 MB)
ssh root@192.168.1.100 "pct set <vmid> -memory 2048 -swap 512"

# Adjust CPU cores
ssh root@192.168.1.100 "pct set <vmid> -cores 2"

# Resize root disk (e.g., +10G)
ssh root@192.168.1.100 "pct resize <vmid> rootfs +10G"

# Set auto-start on boot with start order
ssh root@192.168.1.100 "pct set <vmid> -onboot 1 -order 1"
```

---

## 4. Executing Commands inside Containers

```bash
# Non-destructive / Diagnostic inside container:
ssh root@192.168.1.100 "pct exec <vmid> -- uname -a"
ssh root@192.168.1.100 "pct exec <vmid> -- df -h"
ssh root@192.168.1.100 "pct exec <vmid> -- systemctl status nginx"

# Mutating commands inside container (Requires Approval):
ssh root@192.168.1.100 "pct exec <vmid> -- apt update && apt upgrade -y"
ssh root@192.168.1.100 "pct exec <vmid> -- systemctl restart nginx"
```

---

## 5. Container Creation and Templates

```bash
# List available appliance templates on storage
ssh root@192.168.1.100 "pveam list local"

# Update appliance template catalog (Read-only download catalog)
ssh root@192.168.1.100 "pveam update"

# Download template (Approval Required)
ssh root@192.168.1.100 "pveam download local debian-12-standard_12.7-1_amd64.tar.zst"

# Create container (Approval Required)
ssh root@192.168.1.100 "pct create <vmid> local:vztmpl/debian-12-standard_12.7-1_amd64.tar.zst --cores 2 --memory 2048 --net0 name=eth0,bridge=vmbr0,ip=dhcp --storage local-lvm"
```

