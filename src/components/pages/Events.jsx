import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Clock4,
  Tag,
  Pencil,
  Trash2,
  Sparkles,
  Speaker,
  CheckCircle2,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const EVENTS_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/events/'
const TAGS_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/tags/'

const initialEventForm = {
  title: '',
  event_type: 'Conference',
  event_date: '',
  start_time: '09:00',
  end_time: '18:00',
  location: '',
  format: 'Hybrid',
  capacity: 100,
  description: '',
  speakersInput: '',
  featured: false,
  registration_open: true,
  tag_ids: [],
  accent: '#c8927a',
  gradient: 'linear-gradient(145deg, #c8927a, #b8775a)',
  accent_gradient: 'linear-gradient(135deg, #c8927a 0%, #b8775a 100%)',
}

const generateGradients = (accentColor) => {
  // Lighten the accent color for the gradient end
  const lightenColor = (hex) => {
    const num = parseInt(hex.replace('#', ''), 16)
    const r = Math.min(255, (num >> 16) + 30)
    const g = Math.min(255, ((num >> 8) & 0x00ff) + 30)
    const b = Math.min(255, (num & 0x0000ff) + 30)
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  const lighterColor = lightenColor(accentColor)
  const darkerColor = accentColor

  return {
    gradient: `linear-gradient(145deg, ${accentColor}, ${lighterColor})`,
    accent_gradient: `linear-gradient(135deg, ${accentColor} 0%, ${lighterColor} 100%)`,
  }
}

export const Events = () => {
  const { tokens } = useAuth()
  const [events, setEvents] = useState([])
  const [tags, setTags] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [eventForm, setEventForm] = useState(initialEventForm)
  const [newTagName, setNewTagName] = useState('')
  const [newTags, setNewTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const detailRef = useRef(null)

  const authHeader = tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}

  const fetchTags = async () => {
    try {
      const response = await fetch(TAGS_API, { headers: authHeader })
      if (!response.ok) throw new Error('Unable to load tags.')
      const result = await response.json()
      setTags(result.data?.results ?? [])
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await fetch(EVENTS_API, { headers: authHeader })
      if (!response.ok) throw new Error('Unable to load events.')
      const result = await response.json()
      const fetchedEvents = result.data?.results ?? []
      setEvents(fetchedEvents)
      setSelectedEvent((current) => current ?? fetchedEvents[0] ?? null)
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    if (!tokens?.access) return

    const loadPage = async () => {
      setLoading(true)
      setError('')
      await Promise.all([fetchEvents(), fetchTags()])
      setLoading(false)
    }

    loadPage()
  }, [tokens?.access])

  useEffect(() => {
    if (!selectedEvent) return
    setEventForm({
      title: selectedEvent.title || '',
      event_type: selectedEvent.event_type || 'Conference',
      event_date: selectedEvent.event_date || '',
      start_time: selectedEvent.start_time || '09:00:00',
      end_time: selectedEvent.end_time || '18:00:00',
      location: selectedEvent.location || '',
      format: selectedEvent.format || 'Hybrid',
      capacity: selectedEvent.capacity || 100,
      description: selectedEvent.description || '',
      speakersInput: (selectedEvent.speakers || []).join(', '),
      featured: selectedEvent.featured ?? false,
      registration_open: selectedEvent.registration_open ?? true,
      tag_ids: selectedEvent.tags?.map((tag) => tag.id) ?? [],
      accent: selectedEvent.accent || '#c8927a',
      gradient: selectedEvent.gradient || 'linear-gradient(145deg, #c8927a, #b8775a)',
      accent_gradient: selectedEvent.accent_gradient || 'linear-gradient(135deg, #c8927a 0%, #b8775a 100%)',
    })
    detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedEvent])

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return events
    return events.filter((event) => {
      const text = `${event.title} ${event.description} ${event.location} ${event.tags?.map((tag) => tag.name).join(' ')}`.toLowerCase()
      return text.includes(query)
    })
  }, [events, search])

  const resetForm = () => {
    setSelectedEvent(null)
    setEventForm(initialEventForm)
    setNewTags([])
    setNewTagName('')
    setFeedback('')
    setError('')
  }

  const updateField = (field, value) => {
    setEventForm((prev) => {
      const updated = { ...prev, [field]: value }
      // Auto-generate gradients when accent color changes
      if (field === 'accent') {
        const { gradient, accent_gradient } = generateGradients(value)
        updated.gradient = gradient
        updated.accent_gradient = accent_gradient
      }
      return updated
    })
  }

  const toggleTag = (tagId) => {
    setEventForm((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(tagId) ? prev.tag_ids.filter((id) => id !== tagId) : [...prev.tag_ids, tagId],
    }))
  }

  const addNewTag = () => {
    const trimmed = newTagName.trim()
    if (!trimmed) return
    if (newTags.includes(trimmed)) return
    setNewTags((prev) => [...prev, trimmed])
    setNewTagName('')
  }

  const removeNewTag = (index) => {
    setNewTags((prev) => prev.filter((_, idx) => idx !== index))
  }

  const createNewTags = async () => {
    if (newTags.length === 0) return []
    const createdIds = []
    for (const name of newTags) {
      const response = await fetch(TAGS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({ name }),
      })
      if (!response.ok) {
        throw new Error(`Unable to create tag ${name}.`)
      }
      const result = await response.json()
      createdIds.push(result.data?.id ?? result.id)
    }
    return createdIds
  }

  const handleSaveEvent = async () => {
    if (!eventForm.title.trim() || !eventForm.event_date || !eventForm.start_time || !eventForm.end_time) {
      setError('Title, date, start time, and end time are required.')
      return
    }
    setSaving(true)
    setError('')
    setFeedback('')

    try {
      const createdTagIds = await createNewTags()
      const tagIds = [...eventForm.tag_ids, ...createdTagIds]

      // Format times to HH:MM:SS if they're only HH:MM
      const formatTime = (time) => {
        if (time.length === 5) return `${time}:00`
        return time
      }

      const payload = {
        title: eventForm.title,
        event_type: eventForm.event_type,
        event_date: eventForm.event_date,
        start_time: formatTime(eventForm.start_time),
        end_time: formatTime(eventForm.end_time),
        location: eventForm.location,
        format: eventForm.format,
        capacity: Number(eventForm.capacity),
        description: eventForm.description,
        speakers: eventForm.speakersInput.split(',').map((speaker) => speaker.trim()).filter(Boolean),
        featured: eventForm.featured,
        registration_open: eventForm.registration_open,
        accent: eventForm.accent,
        gradient: eventForm.gradient,
        accent_gradient: eventForm.accent_gradient,
        tag_ids: tagIds,
      }
      console.log("Payload: ", JSON.stringify(payload))
      const isEdit = Boolean(selectedEvent?.id)
      const url = isEdit ? `${EVENTS_API}${selectedEvent.id}/` : EVENTS_API
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
        console.error('API Error:', errorData)
        throw new Error(isEdit ? 'Unable to update event.' : 'Unable to create event.')
      }

      const result = await response.json()
      const savedEvent = result.data ?? result
      setFeedback(isEdit ? 'Event updated successfully.' : 'Event created successfully.')
      setNewTags([])
      await Promise.all([fetchTags(), fetchEvents()])
      setSelectedEvent(savedEvent)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEvent = async (eventId) => {
    const confirmed = window.confirm('Delete this event permanently? This action cannot be undone.')
    if (!confirmed) return
    setDeleting(true)
    setError('')
    setFeedback('')
    try {
      const response = await fetch(`${EVENTS_API}${eventId}/`, {
        method: 'DELETE',
        headers: authHeader,
      })
      if (!response.ok) {
        throw new Error('Unable to delete event.')
      }
      setFeedback('Event deleted successfully.')
      await fetchEvents()
      setSelectedEvent(null)
      setEventForm(initialEventForm)
    } catch (err) {
      setError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const selectEvent = (event) => {
    setSelectedEvent(event)
  }

  return (
    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } }} initial="hidden" animate="visible" className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Events</h1>
          <p className="text-slate-600 mt-2">Create, view, and manage events with speaker and tag support.</p>
        </div>
        <button
          type="button"
          onClick={resetForm}
          className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-5 py-3 text-white font-semibold shadow-lg shadow-pink-200/40 hover:bg-pink-700 transition"
        >
          <Plus size={18} /> New Event
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Event roster</p>
                <p className="text-sm text-slate-500">{events.length} events available</p>
              </div>
              <span className="inline-flex rounded-full bg-pink-100 px-3 py-1 text-sm font-semibold text-pink-700">Live</span>
            </div>
            <div className="mt-5 space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search events..."
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-12 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                />
              </div>
              {loading ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">Loading events…</div>
              ) : events.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">No events found. Click New Event to add one.</div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((event) => {
                    const isActive = selectedEvent?.id === event.id
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => selectEvent(event)}
                        className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                          isActive ? 'border-pink-300 bg-pink-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-lg font-semibold text-slate-900">{event.title}</p>
                            <p className="mt-1 text-sm text-slate-500">{event.event_type} • {event.format}</p>
                          </div>
                          <span className="text-sm font-semibold text-slate-700">{event.event_date}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
                          <span className="rounded-full bg-slate-100 px-2 py-1">{event.location}</span>
                          <span className="rounded-full bg-slate-100 px-2 py-1">{event.capacity} seats</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 rounded-3xl bg-pink-50 p-4">
              <Sparkles className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Event workflow</p>
                <p className="text-sm text-slate-500">Choose an event, edit its details, or quickly add a new one.</p>
              </div>
            </div>
          </div>
        </section>

        <section ref={detailRef} className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Event manager</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-900">{selectedEvent ? 'Edit event' : 'Create event'}</h2>
              </div>
              {selectedEvent && (
                <button
                  type="button"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                >
                  <Trash2 size={16} /> Delete
                </button>
              )}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Title</span>
                <input
                  value={eventForm.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                  placeholder="Bold Faith Conference 2026"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Type</span>
                <input
                  value={eventForm.event_type}
                  onChange={(e) => updateField('event_type', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                  placeholder="Conference"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Date</span>
                <input
                  type="date"
                  value={eventForm.event_date}
                  onChange={(e) => updateField('event_date', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Location</span>
                <input
                  value={eventForm.location}
                  onChange={(e) => updateField('location', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                  placeholder="Online & Yaoundé, Cameroon"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Format</span>
                <input
                  value={eventForm.format}
                  onChange={(e) => updateField('format', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                  placeholder="Hybrid"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Start time</span>
                <input
                  type="time"
                  value={eventForm.start_time}
                  onChange={(e) => updateField('start_time', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">End time</span>
                <input
                  type="time"
                  value={eventForm.end_time}
                  onChange={(e) => updateField('end_time', e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Capacity</span>
                <input
                  type="number"
                  min={1}
                  value={eventForm.capacity}
                  onChange={(e) => updateField('capacity', Number(e.target.value))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Accent Color</span>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={eventForm.accent}
                    onChange={(e) => updateField('accent', e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-2xl border border-slate-200"
                  />
                  <input
                    type="text"
                    value={eventForm.accent}
                    onChange={(e) => updateField('accent', e.target.value)}
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                    placeholder="#c8927a"
                  />
                </div>
              </label>
            </div>

            <label className="space-y-2 mt-4">
              <span className="text-sm font-medium text-slate-700">Description</span>
              <textarea
                value={eventForm.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={5}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                placeholder="Describe the event and what attendees can expect."
              />
            </label>

            <label className="space-y-2 mt-4">
              <span className="text-sm font-medium text-slate-700">Speakers</span>
              <input
                value={eventForm.speakersInput}
                onChange={(e) => updateField('speakersInput', e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                placeholder="Separate names with commas"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2 mt-4">
              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventForm.featured}
                  onChange={(e) => updateField('featured', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-pink-600"
                />
                <span className="text-sm text-slate-700">Featured event</span>
              </label>
              <label className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={eventForm.registration_open}
                  onChange={(e) => updateField('registration_open', e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-pink-600"
                />
                <span className="text-sm text-slate-700">Registration open</span>
              </label>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-2">Existing tags</p>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const active = eventForm.tag_ids.includes(tag.id)
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleTag(tag.id)}
                        className={`rounded-full px-3 py-2 text-sm transition ${active ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        {tag.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Add new tags</p>
                  <div className="flex gap-2">
                    <input
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-400/20"
                      placeholder="New tag name"
                    />
                    <button
                      type="button"
                      onClick={addNewTag}
                      className="rounded-2xl bg-pink-600 px-4 py-3 text-white font-semibold hover:bg-pink-700 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {newTags.map((tag, index) => (
                    <span key={index} className="inline-flex items-center gap-2 rounded-full bg-pink-100 px-3 py-2 text-sm text-pink-700">
                      {tag}
                      <button type="button" onClick={() => removeNewTag(index)} className="text-pink-700/80 hover:text-pink-900">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-500">Use tags to categorize events and make them easy to discover.</p>
              <button
                type="button"
                onClick={handleSaveEvent}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-full bg-pink-600 px-6 py-3 text-white font-semibold shadow-lg shadow-pink-200/40 hover:bg-pink-700 transition disabled:opacity-60"
              >
                <Plus size={18} /> {selectedEvent ? 'Save changes' : 'Create Event'}
              </button>
            </div>

            {(error || feedback) && (
              <div className={`mt-4 rounded-3xl border px-4 py-3 text-sm ${error ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
                {error || feedback}
              </div>
            )}
          </div>
        </section>
      </div>
    </motion.div>
  )
}
