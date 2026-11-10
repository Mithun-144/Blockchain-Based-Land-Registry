import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Shield,
  FileText,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Building2,
  Users,
  Lock,
  Search,
  Landmark,
  LogIn,
  UserPlus,
  Scale,
  Clock,
} from 'lucide-react';
import { PropChainWordmark } from '../components/PropChainLogo';

const SECTION_IDS = ['hero', 'about', 'how-it-works', 'who-uses'];

const HERO_WORDS = [
  { text: 'Register,', accent: false },
  { text: 'Check,', accent: false },
  { text: 'and', accent: false },
  { text: 'Transfer', accent: false },
  { text: 'Land', accent: false },
  { text: 'Safely', accent: true },
  { text: 'Online', accent: true },
];

const HERO_TYPING_TOKENS = (() => {
  let cursor = 0;
  return HERO_WORDS.map((word, wordIdx) => {
    const chars = Array.from(word.text).map((ch) => ({
      ch,
      index: cursor++,
    }));
    const spaceIndex = wordIdx < HERO_WORDS.length - 1 ? cursor++ : null;
    return { ...word, chars, spaceIndex };
  });
})();

const HERO_HEADING_TEXT = HERO_WORDS.map((w) => w.text).join(' ');
const HERO_CHAR_LIST = HERO_HEADING_TEXT.split('');
const HERO_TOTAL_CHARS = HERO_CHAR_LIST.length;

const FEATURES = [
  {
    icon: Shield,
    color: 'var(--accent)',
    bg: 'var(--accent-light)',
    title: 'Records Cannot Be Changed',
    desc: 'All land records are saved on a blockchain. Once saved, no one can secretly edit, delete, or fake your property papers.',
  },
  {
    icon: Search,
    color: 'var(--green)',
    bg: 'var(--green-light)',
    title: 'Check Before You Buy',
    desc: 'Before buying any land, you can check who the real owner is and see if there is any bank loan or court case on it.',
  },
  {
    icon: FileText,
    color: 'var(--purple)',
    bg: 'var(--purple-light)',
    title: 'No Paper Files Needed',
    desc: 'Do everything online from your computer or phone. No need to carry big paper files or stand in long office queues.',
  },
  {
    icon: Clock,
    color: 'var(--amber)',
    bg: 'var(--amber-light)',
    title: 'Full Land History',
    desc: 'See the full past record of any property — who owned it before, when it was sold, and which offices approved it.',
  },
  {
    icon: Building2,
    color: 'var(--accent)',
    bg: 'var(--accent-light)',
    title: 'Easy Online Transfer',
    desc: 'Buy or sell land step by step on this website. After payment and office approval, you get a digital ownership record.',
  },
  {
    icon: Lock,
    color: 'var(--green)',
    bg: 'var(--green-light)',
    title: 'Stops Land Fraud',
    desc: 'Because citizens, banks, courts, and government offices use the same record, nobody can sell the same land twice.',
  },
];

const STEPS = [
  {
    num: '1',
    title: 'Create Your Account',
    desc: 'Click Sign Up, enter your name, Aadhar number, and email, and confirm with a 6-digit code.',
    tip: 'Takes about 2 minutes with email OTP',
  },
  {
    num: '2',
    title: 'Register Your Land',
    desc: 'Add your land details such as land type, size, address, and ownership documents.',
    tip: 'Works for house, flat, shop, plot, and farm land',
  },
  {
    num: '3',
    title: 'Office Verification',
    desc: 'Local offices and the Sub-Registrar (SRO) check your details and approve the record on blockchain.',
    tip: 'Checked by local office and Sub-Registrar',
  },
  {
    num: '4',
    title: 'Buy, Sell, or View',
    desc: 'Check your properties anytime, put land up for sale, or buy verified land safely online.',
    tip: 'Get your digital ownership record right away',
  },
];

const USER_ROLES = [
  {
    icon: Users,
    color: 'var(--accent)',
    title: 'Citizens',
    desc: 'Manage your personal land and properties easily from one place.',
    tasks: [
      'Register new land and upload papers',
      'List land for sale or buy verified land',
    ],
  },
  {
    icon: Landmark,
    color: 'var(--green)',
    title: 'Sub-Registrar Office (SRO)',
    desc: 'Check documents and give final approval when land is registered or sold.',
    tasks: [
      'Review buyer and seller papers',
      'Approve final ownership transfer',
    ],
  },
  {
    icon: Building2,
    color: 'var(--purple)',
    title: 'Banks',
    desc: 'Check property records for home loans and keep loan details updated.',
    tasks: [
      'Check if land is safe before a loan',
      'Mark loans so land cannot be sold secretly',
    ],
  },
  {
    icon: Scale,
    color: 'var(--red)',
    title: 'Courts (Judiciary)',
    desc: 'Protect disputed properties while a legal case is still running.',
    tasks: [
      'Put a temporary freeze on disputed land',
      'Remove freeze after the court case ends',
    ],
  },
  {
    icon: FileText,
    color: 'var(--amber)',
    title: 'City, Village & Revenue',
    desc: 'Verify local land records across city, village, and farm areas.',
    tasks: [
      'Confirm city (Municipal) and village (Panchayat) plots',
      'Verify farm (Revenue) land details',
    ],
  },
];

export default function LandingPage({ onGoLogin, onGoRegister }) {
  const headerRef = useRef(null);
  const shellRef = useRef(null);
  const ratiosRef = useRef({});
  const rafRef = useRef(null);
  const isRollingRef = useRef(false);
  const rollEndTimeRef = useRef(0);
  const lastWheelAtRef = useRef(0);
  const prevDeltaRef = useRef(0);
  const [activeSection, setActiveSection] = useState('hero');
  const [revealReady, setRevealReady] = useState(false);
  const [useViewFallback, setUseViewFallback] = useState(false);
  const [revealedSections, setRevealedSections] = useState(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    return new Set(SECTION_IDS.includes(hash) ? ['hero', hash] : ['hero']);
  });
  const [inViewSections, setInViewSections] = useState(() => new Set(['hero']));
  const [typingStarted, setTypingStarted] = useState(false);
  const [typedCount, setTypedCount] = useState(() => {
    if (typeof window === 'undefined') return HERO_TOTAL_CHARS;
    return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? HERO_TOTAL_CHARS : 0;
  });

  // Character-by-character typing reveal for main hero heading
  useEffect(() => {
    const mql = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (mql?.matches) {
      setTypedCount(HERO_TOTAL_CHARS);
      setTypingStarted(false);
      return undefined;
    }

    setTypingStarted(true);
    setTypedCount(0);

    let cancelled = false;
    let timerId = null;
    let idx = 0;

    const scheduleNext = (delay) => {
      timerId = window.setTimeout(() => {
        if (cancelled) return;
        idx += 1;
        setTypedCount(idx);
        if (idx < HERO_TOTAL_CHARS) {
          const ch = HERO_CHAR_LIST[idx - 1];
          const nextDelay = ch === ',' ? 190 : ch === ' ' ? 42 : 68;
          scheduleNext(nextDelay);
        }
      }, delay);
    };

    scheduleNext(200);

    const handleMotionChange = (event) => {
      if (event.matches) {
        cancelled = true;
        if (timerId) clearTimeout(timerId);
        setTypedCount(HERO_TOTAL_CHARS);
        setTypingStarted(false);
      }
    };
    mql?.addEventListener?.('change', handleMotionChange);

    return () => {
      cancelled = true;
      if (timerId) clearTimeout(timerId);
      mql?.removeEventListener?.('change', handleMotionChange);
    };
  }, []);

  const getSectionSnapTop = useCallback((id) => {
    if (id === 'top' || id === 'hero') return 0;
    const target = document.getElementById(id);
    if (!target) return 0;
    const headerH = headerRef.current?.offsetHeight || 65;
    return Math.max(0, Math.round(target.getBoundingClientRect().top + window.scrollY - headerH));
  }, []);

  const rollToSection = useCallback(
    (id) => {
      const targetId = id === 'top' ? 'hero' : id;
      const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const targetY = getSectionSnapTop(targetId);

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      if (reduceMotion) {
        document.documentElement.classList.remove('landing-is-rolling');
        isRollingRef.current = false;
        window.scrollTo(0, targetY);
        setActiveSection(targetId);
        return;
      }

      const startY = window.scrollY;
      const delta = targetY - startY;
      if (Math.abs(delta) < 2) {
        document.documentElement.classList.remove('landing-is-rolling');
        isRollingRef.current = false;
        setActiveSection(targetId);
        return;
      }

      const duration = 560;
      const startTime = performance.now();
      isRollingRef.current = true;
      document.documentElement.classList.add('landing-is-rolling');
      setActiveSection(targetId);

      const step = (now) => {
        const elapsed = now - startTime;
        const t = Math.min(1, elapsed / duration);
        // Smooth cubic ease-in-out for a complete, decisive transition between sections
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        window.scrollTo(0, startY + delta * eased);

        if (t < 1) {
          rafRef.current = requestAnimationFrame(step);
        } else {
          window.scrollTo(0, targetY);
          rafRef.current = null;
          isRollingRef.current = false;
          rollEndTimeRef.current = performance.now();
          document.documentElement.classList.remove('landing-is-rolling');
        }
      };

      rafRef.current = requestAnimationFrame(step);
    },
    [getSectionSnapTop]
  );

  // Keep --landing-header-h synced with exact header height so sections fill 100dvh - header cleanly
  useEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const updateHeaderHeight = () => {
      const h = `${header.offsetHeight}px`;
      document.documentElement.style.setProperty('--landing-header-h', h);
      if (shellRef.current) {
        shellRef.current.style.setProperty('--landing-header-h', h);
      }
    };

    updateHeaderHeight();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateHeaderHeight) : null;
    ro?.observe(header);
    window.addEventListener('resize', updateHeaderHeight, { passive: true });

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateHeaderHeight);
      document.documentElement.style.removeProperty('--landing-header-h');
    };
  }, []);

  // Desktop full-section smooth roll controller (prevents getting stuck midway between sections)
  useEffect(() => {
    const isDesktopFullView = () =>
      window.innerWidth >= 960 &&
      window.innerHeight >= 640 &&
      window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches;

    const getNearestSectionIndex = () => {
      const y = window.scrollY;
      let bestIdx = 0;
      let bestDist = Infinity;
      SECTION_IDS.forEach((id, idx) => {
        const dist = Math.abs(y - getSectionSnapTop(id));
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = idx;
        }
      });
      return bestIdx;
    };

    const canSectionScrollFurther = (id, dir) => {
      const el = document.getElementById(id);
      if (!el) return false;
      const headerH = headerRef.current?.offsetHeight || 65;
      const viewportH = window.innerHeight - headerH;
      if (el.scrollHeight <= viewportH + 16) return false;
      const rect = el.getBoundingClientRect();
      if (dir > 0 && rect.bottom > window.innerHeight + 12) return true;
      if (dir < 0 && rect.top < headerH - 12) return true;
      return false;
    };

    const resolveTargetIndex = (currentIdx, dir) => {
      const currentSnapTop = getSectionSnapTop(SECTION_IDS[currentIdx]);
      if (dir > 0 && window.scrollY < currentSnapTop - 24) return currentIdx;
      if (dir < 0 && window.scrollY > currentSnapTop + 24) return currentIdx;
      return Math.max(0, Math.min(SECTION_IDS.length - 1, currentIdx + dir));
    };

    const handleWheel = (e) => {
      if (!isDesktopFullView()) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey) return;
      const absY = Math.abs(e.deltaY);
      if (absY < 4 || Math.abs(e.deltaX) > absY) return;

      const now = performance.now();
      const sinceLast = now - lastWheelAtRef.current;
      const sinceRollEnd = now - rollEndTimeRef.current;
      lastWheelAtRef.current = now;

      if (isRollingRef.current) {
        e.preventDefault();
        prevDeltaRef.current = absY;
        return;
      }

      // Suppress decaying trackpad inertia tail right after a section roll completes
      const isInertiaTail = sinceRollEnd < 260 && sinceLast < 120 && absY <= prevDeltaRef.current * 1.35;
      prevDeltaRef.current = absY;
      if (isInertiaTail) {
        e.preventDefault();
        return;
      }

      const dir = e.deltaY > 0 ? 1 : -1;
      const currentIdx = getNearestSectionIndex();
      const currentId = SECTION_IDS[currentIdx];

      if (canSectionScrollFurther(currentId, dir)) return;

      const nextIdx = resolveTargetIndex(currentIdx, dir);
      if (nextIdx === currentIdx && Math.abs(window.scrollY - getSectionSnapTop(currentId)) <= 24) {
        return;
      }

      e.preventDefault();
      rollToSection(SECTION_IDS[nextIdx]);
    };

    const handleKeyDown = (e) => {
      if (!isDesktopFullView()) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (!['PageDown', 'PageUp', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;

      const target = e.target;
      const isNeutralFocus =
        target === document.body ||
        target === document.documentElement ||
        target?.id === 'main-content' ||
        SECTION_IDS.includes(target?.id);
      if (!isNeutralFocus) return;

      const dir = e.key === 'PageDown' || e.key === 'ArrowDown' ? 1 : -1;
      const currentIdx = getNearestSectionIndex();
      const currentId = SECTION_IDS[currentIdx];

      if (canSectionScrollFurther(currentId, dir)) return;

      const nextIdx = resolveTargetIndex(currentIdx, dir);
      if (nextIdx === currentIdx && Math.abs(window.scrollY - getSectionSnapTop(currentId)) <= 24) {
        return;
      }

      e.preventDefault();
      rollToSection(SECTION_IDS[nextIdx]);
    };

    const handleScrollEnd = () => {
      if (!isDesktopFullView() || isRollingRef.current) return;
      if (performance.now() - rollEndTimeRef.current < 160) return;
      const nearestIdx = getNearestSectionIndex();
      const nearestId = SECTION_IDS[nearestIdx];
      const el = document.getElementById(nearestId);
      const headerH = headerRef.current?.offsetHeight || 65;
      if (!el || el.scrollHeight > window.innerHeight - headerH + 16) return;
      const snapTop = getSectionSnapTop(nearestId);
      if (Math.abs(window.scrollY - snapTop) > 4) {
        rollToSection(nearestId);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    const hasScrollEnd = 'onscrollend' in window;
    if (hasScrollEnd) {
      window.addEventListener('scrollend', handleScrollEnd);
    }

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      if (hasScrollEnd) {
        window.removeEventListener('scrollend', handleScrollEnd);
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      document.documentElement.classList.remove('landing-is-rolling');
    };
  }, [getSectionSnapTop, rollToSection]);

  // Track active section (sync nav indicator) and light entrance animations
  useEffect(() => {
    const noReducedMotion = window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches;
    const supportsViewTimeline =
      typeof CSS !== 'undefined' &&
      CSS.supports?.('(animation-timeline: view()) and (animation-range: entry)');

    if (noReducedMotion) {
      setRevealReady(true);
      setUseViewFallback(!supportsViewTimeline);
    }

    const sectionEls = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    if (!sectionEls.length) return undefined;

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          ratiosRef.current[entry.target.id] = entry.isIntersecting ? entry.intersectionRatio : 0;
        });
        let bestId = null;
        let bestRatio = 0;
        for (const id of SECTION_IDS) {
          const ratio = ratiosRef.current[id] || 0;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestId = id;
          }
        }
        if (bestId && !isRollingRef.current) setActiveSection(bestId);
      },
      {
        rootMargin: '-28% 0px -42% 0px',
        threshold: [0, 0.15, 0.35, 0.6, 0.85],
      }
    );

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.id;
          if (entry.isIntersecting) {
            setRevealedSections((prev) => {
              if (prev.has(id)) return prev;
              const next = new Set(prev);
              next.add(id);
              return next;
            });
            setInViewSections((prev) => {
              if (prev.has(id)) return prev;
              const next = new Set(prev);
              next.add(id);
              return next;
            });
          } else {
            setInViewSections((prev) => {
              if (!prev.has(id)) return prev;
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.01 }
    );

    sectionEls.forEach((el) => {
      activeObserver.observe(el);
      revealObserver.observe(el);
    });

    const handleSnapChange = (event) => {
      const snapped = event.snapTargetBlock;
      if (snapped?.id && SECTION_IDS.includes(snapped.id) && !isRollingRef.current) {
        setActiveSection(snapped.id);
      }
    };
    const hasSnapEvent = 'onscrollsnapchange' in HTMLElement.prototype;
    if (hasSnapEvent) {
      document.addEventListener('scrollsnapchange', handleSnapChange);
    }

    return () => {
      activeObserver.disconnect();
      revealObserver.disconnect();
      if (hasSnapEvent) {
        document.removeEventListener('scrollsnapchange', handleSnapChange);
      }
    };
  }, []);

  const scrollToSection = (e, id) => {
    e.preventDefault();
    rollToSection(id);
  };

  const getSectionClass = (id) => {
    const classes = ['landing-section'];
    if (revealedSections.has(id)) classes.push('is-revealed');
    if (inViewSections.has(id)) classes.push('is-in-view');
    return classes.join(' ');
  };

  return (
    <div
      id="top"
      ref={shellRef}
      className={`landing-shell${revealReady ? ' is-reveal-ready' : ''}${useViewFallback ? ' is-view-fallback' : ''
        }`}
    >
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* ─── Header ─── */}
      <header ref={headerRef} className="landing-header">
        <div className="landing-header-inner">
          <a
            href="#top"
            className="landing-brand-link"
            onClick={(e) => scrollToSection(e, 'top')}
          >
            <PropChainWordmark markSize={32} showSubtitle={false} />
          </a>

          <nav aria-label="Primary" className="landing-nav">
            <ul className="landing-nav-list">
              <li>
                <a
                  href="#about"
                  className={`landing-nav-link${activeSection === 'about' ? ' is-active' : ''}`}
                  aria-current={activeSection === 'about' ? 'location' : undefined}
                  onClick={(e) => scrollToSection(e, 'about')}
                >
                  About Website
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className={`landing-nav-link${activeSection === 'how-it-works' ? ' is-active' : ''}`}
                  aria-current={activeSection === 'how-it-works' ? 'location' : undefined}
                  onClick={(e) => scrollToSection(e, 'how-it-works')}
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="#who-uses"
                  className={`landing-nav-link${activeSection === 'who-uses' ? ' is-active' : ''}`}
                  aria-current={activeSection === 'who-uses' ? 'location' : undefined}
                  onClick={(e) => scrollToSection(e, 'who-uses')}
                >
                  Who Uses It
                </a>
              </li>
            </ul>
          </nav>

          <div className="landing-header-actions">
            <button type="button" className="btn btn-ghost" onClick={onGoLogin}>
              <LogIn size={16} aria-hidden="true" />
              <span>Log In</span>
            </button>
            <button type="button" className="btn btn-primary" onClick={onGoRegister}>
              <UserPlus size={16} aria-hidden="true" />
              <span>Sign Up</span>
            </button>
          </div>
        </div>
        <div className="landing-scroll-progress" aria-hidden="true" />
      </header>

      {/* ─── Main Content ─── */}
      <main id="main-content" tabIndex={-1}>
        {/* ─── Hero Section ─── */}
        <section id="hero" tabIndex={-1} className="landing-hero">
          <div className="landing-hero-inner">
            <div className="landing-hero-core">
              <div className="landing-pill landing-hero-stagger" style={{ '--stagger': 0 }}>
                <Shield size={14} aria-hidden="true" />
                <span>Online Land Registry on Blockchain</span>
              </div>

              <h1
                className={`landing-hero-title${typingStarted ? ' is-typing' : ''}`}
                aria-label={HERO_HEADING_TEXT}
              >
                <span aria-hidden="true">
                  {typingStarted && typedCount === 0 && (
                    <span className="landing-type-caret" />
                  )}
                  {HERO_TYPING_TOKENS.map(({ text, accent, chars, spaceIndex }, wordIdx) => (
                    <React.Fragment key={`${text}-${wordIdx}`}>
                      <span className={`landing-title-word-group${accent ? ' is-accent' : ''}`}>
                        {chars.map(({ ch, index }) => (
                          <React.Fragment key={index}>
                            <span
                              className={`landing-title-char${!typingStarted || typedCount > index ? ' is-typed' : ''
                                }`}
                            >
                              {ch}
                            </span>
                            {typingStarted && typedCount - 1 === index && (
                              <span
                                className={`landing-type-caret${typedCount >= HERO_TOTAL_CHARS ? ' is-done' : ''
                                  }`}
                              />
                            )}
                          </React.Fragment>
                        ))}
                      </span>
                      {spaceIndex !== null && (
                        <>
                          <span
                            className={`landing-title-char${!typingStarted || typedCount > spaceIndex ? ' is-typed' : ''
                              }`}
                          >
                            {' '}
                          </span>
                          {typingStarted && typedCount - 1 === spaceIndex && (
                            <span className="landing-type-caret" />
                          )}
                        </>
                      )}
                    </React.Fragment>
                  ))}
                </span>
              </h1>

              <p className="landing-hero-text landing-hero-stagger" style={{ '--stagger': 5 }}>
                PropChain is a digital land registry website. It keeps all land
                records on a blockchain — a safe digital record book that no one
                can change or fake. Citizens, banks, and government offices can
                register, check, and transfer property easily without paper files.
              </p>

              <div className="landing-hero-cta landing-hero-stagger" style={{ '--stagger': 7 }}>
                <button
                  type="button"
                  className="btn btn-primary btn-lg"
                  onClick={onGoRegister}
                >
                  <UserPlus size={18} aria-hidden="true" />
                  <span>Sign Up — Create Account</span>
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-lg"
                  onClick={onGoLogin}
                >
                  <LogIn size={18} aria-hidden="true" />
                  <span>Log In</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>

              <ul role="list" className="landing-trust-list landing-hero-stagger" style={{ '--stagger': 8 }}>
                <li className="landing-trust-item">
                  <CheckCircle2 size={16} color="var(--green)" aria-hidden="true" />
                  <span>Safe from Fake Papers</span>
                </li>
                <li className="landing-trust-item">
                  <CheckCircle2 size={16} color="var(--green)" aria-hidden="true" />
                  <span>No Office Queues</span>
                </li>
                <li className="landing-trust-item">
                  <CheckCircle2 size={16} color="var(--green)" aria-hidden="true" />
                  <span>Clear Ownership History</span>
                </li>
              </ul>
            </div>

            <div className="landing-hero-scroll landing-hero-stagger" style={{ '--stagger': 9 }}>
              <a
                href="#about"
                className="landing-scroll-link"
                onClick={(e) => scrollToSection(e, 'about')}
              >
                <span>About the Website</span>
                <ArrowDown size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* ─── About the Website ─── */}
        <section id="about" tabIndex={-1} className={getSectionClass('about')}>
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <span className="landing-section-kicker">Why Use PropChain</span>
              <h2>About PropChain</h2>
              <p>
                This website helps you manage land and property online in a
                simple, honest, and safe way. Here is what you can do here:
              </p>
            </div>

            <ul role="list" className="landing-grid-3">
              {FEATURES.map(({ icon: Icon, color, bg, title, desc }, idx) => (
                <li key={title} className="landing-stagger-item" style={{ '--stagger': idx }}>
                  <div className="landing-feature-card">
                    <div className="landing-icon-box" style={{ background: bg }}>
                      <Icon size={21} color={color} aria-hidden="true" />
                    </div>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="landing-section-footer">
              <a
                href="#how-it-works"
                className="landing-scroll-link"
                onClick={(e) => scrollToSection(e, 'how-it-works')}
              >
                <span>How It Works</span>
                <ArrowDown size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section id="how-it-works" tabIndex={-1} className={getSectionClass('how-it-works')}>
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <span className="landing-section-kicker">Simple 4-Step Process</span>
              <h2>How It Works</h2>
              <p>
                Using PropChain is easy. Follow these four simple steps to
                register, verify, and transfer land online.
              </p>
            </div>

            <ol role="list" className="landing-steps-grid">
              {STEPS.map(({ num, title, desc, tip }, idx) => (
                <li key={num} className="landing-stagger-item" style={{ '--stagger': idx }}>
                  <div className="landing-step-card">
                    <div className="landing-step-top">
                      <div className="landing-step-num" aria-hidden="true">
                        {num}
                      </div>
                      <div>
                        <div className="landing-step-label">Step {num}</div>
                        <h3>{title}</h3>
                      </div>
                    </div>
                    <p>{desc}</p>
                    <div className="landing-step-tip">
                      <CheckCircle2 size={16} color="var(--green)" aria-hidden="true" />
                      <span>{tip}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            <div className="landing-section-footer">
              <a
                href="#who-uses"
                className="landing-scroll-link"
                onClick={(e) => scrollToSection(e, 'who-uses')}
              >
                <span>See Who Can Use This Website</span>
                <ArrowDown size={14} aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        {/* ─── Who Can Use PropChain ─── */}
        <section id="who-uses" tabIndex={-1} className={getSectionClass('who-uses')}>
          <div className="landing-section-inner">
            <div className="landing-section-head">
              <span className="landing-section-kicker">Built for Citizens &amp; Offices</span>
              <h2>Who Can Use This Website?</h2>
              <p>
                PropChain gives each user group its own simple dashboard so
                everyone checks and updates the same trusted land record.
              </p>
            </div>

            <ul role="list" className="landing-roles-grid">
              {USER_ROLES.map(({ icon: Icon, color, title, desc, tasks }, idx) => (
                <li key={title} className="landing-stagger-item" style={{ '--stagger': idx }}>
                  <div className="landing-role-card">
                    <div className="landing-role-head">
                      <div className="landing-role-icon">
                        <Icon size={21} color={color} aria-hidden="true" />
                      </div>
                      <h3>{title}</h3>
                    </div>
                    <p>{desc}</p>
                    <ul role="list" className="landing-role-tasks">
                      {tasks.map((task) => (
                        <li key={task}>
                          <CheckCircle2 size={14} color="var(--green)" aria-hidden="true" />
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ul>

            <div className="landing-note-banner">
              <div>
                <strong>Ready to start?</strong> Citizens can create an account
                with <strong>Sign Up</strong>. Bank, Court, and Government
                officers can <strong>Log In</strong> with their official email.
              </div>
              <div className="landing-note-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={onGoLogin}>
                  <LogIn size={14} aria-hidden="true" />
                  <span>Log In</span>
                </button>
                <button type="button" className="btn btn-primary btn-sm" onClick={onGoRegister}>
                  <UserPlus size={14} aria-hidden="true" />
                  <span>Sign Up</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
