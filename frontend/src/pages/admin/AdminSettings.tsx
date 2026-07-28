import { useState } from "react"
import { Settings, Save, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdminSettings() {
  const [sirenVolume, setSirenVolume] = useState("High Decibel (110dB)")
  const [smsGateway, setSmsGateway] = useState("BSNL Govt Telemetry Gateway")
  const [isSaved, setIsSaved] = useState(false)

  const handleSave = () => {
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2500)
  }

  return (
    <div className="space-y-4 max-w-4xl">
      
      {/* Header */}
      <div className="bg-white border border-[#dcd8cd] rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-[#1b4332] text-white rounded">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0f291e]">
              System Configuration & Gateway Control
            </h2>
            <p className="text-[11px] text-[#6b705c]">
              Early warning alarm thresholds • SMS broadcast gateway • Security audit logs
            </p>
          </div>
        </div>

        <Button onClick={handleSave} size="sm">
          <Save className="h-3.5 w-3.5 mr-1" /> Save Settings
        </Button>
      </div>

      {isSaved && (
        <div className="p-3 bg-[#edf7ee] border border-[#b8e2be] text-[#2e6f40] rounded text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" /> System settings updated successfully across all grid nodes.
        </div>
      )}

      {/* Settings Forms */}
      <div className="bg-white border border-[#dcd8cd] rounded p-5 space-y-5">
        
        {/* Section 1: Alarm & Siren Control */}
        <div className="space-y-3 pb-4 border-b border-[#e8e5dc]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">1. Acoustic Siren & Early Warning Rules</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Siren Activation Mode</label>
              <select className="w-full bg-[#f6f5f2] border border-[#dcd8cd] rounded p-2 text-xs text-gray-900">
                <option>Automatic (AI Confidence &gt; 90%)</option>
                <option>Manual Ranger Dispatch Only</option>
                <option>Hybrid Dual Verification</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Siren Output Decibel</label>
              <select 
                value={sirenVolume} 
                onChange={(e) => setSirenVolume(e.target.value)}
                className="w-full bg-[#f6f5f2] border border-[#dcd8cd] rounded p-2 text-xs text-gray-900"
              >
                <option>High Decibel (110dB)</option>
                <option>Medium Decibel (90dB)</option>
                <option>Low Frequency Pulsed Tone</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: SMS Broadcast Gateway */}
        <div className="space-y-3 pb-4 border-b border-[#e8e5dc]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">2. Community Emergency SMS Gateway</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Active Telecom Gateway</label>
              <select 
                value={smsGateway} 
                onChange={(e) => setSmsGateway(e.target.value)}
                className="w-full bg-[#f6f5f2] border border-[#dcd8cd] rounded p-2 text-xs text-gray-900"
              >
                <option>BSNL Govt Telemetry Gateway</option>
                <option>NIC Emergency Broadcast API</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 block">Emergency Retry Retries</label>
              <input 
                type="number" 
                defaultValue={3} 
                className="w-full bg-[#f6f5f2] border border-[#dcd8cd] rounded p-2 text-xs text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Audit Log & Security */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f291e]">3. Department Audit Logs</h3>
          <div className="p-3 bg-[#f6f5f2] border border-[#e8e5dc] rounded font-mono text-[11px] space-y-1 text-gray-700">
            <p>[2026-07-28 09:42] User: SKurian (Super Admin) updated Siren rules on CAM-NORTH-04</p>
            <p>[2026-07-28 08:15] User: SForest (Officer) dispatched Patrol Unit Bravo-2</p>
            <p>[2026-07-28 07:00] System: Telemetry sync completed for 142 nodes</p>
          </div>
        </div>

      </div>

    </div>
  )
}
