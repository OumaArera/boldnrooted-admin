import { useState, useEffect, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, FileText, PenTool, Trash2, Tag, BookOpen } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const BLOGS_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/blogs/'
const SCRIPTURES_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/scriptures/'
const TAGS_API = 'https://goalkeepers-backend-2.onrender.com/bold-n-rooted/api/v1/tags/'

export const Blogs = () => {
  const { tokens } = useAuth()
  const [blogs, setBlogs] = useState([])
  const [scriptures, setScriptures] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [selectedBlog, setSelectedBlog] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createFeedback, setCreateFeedback] = useState('')
  const [newTagName, setNewTagName] = useState('')
  const [newTags, setNewTags] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [selectedScriptureIds, setSelectedScriptureIds] = useState([])
  const [newScripture, setNewScripture] = useState({ book: '', chapter: '', verse_start: '', verse_end: '' })
  const [newScriptures, setNewScriptures] = useState([])
  const [createBlogData, setCreateBlogData] = useState({ title: '', content: '', is_published: true, is_active: true })

  const authHeader = tokens?.access ? { Authorization: `Bearer ${tokens.access}` } : {}

  const fetchBlogs = async () => {
    try {
      const response = await fetch(BLOGS_API, { headers: authHeader })
      if (!response.ok) throw new Error('Unable to fetch blogs. Please try again.')
      const result = await response.json()
      setBlogs(result.data?.results ?? [])
    } catch (err) {
      setError(err.message)
    }
  }

  const fetchScriptures = async () => {
    try {
      const response = await fetch(SCRIPTURES_API, { headers: authHeader })
      if (!response.ok) throw new Error('Unable to load scriptures.')
      const result = await response.json()
      setScriptures(result.data?.results ?? [])
    } catch (err) {
      setError(err.message)
    }
  }

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

  useEffect(() => {
    if (!tokens?.access) return

    const loadPage = async () => {
      setLoading(true)
      setError('')
      await Promise.all([fetchBlogs(), fetchScriptures(), fetchTags()])
      setLoading(false)
    }

    loadPage()
  }, [tokens?.access])

  const filteredBlogs = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return blogs
    return blogs.filter((blog) => {
      const text = `${blog.title} ${blog.content} ${blog.tags?.map((tag) => tag.name).join(' ')}`.toLowerCase()
      return text.includes(query)
    })
  }, [blogs, search])

  const selectedBlogRef = useRef(null)

  const openEditor = (blog) => {
    setSelectedBlog({
      ...blog,
      tag_ids: blog.tags?.map((tag) => tag.id) ?? [],
      scripture_reference_ids: blog.scripture_references?.map((reference) => reference.id) ?? [],
    })
    setFeedback('')
  }

  useEffect(() => {
    if (selectedBlogRef.current) {
      selectedBlogRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [selectedBlog])

  const closeEditor = () => setSelectedBlog(null)

  const updateField = (field, value) => {
    if (field.startsWith('new_')) {
      setCreateBlogData((prev) => ({ ...prev, [field.replace('new_', '')]: value }))
      return
    }
    setSelectedBlog((prev) => ({ ...prev, [field]: value }))
  }

  const toggleTagSelection = (tagId) => {
    setSelectedTagIds((prev) => (prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]))
  }

  const toggleScriptureSelection = (scriptureId) => {
    setSelectedScriptureIds((prev) => (prev.includes(scriptureId) ? prev.filter((id) => id !== scriptureId) : [...prev, scriptureId]))
  }

  const toggleEditTag = (tagId) => {
    if (!selectedBlog) return
    const hasTag = selectedBlog.tag_ids?.includes(tagId)
    setSelectedBlog((prev) => ({
      ...prev,
      tag_ids: hasTag ? prev.tag_ids.filter((id) => id !== tagId) : [...(prev.tag_ids ?? []), tagId],
    }))
  }

  const toggleEditScripture = (scriptureId) => {
    if (!selectedBlog) return
    const hasScripture = selectedBlog.scripture_reference_ids?.includes(scriptureId)
    setSelectedBlog((prev) => ({
      ...prev,
      scripture_reference_ids: hasScripture
        ? prev.scripture_reference_ids.filter((id) => id !== scriptureId)
        : [...(prev.scripture_reference_ids ?? []), scriptureId],
    }))
  }

  const handleSave = async () => {
    if (!selectedBlog) return
    setIsSaving(true)
    setFeedback('')

    try {
      const payload = {
        title: selectedBlog.title,
        content: selectedBlog.content,
        is_published: selectedBlog.is_published,
        is_active: selectedBlog.is_active,
        tag_ids: selectedBlog.tag_ids ?? [],
        scripture_reference_ids: selectedBlog.scripture_reference_ids ?? [],
      }

      const response = await fetch(`${BLOGS_API}${selectedBlog.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Unable to update blog. Please try again.')
      }

      const responseBody = await response.json()
      const updatedBlog = responseBody.data ?? responseBody
      setSelectedBlog({
        ...updatedBlog,
        tag_ids: updatedBlog.tags?.map((tag) => tag.id) ?? [],
        scripture_reference_ids: updatedBlog.scripture_references?.map((reference) => reference.id) ?? [],
      })
      setFeedback('Blog updated successfully.')
      await fetchBlogs()
    } catch (err) {
      setFeedback(err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (blogId) => {
    const confirmed = window.confirm('Delete this blog permanently? This action cannot be undone.')
    if (!confirmed) return

    setIsDeleting(true)
    setFeedback('')

    try {
      const response = await fetch(`${BLOGS_API}${blogId}/`, {
        method: 'DELETE',
        headers: authHeader,
      })

      if (!response.ok) {
        throw new Error('Unable to delete blog. Please try again.')
      }

      if (selectedBlog?.id === blogId) setSelectedBlog(null)
      setFeedback('Blog deleted successfully.')
      await fetchBlogs()
    } catch (err) {
      setFeedback(err.message)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleAddTag = () => {
    const trimmed = newTagName.trim()
    if (!trimmed) return
    if (newTags.includes(trimmed)) return
    setNewTags((prev) => [...prev, trimmed])
    setNewTagName('')
  }

  const removeNewTag = (index) => {
    setNewTags((prev) => prev.filter((_, idx) => idx !== index))
  }

  const handleAddScripture = () => {
    const trimmedBook = newScripture.book.trim()
    if (!trimmedBook || !newScripture.chapter || !newScripture.verse_start) return
    setNewScriptures((prev) => [...prev, { ...newScripture }])
    setNewScripture({ book: '', chapter: '', verse_start: '', verse_end: '' })
  }

  const removeNewScripture = (index) => {
    setNewScriptures((prev) => prev.filter((_, idx) => idx !== index))
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

  const createNewScriptures = async () => {
    if (newScriptures.length === 0) return []
    const createdIds = []
    for (const scripture of newScriptures) {
      const response = await fetch(SCRIPTURES_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify({
          book: scripture.book,
          chapter: Number(scripture.chapter),
          verse_start: Number(scripture.verse_start),
          verse_end: scripture.verse_end ? Number(scripture.verse_end) : null,
        }),
      })
      if (!response.ok) {
        throw new Error(`Unable to create scripture ${scripture.book}.`)
      }
      const result = await response.json()
      createdIds.push(result.data?.id ?? result.id)
    }
    return createdIds
  }

  const handleCreateBlog = async () => {
    setIsCreating(true)
    setCreateFeedback('')

    try {
      if (!createBlogData.title.trim() || !createBlogData.content.trim()) {
        throw new Error('Title and content are required to create a blog.')
      }

      const createdTagIds = await createNewTags()
      const createdScriptureIds = await createNewScriptures()
      const payload = {
        title: createBlogData.title,
        content: createBlogData.content,
        is_published: createBlogData.is_published,
        is_active: createBlogData.is_active,
        tag_ids: [...selectedTagIds, ...createdTagIds],
        scripture_reference_ids: [...selectedScriptureIds, ...createdScriptureIds],
      }

      const response = await fetch(BLOGS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeader,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Unable to create blog. Please try again.')
      }

      const result = await response.json()
      const createdBlog = result.data ?? result
      setCreateBlogData({ title: '', content: '', is_published: true, is_active: true })
      setSelectedTagIds([])
      setSelectedScriptureIds([])
      setNewTags([])
      setNewScriptures([])
      setCreateFeedback('Blog created successfully.')
      await Promise.all([fetchTags(), fetchScriptures(), fetchBlogs()])
      setSelectedBlog({
        ...createdBlog,
        tag_ids: createdBlog.tags?.map((tag) => tag.id) ?? [],
        scripture_reference_ids: createdBlog.scripture_references?.map((reference) => reference.id) ?? [],
      })
    } catch (err) {
      setCreateFeedback(err.message)
    } finally {
      setIsCreating(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Blogs</h1>
          <p className="text-slate-600 mt-2">Browse, update, and delete your Bold n Rooted blog posts.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateFeedback('Fill out the form below to create a blog.')}
          className="flex items-center gap-2 px-6 py-3 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition"
        >
          <Plus size={20} />
          Create Blog
        </button>
      </motion.div>

      <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Search blogs by title, content, or tags..."
                className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
              />
            </div>
            <div className="rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 shadow-sm">
              <p className="text-sm text-slate-500">Total blogs</p>
              <p className="text-2xl font-semibold text-slate-900">{blogs.length}</p>
            </div>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-200">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-400 border-t-transparent"></div>
              <p className="text-slate-600">Fetching blogs...</p>
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-red-50 border border-red-200 p-6 text-red-700">
              <p>{error}</p>
            </div>
          ) : filteredBlogs.length === 0 ? (
            <div className="rounded-3xl bg-white p-10 text-center shadow-sm border border-slate-200">
              <FileText className="mx-auto mb-4 h-12 w-12 text-blue-600" />
              <h3 className="text-xl font-semibold text-slate-900">No blogs found</h3>
              <p className="text-slate-500 mt-2">Check back once blogs are available or refine your search.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBlogs.map((blog) => (
                <div key={blog.id} className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Tag size={16} />
                        <span>{blog.tags?.map((tag) => tag.name).join(', ') || 'No tags'}</span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-500">
                          {new Date(blog.published_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <h2 className="text-2xl font-semibold text-slate-900">{blog.title}</h2>
                        <p className="mt-3 text-slate-600 max-h-20 overflow-hidden">{blog.content}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-3 sm:items-end">
                      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${blog.is_published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>
                        {blog.is_published ? 'Published' : 'Draft'}
                      </span>
                      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${blog.is_active ? 'bg-blue-100 text-blue-700' : 'bg-rose-100 text-rose-700'}`}>
                        {blog.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => openEditor(blog)}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                        >
                          <PenTool size={16} />
                          Update
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(blog.id)}
                          disabled={isDeleting}
                          className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl bg-linear-to-br from-blue-500 to-purple-500 p-6 text-white shadow-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-blue-100/80">Blog editor</p>
                <h2 className="mt-4 text-2xl font-semibold">Update posts in place</h2>
              </div>
              <BookOpen size={42} className="text-blue-200/80" />
            </div>
            <p className="mt-4 text-sm text-blue-100/80">
              Use the editor to adjust title, publish state, or deactivate content before publishing.
            </p>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm sticky top-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-slate-500 uppercase tracking-[0.2em]">Latest action</p>
                <p className="mt-2 text-slate-900 font-semibold">{feedback || 'Select a blog to edit or delete.'}</p>
              </div>
              {!feedback && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-600">Ready</span>}
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Blog details</h3>
            <p className="mt-2 text-sm text-slate-500">Select a blog from the list to edit the title, content, publish status, or active status.</p>
            {selectedBlog ? (
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                  <input
                    value={selectedBlog.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                  <textarea
                    value={selectedBlog.content}
                    onChange={(e) => updateField('content', e.target.value)}
                    rows={6}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBlog.is_published}
                      onChange={(e) => updateField('is_published', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Published</span>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedBlog.is_active}
                      onChange={(e) => updateField('is_active', e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">Active</span>
                  </label>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">Selected Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={() => toggleEditTag(tag.id)}
                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${selectedBlog.tag_ids?.includes(tag.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">Selected Scriptures</p>
                  <div className="space-y-2">
                    {scriptures.map((scripture) => {
                      const selected = selectedBlog.scripture_reference_ids?.includes(scripture.id)
                      return (
                        <button
                          type="button"
                          key={scripture.id}
                          onClick={() => toggleEditScripture(scripture.id)}
                          className={`w-full rounded-2xl px-4 py-3 text-left transition ${selected ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                        >
                          <span className="block font-semibold">{scripture.book} {scripture.chapter}:{scripture.verse_start}{scripture.verse_end ? `-${scripture.verse_end}` : ''}</span>
                          <span className="text-sm text-slate-400">ID: {scripture.id}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save changes'}
                  </button>
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Close editor
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-slate-500">
                Select a blog to view its details and update it from here.
              </div>
            )}
          </div>

          <div className="rounded-3xl bg-white border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Create a new blog</h3>
            <p className="mt-2 text-sm text-slate-500">Use existing scriptures and tags or add new ones while creating content.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Title</label>
                <input
                  value={createBlogData.title}
                  onChange={(e) => updateField('new_title', e.target.value)}
                  placeholder="Enter a blog title"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Content</label>
                <textarea
                  value={createBlogData.content}
                  onChange={(e) => updateField('new_content', e.target.value)}
                  rows={5}
                  placeholder="Write your blog content"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select existing tags</label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTagSelection(tag.id)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${selectedTagIds.includes(tag.id) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Add new tags</label>
                <div className="flex gap-2">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="New tag name"
                    className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {newTags.map((tag, index) => (
                    <span key={`${tag}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-700">
                      {tag}
                      <button type="button" onClick={() => removeNewTag(index)} className="text-blue-700/80 hover:text-blue-900">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Select existing scriptures</label>
                <div className="space-y-2 max-h-48 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3">
                  {scriptures.map((scripture) => (
                    <button
                      key={scripture.id}
                      type="button"
                      onClick={() => toggleScriptureSelection(scripture.id)}
                      className={`w-full text-left rounded-2xl px-4 py-3 transition ${selectedScriptureIds.includes(scripture.id) ? 'bg-blue-600 text-white' : 'bg-white text-slate-700 hover:bg-slate-100'}`}
                    >
                      <span className="block font-semibold">{scripture.book} {scripture.chapter}:{scripture.verse_start}{scripture.verse_end ? `-${scripture.verse_end}` : ''}</span>
                      <span className="text-sm text-slate-500">ID: {scripture.id}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Add new scripture</label>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    placeholder="Book"
                    value={newScripture.book}
                    onChange={(e) => setNewScripture((prev) => ({ ...prev, book: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                  <input
                    placeholder="Chapter"
                    value={newScripture.chapter}
                    onChange={(e) => setNewScripture((prev) => ({ ...prev, chapter: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                </div>
                <div className="grid gap-3 md:grid-cols-2 mt-3">
                  <input
                    placeholder="Verse start"
                    value={newScripture.verse_start}
                    onChange={(e) => setNewScripture((prev) => ({ ...prev, verse_start: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                  <input
                    placeholder="Verse end (optional)"
                    value={newScripture.verse_end}
                    onChange={(e) => setNewScripture((prev) => ({ ...prev, verse_end: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddScripture}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  Add Scripture
                </button>
                <div className="mt-3 flex flex-wrap gap-2">
                  {newScriptures.map((scripture, index) => (
                    <span key={`${scripture.book}-${index}`} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                      {scripture.book} {scripture.chapter}:{scripture.verse_start}{scripture.verse_end ? `-${scripture.verse_end}` : ''}
                      <button type="button" onClick={() => removeNewScripture(index)} className="text-slate-500 hover:text-slate-900">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleCreateBlog}
                  disabled={isCreating}
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {isCreating ? 'Creating blog...' : 'Create blog'}
                </button>
                {createFeedback && <p className="text-sm text-slate-600">{createFeedback}</p>}
              </div>
            </div>
          </div>

        </div>
      </motion.div>
    </motion.div>
  )
}
