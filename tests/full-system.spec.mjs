import { test, expect } from '@playwright/test';
import { callSelfTest } from './helpers/selftest-api.mjs';

const baseURL = process.env.UAW_BASE_URL || 'https://app.ultimateautomotiveworks.com';

function watchForFatalErrors(page, failures) {
  page.on('pageerror', error => {
    const message = String(error?.message || error || '');
    if (message.includes('workshop-inspections') && message.includes('access control checks')) return;
    failures.push(`Page error: ${message}`);
  });
  page.on('response', response => {
    const url = response.url();
    if (response.status() >= 500 && (url.startsWith(baseURL) || url.includes('rvkutsfyglopbhrnbotx.supabase.co/functions/v1/'))) {
      failures.push(`HTTP ${response.status()}: ${url}`);
    }
  });
}

async function waitForWorkshopUnlocked(page) {
  await expect.poll(async () => page.locator('#pinGate').evaluate(el => el.classList.contains('hidden'))).toBe(true);
}

async function signInAsAutomatedUser(page, identity) {
  await page.goto('/index.html?ci=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#staffUser');
  await page.locator('#staffUser').evaluate((select, username) => {
    if (![...select.options].some(option => option.value === username)) {
      const option = document.createElement('option');
      option.value = username;
      option.textContent = 'Automated Test · Admin';
      select.appendChild(option);
    }
  }, identity.staff.username);
  await page.selectOption('#staffUser', identity.staff.username);
  await page.fill('#pinInput', identity.pin);
  await page.click('#pinSubmit');
  await waitForWorkshopUnlocked(page);
  await expect(page.locator('#home')).toHaveClass(/active/);
}

async function reopenTestJob(page, registration) {
  await page.evaluate(() => window.showJobs());
  await expect(page.locator('#jobs')).toHaveClass(/active/);
  const row = page.locator('#jobList .job-row').filter({ hasText: registration }).first();
  await expect(row).toBeVisible();
  await row.click();
  await expect(page.locator('#jobForm')).toHaveClass(/active/);
}

async function openQuoteRequests(page) {
  await page.waitForSelector('#opsNav button[data-tool="quote-requests"]');
  await page.waitForTimeout(900);
  await page.evaluate(() => window.showTool?.('quote-requests'));
  await expect(page.getByRole('heading', { name: 'Quote Requests' })).toBeVisible();
  await expect(page.locator('#quoteRequestList')).toBeVisible();
}

test('@smoke public pages, legal notices, assets and form validation load cleanly', async ({ page, request }) => {
  const failures = [];
  watchForFatalErrors(page, failures);

  let response = await page.goto('/request-quote.html?selftest=1', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Request a Quote' })).toBeVisible();
  await expect(page.locator('#qrAddress')).toBeVisible();
  await expect(page.locator('#qrTownCity')).toBeVisible();
  await expect(page.locator('#qrPostcode')).toBeVisible();
  await expect(page.locator('#qrPrivacyAck')).toBeVisible();
  await expect(page.locator('#qrMarketing')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Privacy Notice' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Workshop Terms' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cancellation Information' })).toBeVisible();
  await expect(page.locator('body')).toContainText('14995808');
  await page.click('#submitQuoteRequest');
  await expect(page.locator('#quoteFormMessage')).toContainText('Please complete your name');

  for (const [path, heading] of [
    ['/privacy.html', 'Privacy Notice'],
    ['/terms.html', 'Workshop Terms'],
    ['/cancellation.html', 'Cancellation Information'],
    ['/complaints.html', 'Complaints Procedure']
  ]) {
    response = await page.goto(`${path}?selftest=1`, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${path} should load`).toBeTruthy();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator('body')).toContainText('Ultimate Automotive Works LTD');
    await expect(page.locator('body')).toContainText('14995808');
  }

  response = await page.goto('/index.html?selftest=1', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('#pinGate')).toBeVisible();
  await page.waitForSelector('#staffUser');

  response = await page.goto('/operations.html?selftest=1', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.locator('#pinGate')).toBeVisible();

  for (const path of ['/manifest.json', '/sw-v20.js', '/logo.png', '/legal.css']) {
    const asset = await request.get(path);
    expect(asset.ok(), `${path} should be available`).toBeTruthy();
  }

  expect(failures, failures.join('\n')).toEqual([]);
});

test('iPhone production end-to-end workshop journey', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-webkit', 'Full production journey runs once in the iPhone/Safari-like project.');

  const failures = [];
  watchForFatalErrors(page, failures);
  const health = await callSelfTest('health');
  expect(health.ok).toBe(true);
  const identity = await callSelfTest('provision');
  const suffix = identity.staff.username.replace(/^uaw_ci_/, '').toUpperCase();
  const registration = `CI${suffix.slice(0, 8)}`;
  const description = `Automated brake check ${suffix}`;
  const postcode = 'TEST 1CI';

  try {
    await test.step('Customer submits a quote request with address and recorded privacy choice', async () => {
      await page.goto('/request-quote.html?ci=1', { waitUntil: 'domcontentloaded' });
      await page.fill('#qrName', identity.marker);
      await page.fill('#qrPhone', '07000000000');
      await page.fill('#qrEmail', `uaw-ci-${suffix.toLowerCase()}@example.com`);
      await page.fill('#qrAddress', '1 Automated Test Street');
      await page.fill('#qrTownCity', 'Test Town');
      await page.fill('#qrPostcode', postcode);
      await page.fill('#qrReg', registration);
      await page.fill('#qrModel', 'Automated Test Vehicle');
      await page.fill('#qrYear', '2026');
      await page.fill('#qrMileage', '12345');
      await page.selectOption('#qrType', { label: 'Brakes' });
      await page.fill('#qrDescription', description);
      await page.check('#qrConsent');
      await page.check('#qrPrivacyAck');
      const apiResponse = page.waitForResponse(r => r.url().includes('service=quote_requests') && r.request().method() === 'POST');
      await page.click('#submitQuoteRequest');
      expect((await apiResponse).ok()).toBeTruthy();
      await expect(page.locator('#quoteSuccess')).toBeVisible();
      await expect(page.locator('#quoteReference')).toContainText('QR-');
    });

    await test.step('Workshop signs in using an isolated automated admin account', async () => {
      await signInAsAutomatedUser(page, identity);
    });

    let createdJobMessage = '';
    await test.step('Quote request reaches Workshop Pro and converts to a job', async () => {
      await page.goto('/operations.html?ci=1', { waitUntil: 'domcontentloaded' });
      await waitForWorkshopUnlocked(page);
      await openQuoteRequests(page);
      const card = page.locator('.qr-request').filter({ hasText: identity.marker }).first();
      await expect(card).toBeVisible();
      await expect(card).toContainText(registration);
      await expect(card).toContainText(postcode);
      await page.evaluate(() => {
        window.confirm = () => true;
        window.__ciAlert = '';
        window.alert = message => { window.__ciAlert = String(message); };
      });
      await card.locator('button.convert').click();
      await expect.poll(async () => page.evaluate(() => window.__ciAlert || '')).toContain('Created Job #');
      createdJobMessage = await page.evaluate(() => window.__ciAlert || '');
      await openQuoteRequests(page);
      const convertedCard = page.locator('.qr-request').filter({ hasText: identity.marker }).first();
      await expect(convertedCard).toBeVisible();
      await expect(convertedCard).toContainText('Converted');
    });

    await test.step('Job card opens and a £12 fixed quote is generated', async () => {
      await page.goto('/index.html?ci=job', { waitUntil: 'domcontentloaded' });
      await waitForWorkshopUnlocked(page);
      await page.evaluate(() => window.workshopRefresh?.());
      await page.waitForTimeout(700);
      await reopenTestJob(page, registration);
      await expect(page.locator('#jobWorkSummary')).toHaveValue(description);
      await page.click('#jobQuoteBtn');
      await expect(page.locator('#quoteBuilder')).toHaveClass(/active/);
      if (await page.locator('#quoteLines .quote-line').count() === 0) {
        await page.getByRole('button', { name: /Add part/i }).click();
      }
      const line = page.locator('#quoteLines .quote-line').first();
      await expect(line).toBeVisible();
      const inputs = line.locator('input');
      await inputs.nth(0).fill(description);
      await inputs.nth(1).fill('1');
      await inputs.nth(2).fill('10');
      await inputs.nth(3).fill('0');
      await page.fill('#quoteCustomerMessage', 'Automated self-test quote.');
      await expect(page.locator('#quoteTotals')).toContainText('£12.00');
      await page.getByRole('button', { name: /Create customer approval link/i }).click();
      await expect(page.locator('#approvalLinkInput')).toBeVisible();
    });

    await test.step('Customer opens, signs, acknowledges terms and approves the secure quote link', async () => {
      const approvalUrl = await page.locator('#approvalLinkInput').inputValue();
      expect(approvalUrl).toContain('/approval.html?t=');
      const customerPage = await context.newPage();
      const customerFailures = [];
      watchForFatalErrors(customerPage, customerFailures);
      await customerPage.goto(approvalUrl, { waitUntil: 'domcontentloaded' });
      await expect(customerPage.locator('#approvalStatus')).toContainText('Awaiting your decision');
      await expect(customerPage.locator('#approvalTotals')).toContainText('£12.00');
      await expect(customerPage.locator('#approvalTermsAck')).toBeVisible();
      await expect(customerPage.locator('#approvalInfoAck')).toBeVisible();
      await customerPage.fill('#customerApprovalName', identity.marker);
      const box = await customerPage.locator('#customerSig').boundingBox();
      if (box) {
        await customerPage.mouse.move(box.x + 20, box.y + 35);
        await customerPage.mouse.down();
        await customerPage.mouse.move(box.x + 90, box.y + 65, { steps: 8 });
        await customerPage.mouse.move(box.x + 150, box.y + 30, { steps: 8 });
        await customerPage.mouse.up();
      }
      await customerPage.check('#approvalTermsAck');
      await customerPage.check('#approvalInfoAck');
      await customerPage.check('#approvalEarlyStart');
      await customerPage.click('#approveQuoteBtn');
      await expect(customerPage.locator('#approvalStatus')).toContainText('Quote approved');
      await expect(customerPage.locator('#approvalMessage')).toContainText('sent to Ultimate Automotive Works LTD');
      await expect(customerPage.locator('#approvalMessage')).toContainText('legal acknowledgements');
      await expect(customerPage.locator('#approvalReceipt')).toBeVisible();
      await expect(customerPage.locator('#approvalReceiptDetails')).toContainText('UAW-TERMS-2026-09-10-2');
      await expect(customerPage.locator('#approvalReceiptDetails')).toContainText('UAW-PRIVACY-2026-09-10-2');
      await expect(customerPage.locator('#approvalReceiptDetails')).toContainText('Yes');
      expect(customerFailures, customerFailures.join('\n')).toEqual([]);
      await customerPage.close();
    });

    await test.step('Workshop sees the customer approval', async () => {
      await page.goto('/index.html?ci=approved', { waitUntil: 'domcontentloaded' });
      await waitForWorkshopUnlocked(page);
      await page.evaluate(() => window.workshopRefresh?.());
      await page.waitForTimeout(700);
      await reopenTestJob(page, registration);
      await page.click('#jobQuoteBtn');
      await expect(page.locator('#quoteRevisionBadge')).toContainText('APPROVED');
      expect(createdJobMessage).toMatch(/Created Job #\d+/);
    });

    await test.step('All Workshop Pro tools render without fatal server/page errors', async () => {
      await page.goto('/operations.html?ci=tools', { waitUntil: 'domcontentloaded' });
      await waitForWorkshopUnlocked(page);
      await page.waitForSelector('#opsNav button[data-tool]');
      await page.waitForTimeout(900);
      const tools = await page.locator('#opsNav button[data-tool]').evaluateAll(buttons => [...new Set(buttons.map(b => b.dataset.tool).filter(Boolean))]);
      expect(tools.length).toBeGreaterThan(8);
      for (const tool of tools) {
        await page.evaluate(name => window.showTool?.(name), tool);
        await expect(page.locator('#opsView')).toBeVisible();
        await page.waitForTimeout(120);
      }
    });

    await test.step('Core iPhone workshop screens all open', async () => {
      await page.goto('/index.html?ci=screens', { waitUntil: 'domcontentloaded' });
      await waitForWorkshopUnlocked(page);
      const screens = [
        ['showWorkshopDashboard', 'dashboard'],
        ['showVehicles', 'vehicles'],
        ['showJobs', 'jobs'],
        ['showPastInspections', 'past'],
        ['startInspection', 'details']
      ];
      for (const [fn, id] of screens) {
        await page.evaluate(name => window[name]?.(), fn);
        await expect(page.locator(`#${id}`)).toHaveClass(/active/);
      }
    });

    expect(failures, failures.join('\n')).toEqual([]);
  } finally {
    await callSelfTest('cleanup');
  }
});