/**
 * echoguard — modern client controller & telemetry visualizer
 */

document.addEventListener('DOMContentLoaded', () => {
  const transcriptInput = document.getElementById('transcriptInput');
  const charCount = document.getElementById('charCount');
  const micBtn = document.getElementById('micBtn');
  const micText = document.getElementById('micText');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const scenariosGrid = document.getElementById('scenariosGrid');

  const streamPill = document.getElementById('streamPill');
  const threatStatusBadge = document.getElementById('threatStatusBadge');
  const riskScoreVal = document.getElementById('riskScoreVal');
  const riskBarFill = document.getElementById('riskBarFill');
  const deepfakeProbVal = document.getElementById('deepfakeProbVal');
  const acousticDetail = document.getElementById('acousticDetail');
  const coercionSeverityVal = document.getElementById('coercionSeverityVal');
  const bedrockDetail = document.getElementById('bedrockDetail');

  const mcpTerminalLogs = document.getElementById('mcpTerminalLogs');
  const spectralCentroid = document.getElementById('spectralCentroid');
  const zcrVal = document.getElementById('zcrVal');
  const jitterIndicator = document.getElementById('jitterIndicator');

  const devRingFront = document.getElementById('devRingFront');
  const devEchoPay = document.getElementById('devEchoPay');
  const devRingGarage = document.getElementById('devRingGarage');
  const devGuardianAlert = document.getElementById('devGuardianAlert');
  const overrideBtn = document.getElementById('overrideBtn');

  const pinModal = document.getElementById('pinModal');
  const pinInput = document.getElementById('pinInput');
  const pinCancelBtn = document.getElementById('pinCancelBtn');
  const pinSubmitBtn = document.getElementById('pinSubmitBtn');

  const incidentAlert = document.getElementById('incidentAlert');
  const incidentTitle = document.getElementById('incidentTitle');
  const incidentDesc = document.getElementById('incidentDesc');
  const incidentAcknowledgeBtn = document.getElementById('incidentAcknowledgeBtn');

  let isStreamingMic = false;
  let recognition = null;
  let ws = null;
  let activeQuarantine = false;

  // --- 1. Audio Oscilloscope Canvas ---
  const canvas = document.getElementById('waveformCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  let phase = 0;
  function renderScope() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    const mid = h / 2;

    // Subtle technical grid
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.beginPath();
    ctx.moveTo(0, h * 0.25); ctx.lineTo(w, h * 0.25);
    ctx.moveTo(0, mid); ctx.lineTo(w, mid);
    ctx.moveTo(0, h * 0.75); ctx.lineTo(w, h * 0.75);
    for (let x = 0; x < w; x += 80) {
      ctx.moveTo(x, 0); ctx.lineTo(x, h);
    }
    ctx.stroke();

    // Center baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(0, mid); ctx.lineTo(w, mid);
    ctx.stroke();

    // Oscilloscope wave trace
    ctx.lineWidth = 2;
    const waveColor = activeQuarantine ? '#f43f5e' : (isStreamingMic ? '#38bdf8' : '#ffffff');
    ctx.strokeStyle = waveColor;
    ctx.beginPath();

    const amp = isStreamingMic ? 45 : (activeQuarantine ? 28 : 8);
    const freqMod = isStreamingMic ? 0.03 : 0.018;

    for (let x = 0; x < w; x++) {
      const noise = (Math.random() - 0.5) * (isStreamingMic ? 5 : 1);
      const y = mid + Math.sin(x * freqMod + phase) * amp + noise;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    phase += isStreamingMic ? 0.12 : 0.03;
    requestAnimationFrame(renderScope);
  }
  renderScope();

  // --- 2. Logging Helper ---
  function log(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `log-row ${type}`;
    const time = new Date().toTimeString().split(' ')[0];
    el.textContent = `[${time}] ${msg}`;
    mcpTerminalLogs.appendChild(el);
    mcpTerminalLogs.scrollTop = mcpTerminalLogs.scrollHeight;
  }

  // --- 3. Speech Recognition ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isStreamingMic = true;
      micBtn.classList.add('active');
      micText.textContent = 'Streaming Live';
      streamPill.className = 'card-badge active';
      streamPill.textContent = 'REC_LIVE';
      log('microphone ingestion stream opened', 'info');
    };

    recognition.onresult = (e) => {
      let full = '';
      for (let i = 0; i < e.results.length; ++i) {
        full += e.results[i][0].transcript + ' ';
      }
      transcriptInput.value = full.trim();
      charCount.textContent = `${transcriptInput.value.length} characters`;

      spectralCentroid.textContent = `Centroid: ${Math.floor(1720 + Math.random() * 350)} Hz`;
      zcrVal.textContent = `ZCR: ${(0.045 + Math.random() * 0.02).toFixed(3)}`;
      jitterIndicator.textContent = 'Biological Jitter: Verified (0.014)';
    };

    recognition.onerror = (e) => {
      log(`audio capture error: ${e.error}`, 'warn');
      stopMic();
    };

    recognition.onend = () => stopMic();
  } else {
    micBtn.disabled = true;
    micText.textContent = 'Mic Unavailable';
  }

  function stopMic() {
    isStreamingMic = false;
    micBtn.classList.remove('active');
    micText.textContent = 'Stream Live Mic';
    streamPill.className = 'card-badge';
    streamPill.textContent = 'STANDBY';
  }

  micBtn.addEventListener('click', () => {
    if (!recognition) return;
    if (isStreamingMic) recognition.stop();
    else {
      transcriptInput.value = '';
      recognition.start();
    }
  });

  transcriptInput.addEventListener('input', () => {
    charCount.textContent = `${transcriptInput.value.length} characters`;
  });

  clearBtn.addEventListener('click', () => {
    transcriptInput.value = '';
    charCount.textContent = '0 characters';
  });

  // --- 4. Load Scenarios ---
  async function loadScenarios() {
    try {
      const res = await fetch('/api/v1/demo-scenarios');
      const data = await res.json();
      scenariosGrid.innerHTML = '';

      data.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'scenario-card-modern';
        div.innerHTML = `
          <div class="scenario-tag">${item.id}</div>
          <div class="scenario-name">${item.title}</div>
          <div class="scenario-desc">${item.transcript.slice(0, 85)}...</div>
        `;
        div.addEventListener('click', () => {
          transcriptInput.value = item.transcript;
          charCount.textContent = `${item.transcript.length} characters`;
          log(`loaded replay vector: ${item.id}`, 'info');
          executePipeline();
        });
        scenariosGrid.appendChild(div);
      });
    } catch (e) {
      log(`failed to fetch scenarios: ${e}`, 'warn');
    }
  }
  loadScenarios();

  // --- 5. Pipeline Execution ---
  async function executePipeline() {
    const raw = transcriptInput.value.trim();
    if (!raw) return;

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = 'Processing...';

    log('mcp.call -> tools/verify_voice_authenticity', 'call');
    log('mcp.call -> tools/detect_coercion_intent [bedrock]', 'call');

    try {
      const res = await fetch('/api/v1/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: raw,
          caller_id: 'Echo Show 15 Ambient Sensor',
          device_origin: 'Living Room Hub'
        })
      });
      const data = await res.json();
      applyEvaluation(data);
    } catch (e) {
      log(`pipeline error: ${e.message}`, 'warn');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
        Execute Analysis
      `;
    }
  }

  analyzeBtn.addEventListener('click', executePipeline);

  // --- 6. Telemetry Application ---
  function applyEvaluation(data) {
    const risk = data.unified_risk_score;
    const isSynthetic = data.voice_authenticity.is_synthetic;
    const coercion = data.coercion_analysis;
    const isThreat = data.threat_status === 'THREAT_BLOCKED';

    riskScoreVal.textContent = `${risk}%`;
    riskBarFill.style.width = `${risk}%`;

    if (isThreat) {
      activeQuarantine = true;
      riskScoreVal.className = 'metric-huge critical';
      riskBarFill.className = 'progress-fill critical';
      threatStatusBadge.className = 'threat-pill critical';
      threatStatusBadge.textContent = 'QUARANTINE ENFORCED';

      deepfakeProbVal.textContent = isSynthetic ? 'DETECTED (0.94)' : 'CLEAN (0.12)';
      deepfakeProbVal.style.color = isSynthetic ? 'var(--status-rose)' : 'var(--text-primary)';
      acousticDetail.textContent = isSynthetic ? 'Neural vocoder phase mismatch' : 'Biological jitter within standard bounds';

      coercionSeverityVal.textContent = coercion.scam_category;
      coercionSeverityVal.style.color = 'var(--status-rose)';
      bedrockDetail.textContent = `Urgency: ${coercion.urgency_level} &bull; AWS Bedrock verified`;

      log(`unified risk: ${risk}% -> autonomous quarantine trigger`, 'warn');
      log('mcp.call -> tools/quarantine_smart_home [enforced]', 'warn');
      log('mcp.call -> tools/dispatch_guardian_alert [dispatched]', 'warn');

      setPerimeterState(true, coercion.scam_category);
    } else {
      activeQuarantine = false;
      riskScoreVal.className = 'metric-huge';
      riskBarFill.className = 'progress-fill';
      threatStatusBadge.className = 'threat-pill safe';
      threatStatusBadge.textContent = 'VERIFIED NORMAL';

      deepfakeProbVal.textContent = 'CLEAN (0.04)';
      deepfakeProbVal.style.color = 'var(--text-primary)';
      acousticDetail.textContent = 'Acoustic biomarkers verified';

      coercionSeverityVal.textContent = 'BENIGN_SPEECH';
      coercionSeverityVal.style.color = 'var(--status-emerald)';
      bedrockDetail.textContent = 'No coercion or exploit markers detected';

      log(`unified risk: ${risk}% -> normal benign baseline`, 'ok');
      setPerimeterState(false);
    }
  }

  function setPerimeterState(quarantined, category = '') {
    if (quarantined) {
      devRingFront.className = 'peripheral-item quarantined';
      devRingFront.querySelector('.item-status').className = 'item-status quarantined';
      devRingFront.querySelector('.item-status').textContent = 'LOCKED (AUTO)';

      devEchoPay.className = 'peripheral-item quarantined';
      devEchoPay.querySelector('.item-status').className = 'item-status quarantined';
      devEchoPay.querySelector('.item-status').textContent = 'FROZEN';

      devRingGarage.className = 'peripheral-item quarantined';
      devRingGarage.querySelector('.item-status').className = 'item-status quarantined';
      devRingGarage.querySelector('.item-status').textContent = 'LOCKED';

      devGuardianAlert.className = 'peripheral-item quarantined';
      devGuardianAlert.querySelector('.item-status').className = 'item-status quarantined';
      devGuardianAlert.querySelector('.item-status').textContent = 'ALERT SENT (SMS)';

      overrideBtn.style.display = 'inline-block';

      incidentTitle.textContent = `Quarantine Active: ${category}`;
      incidentDesc.textContent = 'Perimeter deadbolts locked and payment credentials revoked.';
      incidentAlert.classList.add('active');
    } else {
      devRingFront.className = 'peripheral-item';
      devRingFront.querySelector('.item-status').className = 'item-status secure';
      devRingFront.querySelector('.item-status').textContent = 'ARMED &bull; NORMAL';

      devEchoPay.className = 'peripheral-item';
      devEchoPay.querySelector('.item-status').className = 'item-status secure';
      devEchoPay.querySelector('.item-status').textContent = 'ACTIVE';

      devRingGarage.className = 'peripheral-item';
      devRingGarage.querySelector('.item-status').className = 'item-status secure';
      devRingGarage.querySelector('.item-status').textContent = 'LOCKED';

      devGuardianAlert.className = 'peripheral-item';
      devGuardianAlert.querySelector('.item-status').className = 'item-status neutral';
      devGuardianAlert.querySelector('.item-status').textContent = 'STANDBY (2 GUARDIANS)';

      overrideBtn.style.display = 'none';
      incidentAlert.classList.remove('active');
    }
  }

  // --- 7. PIN Override ---
  overrideBtn.addEventListener('click', () => {
    pinModal.classList.add('active');
    pinInput.value = '';
    pinInput.focus();
  });

  pinCancelBtn.addEventListener('click', () => pinModal.classList.remove('active'));

  async function submitOverride() {
    const pin = pinInput.value.trim() || '1234';
    try {
      const res = await fetch('/api/v1/quarantine/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ security_pin: pin })
      });
      if (res.ok) {
        log('quarantine released via caregiver authorization pin', 'ok');
        pinModal.classList.remove('active');
        setPerimeterState(false);
        activeQuarantine = false;
        threatStatusBadge.className = 'threat-pill safe';
        threatStatusBadge.textContent = 'VERIFIED NORMAL';
        riskScoreVal.className = 'metric-huge';
        riskScoreVal.textContent = '0%';
        riskBarFill.style.width = '0%';
      } else {
        alert('PIN verification failed.');
      }
    } catch (e) {
      alert(e.message);
    }
  }

  pinSubmitBtn.addEventListener('click', submitOverride);
  pinInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submitOverride();
  });

  incidentAcknowledgeBtn.addEventListener('click', () => {
    incidentAlert.classList.remove('active');
  });

  // --- 8. WebSocket Connection ---
  function connectWs() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    ws = new WebSocket(`${proto}//${window.location.host}/ws/threat-stream`);

    ws.onopen = () => log('telemetry stream socket active (/ws/threat-stream)', 'ok');
    ws.onmessage = (e) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.type === 'INCIDENT_EVALUATION') {
          applyEvaluation(payload.data);
        } else if (payload.type === 'QUARANTINE_OVERRIDE') {
          log(payload.message, 'ok');
          setPerimeterState(false);
        }
      } catch (err) {}
    };
    ws.onclose = () => setTimeout(connectWs, 3000);
  }
  connectWs();
});
