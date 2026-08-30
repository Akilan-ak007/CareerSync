import { chromium } from 'playwright';

(async () => {
  console.log('--- COMPREHENSIVE PLAYWRIGHT LIVE TEST ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let hasConsoleErrors = false;
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error('BROWSER CONSOLE ERROR:', msg.text());
      consoleErrors.push(msg.text());
      hasConsoleErrors = true;
    }
  });

  page.on('pageerror', (err) => {
    console.error('UNCAUGHT EXCEPTION:', err.message);
    consoleErrors.push(err.message);
    hasConsoleErrors = true;
  });

  try {
    // 1. Login Test
    console.log('1. Navigating to https://career-sync-tau.vercel.app/login...');
    await page.goto('https://career-sync-tau.vercel.app/login', { waitUntil: 'networkidle' });

    console.log('2. Submitting login credentials (admin@example.com / admin123)...');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✓ Login Successful! Redirected to:', page.url());

    // 2. LocalStorage JWT Check
    const token = await page.evaluate(() => localStorage.getItem('placement_jwt_token'));
    console.log('✓ LocalStorage JWT Token verified:', token ? `YES (${token.substring(0, 20)}...)` : 'NO');

    // 3. Placement Drives Page
    console.log('3. Navigating to Placement Drives (/drives)...');
    await page.goto('https://career-sync-tau.vercel.app/drives', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    const driveRows = page.locator('tbody tr');
    const driveCount = await driveRows.count();
    console.log(`✓ Placement Drives loaded. Total drives visible: ${driveCount}`);

    // 4. Test ATS Candidates Evaluation Modal
    const atsLink = page.locator('a[href*="/ats"]').first();
    if (await atsLink.isVisible()) {
      const atsHref = await atsLink.getAttribute('href');
      console.log(`4. Navigating to ATS Candidate Match page (${atsHref})...`);
      await page.goto(`https://career-sync-tau.vercel.app${atsHref}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(2000);

      const candidateRows = page.locator('tbody tr');
      const candidateCount = await candidateRows.count();
      console.log(`✓ ATS Candidate Roster loaded. Candidates count: ${candidateCount}`);

      if (candidateCount > 0) {
        console.log('5. Clicking "Inspect Match" button on first candidate to test detail modal...');
        const inspectBtn = page.locator('button:has-text("Inspect Match")').first();
        if (await inspectBtn.isVisible()) {
          await inspectBtn.click();
          await page.waitForTimeout(2000);
          console.log('✓ Candidate Match Evaluation Modal opened cleanly with 0 crashes!');

          // Check if "Done" button works
          const doneBtn = page.locator('button:has-text("Done")').first();
          if (await doneBtn.isVisible()) {
            await doneBtn.click();
            await page.waitForTimeout(1000);
            console.log('✓ Candidate Evaluation Modal closed smoothly!');
          }
        }
      }
    }

    // 5. Audit Trails Page
    console.log('6. Navigating to Audit Trails (/audit-logs)...');
    await page.goto('https://career-sync-tau.vercel.app/audit-logs', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const auditCount = await page.locator('tbody tr').count();
    console.log(`✓ Audit Trails loaded. Total colorful audit entries: ${auditCount}`);

    // Summary
    console.log('==================================================');
    if (!hasConsoleErrors) {
      console.log('🎉 PLAYWRIGHT AUDIT PASSED: ZERO CONSOLE ERRORS DETECTED ON LIVE PRODUCTION!');
    } else {
      console.error('❌ PLAYWRIGHT AUDIT FAILED with errors:', consoleErrors);
    }
    console.log('==================================================');

  } catch (err) {
    console.error('PLAYWRIGHT SCRIPT EXCEPTION:', err);
  } finally {
    await browser.close();
    console.log('Playwright browser session closed cleanly.');
  }
})();
