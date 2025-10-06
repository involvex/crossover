# GEMINI.md

## Project Overview

This project, CrossOver++, is an Electron-based desktop application that provides a customizable crosshair overlay for any screen. It is designed to help gamers improve their aim by providing a persistent, centered crosshair. The application is built with Electron, vanilla JavaScript (using a mix of CommonJS and ES Modules), and Sass for styling. It is a fork of the original `lacymorrow/crossover` project.

The architecture follows the standard Electron main/renderer process model. The main process handles window management, system-level interactions (like keyboard shortcuts and auto-updates), and the core application logic. The renderer process is responsible for the user interface, including the crosshair display and settings window. The application uses `electron-builder` for creating installers and portable versions for Windows, macOS, and Linux.

A key feature is the "enemy detection" mode, which attempts to change the crosshair color when an enemy is detected near the center of the screen by analyzing pixel colors.

## Building and Running

### Dependencies

-   **Node.js:** Version `18.18.2` or greater is required.
-   **npm:** Used for package management.

### Key Commands

-   **Install Dependencies:**
    ```bash
    npm install
    ```
    *Note: On Windows, this also runs `npx electron-builder install-app-deps` to correctly install native dependencies.*

-   **Run in Development Mode:**
    ```bash
    npm start
    ```

-   **Build for Production (Windows x64):**
    ```bash
    npm run build:win
    ```
    *This command first runs `depcheck` and then builds the application using `electron-builder`, creating portable and NSIS installer versions in the `dist/` directory.*

-   **Run Tests:**
    ```bash
    npm test
    ```
    *This executes the end-to-end test suite using Playwright.*

-   **Linting:**
    ```bash
    npm run lint
    ```
    *This command will automatically fix linting issues using ESLint.*

## Development Conventions

-   **Module System:** The project uses a mixed-module system. The `package.json` is configured for `"type": "commonjs"`, but some files use ES Module `import` syntax (e.g., `main-wrapper.js`). This has been a source of build and runtime issues and should be handled with care.
-   **Linting:** Code style is enforced by ESLint using the `xo` configuration. The rules are defined in `.eslintrc.js`. Key style points include using tabs for indentation and no semicolons.
-   **Testing:** End-to-end testing is implemented with Playwright. Test files are located in the `test/` directory, and the configuration is in `playwright.config.ts`.
-   **Native Dependencies:** The project uses `uiohook-napi` for global keyboard and mouse listeners. This native module is rebuilt for the correct Electron version during the `postinstall` step via `@electron/rebuild`. To avoid issues with `asar` packaging, `uiohook-napi` is explicitly unpacked during the build process (configured in `build.asarUnpack`).
-   **Dependency Management:** `depcheck` is used to identify unused dependencies and missing dependencies required by the code. This is run as part of the `build` script.
-   **Releasing:** The `np` package is used for managing releases.
