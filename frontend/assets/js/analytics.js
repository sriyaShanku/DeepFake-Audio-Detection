/**
 * analytics.js - Handles fetching history data and displaying charts for Statistics Dashboard
 */

const API_BASE_URL = 'http://localhost:8000';
let analyticsData = [];

document.addEventListener("DOMContentLoaded", () => {
    
    // Load history data from API
    async function fetchAnalyticsData() {
        const loadingState = document.getElementById('analytics-loading');
        const contentState = document.getElementById('analytics-content');
        const emptyState = document.getElementById('analytics-empty');

        try {
            // Re-using the same history endpoint to get data
            const response = await fetch(`${API_BASE_URL}/history?limit=100`);
            if (response.ok) {
                const data = await response.json();
                analyticsData = data;
                
                if (analyticsData.length === 0) {
                    loadingState.classList.add('hidden');
                    emptyState.classList.remove('hidden');
                    return;
                }
                
                processMetrics();
                renderCharts();
                
                loadingState.classList.add('hidden');
                contentState.classList.remove('hidden');
            } else {
                throw new Error("Failed to fetch data");
            }
        } catch (error) {
            console.error("Error loading analytics:", error);
            // Show empty/error state or mock fallback
            loadingState.classList.add('hidden');
            emptyState.classList.remove('hidden');
            document.querySelector('#analytics-empty p').innerText = "Failed to load analytics data. Ensure backend is running.";
        }
    }
    
    function processMetrics() {
        let totalReal = 0;
        let totalFake = 0;
        let totalConfidence = 0;
        
        analyticsData.forEach(item => {
            const isFake = item.result.includes("Deepfake");
            if (isFake) totalFake++;
            else totalReal++;
            
            totalConfidence += parseFloat(item.confidence);
        });
        
        const totalAudios = analyticsData.length;
        const avgConfidence = totalAudios > 0 ? (totalConfidence / totalAudios).toFixed(1) : 0;
        
        document.getElementById('stat-total').innerText = totalAudios;
        document.getElementById('stat-real').innerText = totalReal;
        document.getElementById('stat-fake').innerText = totalFake;
        document.getElementById('stat-confidence').innerText = avgConfidence + '%';
    }

    function renderCharts() {
        // Theme configs for chart.js
        const isDark = document.documentElement.classList.contains('dark');
        const textColor = isDark ? '#cbd5e1' : '#475569';
        const gridColor = isDark ? '#334155' : '#e2e8f0';
        
        Chart.defaults.color = textColor;
        Chart.defaults.font.family = "'Inter', 'Poppins', sans-serif";
        
        const realCount = parseInt(document.getElementById('stat-real').innerText);
        const fakeCount = parseInt(document.getElementById('stat-fake').innerText);
        
        // 1. Pie Chart
        const pieCtx = document.getElementById('pieChart').getContext('2d');
        new Chart(pieCtx, {
            type: 'doughnut',
            data: {
                labels: ['Real Audio', 'Deepfake Audio'],
                datasets: [{
                    data: [realCount, fakeCount],
                    backgroundColor: ['#34D399', '#FB7185'], // Emerald for real, Rose for fake
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' }
                },
                cutout: '65%'
            }
        });
        
        // Prepare sorted data by date for Line/Bar charts
        const sortedData = [...analyticsData].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        const labelsDate = sortedData.map(item => {
            const d = new Date(item.timestamp);
            return `${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        });
        const confidenceData = sortedData.map(item => item.confidence);
        const barLabels = sortedData.map(item => item.filename.length > 15 ? item.filename.substring(0, 15) + '...' : item.filename);
        
        // Setup colors based on fake/real for bar chart
        const barColors = sortedData.map(item => item.result.includes("Deepfake") ? '#FB7185' : '#34D399');
        
        // 2. Line Chart
        const lineCtx = document.getElementById('lineChart').getContext('2d');
        
        const gradient = lineCtx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.5)'); // Indigo
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');
        
        new Chart(lineCtx, {
            type: 'line',
            data: {
                labels: labelsDate,
                datasets: [{
                    label: 'Confidence Score (%)',
                    data: confidenceData,
                    borderColor: '#6366f1',
                    backgroundColor: gradient,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#6366f1',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: gridColor, drawBorder: false },
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { maxRotation: 45, minRotation: 45 }
                    }
                },
                plugins: {
                    legend: { display: false }
                }
            }
        });
        
        // 3. Bar Chart
        const barCtx = document.getElementById('barChart').getContext('2d');
        new Chart(barCtx, {
            type: 'bar',
            data: {
                labels: barLabels,
                datasets: [{
                    label: 'Confidence (%)',
                    data: confidenceData,
                    backgroundColor: barColors,
                    borderRadius: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: gridColor, drawBorder: false },
                    },
                    x: {
                        grid: { display: false, drawBorder: false },
                        ticks: { maxRotation: 45, minRotation: 45 }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            afterLabel: function(context) {
                                const isFake = sortedData[context.dataIndex].result.includes("Deepfake");
                                return `Prediction: ${isFake ? 'Deepfake' : 'Real'}`;
                            }
                        }
                    }
                }
            }
        });
        
    }
    
    // Start fetching
    fetchAnalyticsData();
});
