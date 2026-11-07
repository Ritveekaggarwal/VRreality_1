import { createRequire } from "node:module";
import path from "node:path";
import PDFDocument from "pdfkit";

// The built-in PDF fonts cannot draw Greek letters or arrows, which biology notes
// use constantly. DejaVu covers them.
const require = createRequire(import.meta.url);
const fontDir = path.join(path.dirname(require.resolve("dejavu-fonts-ttf/package.json")), "ttf");
const REGULAR = path.join(fontDir, "DejaVuSans.ttf");
const BOLD = path.join(fontDir, "DejaVuSans-Bold.ttf");

const INK = "#0b2027";
const ACCENT = "#0f8f7e";

const isHeading = (line) =>
  line.length < 70 && !/^[-•*]/.test(line) && !/[.,;]$/.test(line);

const safeFilename = (topic) =>
  `${(topic || "lesson").replace(/[^a-z0-9]+/gi, "_").toLowerCase().slice(0, 60)}_notes.pdf`;

export const streamNotesPdf = (lesson, res) => {
  const doc = new PDFDocument({ margin: 56, info: { Title: `${lesson.topic} notes` } });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${safeFilename(lesson.topic)}"`);
  doc.pipe(res);

  doc.font(BOLD).fontSize(10).fillColor(ACCENT).text("VREALITY STUDY NOTES", { characterSpacing: 1.5 });
  doc.moveDown(0.5);
  doc.font(BOLD).fontSize(22).fillColor(INK).text(lesson.topic);
  doc.moveDown(1);

  for (const raw of lesson.notes.split("\n")) {
    const line = raw.replace(/[#*`]/g, "").trim();

    if (!line) {
      doc.moveDown(0.4);
    } else if (isHeading(line)) {
      doc.moveDown(0.4).font(BOLD).fontSize(13).fillColor(ACCENT).text(line);
      doc.moveDown(0.2);
    } else {
      doc.font(REGULAR).fontSize(10.5).fillColor(INK).text(line, { lineGap: 3 });
    }
  }

  doc.end();
};
