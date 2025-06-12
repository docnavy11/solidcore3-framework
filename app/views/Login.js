// Custom View: Login
// Points to existing component: Login
import LoginComponent from '../components/app/Login.js'

export default function Login(props) {
  const { html } = window
  
  return html`<${LoginComponent} ....${props} />`
}