import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, Mail, Phone, Heart, MapPin, Calendar, Info } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const MEMBERS_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/join-us/'

export const Members = () => {
  const { tokens } = useAuth()
  const [members, setMembers] = useState([])
  const [selectedMember, setSelectedMember] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const detailRef = useRef(null)

  const authHeader = tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}

  const fetchMembers = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(MEMBERS_API, { headers: authHeader })
      if (!response.ok) throw new Error('Could not load members.')
      const result = await response.json()
      const fetchedMembers = result.data?.results ?? result.results ?? result
      setMembers(Array.isArray(fetchedMembers) ? fetchedMembers : [])
      if (Array.isArray(fetchedMembers) && fetchedMembers.length > 0) {
        setSelectedMember(fetchedMembers[0])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tokens?.access) fetchMembers()
  }, [tokens?.access])

  useEffect(() => {
    if (selectedMember) {
      detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedMember])

  const filteredMembers = useMemo(() => {
    if (!search.trim()) return members
    const query = search.toLowerCase()
    return members.filter((member) => {
      const text = `${member.first_name || ''} ${member.last_name || ''} ${member.email || ''} ${member.phone || ''} ${member.location || ''}`.toLowerCase()
      return text.includes(query)
    })
  }, [members, search])

  const handleSelectMember = (member) => {
    setSelectedMember(member)
  }

  if (!tokens?.access) {
    return (
      <div className="p-10 rounded-3xl bg-white shadow-lg text-center">
        <p className="text-slate-700">You need to sign in to manage members.</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ staggerChildren: 0.1 }} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Members</h1>
          <p className="text-slate-600 mt-2">View and manage all community members who have joined.</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Members List */}
        <section className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Members</p>
                <p className="text-sm text-slate-500">{members.length} members total</p>
              </div>
              <span className="inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                {loading ? 'Loading…' : 'Live'}
              </span>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Search members..."
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-12 py-3 text-slate-900 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-400/20"
                />
              </div>

              {error && (
                <div className="rounded-3xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">
                  Loading members…
                </div>
              ) : members.length === 0 ? (
                <div className="rounded-3xl bg-slate-50 p-6 text-center text-slate-500">
                  No members found.
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
                  {filteredMembers.map((member) => {
                    const isActive = selectedMember?.id === member.id
                    const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim() || 'Member'
                    const initials = fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()

                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleSelectMember(member)}
                        className={`w-full rounded-3xl border px-4 py-4 text-left transition ${
                          isActive
                            ? 'border-orange-300 bg-orange-50 shadow-sm'
                            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-300 text-sm font-bold text-orange-900 flex-shrink-0">
                            {initials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{fullName}</p>
                            <p className="mt-1 text-sm text-slate-500 truncate">{member.email}</p>
                            {member.location && (
                              <p className="mt-1 text-xs text-slate-400 truncate flex items-center gap-1">
                                <MapPin size={12} /> {member.location}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 rounded-3xl bg-orange-50 p-4">
              <Info className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm font-semibold text-slate-900">Member directory</p>
                <p className="text-sm text-slate-500">Select a member to view their details.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Member Details */}
        <section ref={detailRef} className="space-y-4">
          {selectedMember ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-200 to-orange-300 text-2xl font-bold text-orange-900">
                  {`${(selectedMember.first_name || '')[0]}${(selectedMember.last_name || '')[0]}`.toUpperCase()}
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">
                    {`${selectedMember.first_name || ''} ${selectedMember.last_name || ''}`.trim() || 'Member'}
                  </h2>
                  <p className="mt-1 text-slate-600">{selectedMember.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                {selectedMember.email && (
                  <div className="rounded-2xl bg-slate-50 p-4 flex items-start gap-3">
                    <Mail className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Email</p>
                      <a href={`mailto:${selectedMember.email}`} className="font-semibold text-slate-900 hover:text-orange-600 transition break-all">
                        {selectedMember.email}
                      </a>
                    </div>
                  </div>
                )}

                {selectedMember.phone && (
                  <div className="rounded-2xl bg-slate-50 p-4 flex items-start gap-3">
                    <Phone className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Phone</p>
                      <a href={`tel:${selectedMember.phone}`} className="font-semibold text-slate-900 hover:text-orange-600 transition">
                        {selectedMember.phone}
                      </a>
                    </div>
                  </div>
                )}

                {selectedMember.location && (
                  <div className="rounded-2xl bg-slate-50 p-4 flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Location</p>
                      <p className="font-semibold text-slate-900">{selectedMember.location}</p>
                    </div>
                  </div>
                )}

                {selectedMember.passion_point && (
                  <div className="rounded-2xl bg-slate-50 p-4 flex items-start gap-3">
                    <Heart className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Passion Point</p>
                      <p className="font-semibold text-slate-900">{selectedMember.passion_point}</p>
                    </div>
                  </div>
                )}

                {selectedMember.how_did_you_hear && (
                  <div className="rounded-2xl bg-slate-50 p-4 flex items-start gap-3">
                    <Users className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">How did you hear?</p>
                      <p className="font-semibold text-slate-900">{selectedMember.how_did_you_hear}</p>
                    </div>
                  </div>
                )}

                {selectedMember.created_at && (
                  <div className="rounded-2xl bg-slate-50 p-4 flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-slate-600">Joined</p>
                      <p className="font-semibold text-slate-900">
                        {new Date(selectedMember.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Additional fields if available */}
              {(selectedMember.is_active !== undefined || selectedMember.is_verified !== undefined) && (
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {selectedMember.is_active !== undefined && (
                    <div className="rounded-2xl border border-slate-200 p-4 text-center">
                      <p className="text-sm text-slate-600 mb-2">Status</p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          selectedMember.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {selectedMember.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  )}
                  {selectedMember.is_verified !== undefined && (
                    <div className="rounded-2xl border border-slate-200 p-4 text-center">
                      <p className="text-sm text-slate-600 mb-2">Verification</p>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                          selectedMember.is_verified
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {selectedMember.is_verified ? 'Verified' : 'Pending'}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ) : (
            <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
              <p className="text-slate-700 font-semibold">Select a member to view details</p>
            </div>
          )}
        </section>
      </div>
    </motion.div>
  )
}
