# Data Flow Diagram - Working Days Marking System

## 📊 Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER JOURNEY                              │
└─────────────────────────────────────────────────────────────────┘

[1] SELECTION PHASE (requests.hbs)
┌────────────────────────────────────────┐
│ Working Days Table                      │
│ ┌──────────────────────────────────┐   │
│ │ Day: Thursday                    │   │
│ │ Date: 2024-01-11                 │   │
│ │ Remark: Initial work             │   │
│ │ ☑ [checkbox data-id="507f..."] │   │
│ └──────────────────────────────────┘   │
└─────────────────┬──────────────────────┘
                  │
                  ▼ Click "Request DayOff"
                  
┌─────────────────────────────────────────┐
│ requestBtn.onclick:                     │
│ - Collect selected checkboxes           │
│ - Build: selected = [{                  │
│     id: "507f...",                      │
│     day: "Thursday",                    │
│     date: "2024-01-11",                 │
│     remark: "...",                      │
│     balance: 1.5                        │
│   }]                                    │
│ - Open: /requests/dayoff-request?       │
│   selected=${encoded_json}              │
└─────────────────┬──────────────────────┘
                  │
                  ▼ New Tab/Window

[2] FORM POPULATION PHASE (dayoff-request.hbs)
┌─────────────────────────────────────────┐
│ GET /requests/dayoff-request            │
│ - Parse URL: selected=${json}           │
│ - Server: selected = [{id, day, ...}]   │
│ - Render: Pass to template              │
│   window.selectedData = ${json}         │
└─────────────────┬──────────────────────┘
                  │
                  ▼ JavaScript Execution
                  
┌─────────────────────────────────────────┐
│ dayoff-request.hbs lines 843-880:       │
│ For each item in selectedData:          │
│ - Clone table row                       │
│ - Set: row.setAttribute(                │
│       'data-id', item.id)  ◄── KEY!     │
│ - Populate: date, day fields            │
│ - Show form to user                     │
└─────────────────┬──────────────────────┘
                  │
                  ▼ User Fills Form
                  
┌─────────────────────────────────────────┐
│ User Input:                             │
│ ┌───────────────────────────────────┐  │
│ │ Working Date: 2024-01-11          │  │
│ │ Working Day: Thursday             │  │
│ │ Comp. Date: 2024-01-15 [input]   │  │
│ │ Comp. Day:  Monday     [select]  │  │
│ │ Remarks:    Work done  [input]   │  │
│ │ Balance:    1.5                   │  │
│ │ [SUBMIT BUTTON]                   │  │
│ └───────────────────────────────────┘  │
└─────────────────┬──────────────────────┘
                  │
                  ▼ Click Submit

[3] FORM SUBMISSION PHASE (dayoff-request.hbs lines 902-939)
┌─────────────────────────────────────────────────────────┐
│ submitBtn.onclick:                                      │
│                                                         │
│ LOG: "Total rows in table: 1"                          │
│                                                         │
│ For each row in table:                                 │
│   GET: compensationDate = row.cells[2].value           │
│   GET: compensationDay = row.cells[3].value            │
│   GET: remarks = row.cells[4].value                    │
│   GET: id = row.getAttribute('data-id') ◄── CRITICAL! │
│                                                         │
│   LOG: "Row 0: id='507f...', ..."                      │
│                                                         │
│   formData.workingDays.push({                           │
│     compensationDate,                                   │
│     compensationDay,                                    │
│     remarks                                             │
│   })                                                    │
│                                                         │
│   if (id) {                                             │
│     formData.workingDayIds.push(id)                     │
│   }                                                     │
│                                                         │
│ LOG: "Final formData: {...}"                            │
│ LOG: "workingDayIds count: 1"                           │
│ LOG: "workingDays count: 1"                             │
│                                                         │
│ POST /requests/dayoff-request                           │
│ Body: {                                                 │
│   workingDays: [{...}],                                 │
│   workingDayIds: ["507f..."],   ◄── ARRAY OF IDs       │
│   remainingBalance: 1.5                                 │
│ }                                                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼ HTTP POST

[4] BACKEND PROCESSING PHASE (routes/requests.js 554-705)
┌──────────────────────────────────────────────────────────┐
│ POST /requests/dayoff-request                             │
│                                                            │
│ LOG: "========== POST /requests/dayoff-request ========"  │
│ LOG: "User: Yousef"                                       │
│ LOG: "Received workingDayIds: [507f...]"                 │
│ LOG: "workingDayIds type: Array"                          │
│ LOG: "workingDayIds length: 1"                            │
│                                                            │
│ VALIDATE: Arrays not empty?                               │
│   ✓ YES → Continue                                         │
│   ❌ NO → Error: "At least one working day must be..."   │
│                                                            │
│ VALIDATE: Arrays match length?                             │
│   ✓ YES → Continue                                         │
│   ❌ NO → Error: "Working days data doesn't match..."     │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼ For each workingDayId

┌──────────────────────────────────────────────────────────┐
│ Processing working day 1:                                 │
│                                                            │
│ LOG: "Processing working day 1:"                           │
│ LOG: "  ID: 507f..."                                       │
│ LOG: "  CompensationDate: 2024-01-15"                      │
│ LOG: "  CompensationDay: Monday"                           │
│ LOG: "  Remarks: test"                                     │
│                                                            │
│ VALIDATE: Required fields present?                         │
│   ✓ YES → Continue                                         │
│   ❌ NO → Error: "Compensation date/day/remarks required"  │
│                                                            │
│ LOOKUP: WorkingDay.findById("507f...")                     │
│ LOG: "  WorkingDay found: YES"                             │
│   ❌ NO → Error: "Working day not found"                   │
│                                                            │
│ LOG: "  Working Day: Thursday 2024-01-11, used: false"    │
│                                                            │
│ VALIDATE: Not already used?                               │
│   ✓ YES → Continue                                         │
│   ❌ NO → Error: "Working day already used"               │
│                                                            │
│ VALIDATE: Belongs to user?                                │
│   ✓ YES → Continue                                         │
│   ❌ NO → Error: "Access denied"                           │
│                                                            │
│ LOG: "  ✓ Valid - added to validWorkingDays"              │
│                                                            │
│ validWorkingDays.push(workingDay)                          │
│ totalUsedBalance += 1                                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼ After all validations

┌──────────────────────────────────────────────────────────┐
│ LOG: "Total valid working days: 1"                        │
│ LOG: "Total used balance: 1"                              │
│                                                            │
│ VALIDATE: Sufficient balance?                             │
│   ✓ YES → Continue                                         │
│   ❌ NO → Error: "Insufficient balance"                    │
│                                                            │
│ GET: User with section                                    │
│ GET: Section with supervisor and manager                  │
│ LOG: "Team leader assigned: [name]"                       │
│ LOG: "Manager assigned: [name]"                           │
│                                                            │
│ CREATE: DayOffRequest document                            │
│ {                                                           │
│   employee: req.session.user._id,                         │
│   teamLeader: supervisor._id,                             │
│   manager: manager._id,                                   │
│   workingDayIds: ["507f..."],  ◄── SAVE IDs!             │
│   status: "pending"                                        │
│   ...                                                      │
│ }                                                           │
│                                                            │
│ SAVE: request.save()                                      │
│ LOG: "✓ Request saved with ID: [id]"                      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼ CRITICAL PHASE

[5] MARKING PHASE (routes/requests.js 689-693)
┌──────────────────────────────────────────────────────────┐
│ LOG: "Marking 1 working days as used..."                  │
│                                                            │
│ For each workingDay in validWorkingDays:                  │
│                                                            │
│   workingDay.used = true        ◄── SET FLAG              │
│   workingDay.save()             ◄── SAVE TO DB             │
│                                                            │
│   LOG: "  ✓ Marked Thursday 2024-01-11 as used"          │
│                                                            │
│ ✅ ALL WORKING DAYS MARKED                                │
│                                                            │
│ LOG: "========== Request completed successfully ====="   │
│                                                            │
│ Response: {message: "Day Off Request Submitted..."}      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼ Browser receives response

[6] POST-SUBMISSION PHASE (Frontend)
┌──────────────────────────────────────────────────────────┐
│ alert("Request submitted successfully!")                  │
│                                                            │
│ window.location.href = '/requests'                        │
│                                                            │
│ Browser redirects to /requests page                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼ Page Refresh

[7] VERIFICATION PHASE (GET /requests)
┌──────────────────────────────────────────────────────────┐
│ Page queries: WorkingDay.find({                           │
│   employee: userId,                                       │
│   used: false      ◄── ONLY UNMARKED DAYS                 │
│ })                                                         │
│                                                            │
│ Display: "Available Working Days"                         │
│ ├─ Remaining: 0 (was 1, now 1 used)                       │
│ └─ Table: Empty (day was marked as used=true)             │
│                                                            │
│ ✅ SUCCESS: Working day removed from list!                │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔍 Logging Points

```
FRONTEND LOGS (Browser Console - F12)
├─ Line 917: "Total rows in table: [N]"
├─ Lines 918-923: "Row [i]: id=..., compensationDate=..., ..."
├─ Line 934: "Final formData to send: {..."
├─ Line 935: "workingDayIds count: [N]"  ◄── KEY METRIC
└─ Line 936: "workingDays count: [N]"

BACKEND LOGS (Server Console - npm start terminal)
├─ Line 558: "========== POST /requests/dayoff-request =========="
├─ Line 559: "User: [name]"
├─ Line 560: "Received workingDayIds: [...]"  ◄── DATA RECEIVED
├─ Line 561: "workingDayIds type: Array"
├─ Line 562: "workingDayIds length: [N]"     ◄── COUNT CHECK
├─ Line 565: Validation logs
├─ Line 593: "Processing working day [i]:"
├─ Line 594: "  ID: [id]"
├─ Line 600: "  WorkingDay found: YES/NO"    ◄── LOOKUP CHECK
├─ Line 602: "  Working Day: [day] [date], used: [bool]"
├─ Line 612: "  ✓ Valid - added to validWorkingDays"
├─ Line 615: "Total valid working days: [N]"
├─ Line 689: "Marking [N] working days as used..."
├─ Line 693: "  ✓ Marked [day] [date] as used"  ◄── CONFIRM
└─ Line 695: "========== Request completed successfully =========="
```

---

## 🎯 Critical Data Points

```
FRONTEND
├─ checkbox.dataset.id ──────────────────→ req.query.selected
├─ selectedData[].id ───────────────────→ row.setAttribute('data-id')
├─ row.getAttribute('data-id') ─────────→ formData.workingDayIds[]
└─ formData.workingDayIds[] ───────────→ POST body

BACKEND  
├─ req.body.workingDayIds[] ───────────→ workingDayIds variable
├─ workingDayIds[i] ──────────────────→ WorkingDay.findById()
├─ WorkingDay._id ────────────────────→ matched to ID
└─ workingDay.save({used: true}) ────→ Database update

DATABASE
├─ before: WorkingDay.used = false
└─ after:  WorkingDay.used = true
```

---

## 🚨 Failure Points

```
❌ POINT 1: data-id not set on rows
   └─ Cause: item.id from selectedData is undefined/null
   └─ Result: row.getAttribute('data-id') returns null
   └─ Log shows: workingDayIds count: 0

❌ POINT 2: ID format corruption
   └─ Cause: URL encoding/decoding issue or wrong data structure
   └─ Result: ID doesn't match database format
   └─ Log shows: workingDayIds count > 0 but WorkingDay found: NO

❌ POINT 3: Lookup fails
   └─ Cause: ID doesn't exist or belongs to wrong user
   └─ Result: WorkingDay.findById() returns null
   └─ Log shows: WorkingDay found: NO or Access denied

❌ POINT 4: Marking fails silently
   └─ Cause: save() throws error not caught
   └─ Result: workingDay.used stays false
   └─ Log shows: Error in catch block

❌ POINT 5: Display not refreshing
   └─ Cause: Page caching or display logic issue
   └─ Result: Day still shows despite being marked
   └─ Fix: Refresh page or check display code
```

---

## ✅ Success Path

```
Data collected from form
        ↓
Arrays populated correctly
        ↓
POST sent to backend
        ↓
Data received on backend
        ↓
Validation passes
        ↓
WorkingDay found in database
        ↓
Access verified
        ↓
DayOffRequest created
        ↓
working day.used = true
        ↓
Saved to database
        ↓
Response sent to frontend
        ↓
Page redirects to /requests
        ↓
GET query filters used=false
        ↓
Working day not in list
        ↓
✅ SUCCESS
```

---

## 🔄 Data Transformation

```
FORM ROW
├─ cells[0]: checkbox
├─ cells[1]: working day name
├─ cells[2]: working date (with input for compensation date)
├─ cells[3]: select for compensation day
├─ cells[4]: input for remarks
└─ data-id: "507f1f77bcf36cd799439011" ◄── KEY

FORMDATA OBJECT
├─ workingDays: [
│   ├─ compensationDate: "2024-01-15"
│   ├─ compensationDay: "Monday"
│   └─ remarks: "compensation work"
│  ]
└─ workingDayIds: [
   └─ "507f1f77bcf36cd799439011"
  ]

BACKEND REQUEST
├─ workingDays: [{...}]
├─ workingDayIds: ["507f1f77bcf36cd799439011"]
└─ remainingBalance: 1.5

DATABASE UPDATE
├─ Find: WorkingDay._id = "507f1f77bcf36cd799439011"
├─ Update: used = true
└─ Save: document with used:true
```

---

## 📈 Data Journey

```
requests.hbs          dayoff-request.hbs         routes/requests.js
   │                        │                           │
   │ id="507f..."           │                           │
   └──────────────────────→ row.setAttribute()          │
                            │                           │
                            │ formData collection       │
                            └──────────────────────────→ POST body
                                                        │
                                                        │ workingDayIds lookup
                                                        └──→ Database
                                                             │
                                                             │ Mark used=true
                                                             └──→ Database
                                                                  │
                                                                  ↓
                                                              Frontend
                                                              GET /requests
                                                              Query used=false
                                                                  │
                                                                  ↓
                                                              Working day
                                                              NOT in list
```

---

**Diagram Status**: Complete  
**Shows**: Full 7-phase flow with logging points  
**Helps**: Understand where data goes and where to look for logs
