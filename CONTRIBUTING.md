#  Code Style & Contribution Guidelines

This project follows best practices for clean, maintainable code. Please take a moment to review the guidelines before contributing.

---

## General Principles

- **Write readable code.** Optimize for humans, not just machines.
- **Prefer clarity over cleverness.**
- **Favor composition over inheritance** where applicable.
- **Avoid premature optimization.**

---

## Naming Conventions

- Use **descriptive and meaningful names** (avoid `data`, `tmp`, `stuff`, etc.)
- Functions: `camelCase`
- Classes/types/interfaces: `PascalCase`
- Constants: `UPPER_CASE`
- Avoid abbreviations unless they are well-known (`id`, `url`, `env`)

---

## Functions

- Keep functions **short and focused** (ideally under 20–30 lines)
- Each function should do **one thing only** (Single Responsibility Principle)
- Avoid side effects unless explicitly intended (and document them)
- Prefer `pure functions` where applicable

---

## Code Structure

- Prefer **modular code**. Break down large files into logical modules.
- Group similar logic and separate concerns (e.g., services vs. controllers)
- Use async/await consistently for asynchronous code
- Add types wherever possible (e.g., TypeScript types, interfaces)

---

## Error Handling

- Handle **expected errors gracefully** (e.g., invalid input, failed requests)
- Log unexpected errors using a logging library or centralized logger
- Do **not swallow errors silently**
- Always **return helpful error messages** to API consumers (never raw stack traces)

## Formatting & Linting
- Run npm run lint before committing (or use pre-commit hooks)
- Do not ignore lint errors unless justified and explained in comments

## Testing
- All new features must include unit tests
- Use describe/it blocks clearly and consistently

## Observability
- Log relevant request/response context in API endpoints
- Include logs for major actions (DB updates, external calls)
- Use consistent log levels: info, warn, error, debug
