# Quick Test: Single Day Balance Fix

## The Issue (Now Fixed)
Users with **only 1 working day** couldn't submit a day-off request.
Users with **2+ days** could submit fine.

## Why It Happened
The code counted days (1, 2, 3...) but ignored their fractional balances (1.5, 0.5, etc.).
So 1 day with 1.5 balance was treated as needing only 1 balance unit, leaving 0.5.
Then validation failed: 0.5 remaining < 1 required.

## Test Now (5 minutes)

### Setup
```
1. npm start
2. Open http://localhost:3000/requests
3. Find/create a user with 1 working day that has balance=1.5 (or any fractional)
```

### Test Single Day
```
1. Check the checkbox for that 1 day
2. Click "Request DayOff"
3. Fill in form:
   - Compensation date: pick any future date
   - Compensation day: pick any day
   - Remarks: enter "test"
4. Click Submit
```

### Check Results
```
Browser console (F12):
✓ Should show: "Response status: 200"
✓ Should show: "✓ Success: ..."

Server console:
✓ Should show: "Total used balance: 1.5"
✓ Should show: "✓ Marked ... as used"

Page:
✓ Should redirect to /requests
✓ Working day should be gone
✓ Balance should be 0 or close to it
```

### What Changed
| Area | Before | After |
|------|--------|-------|
| Single day (1.5 balance) | ❌ Error | ✅ Works |
| Remaining balance calc | Uses count (1, 2, 3) | Uses actual values (1.5, 0.5) |
| Error messages | Generic | Shows specific error |
| Backend validation | 1 balance per day | Actual balance per day |

### Key Fixes
1. **Frontend** (lines 893-898): Calculate remaining balance using actual balance values
2. **Backend** (line 620): Use actual balance from database, not hardcoded 1
3. **Error handling**: Show actual error messages to user

### If Still Doesn't Work
Check browser console for the error message. Most common issues:
- Form fields not filled
- Server not running
- User doesn't have working day

The error message will now tell you exactly what's wrong!

---

**Status**: ✅ Fixed  
**Test Time**: 5 minutes  
**Files Changed**: 2 (views/dayoff-request.hbs, routes/requests.js)
