import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Download, FileText, Sparkles, Trophy, UserRound } from "lucide-react";
import AppPage from "../components/layout/AppPage";
import { Button, ButtonLink, Field, FormError, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { api, downloadFile } from "../lib/api";

const RING_RADIUS = 52;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const ProgressRing = ({ percent }) => (
  <div className="relative size-32 shrink-0">
    <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden>
      <defs>
        <linearGradient id="ring" x1="0" x2="1">
          <stop offset="0" stopColor="#3ddbc3" />
          <stop offset="1" stopColor="#ffb648" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r={RING_RADIUS} fill="none" stroke="#21464f" strokeWidth="10" />
      <motion.circle
        cx="60"
        cy="60"
        r={RING_RADIUS}
        fill="none"
        stroke="url(#ring)"
        strokeWidth="10"
        strokeLinecap="round"
        strokeDasharray={RING_LENGTH}
        initial={{ strokeDashoffset: RING_LENGTH }}
        animate={{ strokeDashoffset: RING_LENGTH * (1 - percent / 100) }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </svg>
    <p className="absolute inset-0 flex items-center justify-center font-display text-2xl font-semibold">
      {percent}%
    </p>
  </div>
);

const ProgressCard = ({ overview }) => {
  const { roadmap, completed, total, nextChapter } = overview;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  if (!roadmap) {
    return (
      <section className="panel p-7 lg:col-span-2">
        <Sparkles className="size-7 text-helix" aria-hidden />
        <h2 className="mt-3 text-2xl font-semibold">Build your first roadmap</h2>
        <p className="mt-1 text-muted">Add a few topics and your first lesson is minutes away.</p>
        <ButtonLink to="/plan" className="mt-5">
          Build my roadmap
        </ButtonLink>
      </section>
    );
  }

  return (
    <section className="panel flex flex-wrap items-center gap-7 p-7 lg:col-span-2">
      <ProgressRing percent={percent} />
      <div className="min-w-56 flex-1">
        <p className="text-sm text-muted">
          {completed} of {total} chapters complete
        </p>
        {nextChapter ? (
          <>
            <h2 className="mt-1 text-2xl font-semibold">{nextChapter.title}</h2>
            <ButtonLink to={`/classroom/${roadmap.id}/${nextChapter.index}`} className="mt-4">
              Continue learning
              <ArrowRight className="size-5" aria-hidden />
            </ButtonLink>
          </>
        ) : (
          <>
            <h2 className="mt-1 flex items-center gap-2 text-2xl font-semibold">
              <Trophy className="size-6 text-amber" aria-hidden />
              Roadmap complete
            </h2>
            <ButtonLink to="/plan" className="mt-4">
              Start a new plan
            </ButtonLink>
          </>
        )}
      </div>
    </section>
  );
};

const NotesLibrary = ({ lessons }) => {
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const withNotes = lessons.filter((lesson) => lesson.hasNotes);

  const download = async (lesson) => {
    setBusyId(lesson.id);
    try {
      await downloadFile(`/lesson/${lesson.id}/notes.pdf`, `${lesson.topic} notes.pdf`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="panel p-7 lg:col-span-2">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <FileText className="size-5 text-helix" aria-hidden />
        Notes library
      </h2>
      {withNotes.length === 0 ? (
        <p className="mt-3 text-muted">Notes appear here after your first lesson.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line">
          {withNotes.map((lesson) => (
            <li key={lesson.id} className="flex items-center justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium">{lesson.topic}</p>
                <p className="text-sm text-muted">Chapter {lesson.chapterIndex + 1}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={busyId === lesson.id}
                onClick={() => download(lesson)}
                aria-label={`Download notes for ${lesson.topic}`}
              >
                {busyId !== lesson.id && <Download className="size-4" aria-hidden />}
                PDF
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

const ProfileCard = ({ user }) => {
  const { setUser } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    phone: user.phone ?? "",
    city: user.city ?? "",
    classStudying: user.classStudying ?? "",
  });

  const bind = (name) => ({
    disabled: !editing,
    value: form[name],
    onChange: (event) => setForm({ ...form, [name]: event.target.value }),
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const result = await api("/dashboard/profile", { method: "PUT", body: form });
      setUser(result.user);
      setEditing(false);
      toast.success("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel p-7 lg:col-start-3 lg:row-span-2 lg:row-start-1">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <UserRound className="size-5 text-helix" aria-hidden />
          Profile
        </h2>
        <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>
          {editing ? "Cancel" : "Edit"}
        </Button>
      </div>
      <p className="mt-1 truncate text-sm text-muted">{user.email}</p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-3">
        <Field label="First name" required {...bind("firstName")} />
        <Field label="Last name" {...bind("lastName")} />
        <Field label="Phone" type="tel" {...bind("phone")} />
        <Field label="City" {...bind("city")} />
        <Field label="Class or grade" {...bind("classStudying")} />
        <FormError>{error}</FormError>
        {editing && (
          <Button type="submit" className="w-full" loading={saving}>
            Save changes
          </Button>
        )}
      </form>
    </section>
  );
};

const DashboardPage = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api("/dashboard")
      .then(setOverview)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <AppPage>
      <h1 className="text-4xl font-semibold sm:text-5xl">Welcome back, {user.firstName}</h1>
      <FormError>{error}</FormError>

      {overview ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 grid gap-5 lg:grid-cols-3"
        >
          <ProgressCard overview={overview} />
          <NotesLibrary lessons={overview.lessons} />
          <ProfileCard user={overview.user} />
        </motion.div>
      ) : (
        !error && (
          <div className="flex justify-center py-24">
            <Spinner label="Loading your dashboard..." />
          </div>
        )
      )}
    </AppPage>
  );
};

export default DashboardPage;
