"""
Demo script for GIF — simulates the full ThreatLens workflow in the terminal.
No API key needed; uses mock output to show what the tool produces.
"""
import time, sys

RESET  = "\033[0m"
BOLD   = "\033[1m"
DIM    = "\033[2m"
RED    = "\033[38;5;196m"
ORANGE = "\033[38;5;214m"
YELLOW = "\033[38;5;226m"
GREEN  = "\033[38;5;82m"
BLUE   = "\033[38;5;75m"
PURPLE = "\033[38;5;141m"
WHITE  = "\033[97m"
GRAY   = "\033[38;5;245m"

def slow(text, delay=0.013):
    for ch in text:
        sys.stdout.write(ch)
        sys.stdout.flush()
        time.sleep(delay)
    print()

def pause(s=0.5): time.sleep(s)
def line(): print(f"{DIM}{'─'*62}{RESET}")

print(f"\n{BOLD}{BLUE}{'━'*62}{RESET}")
print(f"{BOLD}{WHITE}  🔍  ThreatLens Enterprise{RESET}")
print(f"{GRAY}  AI-Powered Threat Modelling — Demo Mode{RESET}")
print(f"{BOLD}{BLUE}{'━'*62}{RESET}\n")
pause(0.8)

slow(f"{BLUE}System:{RESET}  FinPay — Cloud Payment Processing Platform")
slow(f"{BLUE}Framework:{RESET} STRIDE")
slow(f"{BLUE}Deployment:{RESET} Cloud (AWS)  ·  Compliance: PCI-DSS, SOC 2")
pause(0.4)

print()
slow(f"{GRAY}Components:{RESET}  React Frontend · API Gateway · Payment Service")
slow(f"             PostgreSQL DB · Redis Cache · Auth/SSO · Stripe")
slow(f"{GRAY}Data types:{RESET}  PII · Payment Card Data · Session Tokens · API Keys")
slow(f"{GRAY}Actors:{RESET}     End User · Merchant Admin · API Partner")
pause(0.5)

print()
slow(f"{BLUE}[Sending to Claude Opus AI...]{RESET}", 0.016)
pause(2.0)
slow(f"  {GREEN}✓{RESET} Analysis complete — 6 threats identified\n")
pause(0.3)

line()
slow(f"  {RED}● T-001{RESET}  {BOLD}SQL Injection via Payment API endpoint{RESET}           {RED}CRITICAL{RESET}", 0.009)
slow(f"  {DIM}  STRIDE: Tampering  ·  Risk 9/10  ·  Likelihood: High{RESET}", 0.008)
slow(f"  {GRAY}  Unparameterised queries in /api/payments allow attackers to{RESET}", 0.008)
slow(f"  {GRAY}  extract the full customer PII and card data table.{RESET}", 0.008)
slow(f"  {GREEN}  ✓ Mitigations:{RESET} Use parameterised queries (SI-10) · WAF rules (SC-7)", 0.008)
pause(0.3)

line()
slow(f"  {RED}● T-002{RESET}  {BOLD}Broken Auth — Redis session token not validated{RESET}  {RED}CRITICAL{RESET}", 0.009)
slow(f"  {DIM}  STRIDE: Spoofing  ·  Risk 8.5/10  ·  Likelihood: Medium{RESET}", 0.008)
slow(f"  {GRAY}  Expired tokens remain valid in Redis cache. An attacker{RESET}", 0.008)
slow(f"  {GRAY}  with a captured token can impersonate any user indefinitely.{RESET}", 0.008)
slow(f"  {GREEN}  ✓ Mitigations:{RESET} TTL enforcement (IA-5) · Token rotation on auth (AC-12)", 0.008)
pause(0.3)

line()
slow(f"  {ORANGE}● T-003{RESET}  {BOLD}Stripe webhook lacks signature verification{RESET}      {ORANGE}HIGH{RESET}", 0.009)
slow(f"  {DIM}  STRIDE: Repudiation  ·  Risk 7.2/10  ·  Likelihood: Medium{RESET}", 0.008)
slow(f"  {GRAY}  Unauthenticated webhook calls allow forged payment events,{RESET}", 0.008)
slow(f"  {GRAY}  enabling fraudulent order confirmations.{RESET}", 0.008)
slow(f"  {GREEN}  ✓ Mitigations:{RESET} Verify Stripe-Signature header (AU-10) · Replay window", 0.008)
pause(0.3)

line()
slow(f"  {YELLOW}● T-004{RESET}  {BOLD}Admin dashboard exposed without IP allowlist{RESET}       {YELLOW}MEDIUM{RESET}", 0.009)
slow(f"  {DIM}  STRIDE: Elevation of Privilege  ·  Risk 5.8/10{RESET}", 0.008)
slow(f"  {GREEN}  ✓ Mitigations:{RESET} VPN/IP allowlist (AC-17) · MFA enforcement (IA-3)", 0.008)
pause(0.3)

line()
slow(f"  {YELLOW}● T-005{RESET}  {BOLD}PII logged in plaintext in CloudWatch{RESET}              {YELLOW}MEDIUM{RESET}", 0.009)
slow(f"  {DIM}  STRIDE: Info Disclosure  ·  Risk 5.1/10{RESET}", 0.008)
slow(f"  {GREEN}  ✓ Mitigations:{RESET} Log scrubbing (AU-3) · Field-level encryption (SC-28)", 0.008)
pause(0.3)

line()
slow(f"  {GREEN}● T-006{RESET}  {BOLD}No rate limiting on login endpoint{RESET}                  {GREEN}LOW{RESET}", 0.009)
slow(f"  {DIM}  STRIDE: DoS  ·  Risk 3.2/10{RESET}", 0.008)
slow(f"  {GREEN}  ✓ Mitigations:{RESET} Rate limiting (SC-5) · CAPTCHA (IA-8)", 0.008)

line()
print()
slow(f"{BOLD}{WHITE}  Executive Summary:{RESET}", 0.012)
slow(f"  {GRAY}FinPay presents HIGH overall risk. Two critical vulnerabilities{RESET}", 0.008)
slow(f"  {GRAY}require immediate remediation before any production deployment.{RESET}", 0.008)
slow(f"  {GRAY}All findings include NIST 800-53 control mappings.{RESET}", 0.008)

print(f"\n  {BOLD}{GREEN}{'━'*58}")
print(f"  📥 Exported: threat-model.json  ·  threat-model.md")
print(f"{'━'*58}{RESET}\n")
time.sleep(2)
