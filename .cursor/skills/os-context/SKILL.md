---
name: os-context
description: Study the current OS environment to contextualize all subsequent actions. Gathers OS name, version, architecture, shell, package managers, installed runtimes, disk/memory, key paths, init system, environment variables, running services, network config, and hardware details. Use when the user asks to check the OS, when OS-specific commands or paths are needed, or when environment context matters for troubleshooting or setup.
---

# OS Context

The most important context is the OS you are running on. Before doing anything else, study it thoroughly.

## Instructions

1. Run the discovery script to gather all OS details at once:

```bash
bash ~/.cursor/skills/os-context/scripts/discover.sh
```

2. Parse the output and internalize the environment — adapt all commands, paths, and assumptions to match.

3. If specific sections need deeper investigation (e.g., a particular service, GPU details, container runtime), run targeted follow-up commands as needed.

## What to internalize

After running discovery, you should know:

| Category | Key facts |
|----------|-----------|
| **OS** | Distro, version, kernel, architecture |
| **Shell** | Default shell, version, config files |
| **Package managers** | System (apt/dnf/pacman/brew) and language-level (pip/npm/cargo/go) |
| **Runtimes** | Node, Python, Go, Rust, Java, Ruby — versions present |
| **System resources** | CPU cores/model, total/available RAM, disk usage |
| **Init system** | systemd / launchd / openrc / WSL |
| **Network** | Hostname, interfaces, DNS, listening ports |
| **Services** | Running daemons (docker, postgres, redis, nginx, etc.) |
| **Paths** | HOME, workspace, temp, common tool locations |
| **Environment** | All exported env vars (redact secrets) |
| **Container/VM** | Whether inside Docker, WSL, or a VM |

## Adapting behavior

- Use the correct package manager commands (no `apt` on macOS, no `brew` on Ubuntu).
- Use correct paths (`/home/` vs `/Users/`, `systemctl` vs `launchctl`).
- Account for WSL quirks if detected (e.g., Windows interop, `/mnt/c/`).
- Note available disk space before suggesting large installs.
- Note available memory before suggesting resource-heavy operations.
