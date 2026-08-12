import { API_BASE } from "../config/api";

/**
 * Frontend AI Chatbot Service
 * Calls backend API endpoint POST /api/chat with safety & graceful error handling.
 * 
 * @param {string} userMessage - The query sent by the visitor.
 * @returns {Promise<{ text: string, timestamp: string }>}
 */
export async function getAIResponse(userMessage) {
  const now = new Date();
  const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userMessage }),
    });

    const errData = await res.json().catch(() => ({}));

    if (res.status === 429) {
      const rateLimitMsg = errData.error || "I'm getting a lot of questions right now. Please try again in a little while.";
      throw new Error(rateLimitMsg);
    }

    if (!res.ok) {
      const serverErrMsg = errData.error || "Faheem's AI assistant is temporarily unavailable. Please try again in a moment or reach out via the contact form!";
      throw new Error(serverErrMsg);
    }

    const replyText = errData.reply || "Thank you for your message. How else can I help you today?";

    return {
      text: replyText,
      actions: Array.isArray(errData.actions) ? errData.actions : [],
      suggestedQuestions: Array.isArray(errData.suggestedQuestions) ? errData.suggestedQuestions : [],
      timestamp: timeString,
    };
  } catch (err) {
    const displayErrorText = err.message.startsWith("I'm getting") || err.message.startsWith("Faheem's AI") || err.message.startsWith("Message")
      ? err.message
      : "Faheem's AI assistant is temporarily unavailable. Please try again in a moment or reach out via the contact form!";
    throw new Error(displayErrorText);
  }
}

export const fetchAIResponse = getAIResponse;
