import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Heart, Tag, Plus, Globe, Paperclip, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const REQUESTS_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/prayer-requests/'
const CATEGORIES_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/prayer-categories/'

const initialRequestForm = {
  name: '',
  location: '',
  category_id: '',
  text: '',
  anonymous: false,
  answered: false,
}

export const Players = () => {
  const { tokens } = useAuth()
  const [requests, setRequests] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [requestForm, setRequestForm] = useState(initialRequestForm)
  const [categoryName, setCategoryName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [search, setSearch] = useState('')
  const detailRef = useRef(null)

  const authHeader = tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}

  const fetchCategories = async () => {
    try {
      const response = await fetch(CATEGORIES_API, { headers: authHeader })
      if (!response.ok) throw new Error('Unable to load categories.')
      const result = await response.json()
      setCategories(result.data?.results ?? [])
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchRequests = async () => {
    try {
      const response = await fetch(REQUESTS_API, { headers: authHeader })
      if (!response.ok) throw new Error('Unable to load prayer requests.')
      const result = await response.json()
      const data = result.data?.results ?? []
      setRequests(data)
      setSelectedRequest((current) => current ?? data[0] ?? null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (!tokens?.access) return
    const load = async () => {
      setLoading(true)
      setError('')
      await Promise.all([fetchRequests(), fetchCategories()])
      setLoading(false)
    }
    load()
  }, [tokens?.access])

  useEffect(() => {
    if (!selectedRequest) return
    setRequestForm({
      name: selectedRequest.anonymous ? 'Anonymous' : selectedRequest.name,
      location: selectedRequest.location || '',
      category_id: selectedRequest.category?.id || '',
      text: selectedRequest.text || '',
      anonymous: selectedRequest.anonymous ?? false,
      answered: selectedRequest.answered ?? false,
    })
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedRequest])

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return requests
    return requests.filter((request) => {
      const categoryName = request.category?.name || ''
      return [request.name, request.location, request.text, categoryName]
        .join(' ')
        .toLowerCase()
        .includes(query)
    })
  }, [requests, search])

  const updateForm = (field, value) => {
    setRequestForm((prev) => ({ ...prev, [field]: value }))
  }

  const resetForm = () => {
    setSelectedRequest(null)
    setRequestForm(initialRequestForm)
    setCategoryName('')
    setFeedback('')
    setError('')
  }

  const createCategory = async () => {
    const trimmed = categoryName.trim()
    if (!trimmed) return null
    const response = await fetch(CATEGORIES_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader,
      },
      body: JSON.stringify({ name: trimmed }),
    })
    if (!response.ok) {
      throw new Error('Unable to create category.')
    }
    const result = await response.json()
    return result.data?.id ?? result.id
  }

  const handleSaveRequest = async () => {
    if (!requestForm.text.trim() || (!requestForm.anonymous && !requestForm.name.trim())) {
      setError('Please enter requester name or mark as anonymous, and add a request text.')
      return
    }

    if (!requestForm.category_id && !categoryName.trim()) {
      setError('Please select or create a prayer category.')
      return
    }

    setSaving(true)
    setError('')
    setFeedback('')

    try {
      const categoryId = requestForm.category_id || (await createCategory())
      await fetchCategories()
      if (!categoryId) throw new Error('Failed to resolve category.')

      const payload = {
        name: requestForm.anonymous ? 'Anonymous' : requestForm.name,
        location: requestForm.location,
        category_id: categoryId,
        text: requestForm.text,
        anonymous: requestForm.anonymous,
        answered: requestForm.answered,
      }

      const response = await fetch(REQUESTS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Prayer request API error', errorData)
        throw new Error('Unable to create prayer request.')
      }

      await response.json()
      setFeedback('Prayer request saved successfully.')
      resetForm()
      await fetchRequests()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteRequest = async () => {
    if (!selectedRequest?.id) return

    const confirmed = window.confirm('Delete this prayer request? This action cannot be undone.')
    if (!confirmed) return

    setSaving(true)
    setError('')
    setFeedback('')

    try {
      const response = await fetch(`${REQUESTS_API}${selectedRequest.id}/`, {
        method: 'DELETE',
        headers: authHeader,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const message = errorData.detail || 'Unable to delete prayer request.'
        throw new Error(message)
      }

      setFeedback('Prayer request deleted successfully.')
      resetForm()
      await fetchRequests()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Prayer Requests</h1>
          <p className="text-slate-600 mt-2">View incoming prayer requests and add new requests or categories.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-5 py-3 text-white font-semibold shadow-lg shadow-orange-200/40 hover:bg-orange-700 transition"
        >
          <Plus size={18} /> New Request
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Prayer requests</p>
                <p className="text-sm text-slate-500">{requests.length} total</p>
              </div>
              <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                {loading ? 'Refreshing…' : 'Live'}
              </span>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search requests..."
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-12 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
              />
            </div>

            {error && (
              <div className="rounded-3xl bg-rose-50 border border-rose-200 p-4 text-sm text-rose-700 mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">Loading prayer requests…</div>
            ) : requests.length === 0 ? (
              <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">No prayer requests have been submitted yet.</div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-360px)] overflow-y-auto">
                {filteredRequests.map((request) => {
                  const isActive = selectedRequest?.id === request.id
                  return (
                    <button
                      key={request.id}
                      type="button"
                      onClick={() => setSelectedRequest(request)}
                      className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                        isActive ? 'border-orange-300 bg-orange-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{request.anonymous ? 'Anonymous' : request.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{request.category?.name ?? 'Uncategorized'}</p>
                        </div>
                        <span className="text-sm font-semibold text-slate-700">{request.created_at ? new Date(request.created_at).toLocaleDateString() : ''}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                        {request.location && <span className="rounded-full bg-slate-100 px-2 py-1">{request.location}</span>}
                        <span className="rounded-full bg-slate-100 px-2 py-1">{request.prayed_count ?? 0} prayed</span>
                        <span className="rounded-full bg-slate-100 px-2 py-1">{request.answered ? 'Answered' : 'Pending'}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 rounded-3xl bg-orange-50 p-4">
              <Heart className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Prayer care</p>
                <p className="text-sm text-slate-500">Review requests, categorize them, and add new prayer items.</p>
              </div>
            </div>
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
                <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Prayer request</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{selectedRequest ? 'Request detail' : 'Create a new request'}</h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                <Paperclip /> {selectedRequest ? 'Edit or reply' : 'New submission'}
              </div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {!requestForm.anonymous && (
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Name</span>
                  <input
                    value={requestForm.name}
                    onChange={(e) => updateForm('name', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                    placeholder="Ama K."
                  />
                </label>
              )}

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Location</span>
                <input
                  value={requestForm.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Accra, Ghana"
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Prayer category</span>
                <select
                  value={requestForm.category_id}
                  onChange={(e) => updateForm('category_id', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">New category</span>
                <div className="flex gap-2">
                  <input
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                    placeholder="Create Protection, Healing, etc."
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const id = await createCategory()
                        if (id) {
                          setRequestForm((prev) => ({ ...prev, category_id: id }))
                          setCategoryName('')
                          await fetchCategories()
                        }
                      } catch (err) {
                        setError(err.message)
                      }
                    }}
                    className="rounded-2xl bg-orange-600 px-4 py-3 text-white font-semibold hover:bg-orange-700 transition"
                  >
                    Add
                  </button>
                </div>
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-slate-700">Request details</span>
                <textarea
                  value={requestForm.text}
                  onChange={(e) => updateForm('text', e.target.value)}
                  rows={6}
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                  placeholder="Please pray for..."
                />
              </label>

              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                <input
                  type="checkbox"
                  checked={requestForm.anonymous}
                  onChange={(e) => updateForm('anonymous', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600"
                />
                Anonymous request
              </label>
              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-700">
                <input
                  type="checkbox"
                  checked={requestForm.answered}
                  onChange={(e) => updateForm('answered', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-orange-600"
                />
                Mark as answered
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-500">Use categories to keep requests organized.</div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {selectedRequest && (
                  <button
                    type="button"
                    onClick={handleDeleteRequest}
                    disabled={saving}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 shadow-sm hover:border-rose-300 hover:bg-rose-100 transition disabled:opacity-60"
                  >
                    Delete request
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSaveRequest}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-white font-semibold shadow-lg shadow-orange-200/40 hover:bg-orange-700 transition disabled:opacity-60"
                >
                  <Plus size={18} /> Submit request
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
