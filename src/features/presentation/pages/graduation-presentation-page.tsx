import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollToPlugin);

type SlideKind =
  | 'scope'
  | 'problem'
  | 'constraints'
  | 'roles'
  | 'journey'
  | 'trust'
  | 'pipeline'
  | 'architecture'
  | 'evidence'
  | 'launch'
  | 'final';

type Slide = {
  kind: SlideKind;
  eyebrow: string;
  title: string;
  copy: string;
  proof: string;
  visualTitle: string;
  items: string[];
};

const slides: Slide[] = [
  {
    kind: 'scope',
    eyebrow: 'Graduation project',
    title: 'Hand Connect is a home services discovery product.',
    copy: 'It helps customers find nearby service providers fast.',
    proof: 'Focus: product and how it was built',
    visualTitle: 'What it is for',
    items: ['Customer need', 'Profession', 'Nearby provider', 'Direct contact'],
  },
  {
    kind: 'scope',
    eyebrow: 'Project brief',
    title: 'The first version focuses on four professions in Cairo.',
    copy: 'Plumbers, electricians, carpenters, and cleaning providers are enough to prove the discovery model without spreading the product too thin.',
    proof: 'Cairo only / four professions / nearby discovery',
    visualTitle: 'Initial service map',
    items: ['Plumbers', 'Electricians', 'Carpenters', 'Cleaning providers'],
  },
  {
    kind: 'problem',
    eyebrow: 'Why it exists',
    title: 'Finding reliable home service providers is still slow, fragmented, and stressful.',
    copy: 'People usually depend on referrals, Facebook posts, WhatsApp groups, or outdated phone numbers. The product exists to make this process faster, clearer, and more trustworthy.',
    proof: 'From informal search to clear provider discovery',
    visualTitle: 'Old path to new path',
    items: ['Referral', 'Facebook post', 'WhatsApp group', 'Old phone number', 'Unverified provider'],
  },
  {
    kind: 'constraints',
    eyebrow: 'Business rules',
    title: 'The constraints are the product strategy.',
    copy: 'The product avoided marketplace complexity on purpose: direct contact only, no customer payments, no guarantees, and no provider shown publicly before approval.',
    proof: 'Rules changed screens, ranking, reviews, paid visibility, and admin controls',
    visualTitle: 'Decision matrix',
    items: ['Cairo only', 'Four professions', 'Direct contact only', 'No payments', 'Verified before public'],
  },
  {
    kind: 'constraints',
    eyebrow: 'Product direction',
    title: 'The most important features are also the features that were rejected.',
    copy: 'No platform-managed visits, held funds, platform fees, work allocation, work status system, skill guarantees, or expansion beyond Cairo in v1. The product stays a directory.',
    proof: 'Out of scope is enforced by docs, route shape, and product-boundary tests',
    visualTitle: 'Boundary line',
    items: ['In: search', 'In: profiles', 'In: chat', 'Out: managed visits', 'Out: payments', 'Out: dispatch'],
  },
  {
    kind: 'roles',
    eyebrow: 'Live demo',
    title: 'The demo is a three-role system, not one linear app tour.',
    copy: 'Customers search and contact. Providers operate approved profiles. Admins control verification, reports, professions, visibility, and audit logs.',
    proof: 'Route guards: customer, provider, admin',
    visualTitle: 'Role map',
    items: ['Customer: discover and contact', 'Provider: profile and visibility', 'Admin: approval and moderation'],
  },
  {
    kind: 'journey',
    eyebrow: 'Customer demo',
    title: 'The customer path is built around one conversion: reaching a provider.',
    copy: 'Search filters profession and neighborhood, results show approved providers, profile actions require login, and reviews are only allowed after a recorded contact.',
    proof: 'Services: searchProviders, startConversation, revealWhatsApp, canCustomerReviewProvider',
    visualTitle: 'Need to contact',
    items: ['Need', 'Profession', 'Neighborhood', 'Approved results', 'Profile', 'Chat or WhatsApp', 'Review after contact'],
  },
  {
    kind: 'journey',
    eyebrow: 'Provider demo',
    title: 'A provider is not public until verification is complete.',
    copy: 'Registration creates a pending provider, identity evidence is reviewed, approved providers get dashboard/profile/visibility routes, and metrics come from contacts, messages, views, and reviews.',
    proof: 'Provider guard redirects unapproved accounts to /pending',
    visualTitle: 'Provider activation',
    items: ['Register', 'Identity document', 'Pending', 'Admin approval', 'Profile edit', 'Dashboard metrics', 'Visibility request'],
  },
  {
    kind: 'trust',
    eyebrow: 'Admin demo',
    title: 'Trust is implemented as an admin workflow with audit trails.',
    copy: 'Admin routes cover applications, providers, professions, visibility requests, reports, and action logs. Sensitive mutations are backed by rules and callable/server paths where required.',
    proof: 'Admin routes: applications, providers, professions, visibility, reports, actions',
    visualTitle: 'Control loop',
    items: ['Review identity', 'Approve or reject', 'Moderate reports', 'Suspend or ban', 'Write audit row'],
  },
  {
    kind: 'pipeline',
    eyebrow: 'How it was built',
    title: 'The build process turned ambiguity into implementation checkpoints.',
    copy: 'The work moved through PRD, SRS, tech decisions, sitemap, design and motion system, implementation tracker, QA, hardening, and release readiness.',
    proof: 'Tracker milestones M0-M8 are marked verified',
    visualTitle: 'Build pipeline',
    items: ['Business context', 'PRD', 'SRS', 'Tech decisions', 'Sitemap', 'Design + motion', 'Implementation tracker', 'Release gate'],
  },
  {
    kind: 'pipeline',
    eyebrow: 'PRD',
    title: 'The PRD turned the idea into requirements and boundaries.',
    copy: 'It clarified users, journeys, functional requirements, non-functional requirements, acceptance criteria, and what must stay outside v1.',
    proof: 'Feature list has 14 feature areas plus explicit out-of-scope boundaries',
    visualTitle: 'PRD contents',
    items: ['Users', 'Journeys', 'Functional requirements', 'NFRs', 'Acceptance criteria', 'Out of scope'],
  },
  {
    kind: 'evidence',
    eyebrow: 'SRS',
    title: 'The SRS audit shows what exists and what still needs hardening.',
    copy: 'The implementation map audited 56 groups: 20 implemented, 36 partially implemented, and 0 not implemented. That is a real product with remaining launch-grade hardening work.',
    proof: 'SRS implementation map, 56 audited groups',
    visualTitle: 'Audit status',
    items: ['Implemented: 20', 'Partially implemented: 36', 'Not implemented: 0', 'Total audited groups: 56'],
  },
  {
    kind: 'architecture',
    eyebrow: 'Technology decisions',
    title: 'The stack matches the product shape: fast app, controlled backend, strict rules.',
    copy: 'The app is Vite + React Router + TanStack Query on the frontend, service contracts in the middle, Firebase Auth/Firestore/Storage/Functions underneath, and Vercel for web/API deployment.',
    proof: 'Sources: app-router, service contracts, firebase app, deployment.md, vercel.json',
    visualTitle: 'System stack',
    items: ['React + Vite', 'React Router guards', 'Service contracts', 'Firebase Auth', 'Firestore + Storage', 'Cloud Functions', 'Vercel API/routes'],
  },
  {
    kind: 'architecture',
    eyebrow: 'Sitemap',
    title: 'The route tree proves the product architecture.',
    copy: 'Public discovery, authenticated messages, customer-only reviews, approved-provider workspace, and admin-only operations are separated at the router level.',
    proof: 'Route source of truth: src/router/app-router.tsx',
    visualTitle: 'Route tree',
    items: ['Public: /search, /providers/:id', 'Auth: /login, /register', 'Customer: /reviews/new/:providerId', 'Provider: dashboard/profile/visibility', 'Admin: six operational tabs'],
  },
  {
    kind: 'pipeline',
    eyebrow: 'Design and motion',
    title: 'The design system is warm because the task is stressful.',
    copy: 'Herafy uses Cairo-first Arabic typography, warm paper surfaces, orange action color, soft list rows, clear cards, and reduced-motion fallbacks so search and trust actions stay calm.',
    proof: 'Sources: DESIGN.md, globals.css, motion.md',
    visualTitle: 'Interface language',
    items: ['Warm paper', 'Herafy orange', 'Cairo typography', 'Rounded trust cards', 'Mobile-first nav', 'Reduced motion'],
  },
  {
    kind: 'roles',
    eyebrow: 'UI design',
    title: 'The UI covers product surfaces, not decorative pages.',
    copy: 'The current page set includes landing, search, provider profile, auth, chat, review submission, provider dashboard, profile editing, visibility, and admin operations.',
    proof: 'Design goal: help users reach contact as fast as possible',
    visualTitle: 'Screen families',
    items: ['Discovery', 'Contact', 'Provider ops', 'Admin trust', 'Moderation', 'Release'],
  },
  {
    kind: 'pipeline',
    eyebrow: 'Implementation plan',
    title: 'The tracker made progress measurable.',
    copy: 'The v1 tracker records decisions, tasks, dependencies, verification proof, notes, and milestones. It includes release gates and evidence, not just a checklist.',
    proof: 'Milestones M0-M8 verified in hand-connect-v1-completion-tracker.md',
    visualTitle: 'Tracker proof',
    items: ['Product decisions', 'Task IDs', 'Dependencies', 'Verification proof', 'Milestones', 'Release gate'],
  },
  {
    kind: 'evidence',
    eyebrow: 'Polish and hardening',
    title: 'The release gate is a technical argument, not a claim.',
    copy: 'The documented gate runs lint, Vitest, Firestore rules tests, production build, and Playwright E2E. The tracker records E2E smoke as 11 passed with 1 expected mobile-only skip.',
    proof: 'release:check, test:rules, build, e2e',
    visualTitle: 'Quality gates',
    items: ['ESLint', 'Vitest', 'Firestore rules', 'Vite build', 'Playwright E2E', 'Operations docs'],
  },
  {
    kind: 'launch',
    eyebrow: 'Go live',
    title: 'The launch stack separates web delivery from backend trust systems.',
    copy: 'Vercel serves the Vite app and API routes with SPA fallback. Firebase remains Auth, Firestore, Storage, Functions, rules, and indexes. Capacitor wraps the dist build as Herafy for iOS beta readiness.',
    proof: 'vercel.json, deployment.md, capacitor.config.ts',
    visualTitle: 'Launch stack',
    items: ['Vercel app', 'Vercel API', 'Cloudflare domain', 'Firebase backend', 'Firebase rules', 'Capacitor iOS wrapper'],
  },
  {
    kind: 'final',
    eyebrow: 'Final message',
    title: 'The graduation project is the product-building process.',
    copy: 'A messy market problem became business rules, requirements, a routed product, service contracts, Firebase-backed trust controls, release gates, and a beta-ready launch path.',
    proof: 'Idea to launch, with implementation evidence',
    visualTitle: 'End-to-end proof',
    items: ['Problem', 'Rules', 'Requirements', 'Architecture', 'UI', 'Implementation', 'Verification', 'Launch'],
  },
];

const flowKinds = new Set<SlideKind>(['journey', 'pipeline', 'final']);
const gridKinds = new Set<SlideKind>(['scope', 'constraints', 'roles']);

export function GraduationPresentationPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const firstSlideRef = useRef<HTMLElement | null>(null);
  const activeSlideRef = useRef(0);
  const wheelDeltaRef = useRef(0);
  const wheelLockedUntilRef = useRef(0);
  const wheelResetTimeoutRef = useRef<number | null>(null);
  const unlockTimeoutRef = useRef<number | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const isScrollingRef = useRef(false);

  const slideCountLabel = useMemo(
    () => String(slides.length).padStart(2, '0'),
    [],
  );

  useEffect(() => {
    activeSlideRef.current = activeSlide;
  }, [activeSlide]);

  const goToSlide = useCallback((index: number) => {
    const root = containerRef.current;
    const currentIndex = activeSlideRef.current;
    const boundedIndex = Math.min(Math.max(index, 0), slides.length - 1);
    const nextSlide = slideRefs.current[boundedIndex];
    if (!root || !nextSlide || isScrollingRef.current || boundedIndex === currentIndex) return;

    const scrollRoot = root;
    const currentSlide = slideRefs.current[currentIndex];
    const direction = boundedIndex > currentIndex ? 1 : -1;
    const targetScrollTop = nextSlide.offsetTop;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const currentContent = currentSlide?.querySelector('[data-slide-content]');
    const nextContent = nextSlide.querySelector('[data-slide-content]');

    isScrollingRef.current = true;
    wheelDeltaRef.current = 0;
    wheelLockedUntilRef.current = Date.now() + 1_100;
    scrollRoot.style.scrollSnapType = 'none';

    if (reduceMotion) {
      scrollRoot.scrollTop = targetScrollTop;
      scrollRoot.style.scrollSnapType = '';
      activeSlideRef.current = boundedIndex;
      setActiveSlide(boundedIndex);
      isScrollingRef.current = false;
      return;
    }

    gsap.killTweensOf(scrollRoot);
    gsap.killTweensOf([currentContent, nextContent]);

    function finishTransition() {
      activeSlideRef.current = boundedIndex;
      setActiveSlide(boundedIndex);
      scrollRoot.scrollTop = targetScrollTop;
      scrollRoot.style.scrollSnapType = '';

      if (currentContent) gsap.set(currentContent, { autoAlpha: 1, y: 0 });
      if (nextContent) {
        gsap.to(nextContent, {
          autoAlpha: 1,
          duration: 0.3,
          ease: 'expo.out',
          overwrite: true,
          y: 0,
        });
      }

      if (unlockTimeoutRef.current) window.clearTimeout(unlockTimeoutRef.current);
      unlockTimeoutRef.current = window.setTimeout(() => {
        isScrollingRef.current = false;
        wheelLockedUntilRef.current = Date.now() + 420;
        unlockTimeoutRef.current = null;
      }, 140);
    }

    if (currentContent && currentSlide !== nextSlide) {
      gsap.to(currentContent, {
        autoAlpha: 0.72,
        duration: 0.18,
        ease: 'power2.out',
        y: direction * -10,
      });
    }

    if (nextContent) {
      gsap.set(nextContent, { autoAlpha: 0.84, y: direction * 14 });
    }

    gsap.to(scrollRoot, {
      duration: 0.82,
      ease: 'power2.inOut',
      overwrite: true,
      scrollTo: { y: targetScrollTop, autoKill: false },
      onComplete: finishTransition,
      onInterrupt: finishTransition,
    });
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (isScrollingRef.current || !visible) return;
        const index = Number(visible.target.getAttribute('data-slide-index'));
        activeSlideRef.current = index;
        setActiveSlide(index);
      },
      { root, threshold: [0.58, 0.75] },
    );

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = firstSlideRef.current;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!root || reduceMotion) return;

    const context = gsap.context(() => {
      gsap
        .timeline({ defaults: { duration: 0.72, ease: 'expo.out' } })
        .from('[data-hero-mark]', {
          autoAlpha: 0,
          scaleX: 0.18,
          transformOrigin: 'left center',
        })
        .from('[data-hero-kicker]', { autoAlpha: 0, y: 18 }, '-=0.48')
        .from('[data-hero-title]', { autoAlpha: 0, y: 34 }, '-=0.44')
        .from('[data-hero-copy]', { autoAlpha: 0, y: 20 }, '-=0.48')
        .from('[data-hero-chip]', { autoAlpha: 0, y: 12, stagger: 0.08 }, '-=0.32');
    }, root);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    function onWheel(event: WheelEvent) {
      event.preventDefault();

      if (isScrollingRef.current || Date.now() < wheelLockedUntilRef.current) {
        wheelDeltaRef.current = 0;
        return;
      }

      wheelDeltaRef.current += event.deltaY;
      if (wheelResetTimeoutRef.current) window.clearTimeout(wheelResetTimeoutRef.current);
      wheelResetTimeoutRef.current = window.setTimeout(() => {
        wheelDeltaRef.current = 0;
        wheelResetTimeoutRef.current = null;
      }, 140);

      if (Math.abs(wheelDeltaRef.current) < 90) return;
      const direction = wheelDeltaRef.current > 0 ? 1 : -1;
      wheelDeltaRef.current = 0;
      goToSlide(activeSlideRef.current + direction);
    }

    function onKeyDown(event: KeyboardEvent) {
      const nextKeys = ['ArrowDown', 'PageDown', ' '];
      const previousKeys = ['ArrowUp', 'PageUp'];
      if (![...nextKeys, ...previousKeys, 'Home', 'End'].includes(event.key)) return;

      event.preventDefault();
      if (nextKeys.includes(event.key)) goToSlide(activeSlideRef.current + 1);
      if (previousKeys.includes(event.key)) goToSlide(activeSlideRef.current - 1);
      if (event.key === 'Home') goToSlide(0);
      if (event.key === 'End') goToSlide(slides.length - 1);
    }

    root.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      root.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      if (wheelResetTimeoutRef.current) window.clearTimeout(wheelResetTimeoutRef.current);
    };
  }, [goToSlide]);

  return (
    <main
      ref={containerRef}
      dir="ltr"
      className="h-screen snap-y snap-mandatory overflow-y-auto overflow-x-hidden bg-background text-foreground"
    >
      <div className="pointer-events-none fixed inset-x-0 top-0 z-30 border-b border-border/70 bg-background/86 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="brand-title text-2xl sm:text-3xl">Herafy</p>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Product build presentation
            </p>
          </div>
          <p className="font-latin text-sm font-extrabold text-muted-foreground">
            {String(activeSlide + 1).padStart(2, '0')} / {slideCountLabel}
          </p>
        </div>
        <div className="h-1 bg-[color:var(--hc-rule)]">
          <div
            className="h-full origin-left bg-primary transition-transform duration-500 ease-out"
            style={{ transform: `scaleX(${(activeSlide + 1) / slides.length})` }}
          />
        </div>
      </div>

      {slides.map((slide, index) => (
        <section
          key={`${slide.eyebrow}-${slide.title}`}
          ref={(element) => {
            slideRefs.current[index] = element;
            if (index === 0) firstSlideRef.current = element;
          }}
          data-slide-index={index}
          className="relative grid min-h-screen snap-start snap-always overflow-hidden px-4 pb-8 pt-28 sm:px-6 lg:px-8"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_86%_14%,color-mix(in_oklch,var(--hc-orange)_10%,transparent),transparent_30%),radial-gradient(circle_at_8%_84%,color-mix(in_oklch,var(--hc-orange-soft)_14%,transparent),transparent_30%)]" />
          {index === 0 ? (
            <OpeningSlide />
          ) : index === 1 ? (
            <FocusSlide slide={slide} />
          ) : index === 2 ? (
            <ProblemSlide slide={slide} />
          ) : (
            <DeckSlide slide={slide} />
          )}
        </section>
      ))}

      <div className="fixed bottom-4 right-4 z-30 hidden gap-2 sm:flex">
        <Button
          aria-label="Previous slide"
          className="h-11 w-11 rounded-full p-0"
          size="sm"
          variant="outline"
          disabled={activeSlide === 0}
          onClick={() => goToSlide(activeSlideRef.current - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          aria-label="Next slide"
          className="h-11 w-11 rounded-full p-0"
          size="sm"
          disabled={activeSlide === slides.length - 1}
          onClick={() => goToSlide(activeSlideRef.current + 1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </main>
  );
}

function OpeningSlide() {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <div className="space-y-7">
          <div data-hero-mark className="h-2 w-24 rounded-full bg-primary" />
          <p data-hero-kicker className="text-sm font-black uppercase tracking-[0.24em] text-primary">
            Graduation project
          </p>
          <h1 data-hero-title className="brand-title max-w-[11ch] text-[clamp(4.8rem,15vw,12rem)] leading-[0.78] tracking-[-0.07em]">
            Herafy
          </h1>
          <p data-hero-copy className="max-w-2xl text-[clamp(1.15rem,2.2vw,1.95rem)] font-black leading-[1.32] text-foreground">
            Hand Connect is a home services discovery product.
          </p>
        </div>

        <div className="relative min-h-[520px]">
          <div className="absolute left-1/2 top-1/2 grid h-52 w-52 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary text-center text-primary-foreground shadow-[0_34px_90px_rgba(242,111,54,0.24)]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">Purpose</p>
              <p className="mt-2 text-2xl font-black leading-tight">Find nearby providers fast</p>
            </div>
          </div>

          {[
            ['Customer need', 'left-2 top-8'],
            ['Profession', 'right-10 top-12'],
            ['Location', 'left-12 bottom-16'],
            ['Provider profile', 'right-0 bottom-24'],
            ['Direct contact', 'left-1/2 top-0 -translate-x-1/2'],
          ].map(([label, position]) => (
            <div
              key={label}
              data-hero-chip
              className={`soft-list-item absolute ${position} w-44 px-4 py-3 text-center text-sm font-black`}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FocusSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] grid-rows-[auto_1fr] gap-8">
        <header className="max-w-4xl">
          <p className="section-label">{slide.eyebrow}</p>
          <h1 className="mt-4 text-[clamp(2.6rem,6vw,5.6rem)] font-black leading-[0.95] tracking-[-0.045em] text-foreground">
            {slide.title}
          </h1>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr] lg:items-stretch">
          <div className="brand-panel grid content-between p-6">
            <div>
              <p className="section-label">Launch geography</p>
              <p className="mt-5 brand-title text-[clamp(4rem,12vw,9rem)] leading-none">Cairo</p>
            </div>
            <p className="max-w-md text-lg font-bold leading-8 text-muted-foreground">
              {slide.copy}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {slide.items.map((item, index) => (
              <div
                key={item}
                className="soft-list-item grid min-h-44 content-between p-5"
              >
                <p className="brand-number text-5xl">{String(index + 1).padStart(2, '0')}</p>
                <p className="text-2xl font-black leading-tight text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProblemSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div className="space-y-6">
          <p className="section-label">{slide.eyebrow}</p>
          <h1 className="text-[clamp(2.5rem,5.8vw,5.4rem)] font-black leading-[0.96] tracking-[-0.045em] text-foreground">
            {slide.title}
          </h1>
          <p className="max-w-2xl text-xl font-bold leading-9 text-muted-foreground">
            {slide.copy}
          </p>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-3 rounded-[calc(var(--radius)+8px)] border border-border bg-[color:var(--hc-paper)] p-5">
            <p className="section-label">Current behavior</p>
            <div className="grid gap-3">
              {slide.items.slice(0, 4).map((item) => (
                <div key={item} className="soft-list-item px-4 py-3 text-sm font-black text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
            <div className="h-px bg-[color:var(--hc-rule)]" />
            <div className="rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground">
              Herafy replaces this with
            </div>
            <div className="h-px bg-[color:var(--hc-rule)]" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['Faster', 'Clearer', 'More trustworthy'].map((item) => (
              <div key={item} className="rounded-2xl bg-primary p-5 text-center text-lg font-black text-primary-foreground shadow-[0_20px_45px_rgba(242,111,54,0.2)]">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DeckSlide({ slide }: { slide: Slide }) {
  return (
    <div
      data-slide-content
      className="mx-auto grid w-full max-w-7xl items-center gap-8 will-change-transform lg:grid-cols-[minmax(0,0.98fr)_minmax(360px,0.82fr)]"
    >
      <article className="motion-stagger min-w-0 space-y-7">
        <div className="brand-eyebrow" />
        <div className="space-y-4">
          <p className="section-label">{slide.eyebrow}</p>
          <h1 className="max-w-6xl text-[clamp(2.35rem,5.6vw,5.65rem)] font-black leading-[0.96] tracking-[-0.04em] text-foreground">
            {slide.title}
          </h1>
          <p className="max-w-3xl text-base font-semibold leading-8 text-muted-foreground sm:text-xl sm:leading-9">
            {slide.copy}
          </p>
        </div>
        <p className="max-w-3xl text-sm font-black uppercase tracking-[0.18em] text-primary">
          {slide.proof}
        </p>
      </article>

      <VisualPanel slide={slide} />
    </div>
  );
}

function VisualPanel({ slide }: { slide: Slide }) {
  if (slide.kind === 'evidence') return <EvidenceVisual slide={slide} />;
  if (slide.kind === 'architecture' || slide.kind === 'launch') return <StackVisual slide={slide} />;
  if (flowKinds.has(slide.kind)) return <FlowVisual slide={slide} />;
  if (gridKinds.has(slide.kind)) return <GridVisual slide={slide} />;
  if (slide.kind === 'trust') return <TrustVisual slide={slide} />;
  if (slide.kind === 'problem') return <ProblemVisual slide={slide} />;
  return <GridVisual slide={slide} />;
}

function PanelShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <aside className="brand-panel min-w-0 overflow-hidden p-5 shadow-[0_20px_52px_rgba(73,55,38,0.08)] sm:p-6 lg:p-7">
      <p className="section-label">{title}</p>
      <div className="mt-6">{children}</div>
    </aside>
  );
}

function GridVisual({ slide }: { slide: Slide }) {
  return (
    <PanelShell title={slide.visualTitle}>
      <div className="grid grid-cols-2 gap-3">
        {slide.items.map((item, index) => (
          <div key={item} className="soft-list-item min-h-24 p-4">
            <p className="brand-number text-3xl">{String(index + 1).padStart(2, '0')}</p>
            <p className="mt-2 text-sm font-black leading-6 text-foreground">{item}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function FlowVisual({ slide }: { slide: Slide }) {
  return (
    <PanelShell title={slide.visualTitle}>
      <div className="grid gap-3">
        {slide.items.map((item, index) => (
          <div key={item} className="grid grid-cols-[auto_1fr] items-center gap-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
              {index + 1}
            </div>
            <div className="soft-list-item px-4 py-3">
              <p className="text-sm font-black text-foreground">{item}</p>
            </div>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function ProblemVisual({ slide }: { slide: Slide }) {
  return (
    <PanelShell title={slide.visualTitle}>
      <div className="grid gap-3">
        {slide.items.map((item, index) => (
          <div key={item} className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[color:var(--hc-rule)]" />
            <div className="soft-note min-w-0 rounded-full px-4 py-2 text-sm font-black">
              {item}
            </div>
            {index < slide.items.length - 1 ? <div className="h-px w-6 bg-primary" /> : null}
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-2xl bg-primary p-5 text-primary-foreground">
        <p className="text-sm font-black uppercase tracking-[0.18em]">Converted into</p>
        <p className="mt-2 text-2xl font-black">searchable, approved provider profiles</p>
      </div>
    </PanelShell>
  );
}

function TrustVisual({ slide }: { slide: Slide }) {
  return (
    <PanelShell title={slide.visualTitle}>
      <div className="relative grid gap-3">
        {slide.items.map((item, index) => (
          <div key={item} className="soft-list-item flex items-center justify-between gap-4 p-4">
            <p className="text-sm font-black text-foreground">{item}</p>
            <span className="rounded-full bg-[color:var(--hc-cream)] px-3 py-1 text-xs font-black text-primary">
              {index === slide.items.length - 1 ? 'Evidence' : 'Control'}
            </span>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function StackVisual({ slide }: { slide: Slide }) {
  return (
    <PanelShell title={slide.visualTitle}>
      <div className="grid gap-2">
        {slide.items.map((item, index) => (
          <div
            key={item}
            className="rounded-2xl border border-border bg-[color:var(--hc-paper)] px-4 py-3 shadow-[0_12px_24px_rgba(73,55,38,0.05)]"
            style={{ marginInlineStart: `${index % 3}rem` }}
          >
            <p className="text-sm font-black text-foreground">{item}</p>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

function EvidenceVisual({ slide }: { slide: Slide }) {
  return (
    <PanelShell title={slide.visualTitle}>
      <div className="grid grid-cols-2 gap-3">
        {slide.items.map((item) => {
          const [label, value = ''] = item.split(': ');
          return (
            <div key={item} className="stat-tile p-4">
              <p className="brand-number text-4xl">{value || label}</p>
              <p className="mt-2 text-xs font-black uppercase tracking-[0.14em] text-muted-foreground">
                {value ? label : 'Gate'}
              </p>
            </div>
          );
        })}
      </div>
    </PanelShell>
  );
}
