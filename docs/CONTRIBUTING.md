# Contributing to BarangayOS

First off, thank you for considering contributing! This project helps Philippine Barangay LGUs manage their records digitally, and every contribution makes a difference.

## Code of Conduct

This project adheres to a simple standard: **be respectful and constructive**. We welcome contributors of all skill levels and backgrounds.

## How Can I Contribute?

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/YOUR_USER/barangayos/issues)
2. If not, create a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected vs actual behavior
   - Screenshots (if applicable)
   - Browser and environment details

### Suggesting Features

1. Open a [new issue](https://github.com/YOUR_USER/barangayos/issues/new)
2. Describe:
   - The problem you're trying to solve
   - Your proposed solution
   - Any alternatives you've considered
   - Why this would benefit barangay LGUs

### Code Contributions

#### Getting Started

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/YOUR_USERNAME/barangayos.git
cd barangayos
```

3. Set up the development environment (see [DEVELOPMENT.md](DEVELOPMENT.md))
4. Create a branch:

```bash
git checkout -b feat/your-feature-name
```

#### Development Workflow

1. Make your changes following our [coding standards](DEVELOPMENT.md#coding-standards)
2. Write or update tests as needed
3. Run the verification pipeline:

```bash
npm run lint          # No lint errors
npx tsc -b            # No type errors
npm run test          # All tests pass
npm run build         # Build succeeds
```

4. Commit your changes:

```bash
git commit -m "feat: add your feature description"
```

5. Push and create a Pull Request:

```bash
git push origin feat/your-feature-name
```

#### Commit Message Convention

We use conventional commits:

| Prefix | Usage |
|--------|-------|
| `feat:` | A new feature |
| `fix:` | A bug fix |
| `chore:` | Build process, tooling, dependencies |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring (no functional change) |
| `test:` | Adding or updating tests |
| `style:` | Formatting, missing semicolons (not CSS) |

#### Pull Request Guidelines

- Keep PRs focused on a single concern
- Reference the related issue: `Closes #123`
- Include a clear description of changes
- Ensure all CI checks pass
- Be responsive to reviewer feedback

## Project Structure Overview

```
src/api/          Backend API client modules
src/auth/         Authentication and authorization
src/components/   Shared UI components
src/features/     Feature-specific modules (one per domain)
src/lib/          Utilities and helpers
src/offline/      Offline queue and sync
src/pages/        Page-level components
pocketbase/       Backend schema and hooks
docs/             Documentation
```

## Need Help?

- Check existing [Issues](https://github.com/YOUR_USER/barangayos/issues) and [Discussions](https://github.com/YOUR_USER/barangayos/discussions)
- Review the [Architecture Guide](ARCHITECTURE.md) for system design context
- Read the [Development Guide](DEVELOPMENT.md) for setup and coding conventions

---

Thank you for helping make barangay governance more efficient!
