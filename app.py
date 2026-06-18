import os, json, re
from flask import Flask, render_template, request, jsonify
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

FRAMEWORK_GUIDE = {
    "STRIDE":   "Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege",
    "LINDDUN":  "Linkability, Identifiability, Non-repudiation, Detectability, Disclosure, Unawareness, Non-compliance",
    "NIST":     "Identify, Protect, Detect, Respond, Recover — mapped to NIST SP 800-53 controls",
    "OWASP":    "OWASP Top 10 and Application Security Verification Standard (ASVS)",
    "MITRE":    "MITRE ATT&CK tactics and techniques for adversarial threat modelling",
    "PASTA":    "Process for Attack Simulation and Threat Analysis — business-risk-centric",
}

SYSTEM_PROMPT = """You are a senior security architect performing structured threat modelling.
Analyse the system provided and return a JSON threat model.

Rules:
- Be specific to the actual components, data types, and connections described
- Every threat must have a realistic attack scenario, not generic advice
- Severity: Critical (9-10), High (7-8), Medium (4-6), Low (1-3)
- Risk score = likelihood × impact (1-10 scale)
- Map mitigations to NIST 800-53 control IDs where possible
- Return ONLY valid JSON, no markdown, no extra text"""

def build_prompt(data: dict) -> str:
    components = ", ".join(f"{c['name']} ({c['type']})" for c in data.get("components", [])) or "Not specified"
    connections = ", ".join(f"{c['from']} → {c['to']} [{c['trust']}]" for c in data.get("connections", [])) or "Not specified"
    data_types  = ", ".join(data.get("dataTypes", [])) or "Not specified"
    actors      = ", ".join(data.get("actors", [])) or "Not specified"
    boundaries  = ", ".join(data.get("trustBoundaries", [])) or "Not specified"
    framework   = data.get("framework", "STRIDE")

    return f"""Perform a {framework} threat model on this system.
Framework definition: {FRAMEWORK_GUIDE.get(framework, framework)}

SYSTEM:
Name: {data.get('systemName', 'Unnamed System')}
Description: {data.get('systemDescription', 'No description provided')}
Components: {components}
Data types handled: {data_types}
Connections: {connections}
Actors / Users: {actors}
Trust boundaries: {boundaries}
Deployment: {data.get('deployment', 'Not specified')}
Compliance requirements: {data.get('compliance', 'Not specified')}

Return this exact JSON structure:
{{
  "summary": {{
    "system_name": "{data.get('systemName', 'System')}",
    "framework": "{framework}",
    "threat_count": <integer>,
    "critical_count": <integer>,
    "high_count": <integer>,
    "medium_count": <integer>,
    "low_count": <integer>,
    "highest_risk": "<title of highest-risk threat>",
    "overall_risk": "Critical | High | Medium | Low",
    "executive_summary": "<2-3 sentence plain-English summary of the system's security posture>"
  }},
  "threats": [
    {{
      "id": "T-001",
      "title": "<specific, descriptive title>",
      "framework_category": "<STRIDE category or equivalent>",
      "severity": "Critical | High | Medium | Low",
      "likelihood": "High | Medium | Low",
      "risk_score": <1-10>,
      "description": "<what the vulnerability or weakness is>",
      "attack_scenario": "<concrete step-by-step scenario of how an attacker would exploit this>",
      "impacted_assets": ["<asset1>", "<asset2>"],
      "mitigations": [
        {{
          "action": "<specific remediation step>",
          "nist_control": "<e.g. AC-3, IA-5>",
          "priority": "Immediate | Short-term | Long-term"
        }}
      ],
      "detection": "<how to detect if this threat is being exploited — logs, alerts, anomalies>"
    }}
  ]
}}

Generate 5-8 threats. Order by risk_score descending."""


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/threat-model", methods=["POST"])
def threat_model():
    data = request.json or {}

    if not data.get("systemName") and not data.get("systemDescription"):
        return jsonify({"error": "Please provide at least a system name or description."}), 400

    try:
        message = client.messages.create(
            model="claude-opus-4-8",
            max_tokens=4096,
            thinking={"type": "adaptive"},
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": build_prompt(data)}],
        )

        raw = message.content[-1].text.strip()

        # Extract JSON robustly
        match = re.search(r'\{.*\}', raw, re.DOTALL)
        if not match:
            raise ValueError("No JSON found in response")
        result = json.loads(match.group())
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(debug=True, port=port)
