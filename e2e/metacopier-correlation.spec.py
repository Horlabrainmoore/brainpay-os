import asyncio, json, os, re
from pathlib import Path
from playwright.async_api import async_playwright

SHOTS = Path(__file__).parent / "screenshots"
SHOTS.mkdir(parents=True, exist_ok=True)
BASE = "http://localhost:8080"

async def restore_auth(context, page):
    storage_key = os.environ.get("LOVABLE_BROWSER_SUPABASE_STORAGE_KEY")
    session_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_SESSION_JSON")
    cookies_json = os.environ.get("LOVABLE_BROWSER_SUPABASE_COOKIES_JSON")
    if cookies_json:
        cookies = json.loads(cookies_json)
        for c in cookies:
            c["url"] = BASE
        await context.add_cookies(cookies)
    await page.goto(BASE, wait_until="domcontentloaded")
    if storage_key and session_json:
        await page.evaluate(
            f"window.localStorage.setItem({json.dumps(storage_key)}, {json.dumps(session_json)})"
        )

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()

        proxy_calls = []
        page.on("console", lambda m: print("console:", m.type, m.text[:200]))

        await restore_auth(context, page)

        # 1. Visit MetaCopier page — auto-fetches accounts, which triggers the proxy.
        await page.goto(f"{BASE}/metacopier", wait_until="domcontentloaded")
        try:
            await page.wait_for_load_state("networkidle", timeout=8000)
        except Exception:
            pass
        await page.screenshot(path=str(SHOTS / "1_metacopier.png"))
        print("metacopier url:", page.url)

        # 2. Navigate to Logs and switch to the MetaCopier proxy tab.
        await page.goto(f"{BASE}/logs", wait_until="domcontentloaded")
        tab = page.get_by_role("tab", name=re.compile("MetaCopier proxy", re.I))
        await tab.wait_for(timeout=8000)
        await tab.click()
        # Give the query a moment to fetch
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(SHOTS / "2_logs.png"))

        # 3. Find cid: chips
        chips = page.locator('button[title="Copy correlation ID"]')
        count = await chips.count()
        print("cid chip count:", count)
        assert count > 0, "expected at least one cid: chip in the Logs UI"

        # 4. Verify chip text matches "cid: XXXXXXXX…XXXX" (first 8 + last 4 of a UUID-like id)
        chip_texts = [await chips.nth(i).inner_text() for i in range(min(count, 5))]
        print("chip texts:", chip_texts)
        pattern = re.compile(r"^cid:\s*[0-9a-fA-F-]{8}…[0-9a-fA-F-]{4}$")
        for t in chip_texts:
            assert pattern.match(t.strip()), f"chip text {t!r} does not match cid pattern"

        # 5. Cross-check against the DB: fetch the newest correlation_id via the anon REST API
        supa_url = os.environ.get("LOVABLE_BROWSER_SUPABASE_URL") or "https://jkuhbxrnytavkqffzkgj.supabase.co"
        anon = os.environ.get("LOVABLE_BROWSER_SUPABASE_ANON_KEY") or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprdWhieHJueXRhdmtxZmZ6a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NjI1MTksImV4cCI6MjA5MzIzODUxOX0.OxHr0nZnsH79KMFh-DMEcntskkp3GFW0QnLeTt2ZP6A"
        token = os.environ.get("LOVABLE_BROWSER_SUPABASE_ACCESS_TOKEN")
        db = await page.request.get(
            f"{supa_url}/rest/v1/metacopier_proxy_logs?select=correlation_id&order=created_at.desc&limit=1",
            headers={"apikey": anon, "Authorization": f"Bearer {token or anon}"},
        )
        body = await db.json()
        print("db latest row:", body)
        assert isinstance(body, list) and body, "no proxy log row found in DB"
        latest_cid = body[0]["correlation_id"]
        expected_chip = f"cid: {latest_cid[:8]}…{latest_cid[-4:]}"
        first_chip = chip_texts[0].strip()
        print("expected:", expected_chip, "| got:", first_chip)
        assert first_chip == expected_chip, "top chip does not match latest DB correlation_id"

        print("PASS")
        await browser.close()

asyncio.run(main())
