#!/usr/bin/env bash
# OS Context Discovery Script
# Gathers comprehensive OS and environment information.
# Output is structured with section headers for easy parsing.

set -euo pipefail

section() { printf '\n=== %s ===\n' "$1"; }

# Run probes with short timeouts so agent tool calls never hang.
timeout_ok() {
  local seconds="$1"
  shift
  if command -v timeout >/dev/null 2>&1; then
    timeout "$seconds" "$@" >/dev/null 2>&1
  else
    "$@" >/dev/null 2>&1
  fi
}

timeout_capture() {
  local seconds="$1"
  local fallback="$2"
  shift 2

  local output status
  if command -v timeout >/dev/null 2>&1; then
    set +e
    output="$(timeout "$seconds" "$@" 2>/dev/null)"
    status=$?
    set -e
  else
    set +e
    output="$("$@" 2>/dev/null)"
    status=$?
    set -e
  fi

  if [ "$status" -eq 124 ]; then
    printf '%s\n' "${fallback:-<timeout ${seconds}s>}"
    return 0
  fi

  if [ -z "$output" ]; then
    printf '%s\n' "$fallback"
    return 0
  fi

  printf '%s\n' "$output"
}

# --- OS & Kernel ---
section "OS & KERNEL"
if [ -f /etc/os-release ]; then
  . /etc/os-release
  printf 'Distro: %s\nVersion: %s\nID: %s\n' "${PRETTY_NAME:-unknown}" "${VERSION_ID:-unknown}" "${ID:-unknown}"
elif command -v sw_vers &>/dev/null; then
  printf 'Distro: macOS %s\nBuild: %s\n' "$(sw_vers -productVersion)" "$(sw_vers -buildVersion)"
else
  printf 'Distro: unknown\n'
fi
printf 'Kernel: %s\nArch: %s\nHostname: %s\n' "$(uname -r)" "$(uname -m)" "$(hostname 2>/dev/null || echo unknown)"

# --- Container / VM / WSL detection ---
section "VIRTUALIZATION"
if grep -qi microsoft /proc/version 2>/dev/null; then
  echo "Environment: WSL"
  wsl_version="$(timeout_capture 3 "unable to query" wsl.exe -l -v | tr -d '\0' | head -5)"
  printf 'WSL details: %s\n' "$wsl_version"
elif [ -f /.dockerenv ]; then
  echo "Environment: Docker container"
elif systemd-detect-virt &>/dev/null 2>&1; then
  printf 'Virtualization: %s\n' "$(systemd-detect-virt 2>/dev/null || echo none)"
else
  echo "Environment: bare metal or unknown"
fi

# --- Shell ---
section "SHELL"
printf 'Default shell: %s\n' "${SHELL:-unknown}"
timeout_capture 2 "Shell version: unknown" "$SHELL" --version | head -1

# --- Init system ---
section "INIT SYSTEM"
if command -v systemctl &>/dev/null && timeout_ok 2 systemctl --version; then
  echo "Init: systemd"
  timeout_capture 2 "systemd version unavailable" systemctl --version | head -1
elif command -v launchctl &>/dev/null; then
  echo "Init: launchd"
elif command -v openrc &>/dev/null; then
  echo "Init: OpenRC"
else
  echo "Init: unknown"
fi

# --- Package managers ---
section "PACKAGE MANAGERS"
for pm in apt dnf yum pacman zypper apk brew nix port; do
  command -v "$pm" &>/dev/null && printf '  %s: %s\n' "$pm" "$(command -v "$pm")"
done

# --- Language runtimes ---
section "RUNTIMES"
for cmd in node python3 python go rustc java ruby php dotnet; do
  if command -v "$cmd" &>/dev/null; then
    ver="$(timeout_capture 2 "unknown" "$cmd" --version | head -1)"
    printf '  %s: %s (%s)\n' "$cmd" "$ver" "$(command -v "$cmd")"
  fi
done

# --- Language package managers ---
section "LANGUAGE PACKAGE MANAGERS"
for cmd in npm pnpm yarn bun pip pip3 cargo gem composer; do
  if command -v "$cmd" &>/dev/null; then
    raw_ver="$(timeout_capture 3 "unknown" "$cmd" --version)"
    ver="$(printf '%s\n' "$raw_ver" | grep -iE '^[0-9]|version' | head -1 || true)"
    [ -z "$ver" ] && ver="$(printf '%s\n' "$raw_ver" | tail -1)"
    printf '  %s: %s (%s)\n' "$cmd" "$ver" "$(command -v "$cmd")"
  fi
done

# --- CPU ---
section "CPU"
if [ -f /proc/cpuinfo ]; then
  model=$(grep -m1 'model name' /proc/cpuinfo 2>/dev/null | cut -d: -f2 | xargs)
  cores=$(nproc 2>/dev/null || grep -c ^processor /proc/cpuinfo 2>/dev/null || echo unknown)
  printf 'Model: %s\nCores: %s\n' "${model:-unknown}" "$cores"
elif command -v sysctl &>/dev/null; then
  printf 'Model: %s\nCores: %s\n' \
    "$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo unknown)" \
    "$(sysctl -n hw.ncpu 2>/dev/null || echo unknown)"
fi

# --- Memory ---
section "MEMORY"
if command -v free &>/dev/null; then
  free -h 2>/dev/null | head -2
elif command -v sysctl &>/dev/null; then
  printf 'Total: %s bytes\n' "$(sysctl -n hw.memsize 2>/dev/null || echo unknown)"
fi

# --- Disk ---
section "DISK"
df -h / 2>/dev/null | head -2

# --- GPU ---
section "GPU"
if command -v nvidia-smi &>/dev/null; then
  timeout_capture 3 "nvidia-smi present but query failed" nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv,noheader
elif command -v lspci &>/dev/null; then
  lspci 2>/dev/null | grep -i 'vga\|3d\|display' || echo "No GPU detected via lspci"
else
  echo "No GPU detection tools available"
fi

# --- Network ---
section "NETWORK"
printf 'Hostname: %s\n' "$(hostname 2>/dev/null || echo unknown)"
if command -v ip &>/dev/null; then
  timeout_capture 2 "" ip -brief addr || true
elif command -v ifconfig &>/dev/null; then
  timeout_capture 2 "" ifconfig | grep -E 'inet |flags' || true
fi
printf '\nDNS:\n'
grep -v '^#' /etc/resolv.conf 2>/dev/null | grep -v '^$' || echo "  unable to read resolv.conf"

# --- Listening ports ---
section "LISTENING PORTS"
if command -v ss &>/dev/null; then
  timeout_capture 2 "" ss -tlnp | head -20
elif command -v netstat &>/dev/null; then
  timeout_capture 2 "" netstat -tlnp | head -20
else
  echo "No port scanning tools available"
fi

# --- Running services (top processes) ---
section "RUNNING SERVICES"
if command -v systemctl &>/dev/null && timeout_ok 2 systemctl list-units; then
  timeout_capture 4 "" systemctl list-units --type=service --state=running --no-pager | head -25
else
  ps aux 2>/dev/null | head -20 || echo "Unable to list processes"
fi

# --- Docker ---
section "DOCKER"
if command -v docker &>/dev/null; then
  printf 'Docker: %s\n' "$(timeout_capture 2 "unavailable" docker --version)"
  timeout_capture 4 "Docker present but cannot list containers" docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | head -15
  if command -v docker-compose &>/dev/null || timeout_ok 2 docker compose version; then
    timeout_capture 3 "" docker compose version || timeout_capture 3 "" docker-compose --version
  fi
else
  echo "Docker not installed"
fi

# --- Key paths ---
section "KEY PATHS"
printf 'HOME: %s\n' "${HOME:-unknown}"
printf 'PWD: %s\n' "${PWD:-unknown}"
printf 'TMPDIR: %s\n' "${TMPDIR:-${TMP:-/tmp}}"
printf 'PATH:\n'
echo "$PATH" | tr ':' '\n' | sed 's/^/  /'

# --- Environment variables (redact secrets) ---
section "ENVIRONMENT VARIABLES"
env 2>/dev/null | sort | while IFS='=' read -r key value; do
  # Redact likely secrets
  if echo "$key" | grep -qiE 'secret|password|token|key|credential|auth|api_key|private'; then
    printf '%s=<REDACTED>\n' "$key"
  else
    printf '%s=%s\n' "$key" "$value"
  fi
done

section "DISCOVERY COMPLETE"
