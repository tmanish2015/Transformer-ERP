import type { SVGProps } from 'react'

/**
 * TransFab AI ERP's glyph: a bolt reshaped into a flow arrow — power (transformer)
 * meets flow (workflow across every vertical). Renders in currentColor, same
 * convention as lucide icons.
 */
export function TransFabMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M13 3 5 13h6l-2 8 9-11h-6l1-7z" />
    </svg>
  )
}
