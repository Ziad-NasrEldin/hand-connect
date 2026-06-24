# Herafy Stitch Design Tracker

Date: 2026-06-24

Stitch project: `Herafy`

Project ID: `12602502443816082981`

Design system: `Herafy Arabic Mobile Design System`

Design system asset: `assets/12265232380916437864`

Design system update session: `projects/12602502443816082981/sessions/14911962102204333698`

Local design authority: `DESIGN.md`

Source sitemap: `docs/final-sitemap.md`

Board index/order: `docs/stitch-board-index.md`

## Locked Direction

- First pass is Arabic-only.
- First pass is mobile-first.
- English variants come later, after Arabic approval.
- Desktop/tablet variants come later, after mobile approval.
- Each screen is generated and reviewed individually before moving to the next.
- Do not introduce booking, checkout, escrow, job assignment, price guarantees, or guaranteed outcomes.

## Batch 0: Foundation

| Item | Stitch ID / Asset | Status | Notes |
|---|---:|---|---|
| Herafy `DESIGN.md` | Local file | Done | Current-source design brief created from implemented tokens, sitemap, and Arabic-first product rules. |
| Tailwind export | `tailwind.theme.json` | Done | Generated from `DESIGN.md`. |
| DTCG export | `tokens.json` | Done | Generated from `DESIGN.md`. |
| Stitch design system | `12265232380916437864` | Done | Created and updated in Stitch project. |

## Batch 1: Public Discovery, Arabic Mobile

| Route / State | Stitch Screen ID | Status | Notes |
|---|---:|---|---|
| `/` landing page | `31c5e04935374af28a622f39d483e1ad` | Review ready | Revised once to remove invented bottom tab/account shell. Includes hero, direct discovery CTAs, feature cards, secondary info panel, and product-boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-landing-revised.png`. |
| `/search` default/results | `6b39879fd3f34c398c2a240f3313f953` | Review ready | Includes PageIntro, profession/area filters, location helper note, three provider cards, featured badge, and profile-only CTAs. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-search-results.png`. |
| `/search` empty state | `a9b62491998b4bc388cc7219b969a3fc` | Review ready | Shows selected filters, no-results empty state, edit/search-location CTAs, and direct-contact product boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-search-empty.png`. |
| `/search` loading/error states | `f4b0cce6cf6846e7a86646a291387119` | Review ready | Reference screen for disabled/loading filters, provider skeletons, retry error, profession fallback chips, location denial/unavailable copy, and boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-search-states.png`. |
| `/providers/:id` profile | `4648ca4ce4494ba99f4b92c106c7b2d7` | Review ready | Includes paid-highlight provider hero, service areas, coverage radius, no-guarantee note, WhatsApp/message CTAs, report link, quick contact cards, and reviews. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-provider-profile.png`. |
| `/providers/:id` unavailable | `96af567191fc4a8db2a00da6d74db6e8` | Review ready | Calm EmptyState with return-to-search CTA, edit search CTA, warm illustration, and product-boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-provider-unavailable.png`. |
| `/providers/:id` WhatsApp revealed | `e1a1f6a355ff4051ac471ddb31277e46` | Review ready | Shows revealed phone, open WhatsApp CTA, copy number action, in-app message alternative, reviews preview, and boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-provider-whatsapp-revealed.png`. |
| `/providers/:id` quick message | `350a1dabdecf4d6fb147d1d49c4cc50c` | Review ready | Shows provider summary, warm textarea with default message, subtle validation hint, start conversation CTA, WhatsApp alternative, boundary note, and trust strip. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-provider-quick-message.png`. |

## Batch 2: Auth And Provider Onboarding, Arabic Mobile

| Route / State | Stitch Screen ID | Status | Notes |
|---|---:|---|---|
| `/login` | `e51d1cc0652b46688e3871986feeffc2` | Review ready | Arabic mobile auth card with email/password, Google login, subtle error placeholder, register link, support note, and product-boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-login.png`. |
| `/register` customer | `bf15e02435bb40e19a834ed162095437` | Review ready | Customer registration mode visually reviewed against the current auth contract; includes required phone field and no out-of-scope booking/checkout flow. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-register-customer.png`. |
| `/join-provider` provider | `a309878ab20a437696185af08c1dff48` | Review ready | Provider registration mode with required profession, area, WhatsApp, and identity upload fields; includes manual-review and no-guarantee boundary notes. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-join-provider.png`. |
| Provider identity upload | `e74750ba52e247f49e87751618b8d93a` | Review ready | Revised once to remove invented authenticated nav shell. Shows selected identity file, upload actions, 3MB/manual-review helper text, admin review steps, and no-guarantee boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-provider-identity-upload-revised.png`. |
| Registration validation states | `04ec9cdb8e9042e5b8589f6892fd15f8` | Review ready | Component board for short password, password mismatch, missing identity document, and identity file too large states. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-registration-validation-states.png`. |
| `/pending` provider pending | `2e62bd4a9a124c32a53e56502364142a` | Review ready | Provider application pending state with current status, review steps, provider summary, refresh/logout actions, manual identity review copy, and no-guarantee boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-pending-provider.png`. |
| `/pending` provider rejected | `b3a7f0e2d3d84e98ad31d1cc56c91761` | Review ready | Revised after an earlier attempt used an English wordmark. Arabic-only rejected provider application state with rejection reason, review steps, resend/logout actions, and no-guarantee boundary note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-pending-provider-rejected-revised.png`. |

## Batch 3: Customer Messaging And Reviews, Arabic Mobile

| Route / State | Stitch Screen ID | Status | Notes |
|---|---:|---|---|
| `/messages` list | `9d26913dae78419abd9675ad70d216ff` | Review ready | Conversation list with Arabic RTL rows, unread state, provider avatars, message snippets, and no booking/payment language. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch3/messages-list-9d26913dae78419abd9675ad70d216ff.png`. |
| `/messages` empty | `2feeac495ef948a5be611f083f1df801` | Review ready | Empty messages state with browse-provider CTA framed as discovery/contact only. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch3/messages-empty-2feeac495ef948a5be611f083f1df801.png`. |
| `/messages/:id` thread | `597f01dd55ce45b783bca072cdf4cb71` | Review ready | Conversation thread with Arabic message bubbles, compose field, send action, and no booking/payment flow. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch3/messages-thread-597f01dd55ce45b783bca072cdf4cb71.png`. |
| Message report affordance | `b08b511bbda944f089512eebce8b7ff2` | Review ready | Message action sheet with copy/report/cancel actions and restrained moderation helper text. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch3/message-report-affordance-b08b511bbda944f089512eebce8b7ff2.png`. |
| `/reviews/new/:providerId` | `0f7ea6876f1e41bc89880c7f9d46c3b7` | Review ready | Review form with provider summary, star rating, comment textarea, quality chips, and community-guideline note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch3/reviews-new-provider-0f7ea6876f1e41bc89880c7f9d46c3b7.png`. |
| Review not eligible | `a4fe1a2b09794b00aaf173e8de788f70` | Review ready | Not-eligible review state explaining review access requires documented contact, with return/message actions only. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch3/review-not-eligible-a4fe1a2b09794b00aaf173e8de788f70.png`. |

## Batch 4: Provider Workspace, Arabic Mobile

| Route / State | Stitch Screen ID | Status | Notes |
|---|---:|---|---|
| `/dashboard` | `d46967d625b844f6965f96336bf78832` | Review ready | Provider workspace dashboard with operational metrics, messages, profile/visibility actions, and no-guarantee note. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch4/dashboard_d46967d625b844f6965f96336bf78832.png`. |
| `/profile/edit` | `6af6694757594a7c869adcf2b588abe2` | Review ready | Provider profile edit form with service details, WhatsApp/contact fields, identity/document area, and preview/save actions. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch4/profile_edit_6af6694757594a7c869adcf2b588abe2.png`. |
| `/visibility` | `b8544858ae7e407185bf5caa913f9088` | Review ready | Manual visibility request screen with current organic state, current areas, pending request, no-guarantee copy, and submit/history actions. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch4/visibility_b8544858ae7e407185bf5caa913f9088.png`. |
| Area expansion eligible | `c558bde581e6493797b25372ab983d3a` | Review ready | Eligible area expansion state with current/new areas, reason field, manual-review note, and no guaranteed customer language. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch4/area_expansion_eligible_c558bde581e6493797b25372ab983d3a.png`. |
| Area expansion locked | `59ee9653ad544ff3af6cde60480bdd2e` | Review ready | Locked area expansion state with prerequisites and edit/status actions, without payment-to-unlock or guarantee language. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch4/area_expansion_locked_59ee9653ad544ff3af6cde60480bdd2e.png`. |
| Visibility request history | `6e57c7f21e3140e5a30fdde31ae72ddd` | Review ready | Visibility request history with status filters, request rows, admin notes, and no-guarantee disclosure. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch4/visibility_request_history_6e57c7f21e3140e5a30fdde31ae72ddd.png`. |
| Visibility status variants | `bc779dba281441d09fd04468de4bcfac` | Review ready | Reference board for organic, pending, admin-confirmed, needs-info, rejected, and ended visibility states. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch4/visibility_status_variants_bc779dba281441d09fd04468de4bcfac.png`. |

## Batch 5: Admin Workspace, Arabic Mobile

| Route / State | Stitch Screen ID | Status | Notes |
|---|---:|---|---|
| `/admin` | `9e7f1f4cb3e8420abaa5cf0f25f42d33` | Review ready | Admin overview with moderation KPIs, quick actions, warning note, and no service guarantee language. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch5/01-admin.png`. |
| `/admin/applications` | `6f001f69613847a5becdf76f40c74237` | Review ready | Provider application review queue with filters, applicant cards, document status, risk flags, and review/request-info/reject actions. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch5/02-admin-applications.png`. |
| `/admin/providers` | `8ee53e8d34d84cb495eef2d53b31ee2b` | Review ready | Provider moderation list with verification/profile/visibility/report context and suspend/reactivate actions. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch5/03-admin-providers.png`. |
| `/admin/professions` | `8e56a4c863d640919001cd62a7357028` | Review ready | Profession management board with active/inactive toggles, counts, reorder affordance, add action, and discovery-label framing. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch5/04-admin-professions.png`. |
| `/admin/visibility` | `201e8a1666234b88b120cd389f6ecec4` | Review ready | Manual visibility/payment-proof moderation screen with confirm/reject/request-clearer-receipt actions and no lead/outcome guarantee copy. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch5/05-admin-visibility.png`. |
| `/admin/reports` | `d07c60235aa1443dad94d3a3b4aa1b66` | Review ready | Abuse report queue with severity chips, complaint excerpts, SLA context, and open/note/escalate/close actions. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch5/06-admin-reports.png`. |
| `/admin/actions` | `a25161de00d243f58d58c0dd66b5fd22` | Review ready | Audit log with admin actor, timestamp, action type, affected target, before/after status chips, and filters. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch5/07-admin-actions.png`. |
| Admin empty/loading/error states | `e84a00bdc87b42a6aa66a7e225565dda` | Review ready | Reference board for admin empty state, loading skeleton, and retryable error state. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch5/08-admin-states.png`. |

## Batch 6: Shared Component Boards, Arabic Mobile

| Component Board | Stitch Screen ID | Status | Notes |
|---|---:|---|---|
| App header and top nav | `625fb9c5b74245439e86625083ce8ea3` | Review ready | Shared header/top-nav component board with brand/header/search/tab states. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch6/01-app_header_top_nav-625fb9c5b74245439e86625083ce8ea3.png`. |
| Auth layout | `051c5710d60e48a98a7a15c787c5adbd` | Review ready | Parent-revised board to remove OTP/code-box content and invented bottom nav; matches current email/password + Google auth, provider fields, validation, and minimal auth shell. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch6/02-auth_layout_revised_final-051c5710d60e48a98a7a15c787c5adbd.png`. |
| Provider/admin workspace shell | `b541ebd4b5554bbd918c4cbffa26805a` | Review ready | Shared provider/admin workspace shell board with mobile nav, identity/status cards, tabs, and action areas. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch6/03-workspace_shell-b541ebd4b5554bbd918c4cbffa26805a.png`. |
| Page intro, cards, stat tiles | `c7918fb94e5d4c85a4f90360af338a81` | Review ready | Page-intro/card/stat-tile board with hierarchy, metric states, notes, and compact mobile layout. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch6/04-intro_stats_tiles-c7918fb94e5d4c85a4f90360af338a81.png`. |
| Provider cards | `998101cd1ac9419db5021aa6e8c44abf` | Review ready | Provider-card component board for search/profile card variants with rating, verification, area, and profile-only CTAs. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch6/05-provider_cards-998101cd1ac9419db5021aa6e8c44abf.png`. |
| Reviews and messages | `82b18cb7e5a24bb5a31a4cf16242e09b` | Review ready | Reviews/messages component board with review item, star rating, inbound/outbound bubbles, read state, composer, and empty/loading states. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch6/06-reviews_messages-82b18cb7e5a24bb5a31a4cf16242e09b.png`. |
| Admin list items | `abf12e9e0f864d51b39242ae36226adc` | Review ready | Admin list-item component board regenerated after an empty screenshot URL; includes provider/report/application/action rows and status/action states. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch6/07-admin_list_items-abf12e9e0f864d51b39242ae36226adc.png`. |
| Forms and states | `4fc2fca993b44da9a9d1f96353a1d5ed` | Review ready | Forms/states component board with inputs, selects, toggles, upload row, focus/error/disabled/success states, empty state, skeleton, and badges. Screenshot proof: `/var/folders/b3/v4_9c_2n163g0q8bz_d235t80000gn/T/opencode/herafy-stitch-workers/batch6/08-forms_states-4fc2fca993b44da9a9d1f96353a1d5ed.png`. |

## Implementation Verification Log

| Slice | Routes / States | Implementation Status | Verification Proof | Notes |
|---|---|---|---|---|
| Batch 1 public discovery | `/`, `/search` default/results, denied geolocation helper, `/providers/:id` profile before explicit contact | Verified | `npx playwright test tests/e2e/app.spec.ts --grep "Arabic RTL landing|search handles denied|provider profile stays"` PASS, 6 tests across `chromium` and `mobile-chrome`, 2026-06-24. | Verified RTL landing/search flow, mobile filter stacking, no horizontal overflow, no forbidden marketplace CTAs, provider profile contact controls, and hidden WhatsApp number before reveal. Local temp screenshot files referenced above were not present when re-scanned in this session, so this proof is route/browser verification rather than screenshot-file proof. |
