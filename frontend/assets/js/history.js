/**
 * history.js - Fetching, filtering, and displaying history from API as cards
 */

let allHistoryData = [];
let currentFilter = 'All';
const API_BASE_URL = 'http://localhost:8000';

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
            const icon = isFake ? '<i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>' : '<i class="fas fa-check-circle text-green-500 text-2xl"></i>';
            const badgeClass = isFake ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            const cardBorder = isFake ? 'border-red-200 dark:border-red-900/30' : 'border-green-200 dark:border-green-900/30';

            const card = document.createElement('div');
            card.className = `glass-card history-card rounded-2xl p-6 border ${cardBorder} shadow-sm fade-in relative overflow-hidden bg-white/70 dark:bg-navy/70`;
            card.style.animationDelay = `${(index % 10) * 0.05}s`;

            card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center gap-3">
                        ${icon}
                        <div>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass} mb-1">
                                ${item.result}
                            </span>
                            <h3 class="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[180px]" title="${item.filename}">
                                ${item.filename}
                            </h3>
                        </div>
                    </div>
                    <button onclick="window.deleteRecord(${item.id})" class="text-gray-400 hover:text-red-500 transition-colors" title="Delete record">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                
                <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-gray-400">Confidence</span>
                        <span class="font-bold font-poppins text-gray-900 dark:text-white">${item.confidence}%</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-gray-400">Duration</span>
                        <span class="text-gray-700 dark:text-gray-300">${item.duration}s</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-500 dark:text-gray-400">Date</span>
                        <span class="text-gray-700 dark:text-gray-300">${dateStr}</span>
                    </div>
                </div>
                
                ${isFake ? '<div class="absolute top-0 right-0 w-2 h-full bg-red-500 opacity-20"></div>' : '<div class="absolute top-0 right-0 w-2 h-full bg-green-500 opacity-20"></div>'}
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
