# Devpost Submission Text 📋
### Amazon Developer Hackathon 2026: Build, Ship, Shape

---

### Project Title
**EchoGuard+ : Autonomous Ambient Voice Integrity & Threat Defense Agent for Alexa+ & Ring**

### Elevator Pitch (One-liner)
The first autonomous ambient defense agent for Alexa+ and Ring devices, using the Model Context Protocol (MCP) and AWS Bedrock to intercept AI deepfake voice cloning scams, unauthorized door unlock injections, and financial elder fraud in real time.

---

### Tracks Targeted
* **Primary Track:** Alexa+ Track
* **Mini-Challenge 1:** AWS Builder Challenge (AWS Bedrock AgentCore)
* **Mini-Challenge 2:** Open Source Challenge (Public MIT Repository)

---

### Inspiration
In 2026, artificial intelligence gave everyone the power of voice cloning with just 3 seconds of reference audio. While this enables magical experiences, it has unleashed a terrifying wave of virtual kidnapping, grandparent impersonation scams, and smart home exploitation. Vulnerable populations—especially elderly family members living alone—are losing their life savings to panic-inducing calls claiming a grandchild was arrested.

As Amazon transitions Alexa into **Alexa+**, giving it autonomous agentic power to control Ring smart deadbolts, order goods, and execute financial transactions, ambient voice security can no longer be an afterthought. We asked ourselves: *What if Alexa+ wasn't just a passive speaker, but an active, intelligent guardian protecting the home from audio exploitation?* That vision became **EchoGuard+**.

---

### What It Does
**EchoGuard+** operates as an autonomous background sentinel for Alexa+ and Echo Show devices:
1. **Acoustic Deepfake Forensics:** Inspects incoming voice streams for neural vocoder phase truncations, unnatural harmonic uniformity, and absence of biological pitch jitter.
2. **Bedrock Semantic Coercion Detection:** Evaluates dialogue transcripts through **AWS Bedrock (Claude 3.5 Sonnet / Amazon Nova)** to flag psychological pressure tactics, manufactured legal emergencies (IRS/police impersonation), and unauthorized door unlock attempts.
3. **Autonomous Smart Home Quarantine:** If high-confidence fraud is detected, EchoGuard+ autonomously locks **Ring front deadbolts**, disables **Echo 1-Click Voice Purchasing**, and seals entry points before physical or financial harm occurs.
4. **Multi-Channel Emergency Dispatch:** Immediately sends cryptographic incident reports with audio forensics logs and transcripts to designated family caregivers via SMS, Push, and visual Echo Show alerts.
5. **Caregiver PIN Override:** Provides a seamless 4-digit PIN verification workflow so legitimate family members can release quarantines instantly.

---

### How We Built It
* **Model Context Protocol (MCP) Server:** Implemented in Python FastAPI conforming strictly to the Anthropic/Amazon MCP Specification (2025-11-25+ Streamable HTTP & JSON-RPC 2.0), exposing 4 deterministic tools: `verify_voice_authenticity`, `detect_coercion_intent`, `quarantine_smart_home`, and `dispatch_guardian_alert`.
* **AWS Bedrock AgentCore:** Orchestrates multi-turn intent reasoning and urgency extraction without hallucination.
* **Audio Forensics Engine:** Custom signal processing pipeline analyzing zero-crossing rates, spectral centroids, spectral flatness, and high-frequency attenuation ratios.
* **Simulated Alexa+ Visual Canvas:** A responsive, dark glassmorphic Echo Show 15 web application built with Vanilla CSS and modern Web Speech API capabilities, delivering 60fps audio waveform visualizations and real-time WebSocket telemetry.

---

### Challenges We Ran Into
1. **Streaming JSON-RPC over HTTP Keep-Alives:** Long-running acoustic analysis combined with LLM inference occasionally pushed HTTP timeout limits. We resolved this by engineering a dual-transport architecture that combines immediate MCP acknowledgment tokens with an adjacent real-time WebSocket telemetry feed.
2. **Pydantic v2 to AWS Bedrock Schema Translation:** Bedrock's schema parser rejects nested `$defs` references produced by standard Pydantic models. We wrote a custom schema normalizer to auto-flatten and dereference parameters into compliant Bedrock tool specs.
3. **Minimizing False Positives:** Ensuring everyday conversational banter or emotional voice messages aren't accidentally flagged required fine-tuning our composite Risk Index to balance acoustic biomarkers with semantic urgency.

---

### Accomplishments That We're Proud Of
* Building a full-stack, standards-compliant MCP server with 4 functioning tools from scratch in under 24 hours.
* Creating an ambient interface that preliminary judges can test in under 60 seconds with 1-click evaluation scenarios or their own live microphone.
* Submitting a thorough, 4-page **Amazon Developer Friction Log** documenting actionable platform improvements for Amazon's developer tooling.

---

### What We Learned
Building directly on the new Model Context Protocol (MCP) taught us how powerful standardized agent-tool communication is. Instead of proprietary brittle integrations, MCP allows an Alexa+ agent to interact with specialized security tools as first-class citizens.

---

### What's Next for EchoGuard+
* Integrating on-device C++ ONNX acoustic inference directly on Fire OS and Vega OS hardware.
* Partnering with telecom providers and local emergency dispatchers (e.g., I4C / 911 integrations) for automated law enforcement incident reporting.
* Expanding Ring camera computer vision to cross-reference voice biometric authenticity with front-door facial verification.

---

### Built With
* `amazon-alexa`
* `aws-bedrock`
* `model-context-protocol`
* `fastapi`
* `python`
* `ring-api`
* `websockets`
* `javascript`
