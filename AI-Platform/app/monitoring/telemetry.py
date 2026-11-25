"""OpenTelemetry tracing and runtime metrics collection."""

from __future__ import annotations

from collections import Counter
from contextlib import contextmanager
from threading import Lock
from typing import Any, Iterator

from opentelemetry import trace
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider

from app.config.settings import Settings


class MetricsCollector:
    """Thread-safe in-process metrics store compatible with /metrics and OTel."""

    def __init__(self) -> None:
        self._lock = Lock()
        self._counters: Counter[str] = Counter()
        self._timings_ms: list[float] = []

    def inc(self, name: str, value: int = 1) -> None:
        with self._lock:
            self._counters[name] += value

    def observe_latency(self, duration_ms: float) -> None:
        with self._lock:
            self._timings_ms.append(round(duration_ms, 2))
            if len(self._timings_ms) > 1000:
                self._timings_ms = self._timings_ms[-500:]

    def snapshot(self) -> dict[str, Any]:
        with self._lock:
            count = len(self._timings_ms)
            avg = round(sum(self._timings_ms) / count, 2) if count else 0.0
            p95 = (
                sorted(self._timings_ms)[min(count - 1, int(count * 0.95))]
                if count
                else 0.0
            )
            return {
                "counters": dict(self._counters),
                "latency_ms": {
                    "samples": count,
                    "avg": avg,
                    "p95": p95,
                },
            }


metrics_collector = MetricsCollector()


def setup_telemetry(settings: Settings) -> trace.Tracer:
    """Initializes OpenTelemetry TracerProvider safely (idempotent)."""
    provider = trace.get_tracer_provider()
    if not isinstance(provider, TracerProvider) and settings.otel_enabled:
        resource = Resource.create(
            {
                "service.name": settings.otel_service_name,
                "service.version": settings.app_version,
                "deployment.environment": settings.app_env,
            }
        )
        trace.set_tracer_provider(TracerProvider(resource=resource))
    return trace.get_tracer(settings.otel_service_name)


@contextmanager
def traced_span(name: str, attributes: dict[str, Any] | None = None) -> Iterator[Any]:
    tracer = trace.get_tracer("pirnav-sms-ai-platform")
    with tracer.start_as_current_span(name) as span:
        if attributes and span is not None:
            for k, v in attributes.items():
                if v is not None:
                    span.set_attribute(k, str(v) if not isinstance(v, (int, float, bool)) else v)
        yield span
