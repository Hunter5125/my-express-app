# Working Days Balance Update - Complete Solution

## The Issue

When user requests days off:
- System selects multiple working days using smart allocation
- Days are partially used (e.g., Day 1 uses 1.5 of 1.5, Day 2 uses 0.5 of 1.5)
- Backend updates balances (Day 1 → 0, Day 2 → 1.0)
- **Expected**: Day 2 should appear in table with 1.0 remaining balance
- **Actual**: Days were not appearing correctly (or disappearing completely)

## Root Cause Analysis

1. **Floating Point Arithmetic**: JavaScript/Node.js floating point math can produce values like 0.9999999999 instead of 1.0
2. **Balance Tracking**: Form wasn't sending the exact `daysUsed` for each working day
3. **Logging**: Insufficient logging made it hard to debug

## Solution Implemented

### 1. Enhanced Form Submission (views/dayoff-request.hbs)
Added detailed logging when collecting form data:
```javascript
console.log(`Row ${rowIndex}:`);
console.log(`  id="${id}"`);
console.log(`  data-days-used="${daysUsedAttr}" (parsed as: ${daysUsed})`);
console.log(`  compensationDate="${compensationDate}"`);
console.log(`  compensationDay="${compensationDay}"`);
console.log(`  remarks="${remarks}"`);
```

This shows exactly which days are being used and in what amounts.

### 2. Smart Allocation (views/requests.hbs)
The allocation algorithm correctly calculates `daysUsed` for each working day:
- **Strategy 1**: Prefer complete days (use a single day if possible)
- **Strategy 2**: FIFO split (if no complete day, split from oldest to newest)

Example:
- Request 2 days with Day1 (1.5) + Day2 (1.5)
- Result: Use 1.5 from Day1, use 0.5 from Day2
- Form gets: `{daysUsed: 1.5}, {daysUsed: 0.5}`

### 3. Backend Balance Update (routes/requests.js)
Enhanced with precise calculations and extensive logging:

```javascript
// Round to 2 decimals to avoid floating point errors
wd.balance = parseFloat((wd.balance - amountUsed).toFixed(2));

if (wd.balance <= 0) {
  wd.used = true;
  wd.balance = 0;
  console.log(`  → Marked as used`);
} else {
  console.log(`  → Still available (${wd.balance} remaining)`);
}
```

**Key Logic**:
- Only mark day as `used: true` if balance ≤ 0
- Days with balance > 0 remain in the table with updated balance
- Floating point errors fixed with `.toFixed(2)` and `parseFloat()`

### 4. Comprehensive Logging

**Form Level** (Browser Console - F12):
```
Row 0:
  id="123456789"
  data-days-used="1.5" (parsed as: 1.5)
  compensationDate="2025-12-25"
  compensationDay="Friday"
  remarks="Reason for day off"
```

**Backend Level** (Server Console):
```
Working day 0: Monday
  Original balance: 1.5
  Amount used (daysUsed): 1.5
  New balance: 0
  → Marked as used (balance <= 0)
  ✓ Saved to database

Working day 1: Wednesday
  Original balance: 1.5
  Amount used (daysUsed): 0.5
  New balance: 1
  → Still available (balance > 0)
  ✓ Saved to database
```

## Expected Behavior After Fix

### Scenario: Request 2 Days
**Before Request**:
- Monday: 1.5 days
- Wednesday: 1.5 days
- Total: 3.0 days

**Request**: 2 days

**Allocation**:
- Use 1.5 from Monday (all of it) ← Uses 1.5
- Use 0.5 from Wednesday (partial) ← Uses 0.5
- Total requested: 2.0 ✓

**After Request (in Table)**:
- Monday: **REMOVED** (balance = 0)
- Wednesday: **STAYS** with 1.0 remaining
- Total: 1.0 days

**Remaining Balance**: 1.0 ✓

### Scenario: Request 1 Day (Complete Day Available)
**Before Request**:
- Monday: 0.5 days
- Wednesday: 1.5 days
- Total: 2.0 days

**Request**: 1 day

**Allocation** (Smart):
- Strategy 1: Find complete day → Wednesday has 1.5 ✓
- Use 1.0 from Wednesday only

**After Request (in Table)**:
- Monday: **STAYS** with 0.5 remaining
- Wednesday: **STAYS** with 0.5 remaining
- Total: 1.0 days

**Remaining Balance**: 1.0 ✓

## How to Test

1. **Create test data**:
   ```bash
   node test-add-working-days.js
   ```
   This creates:
   - Day 1 (Dec 15): 1.5 balance
   - Day 2 (Dec 17): 1.5 balance
   - Total: 3.0

2. **Request 2 days**:
   - Open browser F12 (Developer Tools)
   - Go to Requests page
   - Request 2 days
   - Check console logs for form data
   - Check server logs for backend updates

3. **Verify in Table**:
   - Only Day 2 should appear (with 1.0 remaining)
   - Day 1 should be gone (balance = 0)

4. **Verify Balance**:
   - Remaining balance display should show 1.0
   - Table footer should show "Balance: 1.0"

## Files Modified

1. **views/dayoff-request.hbs**
   - Enhanced form submission logging
   - Better tracking of daysUsed values

2. **routes/requests.js**
   - Added floating point rounding (`.toFixed(2)`)
   - Added detailed backend logging
   - Verified balance update logic

3. **views/requests.hbs**
   - Two-strategy smart allocation
   - Comprehensive console logging

## Debugging Tips

If working days still don't appear after submission:

1. **Check Server Logs**:
   ```
   Working day 0: Monday
     Original balance: 1.5
     Amount used: 1.5
     New balance: 0
   ```
   Look for the "Amount used" - if it's wrong, the form isn't sending correct daysUsed.

2. **Check Browser Console** (F12):
   ```
   Row 0: id="...", data-days-used="1.5"
   ```
   If data-days-used is "1" when it should be "1.5", the form population is wrong.

3. **Check Database**:
   ```bash
   node test-users.js  # Shows all users
   node test-balance.js  # Shows working days per user
   ```

4. **Enable Verbose Logging**:
   The code now logs every step. Check:
   - Browser console for form submission
   - Server console for database updates
