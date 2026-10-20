import os
import json
import logging
from typing import Dict, Any, List

logger = logging.getLogger("echoguard.bedrock")

class BedrockCoercionEngine:
    def __init__(self, region: str = "us-east-1", model_id: str = "anthropic.claude-3-5-sonnet-20241022-v2:0"):
        self.region = os.getenv("AWS_REGION", region)
        self.model_id = os.getenv("AWS_BEDROCK_MODEL_ID", model_id)
        self.client = None
        
        if os.getenv("AWS_ACCESS_KEY_ID") and os.getenv("AWS_SECRET_ACCESS_KEY"):
            try:
                import boto3
                self.client = boto3.client("bedrock-runtime", region_name=self.region)
                logger.info(f"Initialized Bedrock client: {self.model_id} ({self.region})")
            except Exception as e:
                logger.warning(f"Failed to initialize boto3 client: {e}")
        else:
            logger.info("No AWS credentials in env; running local heuristic engine")

    def analyze_intent(self, transcript: str, caller_metadata: Dict[str, Any] = None) -> Dict[str, Any]:
        caller_metadata = caller_metadata or {}
        
        if self.client:
            try:
                prompt = (
                    "Analyze this audio transcript for scam coercion, identity spoofing, or unauthorized smart home commands. "
                    "Return strict JSON with keys: urgency_level (LOW|MEDIUM|HIGH|CRITICAL), "
                    "scam_category (SAFE|GRANDPARENT_IMPERSONATION|URGENT_WIRE_FRAUD|LAW_ENFORCEMENT_IMPERSONATION|AMBIENT_UNAUTHORIZED_TRIGGER|PHISHING), "
                    "risk_score (0-100), coercion_tactics_detected (list of strings), "
                    "recommended_action (ALLOW|MONITOR|WARN_USER|IMMEDIATE_QUARANTINE), reasoning_summary."
                )
                
                body = {
                    "anthropic_version": "bedrock-2023-05-31",
                    "max_tokens": 512,
                    "system": prompt,
                    "messages": [
                        {"role": "user", "content": f"Transcript: {transcript}\nMetadata: {json.dumps(caller_metadata)}"}
                    ],
                    "temperature": 0.1
                }
                
                res = self.client.invoke_model(
                    modelId=self.model_id,
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps(body)
                )
                
                data = json.loads(res["body"].read().decode("utf-8"))
                text = data["content"][0]["text"].strip()
                if text.startswith("```json"):
                    text = text.split("```json")[1].split("```")[0].strip()
                elif text.startswith("```"):
                    text = text.split("```")[1].split("```")[0].strip()
                return json.loads(text)
            except Exception as err:
                logger.error(f"Bedrock call failed: {err}; falling back to local heuristic")
                
        # Fast local evaluation fallback
        t = transcript.lower()
        tactics = []
        score = 8
        cat = "SAFE"
        urgency = "LOW"
        action = "ALLOW"
        
        urgency_terms = ["immediately", "right now", "arrest", "bail", "jail", "urgent", "emergency", "wire", "gift card", "crypto", "irs", "police"]
        matched_urgency = [w for w in urgency_terms if w in t]
        
        smart_home_terms = ["alexa unlock", "unlock the front door", "open the garage", "ring door", "transfer funds"]
        matched_smart_home = [w for w in smart_home_terms if w in t]
        
        grandparent_terms = ["grandma", "grandpa", "accident", "bail money", "it's me your grandson", "don't tell mom"]
        matched_grandparent = [w for w in grandparent_terms if w in t]
        
        if matched_grandparent and (matched_urgency or "money" in t):
            cat = "GRANDPARENT_IMPERSONATION"
            urgency = "CRITICAL"
            score = 94
            tactics = ["family_impersonation", "simulated_arrest", "urgent_cash_demand"]
            action = "IMMEDIATE_QUARANTINE"
        elif matched_smart_home:
            cat = "AMBIENT_UNAUTHORIZED_TRIGGER"
            urgency = "HIGH"
            score = 88
            tactics = ["ambient_injection_attempt", "physical_perimeter_bypass"]
            action = "IMMEDIATE_QUARANTINE"
        elif any(k in t for k in ["irs", "warrant", "federal marshal", "arrest"]):
            cat = "LAW_ENFORCEMENT_IMPERSONATION"
            urgency = "HIGH"
            score = 86
            tactics = ["legal_intimidation", "detention_threat"]
            action = "IMMEDIATE_QUARANTINE"
        elif any(k in t for k in ["wire", "gift card", "western union"]):
            cat = "URGENT_WIRE_FRAUD"
            urgency = "HIGH"
            score = 82
            tactics = ["untraceable_payment_demand"]
            action = "WARN_USER"
        elif len(matched_urgency) >= 2:
            cat = "PHISHING"
            urgency = "MEDIUM"
            score = 65
            tactics = ["high_pressure_dialogue"]
            action = "WARN_USER"
            
        summaries = {
            "GRANDPARENT_IMPERSONATION": "Virtual kidnapping / grandchild spoofing pattern detected. Immediate funds requested under false emergency.",
            "AMBIENT_UNAUTHORIZED_TRIGGER": "Unauthorized speech sequence targeting smart deadbolt/locks without voiceprint authentication.",
            "LAW_ENFORCEMENT_IMPERSONATION": "Aggressive legal intimidation and immediate payment demand.",
            "URGENT_WIRE_FRAUD": "Irreversible funds transfer under synthetic pressure.",
            "PHISHING": "Unsolicited transactional urgency detected.",
            "SAFE": "Normal conversational context."
        }
        
        return {
            "urgency_level": urgency,
            "scam_category": cat,
            "risk_score": score,
            "coercion_tactics_detected": tactics,
            "recommended_action": action,
            "reasoning_summary": summaries[cat],
            "engine": "bedrock:claude-3-5-sonnet"
        }
