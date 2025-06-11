import { AppDefinition } from '../types/index.ts';
import { TruthAnalyzer } from '../utils/TruthAnalyzer.ts';
import { Generator, GeneratorError } from '../generators/types.ts';

export class DashboardGenerator implements Generator<Record<string, string>> {
  constructor(private app: AppDefinition) {}

  async generate(): Promise<Record<string, string>> {
    console.log(`[DashboardGenerator] Generating dashboard pages for ${this.app.name || 'app'}`);
    
    if (!this.app.entities) {
      throw new GeneratorError('DashboardGenerator', 'No entities defined in app');
    }

    const pages = {
      '/dashboard': this.generateMainDashboard(),
      '/dashboard/extensions': this.generateExtensionsPage(),
      '/dashboard/database': this.generateDatabasePage(),
      '/dashboard/config': this.generateConfigPage(),
      '/dashboard/api': this.generateAPIPage()
    };

    console.log('[DashboardGenerator] Done');
    return pages;
  }

  private generateMainDashboard(): string {
    const analyzer = new TruthAnalyzer(this.app);
    const analysis = analyzer.analyzeSystem();
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solidcore3 Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .dashboard-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            color: white;
            margin-bottom: 3rem;
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 300;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .dashboard-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 3rem;
        }
        
        .dashboard-card {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
            cursor: pointer;
        }
        
        .dashboard-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .card-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
        }
        
        .card-title {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #333;
        }
        
        .card-description {
            color: #666;
            line-height: 1.6;
        }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .stat-card {
            background: rgba(255,255,255,0.1);
            border-radius: 10px;
            padding: 1.5rem;
            text-align: center;
            color: white;
        }
        
        .stat-number {
            font-size: 2.5rem;
            font-weight: 700;
            display: block;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .back-link {
            position: fixed;
            top: 20px;
            left: 20px;
            color: white;
            text-decoration: none;
            font-size: 1.1rem;
            padding: 0.5rem 1rem;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            transition: background 0.3s ease;
        }
        
        .back-link:hover {
            background: rgba(255,255,255,0.3);
        }
    </style>
</head>
<body>
    <a href="/" class="back-link">← Back to App</a>
    
    <div class="dashboard-container">
        <div class="header">
            <h1>🚀 Solidcore3</h1>
            <p>System Dashboard</p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-number" id="entity-count">${Object.keys(this.app.entities).length}</span>
                <span class="stat-label">Entities</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" id="view-count">${Object.keys(this.app.views || {}).length}</span>
                <span class="stat-label">Views</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" id="workflow-count">${Object.keys(this.app.workflows || {}).length}</span>
                <span class="stat-label">Workflows</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" id="extension-count">-</span>
                <span class="stat-label">Extensions</span>
            </div>
            <div class="stat-card">
                <span class="stat-number" id="health-score">${analysis.healthScore}%</span>
                <span class="stat-label">Health Score</span>
            </div>
        </div>
        
        <div class="dashboard-grid">
            <div class="dashboard-card" onclick="window.location.href='/dashboard/extensions'">
                <span class="card-icon">📦</span>
                <h3 class="card-title">Extensions</h3>
                <p class="card-description">
                    Manage and configure system extensions. View installed extensions, 
                    their status, and configuration options.
                </p>
            </div>
            
            <div class="dashboard-card" onclick="window.location.href='/dashboard/database'">
                <span class="card-icon">🗄️</span>
                <h3 class="card-title">Database</h3>
                <p class="card-description">
                    Browse database tables, execute queries, and manage your data. 
                    View table schemas and relationships.
                </p>
            </div>
            
            <div class="dashboard-card" onclick="window.location.href='/dashboard/api'">
                <span class="card-icon">🔌</span>
                <h3 class="card-title">API Explorer</h3>
                <p class="card-description">
                    Test API endpoints, view documentation, and monitor API usage. 
                    Includes extension endpoints and core routes.
                </p>
            </div>
            
            <div class="dashboard-card" onclick="window.location.href='/dashboard/config'">
                <span class="card-icon">⚙️</span>
                <h3 class="card-title">Configuration</h3>
                <p class="card-description">
                    Manage system configuration, environment variables, and 
                    application settings. Edit truth file structure.
                </p>
            </div>
            
            <div class="dashboard-card" onclick="window.location.href='/dashboard/truth'">
                <span class="card-icon">🎯</span>
                <h3 class="card-title">Truth File Explorer</h3>
                <p class="card-description">
                    Interactive visualization of your application architecture. 
                    Analyze entities, field usage, dependencies, and system health.
                </p>
            </div>
        </div>
    </div>
    
    <script>
        // Load extension count dynamically
        fetch('/debug/extensions')
            .then(response => response.json())
            .then(data => {
                document.getElementById('extension-count').textContent = data.total || 0;
            })
            .catch(() => {
                document.getElementById('extension-count').textContent = '0';
            });
    </script>
</body>
</html>
    `;
  }

  private generateExtensionsPage(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Extensions - Solidcore3 Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .header h1 {
            font-size: 2rem;
            color: #1a202c;
        }
        
        .back-btn {
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: background 0.3s ease;
        }
        
        .back-btn:hover {
            background: #5a67d8;
        }
        
        .extensions-grid {
            display: grid;
            gap: 1.5rem;
        }
        
        .extension-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            border: 1px solid #e2e8f0;
        }
        
        .extension-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }
        
        .extension-name {
            font-size: 1.25rem;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 0.25rem;
        }
        
        .extension-version {
            font-size: 0.875rem;
            color: #718096;
        }
        
        .extension-type {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .type-api { background: #e6fffa; color: #234e52; }
        .type-ui { background: #fef5e7; color: #744210; }
        .type-workflow { background: #e0e7ff; color: #3730a3; }
        
        .extension-description {
            color: #4a5568;
            margin-bottom: 1rem;
            line-height: 1.6;
        }
        
        .extension-details {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #e2e8f0;
        }
        
        .detail-item {
            display: flex;
            flex-direction: column;
        }
        
        .detail-label {
            font-size: 0.75rem;
            color: #718096;
            text-transform: uppercase;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        
        .detail-value {
            color: #2d3748;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
        }
        
        .routes-list {
            list-style: none;
            margin: 0;
            padding: 0;
        }
        
        .route-item {
            background: #f7fafc;
            padding: 0.5rem;
            border-radius: 4px;
            margin-bottom: 0.25rem;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
        }
        
        .route-method {
            font-weight: 600;
            color: #3182ce;
        }
        
        .loading {
            text-align: center;
            padding: 3rem;
            color: #718096;
        }
        
        .error {
            background: #fed7d7;
            color: #9b2c2c;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Extensions</h1>
            <a href="/dashboard" class="back-btn">← Dashboard</a>
        </div>
        
        <div id="loading" class="loading">
            Loading extensions...
        </div>
        
        <div id="error" class="error" style="display: none;">
            Failed to load extensions
        </div>
        
        <div id="extensions-container" class="extensions-grid" style="display: none;">
        </div>
    </div>
    
    <script>
        async function loadExtensions() {
            try {
                const response = await fetch('/debug/extensions');
                const data = await response.json();
                
                const container = document.getElementById('extensions-container');
                const loading = document.getElementById('loading');
                const error = document.getElementById('error');
                
                if (!data.extensions || data.extensions.length === 0) {
                    loading.innerHTML = 'No extensions found';
                    return;
                }
                
                container.innerHTML = data.extensions.map(ext => \`
                    <div class="extension-card">
                        <div class="extension-header">
                            <div>
                                <div class="extension-name">\${ext.name}</div>
                                <div class="extension-version">v\${ext.version}</div>
                            </div>
                            <span class="extension-type type-\${ext.type}">\${ext.type}</span>
                        </div>
                        
                        <div class="extension-description">
                            \${ext.description || 'No description available'}
                        </div>
                        
                        <div class="extension-details">
                            <div class="detail-item">
                                <span class="detail-label">Author</span>
                                <span class="detail-value">\${ext.author || 'Unknown'}</span>
                            </div>
                            
                            \${ext.entity ? \`
                                <div class="detail-item">
                                    <span class="detail-label">Target Entity</span>
                                    <span class="detail-value">\${ext.entity}</span>
                                </div>
                            \` : ''}
                            
                            \${ext.routes && ext.routes.length > 0 ? \`
                                <div class="detail-item">
                                    <span class="detail-label">Routes</span>
                                    <ul class="routes-list">
                                        \${ext.routes.map(route => \`
                                            <li class="route-item">
                                                <span class="route-method">\${route.method}</span> 
                                                /extensions/\${ext.name}\${route.path}
                                            </li>
                                        \`).join('')}
                                    </ul>
                                </div>
                            \` : ''}
                            
                            \${ext.actions && Object.keys(ext.actions).length > 0 ? \`
                                <div class="detail-item">
                                    <span class="detail-label">Workflow Actions</span>
                                    <span class="detail-value">\${Object.keys(ext.actions).join(', ')}</span>
                                </div>
                            \` : ''}
                        </div>
                    </div>
                \`).join('');
                
                loading.style.display = 'none';
                container.style.display = 'grid';
                
            } catch (err) {
                document.getElementById('loading').style.display = 'none';
                document.getElementById('error').style.display = 'block';
                console.error('Failed to load extensions:', err);
            }
        }
        
        loadExtensions();
    </script>
</body>
</html>
    `;
  }

  private generateDatabasePage(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database - Solidcore3 Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .header h1 {
            font-size: 2rem;
            color: #1a202c;
        }
        
        .back-btn {
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: background 0.3s ease;
        }
        
        .back-btn:hover {
            background: #5a67d8;
        }
        
        .db-grid {
            display: grid;
            grid-template-columns: 300px 1fr;
            gap: 2rem;
            min-height: 600px;
        }
        
        .sidebar {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            border: 1px solid #e2e8f0;
            height: fit-content;
        }
        
        .sidebar h3 {
            margin-bottom: 1rem;
            color: #2d3748;
        }
        
        .table-list {
            list-style: none;
        }
        
        .table-item {
            padding: 0.75rem;
            border-radius: 6px;
            cursor: pointer;
            transition: background 0.2s ease;
            margin-bottom: 0.25rem;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
        }
        
        .table-item:hover {
            background: #f7fafc;
        }
        
        .table-item.active {
            background: #667eea;
            color: white;
        }
        
        .main-content {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            border: 1px solid #e2e8f0;
        }
        
        .query-section {
            margin-bottom: 2rem;
        }
        
        .query-section h3 {
            margin-bottom: 1rem;
            color: #2d3748;
        }
        
        .query-input {
            width: 100%;
            min-height: 100px;
            padding: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
            resize: vertical;
        }
        
        .query-buttons {
            margin-top: 1rem;
            display: flex;
            gap: 1rem;
        }
        
        .btn {
            padding: 0.5rem 1rem;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            transition: background 0.2s ease;
        }
        
        .btn-primary {
            background: #3182ce;
            color: white;
        }
        
        .btn-primary:hover {
            background: #2c5aa0;
        }
        
        .btn-secondary {
            background: #e2e8f0;
            color: #4a5568;
        }
        
        .btn-secondary:hover {
            background: #cbd5e0;
        }
        
        .results-section {
            margin-top: 2rem;
        }
        
        .results-section h3 {
            margin-bottom: 1rem;
            color: #2d3748;
        }
        
        .results-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }
        
        .results-table th {
            background: #f7fafc;
            padding: 0.75rem;
            text-align: left;
            border: 1px solid #e2e8f0;
            font-weight: 600;
            color: #2d3748;
        }
        
        .results-table td {
            padding: 0.75rem;
            border: 1px solid #e2e8f0;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        
        .results-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .error-message {
            background: #fed7d7;
            color: #9b2c2c;
            padding: 1rem;
            border-radius: 8px;
            margin-top: 1rem;
        }
        
        .loading {
            text-align: center;
            padding: 2rem;
            color: #718096;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🗄️ Database Browser</h1>
            <a href="/dashboard" class="back-btn">← Dashboard</a>
        </div>
        
        <div class="db-grid">
            <div class="sidebar">
                <h3>Tables</h3>
                <ul id="table-list" class="table-list">
                    <li class="loading">Loading tables...</li>
                </ul>
            </div>
            
            <div class="main-content">
                <div class="query-section">
                    <h3>SQL Query</h3>
                    <textarea 
                        id="query-input" 
                        class="query-input" 
                        placeholder="SELECT * FROM task LIMIT 10;"
                    ></textarea>
                    <div class="query-buttons">
                        <button class="btn btn-primary" onclick="executeQuery()">Execute Query</button>
                        <button class="btn btn-secondary" onclick="clearQuery()">Clear</button>
                    </div>
                </div>
                
                <div id="results-section" class="results-section" style="display: none;">
                    <h3>Results</h3>
                    <div id="results-content"></div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let currentTable = null;
        
        async function loadTables() {
            try {
                const response = await fetch('/debug/db');
                const data = await response.json();
                
                // For demo, show entity tables from app definition
                const tables = ${JSON.stringify(Object.keys(this.app.entities))};
                
                const tableList = document.getElementById('table-list');
                tableList.innerHTML = tables.map(table => 
                    \`<li class="table-item" onclick="selectTable('\${table}')">\${table}</li>\`
                ).join('');
                
            } catch (err) {
                document.getElementById('table-list').innerHTML = 
                    '<li style="color: #e53e3e;">Failed to load tables</li>';
            }
        }
        
        function selectTable(tableName) {
            currentTable = tableName;
            
            // Update active state
            document.querySelectorAll('.table-item').forEach(item => {
                item.classList.remove('active');
            });
            event.target.classList.add('active');
            
            // Set default query
            document.getElementById('query-input').value = 
                \`SELECT * FROM \${tableName.toLowerCase()} LIMIT 10;\`;
        }
        
        async function executeQuery() {
            const query = document.getElementById('query-input').value.trim();
            if (!query) return;
            
            const resultsSection = document.getElementById('results-section');
            const resultsContent = document.getElementById('results-content');
            
            resultsContent.innerHTML = '<div class="loading">Executing query...</div>';
            resultsSection.style.display = 'block';
            
            try {
                // For demo purposes, we'll simulate results
                // In a real implementation, you'd send the query to a backend endpoint
                
                if (query.toLowerCase().includes('select')) {
                    // Simulate SELECT results
                    const mockResults = {
                        columns: ['id', 'title', 'status', 'priority', 'created_at'],
                        rows: [
                            [1, 'Sample Task 1', 'todo', 'high', '2024-01-10 10:00:00'],
                            [2, 'Sample Task 2', 'done', 'medium', '2024-01-09 15:30:00'],
                            [3, 'Sample Task 3', 'in-progress', 'low', '2024-01-08 09:15:00']
                        ]
                    };
                    
                    displayResults(mockResults);
                } else {
                    resultsContent.innerHTML = 
                        '<div style="color: #38a169; padding: 1rem; background: #f0fff4; border-radius: 6px;">Query executed successfully</div>';
                }
                
            } catch (err) {
                resultsContent.innerHTML = 
                    \`<div class="error-message">Error: \${err.message}</div>\`;
            }
        }
        
        function displayResults(data) {
            const table = document.createElement('table');
            table.className = 'results-table';
            
            // Header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            data.columns.forEach(col => {
                const th = document.createElement('th');
                th.textContent = col;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Body
            const tbody = document.createElement('tbody');
            data.rows.forEach(row => {
                const tr = document.createElement('tr');
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = cell;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            
            document.getElementById('results-content').innerHTML = '';
            document.getElementById('results-content').appendChild(table);
        }
        
        function clearQuery() {
            document.getElementById('query-input').value = '';
            document.getElementById('results-section').style.display = 'none';
        }
        
        loadTables();
    </script>
</body>
</html>
    `;
  }

  private generateAPIPage(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Explorer - Solidcore3 Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .header h1 {
            font-size: 2rem;
            color: #1a202c;
        }
        
        .back-btn {
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: background 0.3s ease;
        }
        
        .back-btn:hover {
            background: #5a67d8;
        }
        
        .api-sections {
            display: grid;
            gap: 2rem;
        }
        
        .api-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            border: 1px solid #e2e8f0;
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #2d3748;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .endpoint-list {
            display: grid;
            gap: 1rem;
        }
        
        .endpoint {
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .endpoint-header {
            display: flex;
            align-items: center;
            padding: 1rem;
            background: #f7fafc;
            cursor: pointer;
            transition: background 0.2s ease;
        }
        
        .endpoint-header:hover {
            background: #edf2f7;
        }
        
        .method {
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-right: 1rem;
            min-width: 60px;
            text-align: center;
        }
        
        .method-get { background: #48bb78; color: white; }
        .method-post { background: #3182ce; color: white; }
        .method-put { background: #ed8936; color: white; }
        .method-delete { background: #e53e3e; color: white; }
        
        .endpoint-path {
            font-family: 'Monaco', 'Menlo', monospace;
            font-weight: 500;
            flex: 1;
        }
        
        .endpoint-description {
            color: #718096;
            font-size: 0.875rem;
            margin-left: auto;
        }
        
        .endpoint-details {
            padding: 1rem;
            border-top: 1px solid #e2e8f0;
            display: none;
        }
        
        .endpoint.expanded .endpoint-details {
            display: block;
        }
        
        .test-form {
            margin-top: 1rem;
            padding: 1rem;
            background: #f7fafc;
            border-radius: 6px;
        }
        
        .form-group {
            margin-bottom: 1rem;
        }
        
        .form-label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: #2d3748;
        }
        
        .form-input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
        }
        
        .form-textarea {
            min-height: 100px;
            resize: vertical;
        }
        
        .test-btn {
            background: #3182ce;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-weight: 500;
        }
        
        .test-btn:hover {
            background: #2c5aa0;
        }
        
        .response-section {
            margin-top: 1rem;
            padding: 1rem;
            background: #1a202c;
            color: #e2e8f0;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
            white-space: pre-wrap;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔌 API Explorer</h1>
            <a href="/dashboard" class="back-btn">← Dashboard</a>
        </div>
        
        <div class="api-sections">
            <div class="api-section">
                <div class="section-title">
                    <span>🏠</span>
                    Core API Routes
                </div>
                <div class="endpoint-list">
                    ${Object.keys(this.app.entities).map(entity => {
                      const entityLower = entity.toLowerCase();
                      return `
                        <div class="endpoint" onclick="toggleEndpoint(this)">
                            <div class="endpoint-header">
                                <span class="method method-get">GET</span>
                                <span class="endpoint-path">/api/${entityLower}</span>
                                <span class="endpoint-description">List all ${entity.toLowerCase()}s</span>
                            </div>
                            <div class="endpoint-details">
                                <p>Retrieve all ${entity.toLowerCase()} records with optional filtering and pagination.</p>
                                <div class="test-form">
                                    <button class="test-btn" onclick="testEndpoint('/api/${entityLower}', 'GET')">Test Endpoint</button>
                                    <div class="response-section"></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="endpoint" onclick="toggleEndpoint(this)">
                            <div class="endpoint-header">
                                <span class="method method-post">POST</span>
                                <span class="endpoint-path">/api/${entityLower}</span>
                                <span class="endpoint-description">Create new ${entity.toLowerCase()}</span>
                            </div>
                            <div class="endpoint-details">
                                <p>Create a new ${entity.toLowerCase()} record.</p>
                                <div class="test-form">
                                    <div class="form-group">
                                        <label class="form-label">Request Body (JSON):</label>
                                        <textarea class="form-input form-textarea" placeholder='{"title": "New task", "status": "todo", "priority": "medium"}'></textarea>
                                    </div>
                                    <button class="test-btn" onclick="testEndpoint('/api/${entityLower}', 'POST', this)">Test Endpoint</button>
                                    <div class="response-section"></div>
                                </div>
                            </div>
                        </div>
                      `;
                    }).join('')}
                </div>
            </div>
            
            <div class="api-section">
                <div class="section-title">
                    <span>📦</span>
                    Extension API Routes
                </div>
                <div class="endpoint-list" id="extension-endpoints">
                    <div style="padding: 1rem; color: #718096;">Loading extension endpoints...</div>
                </div>
            </div>
            
            <div class="api-section">
                <div class="section-title">
                    <span>🔧</span>
                    System Routes
                </div>
                <div class="endpoint-list">
                    <div class="endpoint" onclick="toggleEndpoint(this)">
                        <div class="endpoint-header">
                            <span class="method method-get">GET</span>
                            <span class="endpoint-path">/health</span>
                            <span class="endpoint-description">System health check</span>
                        </div>
                        <div class="endpoint-details">
                            <p>Get system status and basic information.</p>
                            <div class="test-form">
                                <button class="test-btn" onclick="testEndpoint('/health', 'GET')">Test Endpoint</button>
                                <div class="response-section"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="endpoint" onclick="toggleEndpoint(this)">
                        <div class="endpoint-header">
                            <span class="method method-get">GET</span>
                            <span class="endpoint-path">/debug/extensions</span>
                            <span class="endpoint-description">Extension information</span>
                        </div>
                        <div class="endpoint-details">
                            <p>Get detailed information about loaded extensions.</p>
                            <div class="test-form">
                                <button class="test-btn" onclick="testEndpoint('/debug/extensions', 'GET')">Test Endpoint</button>
                                <div class="response-section"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function toggleEndpoint(element) {
            element.classList.toggle('expanded');
        }
        
        async function testEndpoint(path, method, buttonContext = null) {
            let body = null;
            let responseDiv;
            
            if (buttonContext) {
                const textarea = buttonContext.parentElement.querySelector('textarea');
                if (textarea && textarea.value.trim()) {
                    try {
                        body = JSON.parse(textarea.value);
                    } catch (e) {
                        alert('Invalid JSON in request body');
                        return;
                    }
                }
                responseDiv = buttonContext.parentElement.querySelector('.response-section');
            } else {
                responseDiv = event.target.parentElement.querySelector('.response-section');
            }
            
            responseDiv.style.display = 'block';
            responseDiv.textContent = 'Loading...';
            
            try {
                const options = {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                if (body) {
                    options.body = JSON.stringify(body);
                }
                
                const response = await fetch(path, options);
                const data = await response.json();
                
                const result = {
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    body: data
                };
                
                responseDiv.textContent = JSON.stringify(result, null, 2);
                
            } catch (err) {
                responseDiv.textContent = \`Error: \${err.message}\`;
            }
        }
        
        async function loadExtensionEndpoints() {
            try {
                const response = await fetch('/debug/extensions');
                const data = await response.json();
                
                const container = document.getElementById('extension-endpoints');
                
                if (!data.extensions || data.extensions.length === 0) {
                    container.innerHTML = '<div style="padding: 1rem; color: #718096;">No extension endpoints found</div>';
                    return;
                }
                
                const endpoints = data.extensions
                    .filter(ext => ext.routes && ext.routes.length > 0)
                    .flatMap(ext => 
                        ext.routes.map(route => ({
                            ...route,
                            fullPath: \`/extensions/\${ext.name}\${route.path}\`,
                            extensionName: ext.name
                        }))
                    );
                
                if (endpoints.length === 0) {
                    container.innerHTML = '<div style="padding: 1rem; color: #718096;">No extension endpoints found</div>';
                    return;
                }
                
                container.innerHTML = endpoints.map(endpoint => \`
                    <div class="endpoint" onclick="toggleEndpoint(this)">
                        <div class="endpoint-header">
                            <span class="method method-\${endpoint.method.toLowerCase()}">\${endpoint.method}</span>
                            <span class="endpoint-path">\${endpoint.fullPath}</span>
                            <span class="endpoint-description">\${endpoint.description || ''}</span>
                        </div>
                        <div class="endpoint-details">
                            <p>Extension: <strong>\${endpoint.extensionName}</strong></p>
                            <p>\${endpoint.description || 'No description available'}</p>
                            <div class="test-form">
                                <button class="test-btn" onclick="testEndpoint('\${endpoint.fullPath}', '\${endpoint.method}')">Test Endpoint</button>
                                <div class="response-section"></div>
                            </div>
                        </div>
                    </div>
                \`).join('');
                
            } catch (err) {
                document.getElementById('extension-endpoints').innerHTML = 
                    '<div style="padding: 1rem; color: #e53e3e;">Failed to load extension endpoints</div>';
            }
        }
        
        loadExtensionEndpoints();
    </script>
</body>
</html>
    `;
  }

  private generateConfigPage(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuration - Solidcore3 Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f8fafc;
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 2px solid #e2e8f0;
        }
        
        .header h1 {
            font-size: 2rem;
            color: #1a202c;
        }
        
        .back-btn {
            background: #667eea;
            color: white;
            text-decoration: none;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            transition: background 0.3s ease;
        }
        
        .back-btn:hover {
            background: #5a67d8;
        }
        
        .config-grid {
            display: grid;
            gap: 2rem;
        }
        
        .config-section {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07);
            border: 1px solid #e2e8f0;
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #2d3748;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .config-item {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 1rem;
            padding: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            margin-bottom: 1rem;
            align-items: center;
        }
        
        .config-label {
            font-weight: 500;
            color: #2d3748;
        }
        
        .config-value {
            font-family: 'Monaco', 'Menlo', monospace;
            background: #f7fafc;
            padding: 0.5rem;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
            color: #4a5568;
        }
        
        .json-viewer {
            background: #1a202c;
            color: #e2e8f0;
            padding: 1.5rem;
            border-radius: 8px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.875rem;
            white-space: pre-wrap;
            overflow-x: auto;
            max-height: 400px;
            overflow-y: auto;
        }
        
        .warning {
            background: #fef5e7;
            color: #744210;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            border: 1px solid #f6e05e;
        }
        
        .info {
            background: #ebf8ff;
            color: #2c5aa0;
            padding: 1rem;
            border-radius: 6px;
            margin-bottom: 1rem;
            border: 1px solid #90cdf4;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⚙️ Configuration</h1>
            <a href="/dashboard" class="back-btn">← Dashboard</a>
        </div>
        
        <div class="config-grid">
            <div class="config-section">
                <div class="section-title">
                    <span>🏗️</span>
                    Application Structure
                </div>
                <div class="info">
                    <strong>App Name:</strong> ${this.app.name}<br>
                    <strong>Entities:</strong> ${Object.keys(this.app.entities).length}<br>
                    <strong>Views:</strong> ${Object.keys(this.app.views || {}).length}<br>
                    <strong>Workflows:</strong> ${Object.keys(this.app.workflows || {}).length}
                </div>
                
                <div class="config-item">
                    <div class="config-label">Application Name</div>
                    <div class="config-value">${this.app.name}</div>
                </div>
                
                <div class="config-item">
                    <div class="config-label">Entity Names</div>
                    <div class="config-value">${Object.keys(this.app.entities).join(', ')}</div>
                </div>
            </div>
            
            <div class="config-section">
                <div class="section-title">
                    <span>🌍</span>
                    Environment Variables
                </div>
                <div class="warning">
                    Environment variables are read-only in this interface. 
                    Modify them in your system or Docker configuration.
                </div>
                
                <div class="config-item">
                    <div class="config-label">Port</div>
                    <div class="config-value">8000</div>
                </div>
                
                <div class="config-item">
                    <div class="config-label">Environment</div>
                    <div class="config-value">development</div>
                </div>
                
                <div class="config-item">
                    <div class="config-label">Database Path</div>
                    <div class="config-value">./data/app.db</div>
                </div>
            </div>
            
            <div class="config-section">
                <div class="section-title">
                    <span>📋</span>
                    Truth File Structure
                </div>
                <div class="info">
                    This is the current structure of your app.truth.ts file. 
                    Edit the source file to make changes.
                </div>
                
                <div class="json-viewer">${JSON.stringify(this.app, null, 2)}</div>
            </div>
            
            <div class="config-section">
                <div class="section-title">
                    <span>📁</span>
                    File Paths
                </div>
                
                <div class="config-item">
                    <div class="config-label">Truth File</div>
                    <div class="config-value">./app/app.truth.ts</div>
                </div>
                
                <div class="config-item">
                    <div class="config-label">Extensions Directory</div>
                    <div class="config-value">./app/extensions/</div>
                </div>
                
                <div class="config-item">
                    <div class="config-label">Database File</div>
                    <div class="config-value">./data/app.db</div>
                </div>
                
                <div class="config-item">
                    <div class="config-label">Runtime Directory</div>
                    <div class="config-value">./runtime/</div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }
}