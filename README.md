# War Memorial of Korea — Scavenger Hunt (standalone)

Standalone single-mission version of the original two-location "CIEE Scavenger
Hunt" app, containing only the War Memorial of Korea chapter.

## Included
- Full working project: `package.json`, `vite.config.js`, `index.html`, `src/`
- `src/questions.js` — the War Memorial's 8 questions, renumbered as the app's
  single chapter, with the ending text rewritten so it stands on its own
- `public/images/` — **placeholder images** with the correct filenames already
  in place (`q1-1.jpg`...`q1-8.jpg`, `journal-1a/b/c.jpg`, `ch1-intro.jpg`).
  Just replace these files with your real photos — same filenames, no code
  changes needed.

## Run it
```
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## What changed from the original combined app
- Home screen shows one mission card instead of two
- "Continue to Mission 2" button now reads "View Final Rank" (no second chapter)
- Luna's mission-briefing text updated from "two real-world locations" to "one"
- Ending/finale text rewritten to close out the story at this single location
- Own localStorage key, so progress won't collide with the Gyeonghuigung app
