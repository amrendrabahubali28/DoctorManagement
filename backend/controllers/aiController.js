// controllers/aiController.js
import doctorModel from "../models/doctor.js";
import { DoctorStore } from "../services/DoctorStore.js";
import { createDoctorRagChain } from "../services/doctorRag.js";

/**
 * Lazily-built singleton chain. Building the DoctorStore on every request
 * is wasteful (it re-embeds + rebuilds the FAISS index), so we cache it.
 *
 * If you want the index to reflect DB changes, add a TTL or an admin
 * endpoint that calls `resetChain()`.
 */
let chainPromise = null;

async function getChain() {
  if (!chainPromise) {
    chainPromise = (async () => {
      const doctors = await doctorModel.find().lean();
      const doctorStore = await DoctorStore.create(
        doctors,
        "./data/doctor-index"
      );
      return createDoctorRagChain(doctorStore, {
        k: 5,
        maxHistory: 15,
        temperature: 0.3,
      });
    })().catch((err) => {
      // Reset so the next request retries instead of caching the failure.
      chainPromise = null;
      throw err;
    });
  }
  return chainPromise;
}

export function resetChain() {
  chainPromise = null;
}

/**
 * POST /api/ai/chat
 * Body: { question: string, history?: Array<{ role, content }> }
 * Response: { success: true, answer: string, doctors: [...] }
 */
export const chatController = async (req, res) => {
  try {
    const { question, history } = req.body ?? {};

    if (typeof question !== "string" || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "A non-empty 'question' string is required.",
      });
    }

    // Cap history server-side too — never trust the client to send only 15.
    const safeHistory = Array.isArray(history) ? history.slice(-15) : [];

    const chain = await getChain();
    const { answer, doctors } = await chain.invoke({
      question: question.trim(),
      history: safeHistory,
    });

    return res.json({
      success: true,
      answer,
      doctors,
      disclaimer:
        "This assistant is not a medical diagnosis. Consult the doctor for medical advice.",
    });
  } catch (error) {
    console.error("[aiController.chat] error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message ?? "Failed to generate a response.",
    });
  }
};