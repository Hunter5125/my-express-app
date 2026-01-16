# Fix: Working Days Table - View Button Shows Day/Date to be Taken

## Problem
When clicking the view icon (👁️) in the "Working Days" table on the `/requests` page, the form modal was not showing:
- **Day to be taken**
- **Date to be taken**

Only the working day information and other fields were being displayed.

## Root Cause
The view button handler in `views/requests.hbs` was trying to extract data directly from table cell text content using cell indices, which was fragile and error-prone. The data for "Day to be taken" and "Date to be taken" was not being properly extracted from the row because:

1. The table row didn't have proper data attributes storing the `day_to_be_taken` and `date_to_be_taken` values
2. The JavaScript handler was using hardcoded cell indices to extract data, which would fail if column order changed
3. The extracted values weren't being passed correctly to the modal form

## Solution
Made two key changes to [views/requests.hbs](./views/requests.hbs):

### 1. **Added Data Attributes to Table Row** (Lines 20-21)
Added the missing data attributes to the table row that holds all the request information:
```html
<tr data-request-id="{{this._id}}" 
    data-working-day="..." 
    data-working-date="..." 
    data-day-to-be-taken="{{#if this.day_to_be_taken}}{{this.day_to_be_taken}}{{else if this.day}}{{this.day}}{{else}}N/A{{/if}}" 
    data-date-to-be-taken="{{#if this.date_to_be_taken}}{{this.date_to_be_taken}}{{else if this.date}}{{this.date}}{{else}}{{/if}}" 
    data-remark="{{this.remark}}" 
    data-balance="{{../balance}}" 
    data-employee-no="{{this.employee.employeeNo}}" 
    data-team-leader-status="{{this.teamLeaderApprovalStatus}}" 
    data-manager-status="{{this.managerApprovalStatus}}">
```

### 2. **Updated View Button Handler** (Lines 449-483)
Rewrote the JavaScript handler to extract data from the row's data attributes instead of cell text:

**Before:**
```javascript
const cells = row.querySelectorAll('td');
const rawCompensationDate = cells[3].getAttribute('data-raw-date');
const dateToBeTaken = rawCompensationDate ? new Date(rawCompensationDate).toISOString().split('T')[0] : '';
const requestData = {
  _id: this.dataset.id,
  workingDay: cells[0].textContent.trim(),
  workingDayDate: workingDayDate,
  dayToBeTaken: cells[2].textContent.trim(),  // ❌ Wrong index, fragile
  dateToBeTaken: dateToBeTaken,
  // ...
};
```

**After:**
```javascript
const row = this.closest('tr');
const workingDay = row.dataset.workingDay || '';
const workingDate = row.dataset.workingDate || '';
const dayToBeTaken = row.dataset.dayToBeTaken || '';  // ✅ Direct from data attribute
const compensationDate = row.dataset.dateToBeTaken || '';  // ✅ Direct from data attribute
const requestData = {
  _id: this.dataset.id,
  workingDay: workingDay,
  workingDayDate: workingDayDate,
  dayToBeTaken: dayToBeTaken,
  dateToBeTaken: dateToBeTaken,
  // ...
};
```

## Data Flow
1. **requests.hbs** table stores request data in row attributes from the DayOffRequest model
2. User clicks view (👁️) button
3. JavaScript extracts all data from `row.dataset`
4. Data is JSON encoded and passed to `/requests/dayoff-request` page
5. **dayoff-request.hbs** parses the data and populates form fields:
   - `.compensation-day` select ← `dayToBeTaken`
   - `.compensation-date` input ← `dateToBeTaken`

## Files Modified
- [views/requests.hbs](./views/requests.hbs)
  - Added data attributes to pending requests table row (lines 20-21)
  - Updated `attachViewRequestBtnListeners()` function (lines 449-483)

## Testing
1. Navigate to `/requests` page
2. In "Pending Requests" table, click the view icon (👁️) on any row
3. Verify the form modal opens with all fields populated:
   - ✅ Working Day
   - ✅ Working Day Date
   - ✅ **Day to be taken** (NOW FIXED)
   - ✅ **Date to be taken** (NOW FIXED)
   - ✅ Remark
   - ✅ Remaining Balance
   - ✅ Team Leader Approval Status
   - ✅ Manager Approval Status

## Benefits
- **Reliable**: Data is now stored in attributes rather than relying on cell indices
- **Maintainable**: If table columns change, data extraction still works
- **Complete**: All request information is now properly displayed
- **Scalable**: Pattern works for any number of requests
