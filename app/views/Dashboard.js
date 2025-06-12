// Custom View: Dashboard
// Points to existing component: Dashboard
import DashboardComponent from '../components/app/Dashboard.js'

export default function Dashboard(props) {
  const { html } = window
  
  return html`<${DashboardComponent} ....${props} />`
}