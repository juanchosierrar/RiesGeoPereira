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

    const responseData = await response.json();
    
    // Directus/Insforge typically wraps data in a { data: ... } object
    if (responseData && typeof responseData === 'object' && 'data' in responseData) {
        return responseData.data as T;
    }
    
    return responseData as T;
}

/**
 * Fetches all records from an endpoint by automatically handling pagination (1000 records per page).
 */
export async function insforgeFetchAll<T = unknown>(
    endpoint: string,
    options: InsforgeRequestOptions = {}
): Promise<T[]> {
    let allData: T[] = [];
    let start = 0;
    const limit = 1000;
    let hasMore = true;

    try {
        while (hasMore) {
            const range = `${start}-${start + limit - 1}`;
            const data = await insforgeRequest<T[]>(endpoint, {
                ...options,
                headers: {
                    ...options.headers,
                    'Range': range,
                }
            });

            if (data && Array.isArray(data)) {
                allData = [...allData, ...data];
                // If we got fewer records than the limit, we've reached the end
                if (data.length < limit) {
                    hasMore = false;
                } else {
                    start += limit;
                }
            } else {
                hasMore = false;
            }
            
            // Safety break to prevent infinite loops (max 50,000 records)
            if (start > 50000) break;
        }
    } catch (error) {
        console.error(`Error in insforgeFetchAll for ${endpoint}:`, error);
        // Return whatever we managed to fetch before the error
    }

    return allData;
}
