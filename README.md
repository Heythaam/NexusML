# NexusML

NexusML is an ML lifecycle management platform: trigger and monitor training pipelines
(Airflow), browse a model registry and promote model versions (MLflow), and manage
platform integrations, credentials, users, and audit trails — all behind a single
Angular UI and a Spring Cloud microservices backend, secured with Keycloak.

> **Status:** active development. The identity, pipeline, and model services are wired
> end-to-end to the frontend; the dashboard, monitoring, and datasets pages are currently
> UI-only (static data), pending their own backend services. See
> [`nexusml-frontend/README.md`](nexusml-frontend/README.md) for the frontend's own,
> more detailed status notes.

## Architecture

```
                                   ┌─────────────────────┐
                                   │      Keycloak        │  AuthN/AuthZ (JWT, roles)
                                   │  (not in this repo)  │
                                   └──────────┬───────────┘
                                              │ issuer / JWKS
┌───────────────┐   ng serve :4300  ┌────────▼────────┐
│ nexusml-       │ ───────────────► │ nexusml-gateway   │  :8085
│ frontend       │ ◄─────────────── │ (Spring Cloud      │  Reactive gateway,
│ (Angular 18)   │      REST/JSON   │  Gateway, WebFlux)  │  JWT validation, CORS,
└───────────────┘                   └─────────┬──────────┘  routes /api/** downstream
                                              │
              ┌───────────────────────────────┼────────────────────────────────┐
              │                               │                                │
     ┌────────▼─────────┐          ┌─────────▼──────────┐          ┌──────────▼─────────┐
     │ nexusml-identity- │          │ nexusml-pipeline-   │          │ nexusml-model-      │
     │ service    :8081  │          │ service      :8082  │          │ service      :8083  │
     │ users · credentials│         │ Airflow client       │          │ MLflow client        │
     │ (AES-256) · audit  │         │ trigger/monitor DAGs │          │ registry · experiments│
     │ · integration config│        │                      │          │ · promotion workflow │
     └────────┬───────────┘         └─────────┬────────────┘          └──────────┬──────────┘
              │        RabbitMQ (integration.updated / audit events)             │
              └───────────────────────────────┬───────────────────────────────────┘
                                              │
                       ┌──────────────────────┼──────────────────────┐
                       │                                              │
              ┌────────▼─────────┐                          ┌────────▼─────────┐
              │ nexusml-discovery-│                          │ nexusml-config-   │
              │ server (Eureka)   │  service registry        │ server            │  :8888
              │           :8761   │◄────── all services ─────│ Spring Cloud Config│
              └───────────────────┘   register here          │ (git-backed)       │
                                                               └────────┬──────────┘
                                                                        │ reads
                                                               ┌────────▼──────────┐
                                                               │ nexusml-config     │  (separate repo)
                                                               │ *.yml per service  │
                                                               └────────────────────┘
```

All five Spring Boot services register with **Eureka** (discovery) and pull their
shared, non-secret configuration from the **Config Server**, which in turn serves files
out of the [`nexusml-config`](nexusml-config) git repository. Machine-specific and
secret values (DB credentials, the Keycloak PAT, etc.) are supplied per-service via a
local `.env` file — see [Configuration](#configuration).

`nexusml-pipeline-service` and `nexusml-model-service` don't hold their Airflow/MLflow
connection details statically — on startup (and whenever an admin edits an integration
in **Settings → Integrations**) they fetch the current URL/credentials from
`nexusml-identity-service` and rebuild their HTTP clients live, kept in sync via a
RabbitMQ `integration.updated` event (`DynamicAirflowConfig` / `DynamicMLflowConfig` +
`IntegrationEventListener` in each service).

## Services

| Service | Port | Responsibility |
|---|---|---|
| [`nexusml-config-server`](nexusml-config-server) | 8888 | Spring Cloud Config Server; serves YAML from the `nexusml-config` git repo to every other service. |
| [`nexusml-discovery-server`](nexusml-discovery-server) | 8761 | Eureka service registry. |
| [`nexusml-gateway`](nexusml-gateway) | 8085¹ | Spring Cloud Gateway (WebFlux). Single entry point for the frontend; validates Keycloak JWTs, applies CORS, routes `/api/**` to the right service via load-balanced (`lb://`) URIs. |
| [`nexusml-identity-service`](nexusml-identity-service) | 8081 | Users (synced from Keycloak), AES-256-GCM encrypted credentials store, integration config (Airflow/MLflow/etc. connection settings), audit log. Publishes domain events to RabbitMQ. |
| [`nexusml-pipeline-service`](nexusml-pipeline-service) | 8082 | Airflow integration: list/trigger DAGs, poll run status, pause/fail a run, stream task logs. |
| [`nexusml-model-service`](nexusml-model-service) | 8083 | MLflow integration: model registry, versions & signatures, experiments/runs, model promotion (submit/approve/reject). |
| [`nexusml-frontend`](nexusml-frontend) | 4300 (dev) | Angular 18 UI — dashboard, pipelines, model registry, monitoring, datasets, settings. |

¹ the gateway's `SERVER_PORT` (`.env.example`) and the frontend's `apiUrl`
(`nexusml-frontend/public/config.json`) must agree — both default to `8085` here.

Each backend service is a self-contained Maven project (own `pom.xml`, `mvnw`) — there
is no parent/aggregator POM, so they're built and run independently.

## Tech stack

- **Backend:** Java 21, Spring Boot 4.1 (`spring-boot-starter-parent`), Spring Cloud
  2025.1.3 (Config, Eureka, Gateway), Spring Security (OAuth2 resource server / JWT),
  Spring Data JPA + PostgreSQL, Spring AMQP (RabbitMQ), Lombok, `springboot4-dotenv`
  (loads each service's local `.env`).
- **Frontend:** Angular 18 (NgModules, not standalone), SCSS/BEM, RxJS.
- **Auth:** Keycloak (OIDC/JWT) — not bundled in this repo, run/point to your own instance.
- **Messaging:** RabbitMQ — used for audit events and for pushing integration-config
  changes out to the services that dial Airflow/MLflow.
- **Infra-as-config:** the `nexusml-config` repo holds each service's shared
  `application.yml` fragment, versioned separately from application code.

## Repository structure

```
nexusml/
├── nexusml-config/            # Git-backed config source served by the Config Server
├── nexusml-config-server/     # Spring Cloud Config Server
├── nexusml-discovery-server/  # Eureka registry
├── nexusml-gateway/           # Spring Cloud Gateway (edge/JWT/CORS)
├── nexusml-identity-service/  # Users, credentials, integrations, audit
├── nexusml-pipeline-service/  # Airflow integration
├── nexusml-model-service/     # MLflow integration
└── nexusml-frontend/          # Angular 18 UI
```

## Prerequisites

- Java 21 + Maven (or use the bundled `./mvnw` wrapper in each service)
- Node.js 18+ and npm
- PostgreSQL (one database per data-owning service)
- RabbitMQ
- A Keycloak realm with an `nexusml-frontend` public client and `ADMIN` /
  `DATA_SCIENTIST` / `VIEWER` realm roles, exposing roles as a JWT claim named `roles`
- (Optional, for full functionality) Apache Airflow and MLflow instances to point the
  Integrations settings at

Quick local infra via Docker, if you don't already have these running:

```bash
docker run -d --name nexusml-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16
docker run -d --name nexusml-rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
docker run -d --name nexusml-keycloak -p 8180:8080 -e KEYCLOAK_ADMIN=admin -e KEYCLOAK_ADMIN_PASSWORD=admin quay.io/keycloak/keycloak:latest start-dev
```

Then create the `nexusml_identity`, `nexusml_pipeline`, and `nexusml_model` databases
in Postgres, and the `nexusml` realm in Keycloak.

## Getting started

1. **Clone and configure each service.** Every backend service ships a `.env.example`
   — copy it to `.env` in the same folder and fill in real values (DB credentials,
   RabbitMQ credentials, Keycloak issuer/JWKS URIs, etc.). `.env` is gitignored, so your
   values never get committed.

   ```bash
   for svc in nexusml-config-server nexusml-discovery-server nexusml-gateway \
              nexusml-identity-service nexusml-pipeline-service nexusml-model-service; do
     cp "$svc/.env.example" "$svc/.env"
   done
   ```

   `nexusml-config-server/.env` additionally needs `GITHUB_PAT` — a GitHub personal
   access token with read access to whichever repo `CONFIG_REPO_URI` points at (by
   default, `nexusml-config` in this same account). Point `CONFIG_REPO_URI` at your own
   fork if you're not deploying as the original author.

2. **Start the platform services in order** (each blocks its terminal — open one shell
   per service, or background them):

   ```bash
   cd nexusml-config-server    && ./mvnw spring-boot:run   # 1. config server first
   cd nexusml-discovery-server && ./mvnw spring-boot:run   # 2. then Eureka
   cd nexusml-identity-service && ./mvnw spring-boot:run   # 3. the rest, any order
   cd nexusml-pipeline-service && ./mvnw spring-boot:run
   cd nexusml-model-service    && ./mvnw spring-boot:run
   cd nexusml-gateway          && ./mvnw spring-boot:run   # 4. gateway last
   ```

   Watch each service's logs for a successful Eureka registration before starting the
   next; the config server and discovery server are hard dependencies for everything
   else (`fail-fast: true` in most `bootstrap.yml`s). On Windows, use `mvnw.cmd` instead
   of `./mvnw`.

3. **Run the frontend**, on the port the gateway's CORS config expects by default:

   ```bash
   cd nexusml-frontend
   npm install
   npm start -- --port 4300   # http://localhost:4300
   ```

   Runtime-configurable URLs (gateway, Keycloak, MLflow, Airflow) live in
   `nexusml-frontend/public/config.json`, loaded at startup — edit that file to point
   at non-default hosts/ports without rebuilding the app.

4. Open `http://localhost:4300`, log in via Keycloak, and you should land on the
   dashboard.

## Configuration

Every backend service is configured the same way: safe defaults and shared, non-secret
settings live in `nexusml-config/<service>.yml` (served by the Config Server), while
machine/environment-specific and secret values are read from a local `.env` file via
`springboot4-dotenv`. See each service's `.env.example` for the exact variable list;
summary of what each expects:

| Variable | Used by | Notes |
|---|---|---|
| `SERVER_PORT` | all | defaults shown in the [Services](#services) table |
| `CONFIG_SERVER_URI` | all except config-server | e.g. `http://localhost:8888` |
| `EUREKA_URI` | all except config/discovery | e.g. `http://localhost:8761/eureka/` |
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | identity, pipeline, model | one Postgres DB per service |
| `RABBITMQ_HOST` / `PORT` / `USERNAME` / `PASSWORD` | identity, pipeline, model | |
| `KEYCLOAK_ISSUER_URI` / `KEYCLOAK_JWK_URI` | gateway, identity, pipeline, model | |
| `ENCRYPTION_SECRET_KEY` | identity | 32-char AES-256 key used to encrypt the credentials store — **generate your own, never reuse the example** |
| `GITHUB_USERNAME` / `GITHUB_PAT` | config-server | read access to the config git repo |
| `FRONTEND_URL` | gateway | CORS allow-origin, e.g. `http://localhost:4300` |
| `AIRFLOW_URL` / `USERNAME` / `PASSWORD` | pipeline | fallback only — normally overridden live via the Integrations/Credentials UI |
| `MLFLOW_URL` | model | same — fallback for local dev |
| `IDENTITY_SERVICE_URL` | pipeline, model | where to fetch live integration config from |

**Never commit a `.env` file.** Only `.env.example` (placeholder values) belongs in
version control — this is enforced by `.gitignore` at both the repo root and inside
`nexusml-frontend`.

## API surface

The gateway exposes everything under `/api/<segment>/**` and strips the first two path
segments before forwarding, e.g. `GET /api/models/registry` → `model-service GET
/registry`. All endpoints require a valid Keycloak JWT except `/actuator/**` (health
checks); most are further restricted by realm role (`ADMIN`, `DATA_SCIENTIST`,
`VIEWER`) via `@PreAuthorize`.

| Gateway prefix | Service | Key endpoints |
|---|---|---|
| `/api/identity/users` | identity | `GET /users` (ADMIN), `POST /users/sync`, `GET /users/me` |
| `/api/identity/credentials` | identity | CRUD + `GET /{id}/decrypt` (ADMIN) |
| `/api/identity/integrations` | identity | `GET`, `GET /{id}`, `GET /{id}/url`, `PUT /{id}`, `POST /{id}/test` |
| `/api/identity/audit` | identity | `GET`, `GET /user/{username}` (ADMIN) |
| `/api/pipelines` | pipeline | `POST /trigger`, `GET`, `GET /{id}`, `GET /connection/test`, `GET /dags`, `GET /dags/{dagId}`, `GET /dags/{dagId}/runs`, `PATCH /dags/{dagId}/pause` (ADMIN), `GET /{id}/tasks/{taskId}/logs`, `POST /{id}/fail` (ADMIN), `POST /{id}/pause-dag` |
| `/api/models/registry` | model | `GET`, `GET /{modelName}/versions`, `GET /{modelName}/signature/{modelId}` |
| `/api/models/experiments` | model | `GET`, `GET /{experimentId}/runs`, `GET /runs`, `GET /runs/{runId}`, `GET /connection/test` |
| `/api/models/promotions` | model | `GET`, `GET /pending`, `POST` (submit), `POST /{id}/approve` (ADMIN), `POST /{id}/reject` (ADMIN) |

## Security model

- **AuthN:** Keycloak issues JWTs; the gateway and every downstream service validate
  them as an OAuth2 resource server against the same issuer/JWKS.
- **AuthZ:** realm roles are read from a `roles` claim, mapped to Spring `ROLE_*`
  authorities, and enforced with method-level `@PreAuthorize` on each controller.
  Three roles are used throughout: `ADMIN`, `DATA_SCIENTIST`, `VIEWER`.
- **Secrets at rest:** third-party credentials (cloud/registry/notification/storage
  keys entered in Settings → Credentials) are encrypted with AES-256-GCM
  (`EncryptionService`, key from `ENCRYPTION_SECRET_KEY`) before being persisted;
  decryption is a separate, ADMIN-only endpoint, never returned by the general list/get
  endpoints.
- **Audit trail:** integration and credential changes are recorded to an audit log,
  fanned out over RabbitMQ so other services can react without polling the DB directly.

## Known gaps / roadmap

- Dashboard, Monitoring, and Datasets pages are currently frontend-only (static mock
  data) — there's no `dataset-service` or metrics backend yet, though the gateway
  already reserves routes (`/api/datasets/**`, `/api/monitoring/**`) for them.
- No automated test suite beyond the Spring Boot/Angular scaffolding defaults.
- No CI pipeline or Dockerfiles/`docker-compose.yml` yet — see
  [Prerequisites](#prerequisites) for manual local-infra commands in the meantime.
- `nexusml-config` is tracked here as a **stale git submodule reference** (a `160000`
  gitlink pointing at [`Heythaam/nexusml-config`](https://github.com/Heythaam/nexusml-config),
  with no `.gitmodules` file to resolve it). A fresh `git clone` of this repo gets an
  **empty** `nexusml-config` folder — this only works today because the config server
  doesn't read it locally anyway (it clones `CONFIG_REPO_URI` itself at startup). Worth
  cleaning up before/soon after going public: either remove the nested checkout's
  `.git` and re-add it as real tracked files, or drop the folder from this repo entirely
  since it's redundant with the standalone `nexusml-config` repo.

## License

MIT — see [LICENSE](LICENSE).
