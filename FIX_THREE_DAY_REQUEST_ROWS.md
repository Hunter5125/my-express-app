# Fix: Multi-Day Request Form Rows

## Problem
When requesting 3 days, the form was showing only 2 rows instead of 3 rows.

## Root Cause
In `views/dayoff-request.hbs`, the loop that calculates how many rows to show had an off-by-one error:

```javascript
if (accumulatedDays >= totalDaysRequested) {
  break;  // This broke WHEN EQUAL, not AFTER exceeding
}
```

**Example with 3-day request:**
- Row 0: 1.5 days → accumulated = 1.5, rowsToShow = 1, continue
- Row 1: 1.5 days → accumulated = 3.0, rowsToShow = 2, **BREAK** ❌ (should continue to show all rows up to requirement)

The condition `>=` meant it would break as soon as the accumulated days equaled the requested days, cutting off 1 row.

## Solution
Changed the condition from `>=` to `>`:

```javascript
if (accumulatedDays > totalDaysRequested) {
  break;  // Only break if we EXCEED what's needed
}
```

**Now with 3-day request:**
- Row 0: 1.5 days → accumulated = 1.5, rowsToShow = 1, 1.5 > 3? NO → continue
- Row 1: 1.5 days → accumulated = 3.0, rowsToShow = 2, 3.0 > 3? NO → continue  
- Row 2: X days → accumulated = 3.X, rowsToShow = 3, 3.X > 3? YES → break ✅

Now the form correctly shows all rows needed to fulfill the request.

## Files Modified
- `views/dayoff-request.hbs` (line 2016)

## How to Test
1. Login as any employee
2. Request 3 days off
3. Form should now show **3 rows** instead of 2

## Commit
- Commit: `8e63e16`
- Message: "Fix: Show all required rows for multi-day requests (not just up to requested balance)"
