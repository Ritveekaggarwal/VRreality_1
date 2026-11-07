import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CircleCheckBig, Lock, TriangleAlert } from "lucide-react";
import DoubtPanel from "../components/classroom/DoubtPanel";
import NotesPanel from "../components/classroom/NotesPanel";
import PhonePanel from "../components/classroom/PhonePanel";
import { LiveTeacher, ScriptFallback } from "../components/classroom/TeacherStage";
import AppPage from "../components/layout/AppPage";
import { Button, ButtonLink, EmptyState, Spinner } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { api } from "../lib/api";

const LOADING_STEPS = [
  "Reading the textbooks...",
  "Writing your lecture...",
  "Calling your teacher in...",
];

const LoadingLesson = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((current) => Math.min(current + 1, LOADING_STEPS.length - 1));
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <Spinner />
      <h1 className="text-2xl font-semibold">Preparing your lesson</h1>
      <p className="text-muted">{LOADING_STEPS[step]}</p>
    </div>
  );
};

const Classroom = ({ roadmapId, chapterIndex }) => {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [finishing, setFinishing] = useState(false);
  const [notesOutdated, setNotesOutdated] = useState(false);
  const callRef = useRef(null);

  useEffect(() => {
    let active = true;

    api("/lesson/start", {
      method: "POST",
      body: { roadmapId, chapterIndex: Number(chapterIndex) },
    })
      .then((result) => active && setData(result))
      .catch((err) => active && setError(err));

    return () => {
      active = false;
    };
  }, [roadmapId, chapterIndex]);

  const onDoubtAdded = useCallback(() => setNotesOutdated(true), []);
  const onNotesRefreshed = useCallback(() => setNotesOutdated(false), []);

  const finishLesson = async () => {
    setFinishing(true);
    try {
      await api(`/lesson/${data.lesson.id}/complete`, { method: "POST" });
      toast.success("Chapter complete. The next one is unlocked.");
      navigate("/roadmap");
    } catch (err) {
      toast.error(err.message);
      setFinishing(false);
    }
  };

  if (error) {
    const locked = error.code === "CHAPTER_LOCKED";
    return (
      <AppPage>
        <div className="mt-10">
          <EmptyState
            icon={locked ? Lock : TriangleAlert}
            title={locked ? "This chapter is locked" : "We couldn't open this lesson"}
            action={<ButtonLink to="/roadmap">Back to roadmap</ButtonLink>}
          >
            {error.message}
          </EmptyState>
        </div>
      </AppPage>
    );
  }

  if (!data) {
    return (
      <AppPage>
        <LoadingLesson />
      </AppPage>
    );
  }

  const { lesson, chapter, tavusAvailable, tavusError } = data;

  return (
    <AppPage wide>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <Link
          to="/roadmap"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Roadmap
        </Link>

        <div className="mt-3 grid gap-6 lg:grid-cols-[1fr_22rem]">
          <div className="min-w-0 space-y-5">
            {tavusAvailable ? (
              <LiveTeacher lesson={lesson} callRef={callRef} />
            ) : (
              <ScriptFallback lesson={lesson} reason={tavusError} />
            )}

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase tracking-widest text-amber">
                  Chapter {Number(chapterIndex) + 1}
                </p>
                <h1 className="mt-1 text-3xl font-semibold">{chapter.title}</h1>
                {chapter.description && <p className="mt-2 text-muted">{chapter.description}</p>}
              </div>
              <Button onClick={finishLesson} loading={finishing}>
                {!finishing && <CircleCheckBig className="size-5" aria-hidden />}
                Finish lesson
              </Button>
            </div>
          </div>

          <aside className="space-y-4">
            <DoubtPanel lesson={lesson} callRef={callRef} onDoubtAdded={onDoubtAdded} />
            <NotesPanel
              lesson={lesson}
              notesOutdated={notesOutdated}
              onRefreshed={onNotesRefreshed}
            />
            <PhonePanel lessonId={lesson.id} />
          </aside>
        </div>
      </motion.div>
    </AppPage>
  );
};

/** The key gives each chapter fresh state, so nothing leaks between lessons. */
const ClassroomPage = () => {
  const { roadmapId, chapterIndex } = useParams();
  return (
    <Classroom
      key={`${roadmapId}:${chapterIndex}`}
      roadmapId={roadmapId}
      chapterIndex={chapterIndex}
    />
  );
};

export default ClassroomPage;
