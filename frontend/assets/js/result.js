/**
 * result.js - Handles displaying the result card and animating the gauge
 */

let gaugeChart = null;

window.displayResult = function (data) {
    const container = document.getElementById('result-container');
    if (!container) return;

    // Date formatting
    const dateObj = new Date(data.timestamp);
    const dateStr = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const isFake = data.result.includes("Deepfake");

    // Theme colors
    const icon = isFake ? "⚠️" : "✅";
    const titleColor = isFake ? "text-red-500" : "text-green-500";
    const borderColor = isFake ? "border-red-200 dark:border-red-900/50" : "border-green-200 dark:border-green-900/50";
    const bgColor = isFake ? "bg-red-50 dark:bg-red-900/10" : "bg-green-50 dark:bg-green-900/10";

    // HTML Template
    container.innerHTML = `
        <div class="glass-card rounded-2xl shadow-xl overflow-hidden fade-in border ${borderColor} ${bgColor}">
            <div class="p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center md:items-start">
                
                <!-- Left Details -->
                <div class="flex-1 w-full">
                    <h3 class="text-2xl font-bold mb-4 font-poppins ${titleColor}">${icon} ${data.result.toUpperCase()}</h3>
                    
                    <div class="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <p><span class="font-semibold text-gray-900 dark:text-gray-100">File:</span> ${data.filename}</p>
                        <p><span class="font-semibold text-gray-900 dark:text-gray-100">Duration:</span> ${data.duration} seconds</p>
                        <p><span class="font-semibold text-gray-900 dark:text-gray-100">Analyzed:</span> ${dateStr}, ${timeStr}</p>
                        ${isFake ? `<p><span class="font-semibold text-gray-900 dark:text-gray-100">Risk Level:</span> <span class="px-2 py-0.5 rounded text-white text-xs font-bold bg-red-500">🔴 ${data.risk_level}</span></p>` : ''}
                    </div>
                    
                    <div class="mt-6 flex flex-wrap gap-4">
                        <button onclick="window.scrollToSection('upload-section'); document.getElementById('file-input').value='';" class="px-5 py-2.5 bg-white dark:bg-[#151D2F] border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                            <i class="fas fa-redo text-indigo mr-2"></i> Analyze Another
                        </button>
                        <button onclick="window.scrollToSection('history-section');" class="px-5 py-2.5 bg-indigo text-white rounded-lg text-sm font-medium hover:bg-indigo/90 transition-colors shadow-sm">
                            <i class="fas fa-history mr-2"></i> View History
                        </button>
                    </div>
                </div>
                
                <!-- Right Gauge -->
                <div class="w-full md:w-auto flex flex-col items-center justify-center p-4 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Confidence Score</p>
                    <div class="gauge-container">
                        <canvas id="confidence-gauge"></canvas>
                        <div class="confidence-text">
                            <span class="text-3xl font-bold font-poppins text-gray-900 dark:text-white">${data.confidence}%</span>
                        </div>
                    </div>
                </div>
                
            </div>
            
            <!-- Features Breakdown -->
            <div class="bg-white/40 dark:bg-black/40 px-6 py-4 border-t ${borderColor} flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                <span>Features Extracted: ${data.features_extracted.map(f => f.toUpperCase()).join(', ')}</span>
                <span>Model: RandomForest (v1.0)</span>
            </div>
        </div>
    `;

    container.classList.remove('hidden');

    // Render Gauge
    renderGauge(data.confidence, isFake);

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

function renderGauge(score, isFake) {
    const ctx = document.getElementById('confidence-gauge');
    if (!ctx) return;

    if (gaugeChart) {
        gaugeChart.destroy();
    }

    // Determine color based on threshold & result
    // If fake, high score is red. If real, high score is green.
    let color = '#22c55e'; // green
    if (isFake) {
        if (score > 70) color = '#ef4444'; // red
        else if (score > 40) color = '#eab308'; // yellow
    } else {
        if (score < 50) color = '#eab308'; // yellow
    }

    const isDark = document.documentElement.classList.contains('dark');
    const bgColor = isDark ? '#334155' : '#e2e8f0';

    gaugeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            datasets: [{
                data: [score, 100 - score],
                backgroundColor: [color, bgColor],
                borderWidth: 0,
                circumference: 180,
                rotation: 270,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '80%',
            plugins: {
                tooltip: { enabled: false },
                legend: { display: false }
            },
            animation: {
                animateScale: true,
                animateRotate: true,
                duration: 1500,
                easing: 'easeOutQuart'
            }
        }
    });
}
