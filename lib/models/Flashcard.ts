import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFlashcard extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  noteId?: mongoose.Types.ObjectId;
  deck: string; // e.g. "Organic Chemistry", "System Design", "World History"
  front: string; // Question or prompt
  back: string; // Answer or explanation
  intervalDays: number; // Spaced repetition interval (e.g. 1, 3, 7, 14, 30)
  repetition: number; // Number of consecutive correct reviews
  easeFactor: number; // Default 2.5 (SuperMemo-2 algorithm)
  dueDate: string; // YYYY-MM-DD
  lastReviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const FlashcardSchema = new Schema<IFlashcard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    noteId: {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
    deck: {
      type: String,
      required: [true, "Deck name is required"],
      trim: true,
      maxlength: [100, "Deck name cannot exceed 100 characters"],
      default: "General Review",
      index: true,
    },
    front: {
      type: String,
      required: [true, "Card front/prompt is required"],
      trim: true,
    },
    back: {
      type: String,
      required: [true, "Card back/answer is required"],
      trim: true,
    },
    intervalDays: {
      type: Number,
      default: 1, // Start with 1-day interval
    },
    repetition: {
      type: Number,
      default: 0,
    },
    easeFactor: {
      type: Number,
      default: 2.5,
    },
    dueDate: {
      type: String,
      required: true,
      index: true,
    },
    lastReviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

FlashcardSchema.index({ userId: 1, dueDate: 1 });
FlashcardSchema.index({ userId: 1, deck: 1 });

export const Flashcard: Model<IFlashcard> =
  mongoose.models.Flashcard || mongoose.model<IFlashcard>("Flashcard", FlashcardSchema);
