/**
 * api.js - API Fetch requests for prediction
 */

//const API_BASE_URL = 'http://localhost:8000';
const API_BASE_URL = 'https://realtime-deepfake-audio-detection.onrender.com';

window.submitAnalysis = async function (file) {
    if (!file) return;

    try {
        // 1. Kick off the loading sequence
        if (typeof window.showLoadingSequence === 'function') {
            await window.showLoadingSequence();
        }

        // 2. Prepare FormData
        const formData = new FormData();
        formData.append('file', file);

        // 3. Make the fetch call
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            body: formData,
            // no content-type header; fetch sets it with boundary for FormData
        });

        // 4. Advance animation
        if (typeof window.advanceLoadingSequence === 'function') {
            await window.advanceLoadingSequence();
        }

        const data = await response.json();

        // 5. Hide loading
        if (typeof window.hideLoadingSequence === 'function') {
            window.hideLoadingSequence();
        }

        if (!response.ok) {
            throw new Error(data.detail || "Error communicating with server.");
        }

        // 6. Display Result
        if (typeof window.displayResult === 'function') {
            window.displayResult(data);
        }

        // 7. Refresh History Table silently behind the scenes
        if (typeof window.loadHistory === 'function') {
            window.loadHistory();
        }

    } catch (error) {
        console.error("Analysis Error:", error);
        if (typeof window.hideLoadingSequence === 'function') {
            window.hideLoadingSequence();
        }

        const errorMsg = document.getElementById('error-message');
        if (errorMsg) {
            errorMsg.textContent = error.message;
            errorMsg.classList.remove('hidden');
        }
    }
};
