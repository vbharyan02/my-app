import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import supabase from '../lib/supabase'

function intensityBadge(n) {
  if (n <= 3) return 'bg-green-100 text-green-800'
  if (n <= 6) return 'bg-yellow-100 text-yellow-800'
  return 'bg-red-100 text-red-800'
}

function intensityBarColor(n) {
  if (n <= 3) return 'bg-green-400'
  if (n <= 6) return 'bg-yellow-400'
  return 'bg-red-500'
}

function relativeTime(ts) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function startOfWeek() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay())
  return d
}

// ── Box Breathing Component ──────────────────────────────────────────────────
const PHASES = ['Inhale', 'Hold', 'Exhale', 'Hold']
const PHASE_DURATION = 4

function BoxBreathing({ onComplete }) {
  const [phase, setPhase] = useState(0)
  const [count, setCount] = useState(PHASE_DURATION)
  const [cycles, setCycles] = useState(0)
  const [done, setDone] = useState(false)
  const timerRef = useRef(null)
  const startRef = useRef(Date.now())

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCount(prev => {
        if (prev > 1) return prev - 1
        setPhase(p => {
          const next = (p + 1) % 4
          if (next === 0) {
            setCycles(c => {
              const newC = c + 1
              if (newC >= 4) {
                clearInterval(timerRef.current)
                const duration = Math.round((Date.now() - startRef.current) / 1000)
                setDone(true)
                onComplete('box_breathing', duration)
              }
              return newC
            })
          }
          return next
        })
        return PHASE_DURATION
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const scale = phase === 0 ? 'scale-150' : phase === 2 ? 'scale-75' : 'scale-100'
  const phaseColors = ['bg-blue-400', 'bg-indigo-300', 'bg-teal-400', 'bg-indigo-300']

  if (done) return (
    <div className="flex flex-col items-center py-6 gap-2">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-2xl">✓</span>
      </div>
      <p className="text-green-700 font-semibold">Great job! Session recorded.</p>
    </div>
  )

  return (
    <div className="flex flex-col items-center py-6 gap-4">
      <div className={`w-24 h-24 rounded-full ${phaseColors[phase]} shadow-lg transition-transform duration-1000 ease-in-out ${scale}`} />
      <p className="text-xl font-semibold text-gray-800">{PHASES[phase]}</p>
      <p className="text-4xl font-bold text-blue-600 tabular-nums">{count}</p>
      <p className="text-sm text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Cycle {cycles + 1} of 4</p>
    </div>
  )
}

// ── Countdown Component ───────────────────────────────────────────────────────
function Countdown({ onComplete }) {
  const [num, setNum] = useState(10)
  const [done, setDone] = useState(false)
  const startRef = useRef(Date.now())
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setNum(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current)
          const duration = Math.round((Date.now() - startRef.current) / 1000)
          setDone(true)
          onComplete('countdown', duration)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  if (done) return (
    <div className="flex flex-col items-center py-6 gap-2">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-2xl">✓</span>
      </div>
      <p className="text-green-700 font-semibold">Done! Session recorded.</p>
    </div>
  )

  return (
    <div className="flex flex-col items-center py-6 gap-3">
      <p className="text-gray-400 text-sm tracking-wide uppercase">Focus on this number</p>
      <div className="w-28 h-28 rounded-full bg-orange-50 border-4 border-orange-300 flex items-center justify-center">
        <span className="text-5xl font-bold text-orange-500 tabular-nums">{num}</span>
      </div>
      <p className="text-gray-400 text-sm">Breathe slowly as you count down</p>
    </div>
  )
}

// ── Journaling Component ──────────────────────────────────────────────────────
function Journaling({ onComplete }) {
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const startRef = useRef(Date.now())

  const PROMPT = "What triggered your anger? What were you feeling underneath it? What would a calmer version of you do right now?"

  function handleDone() {
    const duration = Math.round((Date.now() - startRef.current) / 1000)
    setDone(true)
    onComplete('journaling', Math.max(duration, 30))
  }

  if (done) return (
    <div className="flex flex-col items-center py-6 gap-2">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
        <span className="text-2xl">✓</span>
      </div>
      <p className="text-green-700 font-semibold">Journaling session recorded.</p>
    </div>
  )

  return (
    <div className="py-2 space-y-3">
      <p className="text-sm text-gray-600 italic leading-relaxed bg-purple-50 rounded-lg px-3 py-2">{PROMPT}</p>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={5}
        className="border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition resize-none"
        placeholder="Write freely here…"
      />
      <button
        onClick={handleDone}
        disabled={!text.trim()}
        className="bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white px-4 py-2.5 rounded-lg w-full text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Done Journaling
      </button>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function MainPage() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [sessions, setSessions] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [intensity, setIntensity] = useState(5)
  const [trigger, setTrigger] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [activeTechnique, setActiveTechnique] = useState(null)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setIsLoading(true)
    setError(null)
    try {
      const [logsRes, sessionsRes] = await Promise.all([
        supabase.from('anger_logs').select('*').order('created_at', { ascending: false }),
        supabase.from('coping_sessions').select('*').order('created_at', { ascending: false })
      ])
      if (logsRes.error) throw logsRes.error
      if (sessionsRes.error) throw sessionsRes.error
      setLogs(logsRes.data)
      setSessions(sessionsRes.data)
    } catch (err) {
      if (
        err.message?.includes('does not exist') ||
        err.message?.includes('schema cache') ||
        err.message?.includes('relation') ||
        err.message?.includes('Could not find')
      ) {
        setError('Something went wrong. Please try again later.')
      } else {
        setError(err.message || 'Connection error. Please check your internet and try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function handleLogSubmit(e) {
    e.preventDefault()
    setFormError('')
    if (!trigger.trim()) { setFormError('Trigger is required'); return }
    setSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('anger_logs')
        .insert({ user_id: user.id, intensity, trigger: trigger.trim(), notes: notes.trim() || null })
        .select()
        .single()
      if (error) { setFormError(error.message); return }
      setLogs(prev => [data, ...prev])
      setTrigger('')
      setNotes('')
      setIntensity(5)
      setFormSuccess(true)
      setTimeout(() => setFormSuccess(false), 3000)
    } catch {
      setFormError('Failed to save. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    const { error } = await supabase.from('anger_logs').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  async function handleCopingComplete(technique, duration_seconds) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('coping_sessions')
        .insert({ user_id: user.id, technique, duration_seconds })
        .select()
        .single()
      if (!error && data) setSessions(prev => [data, ...prev])
    } catch {}
    setTimeout(() => setActiveTechnique(null), 2500)
  }

  const weekStart = startOfWeek()
  const weekLogs = logs.filter(l => new Date(l.created_at) >= weekStart)
  const avgIntensity = weekLogs.length
    ? (weekLogs.reduce((s, l) => s + l.intensity, 0) / weekLogs.length).toFixed(1)
    : '—'
  const triggerCounts = weekLogs.reduce((acc, l) => {
    acc[l.trigger] = (acc[l.trigger] || 0) + 1; return acc
  }, {})
  const topTrigger = Object.keys(triggerCounts).sort((a, b) => triggerCounts[b] - triggerCounts[a])[0] || '—'
  const weekSessions = sessions.filter(s => new Date(s.created_at) >= weekStart)

  async function logout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (isLoading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (error) return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
      <p className="text-red-500 text-center px-4">{error}</p>
      <button
        onClick={fetchAll}
        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition"
      >
        Try again
      </button>
    </div>
  )

  const inputCls = 'border border-gray-300 rounded-lg px-3 py-2.5 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-xl">😤</span>
            <h1 className="text-lg font-bold text-gray-900">Anger Controller</h1>
          </div>
          <button
            onClick={logout}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium transition"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        {/* Dashboard Stats */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">This Week</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { value: weekLogs.length, label: 'Anger Episodes', color: 'text-blue-600' },
              { value: avgIntensity, label: 'Avg Intensity', color: 'text-orange-500' },
              { value: topTrigger, label: 'Top Trigger', color: 'text-gray-800', small: true },
              { value: weekSessions.length, label: 'Coping Sessions', color: 'text-green-600' },
            ].map(({ value, label, color, small }, i) => (
              <div key={i} className={`bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-center ${i === 2 ? 'col-span-2 sm:col-span-1' : ''}`}>
                <div className={`${small ? 'text-sm' : 'text-2xl'} font-bold ${color} truncate`}>{value}</div>
                <div className="text-xs text-gray-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Anger Log Form */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Log an Episode</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intensity: <span className={`font-bold ${intensity >= 7 ? 'text-red-600' : intensity >= 4 ? 'text-yellow-600' : 'text-green-600'}`}>{intensity}</span>
                  <span className="text-gray-400"> / 10</span>
                </label>
                <input
                  type="range"
                  min="1" max="10"
                  value={intensity}
                  onChange={e => setIntensity(Number(e.target.value))}
                  className="w-full accent-red-500 cursor-pointer"
                />
                <div className="flex gap-1 mt-2">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div
                      key={i}
                      className={`flex-1 h-1.5 rounded-full transition-colors ${i < intensity ? intensityBarColor(intensity) : 'bg-gray-200'}`}
                    />
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Mild</span><span>Extreme</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trigger <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  placeholder="What triggered you?"
                  value={trigger}
                  onChange={e => setTrigger(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes <span className="text-gray-400">(optional)</span></label>
                <textarea
                  placeholder="Any additional context…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                  className={`${inputCls} resize-none`}
                />
              </div>
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <p className="text-red-600 text-sm">{formError}</p>
                </div>
              )}
              {formSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <p className="text-green-700 text-sm">Episode logged successfully!</p>
                </div>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-2.5 rounded-lg w-full text-sm font-medium transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? 'Saving…' : 'Log Episode'}
              </button>
            </form>
          </div>
        </section>

        {/* Coping Exercises */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Coping Exercises</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            {!activeTechnique && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: 'box_breathing', label: 'Box Breathing', emoji: '🫁', cls: 'bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200' },
                  { key: 'countdown', label: 'Countdown 10→1', emoji: '🔢', cls: 'bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200' },
                  { key: 'journaling', label: 'Journaling', emoji: '📓', cls: 'bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200' },
                ].map(({ key, label, emoji, cls }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTechnique(key)}
                    className={`${cls} px-4 py-3 rounded-xl font-medium text-sm flex items-center gap-2 justify-center transition`}
                  >
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            )}
            {activeTechnique === 'box_breathing' && <BoxBreathing key="bb" onComplete={handleCopingComplete} />}
            {activeTechnique === 'countdown' && <Countdown key="cd" onComplete={handleCopingComplete} />}
            {activeTechnique === 'journaling' && <Journaling key="jn" onComplete={handleCopingComplete} />}
            {activeTechnique && (
              <button
                onClick={() => setActiveTechnique(null)}
                className="text-xs text-gray-400 hover:text-gray-600 underline mt-4 block transition"
              >
                Cancel
              </button>
            )}
          </div>
        </section>

        {/* Anger History */}
        <section className="pb-6">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">History</h2>
          {logs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 py-16 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-gray-500 font-medium">No episodes yet</p>
              <p className="text-gray-400 text-sm mt-1">Log your first one above.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {logs.map(log => (
                <li key={log.id} className="bg-white rounded-xl shadow-sm border border-gray-100 px-4 py-3.5 flex items-start justify-between gap-3 hover:border-gray-200 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${intensityBadge(log.intensity)}`}>
                        {log.intensity}/10
                      </span>
                      <span className="font-medium text-gray-900 truncate">{log.trigger}</span>
                      <span className="text-gray-400 text-xs shrink-0">{relativeTime(log.created_at)}</span>
                    </div>
                    {log.notes && (
                      <p className="text-sm text-gray-500 mt-1 truncate">{log.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="text-gray-300 hover:text-red-500 text-sm shrink-0 transition px-1"
                    title="Delete"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  )
}
