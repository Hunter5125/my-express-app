# Debugging: Working Days Not Marked as Used

## Issue Description
When a user submits a day-off request with available working days, the form shows "Request submitted successfully" but the working days are not removed from the available list. This indicates that the `WorkingDay.used` field is not being set to `true`.

## Root Cause Investigation

### Data Flow
1. **Frontend (requests.hbs)**: User selects checkboxes with working days
   - Checkbox attributes: `data-id="{{this._id}}"` (MongoDB ObjectId)
   - Checkbox data: date, day, remark, balance
   
2. **Frontend (requests.hbs)**: "Request DayOff" button click handler
   - Lines 131-149: Collects selected checkboxes into `selected` array
   - Each item has: `id`, `day`, `date`, `remark`, `balance`
   - Opens dayoff-request form with URL parameter: `selected=${JSON.stringify(selected)}`

3. **Backend (routes/requests.js GET /requests/dayoff-request)**: Lines 346-358
   - Parses `selected` query parameter from URL
   - Passes to Handlebars as `selected` variable
   - Server-side variable: `window.selectedData = {{#if selected}}{{{json selected}}}{{else}}[]{{/if}};`

4. **Frontend (dayoff-request.hbs)**: Lines 843-880
   - Receives `window.selectedData` from server
   - For each item in selectedData:
     - Sets `row.setAttribute('data-id', item.id)` (Line 866)
     - Populates working day and date fields
     - Item.id should be MongoDB ObjectId

5. **Frontend (dayoff-request.hbs)**: Lines 902-940 (Form Submission)
   - **CRITICAL**: Collects formData from table rows
   - For each row:
     - Gets compensation date/day/remarks from form inputs
     - Gets **working day ID** from `row.getAttribute('data-id')`
   - Builds two arrays:
     - `workingDays[]` - Array of {compensationDate, compensationDay, remarks}
     - `workingDayIds[]` - Array of MongoDB ObjectIds
   - POSTs to `/requests/dayoff-request` with JSON body

6. **Backend (routes/requests.js POST /requests/dayoff-request)**: Lines 554-661
   - Receives `{workingDays[], workingDayIds[], remainingBalance}`
   - Validates arrays have matching length
   - For each workingDayId:
     - Looks up WorkingDay by ID
     - Validates it exists and hasn't been used
     - Adds to `validWorkingDays[]` array
   - Creates DayOffRequest document
   - **Marks all working days as used** (Lines 653-658):
     ```javascript
     for (const workingDay of validWorkingDays) {
       workingDay.used = true;
       await workingDay.save();
     }
     ```

## Potential Issues

### Issue A: workingDayIds Array Empty or Undefined
**Symptom**: POST receives empty `workingDayIds` array
**Cause**: `row.getAttribute('data-id')` returns null or undefined
**Reason**: `data-id` attribute not set on row or set incorrectly
**Result**: validWorkingDays loop never executes, working days not marked

### Issue B: data-id Attribute Contains Wrong ID
**Symptom**: POST receives IDs but they don't match MongoDB records
**Cause**: `item.id` from selectedData is not a valid MongoDB ObjectId
**Reason**: Data not properly passed from frontend to backend
**Result**: WorkingDay.findById() fails, validation error returned

### Issue C: Working Day Lookup Fails
**Symptom**: findById returns null
**Cause**: ID doesn't exist in database OR belongs to different employee
**Result**: Returns 404 error, request not created

## Added Debugging

### Frontend Console Logging (dayoff-request.hbs lines 907-930)
Logs when form is submitted:
- Number of rows in table
- For each row:
  - data-id value
  - compensation date/day/remarks
- Final formData structure
- Count of workingDayIds and workingDays

### Backend Console Logging (routes/requests.js lines 554-661)
Logs at POST endpoint:
- Received workingDayIds array
- Array type and length
- For each working day being processed:
  - ID being looked up
  - Found status (YES/NO)
  - Day and date of working day
  - Used status
- Count of valid working days
- When working days are marked as used

## How to Test

### Manual Test Steps
1. Open browser Developer Tools (F12)
2. Navigate to /requests page
3. Select one or more working days from the table
4. Click "Request DayOff" button
5. Fill in compensation date/day/remarks
6. Click "Submit"
7. **Check browser console** for frontend logs
8. **Check server console** for backend logs

### Expected Console Output

**Frontend (Browser Console)**:
```
Total rows in table: 1
Row 0: id="<MongoDB ObjectId>", compensationDate="2024-01-15", compensationDay="Monday", remarks="test"
Final formData to send: {
  "workingDays": [...],
  "workingDayIds": ["<ObjectId>"],
  "remainingBalance": 1.5
}
workingDayIds count: 1
workingDays count: 1
```

**Backend (Server Console)**:
```
========== POST /requests/dayoff-request ==========
User: Yousef
Received workingDayIds: ["<ObjectId>"]
workingDayIds type: Array
workingDayIds length: 1
Received workingDays: [...]
Received remainingBalance: 1.5

Processing working day 1:
  ID: <ObjectId>
  CompensationDate: 2024-01-15
  CompensationDay: Monday
  Remarks: test
  WorkingDay found: YES
  Working Day: Thursday 2024-01-11, used: false
  ✓ Valid - added to validWorkingDays

Total valid working days: 1
Total used balance: 1

...
✓ Request saved with ID: <RequestId>

Marking 1 working days as used...
  ✓ Marked Thursday 2024-01-11 as used

========== Request completed successfully ==========
```

## Verification Query

To verify working days are marked in database:
```javascript
db.workingdays.find({ employee: ObjectId("..."), used: true })
```

Should show the marked working days with `used: true`.

## Next Steps

1. Run manual test with console open
2. Check both frontend and backend logs
3. Compare workingDayIds sent vs database IDs
4. If workingDayIds is empty, check if data-id attribute is being set correctly
5. If ID mismatch, trace data from requests.hbs checkbox to dayoff-request.hbs population
