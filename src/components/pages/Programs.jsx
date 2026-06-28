import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, Zap, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const PROGRAMS_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/programs/'

const initialProgramForm = {
  title: '',
  description: '',
  organizer: '',
  start_date: '',
  end_date: '',
  location: '',
  is_active: true,
}

export const Programs = () => {
  const { tokens } = useAuth()
  const [programs, setPrograms] = useState([])
  const [selectedProgram, setSelectedProgram] = useState(null)
  const [programForm, setProgramForm] = useState(initialProgramForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const detailRef = useRef(null)

  const authHeader = tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}

  const fetchPrograms = async () => {
    try {
      const response = await fetch(PROGRAMS_API, { headers: authHeader })
      if (!response.ok) throw new Error('Unable to load programs.')
      const result = await response.json()
      const loadedPrograms = result.data?.results ?? []
      setPrograms(loadedPrograms)
      setSelectedProgram((current) => current ?? loadedPrograms[0] ?? null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (!tokens?.access) return
    const load = async () => {
      setLoading(true)
      setError('')
      await fetchPrograms()
      setLoading(false)
    }
    load()
  }, [tokens?.access])

  useEffect(() => {
    if (!selectedProgram) return
    setProgramForm({
      title: selectedProgram.title || '',
      description: selectedProgram.description || '',
      organizer: selectedProgram.organizer || '',
      start_date: selectedProgram.start_date || '',
      end_date: selectedProgram.end_date || '',
      location: selectedProgram.location || '',
      is_active: selectedProgram.is_active ?? true,
    })
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedProgram])

  const filteredPrograms = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return programs
    return programs.filter((program) => {
      const text = `${program.title} ${program.description} ${program.organizer} ${program.location}`.toLowerCase()
      return text.includes(query)
    })
  }, [programs, search])

  const updateField = (field, value) => {
    setProgramForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setSelectedProgram(null)
    setProgramForm(initialProgramForm)
    setFeedback('')
    setError('')
  }

  const handleSaveProgram = async () => {
    if (!programForm.title.trim() || !programForm.start_date || !programForm.end_date) {
      setError('Title, start date, and end date are required.')
      return
    }

    setSaving(true)
    setError('')
    setFeedback('')

    try {
      const payload = {
        title: programForm.title,
        description: programForm.description,
        organizer: programForm.organizer,
        start_date: programForm.start_date,
        end_date: programForm.end_date,
        location: programForm.location,
        is_active: programForm.is_active,
      }

      const isEdit = Boolean(selectedProgram?.id)
      const url = isEdit ? `${PROGRAMS_API}${selectedProgram.id}/` : PROGRAMS_API
      const method = isEdit ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Programs API error', errorData)
        throw new Error(isEdit ? 'Unable to update program.' : 'Unable to create program.')
      }

      const result = await response.json()
      const savedProgram = result.data ?? result
      setFeedback(isEdit ? 'Program updated successfully.' : 'Program created successfully.')
      await fetchPrograms()
      setSelectedProgram(savedProgram)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProgram = async (programId) => {
    const confirmed = window.confirm('Delete this program permanently? This action cannot be undone.')
    if (!confirmed) return

    setDeleting(true)
    setError('')
    setFeedback('')

    try {
      const response = await fetch(`${PROGRAMS_API}${programId}/`, {
        method: 'DELETE',
        headers: authHeader,
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.detail || 'Unable to delete program.'
        throw new Error(message)
      }
      setFeedback('Program deleted successfully.')
      await fetchPrograms()
      setSelectedProgram(null)
      setProgramForm(initialProgramForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Programs</h1>
          <p className="text-slate-600 mt-2">Create, update, and delete programs for your community.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-full bg-yellow-600 px-5 py-3 text-white font-semibold shadow-lg shadow-yellow-200/40 hover:bg-yellow-700 transition"
        >
          <Plus size={18} /> New Program
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Programs</p>
                <p className="text-sm text-slate-500">{programs.length} total</p>
              </div>
              <span className="inline-flex rounded-full bg-yellow-100 px-3 py-1 text-sm font-semibold text-yellow-700">
                {loading ? 'Refreshing…' : 'Live'}
              </span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search programs..."
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-12 py-3 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
              />
            </div>

            {error && (
              <div className="rounded-3xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">Loading programs…</div>
            ) : programs.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">No programs available yet.</div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-340px)] overflow-y-auto">
                {filteredPrograms.map((program) => {
                  const isActive = selectedProgram?.id === program.id
                  return (
                    <button
                      key={program.id}
                      type="button"
                      onClick={() => setSelectedProgram(program)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                        isActive ? 'border-yellow-300 bg-yellow-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{program.title}</p>
                          <p className="mt-1 text-sm text-slate-500">{program.organizer || 'Organizer not set'}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">
                          {program.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        <span className="rounded-full bg-slate-100 px-2 py-1">{program.start_date}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1">{program.end_date}</span>
                        {program.location && <span className="rounded-full bg-slate-100 px-2 py-1">{program.location}</span>}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </section>

        <section ref={detailRef} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Program details</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{selectedProgram ? 'Edit program' : 'Create a new program'}</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                <Pencil /> {selectedProgram ? 'Update details' : 'New submission'}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={programForm.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="Faith-Based Leadership Workshop"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Start date</span>
                <input
                  type="date"
                  value={programForm.start_date}
                  onChange={(e) => updateField('start_date', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">End date</span>
                <input
                  type="date"
                  value={programForm.end_date}
                  onChange={(e) => updateField('end_date', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Organizer</span>
                <input
                  value={programForm.organizer}
                  onChange={(e) => updateField('organizer', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="Bold & Rooted Ministries"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Location</span>
                <input
                  value={programForm.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="Nairobi, Kenya"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Description</span>
                <textarea
                  value={programForm.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={5}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20"
                  placeholder="An intensive leadership workshop focused on servant leadership, discipleship, and effective ministry management."
                />
              </label>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={programForm.is_active}
                  onChange={(e) => updateField('is_active', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-yellow-600"
                />
                Active program
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Programs keep your community engaged and aligned.</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {selectedProgram && (
                  <button
                    type="button"
                    onClick={() => handleDeleteProgram(selectedProgram.id)}
                    disabled={deleting || saving}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 shadow-sm hover:border-rose-300 hover:bg-rose-100 transition disabled:opacity-60"
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveProgram}
                  disabled={saving || deleting}
                  className="inline-flex items-center gap-2 rounded-full bg-yellow-600 px-6 py-3 text-white font-semibold shadow-lg shadow-yellow-200/40 hover:bg-yellow-700 transition disabled:opacity-60"
                >
                  <Plus size={18} /> {selectedProgram ? 'Save Program' : 'Create Program'}
                </button>
              </div>
            </div>

            {(feedback || error) && (
              <div className={`mt-4 rounded-3xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {error || feedback}
              </div>
            )}
          </motion.div>
        </section>
      </div>
    </motion.div>
  )
}
