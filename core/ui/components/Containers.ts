// Container component definitions for the constrained UI system

import { BaseProps, ContainerProps } from '../types/base-props.ts';
import { buildElement, processInteractionProps, InteractionProps } from '../utils/prop-utils.ts';

export interface ViewProps extends BaseProps, ContainerProps, InteractionProps {
  children: string;
}

export function View({ 
  children,
  ...props 
}: ViewProps): string {
  // Default values for View component
  const viewDefaults = {
    p: props.p ?? 0,
    m: props.m ?? 0,
    bg: props.bg ?? 'transparent',
    rounded: props.rounded ?? false,
    shadow: props.shadow ?? 0,
    ...props
  };

  const interactionAttributes = processInteractionProps(props);
  
  return buildElement(
    'div',
    viewDefaults,
    children,
    '', // no additional styles
    interactionAttributes
  );
}

export interface CardProps extends BaseProps, ContainerProps, InteractionProps {
  children: string;
}

export function Card({ 
  children,
  ...props 
}: CardProps): string {
  // Default values for Card component
  const cardDefaults = {
    p: props.p ?? 6,
    bg: props.bg ?? 'white',
    shadow: props.shadow ?? 1,
    rounded: props.rounded ?? true,
    className: props.className ? `card ${props.className}` : 'card',
    ...props
  };

  return View({ 
    children,
    ...cardDefaults 
  });
}

export interface SectionProps extends BaseProps {
  children: string;
}

export function Section({ 
  children,
  ...props 
}: SectionProps): string {
  // Default values for Section component
  const sectionDefaults = {
    p: props.p ?? 8,
    className: props.className ? `section ${props.className}` : 'section',
    ...props
  };

  const additionalStyles = 'padding-top: 0; padding-bottom: 0;'; // Override default padding behavior
  
  return buildElement(
    'section',
    sectionDefaults,
    children,
    additionalStyles
  );
}

export interface ModalProps extends BaseProps {
  open: boolean;
  title?: string;
  onClose?: string; // JavaScript function name
  children: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ 
  open, 
  title, 
  onClose, 
  children, 
  size = 'md',
  ...props 
}: ModalProps): string {
  if (!open) return '';

  const sizeMap = {
    sm: '400px',
    md: '600px', 
    lg: '800px',
    xl: '1000px'
  };
  
  const overlayProps = {
    className: 'modal-overlay',
    ...props
  };

  const overlayStyles = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0,0,0,0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  `;

  const contentStyles = `
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 20px 25px rgba(0,0,0,0.15);
    max-width: min(${sizeMap[size]}, 90vw);
    max-height: 90vh;
    overflow-y: auto;
    margin: 1rem;
  `;

  const headerContent = title ? `
    <div class="modal-header" style="
      padding: 1.5rem 1.5rem 0 1.5rem;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 1.5rem;
      position: relative;
    ">
      <h2 style="margin: 0; font-size: 1.25rem; font-weight: 600;">
        ${title}
      </h2>
      ${onClose ? `
        <button 
          onclick="${onClose}"
          style="
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: #6b7280;
          "
          aria-label="Close modal"
        >
          ×
        </button>
      ` : ''}
    </div>
  ` : '';

  const modalContent = `
    <div class="modal-content" style="${contentStyles}">
      ${headerContent}
      <div class="modal-body" style="padding: 1.5rem;">
        ${children}
      </div>
    </div>
  `;

  const clickHandler = onClose ? `onclick="if(event.target === this) ${onClose}"` : '';

  return buildElement(
    'div',
    overlayProps,
    modalContent,
    overlayStyles,
    clickHandler
  );
}