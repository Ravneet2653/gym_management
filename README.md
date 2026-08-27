# 🏋️ THE CLUSTER — Gym Management System
**DBMS Project | UCS310 | Thapar Institute of Engineering and Technology**

---

## 📁 Project Structure

```
gym-management/
├── server.js              # Main Express server
├── package.json           # Dependencies
├── schema.sql             # Full MySQL schema (tables, triggers, procedures, functions)
├── config/
│   └── db.js              # MySQL connection pool
├── routes/
│   ├── auth.js            # Login / Logout / Register
│   ├── gyms.js            # Gym CRUD
│   ├── members.js         # Member CRUD + workout info
│   ├── trainers.js        # Trainer CRUD + workout assign
│   ├── workouts.js        # Workout CRUD + enroll
│   ├── payments.js        # Payment CRUD
│   └── reports.js         # All 8 SQL queries from report
└── public/
    ├── css/style.css      # Full dark-theme stylesheet
    ├── js/
    │   ├── common.js      # Shared utilities (api, alerts, modals)
    │   └── sidebar.js     # Sidebar template
    └── pages/
        ├── login.html     # Login + Register page
        ├── dashboard.html # Stats + quick reports
        ├── gyms.html      # Gym management
        ├── members.html   # Member management
        ├── trainers.html  # Trainer management
        ├── workouts.html  # Workout management
        ├── payments.html  # Payment management
        └── reports.html   # All 8 SQL queries (tabbed)
```

---

## ⚙️ Setup Instructions

### Step 1: MySQL Database

1. Open MySQL Workbench or terminal
2. Run the full schema file:
   ```sql
   source path/to/gym-management/schema.sql;
   ```
   This will create:
   - All 13 tables
   - 3 Stored Procedures (add_instructs, update_member_mobile, add_member)
   - 3 Functions (get_member_age, get_member_workouts, get_trainer_workouts)
   - 6 Triggers (auto cascade deletes, trainer_time auto-insert)
   - Sample data

### Step 2: Configure DB Connection

Edit `config/db.js`:
```js
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'YOUR_MYSQL_PASSWORD',   // ← Change this
  database: 'gym_cluster',
  ...
});
```

### Step 3: Install Dependencies

```bash
cd gym-management
npm install
```

### Step 4: Run the Server

```bash
node server.js
```

Open browser: **http://localhost:3000**

---

## 🔐 First Login

1. Go to **http://localhost:3000**
2. Click **"Create admin account"**
3. Enter username and password
4. Login with those credentials

---

## 📊 Features

| Module      | Features |
|-------------|----------|
| Dashboard   | Stats overview, quick reports |
| Gyms        | Add/Edit/Delete gyms, set type (Men/Women/Unisex) |
| Members     | Add/Edit/Delete members, view workout enrollments |
| Trainers    | Add/Edit/Delete trainers, assign workouts, timeslots |
| Workouts    | Add/Edit/Delete workouts + plans, enroll members |
| Payments    | Add/Edit/Delete payments, total revenue |
| Reports     | All 8 SQL queries from the DBMS report |

---

## 🗃️ Database Elements (from report)

- **Tables**: login, gym, gym_type, payment, trainer, trainer_mobile_no, trainer_time, member, mem_mobile_no, workout, workout_plan, enrolls_to, instructs
- **Procedures**: add_instructs, update_member_mobile, add_member
- **Functions**: get_member_age, get_member_workouts, get_trainer_workouts
- **Triggers**: after_trainer_insert (auto time), after_trainer_delete (cascade), after_member_delete, after_workout_delete, after_payment_delete, after_gym_delete

 
**Thapar Institute of Engineering and Technology, Patiala**
