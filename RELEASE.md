# Releasing Pocket-desk

Targets: **macOS `.dmg`**, **Windows `.exe`** (NSIS installer), **Linux `.AppImage`** and **`.deb`**.

No single machine can build all of them: `.dmg` requires a real macOS host, while the
Windows and Linux targets build cleanly inside the official electron-builder Docker image
(it bundles Wine + the Linux packaging tools). So the release is done in two passes from
your Mac.

Output goes to `./dist/`.

## Prerequisites

- Node deps installed: `npm install`
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) running (for the Windows + Linux pass)
- App icons already generated in `build/` (`icon.icns`, `icon.ico`, `icon.png`)

## 1. macOS `.dmg` — native, on your Mac

```bash
npm run dist:mac
```

Produces `dist/Pocket-desk-<version>-arm64.dmg` and `dist/Pocket-desk-<version>-x64.dmg`
(both architectures are configured in `package.json`).

> Code signing/notarization is not configured. The `.dmg` is unsigned, so users will see
> Gatekeeper warnings. Add an Apple Developer certificate later if you want signed builds.

## 2. Windows `.exe` + Linux `.deb`/`.AppImage` — via Docker

```bash
./scripts/build-cross.sh
```

This runs `electronuserland/builder:wine` and executes `npm run dist:win` and
`npm run dist:linux` inside the container. It produces:

- `dist/Pocket-desk-Setup-<version>.exe`
- `dist/Pocket-desk-<version>.AppImage`
- `dist/pocket-desk_<version>_amd64.deb`

On Apple Silicon the container runs under emulation (`--platform linux/amd64`), so the
first build is slower; Electron downloads are cached in `~/.cache` between runs.

## All-in-one (per platform)

If you prefer to drive electron-builder directly:

```bash
npm run dist:mac      # .dmg            (macOS only)
npm run dist:win      # .exe            (needs Wine — use Docker or `brew install --cask wine-stable`)
npm run dist:linux    # .AppImage + .deb (needs Linux tooling — use Docker)
npm run dist          # current platform's targets
```

## Automated releases via GitHub Actions (recommended)

`.github/workflows/release.yml` builds all four artifacts in one shot on native runners
(`macos-latest` → `.dmg`, `windows-latest` → `.exe`, `ubuntu-latest` → `.AppImage` + `.deb`)
and uploads them to a **draft** GitHub Release. No Docker or local toolchain needed.

Trigger it by pushing a version tag:

```bash
# bump "version" in package.json first, then:
git tag v0.1.0
git push origin v0.1.0
```

Or run it manually from the repo's **Actions → Release → Run workflow**.

When it finishes, go to **Releases**, review the draft, and publish it. Authentication
uses the built-in `GITHUB_TOKEN` — no secrets to configure. Builds are still unsigned
(see note above); add signing certificates as repository secrets when you're ready.
