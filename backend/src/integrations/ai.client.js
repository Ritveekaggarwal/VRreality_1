import { badGateway } from "../core/errors.js";

// Below Vercel's 120 second proxy limit, with room for a cold start.
const TIMEOUT_MS = 100000;

export const createAiClient = ({ baseUrl, serviceToken }) => {
  const post = async (path, body) => {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(serviceToken ? { "x-service-token": serviceToken } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (error) {
      console.error(`AI service ${path} unreachable:`, error.message);
      throw badGateway("The AI service is waking up. Please try again in a moment.");
    }

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error(`AI service ${path} responded ${response.status}:`, data);
      throw badGateway(
        typeof data.detail === "string" ? data.detail : "The AI service had a problem."
      );
    }
    return data;
  };

  return {
    generateRoadmap: async (request) => (await post("/roadmap", request)).roadmap,
    generateScript: async (module) => (await post("/script", { module })).script,
    generateNotes: async (request) => (await post("/notes", request)).notes,
    answerDoubt: async (request) => (await post("/doubt", request)).answer,

    /** Fire and forget: starts waking a sleeping free-tier instance. */
    warmUp() {
      fetch(`${baseUrl}/health`, { signal: AbortSignal.timeout(5000) }).catch(() => {});
    },
  };
};
