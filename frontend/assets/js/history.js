/**
 * history.js - Fetching, filtering, and displaying history from API as cards
 */

let allHistoryData = [];
let currentFilter = 'All';
const API_BASE_URL = 'https://realtime-deepfake-audio-detection.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    // Load initial data
    window.loadHistory = async function () {
        const loadingState = document.getElementById('history-loading');
        if (loadingState) loadingState.classList.remove('hidden');
        
        try {
            const response = await fetch(`${API_BASE_URL}/history?limit=50`);
            if (response.ok) {
                const data = await response.json();
                allHistoryData = data;
                renderHistoryCards();
            }
        } catch (error) {
            console.error("Error loading history:", error);
            const container = document.getElementById('history-cards');
            if (container) container.innerHTML = `<div class="col-span-full text-center text-red-500 py-8">Failed to load history</div>`;
        } finally {
            if (loadingState) loadingState.classList.add('hidden');
        }
    };

    // Filter Logic
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Update active state
            filterBtns.forEach(b => {
                b.classList.remove('bg-indigo', 'text-white', 'shadow', 'active');
                b.classList.add('text-gray-600', 'dark:text-gray-300');
            });
            e.target.classList.add('bg-indigo', 'text-white', 'shadow', 'active');
            e.target.classList.remove('text-gray-600', 'dark:text-gray-300');

            currentFilter = e.target.getAttribute('data-filter');
            renderHistoryCards();
        });
    });

    // Search Logic
    const searchInput = document.getElementById('search-history');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderHistoryCards();
        });
    }

    // Export CSV
    const exportBtn = document.getElementById('export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCSV);
    }

    // Delete Logic
    window.deleteRecord = async function (id) {
        if (!confirm("Are you sure you want to delete this record?")) return;

        try {
            const response = await fetch(`${API_BASE_URL}/history/${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                // Remove from local array
                allHistoryData = allHistoryData.filter(h => h.id !== id);
                renderHistoryCards();
            } else {
                alert("Failed to delete record.");
            }
        } catch (error) {
            console.error("Error deleting record:", error);
        }
    };

    function renderHistoryCards() {
        const container = document.getElementById('history-cards');
        const emptyState = document.getElementById('history-empty');
        const countDisplay = document.getElementById('history-count');
        const searchVal = document.getElementById('search-history')?.value.toLowerCase() || '';

        if (!container) return;

        // Apply filters
        let filteredData = allHistoryData.filter(item => {
            const matchesSearch = item.filename.toLowerCase().includes(searchVal);
            const matchesType = currentFilter === 'All' || item.result === currentFilter;
            return matchesSearch && matchesType;
        });

        if (countDisplay) {
            countDisplay.innerText = `Showing ${filteredData.length} result${filteredData.length !== 1 ? 's' : ''}`;
        }

        if (filteredData.length === 0) {
            container.innerHTML = '';
            if (emptyState) emptyState.classList.remove('hidden');
            return;
        }

        if (emptyState) emptyState.classList.add('hidden');
        container.innerHTML = '';

        filteredData.forEach((item, index) => {
            const dateObj = new Date(item.timestamp);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const isFake = item.result.includes("Deepfake");
            const progressBarBg = isFake ? 'bg-rose-400' : 'bg-emerald-400';
            
            const icon = isFake ? '<i class="fas fa-exclamation-triangle text-rose-500 text-2xl"></i>' : '<i class="fas fa-check-circle text-emerald-500 text-2xl"></i>';
            const badgeClass = isFake ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            const cardBorder = isFake ? 'border-rose-200 dark:border-rose-900/30' : 'border-emerald-200 dark:border-emerald-900/30';
            
            const card = document.createElement('div');
            card.className = `glass-card history-card rounded-xl p-4 md:p-5 border ${cardBorder} shadow-sm fade-in relative overflow-hidden bg-white/70 dark:bg-navy/70 flex flex-col md:flex-row items-start md:items-center justify-between gap-4`;
            card.style.animationDelay = `${(index % 10) * 0.05}s`;

            card.innerHTML = `
                <div class="flex items-center gap-4 w-full md:w-5/12">
                    <div class="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 border ${cardBorder}">
                        ${icon}
                    </div>
                    <div class="min-w-0 flex-1">
                        <h3 class="text-sm font-bold text-gray-900 dark:text-white truncate" title="${item.filename}">
                            ${item.filename}
                        </h3>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${badgeClass}">
                                ${item.result}
                            </span>
                            <span class="text-xs text-gray-500">${dateStr} &bull; ${timeStr}</span>
                        </div>
                    </div>
                </div>
                
                <div class="w-full md:w-4/12 flex flex-col justify-center">
                    <div class="flex justify-between text-xs font-semibold mb-1 w-full">
                        <span class="text-gray-500 dark:text-gray-400">Confidence</span>
                        <span class="font-poppins text-gray-900 dark:text-white">${item.confidence}%</span>
                    </div>
                    <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden shadow-inner">
                        <div class="h-2 rounded-full ${progressBarBg} transition-all duration-1000 ease-out" style="width: ${item.confidence}%"></div>
                    </div>
                </div>

                <div class="w-full md:w-3/12 flex items-center justify-between md:justify-end gap-6 text-sm">
                    <div class="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <i class="far fa-clock"></i> ${item.duration}s
                    </div>
                    <button onclick="window.deleteRecord(${item.id})" class="text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800" title="Delete record">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                
                ${isFake ? '<div class="absolute left-0 top-0 w-1 h-full bg-rose-500"></div>' : '<div class="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>'}
            `;
            container.appendChild(card);
        });
    }

    function exportCSV() {
        if (allHistoryData.length === 0) return;

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "ID,File Name,Result,Confidence,Duration,Timestamp\n"; // Headers

        allHistoryData.forEach(row => {
            let rowBody = `${row.id},"${row.filename}",${row.result},${row.confidence},${row.duration},${row.timestamp}`;
            csvContent += rowBody + "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "deepguard_scan_history.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    // Call load immediately if we're on the history page
    if (document.getElementById('history-cards')) {
        window.loadHistory();
    }
});
