# Testing Guide: Working Days Marking

## Quick Test Steps

### Prerequisites
- Application running (`npm start`)
- Logged in as an employee user with available working days
- Browser developer tools open (F12)

### Test Procedure

#### 1. Check Available Working Days
1. Navigate to `/requests` page
2. Look at "Available Working Days" table
3. Note the number of working days available (e.g., "1 day available")

#### 2. Submit Day-Off Request
1. **Select Working Day**: Check the checkbox next to a working day
2. **Click "Request DayOff"** button
3. New tab/window opens with day-off request form
4. **Fill in Form**:
   - Compensation Date: Select a date (e.g., 2024-01-15)
   - Compensation Day: Select a day (e.g., "Monday")
   - Remarks: Enter something like "Compensation for work"
5. **Click "Submit"** button

#### 3. Check Browser Console (F12)
Look for logs like:
```
Total rows in table: 1
Row 0: id="507f1f77bcf36cd799439011", compensationDate="2024-01-15", compensationDay="Monday", remarks="test"
Final formData to send: {...}
workingDayIds count: 1
workingDays count: 1
```

**Key things to check:**
- Is `workingDayIds count` showing 1? (If 0, the data-id attribute wasn't set)
- Is the ID a valid MongoDB ObjectId format? (24 hex characters)

#### 4. Check Server Console
Look for logs like:
```
========== POST /requests/dayoff-request ==========
User: Yousef
Received workingDayIds: ["507f1f77bcf36cd799439011"]
workingDayIds type: Array
workingDayIds length: 1

Processing working day 1:
  ID: 507f1f77bcf36cd799439011
  WorkingDay found: YES
  Working Day: Thursday 2024-01-11, used: false
  ✓ Valid - added to validWorkingDays

Total valid working days: 1
...
✓ Request saved with ID: <RequestId>

Marking 1 working days as used...
  ✓ Marked Thursday 2024-01-11 as used

========== Request completed successfully ==========
```

**Key things to check:**
- `workingDayIds length` should be 1
- `WorkingDay found: YES` (if NO, the ID doesn't match)
- `Marking 1 working days as used...` appears (shows the code executed)

#### 5. Verify Working Day is Marked
1. Redirect happens automatically to `/requests` page
2. Check "Available Working Days" table again
3. **Expected Result**: The working day should be gone or show as used
4. **Actual Result**: If it's still there, the marking failed

### Troubleshooting

#### Symptom: workingDayIds count is 0
**Problem**: No IDs being collected from form
**Check**:
1. Browser console shows `Row 0: id="undefined"` or `id=""` 
2. The data-id attribute is not being set on the table row
3. Check dayoff-request.hbs line 866: `row.setAttribute('data-id', item.id);`
4. Verify item.id is coming from selectedData

#### Symptom: WorkingDay found: NO
**Problem**: The ID doesn't exist in the database
**Check**:
1. The ID format in console: should be 24 hex characters like `507f1f77bcf36cd799439011`
2. If it's a different format, data is not passing correctly through the URL
3. Check requests.hbs line 59: checkbox has `data-id="{{this._id}}"`

#### Symptom: Marking code runs but working day not marked
**Problem**: The save() call is failing silently or transaction rolled back
**Check**:
1. Check MongoDB logs for any errors
2. Verify working day document still exists
3. Check if user owns the working day (employee field matches)

### Database Verification

To manually check if working days are marked:

```bash
# Connect to MongoDB
mongosh

# Switch to database
use dayoff

# Check working days for an employee
db.workingdays.find({ employee: ObjectId("<employee_id>"), used: false })
# Should return fewer documents after request submission

# Check marked working days
db.workingdays.find({ employee: ObjectId("<employee_id>"), used: true })
# Should show the marked working day

# Get employee ID
db.users.findOne({ name: "Yousef" })._id
```

### Manual Test Case

**Test Scenario**: Employee with 1.5 days available
1. Creates request for 1 working day
2. Expected: 0.5 days remaining, marked day removed from list
3. Try to create another request for the same day
4. Expected: Error "Working day has already been used"

### Test Results Template

```
Date: YYYY-MM-DD
Tester: [Your Name]
User: [Employee Name]
Initial Balance: [X days]

Test 1: Single Day Request
- Working days available before: [Y]
- Submit request for: [1 day]
- Browser console workingDayIds count: [1/0]
- Server console WorkingDay found: [YES/NO]
- Working day marked as used: [✓/✗]
- Working days available after: [Should be Y-1 or still Y]
- Result: [PASS/FAIL]

Test 2: Multiple Days Request
- Working days available before: [Y]
- Submit request for: [2 days]
- Browser console workingDayIds count: [2/0]
- Server console valid working days: [2/0]
- Working days marked as used: [✓/✗]
- Working days available after: [Should be Y-2]
- Result: [PASS/FAIL]

Notes: [Any observations]
```
