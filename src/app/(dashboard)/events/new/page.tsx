'use client'

import { useState } from 'react'
import { Plus, X, Calendar, MapPin, Tag, Image as ImageIcon, FileText, ArrowLeft, Loader2, ChevronDown, Search } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

export default function CreateEventPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    type: '',
    banner: '',
    description: '',
  })
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const CATEGORIES = [
    'AI', 'TECH', 'FINANCE', 'HEALTHCARE', 'BUSINESS', 'NETWORKING', 
    'ENTERTAINMENT', 'EDUCATION', 'MARKETING', 'SALES', 'DESIGN', 
    'DEVELOPMENT', 'STARTUPS', 'INVESTMENT', 'LEADERSHIP', 
    'HUMAN RESOURCES', 'REAL ESTATE', 'E-COMMERCE', 'LOGISTICS', 
    'MANUFACTURING', 'SUSTAINABILITY', 'ENERGY', 'AUTOMOTIVE', 
    'SPORTS', 'FASHION', 'FOOD & BEVERAGE', 'TRAVEL', 'HOSPITALITY', 
    'NON-PROFIT', 'GOVERNMENT', 'LEGAL', 'MEDIA', 'TELECOM', 'OTHER'
  ]

  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')

  const filteredCategories = CATEGORIES.filter(c => c.toLowerCase().includes(categorySearch.toLowerCase()))

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleDescriptionChange = (value: string) => {
    setFormData(prev => ({ ...prev, description: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const MAX_WIDTH = 800
          const MAX_HEIGHT = 600
          let width = img.width
          let height = img.height

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width
              width = MAX_WIDTH
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height
              height = MAX_HEIGHT
            }
          }

          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)
          const base64String = canvas.toDataURL('image/jpeg', 0.6)
          setImagePreview(base64String)
          setFormData(prev => ({ ...prev, banner: base64String }))
        }
        img.src = reader.result as string
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('You must be logged in')

      const { error: insertError } = await supabase
        .from('events')
        .insert({
          name: formData.name,
          date: startDate ? startDate.toISOString() : '',
          start_date: startDate ? startDate.toISOString() : '',
          end_date: endDate ? endDate.toISOString() : null,
          location: formData.location,
          type: formData.type,
          banner: formData.banner,
          cover_url: formData.banner,
          description: formData.description
        })

      if (insertError) throw insertError

      router.push('/events')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/events" className="text-zinc-400 hover:text-white transition flex items-center justify-center p-2 rounded-full hover:bg-white/5">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1A73E8] to-[#60A5FA] flex items-center justify-center shadow-lg shadow-[#1A73E8]/20">
              <Plus className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Create New Event</h1>
              <p className="text-sm text-zinc-400">Add a new event to the platform</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-8 bg-[#111827]/60 backdrop-blur-md border border-white/10 p-8 rounded-2xl shadow-xl">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 flex items-center gap-3">
                <X className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-6">
              <div className="border-b border-white/5 pb-4 mb-6">
                <h2 className="text-lg font-semibold text-white">Basic Information</h2>
                <p className="text-sm text-zinc-400">The core details about your event.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Event Name</label>
                <input 
                  type="text" required name="name" value={formData.name} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition"
                  placeholder="e.g. Global AI Executive Forum"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-zinc-400"/> Start Date</label>
                  <DatePicker 
                    selected={startDate} 
                    onChange={(date: Date | null) => setStartDate(date)}
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition"
                    placeholderText="Select start date"
                    wrapperClassName="w-full"
                    dateFormat="MMMM d, yyyy"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2"><Calendar className="w-4 h-4 text-zinc-400"/> End Date</label>
                  <DatePicker 
                    selected={endDate} 
                    onChange={(date: Date | null) => setEndDate(date)}
                    className="w-full bg-[#111827] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition"
                    placeholderText="Select end date"
                    wrapperClassName="w-full"
                    dateFormat="MMMM d, yyyy"
                    minDate={startDate || undefined}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2"><MapPin className="w-4 h-4 text-zinc-400"/> Location</label>
                <input 
                  type="text" required name="location" value={formData.location} onChange={handleChange}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-zinc-500 outline-none focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition"
                  placeholder="e.g. London, UK"
                />
              </div>

              <div className="border-b border-white/5 pb-4 mb-6 mt-8">
                <h2 className="text-lg font-semibold text-white">Event Details & Media</h2>
                <p className="text-sm text-zinc-400">Provide category, banner, and description.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2"><Tag className="w-4 h-4 text-zinc-400"/> Category / Type</label>
                  <div className="relative">
                    <div 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none hover:border-[#1A73E8]/50 focus:border-[#1A73E8] focus:ring-1 focus:ring-[#1A73E8] transition cursor-pointer flex justify-between items-center"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                      <span className={formData.type ? 'text-white' : 'text-zinc-500'}>
                        {formData.type || 'Select a category'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {isDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                        <div className="absolute z-50 w-full mt-2 bg-[#111827] border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-72">
                          <div className="p-2 border-b border-white/10 flex items-center gap-2 bg-white/5">
                            <Search className="w-4 h-4 text-zinc-400 ml-2" />
                            <input 
                              type="text" 
                              value={categorySearch} 
                              onChange={(e) => setCategorySearch(e.target.value)} 
                              placeholder="Search categories..."
                              className="w-full bg-transparent border-none rounded-lg px-2 py-2 text-sm text-white placeholder-zinc-500 outline-none"
                              autoFocus
                            />
                          </div>
                          <div className="overflow-y-auto p-1 custom-scrollbar">
                            {filteredCategories.length === 0 ? (
                              <div className="px-3 py-4 text-sm text-zinc-500 text-center">No categories found</div>
                            ) : (
                              filteredCategories.map(cat => (
                                <div 
                                  key={cat} 
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, type: cat }))
                                    setIsDropdownOpen(false)
                                    setCategorySearch('')
                                  }}
                                  className={`px-3 py-2 text-sm rounded-lg cursor-pointer transition ${
                                    formData.type === cat 
                                      ? 'bg-[#1A73E8] text-white font-medium' 
                                      : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                                  }`}
                                >
                                  {cat}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-zinc-400"/> Banner Image</label>
                  <label className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-xl cursor-pointer hover:border-[#1A73E8] hover:bg-[#1A73E8]/5 transition overflow-hidden relative">
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 text-zinc-500 mb-2" />
                        <p className="text-sm text-zinc-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-zinc-500">SVG, PNG, JPG or GIF</p>
                      </div>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 flex items-center gap-2"><FileText className="w-4 h-4 text-zinc-400"/> Description</label>
                <div className="bg-white/5 border border-white/10 rounded-xl text-white overflow-hidden relative z-0">
                  <ReactQuill 
                    theme="snow" 
                    value={formData.description} 
                    onChange={handleDescriptionChange}
                    className="min-h-[200px]"
                    placeholder="Write a compelling description for this event..."
                  />
                  <style jsx global>{`
                    .quill {
                      display: flex;
                      flex-direction: column;
                    }
                    .ql-toolbar.ql-snow {
                      border: none;
                      border-bottom: 1px solid rgba(255,255,255,0.1);
                      padding: 12px;
                      background: rgba(0,0,0,0.2);
                    }
                    .ql-container.ql-snow {
                      border: none;
                      min-height: 150px;
                      font-size: 1rem;
                    }
                    .ql-editor {
                      min-height: 150px;
                      font-family: inherit;
                    }
                    .ql-snow .ql-stroke {
                      stroke: #a1a1aa;
                    }
                    .ql-snow .ql-fill {
                      fill: #a1a1aa;
                    }
                    .ql-snow .ql-picker {
                      color: #a1a1aa;
                    }
                    .ql-snow .ql-picker-options {
                      background: #111827;
                      border: 1px solid rgba(255,255,255,0.1);
                    }
                  `}</style>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 flex justify-end gap-4">
              <Link 
                href="/events"
                className="px-6 py-3 rounded-xl font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition flex items-center justify-center"
              >
                Cancel
              </Link>
              <button 
                type="submit"
                disabled={loading}
                className="bg-[#1A73E8] hover:bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-[#1A73E8]/20 flex items-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? 'Creating Event...' : 'Publish Event'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
