import { resolveApiPath } from '../services/platform';

export async function authFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("medexam_token");
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const requestUrl = typeof input === 'string' ? resolveApiPath(input) : input;
  const response = await fetch(requestUrl, { ...init, headers });

  if (response.status === 401) {
    localStorage.removeItem("medexam_token");
    localStorage.removeItem("medexam_user");
  }

  return response;
}
