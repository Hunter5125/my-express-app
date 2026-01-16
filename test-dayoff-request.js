// Test script to verify day-off request smart allocation and form population
const puppeteer = require('puppeteer');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // 1. Go to login page
    console.log('Step 1: Navigating to login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    // 2. Login as Yousef (employee)
    console.log('Step 2: Logging in as Yousef (employee)...');
    await page.type('input[id="email"]', 'yousef@example.com');
    await page.type('input[id="password"]', 'Password123!');
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    // 3. Navigate to requests
    console.log('Step 3: Navigating to requests...');
    await page.goto('http://localhost:3000/requests', { waitUntil: 'networkidle2' });
    await sleep(1000);

    // 4. Check working days table
    console.log('Step 4: Checking working days table...');
    const workingDaysCount = await page.$$eval('table:last-of-type tbody tr', rows => rows.length);
    console.log(`Found ${workingDaysCount} working days`);

    if (workingDaysCount > 0) {
      // 5. Click "Request DayOff" button
      console.log('Step 5: Clicking "Request DayOff" button...');
      await page.click('#request-btn');
      await sleep(500);

      // 6. Enter number of days
      console.log('Step 6: Entering 1 day to request...');
      const daysInput = await page.$('#days-input');
      await daysInput.type('1', { delay: 100 });
      await sleep(500);

      // 7. Submit days request
      console.log('Step 7: Submitting days request...');
      await page.click('#days-submit-btn');
      await sleep(2000);

      // 8. Check URL and form
      const currentUrl = page.url();
      console.log('Current URL:', currentUrl);

      // Extract URL parameters
      const urlParams = new URL(currentUrl).searchParams;
      const selected = urlParams.get('selected');
      const balance = urlParams.get('balance');

      console.log('URL Parameters:');
      console.log('  selected:', selected ? JSON.parse(decodeURIComponent(selected)) : 'none');
      console.log('  balance:', balance);

      // 9. Check form fields
      console.log('Step 8: Checking form fields...');
      const rows = await page.$$('table.working-table tbody tr');
      console.log(`Form has ${rows.length} row(s)`);

      for (let i = 0; i < rows.length; i++) {
        const workingDate = await rows[i].$eval('input.working-date', el => el.value);
        const workingDay = await rows[i].$eval('select.working-day', el => el.value);
        const remarks = await rows[i].$eval('input.remarks', el => el.value);
        console.log(`Row ${i + 1}:`);
        console.log(`  Working Date: ${workingDate || '(empty)'}`);
        console.log(`  Working Day: ${workingDay || '(empty)'}`);
        console.log(`  Remarks: ${remarks}`);
      }

      // 10. Check remaining balance
      const remainingBalance = await page.$eval('#remaining-balance', el => el.value);
      console.log(`Remaining Balance: ${remainingBalance}`);

    } else {
      console.log('No working days found. Need to add some first.');
    }

    console.log('\n✅ Test completed successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
})();
