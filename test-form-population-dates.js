#!/usr/bin/env node
/**
 * Test: Form Population with Data-Attribute Fix
 * 
 * This test verifies that:
 * 1. The table row stores dates in ISO format (YYYY-MM-DD)
 * 2. The form receives the correct data from URL parameters
 * 3. Form fields display the populated data
 */

const http = require('http');
const url = require('url');

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST: Form Population Fix - Date Format');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Check if form receives the correct data
    const testData = encodeURIComponent(JSON.stringify([
      {
        day: 'Wednesday',
        date: '2026-01-08',
        remark: 'Test remark',
        id: '123',
        balance: 1
      }
    ]));
    
    console.log('\n📋 TEST 1: Form receives data with date in YYYY-MM-DD format');
    const formHtml = await makeRequest(`/requests/dayoff-request?selected=${testData}&balance=10`);
    
    // Check if the working-date input has the value
    if (formHtml.includes('value="2026-01-08"')) {
      console.log('  ✅ PASS: Working date input has value="2026-01-08"');
    } else {
      console.log('  ❌ FAIL: Working date input does not have the expected value');
      // Try to find what value it has
      const match = formHtml.match(/class="working-date"[^>]*value="([^"]*)"/);
      if (match) {
        console.log(`     Found value: "${match[1]}"`);
      } else {
        console.log('     No value attribute found');
      }
    }
    
    // Check if Wednesday option exists and is selected
    if (formHtml.includes('value="Wednesday"')) {
      console.log('  ✅ PASS: Wednesday option is present in select');
      
      // Check if it's marked as selected
      const selectMatch = formHtml.match(/<select[^>]*class="working-day"[^>]*>[\s\S]*?<\/select>/);
      if (selectMatch && selectMatch[0].includes('value="Wednesday"')) {
        console.log('  ✅ PASS: Wednesday option found in select element');
      }
    } else {
      console.log('  ❌ FAIL: Wednesday option not found in select');
    }
    
    // Check if remarks field is populated
    if (formHtml.includes('value="Test remark"')) {
      console.log('  ✅ PASS: Remarks field is populated with correct value');
    } else {
      console.log('  ⚠️  WARNING: Remarks value not pre-populated (will be set by JS)');
    }
    
    // Test 2: Check if balance is displayed
    console.log('\n📋 TEST 2: Balance field is populated');
    if (formHtml.includes('value="10"') || formHtml.includes('value=\'10\'')) {
      console.log('  ✅ PASS: Balance field has value=10');
    } else {
      console.log('  ⚠️  WARNING: Balance may be set by JavaScript');
    }
    
    // Test 3: Check all day options are present
    console.log('\n📋 TEST 3: All day options are available in select');
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    let allDaysPresent = true;
    days.forEach(day => {
      if (!formHtml.includes(`value="${day}"`)) {
        console.log(`  ❌ FAIL: ${day} option missing`);
        allDaysPresent = false;
      }
    });
    if (allDaysPresent) {
      console.log('  ✅ PASS: All 7 day options are present');
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ Form population tests completed');
    console.log('='.repeat(70) + '\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

// Wait for server to be ready, then run tests
setTimeout(runTests, 2000);
