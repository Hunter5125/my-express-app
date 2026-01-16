# Day Off Request Management System - AI Coding Agent Instructions

## Architecture Overview

**DayOff** is an Express.js web application for managing vacation/day-off requests with a hierarchical approval workflow. The system enforces role-based access control with three user roles:
- **Employee**: Submits day-off requests, views working days balance
- **Team Leader**: Approves employee requests as first approval tier
- **Manager**: Final approval authority, manages users/departments/sections

**Key Data Flow**: Employee → submits DayOffRequest → Team Leader approves → Manager approves → Status changes from pending → team_leader_approved → approved

## Tech Stack & Dependencies

- **Framework**: Express.js ~4.16.1
- **Database**: MongoDB with Mongoose 5.13.22 (session storage via connect-mongo)
- **Template Engine**: Handlebars (hbs) with custom helpers (eq, json, formatDate, etc.)
- **Authentication**: Express-session + bcrypt password hashing
- **Testing**: Test files provided (test-users.js, test-db.js, test-balance.js, test-delete-balance.js)

## Core Models & Relationships

| Model | Purpose | Key Fields |
|-------|---------|-----------|
| **User** | System users with hierarchical roles | name, email, role (employee/team_leader/manager), department, section, availableDays |
| **DayOffRequest** | Vacation request workflow | employee, teamLeader, manager, status (pending→team_leader_approved→approved), balance, workingDayIds |
| **WorkingDay** | Compensation days earned/available | employee, balance, used (boolean), compensationDate |
| **Department** | Organizational unit (automation, etc.) | name |
| **Section** | Sub-unit under department | name, department |

**Important**: Populate relationships explicitly when querying nested data. See [routes/requests.js](../routes/requests.js#L18-L35) for fallback pattern handling populate errors.

## Routes & Access Control

```
/auth           - Login, dashboard (role-based content)
/requests       - Day-off workflow, working days list
/users          - User CRUD (manager only, via requireManager middleware)
/departments    - Department CRUD
/sections       - Section CRUD
/settings       - Settings management (hardcoded user whitelist: "alaa", "ismail")
```

**Auth Middleware** ([middlewares/auth.js](../middlewares/auth.js)):
- `requireLogin`: Redirects unauthenticated users to `/login`
- `requireManager`: Returns 403 if user.role ≠ 'manager'
- Session stored in MongoDB; user object stored in `req.session.user`

**Hardcoded Routing**: "yousef" employee redirects to /requests; others to /dashboard after login.

## Development Workflows

### Running the Application
```bash
npm start                # Starts server at localhost:3000 (bin/www)
npm run seed             # Seeds initial users/departments (Developer tool only!)
nodemon                  # Watch-mode development (if available)
```

### Testing
- Test files are integration/manual tests, not automated test suite
- Run with `node test-users.js`, etc. to validate specific endpoints
- Use `curl` with HTML response grep for testing (see context examples)

### Database Setup
- MongoDB must be running (default: localhost:27017/dayoff)
- Override with `MONGO_URI` environment variable (see app.js)
- `seed.js` creates users: Ismail, Alaa, Yousef, Amira with hardcoded roles

## Project-Specific Patterns & Conventions

### Date Handling
- Dates stored as ISO strings in MongoDB, formatted for display using `formatDate` handlebars helper
- Forms use `<input type="date">` returning YYYY-MM-DD format
- Handlebars helper at app.js handles JSON serialization: `hbs.registerHelper('json', ...)`

### Working Days & Balance Logic
- Each WorkingDay has a `balance` (number of days earned)
- DayOffRequest tracks `usedBalance` (typically 1) and references `workingDayIds`
- Balance calculation: Sum of all `WorkingDay.balance` where `used: false` (see routes/requests.js)

### Status Workflow
DayOffRequest status progresses: **pending** → **team_leader_approved** → **approved** (or **rejected** at any stage)
- Team Leader sees requests where `teamLeader: req.session.user._id` and `status: 'pending'`
- Manager sees requests where `manager: req.session.user._id` and `status: 'team_leader_approved'`
- Approval fields: `teamLeaderApprovedBy`, `teamLeaderApprovedAt`, `approvedBy`, `approvedAt` (timestamps)

### View Structure & Partials
- Layout: [views/layouts/main.hbs](../views/layouts/main.hbs) wraps all pages
- Partials: [views/partials/header.hbs](../views/partials/header.hbs) (navigation), [views/partials/footer.hbs](../views/partials/footer.hbs)
- CSS: [public/styles.css](../public/styles.css) (main), [public/javascripts/header.css](../public/javascripts/header.css) (nav), [public/requests.css](../public/requests.css) (request page)
- Body classes inject role and username for CSS targeting: `class="role-{{role}} name-{{lowercase session.user.name}}"`

### Hardcoded Customizations
- Settings page visibility: Restricted to users named "alaa" or "ismail" (header.hbs conditional)
- Employee "yousef" has unique dashboard redirect to /requests instead of /dashboard

## Common Pitfalls & Gotchas

1. **Populate Failures**: Nested populate can fail silently. Always provide fallback queries (see requests.js pattern at line 25-30)
2. **Session User Object**: Must include `_id, name, email, role, employeeNo, signature` for templates
3. **Role Guards**: requireManager middleware returns 403; requireLogin redirects to /login
4. **Date Validation**: Invalid dates in forms fail silently—validate client-side with `type="date"`
5. **Hardcoded Names**: "yousef", "alaa", "ismail" are hardcoded in multiple files; changing seed data requires route updates

## File Organization by Concern

- **Routes** ([routes/](../routes)): Endpoint logic, queries, templates
- **Models** ([models/](../models)): Mongoose schemas, relationships, pre-save hooks
- **Views** ([views/](../views)): Handlebars templates, role-based conditionals
- **Public** ([public/](../public)): CSS, client-side JavaScript
- **Middleware** ([middlewares/](../middlewares)): Auth guards (requireLogin, requireManager)

## Environment Variables

```
MONGO_URI=mongodb://127.0.0.1:27017/dayoff  # MongoDB connection
SESSION_SECRET=change-me                     # Session encryption (change in production!)
```

Defaults to localhost if not set; SESSION_SECRET defaults to 'change-me' for development.
