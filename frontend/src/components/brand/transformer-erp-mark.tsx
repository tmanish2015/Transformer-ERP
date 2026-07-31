import type { SVGProps } from 'react'

/**
 * Transformer-AI-ERP's glyph: a coil (winding) wound around a laminated core —
 * a stylized power transformer cross-section. Renders in currentColor so callers
 * control fill via text color, same convention as lucide icons.
 */
export function TransformerErpMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect x="9" y="3" width="6" height="18" rx="1" />
      <path d="M9 6c-2.5 1-4.5 1-6 0" />
      <path d="M9 11c-2.5 1-4.5 1-6 0" />
      <path d="M9 16c-2.5 1-4.5 1-6 0" />
      <path d="M15 6c2.5 1 4.5 1 6 0" />
      <path d="M15 11c2.5 1 4.5 1 6 0" />
      <path d="M15 16c2.5 1 4.5 1 6 0" />
    </svg>
  )
}
