# Fix: Day to be Taken and Date to be Taken Fields Now Properly Display

## Problem
When clicking the view icon (👁️) in the "Pending Requests" table on `/requests`, the form was opening but the "Day to be taken" and "Date to be taken" fields remained empty, even though the data existed in the table.

## Root Cause Analysis

The issue had two parts:

### Part 1: Data Extraction from Table Row
The view button handler was not properly extracting the `day_to_be_taken` and `date_to_be_taken` values from the table row data attributes.

### Part 2: Form Population in dayoff-request.hbs
The form had two issues:
1. The `<input type="date">` for compensation date (`class="compensation-date"`) wasn't being properly populated with the `formattedDate_to_be_taken` value
2. The `<select>` for compensation day (`class="compensation-day"`) was storing the value in a `data-value` attribute instead of setting it as the selected option

## Solutions Implemented

### Fix 1: Updated Data Attributes in requests.hbs Table Row (Line 20)
Added comprehensive data attributes to store all request information:
```html
<tr data-request-id="{{this._id}}" 
    data-working-day="..." 
    data-working-date="..." 
    data-day-to-be-taken="..." 
    data-date-to-be-taken="..."
    ...>
```

### Fix 2: Updated View Button Handler in requests.hbs (Lines 383-425)
Rewrote the handler to extract data from row attributes and properly format dates:
```javascript
const dayToBeTaken = row.dataset.dayToBeTaken || '';
const compensationDate = row.dataset.dateToBeTaken || '';
const dateToBeTaken = compensationDate ? new Date(compensationDate).toISOString().split('T')[0] : '';
```

### Fix 3: Enhanced Route Handler in routes/requests.js (Lines 454-473)
Ensured that when `requestData` is passed via URL parameter, the `existingRequest` object includes:
- `day_to_be_taken` - the day name
- `date_to_be_taken` - the date as a Date object
- `formattedDate_to_be_taken` - the date formatted as YYYY-MM-DD string
- `working_day` and `working_day_date` - working day information

```javascript
const formattedCompensationDate = dateObj.toISOString().split('T')[0];
existingRequest = {
  day_to_be_taken: requestData.dayToBeTaken || requestData.workingDay,
  formattedDate_to_be_taken: formattedCompensationDate,
  ...
};
```

### Fix 4: Fixed Select Element in dayoff-request.hbs (Lines 607-618)
Changed from using `data-value` attribute to properly setting the `selected` attribute on the correct option:
```html
<select class="compensation-day" required {{#if existingRequest}}disabled{{/if}}>
  <option value="">Select Day</option>
  <option value="Monday" {{#if existingRequest}}{{#if (eq (or existingRequest.day_to_be_taken existingRequest.day) "Monday")}}selected{{/if}}{{/if}}>Monday</option>
  <option value="Tuesday" {{#if existingRequest}}{{#if (eq (or existingRequest.day_to_be_taken existingRequest.day) "Tuesday")}}selected{{/if}}{{/if}}>Tuesday</option>
  ... (all days)
</select>
```

### Fix 5: Enhanced Logging in dayoff-request.hbs (Lines 749-831)
Added comprehensive console logging to debug data flow and identify issues easily during testing.

## Files Modified
1. [views/requests.hbs](./views/requests.hbs)
   - Line 20: Added data attributes to table row
   - Lines 383-425: Updated view button handler with proper logging
   
2. [routes/requests.js](./routes/requests.js)
   - Lines 454-473: Enhanced existingRequest object creation to properly set all compensation fields
   
3. [views/dayoff-request.hbs](./views/dayoff-request.hbs)
   - Lines 607-618: Fixed compensation-day select to properly set selected option
   - Lines 749-831: Enhanced logging for debugging

## Data Flow
```
requests.hbs table row
    ↓ (via data attributes)
View button handler
    ↓ (extracts dayToBeTaken, dateToBeTaken)
URL parameter: /requests/dayoff-request?requestData={...}
    ↓ (passed to route handler)
routes/requests.js GET /dayoff-request
    ↓ (creates existingRequest with all fields)
dayoff-request.hbs template
    ↓ (renders form with:)
- compensation-date input (readonly, value set from formattedDate_to_be_taken)
- compensation-day select (disabled, correct option marked as selected)
```

## Testing Checklist
- ✅ Click view icon on any pending request
- ✅ Form opens with "Day to be taken" field populated
- ✅ Form opens with "Date to be taken" field populated
- ✅ Fields are read-only for existing requests
- ✅ All other fields display correctly
- ✅ Team Leader and Manager approval statuses show correctly

## Benefits
- **Complete Data Display**: All request information now properly displays
- **User-Friendly**: Form fields are pre-filled for easy review
- **Accessible**: Read-only fields prevent accidental editing of displayed requests
- **Debuggable**: Enhanced logging makes troubleshooting easier
- **Maintainable**: Clear separation of concerns between data extraction, routing, and template rendering
