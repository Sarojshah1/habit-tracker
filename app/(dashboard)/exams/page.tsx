"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Plus,
  TrendingUp,
  Search,
  Filter,
  Trash2,
  Calendar,
  Clock,
  Tag,
  CheckCircle,
  BarChart2,
  BookOpen,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { MockExamModal } from "@/components/exams/MockExamModal";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function ExamsPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [stats, setStats] = useState({ totalExams: 0, avgScore: 0, highestScore: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchExams = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const url =
        selectedSubject === "all"
          ? "/api/exams"
          : `/api/exams?subject=${encodeURIComponent(selectedSubject)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setExams(data.exams);
        setSubjects(data.subjects || []);
        setStats(data.stats || { totalExams: 0, avgScore: 0, highestScore: 0 });
      }
    } catch (err) {
      console.error("Failed to load mock exams:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSubject]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/exams/${deletingId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setExams((prev) => prev.filter((e) => e._id !== deletingId));
        setDeletingId(null);
        fetchExams();
      }
    } catch (err) {
      console.error("Failed to delete exam:", err);
    }
  };

  // Sort chronological for score trend chart
  const chartData = [...exams]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => ({
      name: e.title.length > 15 ? e.title.substring(0, 12) + "..." : e.title,
      score: e.percentage,
      date: e.date,
      subject: e.subject,
    }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Mock Exam & Test Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Record test scores, track score improvement trajectories, and target weak topics.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Log Exam Score
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Tests Logged
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
              {stats.totalExams}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Average Score
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
              {stats.avgScore}%
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Highest Score
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
              {stats.highestScore}%
            </h3>
          </div>
        </div>
      </div>

      {/* Score Improvement Trajectory Chart */}
      {chartData.length > 1 && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Score Improvement Curve
              </h3>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                Test performance percentage over time
              </p>
            </div>
            <span className="text-xs font-bold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-950/50 px-2.5 py-1 rounded-xl">
              Target: 90%+
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-gray-800" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  className="text-gray-400 dark:text-gray-500"
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                  className="text-gray-400 dark:text-gray-500"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-xl shadow-lg border border-gray-700 text-xs">
                          <p className="font-bold">{data.name}</p>
                          <p className="text-gray-300">{data.subject}</p>
                          <p className="text-emerald-400 font-black mt-1">
                            Score: {data.score}%
                          </p>
                          <p className="text-gray-400 text-[10px] mt-0.5">{data.date}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#1B4332"
                  strokeWidth={3}
                  dot={{ r: 5, fill: "#2D6A4F" }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Filter Tabs by Subject */}
      {subjects.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedSubject("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedSubject === "all"
                ? "bg-forest-700 text-white shadow-xs"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
            }`}
          >
            All Subjects ({stats.totalExams})
          </button>
          {subjects.map((sub) => (
            <button
              key={sub}
              type="button"
              onClick={() => setSelectedSubject(sub)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedSubject === sub
                  ? "bg-forest-700 text-white shadow-xs"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
              }`}
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Exam Cards Grid */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : exams.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No Mock Exams Logged Yet"
          description="Log your first mock exam score or complete an exam session in Focus Mode to see performance insights."
          actionText="Log Mock Exam"
          onAction={() => setIsModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    {exam.subject}
                  </span>
                  <button
                    type="button"
                    onClick={() => setDeletingId(exam._id)}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="font-bold text-gray-900 dark:text-gray-100 text-base mt-2 line-clamp-1">
                  {exam.title}
                </h4>

                {/* Score Big Display */}
                <div className="flex items-baseline gap-2 mt-3">
                  <span className="text-3xl font-black text-forest-800 dark:text-forest-300">
                    {exam.score}
                  </span>
                  <span className="text-sm font-semibold text-gray-400">
                    / {exam.totalMarks}
                  </span>
                  <span className="ml-auto text-sm font-extrabold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-950/60 px-2 py-0.5 rounded-lg">
                    {exam.percentage}%
                  </span>
                </div>

                {/* Progress bar visual */}
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      exam.percentage >= 80
                        ? "bg-emerald-500"
                        : exam.percentage >= 60
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${Math.min(100, exam.percentage)}%` }}
                  />
                </div>

                {/* Weak Topics */}
                {exam.weakTopics && exam.weakTopics.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">
                      Review Needed:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {exam.weakTopics.map((topic: string) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {exam.notes && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 line-clamp-2 italic">
                    &quot;{exam.notes}&quot;
                  </p>
                )}
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {exam.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {exam.durationMinutes} mins
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <MockExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchExams}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Mock Exam Record"
        message="Are you sure you want to delete this test result? This action cannot be undone."
        isDestructive={true}
        confirmText="Delete"
      />
    </div>
  );
}
