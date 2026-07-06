# War Memorial of Korea — Scavenger Hunt

A standalone, single-mission version of the original two-location **"CIEE Scavenger Hunt"** app, designed end-to-end (concept, content, and development) to help CIEE Korea program students explore the War Memorial of Korea through an interactive, self-guided scavenger hunt.

**Live Demo:** https://lunashimca-crypto.github.io/ciee-war-memorial-app/

![status](https://img.shields.io/badge/status-active-brightgreen)
![vite](https://img.shields.io/badge/build-vite-646CFF)

---

## Why This Project

CIEE Korea runs an in-person orientation activity at the War Memorial of Korea, and needed a way for students to explore the museum independently while still engaging meaningfully with specific exhibits — not just wandering. This app turns that walkthrough into a guided mission: a short narrative sets the context, 8 questions anchor students to real locations, and a final rank gives the activity a sense of closure and light competition.

I led this project end to end, from concept through deployment:

- **Research & planning** — visited the museum, selected exhibits worth highlighting, and mapped out a route of 8 stops that works within a typical orientation time slot
- **Content design** — wrote the mission briefing, all 8 questions/answers, and the closing narrative
- **AI-assisted development** — built the app using Claude (Anthropic) as a development partner: defined the requirements and app behavior, directed the code generation, edited in-app text and content directly in the codebase, and tested and deployed the final result
- **Adaptation** — directed the extraction of this single-location mission out of a larger two-location app originally built the same way, into its own standalone, conflict-free version

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
- [How It Works](#how-it-works)
- [Deployment](#deployment)
- [Background](#background)
- [Credits](#credits)

---

## Tech Stack

- [Vite](https://vitejs.dev/) — build tool & dev server
- JavaScript, HTML, CSS
- Browser local storage for saving student progress
- Built with [Claude](https://www.anthropic.com/claude) (Anthropic) as an AI development partner — code was generated and refined iteratively based on requirements and content I directed

## Key Features

- 🗺️ Single-chapter mission flow with 8 location-based questions
- 💾 Progress tracking via `localStorage` (resume-friendly, no login required, persists across refreshes)
- 📜 Custom mission-briefing and ending narrative tailored to a standalone single-location experience
- 🏅 Final rank/score screen based on accuracy and/or completion
- 🎖️ Personalized, downloadable **Certificate of Service** — students enter their name and receive a completion certificate showing their final rank and verified report count
- 📱 Responsive layout for use on-site at the museum

## Screenshots

| Mission Briefing | Question Flow | Final Rank | Certificate |
|:---:|:---:|:---:|:---:|
| <img width="220" alt="Mission Briefing" src="https://github.com/user-attachments/assets/da311464-0f6c-4aa9-9d85-72bd82cfb0e5" /> | <img width="220" alt="Question Flow" src="https://github.com/user-attachments/assets/01b6975d-6e62-4fc4-b9e1-2a775c972113" /> | <img width="220" alt="Final Rank" src="https://github.com/user-attachments/assets/a73bcba0-9920-4902-accd-c8c9f6c0f3aa" /> | <img width="220" alt="Certificate" src="https://github.com/user-attachments/assets/5f278f75-0d62-4a2a-9dc3-aaf270890ce1" /> |

## How It Works

1. **Mission Briefing** — Students are welcomed with a short narrative that sets the context for exploring the War Memorial of Korea.
2. **Question Flow** — Students move through 8 questions, each tied to a specific location or exhibit within the memorial.
3. **Progress Tracking** — Each answer and the student's current position in the mission are saved to `localStorage` under a dedicated key, so progress persists across page reloads.
4. **Final Rank** — Once all 8 questions are answered, students see an ending narrative along with their final rank/score.
5. **Certificate of Service** — Students enter their name and can download a personalized certificate showing their completed report count and final rank (e.g. "Master Agent").

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

## Credits

Made with love for CIEE Korea students
