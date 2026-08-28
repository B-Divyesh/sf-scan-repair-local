#!/usr/bin/env sh
set -eu
repo="B-Divyesh/sf-scan-repair-local"; base="https://github.com/$repo/releases/latest/download"
tmp="$(mktemp -d)"; trap 'rm -rf "$tmp"' EXIT
os="$(uname -s)"
manifest="$(curl -fsSL "$base/latest.json")"
case "$os" in Linux) asset="$(printf '%s' "$manifest" | sed -n 's/.*"linux"[^}]*"url":"[^"]*\/\([^\"]*\)".*/\1/p')";; Darwin) asset="$(printf '%s' "$manifest" | sed -n 's/.*"macos"[^}]*"url":"[^"]*\/\([^\"]*\)".*/\1/p')";; *) echo "Unsupported OS: $os" >&2; exit 1;; esac
[ -n "$asset" ] || { echo "No release asset for this platform" >&2; exit 1; }
curl -fsSL "$base/SHA256SUMS" -o "$tmp/SHA256SUMS"; curl -fL "$base/$asset" -o "$tmp/$asset"
grep " $asset$" "$tmp/SHA256SUMS" | (cd "$tmp" && sha256sum -c -)
if [ "$os" = Linux ]; then install -d "$HOME/.local/bin"; install -m 755 "$tmp/$asset" "$HOME/.local/bin/scan-repair-local"; echo "Installed to $HOME/.local/bin/scan-repair-local (SHA256 verified)."; else volume="$(hdiutil attach "$tmp/$asset" -nobrowse | awk 'END {print $3}')"; install -d "$HOME/Applications"; cp -R "$volume"/*.app "$HOME/Applications/"; hdiutil detach "$volume" -quiet; echo "Installed Scan Repair Local in ~/Applications (SHA256 verified)."; fi
