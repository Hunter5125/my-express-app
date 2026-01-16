# Seed Data Pattern - Scalable for Multiple Departments & Sections

## Pattern Overview

This system is **fully scalable** for any number of departments and sections. Follow this pattern:

## Step-by-Step Pattern

### 1. Create Department
```javascript
let dept = await Department.findOne({ name: 'department_name' });
if (!dept) {
  dept = new Department({ name: 'department_name' });
  await dept.save();
  console.log('Department created');
}
```

### 2. Create Manager for Department
```javascript
let manager = await User.findOne({ email: 'manager@example.com' });
if (!manager) {
  manager = new User({
    name: 'Manager Name',
    email: 'manager@example.com',
    passwordHash: 'Password123!',
    role: 'manager',
    department: dept._id,
    section: null,
    employeeNo: '1000',
    signature: 'Manager Signature'
  });
  await manager.save();
}
```

### 3. Create Team Leader (Supervisor) for Each Section
```javascript
let teamLeader = await User.findOne({ email: 'teamleader@example.com' });
if (!teamLeader) {
  teamLeader = new User({
    name: 'Team Leader Name',
    email: 'teamleader@example.com',
    passwordHash: 'Password123!',
    role: 'team_leader',
    department: dept._id,
    section: null, // Will be set to section after creation
    employeeNo: '2000',
    signature: 'Team Leader Signature'
  });
  await teamLeader.save();
}
```

### 4. Create Section with Supervisor (Team Leader) & Manager
```javascript
let section = await Section.findOne({ name: 'section_name', department: dept._id });
if (!section) {
  section = new Section({
    name: 'section_name',
    department: dept._id,
    supervisor: teamLeader._id,  // Team leader of this section
    manager: manager._id          // Manager of this department
  });
  await section.save();
}
```

### 5. Update Team Leader with Section
```javascript
if (!teamLeader.section || teamLeader.section.toString() !== section._id.toString()) {
  teamLeader.section = section._id;
  await teamLeader.save();
  console.log('Team leader section updated');
}
```

### 6. Create Employees in Section
```javascript
let employee = await User.findOne({ email: 'employee@example.com' });
if (!employee) {
  employee = new User({
    name: 'Employee Name',
    email: 'employee@example.com',
    passwordHash: 'Password123!',
    role: 'employee',
    department: dept._id,
    section: section._id,
    supervisor: teamLeader._id,  // Team leader of their section
    employeeNo: '3000',
    signature: 'Employee Signature'
  });
  await employee.save();
}
```

## How Day-Off Requests Route Automatically

When an **employee creates a day-off request**:

1. ✅ System gets employee's section
2. ✅ System finds that section's supervisor (team leader)
3. ✅ System finds that section's manager (from section.manager)
4. ✅ Request automatically goes to that team leader first
5. ✅ Then to that manager for final approval

**This happens AUTOMATICALLY for ANY section/department!**

## Example: Adding New Department "Security"

```javascript
// 1. Create Security department
let secDept = await Department.findOne({ name: 'security' });
if (!secDept) {
  secDept = new Department({ name: 'security' });
  await secDept.save();
}

// 2. Create Ahmed as Security Manager
let ahmedManager = new User({
  name: 'Ahmed',
  email: 'ahmed@example.com',
  role: 'manager',
  department: secDept._id,
  // ... rest of fields
});
await ahmedManager.save();

// 3. Create Mohammad as Team Leader for Guards Section
let mohammad = new User({
  name: 'Mohammad',
  email: 'mohammad@example.com',
  role: 'team_leader',
  department: secDept._id,
  // ... rest of fields
});
await mohammad.save();

// 4. Create Guards section with Mohammad as supervisor
let guardsSection = new Section({
  name: 'Guards',
  department: secDept._id,
  supervisor: mohammad._id,
  manager: ahmedManager._id
});
await guardsSection.save();

// 5. Update Mohammad with Guards section
mohammad.section = guardsSection._id;
await mohammad.save();

// 6. Create employees in Guards section
let employee1 = new User({
  name: 'Ali',
  email: 'ali@example.com',
  role: 'employee',
  department: secDept._id,
  section: guardsSection._id,
  supervisor: mohammad._id,
  // ... rest of fields
});
await employee1.save();
```

**Result**: When Ali creates a day-off request → automatically goes to Mohammad (Guards team leader) → then to Ahmed (Security manager)

## Database Structure

```
Department: Security
├── Manager: Ahmed (ahmed@example.com)
├── Section: Guards
│   ├── Supervisor: Mohammad (mohammad@example.com)
│   └── Manager: Ahmed (ahmed@example.com)
│   └── Employees:
│       ├── Ali (ali@example.com)
│       └── Other employees...
└── Section: Patrol
    ├── Supervisor: Hassan (hassan@example.com)
    └── Manager: Ahmed (ahmed@example.com)
    └── Employees:
        ├── Khalid (khalid@example.com)
        └── Other employees...
```

## Key Rules (Automatic Enforcement)

✅ **Manager**: 
- Has department
- NO section
- NO supervisor

✅ **Team Leader**:
- Has department
- Has section (their own section)
- NO supervisor

✅ **Employee**:
- Has department
- Has section
- Has supervisor (their team leader)

## Day-Off Request Routing (Automatic)

```
Employee submits request
    ↓
System gets employee.section
    ↓
System gets section.supervisor (team leader)
    ↓
Request goes to team leader for first approval
    ↓
Team leader approves
    ↓
System gets section.manager
    ↓
Request goes to manager for final approval
    ↓
Manager approves
    ↓
Request status: APPROVED
```

## Summary

The system is **100% scalable** because:

1. ✅ All logic is **dynamic** - uses database relationships, not hardcoded values
2. ✅ Day-off routing is **automatic** - based on section relationships
3. ✅ Works for **ANY number of departments/sections**
4. ✅ Just follow the pattern above for each new department/section
5. ✅ No code changes needed - just add data

**Just create the data following the pattern, and everything works automatically!**
