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
    const titleColor = isFake ? "text-rose-500" : "text-emerald-500";
    const borderColor = isFake ? "border-rose-200 dark:border-rose-900/50" : "border-emerald-200 dark:border-emerald-900/50";
    const bgColor = isFake ? "bg-rose-50 dark:bg-rose-900/10" : "bg-emerald-50 dark:bg-emerald-900/10";

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
                        ${isFake ? `<p><span class="font-semibold text-gray-900 dark:text-gray-100">Risk Level:</span> <span class="px-2 py-0.5 rounded text-white text-xs font-bold bg-rose-500">🔴 ${data.risk_level}</span></p>` : ''}
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
                
                <!-- Right Statistics & Gauge -->
                <div class="w-full md:w-1/3 flex flex-col items-center justify-center p-6 bg-white/50 dark:bg-black/20 rounded-xl border border-gray-200 dark:border-gray-800">
                    <p class="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4 whitespace-nowrap">Confidence Score</p>
                    
                    <!-- Circular indicator -->
                    <div class="gauge-container mb-6">
                        <canvas id="confidence-gauge"></canvas>
                        <div class="confidence-text">
                            <span class="text-4xl font-bold font-poppins text-gray-900 dark:text-white">${data.confidence}%</span>
                        </div>
                    </div>
                    
                    <!-- Linear Progress Bar -->
                    <div class="w-full mt-2">
                        <div class="flex justify-between text-xs font-semibold mb-1 w-full text-gray-600 dark:text-gray-400">
                            <span>0%</span>
                            <span>100%</span>
                        </div>
                        <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner">
                            <div class="h-3 rounded-full ${isFake ? 'bg-rose-400' : 'bg-emerald-400'} transition-all duration-1000 ease-out" style="width: 0%" id="linear-confidence-bar"></div>
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

    // Animate linear bar
    setTimeout(() => {
        const linearBar = document.getElementById('linear-confidence-bar');
        if (linearBar) {
            linearBar.style.width = `${data.confidence}%`;
        }
    }, 100);

    // Scroll to results
    container.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

function renderGauge(score, isFake) {
    const ctx = document.getElementById('confidence-gauge');
    if (!ctx) return;

    if (gaugeChart) {
        gaugeChart.destroy();
    }

    // Explicit strict Color Coding: Rose -> Fake, Emerald -> Real
    let color = isFake ? '#FB7185' : '#34D399'; // Soft Rose if fake, Soft Emerald if real

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
