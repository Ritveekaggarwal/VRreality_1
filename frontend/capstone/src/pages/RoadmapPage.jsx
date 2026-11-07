import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Clock, Lock, Map, Play, RotateCcw, Sparkles } from "lucide-react";
import AppPage from "../components/layout/AppPage";
import { ButtonLink, EmptyState, FormError, Spinner } from "../components/ui";
import { api } from "../lib/api";

const STATES = {
  COMPLETED: { Icon: Check, dot: "border-helix bg-helix text-ink", label: "Completed" },
  READY: { Icon: Play, dot: "border-amber bg-amber/15 text-amber", label: "Up next" },
  LOCKED: { Icon: Lock, dot: "border-line bg-surface text-muted", label: "Locked" },
};

const Chapter = ({ chapter, index, previousTitle, onOpen }) => {
  const state = STATES[chapter.status] ?? STATES.LOCKED;
  const locked = chapter.status === "LOCKED";
  const ready = chapter.status === "READY";
  const { Icon } = state;

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45 }}
      className="relative pl-16"
    >
      <span
        className={`absolute left-0 top-5 z-10 flex size-12 items-center justify-center rounded-full border-2 ${state.dot}`}
      >
        <Icon className="size-5" aria-hidden />
      </span>

      <button
        type="button"
        disabled={locked}
        onClick={() => onOpen(index)}
        className={`panel block w-full p-5 text-left transition ${
          locked ? "opacity-60" : "hover:-translate-y-0.5 hover:border-helix/60"
        } ${ready ? "border-amber/50" : ""}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Chapter {index + 1} · {state.label}
          </p>
          <p className="flex items-center gap-1 text-sm text-muted">
            <Clock className="size-3.5" aria-hidden />
            {chapter.estimated_minutes} min
          </p>
        </div>
        <h2 className="mt-1.5 text-xl font-semibold">{chapter.title}</h2>
        {chapter.description && <p className="mt-1.5 text-muted">{chapter.description}</p>}
        {locked && previousTitle && (
          <p className="mt-3 text-sm text-muted">Finish "{previousTitle}" to unlock this.</p>
        )}
        {ready && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-amber">
            <Play className="size-4" aria-hidden />
            Start lesson
          </p>
        )}
        {chapter.status === "COMPLETED" && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-helix">
            <RotateCcw className="size-4" aria-hidden />
            Review lesson
          </p>
        )}
      </button>
    </motion.li>
  );
};

const RoadmapPage = () => {
  const navigate = useNavigate();
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/roadmap/current")
      .then((data) => setRoadmap(data.roadmap))
      .catch((err) => {
        if (err.status !== 404) setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppPage>
        <div className="flex justify-center py-32">
          <Spinner label="Loading your roadmap..." />
        </div>
      </AppPage>
    );
  }

  if (!roadmap) {
    return (
      <AppPage>
        <FormError>{error}</FormError>
        <div className="mt-10">
          <EmptyState
            icon={Map}
            title="No roadmap yet"
            action={<ButtonLink to="/plan">Build my roadmap</ButtonLink>}
          >
            Tell us what you want to learn and we'll map out your chapters.
          </EmptyState>
        </div>
      </AppPage>
    );
  }

  const { chapters, topics } = roadmap;
  const completed = chapters.filter((chapter) => chapter.completed).length;
  const percent = Math.round((completed / chapters.length) * 100);
  const openChapter = (index) => navigate(`/classroom/${roadmap._id}/${index}`);

  return (
    <AppPage>
      <div className="mx-auto max-w-3xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold sm:text-5xl">Your roadmap</h1>
            <p className="mt-2 text-muted">{topics.join(" · ")}</p>
          </div>
          <ButtonLink to="/plan" variant="secondary" size="sm">
            <Sparkles className="size-4" aria-hidden />
            New plan
          </ButtonLink>
        </div>

        <div className="panel mt-6 p-5">
          <div className="flex justify-between text-sm">
            <span className="text-muted">
              {completed} of {chapters.length} chapters complete
            </span>
            <span className="font-semibold text-helix">{percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-helix to-amber"
            />
          </div>
        </div>

        <div className="relative mt-8">
          <div className="absolute bottom-6 left-6 top-6 w-0.5 -translate-x-1/2 bg-line" />
          <ol className="space-y-4">
            {chapters.map((chapter, index) => (
              <Chapter
                key={chapter._id ?? index}
                chapter={chapter}
                index={index}
                previousTitle={chapters[index - 1]?.title}
                onOpen={openChapter}
              />
            ))}
          </ol>
        </div>
      </div>
    </AppPage>
  );
};

export default RoadmapPage;
