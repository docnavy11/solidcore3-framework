// Dashboard Component
// Custom dashboard component for the application

export default function Dashboard() {
  const { html } = window
  
  return html`
    <div class="dashboard">
      <div class="card">
        <h1>TaskManager Dashboard</h1>
        <p class="text-gray mb-4">Welcome to the application dashboard</p>
        
        <div class="detail-grid">
          <div class="card">
            <h3>Quick Actions</h3>
            <div class="flex gap-2 mt-4">
              <a href="/tasks" class="btn btn-primary">View Tasks</a>
              <a href="/people" class="btn btn-secondary">View People</a>
            </div>
          </div>
          
          <div class="card">
            <h3>System Status</h3>
            <p class="text-green">✓ All systems operational</p>
          </div>
        </div>
      </div>
    </div>
  `
}