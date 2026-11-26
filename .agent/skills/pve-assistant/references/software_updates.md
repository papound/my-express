# Proxmox Software Updates & Maintenance Runbook

Procedures for inspecting and applying updates on Proxmox VE (PVE v9.1.9) at `192.168.1.100`.

---

## 1. Checking Repositories and Updates (Safe / Read-Only)

Before updating, verify configured repositories and available packages without applying changes:

```bash
# Check current Proxmox version and packages
ssh root@192.168.1.100 "pveversion -v"

# Check kernel version
ssh root@192.168.1.100 "uname -r"

# Check apt sources
ssh root@192.168.1.100 "cat /etc/apt/sources.list /etc/apt/sources.list.d/*.list 2>/dev/null"

# Fetch list of upgradable packages (Requires apt update first; if apt update has been run recently)
ssh root@192.168.1.100 "apt list --upgradable"
```

### Proxmox Repository Best Practices:
Ensure that if a subscription is not active, the `pve-enterprise` repository is commented out and `pve-no-subscription` is enabled to avoid `401 Unauthorized` errors during apt update.

Example `/etc/apt/sources.list.d/pve-no-subscription.list`:
```text
deb http://download.proxmox.com/debian/pve bookworm pve-no-subscription
```
*(or trixie for Debian 13 based releases)*

---

## 2. Performing Software Updates (Approval Required)

Updating the host can install new kernels or restart core hypervisor services.

### Update Workflow:

1. **Step 1: Refresh package index**
   ```bash
   ssh root@192.168.1.100 "apt update"
   ```
2. **Step 2: Inspect upgradable list**
   ```bash
   ssh root@192.168.1.100 "apt list --upgradable"
   ```
3. **Step 3: Analyze changes & request approval**
   - Identify whether core PVE packages (e.g. `pve-manager`, `qemu-server`, `pve-cluster`, `proxmox-kernel-*`) or system libraries are being updated.
   - Note if a reboot will be needed (due to kernel update).
   - Present proposal to user and await explicit approval.
4. **Step 4: Execute upgrade (after approval)**
   ```bash
   ssh root@192.168.1.100 "apt-get dist-upgrade -y"
   ```
   *(Note: Use `dist-upgrade` as per official Proxmox recommendations to properly resolve kernel and dependency transitions.)*
5. **Step 5: Post-upgrade verification**
   ```bash
   ssh root@192.168.1.100 "pveversion -v"
   ssh root@192.168.1.100 "systemctl status pveproxy pvedaemon pvestatd"
   ```
6. **Step 6: Reboot check (if kernel updated)**
   - Check if `/var/run/reboot-required` exists:
     ```bash
     ssh root@192.168.1.100 "[ -f /var/run/reboot-required ] && echo 'Reboot required' || echo 'No reboot needed'"
     ```
   - If reboot is needed, explain to the user that all running containers will be restarted or need shutdown, and ask for explicit approval before rebooting.

