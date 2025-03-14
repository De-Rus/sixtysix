"use client"

import { useEffect, useRef, useState, useMemo } from "react"

export interface SubplotHeight {
  id: string
  height: number
}
export function useSubplotHeights(selectedIndicators: string[]) {
  const [isDraggingSubplot, setIsDraggingSubplot] = useState(false)

  const subplotHeights = useMemo(() => {
    return selectedIndicators
      .filter((id) => ["macd", "adx", "squeezeMomentum", "rsi"].includes(id))
      .map((id) => ({ id, height: 0.3 }))
  }, [selectedIndicators])

  return { subplotHeights, isDraggingSubplot, setIsDraggingSubplot }
}

/**
 * Hook to manage subplot ranges
 */
export function useSubplotRanges(selectedIndicators: string[]) {
  const [subplotRanges, setSubplotRanges] = useState<Record<string, [number, number]>>({})
  const prevIndicatorsRef = useRef<string[]>([])

  // Check for newly added subplot indicators
  useEffect(() => {
    // Check if indicators have actually changed to prevent unnecessary updates
    const indicatorsString = selectedIndicators.sort().join(",")
    const prevIndicatorsString = prevIndicatorsRef.current.sort().join(",")

    if (indicatorsString !== prevIndicatorsString) {
      const newIndicators = selectedIndicators.filter(
        (indicator) => ["macd", "adx", "squeezeMomentum", "rsi"].includes(indicator) && !subplotRanges[indicator],
      )

      if (newIndicators.length > 0) {
        const updates: Record<string, [number, number]> = {}

        newIndicators.forEach((indicator) => {
          // Initialize range for new subplot indicator
          let range: [number, number] = [0, 100]

          // Set specific ranges based on indicator type
          switch (indicator) {
            case "macd":
              range = [-2, 2] // Adjust these values based on your MACD typical ranges
              break
            case "adx":
              range = [0, 100] // ADX ranges from 0 to 100
              break
            case "squeezeMomentum":
              range = [-5, 5] // Adjust these values based on your Squeeze Momentum typical ranges
              break
            case "rsi":
              range = [0, 100] // RSI ranges from 0 to 100
              break
          }

          updates[indicator] = range
        })

        if (Object.keys(updates).length > 0) {
          setSubplotRanges((prev) => ({
            ...prev,
            ...updates,
          }))
        }
      }

      prevIndicatorsRef.current = [...selectedIndicators]
    }
  }, [selectedIndicators, subplotRanges])

  return {
    subplotRanges,
    setSubplotRanges,
  }
}

