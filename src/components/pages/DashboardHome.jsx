import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { FileText, Users2, Calendar, BookOpen, Users, Zap, RefreshCw } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const API_BASE = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1'

const DASHBOARD_ENDPOINTS = {
  blogs: '/blogs/',
  disciples: '/discipleship/',
  events: '/events/',
  members: '/join-us/',
  prayers: '/prayer-requests/',
  programs: '/programs/',
}

const extractCount = (body) => {
  if (!body) return 0
  if (typeof body?.data?.count === 'number') return body.data.count
  if (typeof body?.meta?.count === 'number') return body.meta.count
  if (Array.isArray(body?.data?.results)) return body.data.results.length
  if (Array.isArray(body?.data)) return body.data.length
  if (Array.isArray(body)) return body.length
  return 0
}

export const DashboardHome = ({ user, setActiveMenu }) => {
  const { tokens } = useAuth()
  const [counts, setCounts] = useState({
    blogs: 0,
    disciples: 0,
    events: 0,
    members: 0,
    prayers: 0,
    programs: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

  const authHeader = tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}

  const fetchCounts = async () => {
    try {
      const results = await Promise.all(
        Object.entries(DASHBOARD_ENDPOINTS).map(async ([key, endpoint]) => {
          const response = await fetch(`${API_BASE}${endpoint}`, { headers: authHeader })
          if (!response.ok) {
            throw new Error(`Unable to load ${key} count.`)
          }
          const body = await response.json().catch(() => null)
          return [key, extractCount(body)]
        }),
      )

      setCounts(Object.fromEntries(results))
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      setError('')
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (!tokens?.access) return

    const load = async () => {
      setLoading(true)
      setError('')
      await fetchCounts()
      setLoading(false)
    }

    load()
    const interval = setInterval(load, 30000)
    return () => clearInterval(interval)
  }, [tokens?.access])

  const stats = [
    { icon: FileText, label: 'Blogs', value: counts.blogs, color: 'from-blue-500 to-blue-600' },
    { icon: Users2, label: 'Disciples', value: counts.disciples, color: 'from-purple-500 to-purple-600' },
    { icon: Calendar, label: 'Events', value: counts.events, color: 'from-pink-500 to-pink-600' },
    { icon: Users, label: 'Members', value: counts.members, color: 'from-orange-500 to-orange-600' },
    { icon: BookOpen, label: 'Prayer Requests', value: counts.prayers, color: 'from-green-500 to-green-600' },
    { icon: Zap, label: 'Programs', value: counts.programs, color: 'from-yellow-500 to-yellow-600' },
  ]

  const quickActions = [
    { label: 'Create Blog', subtitle: 'Add new content', page: 'blogs', color: 'border-blue-400 hover:bg-blue-50' },
    { label: 'Create Track', subtitle: 'Add discipleship content', page: 'disciples', color: 'border-purple-400 hover:bg-purple-50' },
    { label: 'Add Event', subtitle: 'Schedule event', page: 'events', color: 'border-pink-400 hover:bg-pink-50' },
    { label: 'Invite Member', subtitle: 'Add new member', page: 'members', color: 'border-orange-400 hover:bg-orange-50' },
    { label: 'View Prayer Requests', subtitle: 'Track prayer needs', page: 'prayers', color: 'border-green-400 hover:bg-green-50' },
    { label: 'Manage Programs', subtitle: 'Create program', page: 'programs', color: 'border-yellow-400 hover:bg-yellow-50' },
  ]

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Welcome back, {user?.full_name || 'Admin'}!</h1>
          <p className="text-slate-600 mt-2">Live community insights and direct actions for Bold n Rooted.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={fetchCounts}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition"
          >
            <RefreshCw size={18} /> Refresh counts
          </button>
          <div className="rounded-full bg-slate-100 px-4 py-3 text-xs font-semibold text-slate-600">
            {lastUpdated ? `Updated at ${lastUpdated}` : 'Loading counts...'}
          </div>
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03, y: -3 }}
              className={`p-6 rounded-2xl bg-linear-to-br ${stat.color} text-white shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-white/20 rounded-lg">
                  <Icon size={24} />
                </div>
                <span className="text-sm font-semibold bg-white/20 px-3 py-1 rounded-full">Live</span>
              </div>
              <h3 className="text-sm font-medium text-white/80 mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold">{loading ? '…' : stat.value}</p>
            </motion.div>
          )
        })}
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>
            <p className="text-slate-600 mt-1">Jump straight into the tools you use most.</p>
          </div>
          {error && (
            <div className="rounded-full bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 border border-rose-200">
              {error}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {quickActions.map((action) => (
            <button
              key={action.page}
              type="button"
              onClick={() => setActiveMenu(action.page)}
              className={`rounded-xl border-2 border-slate-200 px-4 py-5 text-left transition ${action.color}`}
            >
              <p className="text-sm font-semibold text-slate-900">{action.label}</p>
              <p className="text-xs text-slate-600 mt-2">{action.subtitle}</p>
            </button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } }} className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Latest activity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Monitor your community</p>
            <p className="text-sm text-slate-600 mt-2">Your counts refresh automatically every 30 seconds so you can stay on top of programs, events, prayer requests, and more.</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200">
            <p className="text-sm font-semibold text-slate-900">Navigate faster</p>
            <p className="text-sm text-slate-600 mt-2">Use quick links to move directly into the screen you need and update content faster than ever.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
