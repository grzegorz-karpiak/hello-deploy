# Hello Deploy

**Hello Deploy** - a small, reusable demonstration application for exercising CI/CD and deployment pipelines. It is built to be built: version, build ID, commit and timestamp are injected at build time and shown on the page, so you can verify exactly what reached the environment. Small enough to explain on a slide during a training session, generic enough to reuse as a template for your own service.

## Overview

Hello Deploy is a single-page application built with HTML5, CSS3 and vanilla JavaScript - no frameworks, no build tools, no external dependencies. It serves three purposes:

- **CI/CD pipeline testing** - a real image with real build metadata to push through build, tag, scan, deploy and verify stages.
- **Training and conference demos** - compact enough to walk through in minutes, with visible proof that a new deployment is live.
- **Template for other projects** - clone it, change the build args, replace `src/`, and keep the hardening in `Dockerfile`, `nginx.conf` and `compose.yaml`.

Under the hood it demonstrates:

- **Containerization**: single-stage Docker build with security hardening
- **Deployment**: platform-agnostic (Kubernetes, Docker Swarm, Nomad, Cloud Run, Fly.io, etc.)
- **Observability**: health check, build metadata, container-native logging
- **Security**: non-root user, read-only filesystem, CSP, security headers, capability dropping

## Features

- Single-page application with semantic HTML5
- Light/dark theme with CSS variables and localStorage persistence
- Build metadata injected at container build time (version, build ID, commit, timestamp, environment)
- Nginx on port 8080 (non-root user)
- Health check endpoint at `/health`
- Read-only filesystem compatible with tmpfs for `/tmp`
- Zero external dependencies, zero platform-specific references
- MIT license

## Quick Start

### Using Docker Compose (recommended for local development)

```bash
docker compose up --build
```

Then visit http://localhost:8080

### Using Docker directly

```bash
# Build with custom metadata
docker build \
  --build-arg APP_VERSION=1.0.0 \
  --build-arg BUILD_ID=build-$(date +%s) \
  --build-arg GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo unknown) \
  --build-arg BUILD_TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ) \
  --build-arg APP_ENV=production \
  -t hello-deploy:latest .

# Run with security hardening
docker run -d \
  -p 8080:8080 \
  --read-only \
  --tmpfs /tmp \
  --security-opt no-new-privileges=true \
  --cap-drop ALL \
  hello-deploy:latest
```

## Build Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `APP_VERSION` | Semantic version (e.g., `1.0.0`, `2.3.0-beta.1`) | `1.0.0` |
| `BUILD_ID` | Unique build identifier, e.g. a CI run number | `local` |
| `GIT_COMMIT` | Commit SHA of the source being built | `unknown` |
| `BUILD_TIMESTAMP` | ISO 8601 build time | `unknown` |
| `APP_ENV` | Environment name | `production` |

Pass simple CI-safe tokens as build args - no quotes or backslashes, since metadata is written into JSON with `printf`.

## API Endpoints

| Endpoint | Description | Cache Policy |
|----------|-------------|--------------|
| `GET /` | Main HTML page | `no-cache, no-store, must-revalidate` |
| `GET /health` | Health check (returns `ok`) | `no-cache` |
| `GET /build-info.json` | Build metadata | `no-cache, no-store, must-revalidate` |
| `GET /style.css` | Stylesheet | `public, max-age=300, must-revalidate` |
| `GET /app.js` | Application script | `public, max-age=300, must-revalidate` |

## Security

- Runs as non-root user `nginx` (UID 101)
- Listens on unprivileged port 8080
- Read-only root filesystem with tmpfs for `/tmp`
- All capabilities dropped (`--cap-drop ALL`); none added - the non-root master process never changes user or file ownership
- `no-new-privileges` security option
- Content Security Policy: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'`
- Security headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`
- Server tokens hidden (`server_tokens off`)

See [SECURITY.md](SECURITY.md) for vulnerability reporting and security details.

## Project Structure

```
hello-deploy/
├── src/                    # Application source files
│   ├── index.html          # Main HTML document
│   ├── style.css           # Complete styling with light/dark themes
│   ├── app.js              # Theme toggle, metadata fetch, runtime info
│   └── build-info.json     # Reference metadata (regenerated at image build)
├── Dockerfile              # Single-stage secure build
├── nginx.conf              # Hardened nginx configuration
├── compose.yaml            # Local development with security settings
├── .dockerignore           # Minimal build context
├── .gitignore              # Standard ignores
├── README.md               # This file
├── CHANGELOG.md            # Version history
├── CONTRIBUTING.md         # Contribution guidelines
├── SECURITY.md             # Security policy
├── LICENSE                 # MIT license
```

## Deployment

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hello-deploy
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hello-deploy
  template:
    metadata:
      labels:
        app: hello-deploy
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 101
        fsGroup: 101
      containers:
      - name: hello-deploy
        image: hello-deploy:latest
        ports:
        - containerPort: 8080
        securityContext:
          readOnlyRootFilesystem: true
          allowPrivilegeEscalation: false
          capabilities:
            drop: ["ALL"]
        volumeMounts:
        - name: tmp
          mountPath: /tmp
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 3
          periodSeconds: 10
      volumes:
      - name: tmp
        emptyDir: {}
```

### Docker Swarm / Nomad / Cloud Run / Fly.io

The image is fully platform-agnostic. Configure:
- Port: `8080`
- Health check: `GET /health`
- Read-only filesystem + `/tmp` volume
- Capabilities: drop all; none required (non-root master, unprivileged port)

## Development

### Prerequisites

- Docker 24+
- Docker Compose v2+

The base image is not pinned by digest, so builds pick up the latest `nginx:stable-alpine`. Pin it to a digest if you need reproducible images.

### Local Development

```bash
# Start the application
docker compose up --build

# View logs
docker compose logs -f

# Stop
docker compose down
```

### Testing

```bash
# Build with custom args
docker build --build-arg APP_VERSION=1.2.3 -t hello-deploy:test .

# Run with the same hardening as production
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp \
  --security-opt no-new-privileges=true --cap-drop ALL \
  hello-deploy:test

# Verify endpoints
curl http://localhost:8080/health
curl http://localhost:8080/build-info.json
```

## Author

Created by **Grzegorz Karpiak** - [karpiak.eu](https://karpiak.eu/) · [GitHub](https://github.com/grzegorz-karpiak) · [grzegorz@karpiak.pl](mailto:grzegorz@karpiak.pl)

## License

MIT - see [LICENSE](LICENSE) for details.