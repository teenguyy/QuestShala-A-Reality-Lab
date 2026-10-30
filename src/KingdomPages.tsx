import { Component, Suspense, lazy, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Award, BookOpen, Castle, Compass, FlaskConical, Flower2, LibraryBig,
  ArrowUpRight, Map, Minus, NotebookPen, Pause, Play, Plus, RotateCcw, RotateCw, ScrollText, Shield, ShoppingBag, Sparkles, Swords,
} from "lucide-react";
import { CompanionAvatar } from "./CompanionAvatar";
import { getLearningCharacter } from "./characters";
import type { Activity, RewardsState, StudentProfile } from "./types";
import { curriculum, type TopicContent } from "./data";
import { getCurrentStreak, getRank, getPointsBalance, xpToNextLevel } from "./rewards/engine";

const KingdomScene = lazy(() => import("./components/KingdomScene"));

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function totalXp(rewards: RewardsState): number {
  return rewards.ledger.filter((entry) => entry.type === "xp").reduce((sum, entry) => sum + entry.amount, 0);
}

function getSubjectDestination(profile: StudentProfile, topics: TopicContent[], subjectPattern: RegExp, practice = false): string {
  const supportedTopic = topics.find((topic) => subjectPattern.test(topic.subject));
  if (supportedTopic) return `/topic/${supportedTopic.id}${practice ? "?practice=1" : ""}`;
  const subjects = Object.entries(curriculum[String(profile.grade)] ?? {});
  const match = subjects.find(([subject]) => subjectPattern.test(subject)) ??
    (subjectPattern.test("Science") ? subjects.find(([subject]) => /world around us|evs/i.test(subject)) : undefined);
  if (!match?.[1][0]) return "/lessons";
  return `/topic/unavailable?subject=${encodeURIComponent(match[0])}&title=${encodeURIComponent(match[1][0])}`;
}

export function KingdomDashboard({ profile, rewards, activities, topics }: {
  profile: StudentProfile;
  rewards: RewardsState;
  activities: Activity[];
  topics: TopicContent[];
}) {
  const character = getLearningCharacter(profile.selectedCharacterId);
  const xp = totalXp(rewards);
  const points = getPointsBalance(rewards.ledger);
  const level = xpToNextLevel(xp);
  const streak = getCurrentStreak(activities, rewards.ledger);
  const rank = getRank(streak);
  const completedTopicIds = new Set(activities.filter((item) => item.kind === "lesson").map((item) => item.topic));
  const completedTopics = topics.filter((topic) => completedTopicIds.has(topic.id)).length;
  const nextTopic = topics.find((topic) => !completedTopicIds.has(topic.id));
  const recentActivities = [...activities].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 3);

  return (
    <main className="kingdom-dashboard">
      <section className="kingdom-dashboard-hero">
        <div className="kingdom-dashboard-copy">
          <span className="kingdom-kicker"><Sparkles size={14} /> CLASS {profile.grade} · {profile.board} REALM</span>
          <h1>Welcome back, {profile.name}.</h1>
          <p>Your next discovery is waiting in the kingdom. Choose a quest, gather knowledge, and let your progress grow.</p>
          <div className="kingdom-hero-actions">
            {nextTopic
              ? <Link className="btn kingdom-button" to={`/topic/${nextTopic.id}`}>Continue: {nextTopic.title} <span aria-hidden="true">→</span></Link>
              : <Link className="btn kingdom-button" to="/syllabus">Explore your class topics <span aria-hidden="true">→</span></Link>}
            <Link className="kingdom-map-link" to="/kingdom"><Map size={17} /> Open Kingdom Map</Link>
          </div>
        </div>
        <div className="kingdom-castle-art" aria-hidden="true">
          <div className="kingdom-moon" />
          <div className="kingdom-mountain mountain-back" />
          <div className="kingdom-mountain mountain-front" />
          <div className="kingdom-castle">
            <i className="castle-tower tower-left" /><i className="castle-tower tower-right" />
            <i className="castle-keep" /><i className="castle-gate" />
          </div>
          <span className="castle-star star-a">✦</span><span className="castle-star star-b">✧</span>
        </div>
      </section>

      <section className="kingdom-player-strip" aria-label="Player status">
        <div className="kingdom-player-identity"><CompanionAvatar id={character.id} size="small" /><span><strong>{character.name}</strong><small>{character.title} · {profile.grade <= 5 ? "Short learning quests" : "Your learning companion"}</small></span></div>
        <div className="kingdom-player-stat"><span>LEVEL</span><strong>{level.level}</strong></div>
        <div className="kingdom-player-stat"><span>TOTAL XP</span><strong>{xp.toLocaleString()}</strong></div>
        <div className="kingdom-xp-progress"><div><span>Progress to Level {level.level + 1}</span><strong>{level.currentXp} / {level.required} XP</strong></div><span className="kingdom-xp-track"><i style={{ width: `${level.progressPercent}%` }} /></span></div>
        <div className="kingdom-player-stat"><span>STUDY STREAK</span><strong>{streak} <small>days</small></strong></div>
        <div className="kingdom-player-stat"><span>RANK</span><strong>{rank.name}</strong></div>
        <div className="kingdom-player-stat"><span>POINTS</span><strong>{points}</strong></div>
      </section>

      <section className="kingdom-dashboard-grid">
        <article className="kingdom-panel kingdom-current-quest">
          <div className="kingdom-section-title"><span><ScrollText size={17} /> CURRENT QUEST</span><span className="kingdom-status-tag">{nextTopic ? "Ready" : topics.length ? "Completed" : "Explore"}</span></div>
          <h2>{nextTopic ? nextTopic.title : topics.length ? "All available lessons completed" : "Explore the curriculum"}</h2>
          <p>{nextTopic ? `${nextTopic.subject} · ${nextTopic.intro}` : topics.length ? "You've completed the reviewed lessons currently available for your class. Keep learning in the topic map or revise your notes." : `Start by exploring the Class ${profile.grade} curriculum. Reviewed lessons are added topic by topic.`}</p>
          <div className="kingdom-quest-progress"><span className="kingdom-progress-track"><i style={{ width: topics.length ? `${Math.round(completedTopics / topics.length * 100)}%` : "0%" }} /></span><small>{completedTopics} of {topics.length} reviewed lessons completed</small></div>
          <Link className="kingdom-text-link" to={nextTopic ? `/topic/${nextTopic.id}` : "/syllabus"}>{nextTopic ? "Begin this lesson" : "Browse class resources"} →</Link>
        </article>
        <article className="kingdom-panel kingdom-shortcuts">
          <div className="kingdom-section-title"><span><Compass size={17} /> QUICK TRAVEL</span></div>
          <div className="kingdom-shortcut-grid">
            <Link to="/lessons"><BookOpen /><span><strong>Lessons</strong><small>Class {profile.grade} resources</small></span></Link>
            <Link to="/notes"><NotebookPen /><span><strong>Notebook</strong><small>{activities.filter((item) => item.kind === "lesson").length} lessons recorded</small></span></Link>
            <Link to="/practice"><Swords /><span><strong>Quest Arena</strong><small>Practice and tests</small></span></Link>
            <Link to="/points"><Award /><span><strong>Achievements</strong><small>{rank.name} rank · {streak} day streak</small></span></Link>
          </div>
        </article>
      </section>

      <section className="kingdom-recent-panel kingdom-panel">
        <div className="kingdom-section-title"><span><Sparkles size={17} /> RECENT ADVENTURES</span><Link className="kingdom-text-link" to="/history">View activity →</Link></div>
        {recentActivities.length ? <ul>{recentActivities.map((activity) => <li key={activity.id}><span className="kingdom-activity-icon">{activity.kind === "lesson" ? <BookOpen /> : activity.kind === "quiz" ? <Award /> : <Sparkles />}</span><span><strong>{activity.title}</strong><small>{activity.subject} · {new Date(activity.date).toLocaleDateString()}</small></span>{typeof activity.score === "number" && <b>{activity.score}%</b>}</li>)}</ul> : <p className="kingdom-empty-state">Your adventure log is ready. Finish a lesson, quiz, or game to see real activity here.</p>}
      </section>
    </main>
  );
}

const locations = [
  { title: "Knowledge Castle", subtitle: "Class topics & syllabus", icon: Castle, to: "/syllabus", tone: "castle" },
  { title: "Enchanted Library", subtitle: "Your saved notes", icon: LibraryBig, to: "/notes", tone: "library" },
  { title: "Science Tower", subtitle: "Explore science lessons", icon: FlaskConical, subject: /science|physics|chemistry|biology/i, tone: "science" },
  { title: "Mathematics Dungeon", subtitle: "Math topics & practice", icon: Shield, subject: /mathematics/i, practice: true, tone: "math" },
  { title: "Language Gardens", subtitle: "Reading & language topics", icon: Flower2, subject: /language|english/i, tone: "language" },
  { title: "Quest Arena", subtitle: "Quizzes & timed tests", icon: Swords, to: "/practice", tone: "arena" },
  { title: "Revision Keep", subtitle: "Review your learning", icon: BookOpen, to: "/notes", tone: "revision" },
  { title: "Achievement Hall", subtitle: "Real XP, ranks & activity", icon: Award, to: "/points", tone: "achievements" },
  { title: "Treasure Vault", subtitle: "Spend earned Points", icon: ShoppingBag, to: "/shop", tone: "treasure" },
] as const;

export function KingdomMapPage({ profile, activities, topics }: {
  profile: StudentProfile;
  activities: Activity[];
  topics: TopicContent[];
}) {
  const [selected, setSelected] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReducedMotion(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const completedTopics = new Set(activities.filter((item) => item.kind === "lesson").map((item) => item.topic));
  const completedCount = topics.filter((topic) => completedTopics.has(topic.id)).length;
  const nextTopic = topics.find((topic) => !completedTopics.has(topic.id));
  const destinations = locations.map((location) => ({
    ...location,
    destination: "subject" in location ? getSubjectDestination(profile, topics, location.subject, "practice" in location && location.practice) : location.to,
  }));
  const current = destinations[selected];
  const CurrentIcon = current.icon;
  const fallback = <div className="atlas-fallback"><Compass size={40} /><h2>Your realm is ready.</h2><p>Choose a destination below to start exploring. The destination list works without 3D graphics.</p></div>;
  return (
    <main className="kingdom-map-page premium-atlas">
      <header className="atlas-heading"><div><span className="atlas-kicker"><Compass size={14} /> THE EXPLORER’S ATLAS</span><h1>A world worth discovering.</h1><p>Follow your curiosity. Every corner of the kingdom opens a new way to learn.</p></div><div className="atlas-class-seal"><span>YOUR REALM</span><strong>Class {profile.grade}</strong><small>{profile.board}</small></div></header>
      <section className="atlas-world" aria-label="Kingdom map and destinations">
        <div className="atlas-viewport">
          <div className="atlas-scene-caption"><span className="atlas-live-dot" /> KINGDOM OF QUESTSHALA <small>Interactive 3D atlas</small></div>
          <div className="atlas-canvas" aria-label="Drag to rotate the 3D kingdom. Select buildings or use the destination buttons below.">
            {unavailable ? fallback : <SceneBoundary fallback={fallback}><Suspense fallback={<div className="atlas-loading" role="status"><Compass size={32} /><span>Unfolding your world…</span></div>}><KingdomScene selected={selected} onSelect={setSelected} rotation={rotation} zoom={zoom} motion={!paused && !reducedMotion} onUnavailable={() => setUnavailable(true)} /></Suspense></SceneBoundary>}
          </div>
          <span className="atlas-compass" aria-hidden="true"><span>N</span><Compass size={35} strokeWidth={1} /></span>
          <div className="atlas-map-hint">Drag to explore · Select a building</div>
          <div className="atlas-controls" role="group" aria-label="Map controls">
            <button type="button" aria-label="Rotate map left" onClick={() => setRotation((value) => value - Math.PI / 6)}><RotateCcw size={17} /></button>
            <button type="button" aria-label="Rotate map right" onClick={() => setRotation((value) => value + Math.PI / 6)}><RotateCw size={17} /></button>
            <span />
            <button type="button" aria-label="Zoom out" disabled={zoom <= .8} onClick={() => setZoom((value) => Math.max(.8, value - .15))}><Minus size={17} /></button>
            <button type="button" aria-label="Zoom in" disabled={zoom >= 1.6} onClick={() => setZoom((value) => Math.min(1.6, value + .15))}><Plus size={17} /></button>
            <span />
            <button type="button" aria-label={paused ? "Play map animation" : "Pause map animation"} disabled={reducedMotion} aria-pressed={paused || reducedMotion} onClick={() => setPaused((value) => !value)}>{paused || reducedMotion ? <Play size={17} /> : <Pause size={17} />}</button>
          </div>
        </div>
        <aside className="atlas-travel-panel">
          <div className="atlas-panel-top"><span className="atlas-kicker">YOUR NEXT DISCOVERY</span><span className="atlas-location-number">{String(selected + 1).padStart(2, "0")} / 09</span></div>
          <div className="atlas-destination-emblem"><CurrentIcon size={42} strokeWidth={1.1} /></div>
          <div className="atlas-destination-detail" aria-live="polite"><h2>{current.title}</h2><p>{current.subtitle}. Your next chapter starts here.</p></div>
          <Link className="atlas-enter" to={current.destination}>Explore destination <ArrowUpRight size={19} /></Link>
          <div className="atlas-travel-note"><Shield size={16} /><span>Every destination is open.<br />Explore at your own pace.</span></div>
          <div className="atlas-progress"><span>YOUR LEARNING JOURNEY</span><strong>{completedCount}<small> / {topics.length} reviewed lessons</small></strong><div className="atlas-progress-track"><i style={{ width: `${topics.length ? completedCount / topics.length * 100 : 0}%` }} /></div></div>
        </aside>
      </section>
      <section className="atlas-destinations" aria-label="Choose a map destination"><div className="atlas-section-heading"><h2>Where to next?</h2><span>NINE PLACES. ENDLESS CURIOSITY.</span></div><div className="atlas-destination-grid">{destinations.map(({ title, subtitle, icon: Icon }, index) => <button key={title} type="button" className={`atlas-destination ${selected === index ? "selected" : ""}`} aria-pressed={selected === index} onClick={() => setSelected(index)}><span className="atlas-destination-symbol"><Icon size={21} strokeWidth={1.5} /></span><span><strong>{title}</strong><small>{subtitle}</small></span><span className="atlas-grid-number">{String(index + 1).padStart(2, "0")}</span></button>)}</div></section>
      <section className="atlas-next-quest"><img src="/images/woodland.jpg" alt="Sunlit woodland with deer among the trees" loading="lazy" /><div><span className="atlas-kicker"><Sparkles size={13} /> A LITTLE PROGRESS, EVERY DAY</span><h2>{nextTopic ? `Discover ${nextTopic.title}` : "Your adventure starts with a question."}</h2><p>{nextTopic ? `${nextTopic.subject} · A reviewed lesson for Class ${profile.grade}.` : "Choose a subject, revisit your notes, or challenge yourself in the Quest Arena."}<br />Take the next step at your own pace.</p><Link to={nextTopic ? `/topic/${nextTopic.id}` : "/syllabus"}>{nextTopic ? "Begin this lesson" : "Explore your class topics"} <ArrowUpRight size={17} /></Link></div></section>
    </main>
  );
}
