const INSFORGE_URL = process.env.NEXT_PUBLIC_INSFORGE_URL!;
const INSFORGE_API_KEY = process.env.NEXT_PUBLIC_INSFORGE_API_KEY!;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface InsforgeRequestOptions {
    method?: HttpMethod;
    body?: Record<string, unknown>;
    headers?: Record<string, string>;
    token?: string;
}

export async function insforgeRequest<T = unknown>(
    endpoint: string,
    options: InsforgeRequestOptions = {}
): Promise<T> {
    const { method = 'GET', body, headers = {}, token } = options;

    const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-API-Key': INSFORGE_API_KEY,
        ...headers,
    };

    if (token) {
        requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${INSFORGE_URL}${endpoint}`, {
        method,
        headers: requestHeaders,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(error.message || `Insforge API error: ${response.status}`);
    }

    return response.json() as Promise<T>;
}
