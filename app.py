from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/threat-model", methods=["POST"])
def threat_model():
    data = request.json or {}
    system = data.get("systemName", "System")
    framework = data.get("framework", "STRIDE")
    response = {
        "summary": {
            "framework": framework,
            "system_name": system,
            "threat_count": 1,
            "highest_risk": "Example Threat",
            "input_summary": {
                "actors": len(data.get("actors", [])),
                "components": len(data.get("components", [])),
                "connections": len(data.get("connections", [])),
                "assets": len(data.get("assets", [])),
                "dataTypes": len(data.get("dataTypes", [])),
                "integrations": len(data.get("integrations", [])),
                "trustBoundaries": len(data.get("trustBoundaries", [])),
            },
        },
        "normalizedInput": data,
        "threats": [{
            "title": "Example Threat",
            "framework": framework,
            "category": "Demo",
            "severity": "Medium",
            "likelihood": "Medium",
            "riskScore": 4,
            "impacted_assets": ["Example Asset"],
            "rationale": "Placeholder threat until the real engine is added.",
            "mitigations": [
                "Implement authentication",
                "Validate inputs",
                "Enable logging"
            ],
            "controls": ["AC-3", "IA-2"]
        }]
    }
    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)
