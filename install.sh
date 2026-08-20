#!/usr/bin/env bash
set -euo pipefail

assinafy_tmp_dir=""
assinafy_replacement=""

cleanup() {
	if [ -n "$assinafy_replacement" ]; then
		rm -f "$assinafy_replacement"
	fi
	if [ -n "$assinafy_tmp_dir" ]; then
		rm -rf "$assinafy_tmp_dir"
	fi
}

main() {
	local requested_version="${1:-}"
	local github_base="${GITHUB_BASE:-https://github.com}"
	local repo="${ASSINAFY_REPO:-assinafy/assinafy-cli}"
	local install_dir="${ASSINAFY_INSTALL:-$HOME/.assinafy}"
	local bin_dir="$install_dir/bin"
	assinafy_tmp_dir="$(mktemp -d)"
	trap cleanup EXIT

	setup_colors
	check_prerequisites
	validate_github_base "$github_base"

	local target archive_url checksums_url archive checksums_file extract_dir executable staged_executable installed_version archive_version
	target="$(detect_target)"
	archive_url="$(release_url "$github_base" "$repo" "$requested_version" "$target")"
	checksums_url="$(checksums_release_url "$github_base" "$repo" "$requested_version")"
	archive="$assinafy_tmp_dir/assinafy.tar.gz"
	checksums_file="$assinafy_tmp_dir/SHA256SUMS"
	extract_dir="$assinafy_tmp_dir/extract"
	executable="$bin_dir/assinafy"
	staged_executable="$extract_dir/assinafy"

	info "Downloading Assinafy CLI for $target"
	curl -fsSL "$archive_url" -o "$archive"

	info "Verifying checksum"
	curl -fsSL "$checksums_url" -o "$checksums_file"
	verify_checksum "$archive" "$checksums_file" "assinafy-$target.tar.gz"
	validate_archive "$archive" "$target"

	mkdir -p "$extract_dir"
	tar -xzf "$archive" -C "$extract_dir"
	if [ -n "$(find "$extract_dir" ! -type d ! -type f -print -quit)" ]; then
		fail "Release archive contained a link or special file"
	fi

	if [ ! -f "$staged_executable" ]; then
		fail "Release archive did not contain the assinafy executable"
	fi
	if [ ! -f "$extract_dir/VERSION" ]; then
		fail "Release archive did not contain VERSION"
	fi
	archive_version="$(<"$extract_dir/VERSION")"
	if ! [[ "$archive_version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$ ]]; then
		fail "Release archive contained an invalid VERSION"
	fi
	if [ -n "$requested_version" ] && [ "$archive_version" != "${requested_version#v}" ]; then
		fail "Release archive version $archive_version does not match requested version ${requested_version#v}"
	fi

	chmod 755 "$staged_executable"
	if command -v xattr >/dev/null 2>&1; then
		xattr -d com.apple.quarantine "$staged_executable" >/dev/null 2>&1 || true
	fi

	if ! installed_version="$("$staged_executable" --version 2>/dev/null)" || [ -z "$installed_version" ]; then
		fail "Installed executable did not run. Confirm Node.js 22.12+ is available on PATH."
	fi
	if [ "$installed_version" != "@assinafy/cli v$archive_version" ]; then
		fail "Executable version does not match archive VERSION: $installed_version"
	fi

	mkdir -p "$bin_dir" "$install_dir"
	assinafy_replacement="$(mktemp "$bin_dir/.assinafy.XXXXXX")"
	cp "$staged_executable" "$assinafy_replacement"
	chmod 755 "$assinafy_replacement"
	mv -f "$assinafy_replacement" "$executable"
	assinafy_replacement=""

	if [ -f "$extract_dir/README.md" ]; then cp "$extract_dir/README.md" "$install_dir/README.md"; fi
	if [ -f "$extract_dir/LICENSE" ]; then cp "$extract_dir/LICENSE" "$install_dir/LICENSE"; fi
	if [ -f "$extract_dir/THIRD_PARTY_NOTICES.md" ]; then cp "$extract_dir/THIRD_PARTY_NOTICES.md" "$install_dir/THIRD_PARTY_NOTICES.md"; fi
	if [ -f "$extract_dir/VERSION" ]; then cp "$extract_dir/VERSION" "$install_dir/VERSION"; fi

	ensure_path "$bin_dir"
	success "Installed $installed_version to $executable"

	if ! path_has "$bin_dir"; then
		warn "$bin_dir is not on PATH in this shell. Open a new shell or run:"
		printf '  export PATH="%s:%s"\n' "$bin_dir" "\$PATH"
	fi
}

setup_colors() {
	if [ -t 1 ]; then
		red="$(printf '\033[31m')"
		green="$(printf '\033[32m')"
		yellow="$(printf '\033[33m')"
		blue="$(printf '\033[34m')"
		reset="$(printf '\033[0m')"
	else
		red=""
		green=""
		yellow=""
		blue=""
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

	local node_supported
	node_supported="$(node -p "const [major, minor] = process.versions.node.split('.').map(Number); major > 22 || (major === 22 && minor >= 12)" 2>/dev/null || echo false)"
	if [ "$node_supported" != "true" ]; then
		fail "Node.js 22.12+ is required. Found: $(node --version 2>/dev/null || echo unknown)"
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

checksums_release_url() {
	local github_base="$1"
	local repo="$2"
	local requested_version="$3"
	local base
	base="${github_base%/}/${repo}"

	if [ -z "$requested_version" ]; then
		printf '%s/releases/latest/download/SHA256SUMS' "$base"
		return
	fi

	printf '%s/releases/download/v%s/SHA256SUMS' "$base" "${requested_version#v}"
}

# Verify $archive's SHA-256 against the line for $expected_name in $checksums_file.
verify_checksum() {
	local archive="$1"
	local checksums_file="$2"
	local expected_name="$3"
	local expected_hash actual_hash

	if ! expected_hash="$(awk -v name="$expected_name" '
		$2 == name && NF == 2 { count++; hash = $1 }
		END { if (count == 1) print hash; else exit 1 }
	' "$checksums_file")"; then
		fail "SHA256SUMS did not contain an entry for $expected_name"
	fi
	if ! [[ "$expected_hash" =~ ^[[:xdigit:]]{64}$ ]]; then
		fail "SHA256SUMS contained an invalid hash for $expected_name"
	fi
	expected_hash="$(printf '%s\n' "$expected_hash" | tr '[:upper:]' '[:lower:]')"

	if command -v shasum >/dev/null 2>&1; then
		actual_hash="$(shasum -a 256 "$archive" | awk '{print $1}')"
	elif command -v sha256sum >/dev/null 2>&1; then
		actual_hash="$(sha256sum "$archive" | awk '{print $1}')"
	else
		fail "Required command not found: shasum or sha256sum"
	fi

	if [ "$actual_hash" != "$expected_hash" ]; then
		fail "Checksum mismatch for $expected_name: expected $expected_hash, got $actual_hash"
	fi
}

validate_archive() {
	local archive="$1"
	local target="$2"
	local entry expected executable_count=0 version_count=0
	if [[ "$target" == windows-* ]]; then
		expected='assinafy.cmd|assinafy.cjs'
	else
		expected='assinafy'
	fi

	while IFS= read -r entry; do
		case "$entry" in
			'' | /* | ../* | */../* | */.. | *\\*) fail "Release archive contained an unsafe path" ;;
		esac
		if [[ "$entry" =~ [^[:print:]] ]]; then
			fail "Release archive contained a control character in a path"
		fi
		case "$entry" in
			assinafy | assinafy.cmd | assinafy.cjs)
				if [[ "$entry" =~ ^($expected)$ ]]; then
					executable_count=$((executable_count + 1))
				else
					fail "Release archive contained an executable for the wrong platform"
				fi
				;;
			VERSION) version_count=$((version_count + 1)) ;;
			README.md | LICENSE | THIRD_PARTY_NOTICES.md | docs/*.md | docs/api-operations.json) ;;
			*) fail "Release archive contained an unexpected path: $entry" ;;
		esac
	done < <(tar -tzf "$archive")

	if [ "$version_count" -ne 1 ]; then
		fail "Release archive must contain exactly one VERSION file"
	fi
	if [[ "$target" == windows-* ]]; then
		if [ "$executable_count" -ne 2 ]; then
			fail "Release archive must contain both Windows executable files"
		fi
	elif [ "$executable_count" -ne 1 ]; then
		fail "Release archive must contain exactly one executable"
	fi
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
	local escaped_bin_dir
	if [ "${ASSINAFY_NO_PATH_UPDATE:-}" = "1" ] || path_has "$bin_dir"; then
		return
	fi
	if [[ "$bin_dir" =~ [^[:print:]] ]]; then
		warn "Install path contains control characters; add it to PATH manually."
		return
	fi
	printf -v escaped_bin_dir '%q' "$bin_dir"

	case "$(basename "${SHELL:-}")" in
		fish)
			append_once "$HOME/.config/fish/config.fish" "fish_add_path -- $escaped_bin_dir # Assinafy CLI"
			;;
		zsh)
			append_once "$HOME/.zshrc" "export PATH=$escaped_bin_dir:\$PATH # Assinafy CLI"
			;;
		bash)
			append_once "$HOME/.bashrc" "export PATH=$escaped_bin_dir:\$PATH # Assinafy CLI"
			;;
		*)
			warn "Add $bin_dir to PATH to run assinafy from any directory."
			;;
	esac
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
	main "$@"
fi
