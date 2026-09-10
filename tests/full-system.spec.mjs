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
    if (response.status() >= 500 && (url.startsWith(baseURL) || url.includes('rvkutsfyglopbhrnbotx.supabase.co/functions/v1/'))) failures.push(`HTTP ${response.status()}: ${url}`);
  });
}

async function waitForWorkshopUnlocked(page) {
  await expect.poll(async () => page.locator('#pinGate').evaluate(el => el.classList.contains('hidden')), { timeout: 30000 }).toBe(true);
}

async function waitForEnhancedQuoteTools(page) {
  await expect.poll(async () => page.evaluate(() => window.saveQuote?.__quoteRevisionV18 === true), { timeout: 30000 }).toBe(true);
  await expect(page.locator('#quoteRevisionTools')).toBeVisible({ timeout: 15000 });
}

async function signInAsAutomatedUser(page, identity) {
  await page.goto('/index.html?ci=1', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#staffUser');
  await page.locator('#staffUser').evaluate((select, username) => {
    if (![...select.options].some(option => option.value === username)) {
      const option = document.createElement('option'); option.value = username; option.textContent = 'Automated Test · Admin'; select.appendChild(option);
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
  await expect(row).toBeVisible(); await row.click();
  await expect(page.locator('#jobForm')).toHaveClass(/active/);
}

async function openQuoteRequests(page) {
  await page.waitForSelector('#opsNav button[data-tool="quote-requests"]');
  await page.waitForTimeout(900);
  await page.evaluate(() => window.showTool?.('quote-requests'));
  await expect(page.getByRole('heading', { name: 'Quote Requests' })).toBeVisible();
  await expect(page.locator('#quoteRequestList')).toBeVisible();
}

test('@smoke public pages, company disclosure, legal notices and assets load cleanly', async ({ page, request }) => {
  const failures = []; watchForFatalErrors(page, failures);
  let response = await page.goto('/request-quote.html?selftest=1', { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBeTruthy();
  await expect(page.getByRole('heading', { name: 'Request a Quote' })).toBeVisible();
  for (const id of ['#qrAddress','#qrTownCity','#qrPostcode','#qrConsent','#qrPrivacyAck','#qrMarketing']) await expect(page.locator(id)).toBeVisible();
  await expect(page.locator('body')).toContainText('14995808');
  await expect(page.locator('body')).toContainText('ultimateautomotiveworksinquiry@gmail.com');
  await page.click('#submitQuoteRequest');
  await expect(page.locator('#quoteFormMessage')).toContainText('Please complete your name');

  for (const [path, heading] of [['/privacy.html','Privacy Notice'],['/terms.html','Workshop Terms'],['/cancellation.html','Cancellation Information'],['/complaints.html','Complaints Procedure']]) {
    response = await page.goto(`${path}?selftest=1`, { waitUntil: 'domcontentloaded' });
    expect(response?.ok(), `${path} should load`).toBeTruthy();
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator('body')).toContainText('Ultimate Automotive Works LTD');
    await expect(page.locator('body')).toContainText('14995808');
    await expect(page.locator('body')).toContainText('ultimateautomotiveworksinquiry@gmail.com');
  }
  response = await page.goto('/terms.html?selftest=vat', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('body')).toContainText('not currently VAT registered');
  await expect(page.locator('body')).toContainText('vehicle and its keys will not be released');
  await expect(page.locator('body')).toContainText('UAW-TERMS-2026-09-10-4');

  for (const path of ['/index.html','/operations.html']) {
    response = await page.goto(`${path}?selftest=1`, { waitUntil: 'domcontentloaded' }); expect(response?.ok()).toBeTruthy();
    await expect(page.locator('#pinGate')).toBeVisible();
  }
  for (const path of ['/manifest.json','/sw-v20.js','/logo.png','/legal.css','/src/features/legal/non-vat-v26.js']) {
    const asset = await request.get(path); expect(asset.ok(), `${path} should be available`).toBeTruthy();
  }
  expect(failures, failures.join('\n')).toEqual([]);
});

test('iPhone production end-to-end legal, quote and workshop journey', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'iphone-webkit', 'Full production journey runs once in the iPhone/Safari-like project.');
  const failures = []; watchForFatalErrors(page, failures);
  const health = await callSelfTest('health'); expect(health.ok).toBe(true);
  const identity = await callSelfTest('provision');
  const suffix = identity.staff.username.replace(/^uaw_ci_/, '').toUpperCase();
  const registration = `CI${suffix.slice(0,8)}`;
  const description = `Automated brake check ${suffix}`;
  const postcode = 'TEST 1CI';

  try {
    await test.step('Server rejects a quote request that bypasses privacy acknowledgement', async () => {
      await page.goto('/request-quote.html?ci=legal-bypass', { waitUntil: 'domcontentloaded' });
      const result = await page.evaluate(async ({ registration, description }) => {
        const r = await fetch('https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-gateway?service=quote_requests',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'submit',customer_name:'Consent Bypass Test',phone:'07000000000',registration,description,consent_contact:true,privacy_acknowledged:false,privacy_version:'',quote_request_version:''})});
        return { status:r.status, body:await r.json() };
      }, { registration:`NO${registration}`, description });
      expect(result.status).toBe(400); expect(String(result.body.error||'')).toContain('Privacy Notice');
    });

    await test.step('Customer submits address, service-contact consent and recorded privacy choice', async () => {
      await page.goto('/request-quote.html?ci=1', { waitUntil: 'domcontentloaded' });
      await page.fill('#qrName', identity.marker); await page.fill('#qrPhone','07000000000'); await page.fill('#qrEmail',`uaw-ci-${suffix.toLowerCase()}@example.com`);
      await page.fill('#qrAddress','1 Automated Test Street'); await page.fill('#qrTownCity','Test Town'); await page.fill('#qrPostcode',postcode);
      await page.fill('#qrReg',registration); await page.fill('#qrModel','Automated Test Vehicle'); await page.fill('#qrYear','2026'); await page.fill('#qrMileage','12345');
      await page.selectOption('#qrType',{label:'Brakes'}); await page.fill('#qrDescription',description); await page.check('#qrConsent'); await page.check('#qrPrivacyAck');
      await page.waitForTimeout(1350);
      const apiResponse=page.waitForResponse(r=>r.url().includes('service=quote_requests')&&r.request().method()==='POST');
      await page.click('#submitQuoteRequest'); const submitted=await apiResponse;
      if(!submitted.ok()) throw new Error(`Quote request returned HTTP ${submitted.status()}: ${await submitted.text().catch(()=> '')}`);
      await expect(page.locator('#quoteSuccess')).toBeVisible(); await expect(page.locator('#quoteReference')).toContainText('QR-');
    });

    await test.step('Workshop signs in using an isolated automated admin account', async () => { await signInAsAutomatedUser(page,identity); });

    let createdJobMessage='';
    await test.step('Quote request records legal version and converts to a job', async () => {
      await page.goto('/operations.html?ci=1',{waitUntil:'domcontentloaded'}); await waitForWorkshopUnlocked(page); await openQuoteRequests(page);
      const card=page.locator('.qr-request').filter({hasText:identity.marker}).first(); await expect(card).toBeVisible();
      await expect(card).toContainText(registration); await expect(card).toContainText(postcode); await expect(card).toContainText('UAW-PRIVACY-2026-09-10-3'); await expect(card).toContainText('No marketing opt-in');
      await page.evaluate(()=>{window.confirm=()=>true;window.__ciAlert='';window.alert=message=>{window.__ciAlert=String(message)}});
      await card.locator('button.convert').click(); await expect.poll(async()=>page.evaluate(()=>window.__ciAlert||'')).toContain('Created Job #'); createdJobMessage=await page.evaluate(()=>window.__ciAlert||'');
    });

    await test.step('Job creates a £12 quote with VAT forcibly disabled', async () => {
      await page.goto('/index.html?ci=job',{waitUntil:'domcontentloaded'}); await waitForWorkshopUnlocked(page); await page.evaluate(()=>window.workshopRefresh?.()); await page.waitForTimeout(700); await reopenTestJob(page,registration);
      await expect(page.locator('#jobWorkSummary')).toHaveValue(description); await page.click('#jobQuoteBtn'); await expect(page.locator('#quoteBuilder')).toHaveClass(/active/);
      await waitForEnhancedQuoteTools(page);
      await expect.poll(async()=>page.locator('#vatRate').inputValue()).toBe('0');
      await expect(page.locator('#uaw-non-vat-vatRate')).toContainText('not VAT registered');
      if(await page.locator('#quoteLines .quote-line').count()===0)await page.getByRole('button',{name:/Add part/i}).click();
      const inputs=page.locator('#quoteLines .quote-line').first().locator('input');
      await inputs.nth(0).fill(description); await inputs.nth(1).fill('1'); await inputs.nth(2).fill('12'); await inputs.nth(3).fill('0');
      await page.fill('#quoteCustomerMessage','Automated self-test quote.'); await expect(page.locator('#quoteTotals')).toContainText('£12.00');
      await page.getByRole('button',{name:/Create customer approval link/i}).click();
      await expect(page.locator('#approvalShare')).not.toHaveClass(/hidden/, { timeout: 30000 });
      await expect(page.locator('#approvalLinkInput')).toBeVisible({ timeout: 30000 });
    });

    await test.step('Backend cannot bypass legal approval; customer then signs and approves properly', async () => {
      const approvalUrl=await page.locator('#approvalLinkInput').inputValue(); expect(approvalUrl).toContain('/approval.html?t=');
      const customerPage=await context.newPage(); const customerFailures=[]; watchForFatalErrors(customerPage,customerFailures); await customerPage.goto(approvalUrl,{waitUntil:'domcontentloaded'});
      await expect(customerPage.locator('#approvalStatus')).toContainText('Awaiting your decision'); await expect(customerPage.locator('#approvalTotals')).toContainText('£12.00'); await expect(customerPage.locator('#approvalTotals')).toContainText('not VAT registered');
      await expect(customerPage.locator('.approval-legal')).toContainText('vehicle and its keys will not be released');
      await expect(customerPage.locator('#approvalReceipt')).toBeHidden();
      const rawToken=new URL(approvalUrl).searchParams.get('t');
      const bypass=await customerPage.evaluate(async token=>{const r=await fetch('https://rvkutsfyglopbhrnbotx.supabase.co/functions/v1/workshop-gateway?service=quotes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'public_approve',token,approved:true,customer_name:'Bypass'})});return{status:r.status,body:await r.json()}},rawToken);
      expect(bypass.status).toBeGreaterThanOrEqual(400); expect(bypass.status).toBeLessThan(500); expect(String(bypass.body.error||'').length).toBeGreaterThan(0);
      await customerPage.fill('#customerApprovalName',identity.marker);
      const signature=customerPage.locator('#customerSig'); await signature.scrollIntoViewIfNeeded();
      const box=await signature.boundingBox(); expect(box).not.toBeNull();
      if(box){await customerPage.mouse.move(box.x+20,box.y+35);await customerPage.mouse.down();await customerPage.mouse.move(box.x+90,box.y+65,{steps:8});await customerPage.mouse.move(box.x+150,box.y+30,{steps:8});await customerPage.mouse.up()}
      await customerPage.check('#approvalTermsAck'); await customerPage.check('#approvalInfoAck'); await customerPage.check('#approvalEarlyStart');
      const approvalResponse=customerPage.waitForResponse(r=>r.url().includes('service=quotes')&&r.request().method()==='POST');
      await customerPage.click('#approveQuoteBtn'); const approved=await approvalResponse;
      if(!approved.ok()) throw new Error(`Quote approval returned HTTP ${approved.status()}: ${await approved.text().catch(()=> '')}`);
      await expect(customerPage.locator('#approvalReceipt')).toBeVisible({timeout:45000}); await expect(customerPage.locator('#approvalStatus')).toContainText('Quote approved',{timeout:45000});
      await expect(customerPage.locator('#approvalReceiptDetails')).toContainText('UAW-TERMS-2026-09-10-4'); await expect(customerPage.locator('#approvalReceiptDetails')).toContainText('UAW-PRIVACY-2026-09-10-3'); await expect(customerPage.locator('#approvalReceiptDetails')).toContainText('not VAT registered');
      await expect(customerPage.getByRole('button',{name:'Download approval record'})).toBeVisible(); expect(customerFailures,customerFailures.join('\n')).toEqual([]); await customerPage.close();
    });

    await test.step('Workshop sees approval and core tools still render', async () => {
      await page.goto('/index.html?ci=approved',{waitUntil:'domcontentloaded'}); await waitForWorkshopUnlocked(page); await page.evaluate(()=>window.workshopRefresh?.()); await page.waitForTimeout(700); await reopenTestJob(page,registration); await page.click('#jobQuoteBtn'); await waitForEnhancedQuoteTools(page); await expect(page.locator('#quoteRevisionBadge')).toContainText('APPROVED'); expect(createdJobMessage).toMatch(/Created Job #\d+/);
      await page.goto('/operations.html?ci=tools',{waitUntil:'domcontentloaded'}); await waitForWorkshopUnlocked(page); await page.waitForSelector('#opsNav button[data-tool]'); await page.waitForTimeout(900);
      const tools=await page.locator('#opsNav button[data-tool]').evaluateAll(buttons=>[...new Set(buttons.map(b=>b.dataset.tool).filter(Boolean))]); expect(tools.length).toBeGreaterThan(8);
      for(const tool of tools){await page.evaluate(name=>window.showTool?.(name),tool);await expect(page.locator('#opsView')).toBeVisible();await page.waitForTimeout(100)}
    });

    await test.step('Core iPhone workshop screens open', async () => {
      await page.goto('/index.html?ci=screens',{waitUntil:'domcontentloaded'}); await waitForWorkshopUnlocked(page);
      for(const [fn,id] of [['showWorkshopDashboard','dashboard'],['showVehicles','vehicles'],['showJobs','jobs'],['showPastInspections','past'],['startInspection','details']]){await page.evaluate(name=>window[name]?.(),fn);await expect(page.locator(`#${id}`)).toHaveClass(/active/)}
    });
    expect(failures,failures.join('\n')).toEqual([]);
  } finally { await callSelfTest('cleanup'); }
});
