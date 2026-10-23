def check_health(client) -> dict:
    status = client.status() if client else {"connected": False}
    return {"ok": status.get("connected", False), "status": status}
