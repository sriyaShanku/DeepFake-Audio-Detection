/**
 * call-detection.js - Handles real-time microphone recording and WebSocket streaming
 */

//const WS_URL = 'ws://localhost:8000/ws/realtime';
const WS_URL = 'wss://realtime-deepfake-audio-detection.onrender.com/ws/realtime';

let websocket = null;
let audioContext = null;
let scriptProcessor = null;
let mediaStreamSource = null;
let stream = null;

let isMonitoring = false;
let chunkBuffer = [];
let sampleRate = 22050; // Target sample rate 
let lastLogTime = 0;

document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById('start-monitoring-btn');
    const stopBtn = document.getElementById('stop-monitoring-btn');
    const statusDot = document.getElementById('status-dot');
    const statusText = document.getElementById('status-text');
    const waveformContainer = document.getElementById('waveform-container');
    const waveformPlaceholder = document.getElementById('waveform-placeholder');
    const resultCard = document.getElementById('call-result');
    const resultIcon = document.getElementById('result-icon');
    const resultLabel = document.getElementById('result-label');
    const resultConfidence = document.getElementById('result-confidence');
    const resultBadge = document.getElementById('result-badge');
    const logEntries = document.getElementById('log-entries');
    const detectionLogPanel = document.getElementById('detection-log');
    const alertPopup = document.getElementById('deepfake-alert-popup');
    const dismissAlertBtn = document.getElementById('dismiss-alert-btn');

    // Create waveform bars
    const BAR_COUNT = 30;
    for (let i = 0; i < BAR_COUNT; i++) {
        const bar = document.createElement('div');
        bar.className = 'waveform-bar bg-gray-300 dark:bg-gray-600';
        waveformContainer.appendChild(bar);
    }
    const waveBars = waveformContainer.querySelectorAll('.waveform-bar');

    if (!startBtn || !stopBtn) return; // Not on the right page

    startBtn.addEventListener('click', startMonitoring);
    stopBtn.addEventListener('click', stopMonitoring);
    
    if (dismissAlertBtn) {
        dismissAlertBtn.addEventListener('click', () => {
            alertPopup.classList.add('hidden');
        });
    }

    async function startMonitoring() {
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            
            // Connect WebSocket
            connectWebSocket();

            // Set up audio processing
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const sourceSampleRate = audioContext.sampleRate;
            mediaStreamSource = audioContext.createMediaStreamSource(stream);
            
            // ScriptProcessor is deprecated but works reliably for raw PCM extraction in browser
            scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            mediaStreamSource.connect(scriptProcessor);
            scriptProcessor.connect(audioContext.destination);

            scriptProcessor.onaudioprocess = function(e) {
                if (!isMonitoring) return;
                
                const inputData = e.inputBuffer.getChannelData(0); // Float32Array [-1.0, 1.0]
                
                // Downsample to 22050Hz if needed and convert to 16-bit PCM
                const pcm16Data = encodePCM(inputData);
                chunkBuffer.push(pcm16Data);
                
                // Update waveform UI
                updateWaveform(inputData);
                
                // Send chunk roughly every 1.5 seconds
                if (chunkBuffer.length >= 10) { // ~0.9s @ 4096 samples 
                    sendAudioChunk();
                }
            };

            // Update UI
            isMonitoring = true;
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            statusDot.className = 'w-3 h-3 rounded-full recording-dot';
            statusText.textContent = 'Monitoring Call...';
            statusText.classList.add('text-red-500', 'font-bold');
            waveformPlaceholder.classList.add('hidden');
            detectionLogPanel.classList.remove('hidden');
            resultCard.classList.add('hidden');
            
            logMessage("Started monitoring microphone.", "info");

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Could not access microphone. Please ensure permissions are granted.");
            logMessage(`Microphone error: ${err.message}`, "error");
        }
    }

    function stopMonitoring() {
        isMonitoring = false;
        
        if (scriptProcessor) scriptProcessor.disconnect();
        if (mediaStreamSource) mediaStreamSource.disconnect();
        if (audioContext) audioContext.close();
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        if (websocket && websocket.readyState === WebSocket.OPEN) {
            websocket.close();
        }

        // Reset UI
        startBtn.classList.remove('hidden');
        stopBtn.classList.add('hidden');
        statusDot.className = 'w-3 h-3 rounded-full bg-gray-400';
        statusText.textContent = 'Not Monitoring';
        statusText.classList.remove('text-red-500', 'font-bold');
        waveformPlaceholder.classList.remove('hidden');
        
        // Reset waveform
        waveBars.forEach(bar => {
            bar.style.height = '4px';
            bar.classList.replace('bg-indigo', 'bg-gray-300');
            bar.classList.replace('bg-cyan', 'bg-gray-300');
            bar.classList.replace('dark:bg-indigo', 'dark:bg-gray-600');
            bar.classList.replace('dark:bg-cyan', 'dark:bg-gray-600');
        });
        
        logMessage("Stopped monitoring.", "info");
    }

    function connectWebSocket() {
        websocket = new WebSocket(WS_URL);
        
        websocket.onopen = () => {
            console.log("WebSocket connected");
            logMessage("Connected to analysis server.", "success");
        };
        
        websocket.onclose = () => {
            console.log("WebSocket disconnected");
            if (isMonitoring) {
                logMessage("Disconnected from server. Attempting reconnect...", "warning");
                setTimeout(connectWebSocket, 2000);
            }
        };
        
        websocket.onerror = (error) => {
            console.error("WebSocket error", error);
        };
        
        websocket.onmessage = (event) => {
            try {
                const response = JSON.parse(event.data);
                handleServerResponse(response);
            } catch (e) {
                console.error("Error parsing response:", e);
            }
        };
    }

    function sendAudioChunk() {
        if (!websocket || websocket.readyState !== WebSocket.OPEN) return;
        
        // Combine chunks
        let totalLength = 0;
        for (let i = 0; i < chunkBuffer.length; i++) {
            totalLength += chunkBuffer[i].length;
        }
        
        const combinedPCM = new Int16Array(totalLength);
        let offset = 0;
        for (let i = 0; i < chunkBuffer.length; i++) {
            combinedPCM.set(chunkBuffer[i], offset);
            offset += chunkBuffer[i].length;
        }
        
        // Send as binary
        websocket.send(combinedPCM.buffer);
        
        // Clear buffer
        chunkBuffer = [];
    }

    function handleServerResponse(response) {
        if (response.status === "error") {
            console.error("Server Error:", response.message);
            // Don't spam the log with errors if no audio is present
            if (!response.message.includes("Could not extract")) {
                logMessage(response.message, "error");
            }
            return;
        }
        
        if (response.status === "result") {
            const isFake = response.is_fake;
            const msg = `${response.result} (${response.confidence.toFixed(1)}%)`;
            
            // Throttle logs (1 per second max to avoid spamming UI)
            const now = Date.now();
            if (now - lastLogTime > 1000 || isFake) { // Always log fakes
                logMessage(msg, isFake ? "warning" : "success");
                lastLogTime = now;
            }
            
            // Update Main Result UI Card
            resultCard.classList.remove('hidden');
            resultLabel.textContent = response.result.toUpperCase();
            resultConfidence.textContent = `Confidence: ${response.confidence.toFixed(1)}%`;
            
            const cardInner = document.getElementById('call-result-card');
            
            if (isFake) {
                resultIcon.textContent = "⚠️";
                resultBadge.textContent = "HIGH RISK";
                resultBadge.className = "px-4 py-1.5 rounded-full text-sm font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse";
                cardInner.className = "rounded-xl p-5 border-2 border-red-500 bg-red-50 dark:bg-red-900/10 transition-all duration-300 alert-glow";
                
                // Show Popup Alert if confidence is high
                if (response.confidence > 70) {
                    showDeepfakeAlert(response.confidence.toFixed(1));
                }
            } else {
                resultIcon.textContent = "✅";
                resultBadge.textContent = "SAFE";
                resultBadge.className = "px-4 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
                cardInner.className = "rounded-xl p-5 border-2 border-green-500 bg-green-50 dark:bg-green-900/10 transition-all duration-300";
            }
        }
    }

    let alertTimeout = null;
    function showDeepfakeAlert(confidence) {
        alertPopup.classList.remove('hidden');
        document.getElementById('alert-confidence').textContent = `Confidence: ${confidence}% - Proceed with caution!`;
        
        // Auto hide after 5 seconds
        if (alertTimeout) clearTimeout(alertTimeout);
        alertTimeout = setTimeout(() => {
            alertPopup.classList.add('hidden');
        }, 5000);
    }

    function updateWaveform(data) {
        // Average the buffer down to BAR_COUNT values
        const step = Math.floor(data.length / BAR_COUNT);
        
        for (let i = 0; i < BAR_COUNT; i++) {
            let sum = 0;
            for (let j = 0; j < step; j++) {
                sum += Math.abs(data[(i * step) + j]);
            }
            const average = sum / step;
            
            // Map average (0.0 - 1.0) to height (4px - 100%)
            const heightRaw = Math.max(4, average * 300); // multiplier to make it visible
            const height = Math.min(100, heightRaw);
            
            waveBars[i].style.height = `${height}%`;
            
            // Colorizing based on amplitude
            waveBars[i].className = 'waveform-bar ' + (height > 30 ? 'bg-indigo dark:bg-indigo' : 'bg-cyan dark:bg-cyan');
        }
    }

    function encodePCM(float32Array) {
        const pcm16Data = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            pcm16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return pcm16Data;
    }

    function logMessage(text, type = "info") {
        const item = document.createElement('div');
        const time = new Date().toLocaleTimeString('en-US', {hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit'});
        
        let colorClass = "text-gray-500 dark:text-gray-400";
        let icon = "info-circle";
        
        if (type === "warning") { colorClass = "text-red-500"; icon = "exclamation-triangle"; }
        else if (type === "success") { colorClass = "text-green-500"; icon = "check-circle"; }
        else if (type === "error") { colorClass = "text-orange-500"; icon = "times-circle"; }

        item.className = `text-xs py-1.5 border-b border-gray-100 dark:border-gray-800 ${colorClass} flex gap-2 items-start fade-in`;
        item.innerHTML = `<span class="opacity-50">[${time}]</span> <i class="fas fa-${icon} mt-0.5"></i> <span>${text}</span>`;
        
        logEntries.prepend(item);
        
        // Keep max 20 entries
        if (logEntries.children.length > 20) {
            logEntries.lastChild.remove();
        }
    }
});
