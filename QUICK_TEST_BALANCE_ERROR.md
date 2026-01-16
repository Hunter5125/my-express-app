# 🧪 Quick Test Guide - Balance Error Messages

## Setup
```bash
npm start
# Application runs on http://localhost:3000
```

---

## Test 1: Insufficient Balance Popup ❌

### Scenario
User tries to request more balance than available

### Steps
```
1. Login to /login
2. Go to /requests
3. Look at available working days
4. If remaining balance is LOW (< 1.0):
   - Try to select a working day with balance >= remaining
   - Click "Request DayOff"
5. Expected: POPUP appears
   ❌ Alert: "Insufficient balance: required [X], available [Y]"
```

### What to Look For
```
Pop-up message shows:
✓ Required amount (what you tried to request)
✓ Available amount (what you have left)
✓ Clear format: "required 1.5, available 0.5"
```

### Browser Console (F12)
```
Should see:
✓ "Response status: 400"
✓ "❌ Server error: Insufficient balance: required X, available Y"
```

---

## Test 2: Sufficient Balance Success ✅

### Scenario
User has enough balance and submits successfully

### Steps
```
1. Login as user with good balance (2.0+)
2. Go to /requests
3. Select a working day (1.5 or less)
4. Click "Request DayOff"
5. Fill form:
   - Compensation date: [pick date]
   - Compensation day: [select day]
   - Remarks: [enter text]
6. Click "Submit"
7. Expected: SUCCESS message
   ✅ Alert: "Request submitted successfully!"
8. Page redirects to /requests
```

### Browser Console (F12)
```
Should see:
✓ "Response status: 200"
✓ "✓ Success: Day Off Request Submitted Successfully"
✓ Working day disappears from list
```

---

## Test 3: Zero Balance Remaining

### Scenario
User uses up all balance, tries to request again

### Steps
```
1. User A has 1.5 balance
2. User A requests the 1.5 working day
3. Compensation details: fill them
4. Submit: ✅ Success
5. Go back to /requests
6. Remaining balance now shows: 0.0
7. Try to request another day
8. Expected: 
   ❌ Alert: "Insufficient balance: required [X], available 0"
```

---

## Test 4: Fractional Balances

### Scenario
Working days have different balance values (1.5, 0.5, etc.)

### Steps
```
1. Go to /requests
2. Look at working days table
3. Note the balance values for each:
   - Day 1: 1.5 balance
   - Day 2: 0.5 balance
   - Day 3: 1.0 balance
   Total available: 3.0
4. Select Day 1 + Day 3 = 2.5
5. Remaining shows: 0.5
6. Try to add Day 2 (0.5 balance):
   New total: 3.0 - 3.0 = 0.0 ✅ Should work
7. OR try to add something else:
   ❌ Should show error if insufficient
```

---

## Test 5: Multiple Days with Insufficient Total

### Scenario
Selecting multiple days exceeds available balance

### Steps
```
1. User has: 2.0 balance
2. Try to select:
   - Day 1: 1.5
   - Day 2: 0.7
   Total: 2.2 (exceeds 2.0)
3. Form shows: remaining balance = -0.2 (negative!)
4. Click "Submit"
5. Expected:
   ❌ Alert: "Insufficient balance: required 0.2, available 0"
```

### Key Point
```
When remaining balance is NEGATIVE:
- Alert shows: required [absolute value], available 0
- Example: remaining = -0.2
- Alert says: "required 0.2, available 0"
```

---

## Error Message Formats

### Frontend Check (Before Server)
```
❌ "Insufficient balance: required [X], available 0"
- Shows when remaining balance < 0
- Immediate feedback
```

### Backend Check (From Server)
```
❌ "Insufficient balance: required [X], available [Y]"
- Shows when server validates
- More precise numbers
```

### Success Message
```
✅ "Request submitted successfully!"
- Shown when all checks pass
- Working day is marked as used
```

---

## Troubleshooting

### Problem: No popup appears
```
✓ Check browser F12 console for errors
✓ Verify balance is being calculated correctly
✓ Look for "Response status" message
✓ Check server console for validation logs
```

### Problem: Wrong numbers in error
```
✓ Check working day balance values
✓ Verify calculation: available - selected = remaining
✓ Check server logs: "Total used balance: X"
```

### Problem: Form submits without error
```
✓ Check remaining balance is positive
✓ Verify all required fields filled:
  - Compensation date
  - Compensation day
  - Remarks
✓ Check server didn't return a different error
```

---

## Success Checklist

- [ ] Test 1: Insufficient balance shows popup ❌
- [ ] Test 2: Sufficient balance succeeds ✅
- [ ] Test 3: Zero balance remaining prevents new request ❌
- [ ] Test 4: Fractional balances calculated correctly ✅
- [ ] Test 5: Multiple days with insufficient fails ❌
- [ ] Error messages show "required X, available Y" format
- [ ] Success messages appear for valid requests
- [ ] Browser console shows response status (200 or 400)
- [ ] Working day disappears after successful request
- [ ] Remaining balance updates after successful request

---

## Console Output Examples

### ✅ Successful Request
```javascript
// Browser Console (F12):
Response status: 200
✓ Success: Day Off Request Submitted Successfully

// Server Console:
Received workingDayIds: [ObjectId(...)]
Total used balance: 1.5
✓ Created DayOffRequest: [ID]
✓ Marked 1 working days as used
```

### ❌ Insufficient Balance
```javascript
// Browser Console (F12):
Response status: 400
❌ Server error: Insufficient balance: required 1.5, available 0.5

// Server Console:
Total used balance: 1.5
❌ Insufficient balance: required 1.5, available 0.5
```

---

## Expected Behavior Summary

| Scenario | Action | Result |
|----------|--------|--------|
| Select 1.5, have 2.0 | Submit | ✅ Success |
| Select 1.5, have 1.5 | Submit | ✅ Success (0.0 remaining) |
| Select 1.5, have 0.5 | Submit | ❌ Insufficient balance popup |
| Select 2.0, have 1.5 | Submit | ❌ Insufficient balance popup |
| Fill form incomplete | Submit | ❌ Error: Missing fields |
| All good, submit | Submit | ✅ Success, redirect to /requests |

---

## Quick Test (5 minutes)
```bash
1. npm start (already running)
2. Open http://localhost:3000/login
3. Login with a user
4. Go to /requests
5. Select a working day with low balance
6. Try to submit
7. Check for error popup with format: "required X, available Y"
8. Done! ✅
```
