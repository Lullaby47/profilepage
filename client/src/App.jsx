import { useState, useEffect, useRef } from "react";
import "./App.css";

function getViewportConfig() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const isMobile = width <= 768;
  const profileSize = isMobile ? 96 : 130;
  const skillSize = isMobile ? 46 : 54;
  const orbitRadius = isMobile
    ? Math.min(width * 0.35, 130)
    : Math.min(width * 0.24, 230);
  const centerX = width / 2;
  const centerY = isMobile ? height * 0.58 : height / 2;

  return {
    width,
    height,
    isMobile,
    profileSize,
    skillSize,
    orbitRadius,
    centerX,
    centerY,
  };
}

function clampPosition(x, y, size, viewport) {
  return {
    x: Math.min(Math.max(12, x), Math.max(12, viewport.width - size - 12)),
    y: Math.min(Math.max(12, y), Math.max(12, viewport.height - size - 12)),
  };
}

function clampPositionInBounds(x, y, size, bounds) {
  return {
    x: Math.min(Math.max(12, x), Math.max(12, bounds.width - size - 12)),
    y: Math.min(Math.max(12, y), Math.max(12, bounds.height - size - 12)),
  };
}

function getMobileOrbitConfig(viewport) {
  const width = Math.min(viewport.width - 32, 420);
  const height = Math.min(Math.max(viewport.height * 0.6, 360), 500);
  const profileSize = 84;
  const skillSize = 44;
  const centerX = width / 2;
  const centerY = height * 0.58;
  const orbitRadius = Math.min(width * 0.33, 110);

  return {
    width,
    height,
    profileSize,
    skillSize,
    centerX,
    centerY,
    orbitRadius,
  };
}

function randomVelocity(minSpeed, maxSpeed) {
  const angle = Math.random() * Math.PI * 2;
  const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);

  return {
    x: Math.cos(angle) * speed,
    y: Math.sin(angle) * speed,
  };
}

function createVelocitySet(count, minSpeed, maxSpeed) {
  return Array.from({ length: count }, () => randomVelocity(minSpeed, maxSpeed));
}

function resolveSkillCollisions(positions, velocities, size) {
  const radius = size / 2;

  for (let i = 0; i < positions.length; i += 1) {
    for (let j = i + 1; j < positions.length; j += 1) {
      const ax = positions[i].x + radius;
      const ay = positions[i].y + radius;
      const bx = positions[j].x + radius;
      const by = positions[j].y + radius;
      let dx = bx - ax;
      let dy = by - ay;
      let distance = Math.hypot(dx, dy);

      if (distance === 0) {
        dx = Math.random() - 0.5;
        dy = Math.random() - 0.5;
        distance = Math.hypot(dx, dy) || 1;
      }

      const minDistance = radius * 2;

      if (distance >= minDistance) continue;

      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;

      positions[i].x -= (nx * overlap) / 2;
      positions[i].y -= (ny * overlap) / 2;
      positions[j].x += (nx * overlap) / 2;
      positions[j].y += (ny * overlap) / 2;

      const relativeVelocityX = velocities[i].x - velocities[j].x;
      const relativeVelocityY = velocities[i].y - velocities[j].y;
      const speedAlongNormal = relativeVelocityX * nx + relativeVelocityY * ny;

      if (speedAlongNormal > 0) continue;

      velocities[i].x -= speedAlongNormal * nx;
      velocities[i].y -= speedAlongNormal * ny;
      velocities[j].x += speedAlongNormal * nx;
      velocities[j].y += speedAlongNormal * ny;
    }
  }
}

function resolveProfileCollisions(positions, velocities, size, profilePos, profileSize) {
  const skillRadius = size / 2;
  const profileRadius = profileSize / 2;
  const profileCenterX = profilePos.x + profileRadius;
  const profileCenterY = profilePos.y + profileRadius;

  for (let i = 0; i < positions.length; i += 1) {
    const centerX = positions[i].x + skillRadius;
    const centerY = positions[i].y + skillRadius;
    let dx = centerX - profileCenterX;
    let dy = centerY - profileCenterY;
    let distance = Math.hypot(dx, dy);

    if (distance === 0) {
      dx = Math.random() - 0.5;
      dy = Math.random() - 0.5;
      distance = Math.hypot(dx, dy) || 1;
    }

    const minDistance = skillRadius + profileRadius;

    if (distance >= minDistance) continue;

    const nx = dx / distance;
    const ny = dy / distance;
    const overlap = minDistance - distance;

    positions[i].x += nx * overlap;
    positions[i].y += ny * overlap;

    const dot = velocities[i].x * nx + velocities[i].y * ny;
    velocities[i].x -= 2 * dot * nx;
    velocities[i].y -= 2 * dot * ny;
  }
}

function constrainToBounds(positions, velocities, size, bounds) {
  const minX = 12;
  const minY = bounds.topPadding ?? 12;
  const maxX = bounds.width - size - 12;
  const maxY = bounds.height - size - 12;

  for (let i = 0; i < positions.length; i += 1) {
    if (positions[i].x <= minX) {
      positions[i].x = minX;
      velocities[i].x = Math.abs(velocities[i].x);
    }

    if (positions[i].x >= maxX) {
      positions[i].x = maxX;
      velocities[i].x = -Math.abs(velocities[i].x);
    }

    if (positions[i].y <= minY) {
      positions[i].y = minY;
      velocities[i].y = Math.abs(velocities[i].y);
    }

    if (positions[i].y >= maxY) {
      positions[i].y = maxY;
      velocities[i].y = -Math.abs(velocities[i].y);
    }
  }
}

function stepSkillSimulation({
  positions,
  velocities,
  size,
  bounds,
  profilePos,
  profileSize,
  draggedIndex,
  deltaSeconds,
}) {
  const nextPositions = positions.map((position) => ({ ...position }));
  const nextVelocities = velocities.map((velocity) => ({ ...velocity }));

  for (let i = 0; i < nextPositions.length; i += 1) {
    if (draggedIndex === i) continue;

    nextPositions[i].x += nextVelocities[i].x * deltaSeconds;
    nextPositions[i].y += nextVelocities[i].y * deltaSeconds;
  }

  constrainToBounds(nextPositions, nextVelocities, size, bounds);
  if (profilePos) {
    resolveProfileCollisions(nextPositions, nextVelocities, size, profilePos, profileSize);
  }
  resolveSkillCollisions(nextPositions, nextVelocities, size);
  constrainToBounds(nextPositions, nextVelocities, size, bounds);

  return {
    positions: nextPositions,
    velocities: nextVelocities,
  };
}

function App() {
  const [showProfile, setShowProfile] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [showProfilePanel, setShowProfilePanel] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSuccessSplash, setShowSuccessSplash] = useState(false);
  const [splashType, setSplashType] = useState("success");
  const [splashMessage, setSplashMessage] = useState("Your inquiry was sent.");
  const [isSendingInquiry, setIsSendingInquiry] = useState(false);
  const [activeBubble, setActiveBubble] = useState(null);

  const dragStart = useRef({ x: 0, y: 0 });
  const hasDragged = useRef(false);
  const mobilePanelRef = useRef(null);
  const clickTimerRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastFrameRef = useRef(0);
  const desktopVelocitiesRef = useRef([]);
  const mobileVelocitiesRef = useRef([]);
  const desktopSkillPositionsRef = useRef([]);
  const mobileSkillPositionsRef = useRef([]);
  const profilePosRef = useRef(null);
  const mobileProfilePosRef = useRef(null);
  const [viewport, setViewport] = useState(() => getViewportConfig());
  const mobileOrbit = getMobileOrbitConfig(viewport);

  const skills = [
    "React",
    "Node.js",
    "MongoDB",
    "Express",
    "JavaScript",
    "UI/UX",
    "Problem Solving",
    "Teamwork",
    "Creativity",
  ];

  const profileImages = [
    "photo1.png",
    "photo2.png",
    "photo3.png",
    "photo4.png",
    "photo5.png",
    "photo6.png",
  ];

  const skillDetails = {
    React: {
      title: "React",
      level: "Frontend UI Development",
      description: "Building interactive, reusable, and modern user interfaces.",
      projects: ["Creative Universe Portfolio", "Skill Bubble UI"],
      strengths: ["Components", "Hooks", "Interactive UI"],
    },
    "Node.js": {
      title: "Node.js",
      level: "Backend Basics",
      description: "Creating backend logic and APIs for full-stack applications.",
      projects: ["Portfolio API"],
      strengths: ["Server Logic", "API Handling"],
    },
    MongoDB: {
      title: "MongoDB",
      level: "Database",
      description: "Storing flexible data for apps, users, and contact forms.",
      projects: ["Contact Storage"],
      strengths: ["Documents", "Data Models"],
    },
    Express: {
      title: "Express",
      level: "Backend Framework",
      description: "Building routes, middleware, and API structure.",
      projects: ["API Routes"],
      strengths: ["Routing", "Middleware"],
    },
    JavaScript: {
      title: "JavaScript",
      level: "Core Programming",
      description: "Powering drag systems, animations, random colors, and panels.",
      projects: ["Drag System", "Animated Skill Buttons"],
      strengths: ["Events", "Logic", "State"],
    },
    "UI/UX": {
      title: "UI/UX",
      level: "Creative Design",
      description: "Designing modern, imaginative, and interactive interfaces.",
      projects: ["Creative Universe Design"],
      strengths: ["Glassmorphism", "Hover Effects", "Layouts"],
    },
    "Problem Solving": {
      title: "Problem Solving",
      level: "Logical Thinking",
      description: "Debugging issues, improving layouts, and building step by step.",
      projects: ["Responsive Fixes", "Drag Logic"],
      strengths: ["Debugging", "Iteration", "Planning"],
    },
    Teamwork: {
      title: "Teamwork",
      level: "Collaboration",
      description: "Communicating clearly and improving through feedback.",
      projects: ["Collaborative Projects"],
      strengths: ["Communication", "Feedback"],
    },
    Creativity: {
      title: "Creativity",
      level: "Innovation",
      description: "Creating unique UI ideas like draggable glowing skill bubbles.",
      projects: ["My Creative Universe"],
      strengths: ["Imagination", "Visual Ideas"],
    },
  };
  const [flash, setFlash] = useState(false);
  function getRandomStyle() {
    const colors = ["red", "yellow", "green", "blue", "purple"];
    return {
      color: colors[Math.floor(Math.random() * colors.length)],
      duration: (Math.random() * 1.5 + 0.8).toFixed(2),
      delay: (Math.random() * 2).toFixed(2),
    };
  }
  async function handleInquiry() {
    if (isSendingInquiry) return;

    setIsSendingInquiry(true);

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: "portfolio-inquiry-button",
          clickedAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error("Request failed");
      }

      setFlash(true);
      setShowSuccessSplash(false);
      setSplashType("success");
      setSplashMessage("Your inquiry was sent.");

      setTimeout(() => {
        setFlash(false);
        setShowSuccessSplash(true);

        setTimeout(() => {
          setShowSuccessSplash(false);
        }, 2000);
      }, 1000);
    } catch (error) {
      setSplashType("error");
      setSplashMessage("Inquiry failed. Please try again.");
      setShowSuccessSplash(true);

      setTimeout(() => {
        setShowSuccessSplash(false);
      }, 2000);
    } finally {
      setIsSendingInquiry(false);
    }
  }
  const getDefaultProfilePosition = () =>
    clampPosition(
      viewport.centerX - viewport.profileSize / 2,
      viewport.isMobile
        ? viewport.height - viewport.profileSize - 140
        : viewport.centerY - viewport.profileSize / 2,
      viewport.profileSize,
      viewport
    );

  const getDefaultSkillPositions = () => {
    return skills.map((_, i) => {
      const angle = Math.PI - (i / (skills.length - 1)) * Math.PI;
      return clampPosition(
        viewport.centerX + viewport.orbitRadius * Math.cos(angle) - viewport.skillSize / 2,
        viewport.centerY - viewport.orbitRadius * Math.sin(angle) - viewport.skillSize / 2,
        viewport.skillSize,
        viewport
      );
    });
  };

  const [profilePos, setProfilePos] = useState(() => {
    const saved = localStorage.getItem("profilePos");
    if (!saved) return getDefaultProfilePosition();

    const parsed = JSON.parse(saved);
    return clampPosition(parsed.x, parsed.y, viewport.profileSize, viewport);
  });

  const [skillPositions, setSkillPositions] = useState(() => {
    const saved = localStorage.getItem("skillPositions");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length === skills.length) {
        return parsed.map((pos) =>
          clampPosition(pos.x, pos.y, viewport.skillSize, viewport)
        );
      }
    }
    return getDefaultSkillPositions();
  });

  const [skillStyles, setSkillStyles] = useState(() =>
    skills.map(() => getRandomStyle())
  );

  const getDefaultMobileProfilePosition = () =>
    clampPositionInBounds(
      mobileOrbit.centerX - mobileOrbit.profileSize / 2,
      mobileOrbit.height - mobileOrbit.profileSize - 36,
      mobileOrbit.profileSize,
      mobileOrbit
    );

  const getDefaultMobileSkillPositions = () =>
    skills.map((_, i) => {
      const angle = Math.PI - (i / (skills.length - 1)) * Math.PI;

      return clampPositionInBounds(
        mobileOrbit.centerX +
          mobileOrbit.orbitRadius * Math.cos(angle) -
          mobileOrbit.skillSize / 2,
        mobileOrbit.centerY -
          mobileOrbit.orbitRadius * Math.sin(angle) -
          mobileOrbit.skillSize / 2,
        mobileOrbit.skillSize,
        mobileOrbit
      );
    });

  const [mobileProfilePos, setMobileProfilePos] = useState(() => {
    const saved = localStorage.getItem("mobileProfilePos");
    if (!saved) return getDefaultMobileProfilePosition();

    const parsed = JSON.parse(saved);
    return clampPositionInBounds(
      parsed.x,
      parsed.y,
      mobileOrbit.profileSize,
      mobileOrbit
    );
  });
  const [mobileSkillPositions, setMobileSkillPositions] = useState(() =>
    getDefaultMobileSkillPositions()
  );

  const [draggingProfile, setDraggingProfile] = useState(false);
  const [draggingSkillIndex, setDraggingSkillIndex] = useState(null);

  useEffect(() => {
    localStorage.setItem("profilePos", JSON.stringify(profilePos));
  }, [profilePos]);

  useEffect(() => {
    localStorage.setItem("mobileProfilePos", JSON.stringify(mobileProfilePos));
  }, [mobileProfilePos]);

  useEffect(() => {
    localStorage.setItem("skillPositions", JSON.stringify(skillPositions));
  }, [skillPositions]);

  useEffect(() => {
    desktopSkillPositionsRef.current = skillPositions;
  }, [skillPositions]);

  useEffect(() => {
    mobileSkillPositionsRef.current = mobileSkillPositions;
  }, [mobileSkillPositions]);

  useEffect(() => {
    profilePosRef.current = profilePos;
  }, [profilePos]);

  useEffect(() => {
    mobileProfilePosRef.current = mobileProfilePos;
  }, [mobileProfilePos]);

  useEffect(() => {
    function handleResize() {
      setViewport(getViewportConfig());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    setProfilePos((current) =>
      clampPosition(current.x, current.y, viewport.profileSize, viewport)
    );
    setSkillPositions((current) => {
      if (current.length !== skills.length) {
        return getDefaultSkillPositions();
      }

      return current.map((pos) =>
        clampPosition(pos.x, pos.y, viewport.skillSize, viewport)
      );
    });
    setMobileProfilePos((current) =>
      clampPositionInBounds(
        current.x,
        current.y,
        mobileOrbit.profileSize,
        mobileOrbit
      )
    );
    setMobileSkillPositions((current) => {
      if (current.length !== skills.length) {
        return getDefaultMobileSkillPositions();
      }

      return current.map((pos) =>
        clampPositionInBounds(
          pos.x,
          pos.y,
          mobileOrbit.skillSize,
          mobileOrbit
        )
      );
    });
  }, [viewport, skills.length]);

  useEffect(() => {
    desktopVelocitiesRef.current = createVelocitySet(skills.length, 32, 64);
    mobileVelocitiesRef.current = createVelocitySet(skills.length, 26, 48);
  }, [skills.length, viewport.isMobile]);

  useEffect(() => {
    const timers = skills.map((_, index) => {
      const randomInterval = Math.random() * 3000 + 2000;

      const timer = setInterval(() => {
        setSkillStyles((prev) => {
          const updated = [...prev];
          updated[index] = getRandomStyle();
          return updated;
        });
      }, randomInterval);

      return timer;
    });

    return () => timers.forEach(clearInterval);
  }, [skills.length]);

  useEffect(() => {
    if (!showProfile) return undefined;

    function animate(timestamp) {
      if (!lastFrameRef.current) {
        lastFrameRef.current = timestamp;
      }

      const deltaSeconds = Math.min((timestamp - lastFrameRef.current) / 1000, 0.033);
      lastFrameRef.current = timestamp;

      if (viewport.isMobile) {
        const next = stepSkillSimulation({
          positions: mobileSkillPositionsRef.current,
          velocities: mobileVelocitiesRef.current,
          size: mobileOrbit.skillSize,
          bounds: {
            width: mobileOrbit.width,
            height: mobileOrbit.height,
            topPadding: 52,
          },
          profilePos: mobileProfilePosRef.current,
          profileSize: mobileOrbit.profileSize,
          draggedIndex: draggingSkillIndex,
          deltaSeconds,
        });

        mobileVelocitiesRef.current = next.velocities;
        mobileSkillPositionsRef.current = next.positions;
        setMobileSkillPositions(next.positions);
      } else {
        const next = stepSkillSimulation({
          positions: desktopSkillPositionsRef.current,
          velocities: desktopVelocitiesRef.current,
          size: viewport.skillSize,
          bounds: {
            width: viewport.width,
            height: viewport.height,
          },
          profilePos: profilePosRef.current,
          profileSize: viewport.profileSize,
          draggedIndex: draggingSkillIndex,
          deltaSeconds,
        });

        desktopVelocitiesRef.current = next.velocities;
        desktopSkillPositionsRef.current = next.positions;
        setSkillPositions(next.positions);
      }

      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = null;
      lastFrameRef.current = 0;
    };
  }, [
    showProfile,
    viewport.isMobile,
    viewport.width,
    viewport.height,
    viewport.skillSize,
    viewport.profileSize,
    mobileOrbit.width,
    mobileOrbit.height,
    mobileOrbit.skillSize,
    mobileOrbit.profileSize,
    draggingSkillIndex,
  ]);

  function handlePointerMove(e) {
    const moved =
      Math.abs(e.clientX - dragStart.current.x) > 5 ||
      Math.abs(e.clientY - dragStart.current.y) > 5;

    if (moved) hasDragged.current = true;

    if (viewport.isMobile) {
      const panelRect = mobilePanelRef.current?.getBoundingClientRect();

      if (!panelRect) return;

      if (draggingProfile) {
      setMobileProfilePos(
        clampPositionInBounds(
          e.clientX - panelRect.left - mobileOrbit.profileSize / 2,
            e.clientY - panelRect.top - mobileOrbit.profileSize / 2,
            mobileOrbit.profileSize,
            mobileOrbit
          )
        );
      }

      if (draggingSkillIndex !== null) {
      const updated = [...mobileSkillPositions];
      updated[draggingSkillIndex] = clampPositionInBounds(
        e.clientX - panelRect.left - mobileOrbit.skillSize / 2,
          e.clientY - panelRect.top - mobileOrbit.skillSize / 2,
          mobileOrbit.skillSize,
          mobileOrbit
        );
        setMobileSkillPositions(updated);
      }

      return;
    }

    if (draggingProfile) {
      setProfilePos(
        clampPosition(
          e.clientX - viewport.profileSize / 2,
          e.clientY - viewport.profileSize / 2,
          viewport.profileSize,
          viewport
        )
      );
    }

    if (draggingSkillIndex !== null) {
      const updated = [...skillPositions];
      updated[draggingSkillIndex] = clampPosition(
        e.clientX - viewport.skillSize / 2,
        e.clientY - viewport.skillSize / 2,
        viewport.skillSize,
        viewport
      );
      setSkillPositions(updated);
    }
  }

  useEffect(() => {
    if (!draggingProfile && draggingSkillIndex === null) return undefined;

    function handleWindowPointerMove(event) {
      handlePointerMove(event);
    }

    function handleWindowPointerUp() {
      stopDrag();
    }

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    window.addEventListener("pointercancel", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
      window.removeEventListener("pointercancel", handleWindowPointerUp);
    };
  }, [draggingProfile, draggingSkillIndex, viewport.isMobile, mobileOrbit.profileSize, mobileOrbit.skillSize, viewport.profileSize, viewport.skillSize]);

  function stopDrag() {
    setDraggingProfile(false);
    setDraggingSkillIndex(null);
  }

  function handleSkillClick(skill, index) {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    const updated = [...skillStyles];
    updated[index] = getRandomStyle();
    setSkillStyles(updated);

    setShowProfilePanel(false);
    setSelectedImage(null);
    setSelectedSkill(skill);
  }

  function showBubble(type, key, message) {
    setActiveBubble({ type, key, message });

    window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => {
      setActiveBubble((current) =>
        current?.type === type && current?.key === key ? null : current
      );
    }, 1800);
  }

  function handleSkillInteraction(skill, index, detail = 1) {
    if (detail === 2) {
      window.clearTimeout(clickTimerRef.current);
      setActiveBubble(null);
      handleSkillClick(skill, index);
      return;
    }

    window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => {
      showBubble("skill", skill, skill);
    }, 220);
  }

  function handleProfileClick() {
    if (hasDragged.current) {
      hasDragged.current = false;
      return;
    }

    setSelectedSkill(null);
    setSelectedImage(null);
    setShowProfilePanel(true);
  }

  function handleProfileInteraction(detail = 1) {
    if (detail === 2) {
      window.clearTimeout(clickTimerRef.current);
      setActiveBubble(null);
      handleProfileClick();
      return;
    }

    window.clearTimeout(clickTimerRef.current);
    clickTimerRef.current = window.setTimeout(() => {
      showBubble("profile", "main-profile", "Ayush Pokharel");
    }, 220);
  }

  return (
      <div
      className={`app ${flash ? "flash-red" : ""}`}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDrag}
      onPointerCancel={stopDrag}
    >
      {!showProfile ? (
        <section className="hero">
          <div className="glass">
            <h1>My Creative Universe 🚀</h1>
            <p>I build digital worlds, explore ideas, and turn creativity into reality.</p>
            <button onClick={() => setShowProfile(true)}>Explore My World</button>
          </div>
        </section>
      ) : (
        <section className={`profile-world ${viewport.isMobile ? "profile-world-mobile" : ""}`}>
          {viewport.isMobile ? (
            <div className="mobile-world">
              <div className="mobile-skills-section">
                <div
                  className="mobile-orbit-panel"
                  ref={mobilePanelRef}
                  style={{
                    width: `${mobileOrbit.width}px`,
                    height: `${mobileOrbit.height}px`,
                  }}
                >
                  <h3 className="mobile-orbit-title">Skill Sets</h3>
                  <svg className="mobile-connection-layer">
                    {mobileSkillPositions.map((pos, index) => (
                      <line
                        key={skills[index]}
                        x1={mobileProfilePos.x + mobileOrbit.profileSize / 2}
                        y1={mobileProfilePos.y + mobileOrbit.profileSize / 2}
                        x2={pos.x + mobileOrbit.skillSize / 2}
                        y2={pos.y + mobileOrbit.skillSize / 2}
                        className={`connection-line line-${skillStyles[index].color}`}
                      />
                    ))}
                  </svg>

                  {skills.map((skill, index) => (
                    <button
                      key={skill}
                      className={`mobile-orbit-skill pulse-${skillStyles[index].color}`}
                      data-skill={skill}
                      onPointerDown={(e) => {
                        dragStart.current = { x: e.clientX, y: e.clientY };
                        hasDragged.current = false;
                        setDraggingSkillIndex(index);
                      }}
                      onClick={(e) => handleSkillInteraction(skill, index, e.detail)}
                      style={{
                        transform: `translate3d(${mobileSkillPositions[index].x}px, ${mobileSkillPositions[index].y}px, 0)`,
                        animationDuration: `${skillStyles[index].duration}s`,
                        animationDelay: `${skillStyles[index].delay}s`,
                      }}
                    >
                      {activeBubble?.type === "skill" && activeBubble.key === skill && (
                        <span className="tap-message">{activeBubble.message}</span>
                      )}
                    </button>
                  ))}

                  <div
                    className="mobile-orbit-profile"
                    onPointerDown={(e) => {
                      dragStart.current = { x: e.clientX, y: e.clientY };
                      hasDragged.current = false;
                      setDraggingProfile(true);
                    }}
                    onClick={(e) => handleProfileInteraction(e.detail)}
                    style={{
                      transform: `translate3d(${mobileProfilePos.x}px, ${mobileProfilePos.y}px, 0)`,
                    }}
                  >
                    <img src="/my-photo.jpg" alt="profile" draggable="false" />
                    {activeBubble?.type === "profile" &&
                      activeBubble.key === "main-profile" && (
                        <span className="tap-message profile-message">
                          {activeBubble.message}
                        </span>
                      )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <svg className="connection-layer">
                {skillPositions.map((pos, index) => (
                  <line
                    key={skills[index]}
                    x1={profilePos.x + viewport.profileSize / 2}
                    y1={profilePos.y + viewport.profileSize / 2}
                    x2={pos.x + viewport.skillSize / 2}
                    y2={pos.y + viewport.skillSize / 2}
                    className={`connection-line line-${skillStyles[index].color}`}
                  />
                ))}
              </svg>

              <div className="orbit-box">
                {skills.map((skill, index) => (
                  <button
                    key={skill}
                    className={`skill-orbit pulse-${skillStyles[index].color}`}
                    data-skill={skill}
                    onPointerDown={(e) => {
                      dragStart.current = { x: e.clientX, y: e.clientY };
                      hasDragged.current = false;
                      setDraggingSkillIndex(index);
                    }}
                    onClick={(e) => handleSkillInteraction(skill, index, e.detail)}
                    style={{
                      transform: `translate3d(${skillPositions[index].x}px, ${skillPositions[index].y}px, 0)`,
                      animationDuration: `${skillStyles[index].duration}s`,
                      animationDelay: `${skillStyles[index].delay}s`,
                    }}
                  >
                    {activeBubble?.type === "skill" && activeBubble.key === skill && (
                      <span className="tap-message">{activeBubble.message}</span>
                    )}
                  </button>
                ))}

                <div
                  className="profile-card"
                  onPointerDown={(e) => {
                    dragStart.current = { x: e.clientX, y: e.clientY };
                    hasDragged.current = false;
                    setDraggingProfile(true);
                  }}
                  onClick={(e) => handleProfileInteraction(e.detail)}
                  style={{
                    transform: `translate3d(${profilePos.x}px, ${profilePos.y}px, 0)`,
                  }}
                >
                  <img src="/my-photo.jpg" alt="profile" draggable="false" />
                  {activeBubble?.type === "profile" &&
                    activeBubble.key === "main-profile" && (
                      <span className="tap-message profile-message">
                        {activeBubble.message}
                      </span>
                    )}
                </div>
              </div>
            </>
          )}

          {selectedSkill && skillDetails[selectedSkill] && (
            <div className="overlay" onClick={() => setSelectedSkill(null)}>
              <div className="panel-area">
                <div className="skill-panel" onClick={(e) => e.stopPropagation()}>
                  <h2>{skillDetails[selectedSkill].title}</h2>
                  <h3>{skillDetails[selectedSkill].level}</h3>
                  <p>{skillDetails[selectedSkill].description}</p>

                  <h4>Projects</h4>
                  <ul>
                    {skillDetails[selectedSkill].projects.map((project) => (
                      <li key={project}>{project}</li>
                    ))}
                  </ul>

                  <h4>Strengths</h4>
                  <ul>
                    {skillDetails[selectedSkill].strengths.map((strength) => (
                      <li key={strength}>{strength}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {showProfilePanel && (
            <div className="overlay" onClick={() => setShowProfilePanel(false)}>
              <div className="panel-area">
                <div className="skill-panel profile-gallery-panel" onClick={(e) => e.stopPropagation()}>
                  <h2>Gallery</h2>
                  

                  <div className="profile-image-grid">
                    {profileImages.map((image) => (
                      <img
                        key={image}
                        src={`/profile-images/${image}`}
                        alt={image}
                        onClick={() => setSelectedImage(image)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedImage && (
            <div className="image-splash" onClick={() => setSelectedImage(null)}>
              <div className="image-splash-card" onClick={(e) => e.stopPropagation()}>
                <h1>Ayush Pokharel</h1>
                <p className="email">pokharelayush2@gmail.com</p>
                <button
                  className="inquiry-button"
                  onClick={handleInquiry}
                  disabled={isSendingInquiry}
                >
                  {isSendingInquiry ? "Sending..." : "Send Inquiry"}
                </button>
                <p className="tagline">Contact me if you wanna make inquiry.</p>

                <h2>Skill Sets</h2>

                <div className="info-section">
                  <h3>💻 Technical Strengths</h3>
                  <ul>
                    <li>Full-stack web development (frontend + backend basics)</li>
                    <li>Building Progressive Web Apps (PWA)</li>
                    <li>Version control using Git and GitHub</li>
                    <li>API integration and backend logic development</li>
                    <li>Basic AI/automation integration (chatbots, workflows)</li>
                    <li>Facebook/Meta automation systems for business use</li>
                  </ul>
                </div>

                <div className="info-section">
                  <h3>⚙️ Problem-Solving & Systems Thinking</h3>
                  <ul>
                    <li>Strong analytical thinking</li>
                    <li>Ability to design rule-based systems</li>
                    <li>Identifying patterns and inefficiencies in workflows</li>
                    <li>Logical, data-driven approach to decision making</li>
                  </ul>
                </div>

                <div className="info-section">
                  <h3>🚀 Business & Execution</h3>
                  <ul>
                    <li>Building and managing digital projects independently</li>
                    <li>Understanding of revenue-driven systems</li>
                    <li>Entrepreneurial mindset</li>
                    <li>Experience handling real-world constraints and iteration</li>
                  </ul>
                </div>

                <div className="info-section">
                  <h3>🧠 Personal Strengths</h3>
                  <ul>
                    <li>Fast learner with self-taught technical skills</li>
                    <li>High adaptability across tech, trading, and business</li>
                    <li>Strong curiosity and problem exploration</li>
                    <li>Willingness to take initiative and experiment</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {showSuccessSplash && (
            <div className="success-splash" aria-live="polite">
              <div className={`success-splash-card ${splashType}`}>
                <h3>{splashType === "success" ? "Success" : "Failed"}</h3>
                <p>{splashMessage}</p>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default App;
