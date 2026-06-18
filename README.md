# ThreatLens Enterprise 🔍

> ⚠️ **DEMO / TESTING PURPOSES ONLY**
> This project is a prototype and proof-of-concept. It is **not hardened, audited, or suitable for production use**. Do not enter real system credentials, production architecture details, or sensitive customer data. See the [Security Notice](#security-notice) section below.

---

An AI-powered threat modelling tool that analyses your system architecture and generates structured security findings mapped to **NIST 800-53 controls** — across STRIDE, LINDDUN, OWASP, MITRE ATT&CK, NIST CSF, and PASTA frameworks.

![Demo](demo.gif)

---

## What it does

You describe your system — components, data types, trust boundaries, and actors. ThreatLens sends that context to Claude AI and returns:

- **Structured threat findings** with severity ratings (Critical / High / Medium / Low)
- **Attack scenarios** — concrete step-by-step exploits, not generic advice
- **NIST 800-53 control mappings** on every mitigation
- **Risk scores** (likelihood × impact) with visual indicators
- **Detection guidance** — what logs and alerts to watch for
- **Exportable reports** — JSON for tools, Markdown for stakeholders

---

## Supported Frameworks

| Framework | Best used for |
|---|---|
| **STRIDE** | General application and infrastructure threat modelling |
| **LINDDUN** | Privacy-sensitive systems handling personal data (GDPR, HIPAA) |
| **NIST CSF** | Compliance-focused analysis mapped to NIST 800-53 controls |
| **OWASP Top 10** | Web applications and APIs |
| **MITRE ATT&CK** | Adversarial/red-team analysis using real attacker TTPs |
| **PASTA** | Business-risk-centric attack simulation |

---

## How to Use — Step by Step

### Step 1 · Scope
- Enter a **System Name** (e.g. "Customer Payment Platform")
- Choose your **Threat Framework** — a hint appears explaining when to use each one
- Select the **Deployment Environment** (Cloud, On-prem, Hybrid, SaaS, Mobile, IoT)
- Optionally add **Compliance Requirements** (e.g. PCI-DSS, HIPAA, GDPR, SOC 2) — this shapes the mitigations Claude generates
- Write a **System Description** — the more detail you provide, the more specific the threats will be. Include: who uses the system, what it does, what data it handles, and any sensitive workflows.
- Click **✨ Auto-extract components** to have Claude pull components from your description automatically

### Step 2 · Components
Add the building blocks of your system. Choose from 12 component types:
- Frontend / Web App, Mobile App, API Gateway, Microservice
- Database, Cache (Redis/Memcached), Message Queue
- Auth / SSO Service, CDN, Load Balancer, Admin Console, Third-party Integration

### Step 3 · Data Types
Capture what sensitive data the system processes or stores. Use the **Quick Add** chips for common types (PII, Payment Cards, Session Tokens, API Keys, Health Records, Audit Logs, Credentials) or type your own.

### Step 4 · Connections & Actors
- **Trust Boundaries** — model how components communicate and from where (Internal, Internet-facing, VPN, DMZ, Cloud boundary, Third-party)
- **Actors** — who interacts with the system (End Users, Admins, API Partners, Contractors, etc.)

### Step 5 · Review & Generate
- A **preflight summary** shows everything you've entered — verify it looks correct
- Click **🔍 Generate Threat Model** — Claude AI analyses your system (typically 15–30 seconds)
- Results appear colour-coded by severity with attack scenarios and mitigations
- Use **⬇ Export JSON** or **⬇ Export Markdown** to save the report

---

## Installation

### Requirements
- Python 3.11+
- An [Anthropic API key](https://console.anthropic.com/) (Claude)

### Setup

```bash
git clone https://github.com/motosatoshi84/ThreatLens-Enterprise
cd ThreatLens-Enterprise
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

### Run

```bash
source .venv/bin/activate
python app.py
```

Open your browser at [http://localhost:5001](http://localhost:5001)

---

## Tips for Better Results

- **Be specific in the description** — "Node.js REST API with JWT auth, PostgreSQL, and a Redis session cache serving 50k daily users" produces far better threats than "a web app"
- **Add compliance requirements** — specifying PCI-DSS, HIPAA, or GDPR focuses mitigations on what matters for your regulatory context
- **Use the Load Sample button** to see a fully populated example (FinPay payment platform) before entering your own system
- **Try multiple frameworks** on the same system — STRIDE gives technical threats, LINDDUN reveals privacy risks the STRIDE run may miss
- **Export to Markdown** for a clean report you can share with engineers or include in a security review document

---

## Security Notice

This is a **prototype for demonstration and educational purposes only**.

| What this means | Detail |
|---|---|
| ⚠️ No authentication | Anyone who can reach the server can use it |
| ⚠️ No input sanitisation | Inputs are passed directly to the Claude API |
| ⚠️ No rate limiting | The API endpoint is unprotected |
| ⚠️ No secrets management | API key is stored in a local `.env` file |
| ⚠️ Debug mode enabled | Flask runs with `debug=True` — never do this in production |
| ⚠️ No HTTPS | Traffic is unencrypted in transit |

**Do not:**
- Deploy this on a public server
- Enter real production credentials or architecture details
- Use it to store or process real customer data
- Use the threat output as a substitute for a professional security review

---

## Project Structure

```
ThreatLens-Enterprise/
├── app.py                # Flask backend — Claude AI integration
├── templates/
│   └── index.html        # Multi-step form UI
├── static/
│   ├── styles.css        # Dark theme, severity colours
│   └── app.js            # Step navigation, exports, rendering
├── requirements.txt
└── .env.example          # Copy to .env and add your API key
```

---

## Roadmap (not production-ready)

Ideas for future development if hardened for real use:
- User authentication and session management
- Persistent threat model storage
- Team collaboration and commenting
- PDF export
- CI/CD pipeline integration (scan on every PR)
- Custom control framework mapping (ISO 27001, CIS Controls)
