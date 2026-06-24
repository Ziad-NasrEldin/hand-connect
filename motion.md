# Motion System

## Purpose

Motion in Herafy should communicate state, direction, and feedback. It should never feel decorative, bouncy, or distracting.

Use motion to make the app feel responsive, trustworthy, and calm:

- Confirm that taps and clicks registered.
- Show when content entered, changed, loaded, or completed.
- Make route changes feel intentional instead of sudden.
- Preserve accessibility through reduced-motion support.

## Principles

1. Motion must explain state.
2. Animate only `transform` and `opacity` by default.
3. Avoid animating layout properties such as `width`, `height`, `top`, `left`, `margin`, or `padding`.
4. Use exponential easing only.
5. Keep motion short and quiet.
6. Every animation must respect `prefers-reduced-motion`.
7. Do not add bounce, elastic, wobble, or decorative loops.
8. Prefer existing motion utility classes before adding new ones.

## Timing Tokens

Use the existing CSS variables in `src/styles/globals.css`.

| Token | Duration | Use |
| --- | ---: | --- |
| `--motion-fast` | `140ms` | Press states, small feedback, active states |
| `--motion-base` | `220ms` | Hover, focus, field, button, and small state transitions |
| `--motion-slow` | `420ms` | Content reveal, cards, sections, non-blocking entrances |
| `--motion-route` | `520ms` | Page-level route transition |

## Easing Tokens

Use the existing CSS variables in `src/styles/globals.css`.

| Token | Curve | Use |
| --- | --- | --- |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Default UI feedback |
| `--ease-out-quint` | `cubic-bezier(0.22, 1, 0.36, 1)` | Small pop or confirmation moments |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Page, section, and route entrances |

Do not use bounce, elastic, or linear easing except for determinate progress indicators where constant movement is required.

## Motion Utilities

### `.motion-press`

Use for clickable controls.

Applies:

- Subtle hover lift on hover-capable devices.
- Active press scale.
- Fast transform transition.
- Opacity, shadow, background, and border transitions.

Default usage:

- Buttons.
- Icon buttons.
- Selectable cards.
- Tabs.
- Nav actions.

### `.motion-surface`

Use for cards, panels, and raised surfaces.

Applies:

- Hover lift.
- Shadow transition.
- Border/background transition.

Default usage:

- `Card`.
- Admin tiles.
- Profile panels.
- List result cards.
- Dashboard widgets.

### `.motion-field`

Use for inputs, textareas, selects, and form controls.

Applies:

- Focus lift.
- Border transition.
- Shadow/ring transition.
- Background transition.

Default usage:

- Text inputs.
- Select triggers.
- Textarea.
- Search controls.

### `.route-motion`

Use once around routed page content.

Applies:

- Page fade-through.
- Subtle `translateY`.
- Subtle scale.
- Route-level timing.

Default usage:

- Route outlet wrapper only.
- Do not nest repeatedly inside page sections.

### `.motion-reveal`

Use for one-off content entrances.

Default usage:

- Page intro blocks.
- Success states.
- Empty states.
- Important helper panels.

### `.motion-pop`

Use sparingly for small confirmation elements.

Default usage:

- Badges.
- Success checks.
- Paid/verified markers.
- Newly added message/status indicators.

Do not use for whole cards or page sections.

### `.motion-stagger`

Use when a small group of sibling items enters together.

Default usage:

- Hero text groups.
- Stat rows.
- Feature card groups.
- Search result groups.

Avoid using it on very long lists.

### `.motion-shimmer`

Use only for loading surfaces.

Default usage:

- Skeleton cards.
- Loading placeholders.

Do not use shimmer on real loaded content.

## Page-Level Rules

Every frontend page should follow this sequence:

1. The route enters through `.route-motion`.
2. The primary page heading or intro uses existing route motion or `.motion-reveal`.
3. Cards, panels, and major surfaces use `.motion-surface`.
4. Buttons and clickable controls use `.motion-press`.
5. Inputs and form controls use `.motion-field`.
6. Lists may use `.motion-stagger` only for short visible groups.
7. Loading states use skeletons or `.motion-shimmer`, not abrupt spinners-only pages.
8. Success, empty, and error states enter with `.motion-reveal` or `.motion-pop` depending on scale.

## Component Rules

### Buttons

Buttons should use `.motion-press`.

Behavior:

- Hover: translate up slightly where hover is available.
- Active: scale to `0.98`.
- Disabled: no pointer events and reduced opacity.
- Loading: spinner or progress indicator should appear inside the button.

### Cards and Panels

Cards should use `.motion-surface`.

Behavior:

- Hover-capable devices: lift by `-2px`.
- No hover lift on touch-only devices.
- Do not animate dimensions when card content changes.

### Forms

Inputs, selects, and textareas should use `.motion-field`.

Behavior:

- Focus-visible ring remains clear and accessible.
- Field may lift by `-1px`.
- Error messages should reveal with opacity and transform, or grid row expansion when height disclosure is necessary.

### Navigation

Top nav and sidebar links may use small hover and active transforms.

Rules:

- Active route changes should not animate layout.
- Nav motion should be subtle and immediate.
- Avoid complex underline or indicator animations unless shared across all navs.

### Routes

Routes should use fade-through motion:

- Opacity from `0` to `1`.
- `translateY` from `12px` to `0`.
- Scale from `0.992` to `1`.

Do not create slide-in page transitions that imply hierarchy unless the navigation pattern clearly supports it.

### Modals and Drawers

Future modal/drawer motion should use:

- Backdrop: opacity only, `180ms`.
- Dialog: opacity plus `translateY` or scale, `220ms`.
- Drawer: transform only, `260ms`.

No layout animation.

### Lists

Use stagger only for short groups.

Rules:

- Maximum visible stagger count: 6 items.
- Delay step should stay under `70ms`.
- Do not delay important actionable content for aesthetics.

### Loading

Use motion to communicate that work is ongoing.

Preferred:

- Skeleton surfaces.
- Inline button loading state.
- Determinate progress when progress is known.
- Shimmer only on placeholder content.

Avoid:

- Full-page spinners where skeletons are possible.
- Decorative looping motion.
- Shimmer on final content.

## Accessibility

Reduced motion is non-negotiable.

The global reduced-motion block in `src/styles/globals.css` should:

- Reduce animation duration.
- Remove animation delays.
- Prevent repeated animation loops.
- Disable shimmer.
- Remove hover transforms.

Do not add new animations without confirming they inherit this fallback or adding a specific fallback.

## Implementation Rules

When applying motion to a frontend page:

1. Use existing utility classes first.
2. Add motion at the component primitive level where possible.
3. Avoid page-specific animation classes unless the interaction is unique.
4. Keep motion declarations in `src/styles/globals.css`.
5. Prefer Tailwind class composition only for using existing utilities.
6. Do not introduce animation libraries unless there is a clear need.
7. Do not use Framer Motion for basic entrances, hover, loading, or route transitions.
8. Do not animate expensive CSS properties.

## Current Approved Motion Classes

These classes are approved for app-wide use:

- `.motion-header`
- `.route-motion`
- `.motion-surface`
- `.motion-field`
- `.motion-press`
- `.motion-reveal`
- `.motion-pop`
- `.motion-pulse`
- `.motion-shimmer`
- `.motion-stagger`
- `.message-bubble`
- `.paid-badge`

## Current Approved Keyframes

These keyframes are approved:

- `hc-route-in`
- `hc-rise`
- `hc-drop-in`
- `hc-bar-arrive`
- `hc-pop`
- `hc-message-in`
- `hc-soft-pulse`
- `hc-shimmer`

## Anti-Patterns

Do not add:

- Bounce or elastic easing.
- Decorative wiggles.
- Infinite motion on non-loading UI.
- Large page slides.
- Layout-property animations.
- Motion that delays task completion.
- Motion that hides slow data loading.
- Inconsistent one-off durations.
- New timing values when an existing token works.

## Rollout Checklist For Every Frontend Page

For each page:

- Page content is inside the route transition.
- Main interactive controls use `.motion-press`.
- Form fields use `.motion-field`.
- Cards and panels use `.motion-surface`.
- Loading states avoid abrupt content jumps.
- Empty, success, and error states have purposeful entrance motion.
- No layout properties are animated.
- Reduced-motion behavior remains safe.
