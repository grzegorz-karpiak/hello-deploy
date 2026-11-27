# Security Policy

For vulnerability reporting, contact the project maintainers or open a private report on
GitHub. Please do not disclose vulnerabilities in a public issue before a fix
is available.

## Security Features

### Container Hardening
- **Non-root user**: Runs as `nginx` (UID 101)
- **Unprivileged port**: Listens on 8080
- **Read-only root filesystem**: With `tmpfs /tmp`
- **Capability dropping**: All capabilities dropped, none added; the non-root
  master process never changes user or file ownership
- **No new privileges**: `--security-opt no-new-privileges=true`

### Application Security
- **Content Security Policy**: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'self'; base-uri 'none'; frame-ancestors 'none'`
- **Security headers**: `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`
- **Hidden server tokens**: `server_tokens off`

### Build-Time Security
- **No shell eval**: Build metadata generated with `printf`, never `eval`
- **CI-safe values**: Pass simple tokens as build args (no quotes or backslashes)
- **No secrets in image**: No runtime environment variables with sensitive data

### Network
- **No outbound connections**: Application makes no external requests
- **Health endpoint only**: `/health` returns static `ok`

## Known Limitations
- **No TLS termination**: Terminate TLS at ingress/load balancer
- **No rate limiting**: Implement at ingress/load balancer
- **No authentication**: This is a public Hello World demo
- **Static content only**: No dynamic backend, no user data

## Security Checklist for Deployments
- [ ] Run with `--read-only --tmpfs /tmp`
- [ ] Drop all capabilities (`--cap-drop ALL`); add none
- [ ] Enable `--security-opt no-new-privileges=true`
- [ ] Terminate TLS at ingress (do not run nginx with certs in container)
- [ ] Verify CSP headers in production: `curl -I https://your-domain/`
- [ ] Monitor `/health` endpoint for availability