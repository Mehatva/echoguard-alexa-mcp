# echoguard

Ambient Voice Integrity & Hardware Quarantine Daemon for Alexa+ and Ring Devices.  
Built for the **Amazon Developer Hackathon 2026** (Alexa+ Track & AWS Builder Mini Challenge).

---

## Overview

As ambient voice assistants transition into autonomous agents with physical smart home privileges (such as unlocking deadbolts or initiating financial orders), they become susceptible to:
1. **Audio spoofing & synthetic voice cloning:** Replay of neural vocoder-generated speech (ElevenLabs, XTTS, VALL-E) impersonating family members.
2. **Ambient injection attacks:** Unauthenticated voice commands emitted through windows or nearby audio sources attempting to actuate smart locks.
3. **Social engineering coercion:** High-velocity pressure calls (e.g. simulated arrest/bail fraud) targeting elderly residents.

`echoguard` runs as an autonomous telemetry daemon. It implements a **Model Context Protocol (MCP)** server (spec 2025-11-25) over streamable HTTP, extracting acoustic phase anomalies from incoming audio buffers and orchestrating **AWS Bedrock** (Claude 3.5 Sonnet / Amazon Nova) to evaluate coercion severity. When an attack vector is verified, `echoguard` autonomously revokes voice lock privileges on Ring deadbolts and alerts designated caregivers via AWS SNS.

---

## Architecture

```
[ Ambient Microphone / Audio Stream ]
                 │
                 ▼
       [ echoguard-daemon ]
                 │
  ┌──────────────┴──────────────┐
  │   MCP Tools (Streamable)    │
  │                             │
  ├─► verify_voice_authenticity │ (Spectral centroid, ZCR, vocoder HF phase check)
  ├─► detect_coercion_intent    │ (AWS Bedrock semantic intent engine)
  ├─► quarantine_smart_home     │ (Ring deadbolt lockdown & purchase freeze)
  └─► dispatch_guardian_alert   │ (AWS SNS emergency telemetry dispatch)
                 │
                 ▼
  [ WebSocket / REST Visualizer ] (Echo Show 15 Workbench)
```

---

## MCP Tool Specifications

The server exposes 4 tools via JSON-RPC 2.0 at `/mcp`:

| Tool | Parameters | Description |
| :--- | :--- | :--- |
| `verify_voice_authenticity` | `audio_base64: str` | Analyzes 16kHz PCM audio buffers for high-frequency spectral rolloff (< 0.012 at >7.2kHz) and harmonic uniformity typical of synthetic vocoders. |
| `detect_coercion_intent` | `transcript: str`, `context: dict` | Dispatches transcript to AWS Bedrock runtime to classify threat categories (`GRANDPARENT_IMPERSONATION`, `AMBIENT_UNAUTHORIZED_TRIGGER`, `LAW_ENFORCEMENT_IMPERSONATION`). |
| `quarantine_smart_home` | `threat_id: str`, `lockdown_level: str`, `reason: str` | Actuates physical lockdown on connected Ring deadbolts, garage doors, and freezes voice-purchasing credentials. |
| `dispatch_guardian_alert` | `incident_id: str`, `alert_severity: str`, `message: str` | Dispatches cryptographic incident payload with timestamps to caregiver contact lists. |

---

## Setup & Running Locally

### Requirements
* Python 3.9+
* Node or any modern web browser

### 1. Installation
```bash
git clone https://github.com/Mehatva/echoguard-alexa-mcp.git
cd echoguard-alexa-mcp/backend

python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Environment (Optional)
If running against a live AWS account:
```bash
export AWS_ACCESS_KEY_ID="your_key"
export AWS_SECRET_ACCESS_KEY="your_secret"
export AWS_REGION="us-east-1"
export AWS_BEDROCK_MODEL_ID="anthropic.claude-3-5-sonnet-20241022-v2:0"
```
*Note: If AWS credentials are not set, the daemon runs in local heuristic evaluation mode for seamless local reproduction.*

### 3. Start Daemon
```bash
python main.py
```
* **Workbench UI:** `http://localhost:8000`
* **MCP Streamable RPC:** `http://localhost:8000/mcp`
* **API Documentation:** `http://localhost:8000/docs`

---

## Project Layout

```
echoguard/
├── backend/
│   ├── main.py             # FastAPI entrypoint, WebSocket tracker, REST endpoints
│   ├── mcp_server.py       # Standards-compliant Model Context Protocol implementation
│   ├── bedrock_service.py  # AWS Bedrock runtime integration & intent classifier
│   ├── audio_analyzer.py   # Signal processing & vocoder artifact detection
│   └── requirements.txt    # Minimal dependency manifest
├── frontend/
│   ├── index.html          # Clean device workbench UI
│   ├── style.css           # Production-grade systems styling
│   └── app.js              # Oscilloscope renderer & telemetry client
├── docs/
│   ├── AMAZON_FRICTION_LOG.md # Developer experience feedback & platform audit
│   ├── VIDEO_SCRIPT.md        # 2m 30s demonstration script
│   └── DEVPOST_SUBMISSION.md  # Official submission documentation
└── README.md
```

---

## License
MIT License. Authored by Mehatva Mansukhani & Team for the Amazon Developer Hackathon 2026.
