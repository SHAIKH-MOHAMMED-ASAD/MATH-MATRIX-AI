document.addEventListener('DOMContentLoaded', () => {
    // --- Helper function to fetch and parse CSV files ---
    async function fetchCSV(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error(`Network response was not ok for ${filePath}`);
            const text = await response.text();
            
            const rows = text.trim().split('\n');
            const headers = rows[0].split(',').map(h => h.trim());
            const data = rows.slice(1).map(row => {
                const values = row.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
                let obj = {};
                headers.forEach((header, index) => {
                    const value = (values[index] || '').trim().replace(/"/g, '');
                    obj[header] = value;
                });
                return obj;
            });
            return data;
        } catch (error) {
            console.error('Error fetching or parsing CSV:', error);
            return []; 
        }
    }

    // --- Main function to load and display all dashboard data ---
    async function loadDashboard() {
        const [perfData, feedbackData] = await Promise.all([
            fetchCSV('data/performance_metrics.csv'),
            fetchCSV('data/feedback.csv')
        ]);

        if (perfData.length > 0) {
            displayKPIs(perfData);
            populatePerformanceTable(perfData);
            createProblemTypeChart(perfData); // New function call
        }

        if (feedbackData.length > 0) {
            createFeedbackChart(feedbackData);
            displayRecentFeedback(feedbackData); // New function call
        }
    }

    // --- Function to calculate and display Key Performance Indicators ---
    function displayKPIs(data) {
        const latestEntry = data[data.length - 1];
        
        // UPDATED: Total requests is the total number of entries (rows)
        const totalRequests = data.length; 
        
        const accuracy = parseFloat(latestEntry.accuracy).toFixed(2) || '0.00';
        
        // Calculate the true average response time from all entries
        const totalResponseTime = data.reduce((sum, row) => sum + parseFloat(row.response_time || 0), 0);
        const avgResponseTime = (totalResponseTime / data.length).toFixed(2);
        
        const failedResponses = data.filter(row => row.success && row.success.toLowerCase() === 'false').length;

        document.getElementById('total-requests').textContent = totalRequests;
        document.getElementById('accuracy').textContent = `${accuracy}%`;
        document.getElementById('avg-response-time').textContent = `${avgResponseTime}s`;
        document.getElementById('failed-responses').textContent = failedResponses;
    }

    // --- Function to populate the performance data table ---
    function populatePerformanceTable(data) {
        const tableBody = document.getElementById('performance-table-body');
        tableBody.innerHTML = ''; 
        
        data.slice().reverse().forEach((row, index) => {
            const tr = document.createElement('tr');
            const isSuccess = row.success && row.success.toLowerCase() === 'true';
            const successIcon = isSuccess ? '✅' : '❌';
            const problemType = (row.problem_type || '').replace(/\*\*|/g, '').trim();

            tr.innerHTML = `
                <td>${data.length - index}</td>
                <td>${row.timestamp || 'N/A'}</td>
                <td>${parseFloat(row.response_time || 0).toFixed(2)}s</td>
                <td>${successIcon}</td>
                <td>${problemType || 'N/A'}</td>
            `;
            tableBody.appendChild(tr);
        });
    }
    
    // --- NEW: Function to display the three most recent feedback entries ---
    function displayRecentFeedback(data) {
        const container = document.getElementById('recent-feedback-container');
        container.innerHTML = '';

        const recentFeedback = data
            .filter(item => item.feedback && item.feedback.trim() !== '') // Filter out empty feedback
            .slice(-3) // Get the last 3
            .reverse(); // Show the newest first

        if(recentFeedback.length === 0) {
            container.innerHTML = '<p>No recent feedback comments.</p>';
            return;
        }

        recentFeedback.forEach(item => {
            const card = document.createElement('div');
            card.className = 'feedback-card';
            
            let ratingStars = '⭐'.repeat(parseInt(item.rating || 0));
            
            card.innerHTML = `
                <div class="rating">Rating: ${ratingStars}</div>
                <p>"${item.feedback}"</p>
            `;
            container.appendChild(card);
        });
    }

    // --- Function to create the feedback distribution bar chart ---
    function createFeedbackChart(data) {
        const ctx = document.getElementById('feedback-chart').getContext('2d');
        const ratingCounts = { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 };
        data.forEach(row => {
            if (row.rating && ratingCounts.hasOwnProperty(row.rating)) {
                ratingCounts[row.rating]++;
            }
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(ratingCounts),
                datasets: [{
                    label: 'Number of Ratings',
                    data: Object.values(ratingCounts),
                    backgroundColor: ['#f7258540', '#f7258580', '#4895ef80', '#4895ef', '#4361ee'],
                    borderColor: ['#f72585', '#f72585', '#4895ef', '#4895ef', '#4361ee'],
                    borderWidth: 1.5,
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Count' }, ticks: { stepSize: 1 } },
                    x: { title: { display: true, text: 'Rating' } }
                }
            }
        });
    }

    // --- NEW: Function to create the problem type distribution pie chart ---
    function createProblemTypeChart(data) {
        const ctx = document.getElementById('problem-type-chart').getContext('2d');
        const typeCounts = {};

        data.forEach(row => {
            let type = (row.problem_type || 'Other').replace(/\*\*|/g, '').trim();
            if(type === '') type = 'Other';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });

        const labels = Object.keys(typeCounts);
        const counts = Object.values(typeCounts);

        new Chart(ctx, {
            type: 'doughnut', // Doughnut is a more modern-looking pie chart
            data: {
                labels: labels,
                datasets: [{
                    label: 'Problem Types',
                    data: counts,
                    backgroundColor: ['#4361ee', '#4895ef', '#4cc9f0', '#f72585', '#7209b7', '#3f37c9', '#560bad'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.raw !== null) {
                                    label += context.raw;
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- Initial load ---
    loadDashboard();
});