import React, { useCallback, useEffect, useMemo, useState } from "react";
import { chapterContent, questions } from "./questions";
import { sfx, toggleMuted, isMuted } from "./sfx";
import { loadProgress, saveProgress, clearProgress } from "./storage";
import "./App.css";

const DECRYPT_DELAY_MS = 1600;

const MISSION_BRIEFING_COPY =
  "You are the [FIELD AGENT] assigned to this case. Recover Agent Shim's missing trail.";

const CASE_FILE_NOTE =
  "Agent Luna learned her great-grandfather 'Kai' had fought in the " +
  "Korean War. She began tracing Kai's footsteps and documents. " +
  "You can get it only when you find all the clues.";

const DOSSIER_TEXTS = [MISSION_BRIEFING_COPY, CASE_FILE_NOTE];

function SoundToggle() {
  const [muted, setMuted] = useState(isMuted());
  return (
    <button
      type="button"
      className="sound-toggle"
      aria-label={muted ? "Unmute sound" : "Mute sound"}
      title={muted ? "Sound off" : "Sound on"}
      onClick={() => {
        const next = toggleMuted();
        setMuted(next);
        if (!next) sfx.click();
      }}
    >
      {muted ? "🔇" : "🔊"}
    </button>
  );
}

function normalize(str) {
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'\"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrect(userInput, answer, acceptedAnswers) {
  const guess = normalize(userInput);
  if (!guess) return false;
  const targets = acceptedAnswers ? acceptedAnswers : [answer];
  return targets.some((target) => {
    const normalizedTarget = normalize(target);
    if (!normalizedTarget) return false;
    return (
      guess === normalizedTarget ||
      guess.includes(normalizedTarget) ||
      normalizedTarget.includes(guess)
    );
  });
}

function getChapterRank(correctCount, total, ladder) {
  if (total <= 0 || correctCount <= 0) return ladder[0];
  const idx = Math.min(ladder.length - 1, Math.max(0, Math.ceil((correctCount / total) * ladder.length) - 1));
  return ladder[idx];
}

function getFinalRank(correctCount, total) {
  if (total <= 0) return { label: "Field Agent" };
  const ratio = correctCount / total;
  if (ratio < 1 / 3) return { label: "Field Agent" };
  if (ratio < 2 / 3) return { label: "Senior Agent" };
  return { label: "Master Agent" };
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const CERTIFICATE_FONT_STACK = '"Special Elite", "Courier New", monospace';

async function ensureCertificateFontLoaded() {
  if (typeof document === "undefined" || !document.fonts?.load) return;
  try {
    await document.fonts.load(`16px ${CERTIFICATE_FONT_STACK}`);
    await document.fonts.ready;
  } catch {
    // Best effort — canvas falls back to a default font if this fails.
  }
}

// Shrinks the font size until `text` fits within `maxWidth`, so long agent
// names or long lines never spill past the certificate's border.
function fitCertificateFontSize(ctx, text, maxWidth, startSize, minSize) {
  let size = startSize;
  ctx.font = `${size}px ${CERTIFICATE_FONT_STACK}`;
  while (size > minSize && ctx.measureText(text).width > maxWidth) {
    size -= 1;
    ctx.font = `${size}px ${CERTIFICATE_FONT_STACK}`;
  }
  return size;
}

function drawCertificateLine(ctx, text, x, y, maxWidth, startSize, minSize) {
  fitCertificateFontSize(ctx, text, maxWidth, startSize, minSize);
  ctx.fillText(text, x, y);
}

function drawCertificate({ name, rank, correct, total }) {
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 1150;
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const textMaxWidth = canvas.width - 260;

  const bg = ctx.createRadialGradient(cx, 320, 100, cx, 600, 900);
  bg.addColorStop(0, "#2c2a1c");
  bg.addColorStop(1, "#100f0b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f3e6c8";
  ctx.strokeStyle = "rgba(183,173,132,0.7)";
  ctx.lineWidth = 4;
  roundRectPath(ctx, 60, 60, canvas.width - 120, canvas.height - 120, 24);
  ctx.fill();
  ctx.stroke();

  roundRectPath(ctx, 84, 84, canvas.width - 168, canvas.height - 168, 16);
  ctx.strokeStyle = "rgba(36,31,22,0.35)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

  ctx.fillStyle = "#8a6d1f";
  drawCertificateLine(ctx, "CIEE INTELLIGENCE DIVISION", cx, 160, textMaxWidth, 22, 13);

  ctx.fillStyle = "#241f16";
  drawCertificateLine(ctx, "CERTIFICATE OF SERVICE", cx, 225, textMaxWidth, 44, 22);

  ctx.fillStyle = "#4a3d24";
  drawCertificateLine(ctx, "War Memorial of Korea — Seoul, South Korea", cx, 265, textMaxWidth, 20, 12);

  ctx.beginPath();
  ctx.moveTo(180, 300);
  ctx.lineTo(canvas.width - 180, 300);
  ctx.strokeStyle = "rgba(36,31,22,0.3)";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = "#4a3d24";
  drawCertificateLine(ctx, "This certifies that", cx, 370, textMaxWidth, 22, 13);

  // Agent name — same typewriter font as the rest of the certificate,
  // auto-shrunk so even long names stay inside the card's border.
  ctx.fillStyle = "#241f16";
  const displayName = (name || "Field Agent").toUpperCase();
  const nameMaxWidth = canvas.width - 300;
  drawCertificateLine(ctx, displayName, cx, 440, nameMaxWidth, 42, 18);

  const nameWidth = Math.min(ctx.measureText(displayName).width + 60, canvas.width - 180);
  ctx.beginPath();
  ctx.moveTo(cx - nameWidth / 2, 465);
  ctx.lineTo(cx + nameWidth / 2, 465);
  ctx.strokeStyle = "rgba(36,31,22,0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#3a2f1c";
  drawCertificateLine(ctx, "has completed the field operation and reconstructed", cx, 520, textMaxWidth, 20, 12);
  drawCertificateLine(ctx, "Luna Shim's journey at the War Memorial of Korea.", cx, 555, textMaxWidth, 20, 12);

  drawCertificateLine(ctx, `${correct} / ${total} field reports verified`, cx, 605, textMaxWidth, 18, 12);

  ctx.save();
  ctx.translate(cx, 800);
  ctx.rotate(-0.18);
  ctx.beginPath();
  ctx.arc(0, 0, 140, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(163,39,42,0.85)";
  ctx.lineWidth = 6;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 122, 0, Math.PI * 2);
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "rgba(163,39,42,0.9)";
  const stampMaxWidth = 200;
  drawCertificateLine(ctx, "FINAL RANK", 0, -20, stampMaxWidth, 18, 11);
  drawCertificateLine(ctx, String(rank).toUpperCase(), 0, 22, stampMaxWidth, 26, 14);
  ctx.restore();

  ctx.fillStyle = "#4a3d24";
  const dateLabel = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  drawCertificateLine(ctx, dateLabel, cx, 1010, textMaxWidth, 18, 12);

  return canvas;
}

function PosterIllustration() {
  return (
    <svg
      className="poster-illustration"
      viewBox="0 0 220 190"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M18 30 L92 18 L162 30 L150 158 L78 172 L10 158 Z"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M40 42 Q60 60 42 84 Q26 104 46 128" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <path d="M70 34 Q90 50 78 70" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <path d="M112 40 L138 46 M108 60 L134 64 M60 140 L86 148 M96 152 L118 158" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
      <path d="M40 112 q14 -10 28 0 q14 10 0 18 q-14 8 -22 -2" stroke="currentColor" strokeWidth="1.6" strokeDasharray="4 4" opacity="0.7" />
      <path d="M120 100 L134 112" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M128 118 L108 96" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />

      <g>
        <circle cx="130" cy="82" r="40" stroke="currentColor" strokeWidth="6" fill="rgba(246,236,217,0.9)" />
        <circle cx="130" cy="82" r="31" stroke="currentColor" strokeWidth="2" opacity="0.5" />
        <path
          d="M130 66 c8 0 13 6 13 13 c0 9 -13 20 -13 20 c0 0 -13 -11 -13 -20 c0 -7 5 -13 13 -13 Z"
          fill="currentColor"
        />
        <circle cx="130" cy="79" r="4.5" fill="rgba(246,236,217,0.95)" />
      </g>

      <path
        d="M158 110 L190 150"
        stroke="currentColor"
        strokeWidth="12"
        strokeLinecap="round"
      />
      <path
        d="M158 110 L190 150"
        stroke="rgba(246,236,217,0.4)"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function splitSentences(text) {
  return (String(text).match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [text]).map((s) => s.trim()).filter(Boolean);
}

function useSentenceSequence(texts) {
  const paragraphs = useMemo(() => texts.map(splitSentences), [texts]);
  const total = useMemo(() => paragraphs.reduce((sum, p) => sum + p.length, 0), [paragraphs]);
  const [revealed, setRevealed] = useState(1);
  const done = revealed >= total;

  const advance = useCallback(() => {
    sfx.click();
    setRevealed((r) => Math.min(r + 1, total));
  }, [total]);

  let remaining = revealed;
  const visible = paragraphs.map((sentences) => {
    const take = Math.max(0, Math.min(sentences.length, remaining));
    remaining -= take;
    return sentences.slice(0, take);
  });

  return { visible, done, advance };
}

function BackButton({ onClick }) {
  return (
    <button type="button" className="back-button" onClick={onClick}>
      ← Back
    </button>
  );
}

function HomeButton({ onClick }) {
  return (
    <button type="button" className="back-button home-button" onClick={onClick}>
      ⌂ Home
    </button>
  );
}

function SubjectPhoto() {
  return (
    <svg viewBox="0 0 80 80" className="subject-photo-art" aria-hidden="true">
      <circle cx="40" cy="30" r="16" fill="currentColor" opacity="0.85" />
      <path d="M10 74c2-20 16-30 30-30s28 10 30 30" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

function DecryptIcon() {
  return (
    <svg viewBox="0 0 64 64" className="decrypt-icon-art" aria-hidden="true">
      <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="2.5" opacity="0.5" />
      <circle cx="32" cy="32" r="17" stroke="currentColor" strokeWidth="2" opacity="0.7" />
      <path d="M32 8 L32 16 M32 48 L32 56 M8 32 L16 32 M48 32 L56 32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4" fill="currentColor" />
    </svg>
  );
}

function DocumentIcon() {
  return (
    <svg viewBox="0 0 48 48" className="document-icon-art" aria-hidden="true">
      <path d="M14 6 H30 L36 12 V42 H14 Z" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M30 6 V12 H36" stroke="currentColor" strokeWidth="2" fill="none" strokeLinejoin="round" />
      <path d="M19 22 H31 M19 28 H31 M19 34 H26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.75" />
    </svg>
  );
}

function CompassIcon() {
  return (
    <svg viewBox="0 0 48 48" className="compass-icon-art" aria-hidden="true">
      <circle cx="24" cy="24" r="19" stroke="currentColor" strokeWidth="2.2" fill="none" />
      <path d="M31 17 L21 21 L17 31 L27 27 Z" fill="currentColor" opacity="0.85" />
      <circle cx="24" cy="24" r="2.4" fill="currentColor" />
    </svg>
  );
}

function ImageFrame({ src, alt, className = "" }) {
  const [errored, setErrored] = useState(false);
  const resolved = src && !errored ? src : null;

  return (
    <div className={`image-frame ${className}`.trim()}>
      {resolved ? (
        <img src={resolved} alt={alt} loading="lazy" onError={() => setErrored(true)} />
      ) : (
        <div className="image-placeholder" aria-label="Image placeholder">
          <DocumentIcon />
        </div>
      )}
    </div>
  );
}

function StoryCard({ story, onContinue, theme }) {
  const chunks = useMemo(() => {
    const sentences = (story.body.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [story.body]).map((s) => s.trim()).filter(Boolean);
    const grouped = [];
    for (let i = 0; i < sentences.length; i += 2) {
      grouped.push(sentences.slice(i, i + 2).join(" "));
    }
    return grouped.length ? grouped : [story.body];
  }, [story.body]);

  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    setVisibleCount(1);
  }, [story.title]);

  const hasMore = visibleCount < chunks.length;

  const handleNext = () => {
    if (hasMore) {
      sfx.click();
      setVisibleCount((v) => v + 1);
      return;
    }
    onContinue();
  };

  return (
    <div className={`story-card ${theme}`}>
      <div className="story-paper">
        <p className="story-eyebrow">Recovered Document</p>
        <h2>{story.title}</h2>
        <ImageFrame src={`/images/${story.image}`} alt={story.title} className="story-image" />
        <div className="story-body-stack">
          {chunks.slice(0, visibleCount).map((chunk, i) => (
            <p
              key={i}
              className={`story-body-line ${i === visibleCount - 1 ? "story-body-line-current" : ""}`}
            >
              {chunk}
            </p>
          ))}
        </div>
        <button className="cmd-button primary" type="button" onClick={handleNext}>
          {hasMore ? "Next" : "Continue"}
        </button>
      </div>
    </div>
  );
}

function QuestionCard({ question, state, onSubmit, onAdvance, theme, stampText }) {
  const [value, setValue] = useState("");
  const [selectedOption, setSelectedOption] = useState("");
  const [shake, setShake] = useState(false);
  const solved = state?.status === "correct";

  useEffect(() => {
    setValue("");
    setSelectedOption("");
    setShake(false);
  }, [question.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (solved) return;

    const safeValue = question.type === "multiple_choice" ? selectedOption : value;
    const correct = onSubmit(question, safeValue);
    if (!correct) {
      sfx.wrong();
      setShake(true);
      if (question.type === "multiple_choice") {
        setSelectedOption("");
      }
      setTimeout(() => setShake(false), 500);
    } else {
      sfx.correct();
      // The stamp slams down a beat after the correct chime.
      setTimeout(() => sfx.stamp(), 260);
      setValue("");
      setSelectedOption("");
    }
  };

  return (
    <div className={`card ${theme} ${solved ? "card-solved" : ""} ${shake ? "card-shake" : ""}`}>
      <div className="card-inner">
        <p className="card-label">{question.label}</p>
        <p className="card-question">{question.question}</p>
        <ImageFrame src={`/images/${question.image}`} alt={question.label} className="question-image" />

        {question.type === "multiple_choice" ? (
          <div className="choice-list" role="list">
            {question.options.map((option, index) => {
              const optionKey = String.fromCharCode(65 + index);
              return (
                <button
                  key={option}
                  type="button"
                  className={`choice-button ${selectedOption === optionKey ? "active" : ""}`}
                  onClick={() => {
                    sfx.click();
                    setSelectedOption(optionKey);
                  }}
                  disabled={solved}
                >
                  <span className="choice-key">{optionKey}</span>
                  <span className="choice-text">{option}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <form className="card-form" onSubmit={handleSubmit}>
            <input
              className="card-input"
              type="text"
              placeholder="Type your answer"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              autoComplete="off"
              aria-label={question.label}
              disabled={solved}
            />
            <button className="card-submit" type="submit">
              Submit
            </button>
          </form>
        )}

        {question.type === "multiple_choice" && !solved && (
          <button className="card-submit inline" type="button" onClick={handleSubmit} disabled={!selectedOption}>
            Submit
          </button>
        )}

        {!solved && state?.status === "wrong" && <p className="card-feedback">Try again.</p>}

        {solved && (
          <>
            <div className="stamp-wrap stamp-overlap">
              <div className="stamp-ring">
                <span className="stamp-text-top">{stampText}</span>
                <span className="stamp-icon">✦</span>
                <span className="stamp-text-bottom">{state?.rank?.label}</span>
              </div>
            </div>
            <button className="card-advance" type="button" onClick={onAdvance}>
              Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 52 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.1,
        duration: 2.2 + Math.random() * 1.6,
        rotate: Math.random() * 360,
        colorClass: `c${(i % 5) + 1}`,
      })),
    []
  );

  return (
    <div className="confetti-layer" aria-hidden="true">
      {pieces.map((piece) => (
        <span
          key={piece.id}
          className={`confetti-piece ${piece.colorClass}`}
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            transform: `rotate(${piece.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default function App() {
  const [saved] = useState(() => loadProgress());

  const [screen, setScreen] = useState(() => {
    const s = saved?.screen;
    if (!s || s === "decrypting") return saved ? "home" : "intro";
    return s;
  });
  const [activeChapter, setActiveChapter] = useState(() => saved?.activeChapter || 1);
  const [segmentIndex, setSegmentIndex] = useState(() => saved?.segmentIndex || 0);
  const [questionIndex, setQuestionIndex] = useState(() => saved?.questionIndex || 0);
  const defaultChapterAnswers = useMemo(
    () => Object.fromEntries(Object.keys(chapterContent).map((id) => [id, {}])),
    []
  );
  const [chapterAnswers, setChapterAnswers] = useState(() => saved?.chapterAnswers || defaultChapterAnswers);
  const [completedChapters, setCompletedChapters] = useState(() => saved?.completedChapters || []);
  const [chapterProgress, setChapterProgress] = useState(() => saved?.chapterProgress || {});
  const [rankUp, setRankUp] = useState(null);
  const [pendingUnlock, setPendingUnlock] = useState(null);
  const [agentName, setAgentName] = useState(() => saved?.agentName || "");
  const { visible: dossierVisible, done: dossierDone, advance: dossierAdvance } = useSentenceSequence(DOSSIER_TEXTS);

  const showBackButton = screen !== "intro" && screen !== "home" && screen !== "decrypting";

  const handleBack = useCallback(() => {
    sfx.pageTurn();
    setScreen(screen === "lunaDossier" ? "intro" : "home");
  }, [screen]);

  const handleGoToIntro = useCallback(() => {
    sfx.pageTurn();
    setScreen("intro");
  }, []);

  const chapterConfig = chapterContent[activeChapter];
  const currentSegment = chapterConfig?.segments?.[segmentIndex];
  const currentQuestion = currentSegment?.questions?.[questionIndex];
  const chapterQuestionTotal = chapterConfig?.segments?.reduce((total, segment) => total + segment.questions.length, 0) || 0;
  const chapterCorrectCount = useMemo(() => {
    const chapterState = chapterAnswers[activeChapter] || {};
    return Object.values(chapterState).filter((entry) => entry?.status === "correct").length;
  }, [activeChapter, chapterAnswers]);
  const chapterRank = getChapterRank(chapterCorrectCount, chapterQuestionTotal, chapterConfig?.rankLadder || []);
  const combinedCorrectCount = useMemo(() => {
    return Object.values(chapterAnswers).reduce((sum, chapterState) => {
      return sum + Object.values(chapterState).filter((entry) => entry?.status === "correct").length;
    }, 0);
  }, [chapterAnswers]);
  const finalRank = getFinalRank(combinedCorrectCount, questions.length);

  useEffect(() => {
    if (!rankUp) return undefined;
    sfx.rankUp();
    const timer = window.setTimeout(() => setRankUp(null), 1400);
    return () => window.clearTimeout(timer);
  }, [rankUp]);

  useEffect(() => {
    if (screen === "finale" || screen === "chapterComplete") sfx.stamp();
    if (screen === "finale") sfx.finale();
  }, [screen]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  // Remember exactly where the player was within a mission, so "Resume Operation" continues there.
  useEffect(() => {
    if (screen !== "chapterIntro" && screen !== "story" && screen !== "question") return;
    setChapterProgress((prev) => {
      const existing = prev[activeChapter];
      if (existing && existing.segmentIndex === segmentIndex && existing.questionIndex === questionIndex) return prev;
      return { ...prev, [activeChapter]: { segmentIndex, questionIndex } };
    });
  }, [screen, activeChapter, segmentIndex, questionIndex]);

  // Auto-save progress on this device after every change.
  useEffect(() => {
    saveProgress({
      screen,
      activeChapter,
      segmentIndex,
      questionIndex,
      chapterAnswers,
      completedChapters,
      chapterProgress,
      agentName,
    });
  }, [screen, activeChapter, segmentIndex, questionIndex, chapterAnswers, completedChapters, chapterProgress, agentName]);

  // "Decrypting..." transition between finishing a mission and unlocking the next one.
  useEffect(() => {
    if (screen !== "decrypting" || !pendingUnlock) return undefined;
    const timer = window.setTimeout(() => {
      if (pendingUnlock.type === "finale") {
        sfx.pageTurn();
        setScreen("finale");
      } else {
        const progress = chapterProgress[pendingUnlock.chapterId] || { segmentIndex: 0, questionIndex: 0 };
        sfx.pageTurn();
        setActiveChapter(pendingUnlock.chapterId);
        setSegmentIndex(progress.segmentIndex);
        setQuestionIndex(progress.questionIndex);
        setScreen("chapterIntro");
      }
      setPendingUnlock(null);
    }, DECRYPT_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [screen, pendingUnlock, chapterProgress]);

  const handleOpenMissionBoard = useCallback(() => {
    sfx.pageTurn();
    setScreen("lunaDossier");
  }, []);

  const handleContinueToMissionBoard = useCallback(() => {
    sfx.pageTurn();
    setScreen("home");
  }, []);

  const handleStartChapter = useCallback((chapterId) => {
    sfx.pageTurn();
    const progress = chapterProgress[chapterId] || { segmentIndex: 0, questionIndex: 0 };
    setActiveChapter(chapterId);
    setSegmentIndex(progress.segmentIndex);
    setQuestionIndex(progress.questionIndex);
    setScreen("chapterIntro");
  }, [chapterProgress]);

  const handleEnterChapterStory = useCallback(() => {
    sfx.click();
    setScreen("story");
  }, []);

  const handleContinueStory = useCallback(() => {
    sfx.pageTurn();
    setScreen("question");
  }, []);

  const handleSubmitAnswer = useCallback(
    (question, value) => {
      const correct = isCorrect(value, question.answer, question.acceptedAnswers);
      const previousCount = Object.values(chapterAnswers[activeChapter] || {}).filter((entry) => entry?.status === "correct").length;
      const previousRank = getChapterRank(previousCount, chapterQuestionTotal, chapterConfig?.rankLadder || []);

      setChapterAnswers((prev) => {
        const chapterState = prev[activeChapter] || {};
        const nextCount = Object.values(chapterState).filter((entry) => entry?.status === "correct").length + (correct ? 1 : 0);
        const nextRank = getChapterRank(nextCount, chapterQuestionTotal, chapterConfig?.rankLadder || []);
        return {
          ...prev,
          [activeChapter]: {
            ...chapterState,
            [question.id]: {
              status: correct ? "correct" : "wrong",
              rank: correct ? nextRank : chapterState[question.id]?.rank,
            },
          },
        };
      });

      if (correct) {
        const nextRank = getChapterRank(previousCount + 1, chapterQuestionTotal, chapterConfig?.rankLadder || []);
        if (nextRank !== previousRank) {
          setRankUp({ chapterId: activeChapter, rank: nextRank, previousRank });
        }
      }

      return correct;
    },
    [activeChapter, chapterAnswers, chapterConfig?.rankLadder, chapterQuestionTotal]
  );

  const handleAdvanceQuestion = useCallback(() => {
    if (!currentSegment || !chapterConfig) return;
    sfx.pageTurn();

    if (questionIndex + 1 < currentSegment.questions.length) {
      setQuestionIndex((prev) => prev + 1);
      return;
    }

    if (segmentIndex + 1 < chapterConfig.segments.length) {
      setSegmentIndex((prev) => prev + 1);
      setQuestionIndex(0);
      setScreen("story");
      return;
    }

    setCompletedChapters((prev) => (prev.includes(activeChapter) ? prev : [...prev, activeChapter]));
    setScreen("chapterComplete");
  }, [activeChapter, chapterConfig, currentSegment, questionIndex, segmentIndex]);

  const handleReset = useCallback(() => {
    sfx.click();
    clearProgress();
    setScreen("intro");
    setActiveChapter(1);
    setSegmentIndex(0);
    setQuestionIndex(0);
    setChapterAnswers({ 1: {}, 2: {} });
    setCompletedChapters([]);
    setChapterProgress({});
    setRankUp(null);
    setPendingUnlock(null);
  }, []);

  const handleDownloadCertificate = useCallback(async () => {
    sfx.click();
    await ensureCertificateFontLoaded();
    const canvas = drawCertificate({
      name: agentName.trim(),
      rank: finalRank.label,
      correct: combinedCorrectCount,
      total: questions.length,
    });
    const fileSlug = (agentName.trim() || "field-agent").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    const link = document.createElement("a");
    link.download = `war-memorial-certificate-${fileSlug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, [agentName, finalRank, combinedCorrectCount]);

  const chapterIds = useMemo(
    () => Object.keys(chapterContent).map(Number).sort((a, b) => a - b),
    []
  );

  const handleContinueAfterChapter = useCallback(() => {
    sfx.click();
    const idx = chapterIds.indexOf(activeChapter);
    const nextChapterId = chapterIds[idx + 1];
    if (nextChapterId) {
      setPendingUnlock({ type: "chapter", chapterId: nextChapterId });
    } else {
      setPendingUnlock({ type: "finale" });
    }
    setScreen("decrypting");
  }, [activeChapter, chapterIds]);

  if (screen === "intro") {
    return (
      <div className="app intro-screen">
        <SoundToggle />
        <div className="briefing-frame reveal reveal-1">
          <span className="briefing-rivet tl" aria-hidden="true" />
          <span className="briefing-rivet tr" aria-hidden="true" />
          <span className="briefing-rivet bl" aria-hidden="true" />
          <span className="briefing-rivet br" aria-hidden="true" />
          <span className="classified-stamp reveal reveal-2" aria-hidden="true">Classified</span>

          <p className="briefing-eyebrow reveal reveal-1">CIEE Intelligence Division</p>
          <p className="briefing-tag reveal reveal-1">Eyes Only — Field Recruitment</p>

          <h1 className="briefing-title reveal reveal-2">
            SCAVENGER
            <br />
            HUNT
          </h1>

          <div className="briefing-illustration-wrap reveal reveal-3">
            <PosterIllustration />
          </div>

          <p className="briefing-tagline reveal reveal-4">Investigate · Decrypt · Report</p>

          <p className="briefing-note reveal reveal-4">
            Before your trip, you received a strange email — one sentence, no subject line:
            “You're the only one who can finish what Luna started.”
          </p>

          <button
            className="cmd-button primary reveal reveal-5"
            type="button"
            onClick={handleOpenMissionBoard}
          >
            Open Mission File
          </button>
        </div>
      </div>
    );
  }

  if (screen === "lunaDossier") {
    return (
      <div className="app intro-screen">
        <SoundToggle />
        {showBackButton && <BackButton onClick={handleBack} />}
        <div className="case-file reveal reveal-1">
          <span className="classified-stamp case-stamp reveal reveal-2" aria-hidden="true">Confidential</span>

          <div className="case-file-topline reveal reveal-1">
            <span>REF. LS-1998-0623</span>
            <span>ARCHIVE NO. 87-2211</span>
          </div>

          <div className="agent-assignment reveal reveal-1">
            <span className="agent-assignment-label">Your Clearance</span>
            <strong>Field Recruit — Assigned Investigator</strong>
          </div>

          <div className="mission-briefing your-assignment reveal reveal-2">
            <p className="mission-briefing-title">Your Assignment</p>
            <p className="mission-briefing-copy">
              {dossierVisible[0].map((sentence, i) => (
                <span key={i} className="pop-sentence">
                  {sentence}{" "}
                </span>
              ))}
            </p>
          </div>

          <hr className="case-file-rule" />

          <div className="case-file-status reveal reveal-2">
            <div className="case-file-status-row">
              <span>STATUS</span>
              <strong>Missing in Action</strong>
            </div>
            <div className="case-file-status-row">
              <span>LAST KNOWN LOCATION</span>
              <strong>Seoul, South Korea</strong>
            </div>
            <div className="case-file-status-row">
              <span>CASE NO.</span>
              <strong>#LS-1998</strong>
            </div>
          </div>

          <div className="case-file-subject reveal reveal-3">
            <div className="case-file-subject-info">
              <h1 className="case-file-title">SUBJECT: LUNA SHIM</h1>
              <p className="case-file-subtitle">Profile incomplete — uncover her story in the field</p>
            </div>
            <div className="subject-photo">
              <SubjectPhoto />
            </div>
          </div>

          <div className="case-file-fields reveal reveal-3">
            <div className="case-file-field">
              <dt>Origin</dt>
              <dd>Korean-American</dd>
            </div>
            <div className="case-file-field">
              <dt>Born</dt>
              <dd>1998</dd>
            </div>
            <div className="case-file-field">
              <dt>Unit</dt>
              <dd>Allied Heritage Corps</dd>
            </div>
            <div className="case-file-field">
              <dt>Role</dt>
              <dd className="redacted">Classified — find out</dd>
            </div>
          </div>

          <hr className="case-file-rule" />

          {dossierVisible[1].length > 0 && (
            <div className="mission-briefing reveal reveal-4">
              <p className="mission-briefing-title">Luna's Notes</p>
              <p className="case-file-note">
                {dossierVisible[1].map((sentence, i) => (
                  <span key={i} className="pop-sentence">
                    {sentence}{" "}
                  </span>
                ))}
              </p>
            </div>
          )}

          {dossierDone ? (
            <button
              className="cmd-button primary reveal reveal-5"
              type="button"
              onClick={handleContinueToMissionBoard}
            >
              Proceed to Mission File
            </button>
          ) : (
            <button className="cmd-button primary" type="button" onClick={dossierAdvance}>
              Continue Reading
            </button>
          )}
        </div>
      </div>
    );
  }

  if (screen === "home") {
    return (
      <div className="app mission-screen">
        <SoundToggle />
        {showBackButton && <BackButton onClick={handleBack} />}
        <HomeButton onClick={handleGoToIntro} />
        <header className="top-bar">
          <div className="top-bar-title-row">
            <span className="header-icon"><CompassIcon /></span>
            <div>
              <p className="app-eyebrow">CIEE Intelligence Division</p>
              <h1 className="app-title">Mission File</h1>
            </div>
          </div>
          <div className="clearance-badge">
            <span className="clearance-badge-label">Clearance Level</span>
            <strong>{finalRank.label}</strong>
          </div>
        </header>

        <main className="chapter-board">
          {chapterIds.map((chapterId) => {
            const chapter = chapterContent[chapterId];
            const completed = completedChapters.includes(chapterId);
            const started = Object.keys(chapterAnswers[chapterId] || {}).length > 0;
            const operationStatus = completed ? "Complete" : started ? "Active" : "Pending";
            const totalForChapter = chapter.segments.reduce((sum, segment) => sum + segment.questions.length, 0);
            const chapterCorrect = Object.values(chapterAnswers[chapterId] || {}).filter((entry) => entry?.status === "correct").length;

            return (
              <article key={chapterId} className={`chapter-card ${chapter.theme} ${completed ? "completed" : ""}`}>
                {completed && <span className="cleared-seal" aria-hidden="true">Cleared</span>}
                <div className="chapter-card-head">
                  <span className={`status-pill status-${operationStatus.toLowerCase()}`}>{operationStatus}</span>
                  <p className="chapter-codename">{chapter.codename}</p>
                </div>
                <h2 className="chapter-card-title">
                  <span className="header-icon inline"><DocumentIcon /></span>
                  {chapter.title}
                </h2>

                <dl className="dossier-fields">
                  <div className="dossier-field">
                    <dt>Threat Level</dt>
                    <dd>{chapter.threatLevel}</dd>
                  </div>
                  <div className="dossier-field">
                    <dt>Current Objective</dt>
                    <dd>{chapter.introCopy}</dd>
                  </div>
                  <div className="dossier-field">
                    <dt>Last Known Location</dt>
                    <dd>{chapter.lastKnownLocation}</dd>
                  </div>
                  <div className="dossier-field">
                    <dt>Evidence Collected</dt>
                    <dd>{chapterCorrect} / {totalForChapter}</dd>
                  </div>
                  <div className="dossier-field">
                    <dt>Operation Status</dt>
                    <dd>{operationStatus}</dd>
                  </div>
                </dl>

                <button className="cmd-button" type="button" onClick={() => handleStartChapter(chapterId)}>
                  {completed ? "Review Case File" : started ? "Resume Operation" : "Deploy"}
                </button>
              </article>
            );
          })}
        </main>
      </div>
    );
  }

  if (screen === "chapterIntro") {
    const chapter = chapterConfig;
    return (
      <div className="app intro-screen">
        <SoundToggle />
        {showBackButton && <BackButton onClick={handleBack} />}
        <div className={`intro-card chapter-dossier ${chapter?.theme || ""}`}>
          <p className="intro-eyebrow reveal reveal-1">{chapter?.subtitle}</p>
          <h1 className="intro-title reveal reveal-2">{chapter?.introTitle}</h1>
          <p className="intro-copy reveal reveal-3">{chapter?.introCopy}</p>
          <ImageFrame src={`/images/${chapter?.introImage}`} alt={chapter?.introTitle} className="chapter-intro-image reveal reveal-4" />
          <button className="cmd-button primary reveal reveal-5" type="button" onClick={handleEnterChapterStory}>
            Begin Operation
          </button>
        </div>
      </div>
    );
  }

  if (screen === "story") {
    return (
      <div className="app story-screen">
        <SoundToggle />
        {showBackButton && <BackButton onClick={handleBack} />}
        <StoryCard story={currentSegment.story} onContinue={handleContinueStory} theme={chapterConfig.theme} />
      </div>
    );
  }

  if (screen === "question") {
    return (
      <div className="app">
        <SoundToggle />
        {showBackButton && <BackButton onClick={handleBack} />}
        <header className="top-bar compact">
          <div>
            <p className="app-eyebrow">{chapterConfig.subtitle}</p>
            <h1 className="app-title">{chapterConfig.title}</h1>
          </div>
          <div className="clearance-badge compact">
            <span className="clearance-badge-label">Current Rank</span>
            <strong>{chapterRank.label}</strong>
          </div>
        </header>

        <main className="card-stage">
          {currentQuestion && (
            <QuestionCard
              key={currentQuestion.id}
              question={currentQuestion}
              state={chapterAnswers[activeChapter]?.[currentQuestion.id]}
              onSubmit={handleSubmitAnswer}
              onAdvance={handleAdvanceQuestion}
              theme={chapterConfig.theme}
              stampText={chapterConfig.stampText}
            />
          )}
        </main>
      </div>
    );
  }

  if (screen === "chapterComplete") {
    const chapter = chapterConfig;
    return (
      <div className="app finale-screen">
        <SoundToggle />
        {showBackButton && <BackButton onClick={handleBack} />}
        <div className="finale-card pop-in">
          <div className="finale-stamp stamp-overlap">
            <div className="stamp-ring big">
              <span className="stamp-text-top">Mission</span>
              <span className="stamp-icon">✦</span>
              <span className="stamp-text-bottom">Complete</span>
            </div>
          </div>
          <p className="finale-eyebrow">{chapter.subtitle}</p>
          <h1 className="finale-rank">{chapter.completionTitle}</h1>
          <p className="finale-copy">{chapter.completionCopy}</p>
          <p className="finale-copy secondary">{chapter.completionHint}</p>
          <p className="finale-score">
            Chapter rank: {chapterRank.label}
          </p>
          <button className="cmd-button primary" type="button" onClick={handleContinueAfterChapter}>
            {chapterIds.indexOf(activeChapter) + 1 < chapterIds.length ? "Continue to Next Mission" : "View Final Rank"}
          </button>
          <button className="cmd-button secondary" type="button" onClick={handleReset}>
            Return to Mission File
          </button>
        </div>
      </div>
    );
  }

  if (screen === "decrypting") {
    return (
      <div className="app decrypt-screen">
        <div className="decrypt-panel pop-in">
          <span className="decrypt-icon" aria-hidden="true">
            <DecryptIcon />
          </span>
          <p className="decrypt-title">
            {pendingUnlock?.type === "finale" ? "Compiling Final Debrief" : "Decrypting New Intelligence"}
          </p>
          <div className="decrypt-bar">
            <span className="decrypt-bar-fill" />
          </div>
        </div>
      </div>
    );
  }

  if (screen === "finale") {
    return (
      <div className="app finale-screen">
        <Confetti />
        <SoundToggle />
        {showBackButton && <BackButton onClick={handleBack} />}
        <div className="finale-card pop-in">
          <p className="finale-eyebrow">Mission complete</p>
          <div className="finale-stamp">
            <div className="stamp-ring big">
              <span className="stamp-text-top">Final rank</span>
              <span className="stamp-icon">✦</span>
              <span className="stamp-text-bottom">{finalRank.label}</span>
            </div>
          </div>
          <h1 className="finale-rank">{finalRank.label}</h1>
          <p className="finale-copy">
            One trail, walked to the end. Luna's service and yours are complete.
          </p>
          <p className="finale-copy secondary">War Memorial of Korea — Seoul, South Korea</p>
          <p className="finale-score">
            {combinedCorrectCount} / {questions.length} answers verified
          </p>

          <div className="agent-name-field">
            <label className="agent-name-label" htmlFor="agent-name">
              Agent Name (for your certificate)
            </label>
            <input
              id="agent-name"
              className="card-input"
              type="text"
              placeholder="Enter your name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              maxLength={40}
            />
          </div>

          <button className="cmd-button primary" type="button" onClick={handleDownloadCertificate}>
            Download Certificate
          </button>
          <button className="cmd-button secondary" type="button" onClick={handleReset}>
            Start New Operation
          </button>
        </div>
      </div>
    );
  }

  return null;
}
