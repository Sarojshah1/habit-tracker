# HabitTrack — Full-Stack Habit Tracking Web Application

HabitTrack is a modern, full-stack productivity web application engineered specifically for students to schedule, track, analyze, and maintain daily routines and streaks. It combines habit scheduling, streak maintenance, monthly calendar reviews, detailed performance analytics, Pomodoro-style focus sessions, productivity notes, and customizable settings within a calm, productivity-focused light interface featuring a deep forest green brand aesthetic.

---

## 🚀 Key Features

- **Personalized Student Dashboard**:
  - Greeting with real profile name, dynamic time, and student productivity quote.
  - 4 Live Metric Stat Cards: *Habits Completed Today*, *Active Day Streak*, *Weekly Completion Rate*, *Goals in Progress*.
  - Interactive *Today's Habits* with optimistic checkbox completion, instant streak updates, and quick skip/archive/delete.
  - Recharts Weekly Progress bar chart (Mon–Sun) with hover details.
  - Mini Monthly Calendar heatmap with completion status indicators.
  - Active Goals progress bars and Recent Activity stream.
- **Habit Management (`/habits`)**:
  - Filter by *Active*, *All*, and *Archived* with live dynamic counts.
  - Modal to create & edit habits with custom color accents, icons, and flexible frequencies (Daily, Weekly, Specific Days, X Times Per Week).
  - Detailed habit drawer with current streak, all-time best streak, and lifetime completion rate.
- **Interactive Calendar (`/calendar`)**:
  - Full-month view with status indicators (*Green = completed*, *Orange = partial*, *Red = missed*, *Gray = no activity*).
  - Day inspector panel showing scheduled habits, completions, and direct check/skip toggles.
- **Deep Analytics (`/analytics`)**:
  - Trajectory Line Chart for completion rates across *Last 7 Days*, *Last 4 Weeks*, or *Last 3 Months*.
  - Habit Breakdown Donut Chart (Completed, Partial, Missed).
  - Most Consistent Habits ranking based on real completion rates.
  - Weekly Activity day-of-week breakdown (Mon–Sun).
- **Distraction-Free Focus Mode (`/focus`)**:
  - Pomodoro Timer with 25-minute, 10-minute, 50-minute, and custom duration modes.
  - Circular animated progress ring with start, pause, and reset controls.
  - Synthesized audio bell chime via the Web Audio API on session completion (zero external audio dependencies).
  - Session history logging associated with specific habits or general deep work.
- **Productivity Notes (`/notes`)**:
  - Split-pane layout with search, pin to top, and tag indicators.
  - Formatting toolbar: Bold, Italic, Underline, Headings, Bullet Lists, and Checklists.
  - Real-time autosave with status indicator (*Saving...*, *Saved*, *Error*).
- **Comprehensive Settings (`/settings`)**:
  - Profile customization (display name, IANA timezone, language).
  - Notification alert preferences (habit reminders, daily summaries, streak milestones).
  - Appearance preferences (light forest theme, dark accents, system sync).
  - Habit defaults (default reminder time, week start day).
  - Data privacy: One-click complete JSON data export and permanent account deletion.
- **Global Search**:
  - Top header search bar with live debounced search across personal habits, notes, and goals.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom Forest Green design palette
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT stored in secure HTTP-only cookies (`habittrack_auth_token`)
- **Password Security**: `bcryptjs` hashing with salt rounds
- **Form & Input Validation**: Zod
- **Charts & Data Visualizations**: Recharts
- **Icons**: Lucide React
- **Testing**: Vitest unit & integration test suite
- **Seed Script**: `tsx scripts/seed.ts`

---

## 📁 Folder Structure

```
habittrack/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                # AppShell wrapper
│   │   ├── dashboard/page.tsx        # Main student overview
│   │   ├── habits/page.tsx           # Habit management & filters
│   │   ├── calendar/page.tsx         # Monthly calendar & day inspector
│   │   ├── analytics/page.tsx        # Recharts visual analytics
│   │   ├── focus/page.tsx            # Pomodoro focus mode
│   │   ├── notes/page.tsx            # Productivity notes & autosave
│   │   └── settings/page.tsx         # Settings & data privacy
│   ├── api/
│   │   ├── auth/                     # login, register, logout, me, reset
│   │   ├── dashboard/                # Aggregated dashboard payload
│   │   ├── habits/                   # Habit CRUD & archive
│   │   ├── completions/              # Habit completions & skips
│   │   ├── calendar/                 # Monthly calendar data
│   │   ├── analytics/                # Historical trends & rankings
│   │   ├── goals/                    # Goals CRUD & progress
│   │   ├── focus/sessions/           # Focus sessions logging
│   │   ├── notes/                    # Notes CRUD & autosave
│   │   ├── settings/                 # Profile, preferences, export, delete
│   │   └── search/                   # Global search
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                      # Modern landing page
├── components/
│   ├── calendar/MonthCalendar.tsx
│   ├── focus/FocusTimer.tsx
│   ├── habits/
│   │   ├── HabitDetailModal.tsx
│   │   └── HabitFormModal.tsx
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopHeader.tsx
│   ├── notes/NoteEditor.tsx
│   └── ui/
│       ├── ConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── ErrorState.tsx
│       ├── HabitIcon.tsx
│       ├── LoadingSkeleton.tsx
│       ├── Logo.tsx
│       ├── Modal.tsx
│       └── StatCard.tsx
├── lib/
│   ├── auth/
│   │   ├── jwt.ts
│   │   └── middleware.ts
│   ├── db/mongodb.ts
│   ├── models/
│   │   ├── Activity.ts
│   │   ├── FocusSession.ts
│   │   ├── Goal.ts
│   │   ├── Habit.ts
│   │   ├── HabitCompletion.ts
│   │   ├── Note.ts
│   │   └── User.ts
│   ├── services/
│   │   ├── activity.ts
│   │   └── streak.ts
│   ├── utils/date.ts
│   ├── validations/
│   └── utils.ts
├── middleware.ts                     # Next.js route protection
├── scripts/seed.ts                   # Realistic seed data script
└── tests/                            # Vitest automated test suites
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB Connection String
MONGODB_URI=mongodb://127.0.0.1:27017/habittrack

# JWT Authentication Secret
AUTH_SECRET=habittrack-super-secret-jwt-key-for-student-productivity-app-2026

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📦 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed Database (Demo Student Account)
Populate realistic 30-day history with active 12-day streaks, habits, goals, focus sessions, and notes:
```bash
npm run seed
```

**Demo Account Credentials**:
- **Email**: `student@example.com`
- **Password**: `password123`

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production
```bash
npm run build
npm run start
```

---

## 🔒 Security Architecture

- **HTTP-Only Cookies**: Authentication JWTs are stored with `httpOnly: true`, `sameSite: "lax"`, and path restricted to `/`.
- **Password Hashing**: Passwords hashed with `bcryptjs` using 10 salt rounds. Plaintext passwords and hashes are never exposed in API outputs.
- **Resource Ownership Scoping**: Every database query verifies `userId: user._id`. User A cannot view, mutate, or delete User B's habits or notes.
- **Unique Compound Indexing**: `HabitCompletion` enforces a unique compound index on `{ userId: 1, habitId: 1, date: 1 }` preventing duplicate completion records.
- **Server Route Protection**: Next.js middleware enforces redirection to `/login` for unauthenticated requests to `/dashboard`, `/habits`, `/calendar`, `/analytics`, `/focus`, `/notes`, and `/settings`.
