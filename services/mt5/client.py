"""
MT5 client wrapper (read-only, persistent, heartbeat + reconnect).
This implementation uses the MetaTrader5 package and keeps a small in-memory cache
of the latest account and positions for quick API responses.
"""
import threading
import time
import traceback
from typing import Any, Dict, List, Optional

from .config import Settings
from .logger import get_logger

# Import MetaTrader5 lazily to allow tests to inject a fake module.
try:
    import MetaTrader5 as mt5
except Exception:  # pragma: no cover - tests will inject fake
    mt5 = None

logger = get_logger("mt5.client")

class MT5Client:
    def __init__(self, settings: Settings):
        self.settings = settings
        self._lock = threading.RLock()
        self._running = False
        self._thread: Optional[threading.Thread] = None

        # cached data
        self._status: Dict[str, Any] = {"connected": False, "last_error": None, "last_heartbeat": None}
        self._account: Optional[Dict[str, Any]] = None
        self._positions: List[Dict[str, Any]] = []
        self._orders: List[Dict[str, Any]] = []
        self._history: List[Dict[str, Any]] = []

    def start(self) -> None:
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True, name="mt5-heartbeat")
        self._thread.start()
        logger.info("MT5Client started")

    def stop(self) -> None:
        self._running = False
        if self._thread:
            self._thread.join(timeout=5)
        try:
            if mt5:
                mt5.shutdown()
        except Exception:
            logger.exception("Error shutting down mt5")
        logger.info("MT5Client stopped")

    def _initialize_mt5(self) -> None:
        global mt5
        if mt5 is None:
            import MetaTrader5 as _mt5
n            mt5 = _mt5
        if not mt5.initialize():
            err = mt5.last_error()
            raise RuntimeError(f"mt5.initialize() failed: {err}")

    def _login(self) -> None:
        if not mt5:
            raise RuntimeError("MetaTrader5 module not available")
        account = int(self.settings.MT5_ACCOUNT_ID) if self.settings.MT5_ACCOUNT_ID else None
        password = self.settings.MT5_PASSWORD
        server = self.settings.MT5_SERVER
        timeout = int(self.settings.MT5_LOGIN_TIMEOUT)
        if account is None:
            raise ValueError("MT5_ACCOUNT_ID must be set for login")
        ok = mt5.login(account, password, server, timeout)
        if not ok:
            err = mt5.last_error()
            raise RuntimeError(f"mt5.login() failed: {err}")

    def _run_loop(self) -> None:
        backoff = 1
        while self._running:
            try:
                if mt5 is None:
                    # attempt to (re)import/initialize
                    try:
                        import MetaTrader5 as _mt5
                        mt5 = _mt5
                    except Exception as e:
                        logger.warning("MetaTrader5 import failed: %s", e)
                        self._status.update({"connected": False, "last_error": str(e)})
                        time.sleep(self.settings.MT5_RECONNECT_INTERVAL)
                        continue

                # ensure initialized and logged in
                try:
                    if not mt5.initialize():
                        logger.info("mt5.initialize() returned False; attempting reconnect")
                    # attempt login
                    self._login()
                except Exception as e:
                    logger.warning("MT5 login/initialize error: %s", e)
                    self._status.update({"connected": False, "last_error": str(e)})
                    time.sleep(self.settings.MT5_RECONNECT_INTERVAL)
                    continue

                # connected, reset backoff
                backoff = 1
                self._status.update({"connected": True, "last_error": None})
                logger.info("Connected to MT5 (demo mode=%s)", self.settings.MT5_READ_ONLY_MODE)

                # heartbeat loop
                while self._running:
                    try:
                        self._heartbeat_once()
                    except Exception:
                        logger.exception("heartbeat iteration failed")
                    time.sleep(self.settings.MT5_HEARTBEAT_INTERVAL)

            except Exception:
                logger.exception("unexpected error in MT5Client main loop")
                self._status.update({"connected": False, "last_error": traceback.format_exc()})
                time.sleep(min(backoff, 60))
                backoff *= 2

    def _heartbeat_once(self) -> None:
        with self._lock:
            # account info
            try:
                info = mt5.account_info()
                # account_info may be a custom object; attempt to convert
                if info is not None:
                    account = {
                        "login": getattr(info, "login", None),
                        "balance": getattr(info, "balance", None),
                        "equity": getattr(info, "equity", None),
                        "margin_free": getattr(info, "margin_free", None),
                        "leverage": getattr(info, "leverage", None),
                        "currency": getattr(info, "currency", None),
                        "server": getattr(info, "server", None),
                    }
                    self._account = account
            except Exception:
                logger.exception("failed to fetch account_info")

            # positions
            try:
                positions = mt5.positions_get()
                if positions is None:
                    self._positions = []
                else:
                    self._positions = [self._pos_to_dict(p) for p in positions]
            except Exception:
                logger.exception("failed to fetch positions")

            # orders
            try:
                orders = mt5.orders_get()
                if orders is None:
                    self._orders = []
                else:
                    self._orders = [self._order_to_dict(o) for o in orders]
            except Exception:
                logger.exception("failed to fetch orders")

            # recent history (light query)
            try:
                # request recent deals from -1 day to now as safe default
                now = time.time()
                since = int(now - 60 * 60 * 24)
                deals = mt5.history_deals_get(since, int(now))
                if deals is None:
                    self._history = []
                else:
                    self._history = [self._deal_to_dict(d) for d in deals]
            except Exception:
                logger.exception("failed to fetch history")

            self._status["last_heartbeat"] = time.time()

    def _pos_to_dict(self, p: Any) -> Dict[str, Any]:
        return {
            "ticket": getattr(p, "ticket", None),
            "symbol": getattr(p, "symbol", None),
            "volume": getattr(p, "volume", None),
            "type": getattr(p, "type", None),
            "price_open": getattr(p, "price_open", None),
            "profit": getattr(p, "profit", None),
        }

    def _order_to_dict(self, o: Any) -> Dict[str, Any]:
        return {
            "ticket": getattr(o, "ticket", None),
            "symbol": getattr(o, "symbol", None),
            "type": getattr(o, "type", None),
            "price": getattr(o, "price", None),
        }

    def _deal_to_dict(self, d: Any) -> Dict[str, Any]:
        return {
            "ticket": getattr(d, "ticket", None),
            "symbol": getattr(d, "symbol", None),
            "volume": getattr(d, "volume", None),
            "profit": getattr(d, "profit", None),
            "time": getattr(d, "time", None),
        }

    # Public getters (thread-safe)
    def status(self) -> Dict[str, Any]:
        with self._lock:
            return dict(self._status)

    def account(self) -> Optional[Dict[str, Any]]:
        with self._lock:
            return dict(self._account) if self._account is not None else None

    def positions(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._positions)

    def orders(self) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._orders)

    def history(self, limit: int = 100) -> List[Dict[str, Any]]:
        with self._lock:
            return list(self._history[-limit:])
