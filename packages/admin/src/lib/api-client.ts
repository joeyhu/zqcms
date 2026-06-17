import { API_BASE_URL } from '@zqcms/shared/constants';

const API_BASE = API_BASE_URL;

function getToken(): string | null {
  return localStorage.getItem('zqcms_token');
}

function getSiteId(): string | null {
  return localStorage.getItem('zqcms_current_site_id');
}

export function setCurrentSiteId(id: number | null) {
  if (id) {
    localStorage.setItem('zqcms_current_site_id', String(id));
  } else {
    localStorage.removeItem('zqcms_current_site_id');
  }
}

export function getCurrentSiteId(): number | null {
  const id = getSiteId();
  return id ? Number(id) : null;
}

export async function fetchAPI<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const siteId = getSiteId();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (siteId) headers['X-Site-Id'] = siteId;

  if (options.body instanceof FormData) {
    delete headers['Content-Type'];
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    let error = 'Request failed';
    try {
      const text = await res.text();
      try {
        const errBody = JSON.parse(text);
        error = errBody.error || errBody.message || error;
      } catch {
        error = text || error;
      }
    } catch { /* ignore */ }
    throw new Error(error);
  }

  return res.json();
}

export async function uploadFile(endpoint: string, formData: FormData): Promise<unknown> {
  const token = getToken();
  const siteId = getSiteId();
  const headers: Record<string, string> = {};

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (siteId) headers['X-Site-Id'] = siteId;

  const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: formData });
  if (!res.ok) {
    let error = 'Upload failed';
    try {
      const text = await res.text();
      try { const errBody = JSON.parse(text); error = errBody.error || error; } catch { error = text || error; }
    } catch { /* */ }
    throw new Error(error);
  }
  return res.json();
}
