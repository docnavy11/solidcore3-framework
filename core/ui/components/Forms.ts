// Form component definitions for the constrained UI system

import { BaseProps, FormProps as BaseFormProps, InteractionProps } from '../types/base-props.ts';
import { buildElement, processInteractionProps, ColorToken } from '../utils/prop-utils.ts';

export interface FormProps extends BaseProps, BaseFormProps, InteractionProps {
  action?: string;
  method?: 'GET' | 'POST';
  onSubmit?: string; // JavaScript function name
  children: string;
  spacing?: 'compact' | 'normal' | 'spacious';
}

export function Form({ 
  action, 
  method = 'POST', 
  onSubmit, 
  children, 
  spacing = 'normal',
  ...props 
}: FormProps): string {
  const spacingMap = {
    compact: '0.5rem',
    normal: '1rem',
    spacious: '1.5rem'
  };
  
  const additionalStyles = `
    display: flex;
    flex-direction: column;
    gap: ${spacingMap[spacing]};
  `;
  
  const formAttributes = {
    ...(action && { action }),
    method,
    ...(onSubmit && { onsubmit: `${onSubmit}(event)` })
  };
  
  const interactionAttributes = processInteractionProps(props);
  
  return buildElement(
    'form',
    { ...formAttributes, ...props },
    children,
    additionalStyles,
    interactionAttributes
  );
}

export interface InputProps extends BaseProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'textarea' | 'date' | 'time' | 'datetime-local';
  name: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  value?: string;
  rows?: number; // for textarea
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  help?: string;
}

export function Input({ 
  type = 'text', 
  name, 
  label, 
  placeholder, 
  required = false, 
  disabled = false,
  value = '',
  rows = 3,
  size = 'md',
  error,
  help,
  ...props
}: InputProps): string {
  const inputId = `input-${name}`;
  
  const sizeMap = {
    sm: { padding: '0.5rem', fontSize: '0.875rem' },
    md: { padding: '0.75rem', fontSize: '1rem' },
    lg: { padding: '1rem', fontSize: '1.125rem' }
  };
  
  const sizeStyle = sizeMap[size];
  const borderColor = error ? '#ef4444' : '#d1d5db';
  const focusBorderColor = error ? '#dc2626' : '#3b82f6';
  
  const inputStyles = `
    width: 100%;
    padding: ${sizeStyle.padding};
    border: 1px solid ${borderColor};
    border-radius: 0.375rem;
    font-size: ${sizeStyle.fontSize};
    background-color: ${disabled ? '#f9fafb' : 'white'};
    color: ${disabled ? '#9ca3af' : '#111827'};
    transition: border-color 0.2s, box-shadow 0.2s;
    ${type === 'textarea' ? 'resize: vertical;' : ''}
  `;
  
  const focusScript = `
    onfocus="this.style.borderColor='${focusBorderColor}'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'"
    onblur="this.style.borderColor='${borderColor}'; this.style.boxShadow='none'"
  `;
  
  const inputElement = type === 'textarea' ? `
    <textarea
      id="${inputId}"
      name="${name}"
      placeholder="${placeholder || ''}"
      ${required ? 'required' : ''}
      ${disabled ? 'disabled' : ''}
      rows="${rows}"
      style="${inputStyles}"
      ${focusScript}
    >${value}</textarea>
  ` : `
    <input
      type="${type}"
      id="${inputId}"
      name="${name}"
      placeholder="${placeholder || ''}"
      value="${value}"
      ${required ? 'required' : ''}
      ${disabled ? 'disabled' : ''}
      style="${inputStyles}"
      ${focusScript}
    />
  `;
  
  const fieldContent = `
    ${label ? `
      <label for="${inputId}" style="
        font-weight: 500;
        font-size: 0.875rem;
        color: ${error ? '#dc2626' : '#374151'};
        margin-bottom: 0.25rem;
        display: block;
      ">
        ${label}
        ${required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ''}
      </label>
    ` : ''}
    ${inputElement}
    ${error ? `
      <div style="
        color: #dc2626;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      ">
        ${error}
      </div>
    ` : ''}
    ${help && !error ? `
      <div style="
        color: #6b7280;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      ">
        ${help}
      </div>
    ` : ''}
  `;
  
  const fieldStyles = `
    display: flex;
    flex-direction: column;
  `;
  
  return buildElement(
    'div',
    { className: 'field', ...props },
    fieldContent,
    fieldStyles
  );
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends BaseProps {
  name: string;
  label?: string;
  options: (string | SelectOption)[];
  value?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  error?: string;
  help?: string;
  multiple?: boolean;
}

export function Select({ 
  name, 
  label, 
  options, 
  value = '', 
  required = false, 
  disabled = false,
  placeholder = 'Select an option',
  size = 'md',
  error,
  help,
  multiple = false,
  ...props
}: SelectProps): string {
  const selectId = `select-${name}`;
  
  const sizeMap = {
    sm: { padding: '0.5rem', fontSize: '0.875rem' },
    md: { padding: '0.75rem', fontSize: '1rem' },
    lg: { padding: '1rem', fontSize: '1.125rem' }
  };
  
  const sizeStyle = sizeMap[size];
  const borderColor = error ? '#ef4444' : '#d1d5db';
  const focusBorderColor = error ? '#dc2626' : '#3b82f6';
  
  const optionElements = options.map(option => {
    if (typeof option === 'string') {
      return `<option value="${option}" ${value === option ? 'selected' : ''}>${option}</option>`;
    } else {
      return `
        <option 
          value="${option.value}" 
          ${value === option.value ? 'selected' : ''}
          ${option.disabled ? 'disabled' : ''}
        >
          ${option.label}
        </option>
      `;
    }
  }).join('');
  
  const selectStyles = `
    width: 100%;
    padding: ${sizeStyle.padding};
    border: 1px solid ${borderColor};
    border-radius: 0.375rem;
    font-size: ${sizeStyle.fontSize};
    background-color: ${disabled ? '#f9fafb' : 'white'};
    color: ${disabled ? '#9ca3af' : '#111827'};
    transition: border-color 0.2s, box-shadow 0.2s;
    cursor: ${disabled ? 'not-allowed' : 'pointer'};
  `;
  
  const focusScript = `
    onfocus="this.style.borderColor='${focusBorderColor}'; this.style.boxShadow='0 0 0 3px rgba(59, 130, 246, 0.1)'"
    onblur="this.style.borderColor='${borderColor}'; this.style.boxShadow='none'"
  `;
  
  const selectElement = `
    <select
      id="${selectId}"
      name="${name}"
      ${required ? 'required' : ''}
      ${disabled ? 'disabled' : ''}
      ${multiple ? 'multiple' : ''}
      style="${selectStyles}"
      ${focusScript}
    >
      ${placeholder && !multiple ? `<option value="" disabled ${!value ? 'selected' : ''}>${placeholder}</option>` : ''}
      ${optionElements}
    </select>
  `;
  
  const fieldContent = `
    ${label ? `
      <label for="${selectId}" style="
        font-weight: 500;
        font-size: 0.875rem;
        color: ${error ? '#dc2626' : '#374151'};
        margin-bottom: 0.25rem;
        display: block;
      ">
        ${label}
        ${required ? '<span style="color: #ef4444; margin-left: 0.25rem;">*</span>' : ''}
      </label>
    ` : ''}
    ${selectElement}
    ${error ? `
      <div style="
        color: #dc2626;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      ">
        ${error}
      </div>
    ` : ''}
    ${help && !error ? `
      <div style="
        color: #6b7280;
        font-size: 0.75rem;
        margin-top: 0.25rem;
      ">
        ${help}
      </div>
    ` : ''}
  `;
  
  const fieldStyles = `
    display: flex;
    flex-direction: column;
  `;
  
  return buildElement(
    'div',
    { className: 'field', ...props },
    fieldContent,
    fieldStyles
  );
}

export interface ButtonProps extends BaseProps, InteractionProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  onClick?: string; // JavaScript function name
  children: string;
  fullWidth?: boolean;
  
  // Interaction system props (already included via InteractionProps)
  'data-action'?: string;
  'data-entity'?: string;
  'data-id'?: string | number;
  'data-method'?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  'data-url'?: string;
  'data-confirm'?: string;
  'data-success'?: 'reload' | 'remove' | 'hide' | 'redirect' | 'update';
  'data-redirect'?: string;
  'data-target'?: string;
}

export function Button({ 
  type = 'button', 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  loading = false,
  onClick,
  children,
  fullWidth = false,
  // Interaction props
  'data-action': dataAction,
  'data-entity': dataEntity,
  'data-id': dataId,
  'data-method': dataMethod,
  'data-url': dataUrl,
  'data-confirm': dataConfirm,
  'data-success': dataSuccess,
  'data-redirect': dataRedirect,
  'data-target': dataTarget,
  ...props
}: ButtonProps): string {
  const variants = {
    primary: {
      bg: '#3b82f6',
      color: 'white',
      border: '#3b82f6',
      hoverBg: '#2563eb'
    },
    secondary: {
      bg: '#f3f4f6',
      color: '#374151',
      border: '#d1d5db',
      hoverBg: '#e5e7eb'
    },
    success: {
      bg: '#10b981',
      color: 'white',
      border: '#10b981',
      hoverBg: '#059669'
    },
    danger: {
      bg: '#ef4444',
      color: 'white', 
      border: '#ef4444',
      hoverBg: '#dc2626'
    },
    warning: {
      bg: '#f59e0b',
      color: 'white',
      border: '#f59e0b',
      hoverBg: '#d97706'
    },
    ghost: {
      bg: 'transparent',
      color: '#6b7280',
      border: 'transparent',
      hoverBg: '#f3f4f6'
    },
    outline: {
      bg: 'transparent',
      color: '#3b82f6',
      border: '#3b82f6',
      hoverBg: '#f0f9ff'
    }
  };
  
  const sizes = {
    xs: { padding: '0.25rem 0.75rem', fontSize: '0.75rem' },
    sm: { padding: '0.5rem 1rem', fontSize: '0.875rem' },
    md: { padding: '0.75rem 1.5rem', fontSize: '1rem' },
    lg: { padding: '1rem 2rem', fontSize: '1.125rem' },
    xl: { padding: '1.25rem 2.5rem', fontSize: '1.25rem' }
  };
  
  const variantStyle = variants[variant];
  const sizeStyle = sizes[size];
  const isDisabled = disabled || loading;
  
  // Build data attributes for interaction system
  const interactionAttributes = [
    dataAction && `data-action="${dataAction}"`,
    dataEntity && `data-entity="${dataEntity}"`, 
    dataId && `data-id="${dataId}"`,
    dataMethod && `data-method="${dataMethod}"`,
    dataUrl && `data-url="${dataUrl}"`,
    dataConfirm && `data-confirm="${dataConfirm}"`,
    dataSuccess && `data-success="${dataSuccess}"`,
    dataRedirect && `data-redirect="${dataRedirect}"`,
    dataTarget && `data-target="${dataTarget}"`
  ].filter(Boolean).join(' ');
  
  const buttonContent = loading ? `
    <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
      <span style="
        width: 1rem;
        height: 1rem;
        border: 2px solid currentColor;
        border-top: 2px solid transparent;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      "></span>
      ${children}
    </span>
  ` : children;
  
  const additionalStyles = `
    background-color: ${isDisabled ? '#e5e7eb' : variantStyle.bg};
    color: ${isDisabled ? '#9ca3af' : variantStyle.color};
    border: 1px solid ${isDisabled ? '#e5e7eb' : variantStyle.border};
    padding: ${sizeStyle.padding};
    font-size: ${sizeStyle.fontSize};
    font-weight: 500;
    border-radius: 0.375rem;
    cursor: ${isDisabled ? 'not-allowed' : 'pointer'};
    transition: all 0.2s;
    ${fullWidth ? 'width: 100%;' : ''}
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    text-decoration: none;
    user-select: none;
  `;
  
  const buttonAttributes = {
    type,
    ...(isDisabled && { disabled: true }),
    ...(onClick && { onclick: onClick }),
    onmouseover: isDisabled ? undefined : `this.style.backgroundColor='${variantStyle.hoverBg}'`,
    onmouseout: isDisabled ? undefined : `this.style.backgroundColor='${variantStyle.bg}'`,
    ...props
  };
  
  const spinKeyframes = loading ? `
    <style>
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
    </style>
  ` : '';
  
  return spinKeyframes + buildElement(
    'button',
    buttonAttributes,
    buttonContent,
    additionalStyles,
    interactionAttributes
  );
}