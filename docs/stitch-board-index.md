# Herafy Stitch Board Index

Date: 2026-06-24

Project: `Herafy`

Project ID: `12602502443816082981`

Design system: `assets/12265232380916437864`

Canonical tracker: `docs/stitch-design-tracker.md`

## Board Layout

Use this order when visually organizing the Stitch project board. Each batch should be a vertical column, with screens ordered top-to-bottom as listed.

## Batch 0: Foundation

| Order | Item | Asset |
|---:|---|---:|
| 0.1 | Herafy design system | `assets/12265232380916437864` |

## Batch 1: Public Discovery

| Order | Route / State | Screen ID |
|---:|---|---:|
| 1.1 | `/` landing page | `31c5e04935374af28a622f39d483e1ad` |
| 1.2 | `/search` default/results | `6b39879fd3f34c398c2a240f3313f953` |
| 1.3 | `/search` empty state | `a9b62491998b4bc388cc7219b969a3fc` |
| 1.4 | `/search` loading/error states | `f4b0cce6cf6846e7a86646a291387119` |
| 1.5 | `/providers/:id` profile | `4648ca4ce4494ba99f4b92c106c7b2d7` |
| 1.6 | `/providers/:id` unavailable | `96af567191fc4a8db2a00da6d74db6e8` |
| 1.7 | `/providers/:id` WhatsApp revealed | `e1a1f6a355ff4051ac471ddb31277e46` |
| 1.8 | `/providers/:id` quick message | `350a1dabdecf4d6fb147d1d49c4cc50c` |

## Batch 2: Auth And Provider Onboarding

| Order | Route / State | Screen ID |
|---:|---|---:|
| 2.1 | `/login` | `e51d1cc0652b46688e3871986feeffc2` |
| 2.2 | `/register` customer | `bf15e02435bb40e19a834ed162095437` |
| 2.3 | `/join-provider` provider | `a309878ab20a437696185af08c1dff48` |
| 2.4 | Provider identity upload | `e74750ba52e247f49e87751618b8d93a` |
| 2.5 | Registration validation states | `04ec9cdb8e9042e5b8589f6892fd15f8` |
| 2.6 | `/pending` provider pending | `2e62bd4a9a124c32a53e56502364142a` |
| 2.7 | `/pending` provider rejected | `b3a7f0e2d3d84e98ad31d1cc56c91761` |

## Batch 3: Customer Messaging And Reviews

| Order | Route / State | Screen ID |
|---:|---|---:|
| 3.1 | `/messages` list | `9d26913dae78419abd9675ad70d216ff` |
| 3.2 | `/messages` empty | `2feeac495ef948a5be611f083f1df801` |
| 3.3 | `/messages/:id` thread | `597f01dd55ce45b783bca072cdf4cb71` |
| 3.4 | Message report affordance | `b08b511bbda944f089512eebce8b7ff2` |
| 3.5 | `/reviews/new/:providerId` | `0f7ea6876f1e41bc89880c7f9d46c3b7` |
| 3.6 | Review not eligible | `a4fe1a2b09794b00aaf173e8de788f70` |

## Batch 4: Provider Workspace

| Order | Route / State | Screen ID |
|---:|---|---:|
| 4.1 | `/dashboard` | `d46967d625b844f6965f96336bf78832` |
| 4.2 | `/profile/edit` | `6af6694757594a7c869adcf2b588abe2` |
| 4.3 | `/visibility` | `b8544858ae7e407185bf5caa913f9088` |
| 4.4 | Area expansion eligible | `c558bde581e6493797b25372ab983d3a` |
| 4.5 | Area expansion locked | `59ee9653ad544ff3af6cde60480bdd2e` |
| 4.6 | Visibility request history | `6e57c7f21e3140e5a30fdde31ae72ddd` |
| 4.7 | Visibility status variants | `bc779dba281441d09fd04468de4bcfac` |

## Batch 5: Admin Workspace

| Order | Route / State | Screen ID |
|---:|---|---:|
| 5.1 | `/admin` | `9e7f1f4cb3e8420abaa5cf0f25f42d33` |
| 5.2 | `/admin/applications` | `6f001f69613847a5becdf76f40c74237` |
| 5.3 | `/admin/providers` | `8ee53e8d34d84cb495eef2d53b31ee2b` |
| 5.4 | `/admin/professions` | `8e56a4c863d640919001cd62a7357028` |
| 5.5 | `/admin/visibility` | `201e8a1666234b88b120cd389f6ecec4` |
| 5.6 | `/admin/reports` | `d07c60235aa1443dad94d3a3b4aa1b66` |
| 5.7 | `/admin/actions` | `a25161de00d243f58d58c0dd66b5fd22` |
| 5.8 | Admin empty/loading/error states | `e84a00bdc87b42a6aa66a7e225565dda` |

## Batch 6: Shared Component Boards

| Order | Component Board | Screen ID |
|---:|---|---:|
| 6.1 | App header and top nav | `625fb9c5b74245439e86625083ce8ea3` |
| 6.2 | Auth layout | `051c5710d60e48a98a7a15c787c5adbd` |
| 6.3 | Provider/admin workspace shell | `b541ebd4b5554bbd918c4cbffa26805a` |
| 6.4 | Page intro, cards, stat tiles | `c7918fb94e5d4c85a4f90360af338a81` |
| 6.5 | Provider cards | `998101cd1ac9419db5021aa6e8c44abf` |
| 6.6 | Reviews and messages | `82b18cb7e5a24bb5a31a4cf16242e09b` |
| 6.7 | Admin list items | `abf12e9e0f864d51b39242ae36226adc` |
| 6.8 | Forms and states | `4fc2fca993b44da9a9d1f96353a1d5ed` |

## Verification

- `docs/stitch-design-tracker.md` is the proof source for screenshot paths and review notes.
- All 44 screen IDs in this index resolved through Stitch `get_screen` on 2026-06-24.
- The exposed Stitch SDK does not currently provide a board-position/layout mutation API, so this file defines the canonical visual ordering for manual board arrangement or future API-based layout tooling.
