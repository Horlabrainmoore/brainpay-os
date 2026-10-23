from pydantic import BaseModel
from typing import List, Optional

class Status(BaseModel):
    connected: bool
    last_error: Optional[str]
    last_heartbeat: Optional[float]

class AccountInfo(BaseModel):
    login: Optional[int]
    balance: Optional[float]
    equity: Optional[float]
    margin_free: Optional[float]
    leverage: Optional[int]
    currency: Optional[str]
    server: Optional[str]

class Position(BaseModel):
    ticket: Optional[int]
    symbol: Optional[str]
    volume: Optional[float]
    type: Optional[int]
    price_open: Optional[float]
    profit: Optional[float]

class Order(BaseModel):
    ticket: Optional[int]
    symbol: Optional[str]
    type: Optional[int]
    price: Optional[float]

class TradeHistoryEntry(BaseModel):
    ticket: Optional[int]
    symbol: Optional[str]
    volume: Optional[float]
    profit: Optional[float]
    time: Optional[int]
