from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.responses import JSONResponse
from .config import Settings
from .client import MT5Client
from .logger import get_logger
from .models import Status, AccountInfo, Position, Order, TradeHistoryEntry
import os

logger = get_logger("mt5.api")

settings = Settings()

app = FastAPI(title="BrainPay MT5 Internal API", docs_url=None, redoc_url=None)

# simple API key dependency
async def require_api_key(authorization: str | None = Header(None)):
    if not settings.MT5_INTERNAL_API_KEY:
        raise HTTPException(status_code=500, detail="MT5 internal API key not configured")
    if not authorization:
        raise HTTPException(status_code=401, detail="missing Authorization header")
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="invalid auth scheme")
    token = authorization.split(" ", 1)[1]
    if token != settings.MT5_INTERNAL_API_KEY:
        raise HTTPException(status_code=403, detail="invalid API key")

# singleton client
_client: MT5Client | None = None

@app.on_event("startup")
async def startup_event():
    global _client
    _client = MT5Client(settings)
    _client.start()

@app.on_event("shutdown")
async def shutdown_event():
    if _client:
        _client.stop()

@app.get("/internal/mt5/status", response_model=Status, dependencies=[Depends(require_api_key)])
async def get_status():
    s = _client.status() if _client else {"connected": False, "last_error": "client_not_initialized", "last_heartbeat": None}
    return JSONResponse(content=s)

@app.get("/internal/mt5/account", response_model=AccountInfo, dependencies=[Depends(require_api_key)])
async def get_account():
    acc = _client.account() if _client else None
    if acc is None:
        raise HTTPException(status_code=404, detail="account_not_available")
    return JSONResponse(content=acc)

@app.get("/internal/mt5/positions", response_model=List[Position], dependencies=[Depends(require_api_key)])
async def get_positions():
    return JSONResponse(content=_client.positions())

@app.get("/internal/mt5/orders", response_model=List[Order], dependencies=[Depends(require_api_key)])
async def get_orders():
    return JSONResponse(content=_client.orders())

@app.get("/internal/mt5/history", response_model=List[TradeHistoryEntry], dependencies=[Depends(require_api_key)])
async def get_history(limit: int = 100):
    return JSONResponse(content=_client.history(limit))
