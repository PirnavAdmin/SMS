"""Optional Celery background workers for scheduled circular sync & offline diagnostics."""

from app.workers.celery_app import celery_app

__all__ = ["celery_app"]
