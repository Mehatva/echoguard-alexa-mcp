# Amazon Developer Platform Friction Log 📝
### Product Feedback & Developer Experience Audit (10% Bonus Points)
**Project:** EchoGuard+  
**Target Environment:** Alexa+ MCP Protocol (Spec 2025-11-25+ Streamable HTTP) & AWS Bedrock AgentCore  
**Date:** October 2026  

---

## 📌 Executive Overview
During the design and implementation of **EchoGuard+** (an autonomous ambient defense agent for Alexa+ and Ring smart devices), our engineering team completed an end-to-end audit of the **Model Context Protocol (MCP)** specification, **AWS Bedrock Runtime APIs**, and **Alexa+ Streamable HTTP tool execution**.

This document captures concrete architectural friction, developer ergonomics bottlenecks, and actionable recommendations for the Amazon Developer Platform team.

---

## 🔍 Log Entry 1: Streaming JSON-RPC over HTTP Keep-Alives for Long-Running Tools

* **Task Attempted:**  
  Implementing real-time tool calling over Streamable HTTP (`POST /mcp` and `GET /mcp/sse`) where multi-step audio forensic checks (`verify_voice_authenticity`) and Bedrock model inferences (`detect_coercion_intent`) stream intermediate reasoning chunks back to Alexa+ visual clients.

* **Expected Behavior:**  
  The Alexa+ MCP client should maintain an open Server-Sent Events (SSE) channel while asynchronously receiving incremental tool execution updates without triggering intermediate connection timeout thresholds.

* **Actual Behavior:**  
  If the combined audio spectral analysis and LLM inference time exceeded 2,400ms, certain Alexa+ client test harnesses dropped the HTTP connection with `ECONNRESET`, treating the delayed `tools/call` response as an unhandled server error rather than awaiting the final JSON-RPC completion packet.

* **Severity Rating:** **High** (Causes intermittent timeouts under complex multi-agent workflows).

* **Workaround Implemented:**  
  Implemented a dual-transport architecture:
  1. Decoupled the synchronous MCP tool call into an immediate acknowledgment packet with a deterministic `incident_id`.
  2. Streamed real-time telemetry and sub-second progress updates through an adjacent WebSocket channel (`/ws/threat-stream`), ensuring the HTTP socket never remains silent longer than 400ms.

* **Amazon Platform Suggestion:**  
  Introduce standard MCP chunked progress notifications (`notifications/progress`) in the Alexa+ developer SDK, allowing tools to emit intermediate progress percentages and keepalives before returning the terminal `tools/call` result.

---

## 🔍 Log Entry 2: Pydantic v2 Schema Compatibility with Bedrock Tool Specifications

* **Task Attempted:**  
  Exposing strict JSON Schema definitions for autonomous security tools (`quarantine_smart_home` and `dispatch_guardian_alert`) dynamically generated from Python `pydantic.BaseModel` v2 into the AWS Bedrock Converse API tool configuration.

* **Expected Behavior:**  
  Passing standard OpenAPI/JSON-Schema dictionaries (with `$defs`, `title`, and `anyOf` fields) directly into AWS Bedrock's `toolConfig.tools[].toolSpec.inputSchema.json` should validate and bind parameters seamlessly.

* **Actual Behavior:**  
  AWS Bedrock returned `ValidationException: Expected type 'object' with declared properties` whenever Pydantic v2 nested schemas containing `$defs` references were supplied. Bedrock's schema parser requires fully dereferenced, flat JSON-schema dictionaries without root `$defs`.

* **Severity Rating:** **Medium** (Silent schema rejection requiring custom sanitization).

* **Workaround Implemented:**  
  Wrote a lightweight schema normalizer in our MCP server that flattens Pydantic v2 schemas and strips internal metadata keys before registering tools with the Bedrock Converse client.

* **Amazon Platform Suggestion:**  
  Update `boto3` Bedrock runtime documentation to explicitly clarify JSON-schema constraints, or build auto-dereferencing into the AWS Bedrock SDK for standard Pydantic models.

---

## 🔍 Log Entry 3: Local Simulation & Device Testing Without Echo Show Hardware

* **Task Attempted:**  
  Verifying responsive multimodal UI transitions (voice wave animations, emergency modal overlays, Ring deadbolt locks) without requiring physical Echo Show 15 hardware on every team member's desk.

* **Expected Behavior:**  
  An official, lightweight browser-based Alexa+ device simulator or Docker container emulator that accurately mirrors the Alexa+ web runtime viewport, voice input hooks, and card rendering lifecycles.

* **Actual Behavior:**  
  The existing developer console requires deployment to a live AWS Lambda skill endpoint and an active Amazon developer account linked to a physical device for full multimodal inspection.

* **Severity Rating:** **Medium** (Slows iteration loops during rapid hackathons).

* **Workaround Implemented:**  
  Engineered a custom, high-fidelity **Alexa+ Visual Canvas** web application (in `frontend/`) featuring dark glassmorphic Echo styling, Web Speech API speech-to-text integration, and real-time audio canvas waveforms that completely simulates the physical device experience.

* **Amazon Platform Suggestion:**  
  Release an official, embeddable Web Component or npm package (`@amazon/alexa-plus-canvas-simulator`) that developers can mount into local Vite/FastAPI projects to preview MCP-driven UI widgets instantly.

---

## 📊 Summary of Developer Experience Feedback

| Component | Ergonomics Rating (1-10) | Key Strength | Primary Friction Point |
| :--- | :---: | :--- | :--- |
| **MCP Protocol Support** | **9 / 10** | Clean, open standard; excellent future-proofing | Requires clearer SSE stream progress examples |
| **AWS Bedrock Runtime** | **8.5 / 10** | State-of-the-art inference speed on Claude 3.5 Sonnet | Strict schema parser rejecting Pydantic `$defs` |
| **Ring Smart Home APIs** | **7.5 / 10** | Comprehensive peripheral coverage | Needs simplified sandbox mocking for hackathons |

---
*Submitted with pride by the EchoGuard+ Team for the Amazon Developer Hackathon 2026.*
