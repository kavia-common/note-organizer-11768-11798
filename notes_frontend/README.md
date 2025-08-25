# Notes Frontend (Astro)

A modern, light-themed notes application UI built with Astro. Features:
- Create notes
- Edit notes
- Delete notes
- View notes list
- Search notes

Layout:
- Top navigation bar with search and "New Note" button
- Main content area with notes list
- Sidebar for adding or editing a note

Theme colors:
- Primary: #1976d2
- Secondary: #424242
- Accent: #ff9800

## Getting Started

1) Install dependencies
   npm install

2) Run in development
   npm run dev
   The app runs on port 3000 per astro.config.mjs

3) Build
   npm run build
   npm run preview

## Backend/API

This frontend expects a backend (or local database service) exposing REST endpoints:

- GET    {PUBLIC_NOTES_API_BASE or /api}/notes?search=<q>   -> 200 [{ id, title, content, createdAt, updatedAt }]
- GET    {base}/notes/:id                                    -> 200 { id, ... }
- POST   {base}/notes                                        -> 201 { id, ... }   body: { title, content }
- PUT    {base}/notes/:id                                    -> 200 { id, ... }   body: { title, content }
- DELETE {base}/notes/:id                                    -> 204/200

If no backend is reachable, the app falls back to localStorage to store notes.

Environment:
- PUBLIC_NOTES_API_BASE (optional) to point to backend origin/path. Example:
  PUBLIC_NOTES_API_BASE=https://localhost:8080/api

You can create a .env file in the project root with the above variable; Astro exposes PUBLIC_* vars to the client.

## Code Structure

- src/styles/theme.css: Base theme styles and layout utilities
- src/layouts/Layout.astro: Global layout
- src/components/NavBar.astro: Top bar with search and create
- src/components/NotesList.astro: List of notes with edit/delete buttons
- src/components/EditorSidebar.astro: Create/edit form
- src/services/api.ts: PUBLIC_INTERFACE functions for CRUD and search with backend + localStorage fallback
- src/pages/index.astro: Main screen wiring components and client-side behavior

## Accessibility and UX

- Keyboard focus rings and button states
- ARIA labels on interactive icons
- Responsive layout (sidebar stacks on smaller screens)
