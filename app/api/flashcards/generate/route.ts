import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";

export const dynamic = "force-dynamic";

interface GeneratedCard {
  front: string;
  back: string;
}

// Built-in topic knowledge bank for common student subjects (instant, offline)
const CURRICULUM_BANK: Record<string, GeneratedCard[]> = {
  "data structures": [
    {
      front: "What is the time complexity of searching, inserting, and deleting in an average Balanced BST (AVL/Red-Black)?",
      back: "O(log n) for all three operations, due to the tree maintaining height h = O(log n).",
    },
    {
      front: "Explain the difference between a Stack and a Queue in terms of principle and primary operations.",
      back: "Stack: LIFO (Last In First Out) with push() and pop(). Queue: FIFO (First In First Out) with enqueue() and dequeue().",
    },
    {
      front: "Why does a Hash Table achieve O(1) average lookup, and what is a hash collision?",
      back: "A hash function maps keys directly into an array index in O(1). A collision occurs when two distinct keys produce the same index, resolved via separate chaining or open addressing.",
    },
    {
      front: "What is the difference between an Array and a Linked List in memory layout and indexing?",
      back: "Arrays allocate contiguous memory blocks allowing O(1) random indexing. Linked Lists use scattered nodes with pointers requiring O(n) sequential traversal.",
    },
    {
      front: "When would you choose a Max-Heap over a sorted array?",
      back: "When you need frequent retrieval/removal of the maximum element (O(1) peek, O(log n) pop) and O(log n) insertion without paying O(n) array shift overhead.",
    },
  ],
  "operating systems": [
    {
      front: "What are the four necessary conditions for a Deadlock to occur (Coffman conditions)?",
      back: "1. Mutual Exclusion\n2. Hold and Wait\n3. No Preemption\n4. Circular Wait",
    },
    {
      front: "What is the difference between a Process and a Thread?",
      back: "A Process is an executing program instance with its own isolated virtual address space. A Thread is a lightweight unit of execution sharing the process address space, heap, and open files.",
    },
    {
      front: "What causes a Page Fault in virtual memory, and how does the OS handle it?",
      back: "A page fault occurs when a program accesses a virtual page not currently mapped in physical RAM (valid bit = 0). The OS traps, loads the page from disk swap into a free RAM frame, updates the page table, and resumes execution.",
    },
    {
      front: "Explain the difference between Preemptive and Non-Preemptive scheduling.",
      back: "Preemptive: The OS can interrupt a running process (e.g. Round Robin, SRTF). Non-Preemptive: A process runs until it voluntarily yields or terminates (e.g. FCFS).",
    },
  ],
  "computer networks": [
    {
      front: "What are the 7 layers of the OSI model from bottom to top?",
      back: "1. Physical\n2. Data Link\n3. Network\n4. Transport\n5. Session\n6. Presentation\n7. Application\n(Mnemonic: Please Do Not Throw Sausage Pizza Away)",
    },
    {
      front: "Explain the TCP Three-Way Handshake.",
      back: "1. Client sends SYN (synchronize sequence number)\n2. Server responds with SYN-ACK\n3. Client acknowledges with ACK\nConnection is established.",
    },
    {
      front: "What is the difference between TCP and UDP?",
      back: "TCP is connection-oriented, reliable, guarantees in-order delivery via acknowledgments and retransmission. UDP is connectionless, lightweight, unordered, with minimal header overhead (ideal for streaming/gaming).",
    },
    {
      front: "What is the function of ARP (Address Resolution Protocol)?",
      back: "ARP translates an IPv4 address (logical 32-bit address) into a physical MAC address (hardware 48-bit address) on the local link layer.",
    },
  ],
};

function generateCardsFromNotes(notes: string, topic: string): GeneratedCard[] {
  const cards: GeneratedCard[] = [];
  const lines = notes
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  for (const line of lines) {
    // Check for definition syntax: "Term: Definition" or "Term - Definition"
    const colonMatch = line.match(/^([^:\-—]{3,35})\s*[:\-—]\s*(.+)$/);
    if (colonMatch && colonMatch[2].length > 8) {
      cards.push({
        front: `What is ${colonMatch[1].trim()}?`,
        back: colonMatch[2].trim(),
      });
      continue;
    }

    // Check for Q&A syntax: "Q: ... A: ..."
    const qaMatch = line.match(/^Q:\s*(.+?)\s*A:\s*(.+)$/i);
    if (qaMatch) {
      cards.push({
        front: qaMatch[1].trim(),
        back: qaMatch[2].trim(),
      });
      continue;
    }

    // Bullet points with concepts
    const cleanLine = line.replace(/^[-*•\d+.]\s*/, "").trim();
    if (cleanLine.length > 25 && cleanLine.includes(" because ")) {
      const parts = cleanLine.split(" because ");
      cards.push({
        front: `Why does ${parts[0].trim()}?`,
        back: `Because ${parts[1].trim()}`,
      });
    } else if (cleanLine.length > 25 && cards.length < 8) {
      cards.push({
        front: `Explain the key principle regarding: "${cleanLine.slice(0, 50)}..."`,
        back: cleanLine,
      });
    }
  }

  // If notes had few parseable lines, fill with active recall prompts for the topic
  if (cards.length < 3) {
    cards.push(...generateHeuristicCardsForTopic(topic));
  }

  return cards.slice(0, 10);
}

function generateHeuristicCardsForTopic(topic: string): GeneratedCard[] {
  const cleanKey = topic.toLowerCase().trim();

  // Check matching curriculum bank
  for (const [key, prebuilt] of Object.entries(CURRICULUM_BANK)) {
    if (cleanKey.includes(key) || key.includes(cleanKey)) {
      return prebuilt;
    }
  }

  // Active recall conceptual template for any topic
  return [
    {
      front: `What is the core definition and fundamental purpose of ${topic}?`,
      back: `${topic} is a foundational concept designed to address specific requirements, structures, or methodologies in this field.`,
    },
    {
      front: `What are the primary components, mechanisms, or principles governing ${topic}?`,
      back: `Key components include its foundational rules, input/output behaviors, and operational constraints that determine how ${topic} functions in practice.`,
    },
    {
      front: `What are the most common mistakes, pitfalls, or edge cases when applying ${topic}?`,
      back: `Failing to account for boundary conditions, misinterpreting underlying assumptions, or confusing ${topic} with closely related concepts.`,
    },
    {
      front: `How does ${topic} compare and contrast with its primary alternatives?`,
      back: `It offers trade-offs between complexity, performance, simplicity, and resource utilization compared to adjacent methods.`,
    },
    {
      front: `Provide a real-world scenario or exam problem illustrating ${topic}.`,
      back: `Identify the scenario requirements, verify the criteria where ${topic} applies, and trace step-by-step to the validated conclusion.`,
    },
  ];
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { topic = "", notes = "", deck = "", count = 6 } = body;

    if (!topic.trim() && !notes.trim()) {
      return NextResponse.json(
        { success: false, message: "Please provide a topic or notes to generate flashcards." },
        { status: 400 }
      );
    }

    const resolvedDeck = (deck || topic || "AI Generated Deck").trim();
    let cards: GeneratedCard[] = [];

    // Check if Gemini API Key is available
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const prompt = `You are an expert tutor creating spaced repetition active recall flashcards for students.
Topic: ${topic}
Notes / Text provided: ${notes || "None provided. Generate from topic."}
Target Card Count: ${count}

Generate exactly ${count} high-yield, precise flashcards formatted as raw JSON:
{
  "deck": "${resolvedDeck}",
  "cards": [
    {
      "front": "Clear, concise question or active recall prompt",
      "back": "Accurate, comprehensive yet bite-sized answer"
    }
  ]
}
Requirements:
- Make questions active recall (not yes/no).
- Focus on high-yield exam concepts, definitions, and problem-solving steps.
- Return ONLY valid raw JSON with no markdown wrapping.`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                maxOutputTokens: 1000,
              },
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (rawText) {
            const cleaned = rawText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(cleaned);
            if (Array.isArray(parsed.cards) && parsed.cards.length > 0) {
              cards = parsed.cards.map((c: any) => ({
                front: String(c.front || "").trim(),
                back: String(c.back || "").trim(),
              }));
            }
          }
        }
      } catch (geminiErr) {
        console.error("Gemini card generation error, using fallback:", geminiErr);
      }
    }

    // If Gemini wasn't used or failed, use our curriculum NLP parser
    if (cards.length === 0) {
      if (notes.trim()) {
        cards = generateCardsFromNotes(notes, topic);
      } else {
        cards = generateHeuristicCardsForTopic(topic);
      }
    }

    return NextResponse.json({
      success: true,
      deck: resolvedDeck,
      cards: cards.slice(0, Math.min(count, 12)),
    });
  } catch (error) {
    console.error("POST /api/flashcards/generate error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate flashcard deck" },
      { status: 500 }
    );
  }
}
