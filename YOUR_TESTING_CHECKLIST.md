# 🎯 YOUR TESTING CHECKLIST - Remaining Balance Fix

**Status:** ✅ Backend verified & working perfectly  
**Next:** User testing in browser  
**Server:** Running at http://localhost:3000  

---

## Pre-Test Setup

- [ ] Server is running (`npm start`)
- [ ] Browser ready (Chrome, Firefox, Edge, etc.)
- [ ] Have employee account (yousef@example.com)
- [ ] Know your working days balance

---

## Testing Steps (Copy These)

### Step 1: Open Application
```
Go to: http://localhost:3000
Press Enter
```
- [ ] Page loads successfully
- [ ] You see login form

### Step 2: Login
```
Email: yousef@example.com
Password: [your password]
Click: Login
```
- [ ] Login successful
- [ ] Dashboard appears
- [ ] Navigate to "Requests" (top menu)

### Step 3: Check Your Working Days
```
You should see a table with your available working days
Look for: Working Date │ Working Day │ Balance
```
- [ ] You see working days listed
- [ ] Each day shows a balance (1.5, 2.0, etc.)
- [ ] Can see total balance

### Step 4: Request Days
```
Method 1: Click a working day row
Method 2: Click "Request Days" button
```
- [ ] Form opens
- [ ] **LOOK FOR**: New yellow column "Days Being Used" ← This is the fix!

### Step 5: Inspect the Form
```
The form should look like:

Working Date │ Working Day │ Compensation Date │ Remarks │ Days Being Used
─────────────┼─────────────┼──────────────────┼─────────┼─────────────────
[📅]         │ [Select]    │ [📅]              │ [Text]  │ 1.5 days ← NEW!
[📅]         │ [Select]    │ [📅]              │ [Text]  │ 0.5 days ← NEW!
```

**Check these boxes:**
- [ ] "Days Being Used" column exists (yellow background)
- [ ] Shows first day amount (e.g., 1.5)
- [ ] Shows second day amount (e.g., 0.5)
- [ ] Numbers are clear and visible

### Step 6: Fill Compensation Details
```
For each row, fill:
├─ Compensation Date: Pick a future date
├─ Day to be taken: Select a day of week
└─ Remarks: Add any comments
```
- [ ] Compensation dates filled
- [ ] Days selected
- [ ] Remarks added (or leave blank)

### Step 7: Submit Form
```
Click: [Submit] button
```
- [ ] Form submits without errors
- [ ] Page redirects back to requests table

### Step 8: CRITICAL - Check Remaining Balance
```
After redirect, look at your working days table:

You should see:
├─ Days with 0 remaining: GONE (hidden) ✓
├─ Days with balance > 0: APPEAR (visible) ✓
└─ Balance shown correctly: 1.0 (or 1.5, etc.) ✓
```

**Check these boxes:**
- [ ] Table appears after redirect
- [ ] Days fully used (0 remaining) are GONE ✓
- [ ] Days with remaining balance APPEAR ✓
- [ ] Remaining balance shows correct amount
- [ ] Can see the exact value (1.0, not hidden)

---

## Expected Behavior by Scenario

### Scenario A: 2 Days (1.5 each), Request 2
**Before submission:**
```
Form shows:
├─ Day 1: Days Being Used = 1.5
└─ Day 2: Days Being Used = 0.5
```

**After submission:**
```
Table shows:
├─ Day 1: GONE (0 remaining)
└─ Day 2: 1.0 remaining ✓
```

### Scenario B: 3 Days (1.5, 1.5, 2.0), Request 2
**Before submission:**
```
Form shows:
├─ Day 1: Days Being Used = 1.5
└─ Day 2: Days Being Used = 0.5
```

**After submission:**
```
Table shows:
├─ Day 1: GONE (0 remaining)
├─ Day 2: 1.0 remaining ✓
└─ Day 3: 2.0 unchanged ✓
```

### Scenario C: 1 Day (1.5), Request 1
**Before submission:**
```
Form shows:
└─ Day 1: Days Being Used = 1.0
```

**After submission:**
```
Table shows:
└─ Day 1: 0.5 remaining ✓
```

---

## What You'll See in Browser Console (F12)

### When Form Opens
Press F12 → Console tab, look for:
```
Set daysUsedDisplay to: 1.5
Set daysUsedDisplay to: 0.5
Populating working day data with 2 items
```

### When You Submit
```
Total rows in table: 2
Row 0:
  - ID: 507f1f77bcf86cd799439011
  - Days Used (from data-days-used): 1.5

Row 1:
  - ID: 507f1f77bcf86cd799439012
  - Days Used (from data-days-used): 0.5
```

- [ ] Console shows these messages
- [ ] No red error messages
- [ ] All values make sense

---

## Success Criteria

✅ **ALL of these must be true:**

1. **Form has "Days Being Used" column** (yellow)
2. **Column shows exact amounts** (1.5, 0.5, etc.)
3. **Form submits** without errors
4. **Remaining balance appears** in table
5. **Calculation is correct** (original - used = remaining)
6. **Days with 0 balance** are hidden
7. **Console has no errors**

---

## Troubleshooting

### Problem: No "Days Being Used" Column
```
Solutions:
1. Hard refresh browser: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)
2. Clear browser cache
3. Close browser completely and reopen
4. Try different browser (Chrome, Firefox)
```
- [ ] Tried hard refresh
- [ ] Still doesn't appear?

### Problem: Wrong Numbers in Column
```
Solutions:
1. Check console (F12) for "Set daysUsedDisplay to:" messages
2. Verify those numbers match your working days
3. Reload page and try again
```
- [ ] Checked console messages
- [ ] Numbers look right?

### Problem: Remaining Balance Missing from Table
```
Solutions:
1. Check server terminal for errors
2. Verify form submitted (check POST request)
3. Look for "Deducting X days" message in server logs
4. Restart server: npm start
```
- [ ] Checked server logs
- [ ] No errors shown?

### Problem: Wrong Remaining Balance Value
```
Solutions:
1. Verify calculation: Original - Used = Remaining
   Example: 1.5 - 0.5 = 1.0
2. Check form column shows correct daysUsed
3. Restart server
```
- [ ] Verified calculation
- [ ] Numbers add up correctly?

---

## Help Needed?

If something doesn't work, collect this information:

### Screenshot Needed
- [ ] Form with "Days Being Used" column (if visible)
- [ ] Table after submission
- [ ] Any error messages

### Console Logs Needed (F12)
- [ ] Copy all messages shown in console
- [ ] Include any error messages (red text)
- [ ] Share the "Days Used" values shown

### Server Logs Needed
- [ ] Copy terminal output when you submit
- [ ] Include any error messages
- [ ] Share the "Deducting X days" messages

---

## Quick Reference

| Action | Expected | Check |
|--------|----------|-------|
| Open form | Shows yellow column | [ ] |
| Column content | Shows 1.5, 0.5 values | [ ] |
| Submit form | No errors | [ ] |
| Redirect | Back to table | [ ] |
| Table shows | Remaining day visible | [ ] |
| Balance correct | Shows 1.0 or expected value | [ ] |

---

## Success Indicators

### ✅ You'll Know It's Working When:

1. Form clearly shows amounts being used
2. After submitting, you see remaining balance in table
3. Values are correct (1.5 - 0.5 = 1.0)
4. Console has no red errors
5. Behavior matches expected scenario

---

## Test Duration

- **Setup:** < 1 minute
- **Testing:** 5-10 minutes
- **Verification:** 2-3 minutes
- **Total:** ~15 minutes

---

## Ready to Test?

1. ✅ Make sure server is running
2. ✅ Open http://localhost:3000
3. ✅ Login
4. ✅ Go to /requests
5. ✅ Request days
6. ✅ Look for yellow column
7. ✅ Submit form
8. ✅ Check remaining balance in table

**Let's verify the fix works!** 🚀

---

## After Testing

Share results:
- What you saw in the form
- Whether remaining balance appeared
- Any errors or unexpected behavior
- Browser and operating system

**We're ready to help if you need it!** ✅
