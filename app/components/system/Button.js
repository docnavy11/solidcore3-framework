// System Button Component
// Constrained, consistent button with design tokens


export default function Button({ 
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false
}) {
  // Access global hooks and utilities
  const { html } = window
  
  const className = [
    'btn',
    variant === 'primary' ? 'btn-primary' : 'btn-secondary',
    disabled && 'disabled',
    loading && 'loading'
  ].filter(Boolean).join(' ')

  return html`
    <button
      type=${type}
      class=${className}
      onClick=${onClick}
      disabled=${disabled || loading}
    >
      ${loading ? 'Loading...' : children}
    </button>
  `
}