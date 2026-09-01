# NexusML Frontend

Angular frontend for **NexusML**, an ML lifecycle management platform (pipelines, model
registry, monitoring, datasets, and platform settings). This document describes what has
been built so far, how the codebase is organized, and how to run it.

> **Status:** UI-only. Every page is built against typed mock data defined inside its own
> component. There is no HTTP layer yet — `core/services`, `core/interceptors`, and
> `core/guards` are scaffolded but not wired to a real API. They will be connected once the
> Spring Boot backend is available.

## Tech stack

- **Angular 18**, classic `NgModule` architecture — no standalone components, so every
  component/directive/pipe is declared in a feature or shared module.
- **SCSS**, BEM-style class naming, one stylesheet per component.
- **RxJS** for cross-component communication (e.g. the toast notification stream).
- No external UI/component libraries — every visual element (buttons, cards, tables,
  toggles, toasts) is hand-built.

## Getting started

```bash
npm install
ng serve      # http://localhost:4200
ng build      # production build → dist/nexusml-frontend
```

## Project structure

```
src/app/
├── core/               # App-wide singletons, imported once via CoreModule.forRoot()
│   ├── auth/           # AuthService (stub — no real auth flow yet)
│   ├── guards/         # AuthGuard (stub — always allows navigation for now)
│   ├── interceptors/   # AuthInterceptor / ErrorInterceptor (registered, no-op)
│   ├── services/       # NotificationService (stub), LoggerService (stub), ToastService (live)
│   ├── models/         # Shared TypeScript interfaces (User, ApiResponse<T>)
│   └── layout/         # HeaderComponent, SidebarComponent, FooterComponent — the app shell
├── shared/             # Reusable, presentation-only building blocks (SharedModule)
│   ├── components/     # button, card, loader, modal (unused), toast
│   ├── directives/     # HighlightDirective (stub)
│   ├── pipes/          # TruncatePipe (stub)
│   └── utils/          # date/validators helpers (stub)
├── features/           # One NgModule per route, all lazy-loaded
│   ├── dashboard/       → /dashboard
│   ├── pipelines/       → /pipelines
│   ├── models-management/ → /models-management  (placeholder)
│   ├── monitoring/      → /monitoring            (placeholder)
│   ├── datasets/        → /datasets              (placeholder)
│   └── settings/        → /settings
├── app.module.ts        # Root module: BrowserModule + CoreModule.forRoot() + AppRoutingModule
├── app-routing.module.ts
└── app.component.*      # Shell layout: header + sidebar + <router-outlet> + footer
```

Each feature module owns a `*-routing.module.ts` with its own child routes, so new
sub-pages can be added inside a feature without touching `app-routing.module.ts`.

## Theming

All color, spacing-radius, and shadow values live in `src/styles.scss` as CSS custom
properties, defined once for light mode (`:root`) and overridden for dark mode
(`body.dark-theme`). **No component ever hardcodes a color** — everything reads from a
variable, so a full re-theme (as happened once already, indigo → cyan) only requires
editing `styles.scss`.

Key variable groups:

| Group | Examples |
|---|---|
| Surfaces | `--bg-primary`, `--bg-secondary`, `--bg-card` |
| Text | `--text-primary`, `--text-secondary`, `--text-muted`, `--text-inverse` |
| Borders / shadows | `--border`, `--border-strong`, `--shadow`, `--shadow-md` |
| Accent | `--accent`, `--accent-hover`, `--accent-tint`, `--accent-tint-strong` |
| Status | `--success` / `--warning` / `--danger` (+ their `-tint` variants) |
| Shape | `--radius-sm` (6px), `--radius` (8px), `--radius-lg` (12px) |
| Misc | `--overlay` (modal/panel backdrop), `--purple` / `--purple-tint` (decorative accent) |

**Dark mode is the default.** On bootstrap, `AppComponent.ngOnInit()` reads
`localStorage['theme']`; if nothing is stored it defaults to dark and persists that
choice. `HeaderComponent`'s pill toggle reads/writes the same `'theme'` key and flips
`document.body.classList` — the two must stay in sync on that key.

## App shell (`core/layout`)

- **Header** — fixed top bar (60px): logo mark + wordmark, a sliding pill theme toggle,
  and a user avatar placeholder.
- **Sidebar** — fixed left rail (240px, collapses to a 64px icon rail under 1024px):
  `routerLink` navigation to all six features, active-item highlighting, a divider above
  Settings, and a version label pinned to the bottom.
- **Footer** — simple centered copyright bar.
- `AppComponent` composes all three around `<router-outlet>` with the matching
  margin/padding offsets.

## Features implemented

### Dashboard (`/dashboard`)
Stat cards (active pipelines, models deployed, experiments, storage used), a Recent
Pipelines table with status badges, and a Recent Activity feed. All data is static
arrays on `DashboardComponent`.

### Pipelines (`/pipelines`)
A filterable table (search + status + owner, combined with AND logic via a
`filteredPipelines` getter) over 10 mock `Pipeline` records. Clicking a row slides in a
400px detail panel (CSS `transform`, no animation library) showing pipeline details, tags,
and a derived per-task progress checklist. Row actions (Run/Pause/Delete) and the detail
panel's actions are wired but intentionally no-op — there's no backend yet.

### Settings (`/settings`)
- **Integrations** — 6 mock `IntegrationConfig` cards (Airflow, MLflow, Prometheus,
  Grafana, Kubernetes, Slack). Editing a URL/port marks its card dirty (accent left
  border); "Test connection" simulates a 1.5s check that randomly resolves to
  connected/error; "Save All Changes" is disabled until something is dirty and simulates
  an 800ms save before clearing dirty state and firing a toast.
- **Credentials Store** — masked mock credential list (edit/delete are stubs).
- **Role Management** — mock role list with user counts.
- **Recent Audit Events** — static mock activity feed.

Placeholder features (`models-management`, `monitoring`, `datasets`) are routed and
lazy-loaded but not yet built out.

## Shared components (`shared/components`)

| Component | Selector | Notes |
|---|---|---|
| Button | `<app-button>` | `variant`: `primary` \| `secondary` \| `danger`; `fullWidth` input; emits `clicked` |
| Card | `<app-card>` | Optional `title` input, otherwise pure `ng-content` wrapper; hover raises `--shadow-md` |
| Loader | `<app-loader>` | 24px CSS spinner, accent-colored |
| Toast | `<app-toast>` | Subscribes to `ToastService.toast$`; auto-dismisses after 3s with a fade-out. Mounted directly in `settings.component.html` (the only place it's currently triggered from) |
| Modal | `<app-modal>` | Scaffolded, not yet implemented |

`ToastService` (`core/services/toast.service.ts`) is a `providedIn: 'root'` singleton
with a single `show(message, type: 'success' | 'error')` method — inject it anywhere and
call `show()`; no need to also place `<app-toast>` unless that page should render it.

## Known gaps / next steps

- No HTTP client usage anywhere — `core/interceptors` and `core/services` are stubs
  waiting on the backend.
- No unit test coverage beyond the generated `AppComponent` spec.
- `models-management`, `monitoring`, and `datasets` are empty placeholder pages.
- `AuthGuard` always returns `true`; there is no real authentication flow yet.
