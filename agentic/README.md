## Agentic Control Room

This project delivers an autonomous maintenance cockpit for your website. The interface blends live health metrics, adaptive task planning, and an agent console that turns your plain-language directives into structured follow-up work.

### Features

- 📊 **Health telemetry** – aggregates agent-derived scores for uptime, automation coverage, and active initiatives.
- 🧠 **Insight engine** – interprets directives and suggests high-leverage actions across SEO, performance, accessibility, and platform reliability.
- 🛠️ **Interactive task pipeline** – Kanban-style columns for backlog, in-progress, blocked, and completed work with quick status transitions.
- 📓 **Activity journal** – chronological log of agent actions, alerts, and completed maintenance loops.
- ⚙️ **Autonomous routines** – text commands generate new roadmap items and update priorities without leaving the dashboard.

### Getting Started

```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to explore the control room.

### Production Build

```bash
npm run build
npm start
```

### Deployment

The app is ready for zero-config deployment on [Vercel](https://vercel.com/). Use the included `npm run build` script to validate before shipping to production.
