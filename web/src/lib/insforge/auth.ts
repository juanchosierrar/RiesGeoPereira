import { insforgeRequest } from './client';
import type { AuthTokens, AuthSession, Usuario } from './types';

const TOKEN_KEY = 'insforge_token';
const USER_KEY = 'insforge_user';

export async function login(email: string, password: string): Promise<AuthTokens> {
    const data = await insforgeRequest<AuthTokens>('/auth/login', {
        method: 'POST',
        body: { email, password },
    });

    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
}

export async function signup(
    email: string,
    password: string,
    nombre: string,
    fk_org: string
): Promise<AuthTokens> {
    const data = await insforgeRequest<AuthTokens>('/auth/signup', {
        method: 'POST',
        body: { email, password, nombre, fk_org },
    });

    if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.access_token);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    }

    return data;
}

export function logout(): void {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        window.location.href = '/login';
    }
}

export function getSession(): AuthSession {
    if (typeof window === 'undefined') {
        return { user: null, token: null, isAuthenticated: false };
    }

    const token = localStorage.getItem(TOKEN_KEY);
    const userJson = localStorage.getItem(USER_KEY);

    if (!token || !userJson) {
        return { user: null, token: null, isAuthenticated: false };
    }

    try {
        const user = JSON.parse(userJson) as Usuario;
        return { user, token, isAuthenticated: true };
    } catch {
        return { user: null, token: null, isAuthenticated: false };
    }
}

export function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(TOKEN_KEY);
}
