const mongoose = require('mongoose');
const User = require('./models/User');
const WorkingDay = require('./models/WorkingDay');
const Department = require('./models/Department');
const Section = require('./models/Section');
require('dotenv').config();

/**
 * SEED PATTERN - THIS IS FULLY SCALABLE FOR ANY DEPARTMENTS/SECTIONS
 * 
 * The pattern below demonstrates how to add users and sections.
 * This same pattern works for ANY number of departments and sections.
 * 
 * For each new department:
 * 1. Create Department
 * 2. Create Manager for department
 * 3. For each section in that department:
 *    a. Create Team Leader (supervisor) for section
 *    b. Create Section with supervisor and manager
 *    c. Create Employees in that section
 * 
 * The day-off routing is AUTOMATIC - no code changes needed.
 */

async function seedUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    console.log('\n=== SEED PATTERN: Scalable for Multiple Departments/Sections ===\n');

    // Create or find department "automation"
    let automationDept = await Department.findOne({ name: 'automation' });
    if (!automationDept) {
      automationDept = new Department({ name: 'automation' });
      await automationDept.save();
      console.log('Department "automation" created');
    }

    // Create Admin user
    let adminUser = await User.findOne({ email: 'admin@admin.com' });
    if (!adminUser) {
      adminUser = new User({
        name: 'Admin',
        email: 'admin@admin.com',
        passwordHash: '123456', // Will be hashed by pre-save hook
        role: 'admin',
        department: automationDept._id,
        section: null, // No section for admin
        employeeNo: 'ADMIN001',
        signature: 'Admin Signature'
      });
      await adminUser.save();
      console.log('Admin user created (email: admin@admin.com, password: 123456)');
    } else {
      adminUser.role = 'admin';
      adminUser.department = automationDept._id;
      adminUser.section = null;
      await adminUser.save();
      console.log('Admin user verified');
    }

    // Create Ismail first as manager
    let ismailUser = await User.findOne({ email: 'ismail@example.com' });
    if (!ismailUser) {
      ismailUser = new User({
        name: 'Ismail',
        email: 'ismail@example.com',
        passwordHash: 'Password123!', // Will be hashed by pre-save hook
        role: 'manager',
        department: automationDept._id,
        section: null, // No section for manager
        employeeNo: '123456',
        signature: 'Ismail Signature'
      });
      await ismailUser.save();
      console.log('User Ismail created');
    } else {
      ismailUser.employeeNo = '123456';
      ismailUser.signature = 'Ismail Signature';
      ismailUser.department = automationDept._id;
      ismailUser.section = null;
      await ismailUser.save();
      console.log('User Ismail updated');
    }

    // Create Alaa as team_leader
    let alaaUser = await User.findOne({ email: 'alaa@example.com' });
    if (!alaaUser) {
      alaaUser = new User({
        name: 'Alaa',
        email: 'alaa@example.com',
        passwordHash: 'Password123!',
        role: 'team_leader',
        department: automationDept._id,
        section: automationDept._id, // Temporary placeholder
        employeeNo: '1234',
        signature: 'Alaa Signature'
      });
      await alaaUser.save();
      console.log('User Alaa created as team_leader');
    } else {
      alaaUser.name = 'Alaa';
      alaaUser.role = 'team_leader';
      alaaUser.employeeNo = '1234';
      alaaUser.signature = 'Alaa Signature';
      alaaUser.department = automationDept._id;
      if (!alaaUser.section) {
        alaaUser.section = automationDept._id; // Temporary placeholder
      }
      await alaaUser.save();
      console.log('User Alaa updated to team_leader');
    }

    // Create or find section "IT" under automation department
    let itSection = await Section.findOne({ name: 'IT', department: automationDept._id });
    if (!itSection) {
      itSection = new Section({ 
        name: 'IT', 
        department: automationDept._id, 
        manager: ismailUser._id, 
        supervisor: alaaUser._id 
      });
      await itSection.save();
      console.log('Section "IT" created under automation department');
    } else {
      // Update existing IT section to have correct supervisor and manager
      itSection.supervisor = alaaUser._id;
      itSection.manager = ismailUser._id;
      await itSection.save();
      console.log('Section "IT" updated with correct supervisor and manager');
    }

    // Update Alaa with the actual IT section
    if (!alaaUser.section || alaaUser.section.toString() !== itSection._id.toString()) {
      alaaUser.section = itSection._id;
      await alaaUser.save();
      console.log('User Alaa section updated to IT');
    }

    // Find or create Ibrahim as CCTV team leader
    let ibrahimUser = await User.findOne({ email: 'ibrahim@test.com' });
    if (!ibrahimUser) {
      ibrahimUser = new User({
        name: 'Ibrahim',
        email: 'ibrahim@test.com',
        passwordHash: 'Password123!',
        role: 'team_leader',
        department: automationDept._id,
        section: null, // Will be set to CCTV section after creation
        employeeNo: '2000',
        signature: 'Ibrahim Signature'
      });
      await ibrahimUser.save();
      console.log('User Ibrahim created as team leader');
    } else {
      // Update existing Ibrahim user to be team leader with correct department
      if (ibrahimUser.role !== 'team_leader') {
        ibrahimUser.role = 'team_leader';
      }
      if (!ibrahimUser.department || ibrahimUser.department.toString() !== automationDept._id.toString()) {
        ibrahimUser.department = automationDept._id;
      }
      await ibrahimUser.save();
      console.log('User Ibrahim updated as CCTV team leader');
    }

    // Create or find section "CCTV" under automation department
    let cctvSection = await Section.findOne({ name: 'CCTV', department: automationDept._id });
    if (!cctvSection) {
      cctvSection = new Section({
        name: 'CCTV',
        department: automationDept._id,
        manager: ismailUser._id,
        supervisor: ibrahimUser._id
      });
      await cctvSection.save();
      console.log('Section "CCTV" created under automation department');
    } else {
      // Update existing CCTV section to have correct supervisor and manager
      cctvSection.supervisor = ibrahimUser._id;
      cctvSection.manager = ismailUser._id;
      await cctvSection.save();
      console.log('Section "CCTV" updated with Ibrahim as supervisor');
    }

    // Update Ibrahim with CCTV section
    if (!ibrahimUser.section || ibrahimUser.section.toString() !== cctvSection._id.toString()) {
      ibrahimUser.section = cctvSection._id;
      await ibrahimUser.save();
      console.log('User Ibrahim section updated to CCTV');
    }

    // Create Bander user in CCTV section
    let banderUser = await User.findOne({ email: 'bander@example.com' });
    if (!banderUser) {
      banderUser = new User({
        name: 'Bander',
        email: 'bander@example.com',
        passwordHash: 'Password123!',
        role: 'employee',
        department: automationDept._id,
        section: cctvSection._id,
        supervisor: ibrahimUser._id,
        employeeNo: '3000',
        signature: 'Bander Signature'
      });
      await banderUser.save();
      console.log('User Bander created in CCTV section');
    } else {
      banderUser.name = 'Bander';
      banderUser.role = 'employee';
      banderUser.employeeNo = '3000';
      banderUser.signature = 'Bander Signature';
      banderUser.department = automationDept._id;
      banderUser.section = cctvSection._id;
      banderUser.supervisor = ibrahimUser._id;
      await banderUser.save();
      console.log('User Bander updated');
    }

    // Create Yousef user in IT section
    let yousefUser = await User.findOne({ email: 'yousef@example.com' });
    if (!yousefUser) {
      yousefUser = new User({
        name: 'Yousef Fadlallah',
        email: 'yousef@example.com',
        passwordHash: 'Password123!',
        role: 'employee',
        department: automationDept._id,
        section: itSection._id,
        supervisor: alaaUser._id,
        employeeNo: '89860',
        signature: 'Yousef Signature'
      });
      await yousefUser.save();
      console.log('User Yousef created in IT section');
    } else {
      yousefUser.name = 'Yousef Fadlallah';
      yousefUser.role = 'employee';
      yousefUser.employeeNo = '89860';
      yousefUser.signature = 'Yousef Signature';
      yousefUser.department = automationDept._id;
      yousefUser.section = itSection._id;
      yousefUser.supervisor = alaaUser._id;
      await yousefUser.save();
      console.log('User Yousef updated');
    }

    const createdUsers = [ismailUser, alaaUser, ibrahimUser, yousefUser, banderUser];

    // Create sample working days for each user
    const yousefUserRef = createdUsers.find(u => u.name === 'Yousef Fadlallah');
    const alaaUserRef = createdUsers.find(u => u.name === 'Alaa');
    const banderUserRef = createdUsers.find(u => u.name === 'Bander');

    if (yousefUserRef) {
      const existingWorkingDays = await WorkingDay.find({ employee: yousefUserRef._id });
      if (existingWorkingDays.length === 0) {
        const workingDays = [
          {
            employee: yousefUserRef._id,
            day: 'Sunday',
            date: new Date('2024-01-07'),
            remark: 'Worked on project documentation',
            balance: 1,
            used: false
          },
          {
            employee: yousefUserRef._id,
            day: 'Saturday',
            date: new Date('2024-01-13'),
            remark: 'Emergency deployment',
            balance: 1,
            used: false
          }
        ];
        await WorkingDay.insertMany(workingDays);
        console.log(`Sample working days created for ${yousefUserRef.name}`);
      }
    }

    if (alaaUserRef) {
      const existingWorkingDays = await WorkingDay.find({ employee: alaaUserRef._id });
      if (existingWorkingDays.length === 0) {
        const workingDays = [
          {
            employee: alaaUserRef._id,
            day: 'Friday',
            date: new Date('2024-01-12'),
            remark: 'Team meeting preparation',
            balance: 1,
            used: false
          }
        ];
        await WorkingDay.insertMany(workingDays);
        console.log(`Sample working days created for ${alaaUserRef.name}`);
      }
    }

    if (banderUserRef) {
      const existingWorkingDays = await WorkingDay.find({ employee: banderUserRef._id });
      if (existingWorkingDays.length === 0) {
        const workingDays = [
          {
            employee: banderUserRef._id,
            day: 'Monday',
            date: new Date('2025-12-31'),
            remark: 'Worked on CCTV system upgrade',
            balance: 1,
            used: false
          },
          {
            employee: banderUserRef._id,
            day: 'Thursday',
            date: new Date('2025-12-31'),
            remark: 'CCTV maintenance and testing',
            balance: 1,
            used: false
          },
          {
            employee: banderUserRef._id,
            day: 'Monday',
            date: new Date('2025-12-23'),
            remark: 'CCTV system monitoring',
            balance: 1,
            used: false
          }
        ];
        await WorkingDay.insertMany(workingDays);
        console.log(`Sample working days created for ${banderUserRef.name}`);
      }
    }

    // ============================================================
    // EXAMPLE: ADD ANOTHER DEPARTMENT (Security) - SAME PATTERN
    // ============================================================
    // Uncomment this section to add a "Security" department
    // This demonstrates the pattern works for ANY department
    // 
    // const securityDept = await Department.findOne({ name: 'security' });
    // if (!securityDept) {
    //   const newSecurityDept = new Department({ name: 'security' });
    //   await newSecurityDept.save();
    //   console.log('\nDepartment "security" created');
    //
    //   // Create Ahmed as Security Manager
    //   let ahmed = await User.findOne({ email: 'ahmed@security.com' });
    //   if (!ahmed) {
    //     ahmed = new User({
    //       name: 'Ahmed',
    //       email: 'ahmed@security.com',
    //       passwordHash: 'Password123!',
    //       role: 'manager',
    //       department: newSecurityDept._id,
    //       section: null,
    //       employeeNo: '500001',
    //       signature: 'Ahmed Manager'
    //     });
    //     await ahmed.save();
    //     console.log('User Ahmed created as Security Manager');
    //   }
    //
    //   // Create Mohammad as Team Leader for Guards Section
    //   let mohammad = await User.findOne({ email: 'mohammad@security.com' });
    //   if (!mohammad) {
    //     mohammad = new User({
    //       name: 'Mohammad',
    //       email: 'mohammad@security.com',
    //       passwordHash: 'Password123!',
    //       role: 'team_leader',
    //       department: newSecurityDept._id,
    //       section: null,
    //       employeeNo: '500002',
    //       signature: 'Mohammad Leader'
    //     });
    //     await mohammad.save();
    //     console.log('User Mohammad created as Team Leader');
    //   }
    //
    //   // Create Guards Section
    //   let guardsSection = new Section({
    //     name: 'Guards',
    //     department: newSecurityDept._id,
    //     supervisor: mohammad._id,
    //     manager: ahmed._id
    //   });
    //   await guardsSection.save();
    //   console.log('Section "Guards" created');
    //
    //   // Update Mohammad with Guards section
    //   mohammad.section = guardsSection._id;
    //   await mohammad.save();
    //
    //   // Create Ali as employee in Guards section
    //   let ali = await User.findOne({ email: 'ali@security.com' });
    //   if (!ali) {
    //     ali = new User({
    //       name: 'Ali',
    //       email: 'ali@security.com',
    //       passwordHash: 'Password123!',
    //       role: 'employee',
    //       department: newSecurityDept._id,
    //       section: guardsSection._id,
    //       supervisor: mohammad._id,
    //       employeeNo: '500003',
    //       signature: 'Ali Employee'
    //     });
    //     await ali.save();
    //     console.log('User Ali created as Employee in Guards section');
    //
    //     // Add working days for Ali
    //     const ali_working_days = [
    //       { employee: ali._id, day: 'Monday', date: new Date('2025-12-31'), remark: 'Security duty', balance: 1, used: false },
    //       { employee: ali._id, day: 'Wednesday', date: new Date('2025-12-31'), remark: 'Patrol duty', balance: 1, used: false }
    //     ];
    //     for (const day of ali_working_days) {
    //       const exists = await WorkingDay.findOne({ employee: day.employee, day: day.day, date: day.date });
    //       if (!exists) {
    //         await WorkingDay.create(day);
    //       }
    //     }
    //     console.log('Working days for Ali created');
    //   }
    // }
    // 
    // RESULT when uncommented:
    // - Security Department created
    // - Ahmed as Security Manager (no section)
    // - Mohammad as Team Leader in Guards Section  
    // - Ali as Employee in Guards Section
    // - When Ali creates day-off request → automatically goes to Mohammad → then Ahmed
    // - NO CODE CHANGES NEEDED - same routing pattern works!

    console.log('\n=== Seeding completed ===');
    console.log('✅ System is fully scalable for any departments/sections');
    console.log('✅ Day-off routing is automatic based on section assignments');
    console.log('✅ See SEED_PATTERN.md for how to add more departments/sections\n');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
}

seedUsers();
