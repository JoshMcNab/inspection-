import { test, expect } from '@playwright/test';
import { callSelfTest } from './helpers/selftest-api.mjs';

const baseURL = process.env.UAW_BASE_URL || 'https://app.ultimateautomotiveworks.com';
const supabaseBase = 'https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1';

function watchForFatalErrors(page, failures) {
  page.on('pageerror', error => failures.push(`Page error: ${String(error?.message || error || '')}`));
  page.on('response', response => {
    const url = response.url();
    if (response.status() >= 500 && (url.startsWith(baseURL) || url.startsWith(supabaseBase))) {
      failures.push(`HTTP ${response.status()}: ${url}`);
    }
  });
}

async function postFromSite(page, url, body) {
  await page.goto('/request-quote.html?production-smoke=1', { waitUntil: 'domcontentloaded' });
  return page.evaluate(async ({ url, body }) => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });
    return { status: response.status, body: await response.json().catch(() => ({})) };
  }, { url, body });
}

test('public pages, legal notices and company disclosure load cleanly', async ({ page, request }) => {
  const failures = []; watchForFatalErrors(page, failures);
  let response = await page.goto('/request-quote.html?production-smoke=1', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Request a Quote' })).toBeVisible();
  for (const id of ['#qrAddress','#qrTownCity','#qrPostcode','#qrConsent','#qrPrivacyAck','#qrMarketing']) {
    await expect(page.locator(id)).toBeVisible();
  }
  await expect(page.locator('body')).toContainText('Ultimate Automotive Works LTD');
  await expect(page.locator('body')).toContainText('14995808');
  await expect(page.locator('body')).toContainText('9 Water Fir Drive');

  for (const [path, heading] of [
    ['/privacy.html','Privacy Notice'],
    ['/terms.html','Workshop Terms'],
    ['/cancellation.html','Cancellation Information'],
    ['/complaints.html','Complaints Procedure']
  ]) {
    response = await page.goto(`${path}?production-smoke=1`, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${path} should load`).toBeTruthy();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator('body')).toContainText('Ultimate Automotive Works LTD');
    await expect(page.locator('body')).toContainText('14995808');
  }

  for (const path of ['/index.html','/operations.html']) {
    response = await page.goto(`${path}?production-smoke=1`, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('#pinGate')).toBeVisible();
  }

  for (const path of [
    '/manifest.json','/sw-v20.js','/logo.png','/legal.css',
    '/legal/terms-UAW-TERMS-2026-09-10-4.html',
    '/legal/privacy-UAW-PRIVACY-2026-09-10-3.html',
    '/legal/cancellation-UAW-CANCEL-2026-09-10-3.html'
  ]) {
    const asset = await request.get(path); expect(asset.ok(), `${path} should be available`).toBeTruthy();
  }

  const approval = await request.get('/approval.html?production-smoke=1');
  expect(approval.ok()).toBeTruthy();
  const approvalHtml = await approval.text();
  for (const marker of ['customerApprovalName','customerSig','approvalTermsAck','approvalInfoAck','approvalEarlyStart','approvalReceipt']) {
    expect(approvalHtml, `approval page should include ${marker}`).toContain(marker);
  }
  expect(approvalHtml).toContain('UAW-TERMS-2026-09-10-4');
  expect(approvalHtml).toContain('UAW-PRIVACY-2026-09-10-3');
  expect(approvalHtml).toContain('UAW-CANCEL-2026-09-10-3');
  expect(failures, failures.join('\n')).toEqual([]);
});

test('production backend health check is read-only and legal controls are present', async () => {
  const health = await callSelfTest('health');
  expect(health.ok).toBe(true);
  expect(health.mode).toBe('read-only-production');
  expect(health.database?.customer_consents).toBe(true);
  expect(health.storage?.quote_request_uploads).toBe(true);
  expect(health.legal?.quote_request_consent_fields).toBe(true);
  expect(health.legal?.quote_approval_consent_fields).toBe(true);
  expect(health.legal?.consent_ledger_fields).toBe(true);
  expect(health.legal?.legal_version).toBe('UAW-LEGAL-2026-09-10-4');
  expect(health.legal?.terms_version).toBe('UAW-TERMS-2026-09-10-4');
  expect(health.legal?.privacy_version).toBe('UAW-PRIVACY-2026-09-10-3');
  expect(health.legal?.cancellation_version).toBe('UAW-CANCEL-2026-09-10-3');
  expect(health.legal?.quote_request_version).toBe('UAW-QUOTE-REQUEST-2026-09-10-3');
  expect(health.legal?.vat_mode).toBe('not-vat-registered');
});

test('quote request backend rejects missing or stale legal acknowledgement without creating data', async ({ page }) => {
  const endpoint = `${supabaseBase}/workshop-gateway?service=quote_requests`;
  const common = {
    action: 'submit',
    customer_name: 'Production smoke validation',
    phone: '07000000000',
    registration: 'TEST000',
    description: 'Read-only validation request; this must never be inserted.',
    consent_contact: true,
    quote_request_version: 'UAW-QUOTE-REQUEST-2026-09-10-3',
    form_started_at: Date.now() - 5000
  };

  const missingPrivacy = await postFromSite(page, endpoint, {
    ...common,
    privacy_acknowledged: false,
    privacy_version: 'UAW-PRIVACY-2026-09-10-3'
  });
  expect(missingPrivacy.status).toBe(400);
  expect(String(missingPrivacy.body?.error || '')).toContain('Privacy Notice');

  const staleVersion = await postFromSite(page, endpoint, {
    ...common,
    privacy_acknowledged: true,
    privacy_version: 'UAW-PRIVACY-OLD'
  });
  expect(staleVersion.status).toBe(409);
  expect(String(staleVersion.body?.error || '')).toContain('changed');
});

test('unauthenticated workshop data routes are denied', async ({ page }) => {
  const checks = [
    ['inspections','workshop_bootstrap'],
    ['pro','bootstrap'],
    ['quote_requests','list'],
    ['quotes','quote_meta'],
    ['progress','staff_jobs'],
    ['admin','health']
  ];
  for (const [service, action] of checks) {
    const result = await postFromSite(page, `${supabaseBase}/workshop-gateway?service=${service}`, { action, job_number: 0 });
    expect([401,403], `${service}:${action} must reject unauthenticated access`).toContain(result.status);
  }
});

test('retired legacy quote and login actions cannot be used', async ({ page }) => {
  for (const action of ['login','public_quote','public_approve','save_quote','prepare_quote_approval']) {
    const result = await postFromSite(page, `${supabaseBase}/workshop-inspections`, {
      action,
      token: 'x'.repeat(64),
      pin: '000000',
      quote_id: '00000000-0000-0000-0000-000000000000'
    });
    expect(result.status, `${action} should be retired`).toBe(410);
  }
});

test('invalid customer tokens reveal no customer data', async ({ page }) => {
  const fake = 'x'.repeat(64);
  const quote = await postFromSite(page, `${supabaseBase}/workshop-gateway?service=quotes`, { action: 'public_quote', token: fake });
  expect(quote.status).toBe(404);
  const portal = await postFromSite(page, `${supabaseBase}/workshop-gateway?service=customer`, { action: 'public_portal', token: fake });
  expect(portal.status).toBe(404);
});
