FROM nginx:stable-alpine

ARG APP_VERSION=1.0.0
ARG BUILD_ID=local
ARG GIT_COMMIT=unknown
ARG BUILD_TIMESTAMP=unknown
ARG APP_ENV=production

# Copy application files from src/
COPY src/ /usr/share/nginx/html/

# Generate build-info.json with injected build metadata (after COPY so it is not overwritten)
RUN printf '{\n  "appName": "Hello Deploy",\n  "version": "%s",\n  "buildId": "%s",\n  "commitSha": "%s",\n  "buildTimestamp": "%s",\n  "environment": "%s"\n}\n' \
    "${APP_VERSION}" "${BUILD_ID}" "${GIT_COMMIT}" "${BUILD_TIMESTAMP}" "${APP_ENV}" \
    > /usr/share/nginx/html/build-info.json

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# MIT requires the license notice in redistributed copies
COPY LICENSE /usr/share/licenses/hello-deploy/LICENSE

# Static files are only read at runtime; ownership follows the nginx user
RUN chown -R nginx:nginx /usr/share/nginx/html

# Run as non-root nginx user (uid 101) on unprivileged port 8080.
# nginx creates its temp leaf directories under the /tmp tmpfs at startup, and
# the image entrypoint is left intact so /docker-entrypoint.d keeps working.
USER nginx
EXPOSE 8080

# Health check using wget (present in alpine base)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://localhost:8080/health || exit 1

# Nginx master process in the foreground; the base image stops it gracefully
# with SIGQUIT (see STOPSIGNAL in the official nginx image).
CMD ["nginx", "-g", "daemon off;"]
