"""
In-process scheduler thread. Started from the app lifespan only when SCHEDULER_ENABLED=true.
Run it on one API process; extra processes are safe (slots are claimed in the database) but wasteful.
For serverless or multi-host deployments prefer cron: `python -m scripts.run_jobs` every minute.
"""
import logging
import threading

from app.core.config import settings

logger = logging.getLogger("repsi.scheduler")
_stop = threading.Event()
_thread: threading.Thread | None = None


def _loop() -> None:
    from app.core.database import SessionLocal
    from app.services.jobs import run_due_jobs

    logger.info("Scheduler started (tick %ss)", settings.SCHEDULER_TICK_SECONDS)
    while not _stop.is_set():
        try:
            for run in run_due_jobs(SessionLocal):
                logger.info("job=%s status=%s duration_ms=%s", run.job_name, run.status, run.duration_ms)
        except Exception:
            logger.exception("Scheduler tick failed")
        _stop.wait(max(10, settings.SCHEDULER_TICK_SECONDS))


def start() -> None:
    global _thread
    if not settings.SCHEDULER_ENABLED or (_thread and _thread.is_alive()):
        return
    _stop.clear()
    _thread = threading.Thread(target=_loop, name="repsi-scheduler", daemon=True)
    _thread.start()


def stop() -> None:
    _stop.set()
    if _thread:
        _thread.join(timeout=5)
