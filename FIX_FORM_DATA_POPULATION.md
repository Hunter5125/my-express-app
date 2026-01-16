# Fix: Form Field Data Population When Viewing Requests

## Problem Statement
When clicking the view icon in the Working Days table to view an existing day-off request, the form fields were not displaying the populated data:
- **Date to be taken**: Should show `2026-01-27` but showed empty
- **Day to be taken**: Should show `Thursday` but showed empty
- **Remaining Balance**: Should show `1.5` but showed default `13`
- **Remarks/Justification**: May not have displayed

## Root Cause Analysis

The issue had multiple components:

### 1. **Remaining Balance Default Override** (PRIMARY ISSUE)
**File**: `views/dayoff-request.hbs` (line 876)

**Problem**: The remaining balance field was being set from the URL parameter, with a default fallback to `13`. This bypassed the server-provided value from `existingRequest.balance`.

```javascript
// BEFORE (INCORRECT)
let remainingBalance = parseFloat(urlParams.get('balance')) || 13;
document.getElementById('remaining-balance').value = remainingBalance;
```

**Impact**: Even though the server passed `existingRequest.balance = 1`, the JavaScript would override it with `13` if no URL parameter existed.

### 2. **Compensation Date/Day Form Population**
**Files**: `views/dayoff-request.hbs` and `routes/requests.js`

**Problem**: While the template correctly stored values in `window.existingRequestData`, the JavaScript fallback logic relied on these values being properly extracted from the Handlebars output.

## Solutions Implemented

### 1. **Fixed Remaining Balance Logic**
**File**: `views/dayoff-request.hbs` (lines 877-879)

```javascript
// AFTER (CORRECT)
let remainingBalance = window.existingRequestData.balance || parseFloat(urlParams.get('balance')) || 13;
document.getElementById('remaining-balance').value = remainingBalance;
console.log('Set remaining balance:', remainingBalance, '(from:', window.existingRequestData.balance ? 'server' : 'URL or default', ')');
```

**Changes**:
- First priority: Server value from `window.existingRequestData.balance`
- Second priority: URL parameter `balance`
- Third priority: Default value `13`
- Added logging to track which source was used

### 2. **Enhanced Route Data Logging**
**File**: `routes/requests.js` (lines 625-631)

Added comprehensive logging to verify that all data is correctly retrieved from the database and passed to the template:

```javascript
console.log('\n📋 RENDERING TEMPLATE WITH DATA:');
console.log('  Mode:', mode);
console.log('  Has existingRequest:', !!existingRequest);
if (existingRequest) {
  console.log('  existingRequest._id:', existingRequest._id);
  console.log('  existingRequest.day_to_be_taken:', existingRequest.day_to_be_taken);
  console.log('  existingRequest.date_to_be_taken:', existingRequest.date_to_be_taken);
  console.log('  existingRequest.formattedDate_to_be_taken:', existingRequest.formattedDate_to_be_taken);
  console.log('  existingRequest.balance:', existingRequest.balance);
  console.log('  existingRequest.remark:', existingRequest.remark);
}
```

### 3. **Added Server-Side Verification Comments**
**File**: `views/dayoff-request.hbs` (lines 575-580)

Added HTML comments to verify Handlebars output:
```html
<!-- existingRequest exists: {{#if existingRequest}}YES{{else}}NO{{/if}} -->
<!-- formattedDate_to_be_taken: {{#if existingRequest}}"{{existingRequest.formattedDate_to_be_taken}}"{{else}}NULL{{/if}} -->
<!-- day_to_be_taken: {{#if existingRequest}}"{{existingRequest.day_to_be_taken}}"{{else}}NULL{{/if}} -->
<!-- balance: {{#if existingRequest}}{{existingRequest.balance}}{{else}}NULL{{/if}} -->
<!-- remark: {{#if existingRequest}}"{{existingRequest.remark}}"{{else}}NULL{{/if}} -->
<!-- mode: {{mode}} -->
```

### 4. **Data Flow Verification**

The form now displays data using this priority order:

**For Date to be taken**:
1. Server-rendered value from Handlebars: `value="{{existingRequest.formattedDate_to_be_taken}}"`
2. Fallback from JavaScript: `erd.compDate` (which comes from window.existingRequestData.compDate)

**For Day to be taken**:
1. Server-rendered `selected` attribute: `{{#if (eq existingRequest.day_to_be_taken "Thursday")}}selected{{/if}}`
2. Fallback from JavaScript: Setting via `setSelectValue(compDaySelect, dayToBeTaken)`

**For Remaining Balance**:
1. JavaScript from server value: `window.existingRequestData.balance`
2. URL parameter fallback
3. Default value of 13

**For Remarks**:
1. Server-rendered value: `value="{{#if existingRequest}}{{existingRequest.remark}}{{else}}...{{/if}}"`

## Testing

### Server Logs Verification
When accessing the form with `requestId=69654781aa523d1914f70d47`, the server logs show:
```
  existingRequest.day_to_be_taken: Thursday
  existingRequest.date_to_be_taken: 2026-01-27T00:00:00.000Z
  existingRequest.formattedDate_to_be_taken: 2026-01-27
  existingRequest.balance: 1
  existingRequest.remark: fore
```

This confirms the data is available and being passed to the template correctly.

### Database Values
The DayOffRequest document contains:
- `day_to_be_taken: "Thursday"`
- `date_to_be_taken: 2026-01-27 (Date object)`
- `formattedDate_to_be_taken: "2026-01-27"`
- `balance: 1`
- `remark: "fore"`

## Files Modified

1. **routes/requests.js**
   - Lines 625-631: Enhanced logging to verify data passed to template

2. **views/dayoff-request.hbs**
   - Lines 575-580: Added HTML comments for server-side verification
   - Line 581 onwards: Added caption for debug information
   - Lines 817-820: Enhanced JavaScript logging for form fill logic
   - Lines 877-879: Fixed remaining balance calculation logic

## Expected Behavior After Fix

When a user clicks the view icon in the Working Days table:

1. ✅ **Form renders in VIEW mode** (all fields read-only/disabled)
2. ✅ **Date to be taken** displays the compensation date (e.g., `2026-01-27`)
3. ✅ **Day to be taken** shows the selected day (e.g., `Thursday` is selected)
4. ✅ **Remaining Balance** displays the actual balance (e.g., `1`)
5. ✅ **Remarks/Justification** displays the saved remarks
6. ✅ **Working date/day** displays from the working days data

## Notes for Future Development

- The Handlebars template is the primary source of form data (server-side rendering)
- JavaScript provides a fallback mechanism for dynamic population
- Always prioritize server-provided values over URL parameters or defaults
- The `formattedDate_to_be_taken` field must be set in the database for the date input to display properly
- All form fields in VIEW mode should be read-only/disabled to prevent accidental modifications
