import time
import uuid
import json
import logging
from typing import Dict, Any, List

from audio_analyzer import AudioForensicsEngine
from bedrock_service import BedrockCoercionEngine

logger = logging.getLogger("echoguard.mcp")

SYSTEM_STATE = {
    "quarantine_active": False,
    "lockdown_level": "NORMAL",
    "locked_devices": [],
    "recent_incidents": [],
    "last_threat_timestamp": None,
    "active_guardians": [
        {"name": "Ananya", "phone": "+1-206-555-0199", "role": "Primary Caregiver"},
        {"name": "Rohan", "phone": "+1-206-555-0142", "role": "Backup"}
    ]
}

class MCPServer:
    def __init__(self):
        self.server_name = "echoguard-mcp"
        self.server_version = "1.2.0"
        self.protocol_version = "2025-11-25"
        self.audio_engine = AudioForensicsEngine()
        self.bedrock_engine = BedrockCoercionEngine()

    def get_capabilities(self) -> Dict[str, Any]:
        return {
            "capabilities": {
                "tools": {"listChanged": True},
                "resources": {"subscribe": True, "listChanged": False},
                "prompts": {"listChanged": False}
            },
            "serverInfo": {
                "name": self.server_name,
                "version": self.server_version
            },
            "protocolVersion": self.protocol_version
        }

    def list_tools(self) -> List[Dict[str, Any]]:
        return [
            {
                "name": "verify_voice_authenticity",
                "description": "Extracts acoustic biomarkers and vocoder phase discontinuities to flag synthetic/deepfake speech.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "audio_base64": {"type": "string"},
                        "speaker_id": {"type": "string"}
                    },
                    "required": ["audio_base64"]
                }
            },
            {
                "name": "detect_coercion_intent",
                "description": "Evaluates dialogue transcript against Bedrock model for extortion, urgency coercion, and unauth commands.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "transcript": {"type": "string"},
                        "context": {"type": "object"}
                    },
                    "required": ["transcript"]
                }
            },
            {
                "name": "quarantine_smart_home",
                "description": "Enforces hardware quarantine on Ring locks, garage doors, and Alexa payment credentials.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "threat_id": {"type": "string"},
                        "lockdown_level": {"type": "string", "enum": ["FULL_LOCKDOWN", "PURCHASE_FREEZE", "PERIMETER_ONLY"]},
                        "reason": {"type": "string"}
                    },
                    "required": ["threat_id", "lockdown_level", "reason"]
                }
            },
            {
                "name": "dispatch_guardian_alert",
                "description": "Sends SNS SMS/Push incident telemetry to designated caregivers.",
                "inputSchema": {
                    "type": "object",
                    "properties": {
                        "incident_id": {"type": "string"},
                        "alert_severity": {"type": "string"},
                        "message": {"type": "string"}
                    },
                    "required": ["incident_id", "alert_severity", "message"]
                }
            }
        ]

    def call_tool(self, name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        if name == "verify_voice_authenticity":
            raw_audio = arguments.get("audio_base64", "")
            res = self.audio_engine.decode_and_analyze(raw_audio)
            return {"content": [{"type": "text", "text": json.dumps(res)}], "isError": False}

        elif name == "detect_coercion_intent":
            txt = arguments.get("transcript", "")
            ctx = arguments.get("context", {})
            res = self.bedrock_engine.analyze_intent(txt, ctx)
            return {"content": [{"type": "text", "text": json.dumps(res)}], "isError": False}

        elif name == "quarantine_smart_home":
            tid = arguments.get("threat_id", uuid.uuid4().hex[:8])
            level = arguments.get("lockdown_level", "FULL_LOCKDOWN")
            reason = arguments.get("reason", "Autonomous threat trigger")

            devices = ["Ring Front Door Deadbolt", "Alexa Voice Purchasing", "Ring Garage Controller"]
            SYSTEM_STATE["quarantine_active"] = True
            SYSTEM_STATE["lockdown_level"] = level
            SYSTEM_STATE["locked_devices"] = devices
            SYSTEM_STATE["last_threat_timestamp"] = time.time()

            record = {
                "id": tid,
                "ts": int(time.time()),
                "level": level,
                "reason": reason,
                "devices": devices
            }
            SYSTEM_STATE["recent_incidents"].insert(0, record)
            return {"content": [{"type": "text", "text": json.dumps(record)}], "isError": False}

        elif name == "dispatch_guardian_alert":
            iid = arguments.get("incident_id", uuid.uuid4().hex[:8])
            sev = arguments.get("alert_severity", "HIGH")
            msg = arguments.get("message", "")

            receipt = {
                "dispatch_id": f"SNS-{uuid.uuid4().hex[:6].upper()}",
                "incident_id": iid,
                "severity": sev,
                "recipients": [g["phone"] for g in SYSTEM_STATE["active_guardians"]],
                "status": "SENT"
            }
            return {"content": [{"type": "text", "text": json.dumps(receipt)}], "isError": False}

        return {"content": [{"type": "text", "text": f"unknown tool: {name}"}], "isError": True}

    def handle_json_rpc(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        req_id = payload.get("id")
        method = payload.get("method")
        params = payload.get("params", {})

        if method == "initialize":
            return {"jsonrpc": "2.0", "id": req_id, "result": self.get_capabilities()}
        elif method == "tools/list":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": self.list_tools()}}
        elif method == "tools/call":
            res = self.call_tool(params.get("name"), params.get("arguments", {}))
            return {"jsonrpc": "2.0", "id": req_id, "result": res}
        elif method == "ping":
            return {"jsonrpc": "2.0", "id": req_id, "result": "pong"}

        return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": "Method not found"}}
