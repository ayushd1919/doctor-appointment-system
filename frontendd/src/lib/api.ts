export const API_BASE = process.env.NEXT_PUBLIC_API_BASE!;

// Public GET
export async function apiGet<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getJSON<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { ...init, cache: 'no-store' });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Public/Doctor POST (public endpoints don’t need credentials; doctor endpoints do)
export async function apiPost<T>(path: string, body: any, opts?: { credentials?: "include" | "omit" }) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    credentials: opts?.credentials, // for doctor endpoints with cookie
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function postJSON<T>(path: string, body: any, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    ...init,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Doctor GET (send cookie across origins)
export async function apiGetWithCreds<T>(path: string) {
  const res = await fetch(`${API_BASE}${path}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}
