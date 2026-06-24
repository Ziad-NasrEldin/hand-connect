import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { gsap } from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';
import {
  Blocks,
  ClipboardCheck,
  Compass,
  ChevronLeft,
  ChevronRight,
  Globe2,
  LayoutDashboard,
  MapPinned,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollToPlugin);

type Slide = {
  eyebrow: string;
  title: string;
  copy: string;
  Icon: ComponentType<{ className?: string }>;
  points: string[];
  accent: string;
};

const slides: Slide[] = [
  {
    eyebrow: 'Graduation project',
    title: 'Herafy turns a stressful home-service search into a direct path to contact.',
    copy: 'A Cairo-first discovery product for finding verified plumbers, electricians, carpenters, and cleaning providers without marketplace overhead.',
    Icon: Compass,
    accent: 'Product brief',
    points: ['Cairo only', 'Four professions', 'Direct contact', 'Verified public profiles'],
  },
  {
    eyebrow: 'Problem',
    title: 'Reliable providers are still found through referrals, Facebook posts, and outdated numbers.',
    copy: 'The product exists to make that journey faster, clearer, and more trustworthy while staying honest about what the platform does and does not guarantee.',
    Icon: MessageCircle,
    accent: 'Market gap',
    points: ['Slow discovery', 'Fragmented trust', 'Unclear availability', 'No clean provider context'],
  },
  {
    eyebrow: 'Strategy',
    title: 'The constraints shaped the product instead of weakening it.',
    copy: 'No customer payments, no service guarantees, capped paid visibility, and review limits after contact kept the product focused on discovery and trust.',
    Icon: ShieldCheck,
    accent: 'Business rules',
    points: ['No marketplace claims', 'Labeled visibility', 'Reviews after contact', 'Admin-controlled safety'],
  },
  {
    eyebrow: 'Live demo',
    title: 'The customer proof is simple: need, filter, profile, contact.',
    copy: 'This flow proves that a customer can move from a home-service need to a provider conversation quickly on a phone-first interface.',
    Icon: Smartphone,
    accent: 'Customer journey',
    points: ['Select profession', 'Select area', 'Open provider profile', 'Reveal WhatsApp or start chat'],
  },
  {
    eyebrow: 'Provider flow',
    title: 'Providers join, verify, complete a profile, and receive real contact intent.',
    copy: 'The provider experience stays operational and lightweight while still giving admins enough structure to protect the public directory.',
    Icon: Wrench,
    accent: 'Provider journey',
    points: ['Create account', 'Choose profession and area', 'Submit identity', 'Track contacts and visibility'],
  },
  {
    eyebrow: 'Admin flow',
    title: 'Trust is not a slogan. It is a controlled workflow.',
    copy: 'The admin surface gives the platform a moderation layer for verification, reports, provider status, paid visibility, and logged actions.',
    Icon: LayoutDashboard,
    accent: 'Trust system',
    points: ['Approve providers', 'Reject risky profiles', 'Moderate reports', 'Audit admin actions'],
  },
  {
    eyebrow: 'Build process',
    title: 'The product moved from business context to PRD, SRS, sitemap, UI, and tracked implementation.',
    copy: 'Each screen came from a real journey, and each requirement was turned into buildable tasks with acceptance criteria and QA checks.',
    Icon: Blocks,
    accent: 'How it was built',
    points: ['PRD from business rules', 'SRS from 110+ questions', 'Tech decisions from lifecycle needs', 'Tracker-backed implementation'],
  },
  {
    eyebrow: 'System map',
    title: 'Three user surfaces share one trust and discovery system.',
    copy: 'Customer discovery, provider operations, and admin control connect through auth, API contracts, ranking rules, analytics, and moderation.',
    Icon: MapPinned,
    accent: 'Architecture story',
    points: ['Customer app', 'Provider dashboard', 'Admin workspace', 'Backend services and data rules'],
  },
  {
    eyebrow: 'Launch readiness',
    title: 'The project ends as a beta-ready product, not a static prototype.',
    copy: 'Deployment, domain setup, mobile beta preparation, and hardening work show that the project was prepared for real users and real testing.',
    Icon: Globe2,
    accent: 'Go live',
    points: ['Vercel deployment', 'Cloudflare domain', 'iOS beta path', 'Android beta path'],
  },
  {
    eyebrow: 'Final message',
    title: 'This is not just an app. It is a full product-building process.',
    copy: 'Herafy started from a real market problem, became business rules, product requirements, architecture, UI, implementation tasks, and a tested beta-ready product.',
    Icon: ClipboardCheck,
    accent: 'From idea to launch',
    points: ['Problem', 'Rules', 'Product', 'System', 'Launch'],
  },
];

const demoFlow = ['Need', 'Profession', 'Location', 'Profile', 'Contact'];
const systemLayers = ['Customer', 'Provider', 'Admin', 'API', 'Data rules'];

export function GraduationPresentationPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const firstSlideRef = useRef<HTMLElement | null>(null);
  const [activeSlide, setActiveSlide] = useState(0);
  const isScrollingRef = useRef(false);

  const slideCountLabel = useMemo(
    () => String(slides.length).padStart(2, '0'),
    [],
  );

  const goToSlide = useCallback((index: number) => {
    const root = containerRef.current;
    const boundedIndex = Math.min(Math.max(index, 0), slides.length - 1);
    const nextSlide = slideRefs.current[boundedIndex];
    if (!root || !nextSlide || isScrollingRef.current) return;

    const currentSlide = slideRefs.current[activeSlide];
    const direction = boundedIndex > activeSlide ? 1 : -1;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    isScrollingRef.current = true;
    root.style.scrollSnapType = 'none';

    const currentContent = currentSlide?.querySelector('[data-slide-content]');
    const nextContent = nextSlide.querySelector('[data-slide-content]');

    if (reduceMotion) {
      root.scrollTop = nextSlide.offsetTop;
      root.style.scrollSnapType = '';
      isScrollingRef.current = false;
      setActiveSlide(boundedIndex);
      return;
    }

    gsap.killTweensOf(root);
    gsap.killTweensOf([currentContent, nextContent]);

    if (currentContent && currentSlide !== nextSlide) {
      gsap.to(currentContent, {
        autoAlpha: 0.72,
        duration: 0.18,
        ease: 'power2.out',
        y: direction * -10,
      });
    }

    if (nextContent) {
      gsap.set(nextContent, {
        autoAlpha: 0.84,
        y: direction * 14,
      });
    }

    gsap.to(root, {
      duration: 0.82,
      ease: 'power2.inOut',
      overwrite: true,
      scrollTo: {
        y: nextSlide.offsetTop,
        autoKill: false,
      },
      onComplete: () => {
        setActiveSlide(boundedIndex);
        root.style.scrollSnapType = '';

        if (currentContent) {
          gsap.set(currentContent, { autoAlpha: 1, y: 0 });
        }

        if (nextContent) {
          gsap.to(nextContent, {
            autoAlpha: 1,
            duration: 0.34,
            ease: 'expo.out',
            y: 0,
          });
        }

        window.setTimeout(() => {
          isScrollingRef.current = false;
        }, 80);
      },
    });
  }, [activeSlide]);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        setActiveSlide(Number(visible.target.getAttribute('data-slide-index')));
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
        .timeline({
          defaults: {
            duration: 0.72,
            ease: 'expo.out',
          },
        })
        .from('[data-hero-mark]', { autoAlpha: 0, scaleX: 0.18, transformOrigin: 'left center' })
        .from('[data-hero-kicker]', { autoAlpha: 0, y: 18 }, '-=0.48')
        .from('[data-hero-title]', { autoAlpha: 0, y: 34 }, '-=0.44')
        .from('[data-hero-copy]', { autoAlpha: 0, y: 20 }, '-=0.48')
        .from('[data-hero-step]', { autoAlpha: 0, y: 16, stagger: 0.08 }, '-=0.36')
        .from('[data-hero-orbit]', { autoAlpha: 0, scale: 0.88, rotate: -8 }, '-=0.72');
    }, root);

    return () => context.revert();
  }, []);

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    function onWheel(event: WheelEvent) {
      if (Math.abs(event.deltaY) < 18 || isScrollingRef.current) return;
      event.preventDefault();
      goToSlide(activeSlide + (event.deltaY > 0 ? 1 : -1));
    }

    function onKeyDown(event: KeyboardEvent) {
      const nextKeys = ['ArrowDown', 'PageDown', ' '];
      const previousKeys = ['ArrowUp', 'PageUp'];

      if (![...nextKeys, ...previousKeys, 'Home', 'End'].includes(event.key)) {
        return;
      }

      event.preventDefault();

      if (nextKeys.includes(event.key)) goToSlide(activeSlide + 1);
      if (previousKeys.includes(event.key)) goToSlide(activeSlide - 1);
      if (event.key === 'Home') goToSlide(0);
      if (event.key === 'End') goToSlide(slides.length - 1);
    }

    root.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      root.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [activeSlide, goToSlide]);

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
              Graduation presentation
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
          key={slide.title}
          ref={(element) => {
            slideRefs.current[index] = element;
            if (index === 0) firstSlideRef.current = element;
          }}
          data-slide-index={index}
          className="relative grid min-h-screen snap-start snap-always overflow-hidden px-4 pb-8 pt-28 sm:px-6 lg:px-8"
        >
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_88%_18%,color-mix(in_oklch,var(--hc-orange)_13%,transparent),transparent_28%),radial-gradient(circle_at_10%_84%,color-mix(in_oklch,var(--hc-orange-soft)_20%,transparent),transparent_28%)]" />
          {index === 0 ? (
            <OpeningSlide />
          ) : (
            <StandardSlide slide={slide} index={index} />
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
          onClick={() => goToSlide(activeSlide - 1)}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          aria-label="Next slide"
          className="h-11 w-11 rounded-full p-0"
          size="sm"
          disabled={activeSlide === slides.length - 1}
          onClick={() => goToSlide(activeSlide + 1)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </main>
  );
}

function OpeningSlide() {
  const steps = ['Problem', 'Product', 'Trust', 'Launch'];

  return (
    <div
      data-slide-content
      className="mx-auto grid w-full max-w-7xl items-center will-change-transform"
    >
      <div className="relative min-h-[620px]">
        <div
          data-hero-orbit
          className="absolute right-0 top-1/2 hidden h-[420px] w-[420px] -translate-y-1/2 rounded-full border border-[color:var(--hc-rule)] bg-[radial-gradient(circle_at_42%_38%,color-mix(in_oklch,var(--hc-orange)_26%,transparent),transparent_42%)] lg:block"
        >
          <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-[0_30px_80px_rgba(242,111,54,0.24)]" />
          <div className="absolute left-14 top-20 h-5 w-5 rounded-full bg-[color:var(--hc-orange-soft)]" />
          <div className="absolute bottom-24 right-16 h-9 w-9 rounded-full border border-[color:var(--hc-orange-soft)] bg-[color:var(--hc-paper)]" />
        </div>

        <div className="relative z-10 flex min-h-[620px] max-w-4xl flex-col justify-center">
          <div
            data-hero-mark
            className="mb-10 h-2 w-24 rounded-full bg-primary"
          />
          <p
            data-hero-kicker
            className="mb-5 text-sm font-black uppercase tracking-[0.24em] text-primary"
          >
            Graduation project
          </p>
          <h1
            data-hero-title
            className="brand-title max-w-[11ch] text-[clamp(5.2rem,18vw,14rem)] leading-[0.78] tracking-[-0.07em]"
          >
            Herafy
          </h1>
          <p
            data-hero-copy
            className="mt-9 max-w-2xl text-[clamp(1.2rem,2.4vw,2.1rem)] font-bold leading-[1.35] text-foreground"
          >
            A direct-contact home services product for Cairo.
          </p>
          <p
            data-hero-copy
            className="mt-4 max-w-xl text-base font-semibold leading-8 text-muted-foreground sm:text-lg"
          >
            From a stressful search to verified providers, fast.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-3">
            {steps.map((step, index) => (
              <div key={step} data-hero-step className="flex items-center gap-4">
                <span className="text-sm font-black uppercase tracking-[0.18em] text-foreground">
                  {step}
                </span>
                {index < steps.length - 1 ? (
                  <span className="h-px w-10 bg-[color:var(--hc-rule)]" />
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StandardSlide({ slide, index }: { slide: Slide; index: number }) {
  return (
    <div
      data-slide-content
      className="mx-auto grid w-full max-w-7xl items-center gap-5 will-change-transform lg:grid-cols-[minmax(0,1.04fr)_minmax(320px,0.96fr)]"
    >
      <article className="motion-stagger min-w-0 space-y-6">
        <div className="brand-eyebrow" />
        <div className="space-y-4">
          <p className="section-label">{slide.eyebrow}</p>
          <h1 className="max-w-5xl text-[clamp(2.25rem,6.4vw,5.6rem)] font-black leading-[0.96] tracking-[-0.04em] text-foreground">
            {slide.title}
          </h1>
          <p className="max-w-3xl text-base font-semibold leading-8 text-muted-foreground sm:text-xl sm:leading-9">
            {slide.copy}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {slide.points.map((point) => (
            <span
              key={point}
              className="soft-note inline-flex min-h-10 items-center rounded-full px-4 text-sm font-bold"
            >
              {point}
            </span>
          ))}
        </div>
      </article>

      <aside className="brand-panel motion-surface min-w-0 overflow-hidden p-5 sm:p-6 lg:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label">{slide.accent}</p>
            <p className="mt-2 text-2xl font-black leading-tight tracking-[-0.02em] text-foreground sm:text-3xl">
              {slide.points[0]}
            </p>
          </div>
          <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[0_16px_32px_rgba(242,111,54,0.22)]">
            <slide.Icon className="h-7 w-7" />
          </div>
        </div>

        <div className="mt-8 grid gap-3">
          {(index === 3 ? demoFlow : systemLayers).map((item, itemIndex) => (
            <div key={item} className="soft-list-item flex items-center gap-3 p-4">
              <span className="brand-number text-3xl">
                {String(itemIndex + 1).padStart(2, '0')}
              </span>
              <div className="min-w-0">
                <p className="font-bold text-foreground">{item}</p>
                <p className="text-sm font-semibold text-muted-foreground">
                  {index === 7
                    ? 'Connected layer in the product system'
                    : 'Clear step in the presentation story'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}
