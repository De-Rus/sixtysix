"use client"

import { useEffect } from "react"

interface LineDrawingHelperProps {
  isActive: boolean
  onEscape: () => void
}

/**
 * Helper component to handle keyboard events for line drawing
 */
export function LineDrawingHelper({ isActive, onEscape }: LineDrawingHelperProps) {
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onEscape()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isActive, onEscape])

  return null // This component doesn't render anything
}

