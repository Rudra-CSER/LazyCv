import { useState } from "react";
import { Link } from "react-router";
import styles from "./VideoMarquee.module.css";

// ── Feature data ─────────────────────────────────────────────────────────────
// Every field is pulled from real app output — no invented numbers.
// Thumbnails are actual screenshot frames captured from a live LazyCv session
// for a "Full Stack Developer" role.
const VIDEOS = [
  {
    id: 1,
    href: "/register",
    tag: "Step 1",
    title: "Paste the JD, Upload Your Resume",
    desc: "Drop your PDF and paste the job description. LazyCv parses every section — skills, seniority, projects — and cross-references it against the role.",
    thumbnail: "/How_it_works/ezgif-frame-025.jpg",
    views: "~30 sec",
    likes: "Full Stack Developer",
  },
  {
    id: 2,
    href: "/register",
    tag: "Match Score",
    title: "85% — Excellent",
    desc: "Your resume scored 85% against the Full Stack Developer role. Scored across skills, experience level, and role alignment — broken down section by section.",
    thumbnail: "/How_it_works/ezgif-frame-043.jpg",
    views: "85% match",
    likes: "Excellent rating",
  },
  {
    id: 3,
    href: "/register",
    tag: "Technical Q&A",
    title: "\"How do you handle async in Node.js?\"",
    desc: "Real Q2 from a live report: model answer explains Promises, async/await, and try/catch — ready to adapt and practise from.",
    thumbnail: "/How_it_works/ezgif-frame-048.jpg",
    views: "3 technical Qs",
    likes: "Model answers",
  },
  {
    id: 4,
    href: "/register",
    tag: "Skill Gaps",
    title: "Gaps: AWS + AI/ML Integration",
    desc: "Two gaps flagged for this report: Advanced Cloud Services (AWS / Firebase) and AI/ML Integration Understanding — each ranked by impact on score.",
    thumbnail: "/How_it_works/ezgif-frame-057.jpg",
    views: "2 gaps found",
    likes: "Ranked by impact",
  },
  {
    id: 5,
    href: "/register",
    tag: "7-Day Plan",
    title: "Day 2: Node.js → Day 7: Mock Interview",
    desc: "The actual prep plan generated: Node.js & Express · MongoDB & SQL · REST APIs · Performance Optimisation · Behavioral Qs · Mock Interview.",
    thumbnail: "/How_it_works/ezgif-frame-060.jpg",
    views: "7-day plan",
    likes: "Gap-targeted",
  },
];

// ── Card ─────────────────────────────────────────────────────────────────────
const Card = ({ video, ariaHidden }) => (
  <Link
    to={video.href}
    className={styles.card}
    aria-hidden={ariaHidden || undefined}
    tabIndex={ariaHidden ? -1 : undefined}
  >
    <div className={styles.thumbWrap}>
      <img
        src={video.thumbnail}
        alt={ariaHidden ? "" : `${video.title} — LazyCv feature preview`}
        className={styles.thumb}
        loading="lazy"
      />
      <div className={styles.thumbOverlay} />
      <span className={styles.thumbTag}>{video.tag}</span>
    </div>
    <div className={styles.body}>
      <p className={styles.title}>{video.title}</p>
      <p className={styles.desc}>{video.desc}</p>
      <div className={styles.stats}>
        <span>{video.views} analyses</span>
        <span className={styles.dot}>·</span>
        <span>{video.likes} hired</span>
      </div>
    </div>
  </Link>
);

// ── Component ─────────────────────────────────────────────────────────────────
const VideoMarquee = () => {
  const [paused, setPaused] = useState(false);

  return (
    <div className={styles.wrapper}>
      <div
        className={`${styles.track} ${paused ? styles.paused : ""}`}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Original set — accessible */}
        {VIDEOS.map((v) => (
          <Card key={v.id} video={v} ariaHidden={false} />
        ))}
        {/* Duplicate for seamless loop — hidden from screen readers */}
        {VIDEOS.map((v) => (
          <Card key={`dup-${v.id}`} video={v} ariaHidden={true} />
        ))}
      </div>
    </div>
  );
};

export default VideoMarquee;
