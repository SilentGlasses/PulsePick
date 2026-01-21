# Contributing to PulsePick

Thank you for your interest in contributing to PulsePick.

PulsePick is intentionally minimal. Contributions should respect the project’s core goals: simplicity, maintainability, and security.

## Scope and Philosophy

PulsePick focuses on:

- Audio input/output device selection
- Port switching
- Integration with GNOME Quick Settings

The following are intentionally out of scope:

- Per-application audio routing
- Advanced audio profiles or effects
- Legacy GNOME Shell support

Proposed changes should align with these boundaries.

## Supported Environment

- GNOME Shell 46+
- GJS only (no Python or external helpers)
- PipeWire via GNOME’s mixer APIs

Compatibility code for older GNOME versions will not be accepted.

## Code Style Guidelines

- Prefer clarity over cleverness
- Avoid polling; use signals and notifications
- No shell commands or subprocesses
- No dynamic imports or runtime code generation
- Keep UI strings translatable (`gettext`)

If a feature requires significant complexity, open an issue before implementing it.

## Translations

Translations use gettext (`.po` files).

To add a new language:

1. Create a new `.po` file under `locale/<lang>/LC_MESSAGES/`
2. Do not hardcode translated strings
3. No code changes should be required

## Submitting Changes

- Fork the repository
- Create a focused branch per change
- Keep commits small and descriptive
- Clearly explain *why* a change is needed, not just *what* it does

Pull requests that increase complexity without clear benefit may be declined.

## Triggering a Release

The workflow runs when you push a tag starting with v:

1. Make sure your changes are committed
```
git add .
git commit -m "Prepare for v1.0.0 release"
```
2. Create and push a version tag
```
git tag v1.0.0
git push origin main
git push origin v1.0.0
```

## Version Naming

Use semantic versioning tags:

- `v1.0.0` - Initial stable release
- `v1.1.0` - New features
- `v1.0.1` - Bug fixes

## Code of Conduct

Be respectful and constructive. This is a small project maintained with limited scope and time.

Thank you for helping keep PulsePick clean and reliable.
