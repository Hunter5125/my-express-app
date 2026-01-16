# DayOff Request Management System

A comprehensive Express.js web application for managing vacation and day-off requests with a hierarchical approval workflow.

## Features

✅ **Role-Based Access Control**
- Employee: Submit day-off requests, view working day balance
- Team Leader: First-level approval authority
- Manager: Final approval authority, system administration

✅ **Day-Off Request Workflow**
- Employees submit requests with flexible day allocation
- Team leaders review and approve/reject requests
- Managers provide final approval
- Status tracking throughout the approval chain
- Archive functionality for completed requests

✅ **Working Days Management**
- Add compensation days/working days
- Track available and used days
- Automatic balance calculation
- Smart allocation algorithm (single day match + FIFO fallback)

✅ **Responsive Design**
- Mobile-optimized interface
- Desktop and tablet support
- Touch-friendly controls
- Accessible navigation

✅ **User Management**
- Department and section organization
- User profile management
- Signature upload and display
- Employee number tracking

## Tech Stack

- **Backend**: Express.js ~4.16.1
- **Database**: MongoDB with Mongoose 5.13.22
- **Template Engine**: Handlebars (hbs)
- **Authentication**: Express-session with bcrypt
- **Session Storage**: MongoDB (connect-mongo)
- **Frontend**: Vanilla JavaScript, CSS3

## Installation

### Prerequisites
- Node.js (v12 or higher)
- MongoDB (running on localhost:27017)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dayoff.git
   cd dayoff
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set environment variables** (optional)
   ```bash
   # Create .env file
   MONGO_URI=mongodb://127.0.0.1:27017/dayoff
   SESSION_SECRET=your-secret-key
   PORT=3000
   ```

4. **Initialize the database** (optional - seed initial users)
   ```bash
   npm run seed
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Access the application**
   ```
   http://localhost:3000
   ```

## Default Test Users (from seed.js)

After running `npm run seed`:

| User | Email | Role | Password |
|------|-------|------|----------|
| Ismail | ismail@company.com | manager | password |
| Alaa | alaa@company.com | team_leader | password |
| Yousef | yousef@company.com | employee | password |
| Amira | amira@company.com | employee | password |

## Database Models

### User
- name, email, role (employee/team_leader/manager)
- department, section, employeeNo
- signature (uploaded image)
- availableDays, usedDays

### WorkingDay
- employee (reference)
- date, day, remark
- balance (decimal for half-days)
- used (boolean)

### DayOffRequest
- employee, teamLeader, manager (references)
- status (pending → team_leader_approved → approved)
- workingDayIds (array of selected days)
- usedBalance, remainingBalance
- Timestamps for approvals

### Department & Section
- Organizational hierarchy
- Used for employee grouping and filtering

## Project Structure

```
.
├── bin/
│   └── www                 # Server entry point
├── models/
│   ├── User.js
│   ├── WorkingDay.js
│   ├── DayOffRequest.js
│   ├── Department.js
│   └── Section.js
├── routes/
│   ├── auth.js            # Login/logout
│   ├── requests.js        # Day-off workflow
│   ├── users.js           # User management
│   ├── departments.js     # Department management
│   └── sections.js        # Section management
├── views/
│   ├── layouts/main.hbs   # Master layout
│   ├── partials/          # Reusable components
│   ├── requests.hbs       # Working days & requests page
│   ├── dayoff-request.hbs # Request form
│   └── ...other views
├── public/
│   ├── styles.css         # Main styles
│   ├── requests.css       # Request page styles
│   ├── javascripts/       # Client-side scripts
│   └── uploads/           # User uploads (signatures, etc)
├── middlewares/
│   └── auth.js            # Auth guards
├── app.js                 # Express app setup
└── package.json
```

## Key Features Explained

### Smart Day Allocation Algorithm
When requesting X days off, the system:
1. First tries to find a single day with sufficient balance
2. If not found, uses FIFO (First-In-First-Out) allocation
3. Supports half-day requests (0.5, 1, 1.5, etc.)

### Approval Workflow
```
Employee Creates Request
         ↓
   Team Leader Reviews
         ↓
    Manager Approves
         ↓
  Request Approved/Rejected
```

### Responsive Design Breakpoints
- **Mobile**: 320px - 479px
- **Tablet**: 480px - 1024px  
- **Desktop**: 1025px+

## API Routes

### Authentication
- `GET /login` - Login page
- `POST /auth/login` - Submit login
- `GET /logout` - Logout

### Requests
- `GET /requests` - View working days and requests
- `POST /requests` - Create new working day
- `GET /requests/dayoff-request` - Day-off request form
- `POST /requests/dayoff-request` - Submit day-off request
- `GET /requests/archive` - View archived requests

### Users (Manager only)
- `GET /users` - List users
- `POST /users` - Create user
- `GET /users/:id/edit` - Edit user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Management (Manager only)
- `GET /departments` - Department management
- `GET /sections` - Section management
- `GET /profile` - User profile

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `app.js` or `.env`

### Session/Login Issues
- Clear browser cookies
- Ensure `SESSION_SECRET` is set
- Check MongoDB session store

### Form Data Not Populating
- Check browser console for JavaScript errors
- Verify working days are loaded (check server logs)
- Clear browser cache and reload

## Future Enhancements

- [ ] Email notifications for approvals
- [ ] Calendar view for day-off requests
- [ ] Bulk import of working days
- [ ] Advanced reporting and analytics
- [ ] Mobile app (React Native)
- [ ] LDAP/Active Directory integration

## License

MIT

## Support

For issues or questions, please open an issue on GitHub or contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: January 2026
