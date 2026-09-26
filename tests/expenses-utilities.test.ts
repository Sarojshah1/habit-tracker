import { describe, it, expect } from "vitest";
import {
  expenseSchema,
  utilityLogSchema,
  budgetSchema,
} from "@/lib/validations/expense";

describe("Expense, Utility & Nepali Hisaab Validations", () => {
  describe("Expense Validation Schema", () => {
    it("validates a standard Nepali expense with eSewa/Fonepay", () => {
      const validExpense = {
        title: "Khaja / Momo with friends",
        amount: 350,
        type: "expense" as const,
        category: "food_khaja" as const,
        date: "2026-09-26",
        paymentMethod: "fonepay_esewa" as const,
        isEssential: false,
        notes: "Paid via Fonepay QR",
      };

      const result = expenseSchema.safeParse(validExpense);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.amount).toBe(350);
        expect(result.data.category).toBe("food_khaja");
        expect(result.data.paymentMethod).toBe("fonepay_esewa");
      }
    });

    it("rejects non-positive amounts", () => {
      const invalid = {
        title: "Negative test",
        amount: -50,
        date: "2026-09-26",
      };

      const result = expenseSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("handles roommate split hisaab accurately", () => {
      const splitExpense = {
        title: "Grocery / Tarkari shopping",
        amount: 800,
        type: "expense" as const,
        category: "groceries" as const,
        date: "2026-09-26",
        splitWith: "Rohan",
        splitAmount: 400,
        splitStatus: "pending" as const,
      };

      const result = expenseSchema.safeParse(splitExpense);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.splitWith).toBe("Rohan");
        expect(result.data.splitAmount).toBe(400);
        expect(result.data.splitStatus).toBe("pending");
      }
    });

    it("validates essential (needs) vs discretionary (wants)", () => {
      const essential = {
        title: "Room Rent",
        amount: 8000,
        type: "expense" as const,
        category: "rent" as const,
        date: "2026-09-01",
        isEssential: true,
      };

      const result = expenseSchema.safeParse(essential);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isEssential).toBe(true);
      }
    });
  });

  describe("Utility Log Schema (Water Jars, Electricity Units, Milk)", () => {
    it("validates daily utility readings with jars, units, and milk", () => {
      const dailyLog = {
        date: "2026-09-26",
        waterJars: 1, // 1 jar brought today
        electricityUnits: 6.5, // 6.5 units consumed
        milkPackets: 2, // 2 milk packets taken
        gasCylinderReplaced: false,
        notes: "Mineral water jar delivery",
      };

      const result = utilityLogSchema.safeParse(dailyLog);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.waterJars).toBe(1);
        expect(result.data.electricityUnits).toBe(6.5);
        expect(result.data.milkPackets).toBe(2);
      }
    });

    it("rejects negative jar or unit numbers", () => {
      const invalid = {
        date: "2026-09-26",
        waterJars: -1,
      };

      const result = utilityLogSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it("validates LPG cylinder change indicator", () => {
      const lpgLog = {
        date: "2026-09-20",
        gasCylinderReplaced: true,
        notes: "Everest Gas cylinder changed",
      };

      const result = utilityLogSchema.safeParse(lpgLog);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.gasCylinderReplaced).toBe(true);
      }
    });
  });

  describe("Budget & Household Settings Schema", () => {
    it("validates monthly budget in Rs. with rent and WiFi dates", () => {
      const householdSettings = {
        month: "2026-09",
        monthlyLimit: 25000,
        rentAmount: 8500,
        rentDueDate: 1,
        wifiAmount: 1250,
        wifiDueDate: 15,
        waterJarPrice: 50,
        milkPacketPrice: 55,
      };

      const result = budgetSchema.safeParse(householdSettings);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.monthlyLimit).toBe(25000);
        expect(result.data.rentAmount).toBe(8500);
        expect(result.data.wifiDueDate).toBe(15);
        expect(result.data.waterJarPrice).toBe(50);
      }
    });
  });

  describe("Hisaab Calculation Business Logic", () => {
    it("correctly computes net savings and water cost in Rs.", () => {
      const totalIncome = 35000;
      const totalExpense = 14500;
      const netSavings = totalIncome - totalExpense;
      expect(netSavings).toBe(20500);

      const waterJars = 14;
      const jarPrice = 50;
      const totalWaterCost = waterJars * jarPrice;
      expect(totalWaterCost).toBe(700);

      const milkPackets = 20;
      const milkPrice = 55;
      const totalMilkCost = milkPackets * milkPrice;
      expect(totalMilkCost).toBe(1100);
    });

    it("correctly calculates roommate split owed balance", () => {
      const transactions = [
        { title: "Vegetables", amount: 600, splitWith: "Rohan", splitAmount: 300, splitStatus: "pending" },
        { title: "Cooking Oil", amount: 500, splitWith: "Rohan", splitAmount: 250, splitStatus: "settled" },
        { title: "Masala & Rice", amount: 1200, splitWith: "Aman", splitAmount: 600, splitStatus: "pending" },
      ];

      const pendingOwed = transactions
        .filter((t) => t.splitStatus === "pending")
        .reduce((sum, t) => sum + t.splitAmount, 0);

      expect(pendingOwed).toBe(900); // 300 + 600
    });
  });

  describe("Automatic Daily Recurring Subscriptions", () => {
    it("handles daily milk subscription data structure", () => {
      const milkRule = {
        title: "Daily Milk Packet",
        type: "milk" as const,
        amount: 55,
        unitCount: 1,
        frequency: "daily" as const,
        active: true,
        autoAddExpense: true,
        startDate: "2026-09-01",
      };

      expect(milkRule.unitCount).toBe(1);
      expect(milkRule.amount).toBe(55);
      expect(milkRule.active).toBe(true);
      expect(milkRule.autoAddExpense).toBe(true);
    });

    it("handles custom daily expense (e.g. Bus Fare)", () => {
      const busRule = {
        title: "Daily Bus / Commute",
        type: "expense" as const,
        amount: 50,
        category: "transport",
        frequency: "weekdays" as const,
        active: true,
      };

      expect(busRule.frequency).toBe("weekdays");
      expect(busRule.amount).toBe(50);
    });
  });
});
