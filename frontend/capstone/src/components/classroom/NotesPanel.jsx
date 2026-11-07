import { useEffect, useRef, useState } from "react";
import { Download, FileText, RefreshCw } from "lucide-react";
import { useToast } from "../../context/ToastContext";
import { api, downloadFile } from "../../lib/api";
import { Button } from "../ui";

const NotesPanel = ({ lesson, notesOutdated, onRefreshed }) => {
  const toast = useToast();
  const [notes, setNotes] = useState(lesson.notes);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const requested = useRef(false);

  const generate = async (force) => {
    setGenerating(true);
    try {
      const result = await api(`/lesson/${lesson.id}/notes`, { method: "POST", body: { force } });
      setNotes(result.notes);
      onRefreshed();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setGenerating(false);
    }
  };

  // Notes build in the background while the class runs.
  useEffect(() => {
    if (!lesson.notes && !requested.current) {
      requested.current = true;
      generate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/lesson/${lesson.id}/notes.pdf`, `${lesson.topic} notes.pdf`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <section className="panel p-5">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        <FileText className="size-5 text-helix" aria-hidden />
        Lesson notes
      </h2>
      <p className="mt-1 text-sm text-muted">
        {generating ? "Writing your notes..." : notes ? "Your notes are ready." : "Notes aren't ready yet."}
      </p>

      <div className="mt-4 space-y-2">
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          disabled={!notes || generating}
          loading={downloading}
          onClick={handleDownload}
        >
          {!downloading && <Download className="size-4" aria-hidden />}
          Download PDF
        </Button>

        {(notesOutdated || (!notes && !generating)) && (
          <Button variant="ghost" size="sm" className="w-full" onClick={() => generate(true)}>
            <RefreshCw className="size-4" aria-hidden />
            {notes ? "Add my doubts to the notes" : "Try again"}
          </Button>
        )}
      </div>
    </section>
  );
};

export default NotesPanel;
