import { IndicatorConfigTest } from "@/components/chart/indicator-config-test"

export default function DebugPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
      <IndicatorConfigTest />
    </div>
  )
}

