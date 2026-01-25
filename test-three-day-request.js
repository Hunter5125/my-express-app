/**
 * Test: Verify that requesting 3 days shows 3 rows in the form
 * 
 * Steps:
 * 1. Get working days for Yousef
 * 2. Request 3 days
 * 3. Check that form shows 3 rows
 */

const http = require('http');
const querystring = require('querystring');

const BASE_URL = 'http://localhost:3000';

let sessionCookie = null;

// Helper to make requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    if (sessionCookie) {
      reqOptions.headers['Cookie'] = sessionCookie;
    }

    const req = http.request(reqOptions, (res) => {
      let data = '';
      
      // Capture set-cookie header
      if (res.headers['set-cookie']) {
        sessionCookie = res.headers['set-cookie'][0];
      }

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          // Try to parse as JSON, otherwise return as text
          const result = data.startsWith('{') || data.startsWith('[') ? JSON.parse(data) : data;
          resolve({ status: res.statusCode, data: result, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 TEST: Three-Day Request Form Rows\n');

  try {
    // Step 1: Login as Yousef
    console.log('1️⃣  Login as Yousef...');
    let response = await makeRequest('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'email=yousef%40example.com&password=password'
    });
    
    if (response.status !== 302 && response.status !== 200) {
      throw new Error(`Login failed with status ${response.status}`);
    }
    console.log('   ✅ Logged in successfully\n');

    // Step 2: Get working days list
    console.log('2️⃣  Getting working days...');
    response = await makeRequest('/requests');
    const html = response.data;
    
    // Count working days in the table
    const dayMatches = html.match(/<tr[^>]*data-id/g) || [];
    const numWorkingDays = dayMatches.length;
    console.log(`   ✅ Found ${numWorkingDays} working days available\n`);

    if (numWorkingDays < 3) {
      console.log(`   ⚠️  WARNING: Only ${numWorkingDays} working days available, but requesting 3 days`);
    }

    // Step 3: Extract working days data from HTML to simulate the request
    const workingDays = [];
    const dayRegex = /data-id="([^"]+)"\s+data-day="([^"]+)"\s+data-date="([^"]+)"\s+data-remark="([^"]*)"\s+data-balance="([^"]+)"/g;
    let match;
    while ((match = dayRegex.exec(html)) !== null) {
      workingDays.push({
        _id: match[1],
        day: match[2],
        date: match[3],
        remark: match[4],
        balance: parseFloat(match[5])
      });
    }

    console.log('3️⃣  Working days extracted:');
    workingDays.forEach((wd, idx) => {
      console.log(`   [${idx}] ${wd.day} on ${wd.date} (balance: ${wd.balance}, remark: "${wd.remark}")`);
    });
    console.log();

    // Step 4: Simulate requesting 3 days
    console.log('4️⃣  Creating 3-day request...');
    
    // Build selected data the same way the JavaScript does
    const selected = [];
    let daysRemaining = 3;
    
    for (let i = 0; i < workingDays.length && daysRemaining > 0; i++) {
      const wd = workingDays[i];
      const dayBalance = wd.balance;

      if (dayBalance <= 0) continue;

      if (dayBalance >= daysRemaining) {
        selected.push({
          day: wd.day,
          date: wd.date,
          remark: wd.remark,
          id: wd._id,
          balance: daysRemaining  // This is daysUsed
        });
        daysRemaining = 0;
      } else {
        selected.push({
          day: wd.day,
          date: wd.date,
          remark: wd.remark,
          id: wd._id,
          balance: dayBalance  // This is daysUsed
        });
        daysRemaining -= dayBalance;
      }
    }

    if (daysRemaining > 0) {
      throw new Error(`Could not allocate ${daysRemaining} more days (not enough available)`);
    }

    console.log(`   Selected ${selected.length} working days for 3-day request:`);
    selected.forEach((s, idx) => {
      console.log(`   [${idx}] ${s.day} on ${s.date} (using ${s.balance} days)`);
    });
    console.log();

    // Step 5: Open the form with selected data
    console.log('5️⃣  Opening day-off request form with selected data...');
    const encodedSelected = encodeURIComponent(JSON.stringify(selected));
    const url = `/requests/dayoff-request?selected=${encodedSelected}&balance=13&totalDaysRequested=3`;
    
    response = await makeRequest(url);
    const formHtml = response.data;

    // Count rows in the form
    const rowMatches = formHtml.match(/<tbody[^>]*id="working-days"[^>]*>[\s\S]*?<tr>/g);
    if (!rowMatches) {
      console.log('   ❌ Could not find working-days tbody');
    }

    // Count actual <tr> elements in tbody id="working-days"
    const tbodyMatch = formHtml.match(/<tbody[^>]*id="working-days"[^>]*>([\s\S]*?)<\/tbody>/);
    if (tbodyMatch) {
      const tbodyContent = tbodyMatch[1];
      const trMatches = tbodyContent.match(/<tr>/g) || [];
      const numFormRows = trMatches.length;
      
      console.log(`   Found ${numFormRows} rows in the form table\n`);

      // Step 6: Verify results
      console.log('6️⃣  VERIFICATION RESULTS:\n');
      console.log(`   Selected days for request: ${selected.length}`);
      console.log(`   Rows shown in form: ${numFormRows}`);
      
      if (numFormRows === selected.length && selected.length === 3) {
        console.log(`   ✅ PASS: Form correctly shows ${selected.length} rows for 3-day request!`);
      } else if (numFormRows < selected.length) {
        console.log(`   ❌ FAIL: Form only shows ${numFormRows} rows but selected ${selected.length} days`);
        console.log(`   Expected: ${selected.length} rows, Got: ${numFormRows} rows`);
      } else {
        console.log(`   ⚠️  WARNING: Form shows ${numFormRows} rows (expected ${selected.length})`);
      }
    } else {
      console.log('   ❌ Could not find tbody id="working-days"');
    }

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    process.exit(1);
  }
}

runTests().then(() => {
  console.log('\n✅ Test completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Test error:', error);
  process.exit(1);
});
