#!/usr/bin/env bash
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
pins="$root/nix/pins.json"

meta="$(curl -fsSL https://registry.npmjs.org/@inkeep/open-knowledge/latest)"
version="$(jq -r .version <<<"$meta")"
tarball="$(jq -r .dist.tarball <<<"$meta")"
current="$(jq -r .version "$pins")"

if [ "$version" = "$current" ]; then
  echo "up to date: $version"
  exit 0
fi

hash="$(nix store prefetch-file --json --hash-type sha256 "$tarball" | jq -r .hash)"
tmp="$(mktemp "$pins.XXXXXX")"
jq -n --arg version "$version" --arg tarball "$tarball" --arg hash "$hash" \
  '{version: $version, tarball: $tarball, hash: $hash}' > "$tmp"
mv "$tmp" "$pins"

echo "updated $current -> $version"
