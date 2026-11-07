import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Download, TriangleAlert, Video } from "lucide-react";
import Logo from "../components/layout/Logo";
import { Button, FullPageSpinner, Spinner } from "../components/ui";
import { useDailyCall } from "../hooks/useDailyCall";
import { API_BASE, api } from "../lib/api";

const PhoneTeacher = ({ url }) => {
  const containerRef = useRef(null);
  const { status, error } = useDailyCall({ url, containerRef, userName: "Phone" });

  return (
    <div className="relative flex-1 bg-black">
      <div ref={containerRef} className="absolute inset-0" />
      {status === "connecting" && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink">
          <Spinner label="Connecting to your teacher..." />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-ink p-6 text-center text-muted">
          {error}
        </div>
      )}
    </div>
  );
};

const MobileClassroomPage = () => {
  const { token } = useParams();
  const [lesson, setLesson] = useState(null);
  const [error, setError] = useState("");
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    api(`/lesson/shared/${token}`, { auth: false })
      .then(setLesson)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-ink p-6 text-center">
        <TriangleAlert className="size-8 text-amber" aria-hidden />
        <h1 className="text-2xl font-semibold">This link isn't working</h1>
        <p className="max-w-xs text-muted">{error}</p>
      </div>
    );
  }

  if (!lesson) return <FullPageSpinner label="Opening your lesson..." />;

  const notesUrl = `${API_BASE}/lesson/shared/${token}/notes.pdf`;

  return (
    <div className="flex h-dvh flex-col bg-ink">
      <header className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <Logo />
          <p className="mt-0.5 truncate text-sm text-muted">{lesson.topic}</p>
        </div>
        {lesson.hasNotes && (
          <a
            href={notesUrl}
            download
            className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-line px-3.5 py-2 text-sm font-semibold"
          >
            <Download className="size-4" aria-hidden />
            Notes
          </a>
        )}
      </header>

      {joined ? (
        <PhoneTeacher url={lesson.conversationUrl} />
      ) : (
        <main className="page-glow flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-3xl font-semibold">{lesson.topic}</h1>
          {lesson.conversationUrl ? (
            <>
              <p className="max-w-xs text-muted">
                Tap to join. Allow your microphone so you can ask doubts out loud.
              </p>
              {/* Phones only allow sound and microphone access after a tap. */}
              <Button size="lg" onClick={() => setJoined(true)}>
                <Video className="size-5" aria-hidden />
                Join class
              </Button>
            </>
          ) : (
            <p className="max-w-xs text-muted">
              The live class isn't running right now.
              {lesson.hasNotes ? " Your notes are ready to download." : ""}
            </p>
          )}
        </main>
      )}
    </div>
  );
};

export default MobileClassroomPage;
