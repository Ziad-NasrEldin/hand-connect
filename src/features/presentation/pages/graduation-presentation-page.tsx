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
    copy: 'The product direction was controlled by strict business rules. They decided what could appear in the product and what had to stay out.',
    proof: 'Cairo only / direct contact only / verified before public',
    visualTitle: 'Decision matrix',
    items: ['Cairo only', 'Four professions only', 'Direct contact only', 'No platform appointments', 'Free customer contact', 'No service guarantees', 'Verified before public', 'Paid visibility capped and labeled', 'Reviews after contact'],
  },
  {
    kind: 'constraints',
    eyebrow: 'Product direction',
    title: 'These guidelines shaped every product decision.',
    copy: 'They affected what screens were designed, what features were rejected, how users move, how providers are ranked, and how admins control trust and safety.',
    proof: 'This is why Herafy stayed focused instead of becoming a marketplace',
    visualTitle: 'What the rules changed',
    items: ['Screens designed', 'Features rejected', 'User movement', 'Provider ranking', 'Admin trust control'],
  },
  {
    kind: 'roles',
    eyebrow: 'Live demo',
    title: 'The live demo starts by showing the roles inside the system.',
    copy: 'Each role proves a different part of the product: customers discover, providers operate, and admins protect platform integrity.',
    proof: 'Customer / provider / admin',
    visualTitle: 'Role map',
    items: ['Customer: search, profiles, chat, WhatsApp, reviews', 'Provider: account, verification, profile, contacts, dashboard, visibility', 'Admin: approve, reject, professions, reviews, bans, reports'],
  },
  {
    kind: 'journey',
    eyebrow: 'Customer demo',
    title: 'The customer demo shows the fastest path from need to contact.',
    copy: 'Open the platform, select profession, select location, view provider results, open a profile, start chat, reveal WhatsApp, then leave a review after contact.',
    proof: 'Goal: prove a customer can find and contact a provider quickly',
    visualTitle: 'Need to contact',
    items: ['Need', 'Profession', 'Neighborhood', 'Approved results', 'Profile', 'Chat or WhatsApp', 'Review after contact'],
  },
  {
    kind: 'journey',
    eyebrow: 'Provider demo',
    title: 'The provider demo shows how a service provider joins and operates.',
    copy: 'Create a provider account, choose profession, choose service area, submit ID verification, wait for approval, complete profile, receive contacts, view metrics, and manage visibility options.',
    proof: 'Goal: prove providers can be onboarded, verified, and activated without complex tools',
    visualTitle: 'Provider activation',
    items: ['Register', 'Identity document', 'Pending', 'Admin approval', 'Profile edit', 'Dashboard metrics', 'Visibility request'],
  },
  {
    kind: 'trust',
    eyebrow: 'Admin demo',
    title: 'The admin demo shows how trust is controlled.',
    copy: 'Open the admin dashboard, view pending providers, review identity, approve or reject, review reports, moderate reviews, enforce warnings or bans, and check logged actions.',
    proof: 'Goal: prove trust is not just a claim. It is controlled by the system.',
    visualTitle: 'Control loop',
    items: ['Review identity', 'Approve or reject', 'Moderate reports', 'Suspend or ban', 'Write audit row'],
  },
  {
    kind: 'pipeline',
    eyebrow: 'How it was built',
    title: 'The product was built through a sequence of product documents.',
    copy: 'Business context became PRD, SRS, technology decisions, sitemap, design system, implementation tasks, hardening, and go-live preparation.',
    proof: 'Idea became a buildable product process',
    visualTitle: 'Build pipeline',
    items: ['Business context', 'PRD', 'SRS', 'Tech decisions', 'Sitemap', 'Design + motion', 'Implementation tracker', 'Release gate'],
  },
  {
    kind: 'pipeline',
    eyebrow: 'PRD',
    title: 'The PRD was written from the business context.',
    copy: 'It translated the business idea into target users, user journeys, functional requirements, non-functional requirements, acceptance criteria, and out-of-scope features.',
    proof: 'This document made the product buildable',
    visualTitle: 'PRD contents',
    items: ['Users', 'Journeys', 'Functional requirements', 'NFRs', 'Acceptance criteria', 'Out of scope'],
  },
  {
    kind: 'evidence',
    eyebrow: 'SRS',
    title: 'The SRS was written by interviewing myself and answering 110+ questions.',
    copy: 'The questions covered users, roles, permissions, edge cases, business rules, system behavior, admin actions, provider restrictions, and trust and safety.',
    proof: 'This forced the project to become specific instead of vague',
    visualTitle: 'Audit status',
    items: ['Users', 'Roles', 'Permissions', 'Edge cases', 'Business rules', 'System behavior', 'Admin actions', 'Provider restrictions', 'Trust and safety'],
  },
  {
    kind: 'architecture',
    eyebrow: 'Technology decisions',
    title: 'The technology was not chosen randomly.',
    copy: 'It was chosen based on what customers need to do, what providers need to do, what admins need to control, how the product needs to scale, and where trust and speed matter most.',
    proof: 'The user lifecycle shaped the architecture and stack',
    visualTitle: 'System stack',
    items: ['React + Vite', 'React Router guards', 'Service contracts', 'Firebase Auth', 'Firestore + Storage', 'Cloud Functions', 'Vercel API/routes'],
  },
  {
    kind: 'architecture',
    eyebrow: 'Sitemap',
    title: 'The sitemap was extracted from user journeys.',
    copy: 'Instead of inventing pages, every screen came from a real flow: customer search, customer contact, provider onboarding, provider dashboard, admin verification, and admin moderation.',
    proof: 'This kept the product focused',
    visualTitle: 'Route tree',
    items: ['Public: /search, /providers/:id', 'Auth: /login, /register', 'Customer: /reviews/new/:providerId', 'Provider: dashboard/profile/visibility', 'Admin: six operational tabs'],
  },
  {
    kind: 'pipeline',
    eyebrow: 'Design and motion',
    title: 'The design.md and motion.md defined how the product should feel.',
    copy: 'The goal was to make the UI clear, fast, trustworthy, consistent, and not over-designed. The product was treated as a utility, not a decorative landing page.',
    proof: 'Design language and interaction behavior were defined before final UI',
    visualTitle: 'Interface language',
    items: ['Warm paper', 'Herafy orange', 'Cairo typography', 'Rounded trust cards', 'Mobile-first nav', 'Reduced motion'],
  },
  {
    kind: 'roles',
    eyebrow: 'UI design',
    title: 'The UI designs were created from the sitemap and design system.',
    copy: 'Each screen had a reason: landing, search results, provider profile, login/signup, chat, reviews, onboarding, dashboard, admin dashboard, verification, and moderation.',
    proof: 'Design goal: help users reach contact as fast as possible',
    visualTitle: 'Screen families',
    items: ['Discovery', 'Contact', 'Provider ops', 'Admin trust', 'Moderation', 'Release'],
  },
  {
    kind: 'pipeline',
    eyebrow: 'Implementation plan',
    title: 'The full spec document turned everything into implementation tasks.',
    copy: 'It included product requirements, technical architecture, ERD, API contracts, ranking rules, chat rules, analytics events, admin rules, QA checklist, and release plan.',
    proof: 'The tracker checklist made development measurable',
    visualTitle: 'Tracker proof',
    items: ['Product decisions', 'Task IDs', 'Dependencies', 'Verification proof', 'Milestones', 'Release gate'],
  },
  {
    kind: 'evidence',
    eyebrow: 'Polish and hardening',
    title: 'Final polish and hardening focused on making the product stable.',
    copy: 'The goal was not to add more features. It was to fix broken flows, loading states, empty states, edge cases, permissions, admin actions, search, chat, reviews, security, and privacy.',
    proof: 'The existing product had to become reliable',
    visualTitle: 'Quality gates',
    items: ['ESLint', 'Vitest', 'Firestore rules', 'Vite build', 'Playwright E2E', 'Operations docs'],
  },
  {
    kind: 'launch',
    eyebrow: 'Go live',
    title: 'The product was prepared for beta launch.',
    copy: 'The frontend was deployed to Vercel, the domain was configured through Cloudflare, and beta launch paths were prepared for Apple Store and Google Play testing.',
    proof: 'Goal: beta validation, not mass launch',
    visualTitle: 'Launch stack',
    items: ['Vercel app', 'Vercel API', 'Cloudflare domain', 'Firebase backend', 'Firebase rules', 'Capacitor iOS wrapper'],
  },
  {
    kind: 'final',
    eyebrow: 'Final message',
    title: 'This graduation project is not just an app.',
    copy: 'It is a full product-building process: market problem, business rules, requirements, system architecture, UI, implementation tasks, and a tested product ready for beta launch.',
    proof: 'The focus is how the product was built from idea to launch',
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
          <SlideFrame slide={slide} index={index} />
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

function SlideFrame({ slide, index }: { slide: Slide; index: number }) {
  if (index === 0) return <OpeningSlide />;
  if (index === 1) return <FocusSlide slide={slide} />;
  if (index === 2) return <ProblemSlide slide={slide} />;
  if (index === 3) return <RulesConstellationSlide slide={slide} />;
  if (index === 4) return <DecisionImpactSlide slide={slide} />;
  if (index === 5) return <RoleTriptychSlide slide={slide} />;
  if (index === 6) return <CustomerPathSlide slide={slide} />;
  if (index === 7) return <ProviderActivationSlide slide={slide} />;
  if (index === 8) return <AdminControlRoomSlide slide={slide} />;
  if (index === 9) return <BuildDocumentStackSlide slide={slide} />;
  if (index === 10) return <PrdBlueprintSlide slide={slide} />;
  if (index === 11) return <SrsQuestionMatrixSlide slide={slide} />;
  if (index === 12) return <TechDecisionConsoleSlide slide={slide} />;
  if (index === 13) return <SitemapSwimlanesSlide slide={slide} />;
  if (index === 14) return <DesignMotionSlide slide={slide} />;
  if (index === 15) return <UiSurfaceWallSlide slide={slide} />;
  if (index === 16) return <SpecTrackerSlide slide={slide} />;
  if (index === 17) return <HardeningRadarSlide slide={slide} />;
  if (index === 18) return <GoLiveSlide slide={slide} />;
  if (index === 19) return <FinalChainSlide />;
  return <DeckSlide slide={slide} />;
}

function SlideHeader({ slide, align = 'left' }: { slide: Slide; align?: 'left' | 'center' }) {
  return (
    <header className={align === 'center' ? 'mx-auto max-w-5xl text-center' : 'max-w-5xl'}>
      <p className="section-label">{slide.eyebrow}</p>
      <h1 className="mt-4 text-[clamp(2.25rem,5vw,4.85rem)] font-black leading-[0.98] tracking-[-0.04em] text-foreground">
        {slide.title}
      </h1>
      <p className="mt-4 max-w-4xl text-base font-bold leading-8 text-muted-foreground sm:text-xl sm:leading-9">
        {slide.copy}
      </p>
    </header>
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
                <div data-motion-line className="h-px bg-[color:var(--hc-rule)]" />
            <div className="rounded-full bg-primary px-4 py-2 text-sm font-black text-primary-foreground">
              Herafy replaces this with
            </div>
                <div data-motion-line className="h-px bg-[color:var(--hc-rule)]" />
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

function RulesConstellationSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8">
        <SlideHeader slide={slide} align="center" />
        <div className="relative mx-auto h-[390px] w-full max-w-5xl">
          <div className="absolute left-1/2 top-1/2 grid h-40 w-40 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-primary p-5 text-center text-primary-foreground shadow-[0_26px_70px_rgba(242,111,54,0.24)]">
            <p className="text-xl font-black leading-tight">Strict business rules</p>
          </div>
          {slide.items.map((item, index) => {
            const positions = [
              'left-[6%] top-[6%]',
              'left-[36%] top-0',
              'right-[8%] top-[8%]',
              'right-0 top-[43%]',
              'right-[12%] bottom-[5%]',
              'left-[39%] bottom-0',
              'left-[5%] bottom-[10%]',
              'left-0 top-[42%]',
              'left-[41%] top-[76%]',
            ];
            return (
              <div key={item} className={`absolute ${positions[index]} soft-list-item w-44 px-4 py-3 text-center text-sm font-black`}>
                {item}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DecisionImpactSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <div className="brand-panel p-7">
          <p className="section-label">{slide.eyebrow}</p>
          <h1 className="mt-5 text-[clamp(2.4rem,5vw,5rem)] font-black leading-[0.96] tracking-[-0.04em] text-foreground">
            {slide.title}
          </h1>
          <p className="mt-6 text-lg font-bold leading-8 text-muted-foreground">{slide.copy}</p>
        </div>
        <div className="grid gap-4">
          {slide.items.map((item, index) => (
            <div key={item} className="grid grid-cols-[auto_1fr] items-center gap-4">
              <p className="brand-number w-16 text-5xl">{String(index + 1).padStart(2, '0')}</p>
              <div className="rounded-full border border-border bg-[color:var(--hc-paper)] px-6 py-4 shadow-[0_14px_30px_rgba(73,55,38,0.06)]">
                <p className="text-lg font-black text-foreground">{item}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RoleTriptychSlide({ slide }: { slide: Slide }) {
  const roles = slide.items.map((item) => {
    const [role, details = ''] = item.split(': ');
    return { role, details: details.split(', ') };
  });

  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] grid-rows-[auto_1fr] gap-8">
        <SlideHeader slide={slide} align="center" />
        <div className="grid gap-5 lg:grid-cols-3">
          {roles.map(({ role, details }, index) => (
            <section key={role} className="brand-panel grid content-between p-6">
              <div>
                <p className="brand-number text-6xl">{String(index + 1).padStart(2, '0')}</p>
                <h2 className="mt-4 text-3xl font-black text-foreground">{role}</h2>
              </div>
              <div className="mt-8 grid gap-2">
                {details.map((detail) => (
                  <p key={detail} className="soft-note rounded-full px-4 py-2 text-sm font-black">{detail}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function CustomerPathSlide({ slide }: { slide: Slide }) {
  return <PathSlide slide={slide} mode="customer" />;
}

function ProviderActivationSlide({ slide }: { slide: Slide }) {
  return <PathSlide slide={slide} mode="provider" />;
}

function PathSlide({ slide, mode }: { slide: Slide; mode: 'customer' | 'provider' }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8">
        <SlideHeader slide={slide} />
        <div className="relative rounded-[calc(var(--radius)+12px)] border border-border bg-[color:var(--hc-paper)] p-5">
          <div data-motion-line className="absolute left-8 right-8 top-1/2 hidden h-1 -translate-y-1/2 rounded-full bg-[color:var(--hc-rule)] lg:block" />
          <div className="relative grid gap-3 lg:grid-cols-7">
            {slide.items.map((item, index) => (
              <div key={item} className={`soft-list-item min-h-36 p-4 ${mode === 'provider' && index % 2 ? 'lg:translate-y-16' : ''}`}>
                <p className="brand-number text-4xl">{String(index + 1).padStart(2, '0')}</p>
                <p className="mt-4 text-sm font-black leading-6 text-foreground">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminControlRoomSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <div>
          <SlideHeader slide={slide} />
        </div>
        <div className="brand-panel p-6">
          <div className="grid grid-cols-2 gap-3">
            {slide.items.map((item, index) => (
              <div key={item} className={index === slide.items.length - 1 ? 'col-span-2' : ''}>
                <div className="soft-list-item p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-primary">{index === slide.items.length - 1 ? 'Audit' : 'Control'}</p>
                  <p className="mt-2 text-lg font-black leading-tight text-foreground">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BuildDocumentStackSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8">
        <SlideHeader slide={slide} align="center" />
        <div className="mx-auto grid w-full max-w-6xl gap-3">
          {slide.items.map((item, index) => (
            <div key={item} className={`brand-panel px-6 py-4 ${index % 2 === 0 ? 'lg:-translate-x-7' : 'lg:translate-x-7'}`}>
              <div className="flex items-center justify-between gap-4">
                <p className="text-2xl font-black text-foreground">{item}</p>
                <p className="brand-number text-4xl">{String(index + 1).padStart(2, '0')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PrdBlueprintSlide({ slide }: { slide: Slide }) {
  const left = slide.items.slice(0, 3);
  const right = slide.items.slice(3);
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
        <SlideHeader slide={slide} />
        <div className="relative min-h-[520px] rounded-[calc(var(--radius)+16px)] border border-border bg-[color:var(--hc-paper)] p-8 shadow-[0_28px_80px_rgba(55,42,35,0.08)]">
          <div className="absolute left-0 top-0 h-full w-3 rounded-l-[calc(var(--radius)+16px)] bg-primary" />
          <div className="grid h-full grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
            <div className="grid gap-6">
              {left.map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-background p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">Input</p>
                  <p className="mt-2 text-2xl font-black text-foreground">{item}</p>
                </div>
              ))}
            </div>
            <div className="grid h-full items-center">
              <div className="grid h-44 w-44 place-items-center rounded-full bg-primary text-center text-2xl font-black leading-tight text-primary-foreground">
                PRD
                <span className="block text-sm uppercase tracking-[0.14em]">Blueprint</span>
              </div>
            </div>
            <div className="grid gap-6">
              {right.map((item) => (
                <div key={item} className="rounded-2xl border border-[color:var(--hc-orange-soft)] bg-[color:var(--hc-soft)] p-5">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">Output</p>
                  <p className="mt-2 text-2xl font-black text-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SrsQuestionMatrixSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div className="brand-panel p-7">
          <p className="brand-number text-8xl">110+</p>
          <h1 className="mt-5 text-4xl font-black leading-tight text-foreground">{slide.title}</h1>
          <p className="mt-5 text-lg font-bold leading-8 text-muted-foreground">{slide.copy}</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {slide.items.map((item) => (
            <div key={item} className="soft-note grid min-h-24 place-items-center rounded-2xl p-3 text-center text-sm font-black">
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TechDecisionConsoleSlide({ slide }: { slide: Slide }) {
  const rows = ['Customer actions', 'Provider operations', 'Admin control', 'Scale path', 'Trust + speed'];
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8">
        <SlideHeader slide={slide} align="center" />
        <div className="grid gap-3 rounded-[calc(var(--radius)+10px)] border border-border bg-[color:var(--hc-paper)] p-5">
          {rows.map((row, index) => (
            <div key={row} className="grid grid-cols-1 items-center gap-4 lg:grid-cols-[220px_1fr]">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-primary">{row}</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {['Frontend route', 'Service contract', 'Backend rule'].map((cell) => (
                  <div key={cell} className="soft-list-item px-4 py-3 text-sm font-black text-foreground">
                    {index + 1}. {cell}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SitemapSwimlanesSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8">
        <SlideHeader slide={slide} />
        <div className="grid gap-3">
          {slide.items.map((item, index) => (
            <div key={item} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[180px_1fr] sm:gap-4">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-muted-foreground">Journey {index + 1}</p>
              <div className="rounded-full border border-border bg-[color:var(--hc-paper)] px-5 py-3">
                <p className="text-lg font-black text-foreground">{item}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesignMotionSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
        <SlideHeader slide={slide} />
        <div className="grid gap-4">
          {slide.items.map((item, index) => (
            <div key={item} className={`rounded-[calc(var(--radius)+4px)] p-6 ${index === 0 ? 'bg-primary text-primary-foreground' : 'soft-list-item'}`}>
              <p className="text-3xl font-black">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UiSurfaceWallSlide({ slide }: { slide: Slide }) {
  const surfaces = ['Landing', 'Search', 'Profile', 'Chat', 'Reviews', 'Onboarding', 'Dashboard', 'Admin'];
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SlideHeader slide={slide} />
        <div className="relative min-h-[520px]">
          <div className="absolute left-10 top-6 h-[420px] w-[280px] rotate-[-7deg] rounded-[2rem] border border-border bg-[color:var(--hc-paper)] p-5 shadow-[0_24px_70px_rgba(55,42,35,0.10)]">
            <div className="h-28 rounded-2xl bg-primary" />
            <div className="mt-5 h-3 w-40 rounded-full bg-[color:var(--hc-rule)]" />
            <div className="mt-3 h-3 w-56 rounded-full bg-[color:var(--hc-rule)]" />
            <div className="mt-8 grid gap-3">
              {surfaces.slice(0, 4).map((item) => (
                <div key={item} className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-black text-foreground">{item}</div>
              ))}
            </div>
          </div>
          <div className="absolute right-8 top-20 h-[400px] w-[360px] rotate-[5deg] rounded-[2rem] border border-border bg-background p-5 shadow-[0_24px_70px_rgba(55,42,35,0.10)]">
            <div className="grid grid-cols-[90px_1fr] gap-4">
              <div className="grid gap-3">
                {surfaces.slice(4).map((item) => (
                  <div key={item} className="rounded-xl bg-[color:var(--hc-soft)] px-3 py-4 text-xs font-black text-foreground">{item}</div>
                ))}
              </div>
              <div className="rounded-2xl border border-[color:var(--hc-orange-soft)] bg-[color:var(--hc-paper)] p-4">
                <p className="section-label">Contact path</p>
                <p className="mt-5 text-4xl font-black leading-none text-foreground">Need to provider</p>
                <div className="mt-8 h-3 rounded-full bg-primary" />
                <div className="mt-3 h-3 w-2/3 rounded-full bg-[color:var(--hc-rule)]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecTrackerSlide({ slide }: { slide: Slide }) {
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <SlideHeader slide={slide} />
        <div className="relative rounded-[calc(var(--radius)+16px)] border border-border bg-[color:var(--hc-paper)] p-7">
          <div data-motion-line className="absolute bottom-12 left-12 top-12 w-px bg-[color:var(--hc-rule)]" />
          <div className="grid gap-5">
            {slide.items.map((item, index) => {
              const labels = ['Decision', 'ID', 'Depends on', 'Proof', 'Milestone', 'Gate'];
              return (
                <div key={item} className="grid grid-cols-[56px_1fr] items-center gap-3 sm:grid-cols-[64px_1fr_auto] sm:gap-4">
                  <span className="relative z-10 grid h-12 w-12 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">{String(index + 1).padStart(2, '0')}</span>
                  <p className="text-2xl font-black text-foreground">{item}</p>
                  <span className="rounded-full border border-border bg-background px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">{labels[index]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function HardeningRadarSlide({ slide }: { slide: Slide }) {
  const checks = ['Broken flows', 'Loading states', 'Empty states', 'Edge cases', 'Permissions', 'Admin actions', 'Search', 'Chat', 'Reviews', 'Security', 'Privacy'];
  const positions = [
    'left-[4%] top-[12%]',
    'left-[22%] top-[5%]',
    'right-[24%] top-[6%]',
    'right-[5%] top-[18%]',
    'left-[8%] top-[46%]',
    'right-[8%] top-[44%]',
    'left-[24%] bottom-[10%]',
    'right-[28%] bottom-[10%]',
    'left-[42%] top-[16%]',
    'left-[38%] bottom-[2%]',
    'right-[4%] bottom-[18%]',
  ];
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8">
        <SlideHeader slide={slide} align="center" />
        <div className="relative mx-auto min-h-[360px] w-full max-w-6xl rounded-[calc(var(--radius)+18px)] border border-border bg-[color:var(--hc-paper)] p-6 shadow-[0_28px_80px_rgba(55,42,35,0.08)]">
          <div data-motion-line className="absolute inset-x-10 top-1/2 hidden h-px bg-[color:var(--hc-rule)] lg:block" />
          <div data-motion-orbit className="absolute left-1/2 top-1/2 hidden h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--hc-orange-soft)] lg:block" />
          <div data-motion-orbit className="absolute left-1/2 top-1/2 hidden h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-[color:var(--hc-orange-soft)] lg:block" />
          <div data-motion-scan className="absolute left-1/2 top-1/2 hidden h-3 w-[560px] -translate-x-1/2 -translate-y-1/2 rotate-[-14deg] rounded-full bg-primary/18 lg:block" />

          <div className="relative z-10 mx-auto grid min-h-[308px] place-items-center">
            <div className="grid h-44 w-44 place-items-center rounded-full bg-primary text-center text-primary-foreground shadow-[0_30px_90px_rgba(242,111,54,0.24)]">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] opacity-80">Release gate</p>
                <p className="mt-2 text-3xl font-black leading-none">Stable enough to test</p>
              </div>
            </div>
          </div>

          <div className="relative z-20 hidden lg:block">
            {checks.map((item, index) => (
              <div key={item} className={`absolute ${positions[index]} rounded-full border px-4 py-3 text-center text-sm font-black shadow-[0_12px_24px_rgba(73,55,38,0.06)] ${index === 0 || index === checks.length - 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground'}`}>
                {item}
              </div>
            ))}
          </div>

          <div className="relative z-20 mt-6 grid grid-cols-2 gap-3 lg:hidden">
            {checks.map((item, index) => (
              <div key={item} className={`${index === 0 || index === checks.length - 1 ? 'bg-primary text-primary-foreground' : 'soft-note'} rounded-2xl p-4 text-center text-sm font-black`}>
                {item}
              </div>
            ))}
          </div>

          <div className="relative z-20 mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
            {['Fix user paths', 'Protect permissions', 'Prepare beta confidence'].map((item) => (
              <div key={item} className="rounded-full bg-background px-4 py-3 text-center text-xs font-black uppercase tracking-[0.12em] text-muted-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GoLiveSlide({ slide }: { slide: Slide }) {
  const lanes = [
    ['Vercel', 'frontend + API'],
    ['Cloudflare', 'domain + DNS'],
    ['Apple', 'beta testing path'],
    ['Google Play', 'beta testing path'],
  ];
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
        <SlideHeader slide={slide} />
        <div className="relative min-h-[500px] rounded-[calc(var(--radius)+18px)] border border-border bg-[color:var(--hc-paper)] p-8">
          <div data-motion-line className="absolute left-16 right-16 top-1/2 hidden h-1 -translate-y-1/2 bg-[color:var(--hc-rule)] lg:block" />
          <div className="relative grid h-full grid-cols-1 items-center gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {lanes.map(([name, detail], index) => (
              <div key={name} className={`grid min-h-72 min-w-0 content-between rounded-[calc(var(--radius)+8px)] border p-5 ${index === 0 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground'}`}>
                <p className={`text-xs font-black uppercase tracking-[0.16em] ${index === 0 ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>Step {index + 1}</p>
                <div>
                  <p className="min-w-0 text-[clamp(1.45rem,2.15vw,2.25rem)] font-black leading-[0.98] [overflow-wrap:anywhere]">{name}</p>
                  <p className={`mt-3 text-sm font-black uppercase tracking-[0.12em] ${index === 0 ? 'text-primary-foreground/80' : 'text-primary'}`}>{detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinalChainSlide() {
  const pillars = [
    ['Not just screens', 'A real market problem became focused product decisions.'],
    ['Not just code', 'Requirements, architecture, UI, tasks, and QA were connected.'],
    ['Not just a demo', 'The result is a tested product prepared for beta validation.'],
  ];
  return (
    <div data-slide-content className="mx-auto grid w-full max-w-7xl items-center will-change-transform">
      <div className="grid min-h-[620px] gap-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="section-label">Final message</p>
          <h1 className="mt-8 text-[clamp(3.2rem,8vw,8.6rem)] font-black leading-[0.86] tracking-[-0.05em] text-foreground">
            Not just an app.
            <span className="mt-4 block text-primary">A product built from problem to beta.</span>
          </h1>
          <p className="mx-auto mt-8 max-w-4xl text-[clamp(1.05rem,1.8vw,1.55rem)] font-bold leading-8 text-muted-foreground">
            Herafy started as a messy real-world problem: finding trusted home service providers. The project proves how that problem became business rules, requirements, architecture, interface decisions, implementation tasks, verification, and a beta-ready product.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {pillars.map(([title, body], index) => (
            <div key={title} className={`rounded-[calc(var(--radius)+10px)] border p-6 ${index === 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-[color:var(--hc-paper)] text-foreground'}`}>
              <p className={`text-sm font-black uppercase tracking-[0.16em] ${index === 1 ? 'text-primary-foreground/70' : 'text-primary'}`}>
                Proof {index + 1}
              </p>
              <p className="mt-8 text-3xl font-black leading-tight">{title}</p>
              <p className={`mt-4 text-base font-bold leading-7 ${index === 1 ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="mx-auto grid w-full max-w-5xl grid-cols-2 items-center gap-3 sm:flex">
          {['Problem', 'Rules', 'Build', 'Verify', 'Launch'].map((item, index) => (
            <div key={item} className="flex min-w-0 flex-1 items-center gap-3">
              <div className={`grid min-h-14 flex-1 place-items-center rounded-full px-4 text-center text-sm font-black uppercase tracking-[0.12em] ${index === 4 ? 'bg-primary text-primary-foreground' : 'border border-border bg-background text-foreground'}`}>
                {item}
              </div>
              {index < 4 ? <div data-motion-line className="hidden h-px w-8 bg-[color:var(--hc-rule)] sm:block" /> : null}
            </div>
          ))}
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
