#!/usr/bin/env sh
set -eu

repo="B-Divyesh/sf-scan-repair-local"
base="https://github.com/$repo/releases/latest/download"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

os="$(uname -s)"
manifest="$(curl -fsSL "$base/latest.json" | tr -d '\r\n')"
case "$os" in
  Linux) platform=linux ;;
  Darwin) platform=macos ;;
  *) echo "Unsupported OS: $os" >&2; exit 1 ;;
esac
asset="$(printf '%s' "$manifest" | sed -n "s/.*\"$platform\"[^}]*\"url\"[[:space:]]*:[[:space:]]*\"[^\"]*\/\([^\"]*\)\".*/\1/p")"
[ -n "$asset" ] || { echo "No release asset for this platform" >&2; exit 1; }

curl -fsSL "$base/SHA256SUMS" -o "$tmp/SHA256SUMS"
curl -fL "$base/$asset" -o "$tmp/$asset"
grep " $asset$" "$tmp/SHA256SUMS" | (cd "$tmp" && sha256sum -c -)

if [ "$os" = Linux ]; then
  destination="${SCAN_REPAIR_INSTALL_DIR:-$HOME/.local/bin}"
  install -d "$destination"
  install -m 755 "$tmp/$asset" "$destination/scan-repair-local"
  echo "Installed to $destination/scan-repair-local (SHA256 verified)."
else
  volume="$(hdiutil attach "$tmp/$asset" -nobrowse | awk 'END {print $3}')"
  install -d "$HOME/Applications"
  cp -R "$volume"/*.app "$HOME/Applications/"
  hdiutil detach "$volume" -quiet
  echo "Installed Scan Repair Local in ~/Applications (SHA256 verified)."
fi
