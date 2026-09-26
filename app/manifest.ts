import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HabitTrack — Student Habit Tracker & Study Focus",
    short_name: "HabitTrack",
    description:
      "A modern, full-stack productivity web app for students to build streaks, schedule habits, focus with Pomodoro, and achieve academic goals.",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAF9",
    theme_color: "#1B4332",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
