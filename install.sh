#!/usr/bin/env bash
set -euo pipefail

main() {
	local requested_version="${1:-}"
	local github_base="${GITHUB_BASE:-https://github.com}"
	local repo="${ASSINAFY_REPO:-assinafy/assinafy-cli}"
	local install_dir="${ASSINAFY_INSTALL:-$HOME/.assinafy}"
	local bin_dir="$install_dir/bin"
	local tmp_dir
	tmp_dir="$(mktemp -d)"
	trap 'rm -rf "$tmp_dir"' EXIT

	setup_colors
	check_prerequisites
	validate_github_base "$github_base"

	local target archive_url archive extract_dir executable installed_version
	target="$(detect_target)"
	archive_url="$(release_url "$github_base" "$repo" "$requested_version" "$target")"
	archive="$tmp_dir/assinafy.tar.gz"
	extract_dir="$tmp_dir/extract"
	executable="$bin_dir/assinafy"

	info "Downloading Assinafy CLI for $target"
	curl -fsSL "$archive_url" -o "$archive"

	mkdir -p "$extract_dir" "$bin_dir" "$install_dir"
	tar -xzf "$archive" -C "$extract_dir"

	if [ ! -f "$extract_dir/assinafy" ]; then
		fail "Release archive did not contain the assinafy executable"
	fi

	cp "$extract_dir/assinafy" "$executable"
	chmod 755 "$executable"

	if [ -f "$extract_dir/README.md" ]; then cp "$extract_dir/README.md" "$install_dir/README.md"; fi
	if [ -f "$extract_dir/LICENSE" ]; then cp "$extract_dir/LICENSE" "$install_dir/LICENSE"; fi
	if [ -f "$extract_dir/VERSION" ]; then cp "$extract_dir/VERSION" "$install_dir/VERSION"; fi

	if command -v xattr >/dev/null 2>&1; then
		xattr -d com.apple.quarantine "$executable" >/dev/null 2>&1 || true
	fi

	installed_version="$("$executable" --version 2>/dev/null || true)"
	if [ -z "$installed_version" ]; then
		fail "Installed executable did not run. Confirm Node.js 22+ is available on PATH."
	fi

	ensure_path "$bin_dir"
	success "Installed $installed_version to $executable"

	if ! path_has "$bin_dir"; then
		warn "$bin_dir is not on PATH in this shell. Open a new shell or run:"
		printf '  export PATH="%s:$PATH"\n' "$bin_dir"
	fi
}

setup_colors() {
	if [ -t 1 ]; then
		red="$(printf '\033[31m')"
		green="$(printf '\033[32m')"
		yellow="$(printf '\033[33m')"
		blue="$(printf '\033[34m')"
		bold="$(printf '\033[1m')"
		reset="$(printf '\033[0m')"
	else
		red=""
		green=""
		yellow=""
		blue=""
		bold=""
		reset=""
	fi
}

info() {
	printf '%s==>%s %s\n' "$blue" "$reset" "$1"
}

warn() {
	printf '%sWarning:%s %s\n' "$yellow" "$reset" "$1"
}

success() {
	printf '%sSuccess:%s %s\n' "$green" "$reset" "$1"
}

fail() {
	printf '%sError:%s %s\n' "$red" "$reset" "$1" >&2
	exit 1
}

need_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		fail "Required command not found: $1"
	fi
}

check_prerequisites() {
	need_cmd curl
	need_cmd tar
	need_cmd node

	local node_major
	node_major="$(node -p "Number(process.versions.node.split('.')[0])" 2>/dev/null || echo 0)"
	if [ "$node_major" -lt 22 ]; then
		fail "Node.js 22+ is required. Found: $(node --version 2>/dev/null || echo unknown)"
	fi
}

validate_github_base() {
	case "$1" in
		https://*) ;;
		*) fail "GITHUB_BASE must start with https://" ;;
	esac
}

detect_target() {
	local os arch
	case "$(uname -s)" in
		Darwin) os="darwin" ;;
		Linux) os="linux" ;;
		*) fail "Unsupported operating system: $(uname -s)" ;;
	esac

	case "$(uname -m)" in
		arm64 | aarch64) arch="arm64" ;;
		x86_64 | amd64) arch="x64" ;;
		*) fail "Unsupported CPU architecture: $(uname -m)" ;;
	esac

	printf '%s-%s' "$os" "$arch"
}

release_url() {
	local github_base="$1"
	local repo="$2"
	local requested_version="$3"
	local target="$4"
	local base
	base="${github_base%/}/${repo}"

	if [ -z "$requested_version" ]; then
		printf '%s/releases/latest/download/assinafy-%s.tar.gz' "$base" "$target"
		return
	fi

	requested_version="${requested_version#v}"
	if ! [[ "$requested_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]; then
		fail "Version must be a semantic version, for example v1.0.0"
	fi

	printf '%s/releases/download/v%s/assinafy-%s.tar.gz' "$base" "$requested_version" "$target"
}

path_has() {
	case ":${PATH:-}:" in
		*":$1:"*) return 0 ;;
		*) return 1 ;;
	esac
}

append_once() {
	local file="$1"
	local text="$2"
	mkdir -p "$(dirname "$file")"
	touch "$file"
	if ! grep -F "$text" "$file" >/dev/null 2>&1; then
		printf '\n%s\n' "$text" >>"$file"
	fi
}

ensure_path() {
	local bin_dir="$1"
	if [ "${ASSINAFY_NO_PATH_UPDATE:-}" = "1" ] || path_has "$bin_dir"; then
		return
	fi

	case "$(basename "${SHELL:-}")" in
		fish)
			append_once "$HOME/.config/fish/config.fish" "fish_add_path \"$bin_dir\" # Assinafy CLI"
			;;
		zsh)
			append_once "$HOME/.zshrc" "export PATH=\"$bin_dir:\$PATH\" # Assinafy CLI"
			;;
		bash)
			append_once "$HOME/.bashrc" "export PATH=\"$bin_dir:\$PATH\" # Assinafy CLI"
			;;
		*)
			warn "Add $bin_dir to PATH to run assinafy from any directory."
			;;
	esac
}

main "$@"
