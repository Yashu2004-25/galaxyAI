# Galaxy AI

Galaxy AI is a JavaScript learning companion built with React, Vite, Tailwind, Supabase, Groq, Electron, and Capacitor. It can be packaged as a Windows installer/portable executable and an Android APK from the same source.

## Configure Supabase

1. Copy `.env.example` to `.env` in this project folder.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your Supabase project URL and public anon key. Never use a `service_role` key in the app.
3. Run the SQL in [`sql/schema.sql`](sql/schema.sql) in the Supabase SQL Editor. Email/password authentication must be enabled.
4. Restart Vite or rebuild after changing `.env`; Vite embeds these public values at build time.

The Supabase anon key is public by design. Row Level Security policies in the schema limit each user to their own rows.

## Install and develop

### Install the required tools on Windows

Open **Command Prompt** (CMD). The following commands use Windows Package Manager (`winget`):

```cmd
winget --version
winget install --id OpenJS.NodeJS.LTS -e --source winget
winget install --id Git.Git -e --source winget
winget install --id Google.AndroidStudio -e --source winget
```

Close and reopen Command Prompt after installation, then check:

```cmd
node --version
npm --version
git --version
```

Install Android Studio from its [official download page](https://developer.android.com/studio) if `winget` is unavailable. Launch Android Studio and complete its setup wizard; install the Android SDK Platform, Android SDK Build-Tools, and Android SDK Command-line Tools in **More Actions → SDK Manager**. Open **SDK Manager → SDK Tools** to see the installed SDK location. For this project, set `sdk.dir` to that location in `android\local.properties`. A JDK is also required; Android Studio includes a bundled JDK, or install a compatible JDK and configure `JAVA_HOME`.

Download and install the Antigravity desktop app from Google's [official Antigravity download page](https://antigravity.google/download?os=windows). It is an installer download rather than a `winget` command. The Antigravity CLI is optional; if you want it in CMD, the official Windows command is:

```cmd
curl -fsSL https://antigravity.google/cli/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### Install this project's JavaScript packages

Open Command Prompt in the project folder (the folder containing `package.json`):

```cmd
cd /d C:\path\to\galaxyAI
npm install
```

`npm install` downloads the packages listed in `package.json`. The main runtime packages are React/React DOM, Vite, Tailwind CSS, React Router, Zustand, Supabase JS, Capacitor Android/App/Browser, secure storage, React Markdown/GFM/highlighting, Lucide icons, and locally bundled Inter fonts. The build tools include Electron, electron-builder, Capacitor CLI, Vitest, Sharp, and PNG-to-ICO.

Install the project packages again after pulling a fresh copy or when `package.json` changes. You do not need to install each JavaScript library globally.

### Start the project

```powershell
npm run dev            # browser preview at http://localhost:5173
npm run electron:dev   # Windows desktop development
```

In browser development, API secrets use localStorage and are **not encrypted**. Electron uses OS safeStorage; Android uses the secure-storage plugin. Configure a Groq key under Settings before using chat or roadmaps. The YouTube key is optional.

## Build

Run these commands from the project root in PowerShell:

```powershell
npm install
npm run electron:build # Windows installer and portable .exe
npm run android:debug  # Android debug .apk
```

The outputs are written to `release\Galaxy AI Setup 1.0.0.exe`, `release\Galaxy AI 1.0.0.exe`, and `android\app\build\outputs\apk\debug\app-debug.apk`.

### Build an updated app after editing code

Save your changes, then rerun the build command for the platform you want:

```powershell
npm run electron:build # rebuilds both Windows .exe files
npm run android:debug  # rebuilds the Android debug .apk
```

Both commands rebuild the web app automatically; `android:debug` also syncs the updated web files into the Android project. If you only want to preview edits during development, use `npm run dev` or `npm run electron:dev` instead. If you change `.env`, rebuild the target app too, since the Supabase values are embedded during the build.

To generate the app icons again after changing the artwork, run `npm run icons` before building.

For Android, install Android Studio/Android SDK and configure `android/local.properties` with `sdk.dir`. Use JDK 17 or a compatible installed JDK. To build a release APK, run `npm run android:release`; it must be signed with your own keystore. Never commit keystore files or passwords.

## Download the built apps

These links download the build artifacts currently in this project:

- [Download Android debug APK](android/app/build/outputs/apk/debug/app-debug.apk)
- [Download Windows installer](release/Galaxy%20AI%20Setup%201.0.0.exe)
- [Download Windows portable EXE](release/Galaxy%20AI%201.0.0.exe)

## Features

- Supabase email/password sign-in, sign-up, password recovery, session persistence, user-scoped RLS data.
- AI chat with Groq streaming, stop/regenerate/copy, history, model picker, favourites/custom models, compare replies, web-search routing, six study modes, Markdown and code highlighting.
- Two-stage study roadmap research and structured generation, YouTube link verification, progress tracking, saved roadmaps, and Tutor-mode step handoff.
- Encrypted device secret storage for Groq and optional YouTube keys, responsive white/obsidian interface, locally bundled Inter font, knight icon.

## Verification

Run `npm test` for unit coverage of JSON parsing, YouTube ID extraction, SSE parsing, model filtering, and history trimming.
