import { useRef } from "react";
import { AlertTriangle, BookOpen } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { sendToTeacher, useDailyCall } from "../../hooks/useDailyCall";
import { Spinner } from "../ui";

// Daily app messages are limited to about 4 KB, so the lesson itself travels in the
// conversation context set by the backend. This only tells the teacher to begin.
const KICKOFF = "Please begin teaching the lesson now, from the start.";
const KICKOFF_DELAY_MS = 5000;

const alreadyStarted = (conversationId) => {
  try {
    return sessionStorage.getItem(`started:${conversationId}`) === "1";
  } catch {
    return false;
  }
};

const markStarted = (conversationId) => {
  try {
    sessionStorage.setItem(`started:${conversationId}`, "1");
  } catch {
    // Storage can be blocked. The worst case is one repeated greeting.
  }
};

export const LiveTeacher = ({ lesson, callRef: sharedCallRef }) => {
  const toast = useToast();
  const containerRef = useRef(null);

  const { status, error, callRef } = useDailyCall({
    url: lesson.conversationUrl,
    containerRef,
    userName: "Student",
    onJoined: (call) => {
      sharedCallRef.current = call;
      if (alreadyStarted(lesson.conversationId)) return;
      markStarted(lesson.conversationId);
      setTimeout(() => {
        if (callRef.current === call) sendToTeacher(call, lesson.conversationId, KICKOFF);
      }, KICKOFF_DELAY_MS);
    },
    onParticipantJoined: (participant, call) => {
      if (participant.user_name === "Phone") {
        // Two open mics in one room would echo.
        call.setLocalAudio(false);
        toast.info("Your phone joined. We muted this device's microphone.");
      }
    },
  });

  return (
    <div className="relative aspect-video overflow-hidden rounded-2xl border border-line bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      {status === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink">
          <Spinner label="Connecting to your teacher..." />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink p-6 text-center">
          <AlertTriangle className="size-7 text-amber" aria-hidden />
          <p className="max-w-sm text-muted">{error}</p>
        </div>
      )}
    </div>
  );
};

/** Shown when the video teacher can't start, so the lesson can still go on. */
export const ScriptFallback = ({ lesson, reason }) => (
  <div className="panel p-6">
    <p className="flex items-start gap-2 rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {reason || "The AI teacher is unavailable right now."} Your lesson is ready to read below, and
      you can still ask doubts.
    </p>
    <h2 className="mt-5 flex items-center gap-2 text-xl font-semibold">
      <BookOpen className="size-5 text-helix" aria-hidden />
      Lesson script
    </h2>
    <div className="mt-3 max-h-[28rem] overflow-y-auto whitespace-pre-line pr-2 leading-relaxed text-muted">
      {lesson.script}
    </div>
  </div>
);
