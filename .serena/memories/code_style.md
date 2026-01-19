# Code Style & Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled (`"strict": true`).
- **Module System**: CommonJS (`"module": "commonjs"`).
- **Target**: ES6 (`"target": "es6"`).
- **Source Maps**: Enabled.

## Linting
- **ESLint**: Used for code linting (`eslint src --ext ts`).
- **Rules**: Standard TypeScript ESLint recommended rules are likely applied (implied by dependencies).

## Naming Conventions
- **Commands**: `trae-usage-plugin.commandName` (camelCase for the suffix).
- **Files**: `kebab-case` or `camelCase` (e.g., `extension.ts`).

## Project Structure
- Source code in `src/`.
- Compiled code in `out/`.
