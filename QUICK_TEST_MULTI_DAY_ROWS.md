# Quick Test: Multi-Day Request Form

## ✅ Fix Applied
The form now shows all required rows for multi-day requests.

## How to Test (in Browser)

### Quick Test with 3 Days:
1. **Login** as `yousef@example.com` password: `password`
2. **Click** "Request DayOff" button
3. **Enter** `3` in the "How many days do you want to take?" field
4. **Click** "Request Days"
5. **Verify** the form shows **3 rows** in the table

### Expected Result:
✅ **Before Fix:** Only 2 rows showing  
✅ **After Fix:** All 3 rows showing

### Test with Other Numbers:
- Request 2 days → Should show 2 rows
- Request 4 days → Should show 4 rows  
- Request 1.5 days → Should show 2 rows (1 full + 0.5 fractional)

## Browser Console Verification
Open Developer Tools (F12) and check Console tab for logs:
```
Request breakdown: whole=3, fractional=0, total=3
Row 0: daysUsed=1.5, accumulated=1.5, total needed=3
  Row 0 is EDITABLE (part of first 3 whole day(s))
Row 1: daysUsed=1.5, accumulated=3.0, total needed=3
  Row 1 is EDITABLE (part of first 3 whole day(s))
Row 2: daysUsed=..., accumulated=3.X, total needed=3
  Row 2 is READ-ONLY (part of fractional remainder)
Showing 3 rows, making 2 editable (need 3 days)
```

The key line is: **"Showing 3 rows"** should match your request.

## Technical Details

**Changed:** `if (accumulatedDays >= totalDaysRequested)` → `if (accumulatedDays > totalDaysRequested)`

**Why:** The `>=` operator would break the loop as soon as accumulated days equaled the requested total, preventing the last row from being shown. Changed to `>` so it only breaks when we EXCEED the requested amount.

**Impact:** 
- ✅ Requests for 2, 3, 4+ days now show all rows
- ✅ Mixed-balance days (1.5 + 1.5) now calculate correctly
- ✅ Form remains flexible based on actual balance data

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Still showing only 2 rows | Hard refresh browser (Ctrl+F5) to clear cache |
| Form not loading | Check browser console (F12) for errors |
| Different rows showing | This is normal - depends on your available working days |

## Related Files
- Fix: `/views/dayoff-request.hbs` (line 2016)
- Commits: `8e63e16`, `fc4983d`
