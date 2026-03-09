# Copilot Instructions

## Project Overview

`bessa_patterns.ts` is a library of reusable design patterns implemented in TypeScript. It is a Node.js/npm project (inferred from `.gitignore`).

> **Note:** The repository is in its initial state. Update this file as tooling, structure, and conventions are established.

## Expected Conventions (update as established)

- Language: TypeScript
- Package manager: npm (or yarn — confirm when `package.json` is added)
- Source files go in `src/`, compiled output in `dist/` (standard TypeScript library layout)
- Each pattern should have its own file or subdirectory under `src/`

## Commands (add when configured)

Once `package.json` and tooling are set up, document commands here. Typical for a TypeScript library:

```bash
npm install          # install dependencies
npm run build        # compile TypeScript
npm test             # run all tests
npm test -- --testPathPattern=<name>  # run a single test (if using Jest)
npm run lint         # lint the codebase
```

## Architecture

As patterns are added, document the high-level structure here — e.g., how patterns are organized, whether they share common abstractions, and how the public API is exported from `src/index.ts`.
