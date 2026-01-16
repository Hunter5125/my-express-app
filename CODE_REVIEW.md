# Code Review & Architecture Guide

## 1. Application Flow Overview

### Startup Sequence (`bin/www` → `app.js`)
1. **Port Setup**: Starts on port 3000 (or `$PORT` env variable)
2. **MongoDB Connection**: Connects via `MONGO_URI` (default: `localhost:27017/dayoff`)
3. **Session Store**: Uses MongoDB via `connect-mongo` with 14-day TTL
4. **View Engine**: Handlebars with custom helpers for templating
5. **Routes Registered**: Auth, Requests, Users, Departments, Sections, Settings

### Authentication & Session Flow
```
User visits / 
  ↓
Check req.session.user exists
  ├─ NO → Redirect to /login
  ├─ YES → Check user.name === "yousef"
  │         ├─ YES → Redirect to /requests
  │         ├─ NO → Redirect to /users or /dashboard
```

**Critical Pattern**: Session user stored as: `{ _id, name, email, role, employeeNo, signature }`  
**Security Note**: Role-based redirects happen in [routes/auth.js](../routes/auth.js) - "yousef" is hardcoded for special routing.

---

## 2. Data Model Architecture

### User Model
```javascript
User {
  name, email, passwordHash (hashed via bcrypt),
  role: 'employee' | 'team_leader' | 'manager',
  department: ObjectId(Department),
  section: ObjectId(Section),        // NOT required for managers
  supervisor: ObjectId(User),
  employeeNo, signature,
  availableDays: Number
}
```

**Password Security**: Uses bcrypt (10 salt rounds) with `pre('save')` hook that auto-hashes if modified.  
**Comparison**: `comparePassword()` method validates login credentials.

### DayOffRequest Model (The Core Workflow)
```javascript
DayOffRequest {
  employee: ObjectId(User),           // Who requests day off
  teamLeader: ObjectId(User),         // First approver
  manager: ObjectId(User),            // Final approver
  
  // What day being used
  day_to_be_taken: String,
  date_to_be_taken: Date,
  
  // Original working day context
  working_day: String,
  working_day_date: Date,
  
  balance: Number,                    // Days available (copy from WorkingDay)
  usedBalance: Number (default: 1),   // Typically 1 day per request
  remark: String,
  workingDayIds: [ObjectId(WorkingDay)],  // Links to WorkingDay docs
  
  status: 'pending' → 'team_leader_approved' → 'approved' | 'rejected',
  
  // Audit trail
  teamLeaderApprovedBy: ObjectId(User),
  teamLeaderApprovedAt: Date,
  approvedBy: ObjectId(User),
  approvedAt: Date,
  createdAt: Date
}
```

### WorkingDay Model (Compensation Days)
```javascript
WorkingDay {
  employee: ObjectId(User),
  date: Date,
  day: String,
  remark: String,
  balance: Number (default: 1),       // Days earned
  used: Boolean (default: false),     // Marks if applied to DayOffRequest
  createdAt: Date
}
```

**Key Insight**: `used: false` means available for consumption. Balance is calculated as:
```javascript
const balance = workingDays
  .filter(w => !w.used)
  .reduce((sum, day) => sum + day.balance, 0);
```

### Department & Section Models
Simple parent-child relationship for organizational structure.

---

## 3. Request/Response Flows by Role

### EMPLOYEE VIEW (`/requests` route)
**Endpoint**: `GET /requests`  
**Query**: 
- Fetches all non-used `WorkingDay` where `employee === currentUser._id`
- Calculates total balance
- Shows all requests (pending/approved/rejected status)
- Shows requests awaiting approval if user is team_leader or manager

**Rendered Template**: `requests.hbs`

### TEAM LEADER APPROVAL
**Endpoint**: `GET /requests` (dashboard shows approvable requests)  
**Query**: `DayOffRequest.find({ teamLeader: currentUser._id, status: 'pending' })`  
**After Approval**:
1. Sets `status` → `'team_leader_approved'`
2. Records `teamLeaderApprovedBy` (user ID) and `teamLeaderApprovedAt` (timestamp)
3. Status moves from **pending → team_leader_approved**

### MANAGER FINAL APPROVAL
**Endpoint**: `GET /dashboard` (manager sees team_leader_approved requests)  
**Query**: `DayOffRequest.find({ status: 'team_leader_approved' })`  
**After Approval**:
1. Sets `status` → `'approved'`
2. Records `approvedBy` and `approvedAt`
3. Marks corresponding `WorkingDay` as `used: true`

---

## 4. Key Patterns & Code Quirks

### Pattern 1: Populate Fallback (Defensive Querying)
Found in [routes/requests.js](../routes/requests.js#L18-L35):

```javascript
let pendingRequests;
try {
  pendingRequests = await DayOffRequest.find(...)
    .populate('teamLeader', 'name')
    .populate('workingDayIds')
    .populate({
      path: 'workingDayIds',
      populate: { path: 'employee', select: 'name' }
    });
} catch (populateError) {
  // FALLBACK: Try again without nested populate
  pendingRequests = await DayOffRequest.find(...)
    .populate('teamLeader', 'name')
    .populate('workingDayIds');  // Single level only
}
```
**Why**: Nested populate can fail silently with Mongoose 5.x. This pattern ensures queries don't crash.

### Pattern 2: Role-Based Rendering
Template conditionals (e.g., in `requests.hbs`):
```handlebars
{{#if (eq session.user.role "team_leader")}}
  <div>Requests pending YOUR approval</div>
{{/if}}

{{#if (eq session.user.role "manager")}}
  <div>Requests from team leaders for YOUR final approval</div>
{{/if}}
```

**Body Class Pattern** (in [views/layouts/main.hbs](../views/layouts/main.hbs)):
```handlebars
<body class="role-{{session.user.role}} name-{{lowercase session.user.name}}">
```
Allows CSS targeting: `.role-manager { /* styles */ }` or `.name-yousef { /* special routing */ }`

### Pattern 3: Hardcoded User Routing
**Files with hardcoded names**: `routes/auth.js`, `views/partials/header.hbs`, possibly others

- `"yousef"` → Redirects to `/requests` instead of `/dashboard`
- `"alaa"` or `"ismail"` → Can see Settings page (hardcoded whitelist)

**Risk**: Changing seed data or user names requires updating routes.

### Pattern 4: Request Variable Shadow Issue
**CRITICAL BUG** in [routes/requests.js](../routes/requests.js#L35):
```javascript
pendingRequests.forEach(req => {  // ← 'req' shadows Express route parameter!
  req.teamLeaderApprovalStatus = 'Pending';
});
```
This shadows the route handler's `req` parameter. Inside the loop, `req` is the DayOffRequest object, not Express request. Works but confusing.

---

## 5. Middleware & Access Control

### `requireLogin` Middleware
```javascript
function requireLogin(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');  // Silent redirect, no error message
  }
  next();
}
```
Applied to: `/requests`, `/users`, `/departments`, `/sections`

### `requireManager` Middleware
```javascript
function requireManager(req, res, next) {
  if (!req.session.user || req.session.user.role !== 'manager') {
    return res.status(403).send('Access denied');  // Returns 403, not redirect
  }
  next();
}
```
Applied to: User CRUD endpoints

**Inconsistency**: `requireLogin` redirects (soft), `requireManager` returns 403 (hard error). Design choice, not a bug.

---

## 6. Data Validation Issues

### Current Validation (in routes)
✅ **Strong**: WorkingDay creation validates:
- Date validity: `isNaN(new Date(date).getTime())`
- Balance positive: `parseFloat(balance) < 0`
- Strings non-empty: `day.trim() !== ''`

❌ **Weak**: DayOffRequest creation may not validate:
- Missing checks for invalid employee/teamLeader/manager IDs
- No check if employee already has request pending (duplicate prevention)
- No date range validation (can user request past dates?)

### Client-Side Validation
Uses HTML5 `<input type="date">` which provides browser validation but:
- Different across browsers
- Server should always re-validate (which it does ✓)

---

## 7. Handlebars Helpers (Templating)

Registered in [app.js](../app.js#L54-L80):

```javascript
eq(a, b)           // {{#if (eq role "manager")}}
lowercase(str)     // Converts to lowercase
substring(str, s, e) // Extracts substring
and(a, b)          // Logical AND
or(a, b)           // Logical OR
json(obj)          // Stringifies for <script> tags
formatDate(date)   // Formats dates to locale string
```

**formatDate Specifics**:
- Handles ISO strings from MongoDB
- Returns 'N/A' if null
- Returns 'Invalid Date' if malformed
- Uses `.toLocaleDateString()` (browser/server locale)

---

## 8. Session Configuration

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me',  // ⚠️ Default is unsafe!
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    ttl: 14 * 24 * 60 * 60   // Sessions expire after 14 days
  }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }  // Cookie expires after 1 day
}))
```

**Issue**: TTL (14 days) > maxAge (1 day) = session data persists longer than cookie. User can't use old session even if in DB.

---

## 9. Common Errors & How to Debug

### MongoDB Connection Fails
```
Error: MongoDB connection error: getaddrinfo ENOTFOUND localhost
```
**Fix**: 
- Ensure MongoDB is running: `mongod` on Windows
- Check `MONGO_URI` environment variable
- Default is `mongodb://127.0.0.1:27017/dayoff`

### Session Store Errors
```
Error: connect-mongo session storage failed
```
**Fix**: Check MongoDB is running and has `sessions` collection

### 404 Routes
- `/` redirects to `/login` or dashboard (based on session)
- All other routes require prefix: `/requests`, `/users`, `/departments`, `/sections`
- Direct navigation to `/dashboard` requires `requireLogin`

### Blank Pages / Missing Data
- Check console for populate errors (look for "Populate error" logs)
- Fallback queries will execute if primary populate fails
- If workingDayIds don't populate, views may show empty arrays

---

## 10. Development Tips

### Seed Test Data
```bash
npm run seed   # Creates users: Ismail (manager), Alaa (manager), Yousef (employee), Amira (employee)
```

### Test Login
- Email: `yousef@example.com`, Password: `Password123!` → Redirects to `/requests`
- Email: `ismail@example.com`, Password: `Password123!` → Redirects to `/dashboard` (manager view)

### Debug Queries
Add `console.log()` before `.populate()` to see raw data before relationship resolution.

### Enable Verbose Logging
```bash
DEBUG=dayoff:* npm start
```

---

## 11. Security Considerations

✅ **Good**:
- Password hashing via bcrypt
- Session stored server-side (MongoDB)
- CSRF protection (cookies httpOnly by default)
- Role-based access control

❌ **Needs Improvement**:
- No input sanitization (could be vulnerable to NoSQL injection)
- No rate limiting on login
- Default session secret is hardcoded
- Hardcoded user names for routing = security smell
- No email verification or password reset flow

---

## 12. Next Steps for Understanding

1. **Login Flow**: Follow a user through login → `POST /login` → session creation → redirect
2. **Request Submission**: Create a WorkingDay → Create DayOffRequest → Trace approval chain
3. **Query Behavior**: Try populating deeply nested data and catch the populate error
4. **CSS Targeting**: Inspect `<body class="role-manager name-yousef">` to see how CSS scopes to roles
5. **Test the Fallback**: Comment out the first populate try-block to see fallback in action
