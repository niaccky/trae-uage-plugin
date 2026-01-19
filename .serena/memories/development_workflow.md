# Development Workflow & Commands

## Scripts
- **Compile**: `npm run compile` - Compiles TypeScript to JavaScript in `out/`.
- **Watch**: `npm run watch` - Compiles in watch mode for development.
- **Lint**: `npm run lint` - Runs ESLint on `src` directory.
- **Test**: `npm run test` - Runs extension tests.
- **Prepublish**: `npm run vscode:prepublish` - Runs compile before publishing.

## Key Files
- `src/extension.ts`: Main entry point for the extension.
- `package.json`: Defines extension manifest, activation events, and commands.

## Activation Events
- `*`: The extension activates on startup (or when any event occurs, essentially eager activation).

## Commands
- `trae-usage-plugin.helloWorld`: "Hello World"
- `trae-usage-plugin.showUsage`: "Show Usage"
