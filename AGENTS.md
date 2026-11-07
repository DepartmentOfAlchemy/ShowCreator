# AGENTS.md

## Project overview
This repository contains a Tauri-based desktop application for ShowCreator. The project is split between the frontend UI and the Rust/Tauri backend, with the backend living in `src-tauri`.

## Working conventions
- Keep changes small, focused, and consistent with the existing project structure.
- Follow the current coding style and naming patterns already used in the codebase.
- Separate frontend and backend concerns; avoid mixing UI logic with Rust backend logic unless required.
- Do not modify generated files, lockfiles, or build artifacts unless the task explicitly requires it.
- Preserve cross-platform compatibility and avoid introducing OS-specific assumptions without a clear need.

## Validation
Before finishing work, run the smallest relevant validation for the area changed:
- Frontend changes: use the repository's existing package scripts (for example, build or lint/test commands).
- Rust/Tauri backend changes: run `cargo check` or the relevant Rust tests from `src-tauri`.
- App-level verification: use the normal local dev/build flow for the Tauri app when needed.

## Notes
- Prefer explicit, readable code and minimal edits.
- Keep the implementation aligned with the current architecture and patterns in the project.
- When in doubt, favor the least invasive fix that satisfies the task.
