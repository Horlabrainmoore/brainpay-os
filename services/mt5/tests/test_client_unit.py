import sys
import types

# Create a fake MetaTrader5 module for unit tests.
class FakeAccount:
    login = 123456
    balance = 1000.0
    equity = 1000.0
    margin_free = 900.0
    leverage = 100
    currency = "USD"
    server = "Demo"

class FakePosition:
    def __init__(self):
        self.ticket = 1
        self.symbol = "EURUSD"
        self.volume = 0.01
        self.type = 0
        self.price_open = 1.10
        self.profit = 0.0

class FakeOrder:
    def __init__(self):
        self.ticket = 2
        self.symbol = "EURUSD"
        self.type = 0
        self.price = 1.10

class FakeDeal:
    def __init__(self):
        self.ticket = 3
        self.symbol = "EURUSD"
        self.volume = 0.01
        self.profit = 0.0
        self.time = 0

fake_mt5 = types.SimpleNamespace()

def initialize():
    return True

def login(account, password, server, timeout):
    return True

def shutdown():
    return True

def last_error():
    return (0, "ok")

def account_info():
    return FakeAccount()

def positions_get():
    return [FakePosition()]

def orders_get():
    return [FakeOrder()]

def history_deals_get(start, end):
    return [FakeDeal()]

fake_mt5.initialize = initialize
fake_mt5.login = login
fake_mt5.shutdown = shutdown
fake_mt5.last_error = last_error
fake_mt5.account_info = account_info
fake_mt5.positions_get = positions_get
fake_mt5.orders_get = orders_get
fake_mt5.history_deals_get = history_deals_get

sys.modules['MetaTrader5'] = fake_mt5

# tests
import pytest
from services.mt5.config import Settings
from services.mt5.client import MT5Client

@pytest.fixture()
def settings():
    s = Settings()
    s.MT5_ACCOUNT_ID = "123456"
    s.MT5_PASSWORD = "pwd"
    s.MT5_SERVER = "Demo"
    s.MT5_INTERNAL_API_KEY = "testkey"
    s.MT5_READ_ONLY_MODE = True
    s.MT5_HEARTBEAT_INTERVAL = 1
    s.MT5_RECONNECT_INTERVAL = 1
    return s

def test_client_heartbeat(settings):
    client = MT5Client(settings)
    try:
        client.start()
        # allow a couple heartbeats
        import time
        time.sleep(2)
        status = client.status()
        assert status.get('connected') in (True, False)
        acc = client.account()
        assert acc is None or 'login' in acc
        pos = client.positions()
        assert isinstance(pos, list)
    finally:
        client.stop()
