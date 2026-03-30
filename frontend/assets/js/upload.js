/**
 * upload.js - File Drag & Drop, Validation, Preview Loading
 */

let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const uploadPrompt = document.getElementById('upload-prompt');
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('file-name');
    const fileSizeDisplay = document.getElementById('file-size');
    const audioPreviewContainer = document.getElementById('audio-preview-container');
    const audioPlayer = document.getElementById('audio-player');
    const analyzeBtn = document.getElementById('analyze-btn');
    const errorMsg = document.getElementById('error-message');

    // Drag events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('border-indigo', 'bg-indigo/5');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-indigo', 'bg-indigo/5');
        }, false);
    });

    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles(files);
    });

    fileInput.addEventListener('change', function () {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        errorMsg.classList.add('hidden');
        if (files.length === 0) return;

        const file = files[0];

        // Validate Type
        const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/x-wav'];
        const extension = file.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(file.type) && extension !== 'wav' && extension !== 'mp3') {
            showError("Invalid file format. Please upload a .wav or .mp3 file.");
            resetUpload();
            return;
        }

        // Validate Size (Max 50MB)
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            showError("File is too large. Maximum size is 50MB.");
            resetUpload();
            return;
        }

        selectedFile = file;

        // Update UI
        uploadPrompt.classList.add('hidden');
        fileInfo.classList.remove('hidden');

        fileNameDisplay.textContent = file.name;
        fileSizeDisplay.textContent = (file.size / (1024 * 1024)).toFixed(2) + " MB";

        // Audio Preview setup
        const fileURL = URL.createObjectURL(file);
        audioPlayer.src = fileURL;
        audioPreviewContainer.classList.remove('hidden');

        // Enable analyze button
        analyzeBtn.disabled = false;
        analyzeBtn.classList.remove('bg-gray-300', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'pointer-events-none');
        analyzeBtn.classList.add('bg-gradient-to-r', 'from-indigo', 'to-cyan', 'text-white', 'hover:shadow-lg', 'hover:scale-[1.02]');

        // Reset results if there were any
        const resultContainer = document.getElementById('result-container');
        if (resultContainer) resultContainer.classList.add('hidden');
    }

    function showError(msg) {
        errorMsg.textContent = msg;
        errorMsg.classList.remove('hidden');
    }

    function resetUpload() {
        selectedFile = null;
        fileInput.value = "";
        uploadPrompt.classList.remove('hidden');
        fileInfo.classList.add('hidden');
        audioPreviewContainer.classList.add('hidden');
        audioPlayer.src = "";

        analyzeBtn.disabled = true;
        analyzeBtn.classList.add('bg-gray-300', 'dark:bg-gray-700', 'text-gray-500', 'dark:text-gray-400', 'pointer-events-none');
        analyzeBtn.classList.remove('bg-gradient-to-r', 'from-indigo', 'to-cyan', 'text-white', 'hover:shadow-lg', 'hover:scale-[1.02]');
    }

    // Bind Analyze Button click to API call
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', () => {
            if (selectedFile && typeof window.submitAnalysis === 'function') {
                window.submitAnalysis(selectedFile);
            }
        });
    }
});
