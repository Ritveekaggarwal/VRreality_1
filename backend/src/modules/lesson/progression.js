/** Sequential unlock rules, kept pure so they are trivial to test. */

export const isChapterUnlocked = (chapters, index) => {
  if (!chapters[index]) return false;
  return index === 0 || Boolean(chapters[index - 1].completed);
};

export const completeChapter = (chapters, index) => {
  chapters[index].completed = true;
  chapters[index].status = "COMPLETED";

  const next = chapters[index + 1];
  if (next && !next.completed) next.status = "READY";
};
