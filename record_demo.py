"""
Records a walkthrough of the ThreatLens Enterprise web UI using Playwright.
Injects mock threat results so no API key is needed for the demo.
Saves a webm video then converts to GIF via ffmpeg.
"""
import asyncio, subprocess, os, json
from playwright.async_api import async_playwright

URL       = "http://localhost:5001"
VIDEO_DIR = "/tmp/threatlens_video"
GIF_OUT   = "demo_web.gif"

MOCK_RESULT = {
    "summary": {
        "system_name": "FinPay — Payment Processing Platform",
        "framework": "STRIDE",
        "threat_count": 5,
        "critical_count": 2,
        "high_count": 2,
        "medium_count": 1,
        "low_count": 0,
        "highest_risk": "SQL Injection via Payment API endpoint",
        "overall_risk": "Critical",
        "executive_summary": (
            "FinPay presents a Critical overall risk profile. Two critical vulnerabilities — "
            "SQL injection in the payment API and unenforced Redis session expiry — require "
            "immediate remediation. All findings are mapped to NIST 800-53 controls."
        ),
    },
    "threats": [
        {
            "id": "T-001",
            "title": "SQL Injection via Payment API endpoint",
            "framework_category": "Tampering",
            "severity": "Critical",
            "likelihood": "High",
            "risk_score": 9.2,
            "description": "Unparameterised queries in the /api/payments endpoint allow attackers to manipulate database queries and extract the full customer PII and card data table.",
            "attack_scenario": "1. Attacker sends a crafted payload in the card_number field: ' OR '1'='1. 2. The unparameterised query returns all rows from the payments table. 3. Attacker exfiltrates PII and PAN data via repeated requests.",
            "impacted_assets": ["PostgreSQL DB", "Payment Card Data", "PII"],
            "mitigations": [
                {"action": "Replace all raw SQL with parameterised queries or an ORM", "nist_control": "SI-10", "priority": "Immediate"},
                {"action": "Deploy a Web Application Firewall with SQL injection rules", "nist_control": "SC-7", "priority": "Immediate"},
                {"action": "Enable database query logging and alert on anomalous patterns", "nist_control": "AU-12", "priority": "Short-term"},
            ],
            "detection": "Monitor database logs for UNION, OR 1=1, and comment sequences. Alert on query execution times exceeding baseline by 3×.",
        },
        {
            "id": "T-002",
            "title": "Redis session tokens not expiring — session hijack risk",
            "framework_category": "Spoofing",
            "severity": "Critical",
            "likelihood": "Medium",
            "risk_score": 8.5,
            "description": "Session tokens stored in Redis have no TTL enforced. A captured token remains valid indefinitely, allowing an attacker to impersonate any user.",
            "attack_scenario": "1. Attacker intercepts a session token via XSS or network sniffing. 2. Token has no expiry — remains valid for weeks. 3. Attacker reuses token to access victim's account and payment methods.",
            "impacted_assets": ["Redis Cache", "Session Tokens", "API Gateway"],
            "mitigations": [
                {"action": "Set Redis TTL of 15–30 minutes on all session keys", "nist_control": "IA-5", "priority": "Immediate"},
                {"action": "Rotate session token on every successful authentication", "nist_control": "AC-12", "priority": "Immediate"},
            ],
            "detection": "Alert on the same session token appearing from two different IP addresses within 5 minutes.",
        },
        {
            "id": "T-003",
            "title": "Stripe webhook accepts requests without signature validation",
            "framework_category": "Repudiation",
            "severity": "High",
            "likelihood": "Medium",
            "risk_score": 7.4,
            "description": "The /webhook/stripe endpoint does not verify the Stripe-Signature header, allowing anyone to forge payment confirmation events.",
            "attack_scenario": "1. Attacker sends a forged POST to /webhook/stripe with a fake payment_intent.succeeded event. 2. System marks the order as paid without real payment. 3. Attacker receives goods/services for free.",
            "impacted_assets": ["API Gateway", "Payment Card Data"],
            "mitigations": [
                {"action": "Verify Stripe-Signature header using Stripe SDK on every webhook", "nist_control": "AU-10", "priority": "Immediate"},
                {"action": "Implement a 5-minute replay window — reject events older than 300s", "nist_control": "IA-9", "priority": "Short-term"},
            ],
            "detection": "Log all webhook calls with source IP. Alert on events where Stripe-Signature is absent or invalid.",
        },
        {
            "id": "T-004",
            "title": "Admin dashboard accessible from the public internet",
            "framework_category": "Elevation of Privilege",
            "severity": "High",
            "likelihood": "Medium",
            "risk_score": 7.0,
            "description": "The merchant admin dashboard is internet-facing with no IP allowlist. A credential stuffing attack could grant attacker full merchant account access.",
            "attack_scenario": "1. Attacker enumerates the /admin path via directory brute-force. 2. Runs credential stuffing using breached email/password pairs. 3. Gains admin access to merchant accounts and payment configurations.",
            "impacted_assets": ["Admin Console", "PII"],
            "mitigations": [
                {"action": "Restrict admin access to VPN or allowlisted IP ranges only", "nist_control": "AC-17", "priority": "Immediate"},
                {"action": "Enforce MFA on all admin accounts", "nist_control": "IA-3", "priority": "Immediate"},
            ],
            "detection": "Alert on more than 5 failed login attempts per IP per minute on the admin endpoint.",
        },
        {
            "id": "T-005",
            "title": "PII and card data logged in plaintext to CloudWatch",
            "framework_category": "Information Disclosure",
            "severity": "Medium",
            "likelihood": "Low",
            "risk_score": 4.8,
            "description": "Request logging middleware captures full request bodies including PII and partial card numbers, storing them in plaintext in CloudWatch logs.",
            "attack_scenario": "1. Insider with CloudWatch read access searches logs for card patterns. 2. Exports PII records without triggering data access controls.",
            "impacted_assets": ["PII", "Payment Card Data", "Audit Logs"],
            "mitigations": [
                {"action": "Implement log scrubbing middleware to redact PII and card fields before logging", "nist_control": "AU-3", "priority": "Short-term"},
                {"action": "Apply field-level encryption for any sensitive data that must be stored", "nist_control": "SC-28", "priority": "Short-term"},
            ],
            "detection": "Enable CloudWatch log access auditing. Alert on bulk exports exceeding 1000 log events.",
        },
    ],
}

async def run():
    os.makedirs(VIDEO_DIR, exist_ok=True)
    # clear old recordings
    for f in os.listdir(VIDEO_DIR):
        os.remove(os.path.join(VIDEO_DIR, f))

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        ctx = await browser.new_context(
            viewport={"width": 1280, "height": 860},
            record_video_dir=VIDEO_DIR,
            record_video_size={"width": 1280, "height": 860},
        )
        page = await ctx.new_page()
        await page.goto(URL, wait_until="networkidle")
        await page.wait_for_timeout(1000)

        # ── Step 1: Scope ─────────────────────────────────────────────────
        await page.fill("#systemName", "FinPay — Payment Processing Platform")
        await page.wait_for_timeout(500)
        await page.select_option("#framework", "STRIDE")
        await page.wait_for_timeout(700)
        await page.select_option("#deployment", "Cloud (AWS/Azure/GCP)")
        await page.wait_for_timeout(300)
        await page.fill("#compliance", "PCI-DSS, SOC 2 Type II")
        await page.wait_for_timeout(300)
        await page.fill(
            "#systemDescription",
            "A cloud-hosted payment SaaS with React frontend, Node.js API gateway, "
            "PostgreSQL, Redis cache, and Stripe. Handles PII and payment card data. "
            "Uses OAuth 2.0/SSO with CloudWatch audit logging.",
        )
        await page.wait_for_timeout(800)
        await page.click("#extractContext")
        await page.wait_for_timeout(1000)

        # ── Step 2: Components ────────────────────────────────────────────
        await page.click(".step-tab[data-step='2']")
        await page.wait_for_timeout(700)
        for name, typ in [
            ("React Frontend", "Frontend / Web App"),
            ("API Gateway",    "API Gateway"),
            ("PostgreSQL DB",  "Database"),
            ("Redis Cache",    "Cache (Redis/Memcached)"),
            ("Auth / SSO",     "Auth / SSO Service"),
        ]:
            await page.fill("#componentName", name)
            await page.select_option("#componentType", typ)
            await page.click("#addComponent")
            await page.wait_for_timeout(300)

        # ── Step 3: Data ──────────────────────────────────────────────────
        await page.click(".step-tab[data-step='3']")
        await page.wait_for_timeout(700)
        for val in ["PII", "Payment Card Data", "Session Tokens", "API Keys"]:
            await page.locator(f".chip-btn[data-value='{val}']").click()
            await page.wait_for_timeout(280)

        # ── Step 4: Connections & Actors ──────────────────────────────────
        await page.click(".step-tab[data-step='4']")
        await page.wait_for_timeout(700)
        for frm, to, trust in [
            ("React Frontend", "API Gateway",  "Internet-facing"),
            ("API Gateway",    "PostgreSQL DB","Internal"),
        ]:
            await page.fill("#from", frm)
            await page.fill("#to",   to)
            await page.select_option("#trust", trust)
            await page.click("#addConnection")
            await page.wait_for_timeout(300)
        await page.fill("#actorInput", "End User")
        await page.click("#addActor")
        await page.wait_for_timeout(250)
        await page.fill("#actorInput", "Merchant Admin")
        await page.click("#addActor")
        await page.wait_for_timeout(400)

        # ── Step 5: Review ────────────────────────────────────────────────
        await page.click(".step-tab[data-step='5']")
        await page.wait_for_timeout(1400)

        # Intercept the API call and return mock data
        await page.route("**/api/threat-model", lambda route: route.fulfill(
            status=200,
            content_type="application/json",
            body=json.dumps(MOCK_RESULT),
        ))

        # Click generate
        await page.click("#generateBtn")
        await page.wait_for_timeout(400)

        # Wait for threat cards (loading state may flash past instantly with mock)
        await page.wait_for_selector(".threat-card", timeout=10000)
        await page.wait_for_timeout(1200)

        # Scroll through results smoothly
        await page.evaluate("document.getElementById('summaryCard').scrollIntoView({behavior:'smooth'})")
        await page.wait_for_timeout(1000)
        await page.mouse.wheel(0, 350)
        await page.wait_for_timeout(900)
        await page.mouse.wheel(0, 400)
        await page.wait_for_timeout(900)
        await page.mouse.wheel(0, 400)
        await page.wait_for_timeout(900)
        await page.mouse.wheel(0, 400)
        await page.wait_for_timeout(1200)

        await ctx.close()
        await browser.close()

    # Find recorded webm
    files = [f for f in os.listdir(VIDEO_DIR) if f.endswith(".webm")]
    if not files:
        print("ERROR: No video recorded."); return
    webm = os.path.join(VIDEO_DIR, sorted(files)[-1])
    print(f"Converting {webm} → {GIF_OUT}")

    # Generate palette then GIF
    palette = "/tmp/threatlens_palette.png"
    subprocess.run([
        "ffmpeg", "-y", "-i", webm,
        "-vf", "fps=10,scale=900:-1:flags=lanczos,palettegen=max_colors=128",
        palette
    ], check=True, capture_output=True)

    subprocess.run([
        "ffmpeg", "-y", "-i", webm, "-i", palette,
        "-filter_complex", "fps=10,scale=900:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=bayer",
        GIF_OUT
    ], check=True, capture_output=True)

    size_kb = os.path.getsize(GIF_OUT) / 1024
    print(f"Done: {GIF_OUT} ({size_kb:.0f} KB)")

asyncio.run(run())
