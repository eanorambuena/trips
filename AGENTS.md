# Conventional Commits

This project uses [Conventional Commits](https://www.conventionnalcommits.org/) for commit messages.

## Format

```
<type>: <description>

[optional body]

[optional footer]
```

## Types

- `feat`: new feature
- `fix`: bug fix
- `docs`: documentation
- `style`: formatting changes (no logic change)
- `refactor`: code reorganization
- `test`: add or fix tests
- `chore`: maintenance tasks

## Examples

```
feat: add user registration

fix: fix token expiring prematurely

docs: update installation instructions
```

## Rules

- Use imperative: "add" not "added"
- Max 72 characters on first line
- Footer is "Refs #123" to close issues
- **Always address the user in their preferred language**