const BASE_URL = "/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const token = localStorage.getItem("jn_token");

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const text = await res.text();
  let data: T | { message?: string; error?: string };
  try {
    data = text ? (JSON.parse(text) as T | { message?: string; error?: string }) : ({} as T);
  } catch {
    if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
    return {} as T;
  }

  if (!res.ok) {
    const errData = data as { message?: string; error?: string };
    throw new ApiError(
      res.status,
      errData.message ?? errData.error ?? `Request failed (${res.status})`
    );
  }

  return data as T;
}
