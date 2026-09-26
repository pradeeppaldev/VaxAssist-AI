"""
Background periodic scheduler for VaxAssist AI proactive monitoring.
Runs in-process via asyncio without relying on client timers or frontend triggers.
Idempotent and concurrency-locked.
"""
import asyncio
import logging
from typing import Optional, Dict, Any
from app.config import settings
from app.services.monitoring_engine import monitoring_engine

logger = logging.getLogger("vaxassist.monitoring.scheduler")


class MonitoringScheduler:
    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._running: bool = False
        self._lock = asyncio.Lock()
        self._last_run_stats: Optional[Dict[str, Any]] = None

    @property
    def is_running(self) -> bool:
        return self._running and self._task is not None and not self._task.done()

    @property
    def last_run_stats(self) -> Optional[Dict[str, Any]]:
        return self._last_run_stats

    async def run_cycle(self, wait: bool = True) -> Dict[str, Any]:
        """
        Executes a single monitoring cycle across all active users.
        Concurrency-protected: only one cycle can execute at any time.
        """
        if not wait and self._lock.locked():
            logger.info("Monitoring cycle requested while another cycle is in progress; returning last stats.")
            return self._last_run_stats or {"status": "in_progress", "scanned_users": 0}

        async with self._lock:
            try:
                logger.info("Starting proactive monitoring cycle...")
                stats = await monitoring_engine.monitor_all_active_users()
                self._last_run_stats = stats
                return stats
            except Exception as exc:
                logger.error(f"Error during scheduled monitoring cycle: {type(exc).__name__} - {exc}")
                return {"status": "error", "error": str(exc)}

    async def _worker_loop(self):
        interval_seconds = max(60, settings.MONITORING_INTERVAL_MINUTES * 60)
        logger.info(f"Monitoring scheduler worker loop started. Interval: {interval_seconds}s.")

        # Delay before first periodic background scan so server completes boot and test suite runs
        try:
            await asyncio.sleep(interval_seconds)
        except asyncio.CancelledError:
            return

        while self._running:
            try:
                await self.run_cycle()
            except Exception as e:
                logger.error(f"Unhandled exception in monitoring scheduler loop: {e}")

            try:
                await asyncio.sleep(interval_seconds)
            except asyncio.CancelledError:
                logger.info("Monitoring scheduler worker loop received cancellation.")
                break

    def start(self):
        """Starts the periodic background scheduler task."""
        if not settings.ENABLE_BACKGROUND_SCHEDULER:
            logger.info("Background monitoring scheduler disabled by configuration.")
            return

        if self.is_running:
            logger.warning("Monitoring scheduler is already running.")
            return

        self._running = True
        self._task = asyncio.create_task(self._worker_loop())
        logger.info("Background monitoring scheduler successfully started.")

    async def stop(self):
        """Stops the periodic background scheduler task gracefully."""
        if not self._running:
            return

        logger.info("Stopping background monitoring scheduler...")
        self._running = False
        if self._task and not self._task.done():
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        self._task = None
        logger.info("Background monitoring scheduler stopped.")


monitoring_scheduler = MonitoringScheduler()
