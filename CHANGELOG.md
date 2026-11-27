# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-11-27

### Added
- Initial release: Hello Deploy reference implementation
- Single-page HTML5 application with semantic structure
- Light/dark theme with CSS custom properties and localStorage persistence
- Vanilla JavaScript (IIFE script) for theme toggle, metadata fetch, runtime info display
- Build metadata injection via Docker ARGs (APP_VERSION, BUILD_ID, GIT_COMMIT, BUILD_TIMESTAMP, APP_ENV)
- Hardened nginx configuration on port 8080 (non-root user)
- Security headers: CSP, X-Content-Type-Options, Referrer-Policy
- Health check endpoint at `/health`
- Read-only filesystem compatibility with tmpfs for `/tmp`
- Docker Compose for local development with security hardening
- MIT license with author attribution

### Security
- Runs as nginx user (UID 101)
- All capabilities dropped; none added
- no-new-privileges security option
- Content Security Policy without 'unsafe-inline'

### Deployment
- Platform-agnostic: Docker, Kubernetes ready
- Health check and readiness probe compatible
- Explicit cache policies: no-store for HTML/JSON, no-cache for `/health`, 5-min for static assets