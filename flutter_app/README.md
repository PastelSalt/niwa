# NIWA — mobile app (Flutter)

Android + iOS client for the NIWA API. Same data model and behaviour as the web app, with a layout built
for phones (`PROJECT-SPECS.md` §10, §11.5). Plan: **`NIWA-PLAN-A-02.md`** at the repo root.

This folder sits **outside the pnpm workspace**; it talks to the backend only through the HTTP contract
(`packages/contracts/openapi.yaml`).

## Status

Not scaffolded yet — the Flutter SDK isn't installed on the dev machine. First step of plan A-02 (MA1.P1):

```bash
flutter --version          # expect Flutter 3.x / Dart 3.x
flutter create --org works.moeko --project-name niwa --platforms android,ios .
```

Run `flutter create` **inside this folder**; it keeps this README.

## Local development (once scaffolded)

```bash
pnpm dev:memory                                   # from the repo root: API on :4000 with in-memory MongoDB
flutter run --dart-define=API_BASE=http://10.0.2.2:4000/api/v1   # Android emulator → host machine
flutter run --dart-define=API_BASE=http://localhost:4000/api/v1  # iOS simulator
```
