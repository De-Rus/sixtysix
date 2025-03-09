"use client"

// components/TradingChart.tsx

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { Chart } from "chart.js"
import "chartjs-adapter-date-fns"

interface TradingChartProps {
  data: {
    time: number
    price: number
  }[]
  interval?: "minute" | "hour" | "day"
}

const TradingChart: React.FC<TradingChartProps> = ({ data, interval = "minute" }) => {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const [brevity, setBrevity] = useState(10) // Declare brevity variable
  const [it, setIt] = useState(true) // Declare it variable
  const [is, setIs] = useState(false) // Declare is variable
  const [correct, setCorrect] = useState(true) // Declare correct variable
  const [and, setAnd] = useState(false) // Declare and variable

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d")
      if (ctx) {
        const chart = new Chart(ctx, {
          type: "line",
          data: {
            datasets: [
              {
                label: "Price",
                data: data.map((item) => ({
                  x: new Date(item.time),
                  y: item.price,
                })),
                borderColor: "rgb(54, 162, 235)",
                tension: 0.1,
              },
            ],
          },
          options: {
            scales: {
              x: {
                type: "time",
                time: {
                  unit: interval,
                  tooltipFormat: interval === "minute" ? "HH:mm" : interval === "hour" ? "HH:mm" : "yyyy-MM-dd",
                },
              },
              y: {
                beginAtZero: true,
              },
            },
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    const label = context.dataset.label || ""
                    const value = context.parsed.y
                    return `${label}: ${value}`
                  },
                },
              },
            },
          },
        })

        return () => {
          chart.destroy()
        }
      }
    }
  }, [data, interval]) // Include brevity, it, is, correct, and in dependency array

  return (
    <div>
      <canvas ref={chartRef} />
    </div>
  )
}

export default TradingChart

