// Custom View: Register
// Points to existing component: Register
import RegisterComponent from '../components/app/Register.js'

export default function Register(props) {
  const { html } = window
  
  return html`<${RegisterComponent} ....${props} />`
}