import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Sparkles, X } from "lucide-react";
import AppPage from "../components/layout/AppPage";
import { Button, Field, FormError, Spinner } from "../components/ui";
import { api } from "../lib/api";

const MAX_TOPICS = 6;
const SUGGESTIONS = ["Enzymes", "DNA replication", "Cell membrane", "Glycolysis", "Gene expression"];
const TIME_PRESETS = [30, 60, 90, 120];

const PACES = [
  { value: "slow", label: "Slow" },
  { value: "moderate", label: "Moderate" },
  { value: "fast", label: "Fast" },
];
const TONES = [
  { value: "beginner", label: "Beginner friendly" },
  { value: "technical", label: "Technical" },
  { value: "practical", label: "Practical" },
];

const Choice = ({ label, options, value, onChange }) => (
  <fieldset>
    <legend className="mb-2 text-sm font-medium text-muted">{label}</legend>
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            value === option.value
              ? "border-helix bg-helix/15 text-helix"
              : "border-line text-muted hover:border-helix/50 hover:text-text"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </fieldset>
);

const PlanPage = () => {
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [topics, setTopics] = useState([]);
  const [minutes, setMinutes] = useState("60");
  const [pace, setPace] = useState("moderate");
  const [tone, setTone] = useState("beginner");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addTopics = (text) => {
    const incoming = text.split(/[\n,]+/).map((topic) => topic.trim()).filter(Boolean);
    const merged = [...new Set([...topics, ...incoming])];
    if (merged.length > MAX_TOPICS) {
      setError(`You can add up to ${MAX_TOPICS} topics at a time.`);
    } else {
      setError("");
    }
    setTopics(merged.slice(0, MAX_TOPICS));
    setDraft("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTopics(draft);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const finalTopics = [...new Set([...topics, draft.trim()].filter(Boolean))].slice(0, MAX_TOPICS);

    if (finalTopics.length === 0) {
      setError("Add at least one topic.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await api("/roadmap/generate", {
        method: "POST",
        body: { topics: finalTopics, duration: Number(minutes), pace, tone },
      });
      navigate("/roadmap");
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppPage>
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
          <Spinner />
          <h1 className="text-3xl font-semibold">Building your roadmap</h1>
          <p className="max-w-sm text-muted">
            Searching the textbooks and ordering your chapters. This can take up to a minute.
          </p>
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-2xl"
      >
        <h1 className="text-4xl font-semibold sm:text-5xl">What should we teach you?</h1>
        <p className="mt-3 text-lg text-muted">
          Add up to {MAX_TOPICS} topics. VReality's library covers biochemistry, cell biology and
          genetics.
        </p>

        <div className="panel mt-8 space-y-7 p-6 sm:p-8">
          <div>
            <div className="flex items-end gap-2">
              <Field
                className="flex-1"
                label={`Topics (${topics.length}/${MAX_TOPICS})`}
                placeholder="Type a topic and press Enter"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                disabled={topics.length >= MAX_TOPICS}
              />
              <Button
                variant="secondary"
                aria-label="Add topic"
                className="h-[50px]"
                disabled={!draft.trim()}
                onClick={() => addTopics(draft)}
              >
                <Plus className="size-5" aria-hidden />
              </Button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <AnimatePresence initial={false}>
                {topics.map((topic) => (
                  <motion.span
                    key={topic}
                    layout
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-1.5 rounded-lg bg-helix/15 py-1.5 pl-3 pr-1.5 text-sm font-medium text-helix"
                  >
                    {topic}
                    <button
                      type="button"
                      aria-label={`Remove ${topic}`}
                      onClick={() => setTopics(topics.filter((item) => item !== topic))}
                      className="rounded p-0.5 hover:bg-helix/20"
                    >
                      <X className="size-3.5" aria-hidden />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>

            {topics.length === 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
                Try:
                {SUGGESTIONS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => addTopics(topic)}
                    className="rounded-lg border border-line px-2.5 py-1 hover:border-helix/50 hover:text-text"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-end gap-2">
              <Field
                className="w-36"
                label="Study time (minutes)"
                type="number"
                min={5}
                max={6000}
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                required
              />
              <div className="flex flex-wrap gap-2 pb-0.5">
                {TIME_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMinutes(String(preset))}
                    className="rounded-lg border border-line px-3 py-2 text-sm text-muted hover:border-helix/50 hover:text-text"
                  >
                    {preset}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Choice label="Pace" options={PACES} value={pace} onChange={setPace} />
          <Choice label="Teaching style" options={TONES} value={tone} onChange={setTone} />

          <FormError>{error}</FormError>

          <Button type="submit" size="lg" className="w-full">
            <Sparkles className="size-5" aria-hidden />
            Build my roadmap
          </Button>
        </div>
      </motion.form>
    </AppPage>
  );
};

export default PlanPage;
