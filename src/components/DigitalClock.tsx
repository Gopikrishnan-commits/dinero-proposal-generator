import { useState, useEffect } from 'react'
import { Clock, Globe } from 'lucide-react'

interface TimeZoneData {
  zone: string
  label: string
  offset: string
  time: string
  date: string
}

const TIMEZONES = [
  { zone: 'UTC', label: 'UTC / GMT', offset: '+0:00' },
  { zone: 'America/New_York', label: 'New York (EST)', offset: '-5:00' },
  { zone: 'America/Chicago', label: 'Chicago (CST)', offset: '-6:00' },
  { zone: 'America/Denver', label: 'Denver (MST)', offset: '-7:00' },
  { zone: 'America/Los_Angeles', label: 'Los Angeles (PST)', offset: '-8:00' },
  { zone: 'Europe/London', label: 'London (GMT)', offset: '±0:00' },
  { zone: 'Europe/Paris', label: 'Paris (CET)', offset: '+1:00' },
  { zone: 'Europe/Moscow', label: 'Moscow (MSK)', offset: '+3:00' },
  { zone: 'Asia/Dubai', label: 'Dubai (GST)', offset: '+4:00' },
  { zone: 'Asia/Kolkata', label: 'India (IST)', offset: '+5:30' },
  { zone: 'Asia/Bangkok', label: 'Bangkok (ICT)', offset: '+7:00' },
  { zone: 'Asia/Singapore', label: 'Singapore (SGT)', offset: '+8:00' },
  { zone: 'Asia/Tokyo', label: 'Tokyo (JST)', offset: '+9:00' },
  { zone: 'Australia/Sydney', label: 'Sydney (AEDT)', offset: '+11:00' },
  { zone: 'Pacific/Auckland', label: 'Auckland (NZDT)', offset: '+13:00' },
]

export default function DigitalClock() {
  const [times, setTimes] = useState<TimeZoneData[]>([])
  const [selectedZones, setSelectedZones] = useState<string[]>(['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'])

  useEffect(() => {
    const updateTime = () => {
      const updatedTimes = selectedZones.map((zone) => {
        const tzData = TIMEZONES.find((t) => t.zone === zone)!
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: zone,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
        const dateFormatter = new Intl.DateTimeFormat('en-US', {
          timeZone: zone,
          weekday: 'short',
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })

        return {
          zone,
          label: tzData.label,
          offset: tzData.offset,
          time: formatter.format(new Date()),
          date: dateFormatter.format(new Date()),
        }
      })
      setTimes(updatedTimes)
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [selectedZones])

  const toggleZone = (zone: string) => {
    setSelectedZones((prev) =>
      prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Clock className="w-12 h-12 text-cyan-400 animate-pulse" />
            <h1 className="text-5xl font-bold text-white drop-shadow-lg">World Clock</h1>
            <Globe className="w-12 h-12 text-cyan-400 animate-pulse" />
          </div>
          <p className="text-gray-300 text-lg">Real-time display of current time across different time zones 🌍</p>
        </div>

        {/* Active Time Zones Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {times.map((data) => (
            <div
              key={data.zone}
              className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-lg p-6 shadow-2xl border border-cyan-500 border-opacity-30 hover:border-opacity-100 transition-all"
            >
              <div className="text-center">
                <h3 className="text-cyan-400 font-bold text-sm mb-1">{data.label}</h3>
                <p className="text-gray-400 text-xs mb-3">Offset: {data.offset}</p>
                <div className="bg-black bg-opacity-50 rounded-lg p-4 mb-3 font-mono">
                  <p className="text-3xl font-bold text-green-400 tracking-wider">{data.time}</p>
                  <p className="text-xs text-gray-400 mt-2">{data.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Time Zone Selector */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-lg p-8 shadow-2xl border border-purple-500 border-opacity-30">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            Select Time Zones
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {TIMEZONES.map((tz) => (
              <button
                key={tz.zone}
                onClick={() => toggleZone(tz.zone)}
                className={`p-3 rounded-lg font-medium transition-all text-left ${
                  selectedZones.includes(tz.zone)
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg scale-105'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                      selectedZones.includes(tz.zone)
                        ? 'border-white bg-white'
                        : 'border-gray-400 bg-transparent'
                    }`}
                  >
                    {selectedZones.includes(tz.zone) && (
                      <span className="text-blue-600 font-bold">✓</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{tz.label}</p>
                    <p className="text-xs opacity-75">{tz.offset}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-10 text-gray-400 text-sm">
          <p>🔄 Updates in real-time every second</p>
          <p className="mt-2">Select up to multiple time zones to compare times side by side</p>
        </div>
      </div>
    </div>
  )
}
