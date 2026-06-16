# CMS

A clean, fully self-contained WYSIWYG Content Management System built with vanilla HTML, CSS, and JavaScript. No build step, no framework, no dependencies beyond Google Fonts (optional — works offline without them).

Designed with [shadcn/ui](https://ui.shadcn.com) design tokens (preset `b27GcrRo`, base style).

---

## Features

- **WYSIWYG editor** — full rich text editing with formatting toolbar, link insertion, headings, lists, blockquotes, code blocks, and HTML source view
- **Post management** — create, edit, duplicate, publish, unpublish, and delete posts
- **Draft / Published / Scheduled** status workflow with draft badge counter
- **Auto-save** — changes are saved automatically every 3 seconds
- **Media library** — upload and manage images (stored as base64 in localStorage)
- **Post metadata** — slug, category, tags, excerpt, featured image, read time
- **Responsive layout** — sidebar collapses on mobile
- **Dark mode** — full system-aware dark mode toggle
- **Settings** — site name, description, author, posts per page
- **Toast notifications** — non-blocking feedback for all actions
- **Confirm dialogs** — safe destructive action flows
- **Persistent storage** — all data lives in `localStorage`; survives page refreshes

---

## File Structure

```
cms/
├── index.html          # Entry point — loads everything
├── css/
│   ├── tokens.css      # shadcn/ui design tokens (light + dark CSS vars)
│   ├── base.css        # Reset, utility classes
│   ├── components.css  # Buttons, inputs, cards, badges, toasts, modals…
│   ├── layout.css      # App shell, sidebar, topbar, page layout
│   └── editor.css      # WYSIWYG editor & post meta panel
└── js/
    ├── store.js        # Data layer — posts, media, settings (localStorage)
    ├── ui.js           # Toast, Dialog, Theme, dropdowns, helpers
    ├── editor.js       # Editor class (contenteditable + toolbar)
    └── app.js          # Router, views, CMS class
```

---

## Setup

Just open `index.html` in a browser — no server required for local use.

For production or to avoid CORS issues with the Google Fonts import, serve from a local HTTP server:

```bash
# Python
python3 -m http.server 3000

# Node (npx)
npx serve .

# Vite (optional)
npx vite
```

Then visit `http://localhost:3000`.

---

## Customisation

### Theme tokens
Edit `css/tokens.css` to change colours, radius, or font stacks. The system uses semantic CSS custom properties (`--background`, `--primary`, `--border`, etc.) that map 1:1 with shadcn/ui conventions.

### Offline fonts
Remove the `@import url(…)` line in `tokens.css` and serve fonts yourself, or rely on system fallbacks.

### Persistence backend
`js/store.js` is the single data layer. Replace the `load()` / `save()` functions with `fetch()` calls to a real API without touching any other file.

### Adding views
Add a new `case` in `CMS._route()` in `app.js` and a `_renderMyView()` method.

---

## Browser Support

Requires a modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+).  
Uses `contenteditable` + `document.execCommand` for the editor — widely supported, though `execCommand` is technically deprecated; a future upgrade path is a lightweight lib like Tiptap or Quill.

---

## License

MIT — use freely in personal and commercial projects.
