import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../lib/models/User";
import { Habit } from "../lib/models/Habit";
import { HabitCompletion } from "../lib/models/HabitCompletion";
import { Goal } from "../lib/models/Goal";
import { FocusSession } from "../lib/models/FocusSession";
import { Note } from "../lib/models/Note";
import { Activity } from "../lib/models/Activity";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/habittrack";

function getDateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

async function seed() {
  console.log("🌱 Connecting to MongoDB:", MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  console.log(" Connected to MongoDB");

  const email = "student@example.com";
  const password = "password123";

  // Clean previous demo data for student
  const existing = await User.findOne({ email });
  if (existing) {
    const uid = existing._id;
    await Habit.deleteMany({ userId: uid });
    await HabitCompletion.deleteMany({ userId: uid });
    await Goal.deleteMany({ userId: uid });
    await FocusSession.deleteMany({ userId: uid });
    await Note.deleteMany({ userId: uid });
    await Activity.deleteMany({ userId: uid });
    await User.deleteOne({ _id: uid });
    console.log(" Cleared previous seed data for student@example.com");
  }

  // 1. Create User
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const student = await User.create({
    name: "Student",
    email,
    passwordHash,
    timezone: "UTC",
    language: "en",
    preferences: {
      notifications: {
        habitReminders: true,
        dailySummary: true,
        streakReminders: true,
        goalReminders: true,
        focusNotifications: true,
      },
      appearance: "light",
      habitPreferences: {
        defaultReminderTime: "08:00",
        weekStartsOn: "monday",
        defaultHabitView: "list",
      },
    },
  });

  console.log(` Created student user: ${email} / ${password}`);

  // 2. Create Habits
  const habitsData = [
    {
      userId: student._id,
      name: "Study for 2 hours",
      description: "Deep focused study session on core academic subjects.",
      icon: "book-open",
      color: "#1B4332",
      frequency: "daily",
      schedule: { time: "08:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timesPerWeek: 7 },
      startDate: getDateStr(30),
      active: true,
      archived: false,
    },
    {
      userId: student._id,
      name: "Read a book",
      description: "Read at least 20 pages of non-fiction or course literature.",
      icon: "book",
      color: "#2D6A4F",
      frequency: "daily",
      schedule: { time: "10:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timesPerWeek: 7 },
      startDate: getDateStr(30),
      active: true,
      archived: false,
    },
    {
      userId: student._id,
      name: "Exercise",
      description: "Gym workout, jogging, or home calisthenics.",
      icon: "activity",
      color: "#F97316",
      frequency: "specific_days",
      schedule: { time: "17:00", daysOfWeek: [1, 3, 5], timesPerWeek: 3 },
      startDate: getDateStr(30),
      active: true,
      archived: false,
    },
    {
      userId: student._id,
      name: "Drink water",
      description: "Stay hydrated with at least 2.5 liters throughout the day.",
      icon: "droplet",
      color: "#2563EB",
      frequency: "daily",
      schedule: { time: "09:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timesPerWeek: 7 },
      startDate: getDateStr(30),
      active: true,
      archived: false,
    },
    {
      userId: student._id,
      name: "Meditate",
      description: "Mindfulness meditation and breathing relaxation before sleep.",
      icon: "moon",
      color: "#7C3AED",
      frequency: "daily",
      schedule: { time: "21:00", daysOfWeek: [0, 1, 2, 3, 4, 5, 6], timesPerWeek: 7 },
      startDate: getDateStr(30),
      active: true,
      archived: false,
    },
  ];

  const habits = await Habit.insertMany(habitsData);
  console.log(` Created ${habits.length} habits`);

  // 3. Create 30 days of completion records to yield a 12-day streak up to today
  // Let days 0 to 11 (last 12 days) all have completions
  const studyHabit = habits[0];
  const readHabit = habits[1];
  const exerciseHabit = habits[2];
  const waterHabit = habits[3];
  const meditateHabit = habits[4];

  const completionsToInsert = [];

  for (let d = 0; d < 30; d++) {
    const dateStr = getDateStr(d);
    const dayOfWeek = new Date(dateStr + "T12:00:00Z").getUTCDay();

    // Days 0 to 11: consecutive completions (streak = 12)
    // Day 12: missed or partial
    // Days 13 to 25: mostly completed
    const isInCurrentStreak = d <= 11;

    // Water: 100% completion
    completionsToInsert.push({
      userId: student._id,
      habitId: waterHabit._id,
      date: dateStr,
      status: "completed",
      completedAt: new Date(),
    });

    // Read: 88% completion (misses every 8th day)
    if (d % 8 !== 4) {
      completionsToInsert.push({
        userId: student._id,
        habitId: readHabit._id,
        date: dateStr,
        status: "completed",
        completedAt: new Date(),
      });
    }

    // Study: 75% completion (on days 0-11 active, plus scattered earlier)
    if (isInCurrentStreak || d % 4 !== 0) {
      completionsToInsert.push({
        userId: student._id,
        habitId: studyHabit._id,
        date: dateStr,
        status: "completed",
        completedAt: new Date(),
      });
    }

    // Meditate: 63% completion
    if (d % 3 !== 0) {
      completionsToInsert.push({
        userId: student._id,
        habitId: meditateHabit._id,
        date: dateStr,
        status: "completed",
        completedAt: new Date(),
      });
    }

    // Exercise: Mon (1), Wed (3), Fri (5)
    if ([1, 3, 5].includes(dayOfWeek)) {
      if (d % 2 === 0 || isInCurrentStreak) {
        completionsToInsert.push({
          userId: student._id,
          habitId: exerciseHabit._id,
          date: dateStr,
          status: "completed",
          completedAt: new Date(),
        });
      } else {
        completionsToInsert.push({
          userId: student._id,
          habitId: exerciseHabit._id,
          date: dateStr,
          status: "skipped",
          completedAt: new Date(),
        });
      }
    }
  }

  await HabitCompletion.insertMany(completionsToInsert);
  console.log(` Created ${completionsToInsert.length} completion records`);

  // 4. Create Goals
  const goalsData = [
    {
      userId: student._id,
      title: "Maintain a 30-day study streak",
      description: "Consistent daily study sessions without skipping a day.",
      targetValue: 30,
      currentValue: 12,
      unit: "days",
      startDate: getDateStr(12),
      endDate: getDateStr(-18),
      status: "active",
      associatedHabitIds: [studyHabit._id],
    },
    {
      userId: student._id,
      title: "Read 5 books this month",
      description: "Complete 5 selected books on psychology, architecture, and technology.",
      targetValue: 5,
      currentValue: 3,
      unit: "books",
      startDate: getDateStr(15),
      endDate: getDateStr(-15),
      status: "active",
      associatedHabitIds: [readHabit._id],
    },
    {
      userId: student._id,
      title: "Exercise 3 times per week",
      description: "Strength training and endurance workouts every week.",
      targetValue: 3,
      currentValue: 3,
      unit: "workouts/week",
      startDate: getDateStr(7),
      endDate: getDateStr(-21),
      status: "active",
      associatedHabitIds: [exerciseHabit._id],
    },
  ];

  await Goal.insertMany(goalsData);
  console.log(` Created ${goalsData.length} goals`);

  // 5. Create Notes
  const notesData = [
    {
      userId: student._id,
      title: "Study Plan & Strategy",
      content:
        "# Semester Focus & Study Plan\n\n- [x] Review Computer Architecture notes\n- [x] Read clean code architecture principles\n- [ ] Complete database optimization drills\n- [ ] Practice algorithm problem sets\n\n*Key takeaway*: Always focus 50 minutes uninterrupted with 10-minute active recovery breaks.",
      tags: ["study", "planning"],
      pinned: true,
      archived: false,
    },
    {
      userId: student._id,
      title: "Book Ideas & Reading List",
      content:
        "## Reading Queue for 2026\n\n1. **Atomic Habits** — James Clear (Essential for habit loops)\n2. **Deep Work** — Cal Newport (Rules for focused success)\n3. **Designing Data-Intensive Applications** — Martin Kleppmann\n4. **Mindset** — Carol Dweck",
      tags: ["books", "learning"],
      pinned: true,
      archived: false,
    },
    {
      userId: student._id,
      title: "Exam Preparation Notes",
      content:
        "### Final Examination Checklist\n\n- Review distributed systems patterns\n- High availability & ACID vs BASE properties\n- MongoDB compound indexes and sharding keys\n- Mock test scheduled for next Friday",
      tags: ["exams", "notes"],
      pinned: false,
      archived: false,
    },
    {
      userId: student._id,
      title: "Habit Reflection & Weekly Review",
      content:
        "Consistency has been substantially improved over the past two weeks. The 12-day streak feels natural now. Staying hydrated throughout the morning directly improves afternoon energy levels during study sessions.",
      tags: ["reflection"],
      pinned: false,
      archived: false,
    },
    {
      userId: student._id,
      title: "Goals for This Month",
      content:
        "1. Hit 25 days continuous study streak\n2. Finish 'Designing Data-Intensive Applications'\n3. Maintain hydration habit at 100%\n4. Complete 10 full Pomodoro focus sessions",
      tags: ["goals"],
      pinned: false,
      archived: false,
    },
  ];

  await Note.insertMany(notesData);
  console.log(` Created ${notesData.length} notes`);

  // 6. Create Focus Sessions
  const focusSessions = [
    {
      userId: student._id,
      duration: 50,
      status: "completed",
      habitId: studyHabit._id,
      notes: "Completed chapter 4 review and summarized key formulas.",
      startedAt: new Date(Date.now() - 3 * 3600 * 1000),
      completedAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
    {
      userId: student._id,
      duration: 25,
      status: "completed",
      habitId: readHabit._id,
      notes: "Read 25 pages of Atomic Habits.",
      startedAt: new Date(Date.now() - 5 * 3600 * 1000),
      completedAt: new Date(Date.now() - 4.5 * 3600 * 1000),
    },
    {
      userId: student._id,
      duration: 25,
      status: "completed",
      habitId: studyHabit._id,
      notes: "Solved 3 algorithmic challenges.",
      startedAt: new Date(Date.now() - 24 * 3600 * 1000),
      completedAt: new Date(Date.now() - 23.5 * 3600 * 1000),
    },
  ];

  await FocusSession.insertMany(focusSessions);
  console.log(` Created ${focusSessions.length} focus sessions`);

  // 7. Create Activities
  const activities = [
    {
      userId: student._id,
      type: "habit_completed",
      metadata: { habitName: "Study for 2 hours", date: getDateStr(0) },
      createdAt: new Date(Date.now() - 15 * 60 * 1000),
    },
    {
      userId: student._id,
      type: "habit_completed",
      metadata: { habitName: "Read a book", date: getDateStr(0) },
      createdAt: new Date(Date.now() - 45 * 60 * 1000),
    },
    {
      userId: student._id,
      type: "focus_session_completed",
      metadata: { habitName: "Study for 2 hours", duration: 50 },
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
    },
    {
      userId: student._id,
      type: "habit_completed",
      metadata: { habitName: "Drink water", date: getDateStr(0) },
      createdAt: new Date(Date.now() - 3 * 3600 * 1000),
    },
    {
      userId: student._id,
      type: "note_created",
      metadata: { title: "Study Plan & Strategy" },
      createdAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
    {
      userId: student._id,
      type: "goal_created",
      metadata: { goalTitle: "Maintain a 30-day study streak" },
      createdAt: new Date(Date.now() - 48 * 3600 * 1000),
    },
  ];

  await Activity.insertMany(activities);
  console.log(` Created ${activities.length} activities`);

  console.log(" Seed completed successfully!");
  console.log("-----------------------------------------");
  console.log("Demo Credentials:");
  console.log("Email:    student@example.com");
  console.log("Password: password123");
  console.log("-----------------------------------------");

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
