const API_URL = "https://tavusapi.com/v2";
const TIMEOUT_MS = 20000;

const lessonContext = (title, script) => `You are teaching a live one-to-one class.

The student joined to learn: ${title}

Your job:
- Start teaching immediately. Do not wait for questions.
- Teach section by section using the lesson material below.
- After each section ask: "Do you have any doubts before we continue?"
- If the student interrupts with a doubt, answer it, then continue where you left off.

Lesson material:

${script}

Continue until the lesson is complete.`;

export const createTavusClient = ({ apiKey, personaId, replicaId }) => {
  const request = async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.message || `Tavus responded ${response.status}`);
    }
    return data;
  };

  return {
    isConfigured: Boolean(apiKey && personaId && replicaId),

    createConversation: ({ title, script }) =>
      request("/conversations", {
        method: "POST",
        body: JSON.stringify({
          persona_id: personaId,
          replica_id: replicaId,
          conversation_name: title,
          custom_greeting: `Hello. Today we will learn ${title}. Let's begin.`,
          conversational_context: lessonContext(title, script),
          // Replica plus two humans, so a phone can join alongside the laptop.
          max_participants: 3,
          properties: {
            // Long enough to move from laptop to phone without ending the class.
            participant_left_timeout: 120,
            participant_absent_timeout: 300,
            max_call_duration: 3600,
          },
        }),
      }),

    getConversation: (id) => request(`/conversations/${id}`),

    endConversation: (id) =>
      request(`/conversations/${id}/end`, { method: "POST" }),
  };
};
