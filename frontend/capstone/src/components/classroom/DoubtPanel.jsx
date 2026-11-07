import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircleQuestion, Send } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { sendToTeacher } from "../../hooks/useDailyCall";
import { api } from "../../lib/api";
import { Button } from "../ui";

// Stays under Daily's app message size limit.
const MAX_SPOKEN_ANSWER = 2800;

const DoubtPanel = ({ lesson, callRef, onDoubtAdded }) => {
  const toast = useToast();
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [doubts, setDoubts] = useState(lesson.doubts ?? []);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [doubts]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = question.trim();
    if (!text) return;

    setAsking(true);
    try {
      const doubt = await api(`/lesson/${lesson.id}/doubt`, {
        method: "POST",
        body: { question: text },
      });
      setDoubts((current) => [...current, doubt]);
      setQuestion("");
      onDoubtAdded();

      sendToTeacher(
        callRef.current,
        lesson.conversationId,
        `The student has a doubt: "${text}". Explain this answer in your own words, then ask if they are ready to continue: ${doubt.answer.slice(0, MAX_SPOKEN_ANSWER)}`
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setAsking(false);
    }
  };

  return (
    <section className="panel flex flex-col p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <MessageCircleQuestion className="size-5 text-helix" aria-hidden />
        Ask a doubt
      </h2>
      <p className="mt-1 text-sm text-muted">
        {lesson.conversationUrl
          ? "Speak to your teacher, or type here and it will answer out loud."
          : "Type your question and get an answer from the textbooks."}
      </p>

      {doubts.length > 0 && (
        <ul ref={listRef} className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
          <AnimatePresence initial={false}>
            {doubts.map((doubt, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-ink/60 p-3 text-sm"
              >
                <p className="font-semibold text-amber">{doubt.question}</p>
                <p className="mt-1.5 leading-relaxed text-muted">{doubt.answer}</p>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <form onSubmit={handleSubmit} className="mt-4">
        <label htmlFor="doubt" className="sr-only">
          Your doubt
        </label>
        <textarea
          id="doubt"
          rows={3}
          value={question}
          maxLength={2000}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="What's confusing you?"
          className="w-full resize-none rounded-xl border border-line bg-ink/60 p-3 text-sm text-text placeholder:text-muted/60 focus:border-helix focus:outline-none focus:ring-2 focus:ring-helix/25"
        />
        <Button type="submit" size="sm" className="mt-2 w-full" loading={asking} disabled={!question.trim()}>
          {!asking && <Send className="size-4" aria-hidden />}
          {asking ? "Finding your answer..." : "Ask teacher"}
        </Button>
      </form>
    </section>
  );
};

export default DoubtPanel;
