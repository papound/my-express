# PVE Assistant Approval Protocol & Safety Policy

This document defines the strict operational boundaries when managing Proxmox VE (PVE v9.1.9) at `192.168.1.100`.

---

## 1. Safety Principles

1. **Explicit Consent**: Antigravity must never execute a command that alters system state, network topology, package versions, or service availability without unambiguous user approval.
2. **Transparent Disclosure**: All proposed changes must detail the root cause, exact syntax, expected behavior, potential side effects, and recovery steps.
3. **Dry-Run & Inspection First**: Prioritize non-destructive commands to gather evidence before formulating an action plan.
4. **Idempotence & Precision**: Prefer scoped commands targeting specific containers or services rather than broad sweeping scripts.

---

## 2. Command Categorization Matrix

| Category | Typical Commands | Approval Required? | Notes |
| :--- | :--- | :---: | :--- |
| **Diagnostics & Health** | `pct list`, `pct status <id>`, `pct config <id>`, `pvesm status`, `df -h`, `free -m`, `uname -a`, `pveversion -v` | ❌ No | Can be executed immediately to inspect host and container state. |
| **Log Inspection** | `journalctl -u <svc> -n 50`, `tail -n 100 /var/log/syslog`, `dmesg \| tail` | ❌ No | Read-only inspection. |
| **Package Inspection** | `apt list --upgradable`, `dpkg -l \| grep ...` | ❌ No | Queries only, does not alter package status. |
| **Container Lifecycle** | `pct start`, `pct stop`, `pct restart`, `pct reboot` | ✅ **YES** | May interrupt active workloads or cause service downtime. |
| **Container Destructive** | `pct destroy`, `pct delete`, `pct clone`, `pct restore` | ✅ **YES** | Permanent or disruptive data operations. Must require snapshot verification. |
| **Container Mutation** | `pct set <id> -memory ...`, `pct resize ...`, `pct exec <id> -- <cmd>` | ✅ **YES** | Reallocates resources or executes changes inside container environment. |
| **Package Upgrades** | `apt update`, `apt upgrade`, `apt dist-upgrade`, `apt install`, `apt remove` | ✅ **YES** | Installs or modifies libraries, packages, or kernel on the host. |
| **System Services** | `systemctl restart/reload/stop pveproxy`, `systemctl ...` | ✅ **YES** | Can temporarily drop web UI, API, or clustering daemons. |
| **Configuration Edits** | Editing `/etc/pve/*`, `/etc/network/interfaces`, `/etc/fstab`, etc. | ✅ **YES** | Risk of host unreachability or cluster disruption. |
| **Host Power Management** | `reboot`, `shutdown`, `poweroff` | ✅ **YES** | Complete system downtime. |

---

## 3. Approval Request Workflow

When a mutating action is deemed necessary:

1. **Step 1: Gather Context (Read-Only)**
   - Run safe diagnostic queries to inspect current parameters.
2. **Step 2: Formulate Proposal**
   - Identify the exact command, target ID, and dependencies.
3. **Step 3: Present Proposal to User**
   - Provide the explanation in Thai (or user's preferred language).
   - Format cleanly with target, reason, commands, risks, and rollback instructions.
4. **Step 4: Stop and Wait**
   - Complete the turn without running any mutating commands.
   - Wait for the user to reply with explicit authorization (e.g., "approve", "ดำเนินการได้เลย", "ตกลง").
5. **Step 5: Execution & Verification**
   - Once approved, execute the command via SSH.
   - Run a subsequent read-only verification command to confirm success (e.g., `pct status <id>`, `systemctl status <svc>`).
   - Report the final outcome to the user.

