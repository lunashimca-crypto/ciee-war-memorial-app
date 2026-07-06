# War Memorial of Korea — Scavenger Hunt

A standalone, single-mission version of the original two-location **"CIEE Scavenger Hunt"** app, designed end-to-end (concept, content, and development) to help CIEE Korea program students explore the War Memorial of Korea through an interactive, self-guided scavenger hunt.

**Live Demo:** https://lunashimca-crypto.github.io/ciee-war-memorial-app/

![status](https://img.shields.io/badge/status-active-brightgreen)
![vite](https://img.shields.io/badge/build-vite-646CFF)
![license](https://img.shields.io/badge/license-MIT-blue)

---

## Why This Project

CIEE Korea runs an in-person orientation activity at the War Memorial of Korea, and needed a way for students to explore the museum independently while still engaging meaningfully with specific exhibits — not just wandering. This app turns that walkthrough into a guided mission: a short narrative sets the context, 8 questions anchor students to real locations, and a final rank gives the activity a sense of closure and light competition.

I owned this project end to end:

- **Research & planning** — visited the museum, selected exhibits worth highlighting, and mapped out a route of 8 stops that works within a typical orientation time slot
- **Content design** — wrote the mission briefing, all 8 questions/answers, and the closing narrative
- **Development** — built the interactive flow, scoring/ranking logic, and local progress-saving from scratch
- **Adaptation** — extracted this single-location mission out of a larger two-location app I had originally built, into its own standalone, conflict-free version

## Overview

The app guides students through **8 questions** tied to real locations and exhibits within the **War Memorial of Korea**, turning a museum visit into an interactive mission. Students read a mission briefing, move through the exhibits answering location-based questions, and receive a final rank based on their performance at the end.

The experience is designed to be:

- **Self-guided** — no staff supervision required during the hunt
- **Mobile-friendly** — built for students exploring the memorial with their phones
- **Session-persistent** — progress is saved locally, so a refresh or accidental tab close won't reset the mission

---

## Table of Contents

- [Why This Project](#why-this-project)
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Key Features](#key-features)
- [Screenshots](#screenshots)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Background](#background)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Credits](#credits)

---

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool & dev server
- JavaScript (ES6+)
- HTML5 / CSS3
- `localStorage` for client-side progress persistence
- _(add React / Vue / Svelte / etc. here if applicable)_

## Key Features

- 🗺️ Single-chapter mission flow with 8 location-based questions
- 💾 Progress tracking via `localStorage` (resume-friendly, no login required)
- 📜 Custom mission-briefing and ending narrative tailored to a standalone single-location experience
- 🏅 Final rank/score screen based on accuracy and/or completion
- 📱 Responsive layout for use on-site at the museum

## Screenshots

_(add screenshots or a short GIF of the mission briefing, a sample question, and the final rank screen)_

| Mission Briefing | Question Flow | Final Rank |
|---|---|---|
| _screenshot_ | _screenshot_ | _screenshot_ |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm (or yarn/pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

Then open the local URL shown in the terminal (typically `http://localhost:5173`).

### Build

```bash
npm run build
```

The production-ready files will be output to the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
├── public/                 # Static assets (images, icons, etc.)
├── src/
│   ├── data/                # Question data, narrative text
│   ├── components/          # UI components (if using a framework)
│   ├── utils/                # Helper functions (scoring, storage, etc.)
│   ├── App.jsx / main.js     # App entry point
│   └── styles/               # CSS/SCSS files
├── index.html
├── package.json
└── vite.config.js
```

_(adjust to match your actual folder layout)_

## How It Works

1. **Mission Briefing** — Students are welcomed with a short narrative that sets the context for exploring the War Memorial of Korea.
2. **Question Flow** — Students move through 8 questions, each tied to a specific location or exhibit within the memorial.
3. **Progress Tracking** — Each answer and the student's current position in the mission are saved to `localStorage` under a dedicated key, so progress persists across page reloads.
4. **Final Rank** — Once all 8 questions are answered, students see an ending narrative along with their final rank/score.

## Configuration

| Key | Description | Default |
|---|---|---|
| `localStorage` key | Storage key used to isolate this app's progress from the original two-location app | `war-memorial-scavenger-hunt` _(update to match actual key)_ |
| Question count | Number of questions in the mission | 8 |

_(update this table with any real environment variables or config files used)_

## Deployment

This app is deployed via **GitHub Pages** and is live at:
https://lunashimca-crypto.github.io/ciee-war-memorial-app/

To deploy your own build:

```bash
npm run build
# then push the contents of dist/ to your gh-pages branch,
# or configure GitHub Pages to serve from your build output
```

## Background

Adapted from a larger two-location **CIEE Scavenger Hunt** app, this standalone version isolates the War Memorial of Korea chapter, including:

- Renumbered questions (1–8, standalone rather than part of a two-location sequence)
- A rewritten, self-contained narrative for the mission briefing and ending
- Its own dedicated `localStorage` key to avoid conflicts with the original app

## Roadmap

- [ ] Add multi-language support (Korean/English toggle)
- [ ] Add hint system for difficult questions
- [ ] Add admin/instructor view to review student completion
- [ ] Add analytics on average completion time

## Contributing

Contributions, issues, and feature requests are welcome. Feel free to check the [issues page](../../issues) or open a pull request.

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Credits

Made with ❤️ for CIEE Korea students
