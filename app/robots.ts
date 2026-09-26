import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/features/",
          "/guides/",
          "/about",
          "/privacy",
          "/terms",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
        ],
        disallow: [
          "/api/",
          "/dashboard/",
          "/habits/",
          "/calendar/",
          "/analytics/",
          "/focus/",
          "/notes/",
          "/settings/",
          "/tasks/",
          "/goals/",
          "/exams/",
          "/flashcards/",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
