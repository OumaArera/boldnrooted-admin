import { useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Users2,
  Pencil,
  Trash2,
  ClipboardList,
  CheckCircle2,
  Lock,
  ArrowRightCircle,
} from 'lucide-react'

const API_BASE = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1'

const initialTrackForm = {
  title: '',
  subtitle: '',
  level: 'Beginner',
  weeks: 6,
  verse: '',
  verse_reference: '',
  description: '',
  icon: '🌱',
  gradient: 'linear-gradient(145deg, #c4a882, #b09070)',
  accent: '#c4a882',
}

const initialModuleForm = {
  title: '',
  module_type: 'reading',
  duration: '30 min',
  order: 1,
  completed: false,
  locked: false,
}

export const Disciples = () => {
  const { tokens } = useAuth()
  const [tracks, setTracks] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [trackForm, setTrackForm] = useState(initialTrackForm)
  const [moduleForm, setModuleForm] = useState(initialModuleForm)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const detailRef = useRef(null)

  const authHeaders = useMemo(() => {
    if (!tokens?.access) return {}
    return {
      Authorization: `Bearer ${tokens.access}`,
      'Content-Type': 'application/json',
    }
  }, [tokens])

  const selectedTrack = useMemo(() => tracks.find((track) => track.id === selectedId), [tracks, selectedId])

  const refreshTracks = async () => {
    if (!tokens?.access) return
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_BASE}/discipleship/`, {
        headers: authHeaders,
      })
      if (!response.ok) {
        throw new Error('Could not load discipleship tracks.')
      }
      const body = await response.json()
      const results = body?.data?.results || body
      setTracks(results)
      if (results.length > 0) {
        setSelectedId((prev) => prev || results[0].id)
      } else {
        setSelectedId(null)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshTracks()
  }, [tokens])

  useEffect(() => {
    if (selectedTrack) {
      setTrackForm({
        title: selectedTrack.title || '',
        subtitle: selectedTrack.subtitle || '',
        level: selectedTrack.level || 'Beginner',
        weeks: selectedTrack.weeks || 6,
        verse: selectedTrack.verse || '',
        verse_reference: selectedTrack.verse_reference || '',
        description: selectedTrack.description || '',
        icon: selectedTrack.icon || '🌱',
        gradient: selectedTrack.gradient || 'linear-gradient(145deg, #c4a882, #b09070)',
        accent: selectedTrack.accent || '#c4a882',
      })
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedTrack])

  const selectTrack = (track) => {
    setSelectedId(track.id)
  }

  const handleTrackChange = (field, value) => {
    setTrackForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleModuleChange = (field, value) => {
    setModuleForm((prev) => ({ ...prev, [field]: value }))
  }

  const makeSlug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

  const handleCreateTrack = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        ...trackForm,
        slug: makeSlug(trackForm.title || 'new-track'),
      }
      const response = await fetch(`${API_BASE}/discipleship/`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Failed to create discipleship track.')
      }
      await response.json()
      setMessage('Track created successfully.')
      setTrackForm(initialTrackForm)
      refreshTracks()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTrack = async () => {
    if (!selectedTrack) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        ...trackForm,
        slug: makeSlug(trackForm.title || selectedTrack.title),
      }
      const response = await fetch(`${API_BASE}/discipleship/${selectedTrack.id}/`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error('Failed to update discipleship track.')
      }
      await response.json()
      setMessage('Track updated successfully.')
      refreshTracks()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTrack = async () => {
    if (!selectedTrack) return
    const confirmed = window.confirm(`Delete "${selectedTrack.title}" and all associated modules?`)
    if (!confirmed) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_BASE}/discipleship/${selectedTrack.id}/`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!response.ok) {
        throw new Error('Failed to delete discipleship track.')
      }
      setMessage('Track deleted successfully.')
      refreshTracks()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveModule = async () => {
    if (!selectedTrack) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {
        title: moduleForm.title,
        module_type: moduleForm.module_type,
        duration: moduleForm.duration,
        order: moduleForm.order,
        completed: moduleForm.completed,
        locked: moduleForm.locked,
        track: selectedTrack.id,
      }

      const url = moduleForm.id
        ? `${API_BASE}/discipleship-modules/${moduleForm.id}/`
        : `${API_BASE}/discipleship-modules/`
      const method = moduleForm.id ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: authHeaders,
        body: JSON.stringify(payload),
      })
      if (!response.ok) {
        throw new Error(moduleForm.id ? 'Failed to update module.' : 'Failed to create module.')
      }
      await response.json()
      setMessage(moduleForm.id ? 'Module updated successfully.' : 'Module created successfully.')
      setModuleForm(initialModuleForm)
      refreshTracks()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleModuleToggle = async (module, field) => {
    const response = await fetch(`${API_BASE}/discipleship-modules/${module.id}/`, {
      method: 'PATCH',
      headers: authHeaders,
      body: JSON.stringify({ [field]: !module[field] }),
    })
    if (!response.ok) {
      setError('Failed to update module.')
      return
    }
    await response.json()
    refreshTracks()
  }

  const handleDeleteModule = async (module) => {
    const confirmed = window.confirm(`Delete module "${module.title}"?`)
    if (!confirmed) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(`${API_BASE}/discipleship-modules/${module.id}/`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!response.ok) {
        throw new Error('Failed to delete module.')
      }
      setMessage('Module deleted successfully.')
      refreshTracks()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!tokens?.access) {
    return (
      <div className="p-10 rounded-3xl bg-white shadow-lg text-center">
        <p className="text-slate-700">You need to sign in to manage discipleship.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Discipleship</h1>
          <p className="text-slate-600 mt-2">Create, update, and manage discipleship tracks and modules with confidence.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedId(null)
            setTrackForm(initialTrackForm)
            setModuleForm(initialModuleForm)
          }}
          className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200/40 hover:bg-indigo-700 transition"
        >
          <Plus size={18} /> New Track
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[330px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-700 uppercase tracking-[0.2em]">Available Tracks</p>
                <p className="text-sm text-slate-500">{tracks.length} tracks loaded</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                {loading ? 'Refreshing…' : 'Live' }
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {tracks.length === 0 ? (
                <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500">
                  No discipleship tracks exist yet. Click New Track to add one.
                </div>
              ) : (
                tracks.map((track) => {
                  const isActive = track.id === selectedId
                  return (
                    <button
                      key={track.id}
                      type="button"
                      onClick={() => selectTrack(track)}
                      className={`w-full text-left rounded-3xl border px-4 py-4 transition ${
                        isActive
                          ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{track.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{track.subtitle}</p>
                        </div>
                        <span className="text-2xl">{track.icon || '🌱'}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2 py-1">{track.level}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1">{track.weeks} weeks</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1">{track.modules?.length || 0} modules</span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 rounded-3xl bg-slate-50 p-4">
              <ClipboardList className="h-5 w-5 text-slate-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Quick tips</p>
                <p className="text-sm text-slate-500">Select a track to edit it, or create a new track and add modules.</p>
              </div>
            </div>
          </div>
        </section>

        <section ref={detailRef} className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm text-slate-500">Track details</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{selectedTrack ? selectedTrack.title : 'Create new discipleship track'}</h2>
              </div>
              {selectedTrack && (
                <button
                  type="button"
                  onClick={handleDeleteTrack}
                  className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
                >
                  <Trash2 size={16} /> Delete Track
                </button>
              )}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={trackForm.title}
                  onChange={(e) => handleTrackChange('title', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  placeholder="Foundations of Faith"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Subtitle</span>
                <input
                  value={trackForm.subtitle}
                  onChange={(e) => handleTrackChange('subtitle', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  placeholder="The Starting Place"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Level</span>
                <select
                  value={trackForm.level}
                  onChange={(e) => handleTrackChange('level', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Weeks</span>
                <input
                  type="number"
                  min={1}
                  value={trackForm.weeks}
                  onChange={(e) => handleTrackChange('weeks', Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                />
              </label>
            </div>

            <label className="space-y-2 mt-4">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={trackForm.description}
                onChange={(e) => handleTrackChange('description', e.target.value)}
                rows={4}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                placeholder="Describe the discipleship track"
              />
            </label>

            <div className="grid gap-4 lg:grid-cols-2 mt-4">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Verse</span>
                <input
                  value={trackForm.verse}
                  onChange={(e) => handleTrackChange('verse', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  placeholder="As newborn babes..."
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Verse Reference</span>
                <input
                  value={trackForm.verse_reference}
                  onChange={(e) => handleTrackChange('verse_reference', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                  placeholder="1 Peter 2:2"
                />
              </label>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row items-center justify-between mt-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">Accent color</p>
                <input
                  type="color"
                  value={trackForm.accent}
                  onChange={(e) => handleTrackChange('accent', e.target.value)}
                  className="h-12 w-20 rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <button
                type="button"
                onClick={selectedTrack ? handleUpdateTrack : handleCreateTrack}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-white font-semibold shadow-lg shadow-indigo-200/40 hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {selectedTrack ? <Pencil size={18} /> : <Plus size={18} />}
                {selectedTrack ? 'Update Track' : 'Create Track'}
              </button>
            </div>

            {(message || error) && (
              <div className={`mt-4 rounded-2xl px-4 py-3 ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                {error || message}
              </div>
            )}
          </div>

          {selectedTrack && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Modules</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">{selectedTrack.modules?.length || 0} items</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModuleForm(initialModuleForm)}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-slate-700 hover:bg-slate-200 transition"
                >
                  <Plus size={16} /> New Module
                </button>
              </div>

              <div className="grid gap-4 mt-6 xl:grid-cols-[1fr_320px]">
                <div className="space-y-4">
                  {selectedTrack.modules?.length ? (
                    selectedTrack.modules
                      .sort((a, b) => a.order - b.order)
                      .map((module) => (
                        <div key={module.id} className="rounded-3xl border border-slate-200 p-4 hover:shadow transition">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-lg font-semibold text-slate-900">{module.title}</p>
                              <p className="mt-1 text-sm text-slate-500">{module.module_type} • {module.duration}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-slate-500">Order {module.order}</p>
                              <div className="mt-2 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleModuleToggle(module, 'completed')}
                                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${module.completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                >
                                  <CheckCircle2 size={14} />
                                  {module.completed ? 'Completed' : 'Mark done'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleModuleToggle(module, 'locked')}
                                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${module.locked ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                                >
                                  <Lock size={14} />
                                  {module.locked ? 'Locked' : 'Unlock'}
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{module.completed ? 'Completed' : 'Pending'}</span>
                            <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">{module.locked ? 'Locked' : 'Unlocked'}</span>
                          </div>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => setModuleForm({
                                title: module.title,
                                module_type: module.module_type,
                                duration: module.duration,
                                order: module.order,
                                completed: module.completed,
                                locked: module.locked,
                                id: module.id,
                              })}
                              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700 hover:bg-slate-200 transition"
                            >
                              <Pencil size={16} /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteModule(module)}
                              className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100 transition"
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="rounded-3xl border border-slate-200 p-8 text-center text-slate-500">
                      No modules yet. Add one to support this track.
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
                  <div className="flex items-center gap-3 text-slate-900">
                    <ArrowRightCircle size={20} />
                    <h3 className="text-lg font-semibold">Add / edit module</h3>
                  </div>

                  <div className="mt-6 space-y-4">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Title</span>
                      <input
                        value={moduleForm.title}
                        onChange={(e) => handleModuleChange('title', e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                        placeholder="Who Is God?"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Type</span>
                      <select
                        value={moduleForm.module_type}
                        onChange={(e) => handleModuleChange('module_type', e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                      >
                        <option value="reading">Reading</option>
                        <option value="teaching">Teaching</option>
                        <option value="workshop">Workshop</option>
                      </select>
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Duration</span>
                      <input
                        value={moduleForm.duration}
                        onChange={(e) => handleModuleChange('duration', e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                        placeholder="45 min"
                      />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Order</span>
                      <input
                        type="number"
                        min={1}
                        value={moduleForm.order}
                        onChange={(e) => handleModuleChange('order', Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20"
                      />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <input
                          type="checkbox"
                          checked={moduleForm.completed}
                          onChange={(e) => handleModuleChange('completed', e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                        <span className="text-sm text-slate-700">Completed</span>
                      </label>
                      <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <input
                          type="checkbox"
                          checked={moduleForm.locked}
                          onChange={(e) => handleModuleChange('locked', e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-indigo-600"
                        />
                        <span className="text-sm text-slate-700">Locked</span>
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleSaveModule}
                      disabled={!selectedTrack || saving}
                      className="w-full rounded-full bg-indigo-600 px-5 py-3 text-white font-semibold shadow-lg shadow-indigo-200/30 hover:bg-indigo-700 transition disabled:opacity-60"
                    >
                      {moduleForm.id ? 'Save Module' : 'Add Module'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
