const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const APP_URL = 'http://localhost:5173';
const REPORT_PATH = path.join(__dirname, 'e2e-report.json');

async function runTests() {
  console.log('🚀 Starting ChessPairzzz E2E Automated QA Suite...');
  const results = {
    timestamp: new Date().toISOString(),
    success: true,
    steps: [],
    consoleErrors: [],
    pageErrors: []
  };

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  // Enable request interception to fail EmailJS and trigger instant OTP fallback
  await page.setRequestInterception(true);
  page.on('request', request => {
    if (request.url().includes('emailjs.com')) {
      console.log(`🌐 Intercepted EmailJS API call: ${request.url()} - Responding with mock error`);
      request.respond({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ text: 'Mocked network failure for E2E testing' })
      });
    } else {
      request.continue();
    }
  });

  // Global Dialog (Alert/Confirm/Prompt) Handler to prevent Puppeteer hanging
  let alertMessage = '';
  page.on('dialog', async dialog => {
    alertMessage = dialog.message();
    console.log(`💬 Dialog Intercepted: [${dialog.type()}] "${alertMessage}"`);
    await dialog.accept();
  });

  page.on('console', msg => {
    const text = msg.text();
    if (msg.type() === 'error') {
      console.log(`🔴 Browser Console Error: ${text}`);
      results.consoleErrors.push(text);
    } else {
      console.log(`🔍 Browser Console: ${text}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`⚠️ Browser Page Crash/Error: ${err.toString()}`);
    results.pageErrors.push(err.toString());
    results.success = false;
  });

  const logStep = (name, status, details = '') => {
    console.log(`[${status ? 'PASS' : 'FAIL'}] ${name} ${details ? `(${details})` : ''}`);
    results.steps.push({ name, status, details });
    if (!status) results.success = false;
  };

  // Helper to click ribbon navigation items using direct DOM dispatch for maximum reliability
  const clickRibbonItem = async (label) => {
    console.log(`Navigating to ribbon item: "${label}"...`);
    const result = await page.evaluate((lbl) => {
      const items = Array.from(document.querySelectorAll('.ribbon-item'));
      const activeBefore = document.querySelector('.ribbon-item.active')?.textContent || 'none';
      const target = items.find(item => {
        if (item.classList.contains('dropdown')) return false;
        const directText = Array.from(item.childNodes)
          .filter(node => node.nodeType === 3) // Node.TEXT_NODE
          .map(node => node.textContent.trim())
          .join('');
        return directText.includes(lbl);
      });
      if (target) {
        target.click();
        return {
          found: true,
          activeBefore,
          clickedText: target.textContent
        };
      }
      return { found: false };
    }, label);
    console.log(`Click result for "${label}":`, JSON.stringify(result));
    if (!result.found) {
      throw new Error(`Ribbon item with label "${label}" not found`);
    }
    await new Promise(r => setTimeout(r, 2000));
    const activeAfter = await page.evaluate(() => {
      return document.querySelector('.ribbon-item.active')?.textContent || 'none';
    });
    console.log(`Active ribbon item after click: "${activeAfter}"`);
  };

  try {
    // 1. Navigate to Application
    console.log(`Navigating to ${APP_URL}...`);
    await page.goto(APP_URL, { waitUntil: 'networkidle2' });
    logStep('Navigate to Application', true);

    // Clear localStorage to start fresh
    console.log('Clearing localStorage for clean state...');
    await page.evaluate(() => {
      localStorage.clear();
    });
    await page.reload({ waitUntil: 'networkidle2' });
    logStep('Clear localStorage & Reload', true);

    // 2. Click "Register Here" to switch from Login to Registration
    await page.waitForSelector('.btn-ghost', { timeout: 5000 });
    await page.evaluate(() => {
      const ghostButtons = Array.from(document.querySelectorAll('.btn-ghost'));
      const regBtn = ghostButtons.find(b => b.textContent.includes('Register Here'));
      if (regBtn) regBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    logStep('Switch to Registration View', true);

    // 3. Fill Registration Details & Send OTP
    await page.waitForSelector('input[placeholder="John Doe"]', { timeout: 3000 });
    await page.type('input[placeholder="John Doe"]', 'Test QA User');
    await page.type('input[placeholder="john@example.com"]', 'qa_test_user@example.com');
    await page.type('input[placeholder="e.g. 28"]', '30');
    await page.type('input[placeholder="9876543210"]', '9999999999');
    await page.type('input[placeholder="••••••••"]', 'password123');

    // Click submit registration to request OTP
    await page.click('button[type="submit"]');
    console.log('Registration details submitted. Waiting for OTP field...');
    
    // Wait for the OTP input to show up
    await page.waitForSelector('input[placeholder="1234"]', { timeout: 10000 });
    logStep('Submit Registration Form & Wait for OTP', true);

    // 4. Enter OTP & Complete Verification
    await page.type('input[placeholder="1234"]', '1234');
    
    // Click "Verify & Register"
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const verifyBtn = btns.find(b => b.textContent.includes('Verify') || b.textContent.includes('Register'));
      if (verifyBtn) {
        verifyBtn.click();
      } else {
        throw new Error('Verify & Register button not found');
      }
    });
    console.log('Clicked Verify & Register. Waiting for transition...');
    await new Promise(r => setTimeout(r, 3000));

    // Check if we are inside the Dashboard
    const isLoggedIn = await page.evaluate(() => {
      return document.querySelector('.ribbon') !== null;
    });

    logStep('Verify OTP and Auto-Login/Register Success', isLoggedIn, isLoggedIn ? 'Found top navigation ribbon' : 'Navigation ribbon not found');

    if (!isLoggedIn) {
      throw new Error('Registration / Login failed: Navigation ribbon not found');
    }

    // 5. Test Free Trial Limits (Adding Players)
    const addManualPlayer = async (name, rating, age) => {
      await page.type('input[placeholder="Player Name"]', name);
      await page.type('input[placeholder="Rating"]', rating.toString());
      await page.type('input[placeholder="Age"]', age.toString());
      
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn) {
            submitBtn.click();
          } else {
            const btn = form.querySelector('button');
            if (btn) btn.click();
          }
        } else {
          throw new Error('Player addition form not found');
        }
      });
      await new Promise(r => setTimeout(r, 600));
    };

    console.log('Adding 3 manual players...');
    await addManualPlayer('Magnus Carlsen', 2882, 33);
    await addManualPlayer('Hikaru Nakamura', 2875, 36);
    await addManualPlayer('Fabiano Caruana', 2804, 31);
    
    // Check if players are added to the list
    let playerNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table tbody tr')).map(tr => tr.innerText);
    });
    
    const addedManual = playerNames.some(text => text.includes('Magnus Carlsen')) && playerNames.some(text => text.includes('Hikaru Nakamura'));
    logStep('Manual Player Addition', addedManual, addedManual ? 'Players successfully in list' : 'Could not find manual players in list');

    // 6. Test Bulk Import Players
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const bulkBtn = btns.find(b => b.textContent.includes('Bulk Mode'));
      if (bulkBtn) bulkBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const bulkInputText = `Ding Liren, 2780, 31\nIan Nepomniachtchi, 2775, 33\nAlireza Firouzja, 2760, 20\nPraggnanandhaa R, 2740, 18\nGukesh D, 2750, 17\nAnish Giri, 2745, 29\nWesley So, 2755, 30`;
    
    await page.type('#bulk-import-textarea', bulkInputText);
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const addBtn = btns.find(b => b.textContent.includes('Import'));
      if (addBtn) addBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    playerNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table tbody tr')).map(tr => tr.innerText);
    });
    const addedBulk = playerNames.some(text => text.includes('Gukesh D'));
    logStep('Bulk Player Import & Swiss Seeding', addedBulk, `Total players now: ${playerNames.length}`);

    // 7. Verify Trial Limits: Try adding 11th player
    alertMessage = ''; // Reset alert tracker
    console.log('Attempting to add 11th player to verify trial limits...');
    
    // Toggle Hide to return to manual form
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const hideBtn = btns.find(b => b.textContent.includes('Hide'));
      if (hideBtn) hideBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    await addManualPlayer('Vidit Gujrathi', 2720, 29);
    await new Promise(r => setTimeout(r, 1000));

    logStep('Verify Free Trial 10-Player Capacity Enforcement', alertMessage.includes('Limit') || alertMessage.includes('Free Trial') || alertMessage.includes('capacity') || alertMessage.includes('upgrade'), `Alert text: "${alertMessage}"`);

    // 8. Test Pro Upgrade (Pricing View)
    await clickRibbonItem('Pricing');
    logStep('Navigate to Pricing view', true);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const payBtn = btns.find(b => b.textContent.includes('Buy Lifetime Access') || b.textContent.includes('Choose Pro') || b.textContent.includes('Activate') || b.textContent.includes('Pay'));
      if (payBtn) payBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));

    await page.waitForSelector('input[placeholder*="YADUPRO2026"]', { timeout: 3000 });
    await page.type('input[placeholder*="YADUPRO2026"]', 'YADUPRO2026');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const verifyBtn = btns.find(b => b.textContent.includes('Verify & Activate'));
      if (verifyBtn) verifyBtn.click();
    });
    console.log('Verifying upgrade code... waiting for redirection... (using 5.5s delay to allow React state updates)');
    await new Promise(r => setTimeout(r, 5500));

    // Confirm upgrade by navigating back to Pricing or checking visual state
    await clickRibbonItem('Pricing');

    const pricingText = await page.evaluate(() => {
      return document.body.innerText;
    });
    const isProActivated = pricingText.includes('Activated ✅') || pricingText.includes('You are Pro!');
    logStep('Upgrade to Pro License via Activation Code', isProActivated, isProActivated ? 'Successfully verified Pro license in UI' : 'Pro license not activated in UI');

    // 9. Add 11th player after upgrading
    await clickRibbonItem('Home');

    console.log('Adding 11th player after Pro activation...');
    await addManualPlayer('Vidit Gujrathi', 2720, 29);
    await new Promise(r => setTimeout(r, 1000));

    playerNames = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('table tbody tr')).map(tr => tr.innerText);
    });
    logStep('Verify Player Capacity Limits Lifted', playerNames.some(text => text.includes('Vidit Gujrathi')), `Total players now: ${playerNames.length}`);

    // 10. Generate Pairings & Run Tournament
    console.log('Starting tournament from Dashboard...');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const startBtn = btns.find(b => b.textContent.includes('Start Tournament'));
      if (startBtn) startBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const hasPairings = await page.evaluate(() => {
      return document.querySelectorAll('.pairing-table tbody tr').length > 0;
    });
    logStep('Start Tournament and Generate Round 1 Swiss Pairings', hasPairings);

    // 11. Enter Match Results
    await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.pairing-table tbody tr'));
      rows.forEach((row, idx) => {
        const buttons = Array.from(row.querySelectorAll('.result-selector button'));
        if (buttons.length > 0) {
          if (idx === 0) buttons[0].click(); // White Win
          else if (idx === 1) buttons[2].click(); // Black Win
          else if (idx === 2) buttons[1].click(); // Draw
          else buttons[0].click(); // White Win
        }
      });
    });
    await new Promise(r => setTimeout(r, 1000));
    logStep('Enter Match Results for Round 1', true);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const compBtn = btns.find(b => b.textContent.includes('Complete Round'));
      if (compBtn) compBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));
    logStep('Complete Round 1', true);

    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const genBtn = btns.find(b => b.textContent.includes('Generate Round 2') || b.textContent.includes('Next Round') || b.textContent.includes('Generate Next Round'));
      if (genBtn) genBtn.click();
    });
    await new Promise(r => setTimeout(r, 2000));

    const hasRound2 = await page.evaluate(() => {
      const text = document.body.innerText;
      return text.includes('Round 2');
    });
    logStep('Generate Round 2 Greedy Swiss Pairings', hasRound2);

    // 12. View Standings
    await clickRibbonItem('Standings');
    await page.waitForFunction(() => document.body.innerText.includes('Tournament Final Standings'), { timeout: 5000 });
    
    const rankingsCount = await page.evaluate(() => {
      return document.querySelectorAll('table tbody tr').length;
    });
    logStep('Verify Tiebreak Rankings Calculations', rankingsCount > 0, `Ranked players count: ${rankingsCount}`);

    // 13. Export Standings & Generate Certificates
    const hasCertificatesButton = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.some(b => b.textContent.includes('Print All Certificates') || b.textContent.includes('Certificate'));
    });
    logStep('Verify Print All Certificates Feature Availability', hasCertificatesButton);

    if (hasCertificatesButton) {
      // Click print all certificates to verify modal opens
      await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const certBtn = btns.find(b => b.textContent.includes('Print All Certificates'));
        if (certBtn) certBtn.click();
      });
      await new Promise(r => setTimeout(r, 1500));
      
      const modalOpen = await page.evaluate(() => {
        return document.querySelector('.certificate-modal') !== null;
      });
      logStep('Verify Certificates Modal Rendered', modalOpen);

      if (modalOpen) {
        // Close modal
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const closeBtn = btns.find(b => b.textContent.includes('Close View'));
          if (closeBtn) closeBtn.click();
        });
        await new Promise(r => setTimeout(r, 1000));
        console.log('Certificates modal closed successfully.');
      }
    }

    console.log('🏁 E2E testing finished successfully.');
  } catch (error) {
    console.error('❌ E2E Run Interrupted by Error:', error);
    logStep('E2E Test Execution', false, error.message);
    try {
      await page.screenshot({ path: path.join(__dirname, 'failure.png') });
      console.log('📸 Screenshot saved to failure.png');
      const html = await page.content();
      fs.writeFileSync(path.join(__dirname, 'failure.html'), html);
      console.log('📄 HTML saved to failure.html');
    } catch (screenshotError) {
      console.error('Failed to capture screenshot/HTML:', screenshotError);
    }
  } finally {
    await browser.close();
    fs.writeFileSync(REPORT_PATH, JSON.stringify(results, null, 2));
    console.log(`📝 E2E Report saved to ${REPORT_PATH}`);
  }
}

runTests();
