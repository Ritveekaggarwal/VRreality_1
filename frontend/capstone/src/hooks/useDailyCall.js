import { useEffect, useRef, useState } from "react";

const friendlyJoinError = () =>
  window.isSecureContext
    ? "We couldn't connect to your teacher. Please try again."
    : "Video needs a secure (https) page. Open the deployed site instead.";

/**
 * Joins a Tavus conversation inside containerRef and cleans up afterwards.
 * Daily is imported on demand, so it never weighs down the rest of the site.
 */
export const useDailyCall = ({ url, containerRef, userName, onJoined, onParticipantJoined }) => {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const callRef = useRef(null);
  const handlers = useRef({ onJoined, onParticipantJoined });

  useEffect(() => {
    handlers.current = { onJoined, onParticipantJoined };
  });

  useEffect(() => {
    if (!url || !containerRef.current) return undefined;

    let cancelled = false;
    let call = null;

    const join = async () => {
      setStatus("connecting");
      setError("");
      try {
        const { default: Daily } = await import("@daily-co/daily-js");
        if (cancelled) return;

        await Daily.getCallInstance()?.destroy();
        if (cancelled) return;

        call = Daily.createFrame(containerRef.current, {
          iframeStyle: { width: "100%", height: "100%", border: "0" },
          showLeaveButton: false,
        });
        callRef.current = call;

        call.on("participant-joined", (event) => {
          handlers.current.onParticipantJoined?.(event.participant, call);
        });

        await call.join({ url, userName });
        if (cancelled) return;

        setStatus("joined");
        handlers.current.onJoined?.(call);
      } catch (err) {
        if (cancelled) return;
        console.error("Could not join the class:", err);
        setStatus("error");
        setError(friendlyJoinError());
      }
    };

    join();

    return () => {
      cancelled = true;
      callRef.current = null;
      call?.destroy().catch(() => {});
    };
  }, [url, userName, containerRef]);

  return { status, error, callRef };
};

/** Makes the Tavus replica respond to text, as if the student had said it. */
export const sendToTeacher = (call, conversationId, text) => {
  call?.sendAppMessage(
    {
      message_type: "conversation",
      event_type: "conversation.respond",
      conversation_id: conversationId,
      properties: { text },
    },
    "*"
  );
};
