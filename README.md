# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

# Running

`pnpm tauri dev`

# Building

`pnpm tauri build`

# Controller data

Controller records are stored in `controllers.json` in Tauri's application data
directory. Existing `controllers-store` browser data is migrated the first time
the app loads controllers; if no prior data exists, the app creates the initial
Codex 43 record.