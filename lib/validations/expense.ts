import { z } from "zod";

export const expenseCategoryEnum = z.enum([
  "food_khaja",
  "groceries",
  "rent",
  "utilities",
  "college_books",
  "transport",
  "entertainment",
  "shopping",
  "health",
  "bills",
  "other",
]);

export const paymentMethodEnum = z.enum([
  "fonepay_esewa",
  "cash",
  "bank",
  "card",
  "other",
]);

export const expenseSchema = z.object({
  title: z.string().min(1, "Title is required").max(150, "Title too long").trim(),
  amount: z.number().positive("Amount must be greater than zero"),
  type: z.enum(["expense", "income"]).default("expense"),
  category: expenseCategoryEnum.default("food_khaja"),
  isEssential: z.boolean().default(false),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  paymentMethod: paymentMethodEnum.default("fonepay_esewa"),
  habitId: z.string().optional().nullable(),
  splitWith: z.string().max(100).optional().default(""),
  splitAmount: z.number().min(0).optional().default(0),
  splitStatus: z.enum(["pending", "settled"]).optional().default("pending"),
  notes: z.string().max(500).optional().default(""),
});

export const updateExpenseSchema = expenseSchema.partial();

export const utilityLogSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  waterJars: z.number().min(0, "Jars cannot be negative").default(0),
  electricityUnits: z.number().min(0, "Electricity units cannot be negative").default(0),
  milkPackets: z.number().min(0, "Milk packets cannot be negative").default(0),
  gasCylinderReplaced: z.boolean().default(false),
  notes: z.string().max(300).optional().default(""),
});

export const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM"),
  monthlyLimit: z.number().min(0, "Monthly limit cannot be negative"),
  dailyLimit: z.number().min(0).optional().default(0),
  rentAmount: z.number().min(0).optional().default(0),
  rentDueDate: z.number().min(1).max(31).optional().default(1),
  wifiAmount: z.number().min(0).optional().default(0),
  wifiDueDate: z.number().min(1).max(31).optional().default(15),
  waterJarPrice: z.number().min(0).optional().default(50),
  milkPacketPrice: z.number().min(0).optional().default(55),
  lastLpgDate: z.string().optional().default(""),
  categoryLimits: z.record(z.string(), z.number()).optional().default({}),
});
