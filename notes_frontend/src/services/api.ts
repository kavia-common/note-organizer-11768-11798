/**
 * PUBLIC_INTERFACE
 * Notes API client for the frontend. Provides CRUD and search capabilities.
 * - Tries to talk to a backend at NOTES_API_BASE (env) or /api (relative)
 * - Falls back to localStorage storage when backend is unavailable
 */

const ENV_BASE = import.meta.env.PUBLIC_NOTES_API_BASE as string | undefined;

/** Resolve base URL to call; default to /api */
function getBase(): string {
  return ENV_BASE ?? '/api';
}

export type Note = {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

export type NoteInput = {
  title: string;
  content: string;
};

const LS_KEY = 'notes_fallback_storage_v1';

function nowIso(): string {
  return new Date().toISOString();
}

function loadLS(): Note[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as Note[];
    return [];
  } catch {
    return [];
  }
}

function saveLS(notes: Note[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(notes));
}

// Try a fetch with timeout to detect offline backend quickly
async function safeFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3500);
  try {
    const res = await fetch(input, { ...init, signal: ctrl.signal });
    clearTimeout(timer);
    return res;
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// PUBLIC_INTERFACE
export async function listNotes(query?: string): Promise<Note[]> {
  /** List notes optionally filtered by query; falls back to localStorage. */
  const base = getBase();
  const url = query ? `${base}/notes?search=${encodeURIComponent(query)}` : `${base}/notes`;
  const res = await safeFetch(url, { headers: { 'Accept': 'application/json' } });
  if (res && res.ok) {
    return res.json();
  }
  // Fallback
  let notes = loadLS();
  if (query) {
    const q = query.toLowerCase();
    notes = notes.filter(n => n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q));
  }
  // Sort by updatedAt desc
  return notes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

// PUBLIC_INTERFACE
export async function getNote(id: string): Promise<Note | null> {
  /** Retrieve a single note by id. Falls back to localStorage. */
  const base = getBase();
  const res = await safeFetch(`${base}/notes/${id}`, { headers: { 'Accept': 'application/json' } });
  if (res && res.ok) return res.json();
  const notes = loadLS();
  return notes.find(n => n.id === id) ?? null;
}

// PUBLIC_INTERFACE
export async function createNote(input: NoteInput): Promise<Note> {
  /** Create a new note; falls back to localStorage. */
  const base = getBase();
  const res = await safeFetch(`${base}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res && res.ok) return res.json();

  // Fallback
  const n: Note = {
    id: crypto.randomUUID(),
    title: input.title,
    content: input.content,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  const notes = loadLS();
  notes.push(n);
  saveLS(notes);
  return n;
}

// PUBLIC_INTERFACE
export async function updateNote(id: string, input: NoteInput): Promise<Note> {
  /** Update an existing note; falls back to localStorage. */
  const base = getBase();
  const res = await safeFetch(`${base}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify(input),
  });
  if (res && res.ok) return res.json();

  const notes = loadLS();
  const idx = notes.findIndex(n => n.id === id);
  if (idx >= 0) {
    const updated: Note = { ...notes[idx], ...input, updatedAt: nowIso() };
    notes[idx] = updated;
    saveLS(notes);
    return updated;
  }
  // If not found, create new
  return createNote(input);
}

// PUBLIC_INTERFACE
export async function deleteNote(id: string): Promise<{ ok: true }> {
  /** Delete a note; falls back to localStorage. */
  const base = getBase();
  const res = await safeFetch(`${base}/notes/${id}`, { method: 'DELETE' });
  if (res && res.ok) return { ok: true };

  const notes = loadLS().filter(n => n.id !== id);
  saveLS(notes);
  return { ok: true };
}
