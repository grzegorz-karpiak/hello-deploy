# Contributing to Hello Deploy

This project is a minimal test-only reference implementation. Contributions are welcome but should maintain the philosophy of zero external dependencies, no platform-specific references, and test-only usage.

## Guidelines

### Accepted Changes
- Bug fixes for the existing implementation
- Security improvements that don't add dependencies
- Documentation clarifications and corrections
- Platform-agnostic deployment examples (Kubernetes, Nomad, Swarm, etc.)
- Accessibility improvements to the HTML/CSS/JS

### Not Accepted
- New dependencies (npm, frameworks, build tools, polyfills)
- Platform-specific code or configuration
- Feature additions beyond the Hello World scope
- Refactoring for the sake of "clean code" without measurable benefit

## Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b fix/description`
3. Make minimal, focused changes
4. Test locally with Docker: `docker compose up --build`
5. Verify:
   - Page loads at http://localhost:8080
   - Theme toggle works
   - `/health` returns `200 ok`
   - `/build-info.json` shows correct metadata
   - Security headers present (check with `curl -I`)
   - Read-only filesystem works (`docker exec <container> touch /test` should fail)
6. Submit a pull request with a clear description

## Code Style
- HTML: Semantic HTML5, no unnecessary divs/spans
- CSS: CSS custom properties for theming, mobile-first, no preprocessors
- JavaScript: vanilla ES5-compatible syntax (`var`, no transpilation) for maximum browser support
- Dockerfile: Single-stage, minimal layers
- nginx.conf: Security-first, explicit caching

## License

By contributing, you agree your contributions will be licensed under the MIT License.