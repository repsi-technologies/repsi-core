FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    UV_COMPILE_BYTECODE=1

WORKDIR /app

# libpq for psycopg2, curl for the health check, postgresql-client for scripts/backup.py
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# uv pinned to a known release (update deliberately)
COPY --from=ghcr.io/astral-sh/uv:0.9.5 /uv /uvx /bin/

COPY pyproject.toml uv.lock README.md ./
RUN uv sync --frozen --no-dev

COPY . .

# Run as an unprivileged user; uploads live on a mounted volume owned by this user.
RUN useradd --create-home --uid 10001 repsi \
    && mkdir -p /app/private_storage \
    && chown -R repsi:repsi /app
USER repsi

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8000/health || exit 1

# WEB_CONCURRENCY workers (default 2). Client IPs come from TRUST_FORWARDED_FOR (app/core/rate_limit.py). Enable SCHEDULER_ENABLED on one service only (see docker-compose.production.yml).
CMD ["sh", "-c", "uv run --no-sync uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers ${WEB_CONCURRENCY:-2}"]
