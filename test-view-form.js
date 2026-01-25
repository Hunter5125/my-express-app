const http = require('http');
const { parseString } = require('xml2js');

// First, login to get a session
function makeRequest(method, path, data = null, cookies = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    };

    if (cookies) {
      options.headers['Cookie'] = cookies;
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(data);
    }
    req.end();
  });
}

async function test() {
  try {
    console.log('Step 1: Logging in as Alaa...');
    const loginData = 'email=alaa@test.com&password=password';
    const loginResp = await makeRequest('POST', '/login', loginData);
    
    const setCookie = loginResp.headers['set-cookie'];
    console.log('Set-Cookie:', setCookie ? setCookie[0] : 'None');
    
    // Extract session cookie
    const sessionCookie = setCookie ? setCookie.join('; ') : '';

    console.log('\nStep 2: Fetching requests page to get requestData...');
    const requestsResp = await makeRequest('GET', '/requests', null, sessionCookie);
    
    // Find a dayoff request in the response
    const requestDataMatch = requestsResp.body.match(/data-request-id="([^"]+)"/);
    const requestId = requestDataMatch ? requestDataMatch[1] : null;
    
    if (!requestId) {
      console.log('No requests found in page. Looking for requestData parameter...');
      return;
    }

    console.log('Found request ID:', requestId);

    // Now test the form view with requestData parameter
    const requestData = encodeURIComponent(JSON.stringify({
      _id: requestId,
      workingDays: ['Tuesday'],
      days: 1
    }));

    console.log('\nStep 3: Loading form with requestData parameter...');
    const formResp = await makeRequest('GET', `/requests/dayoff-request?requestData=${requestData}`, null, sessionCookie);
    
    // Look for the compensation date field
    const dateFieldMatch = formResp.body.match(/class="compensation-date"[^>]*value="([^"]*)"/);
    console.log('Compensation date value:', dateFieldMatch ? dateFieldMatch[1] : 'NOT FOUND');

    // Look for working days count
    const rowMatches = formResp.body.match(/<tr[^>]*id="working-days-row/g) || [];
    console.log('Number of working day rows:', rowMatches.length);

    // Check for the existingRequest data in window object
    const existingRequestMatch = formResp.body.match(/window\.existingRequestData\s*=\s*{([^}]+)}/);
    if (existingRequestMatch) {
      console.log('\nExistingRequest data found:');
      const jsonStr = '{' + existingRequestMatch[1] + '}';
      console.log(jsonStr.substring(0, 200) + '...');
    }

    // Look for selected data
    const selectedMatch = formResp.body.match(/window\.selectedData\s*=\s*(\[[^\]]*\])/);
    if (selectedMatch) {
      console.log('\nSelected data found:');
      console.log(selectedMatch[1].substring(0, 200) + '...');
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();
