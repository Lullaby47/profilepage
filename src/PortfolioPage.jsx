import { useState } from "react";
import "./PortfolioPage.css";
import theme1 from "./assets/themes/theme1.png";
import theme2 from "./assets/themes/theme2.png";
import theme3 from "./assets/themes/theme3.png";
import theme4 from "./assets/themes/theme4.png";
import theme5 from "./assets/themes/theme5.png";

const featuredProjects = [
  {
    title: "Portfolio Experience",
    description: "Interactive portfolio interfaces shaped around motion, clarity, and a strong visual point of view.",
    badge: "Frontend",
  },
  {
    title: "Workflow Systems",
    description: "Practical backend flows that support inquiry handling, product actions, and lightweight automation.",
    badge: "Backend",
  },
  {
    title: "Automation Strategy",
    description: "Rule-based systems built to improve execution, reduce repetition, and support scalable growth.",
    badge: "Systems",
  },
];

const highlightMetrics = [
  { value: "09", label: "Skill Areas" },
  { value: "Full Stack", label: "Build Focus" },
  { value: "Active", label: "Automation" },
];

const designApproachPoints = [
  "Thoughtful visuals and clear communication: I use visuals to simplify complex ideas and guide the user's attention. Every image, layout, and interaction is placed with intention, nothing is decorative without purpose.",
  "Clarity over clutter: Interfaces are designed to be easy to scan, with strong hierarchy and readable content.",
  "Consistency across sections: Spacing, proportions, and components stay uniform to create a smooth browsing experience.",
  "Balance between design and function: Visual elements enhance the experience without overwhelming the core message.",
];

function shuffleThemes(items) {
  const next = [...items];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }

  return next;
}

function PortfolioPage({ handleInquiry, isSendingInquiry, navigateTo, skillDetails }) {
  const visibleSkills = Object.values(skillDetails).slice(0, 6);
  const [themeDeck] = useState(() => shuffleThemes([theme1, theme2, theme3, theme4, theme5]));
  const panelThemes = {
    hero: themeDeck[0],
    profile: themeDeck[2],
    capabilities: themeDeck[1],
    work: themeDeck[3],
    visual: themeDeck[4],
  };

  const backgroundThemes = {
    hero: themeDeck[2],
    profile: themeDeck[3],
    capabilities: themeDeck[4],
    work: themeDeck[0],
    visual: themeDeck[1],
  };

  return (
    <main className="portfolio-page">
      <nav className="portfolio-nav">
        <button className="nav-pill" onClick={() => navigateTo("world")}>Back to World</button>
        <button className="nav-pill nav-pill-accent" onClick={handleInquiry} disabled={isSendingInquiry}>
          {isSendingInquiry ? "Sending..." : "Send Inquiry"}
        </button>
      </nav>

      <div className="bento-container">
        <section className="bento-main panel-shell panel-shell-hero">
          <div className="panel-ambient panel-ambient-hero" aria-hidden="true">
            <img src={panelThemes.hero} alt="" />
          </div>
          <div className="panel-grid panel-grid-hero">
            <div className="panel-copy">
              <p className="eyebrow">Ayush Pokharel</p>
              <h1>Creative developer building clean, <span>interactive</span> digital systems.</h1>
              <p className="intro-copy">
                I focus on creating polished web experiences that feel thoughtful, structured,
                and easy to use. My work combines interface design, frontend development,
                and practical systems thinking.
              </p>
              <p className="intro-copy">
                I care about visual clarity, motion that feels intentional, and systems that
                turn strong ideas into practical products.
              </p>
              <div className="metrics-strip">
                {highlightMetrics.map((m) => (
                  <div key={m.label} className="metric-box">
                    <strong>{m.value}</strong>
                    <span>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <aside className="bento-profile panel-shell">
          <div className="panel-ambient panel-ambient-profile-hero" aria-hidden="true">
            <img src={panelThemes.profile} alt="" />
          </div>
          <div className="profile-frame">
            <img src="/my-photo.jpg" alt="Ayush" />
          </div>
          <div className="profile-details">
            <span className="label">Focus</span>
            <ul className="profile-focus-list">
              <li>Scalable frontend development (React, UI/UX structure, performance tuning)</li>
              <li>Backend systems and APIs (Node.js, integrations, data handling)</li>
              <li>Automation and workflow optimization (social media systems, business tools)</li>
              <li>Full-stack product execution (idea to build to deploy to iterate)</li>
            </ul>
          </div>
        </aside>

        <section className="bento-capabilities panel-shell">
          <div className="panel-ambient" aria-hidden="true">
            <img src={backgroundThemes.capabilities} alt="" />
          </div>
          <div className="section-header">
            <p className="eyebrow">Capabilities</p>
            <h2>Balanced implementation with strong creative structure.</h2>
          </div>

          <div className="cap-feature-card">
            <figure className="art-card art-card-capabilities">
              <img src={panelThemes.capabilities} alt="Capabilities panel visual theme" />
            </figure>
          </div>

          <div className="cap-grid">
            {visibleSkills.map((s) => (
              <div key={s.title} className="cap-item">
                <span className="level">{s.level}</span>
                <h3>{s.title}</h3>
                <p>{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bento-work panel-shell">
          <div className="panel-ambient" aria-hidden="true">
            <img src={backgroundThemes.work} alt="" />
          </div>
          <div className="section-header">
            <p className="eyebrow">Selected Themes</p>
            <h2>Work shaped around product clarity and execution.</h2>
          </div>

          <figure className="art-card art-card-work">
            <img src={panelThemes.work} alt="Selected work visual theme" />
          </figure>

          <div className="work-stack">
            {featuredProjects.map((p) => (
              <div key={p.title} className="work-item">
                <span className="badge">{p.badge}</span>
                <h3>{p.title}</h3>
                <p>{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bento-visuals panel-shell">
          <div className="panel-ambient" aria-hidden="true">
            <img src={backgroundThemes.visual} alt="" />
          </div>
          <div className="visual-notes-copy">
            <p className="eyebrow">Design Approach</p>
            <h2>Thoughtful visuals. Clear communication.</h2>
            <ul className="visual-note-list">
              {designApproachPoints.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
          <figure className="art-card art-card-visual">
            <img src={panelThemes.visual} alt="Additional portfolio visual theme" />
          </figure>
        </section>
      </div>
    </main>
  );
}

export default PortfolioPage;
