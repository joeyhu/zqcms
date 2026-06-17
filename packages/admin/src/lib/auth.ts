import { fetchAPI } from './api-client';
import type { AuthResponse, LoginInput, User } from '@zqcms/shared/types';

const TOKEN_KEY = 'zqcms_token';
const USER_KEY = 'zqcms_user';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): Omit<User, 'password'> | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === 'ADMIN';
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const result = await fetchAPI<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });

  localStorage.setItem(TOKEN_KEY, result.token);
  localStorage.setItem(USER_KEY, JSON.stringify(result.user));
  return result;
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  window.location.href = '/login';
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
