const AUDIENCE = 'uaw-workshop-self-test';
const DEFAULT_URL = 'https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-self-test';

async function oidcToken() {
  const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
  const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
  if (!requestUrl || !requestToken) {
    throw new Error('GitHub OIDC is unavailable. Run this test from the authorised GitHub Actions workflow.');
  }
  const separator = requestUrl.includes('?') ? '&' : '?';
  const response = await fetch(`${requestUrl}${separator}audience=${encodeURIComponent(AUDIENCE)}`, {
    headers: { Authorization: `bearer ${requestToken}` }
  });
  if (!response.ok) throw new Error(`Could not obtain GitHub OIDC token (${response.status})`);
  const data = await response.json();
  if (!data.value) throw new Error('GitHub OIDC response did not contain a token');
  return data.value;
}

export async function callSelfTest(action) {
  const token = await oidcToken();
  const response = await fetch(process.env.UAW_SELFTEST_URL || DEFAULT_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ action })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `Self-test control failed (${response.status})`);
  }
  return data;
}
