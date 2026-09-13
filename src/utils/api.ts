export async function apiRequest<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // If we have an active role in localStorage for demo switching, send X-User-Id header
  const activeUserId = localStorage.getItem('if_active_user_id');
  if (activeUserId && !headers.has('X-User-Id')) {
    headers.set('X-User-Id', activeUserId);
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data;
}
