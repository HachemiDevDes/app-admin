'use client'

import { useState } from 'react'
import { Calendar, Plus, Edit2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'

type Event = any

interface EventsClientProps {
  initialEvents: Event[]
  userInitial: string
}

type TabType = 'All' | 'Live' | 'Current' | 'Passed'

export default function EventsClient({ initialEvents, userInitial }: EventsClientProps) {
  const [activeTab, setActiveTab] = useState<TabType>('All')
  const [events, setEvents] = useState<Event[]>(initialEvents)

  const filterEvents = () => {
    const now = new Date()
    return events.filter(event => {
      if (activeTab === 'All') return true

      const eventDate = new Date(event.start_date || event.date)
      // Assuming 'Current' means upcoming or currently happening
      // 'Passed' means already finished
      // 'Live' means happening exactly today or explicitly marked live
      
      const isPast = eventDate < new Date(now.setHours(0, 0, 0, 0))
      const isToday = eventDate.toDateString() === new Date().toDateString()
      const isFuture = eventDate > new Date(now.setHours(23, 59, 59, 999))

      if (activeTab === 'Passed') return isPast
      if (activeTab === 'Live') return isToday
      if (activeTab === 'Current') return isFuture || isToday
      
      return true
    })
  }

  const filteredEvents = filterEvents()

  const tabs: TabType[] = ['All', 'Live', 'Current', 'Passed']

  const handleDelete = async (eventId: string) => {
    if (confirm("Are you sure you want to delete this event?")) {
      const supabase = createClient()
      const { error } = await supabase.from('events').delete().eq('id', eventId)
      if (!error) {
        setEvents(events.filter(e => e.id !== eventId))
      } else {
        alert("Failed to delete event: " + error.message)
      }
    }
  }

  return (
    <>
      <header className="border-b border-white/10 bg-[#111827]/40 backdrop-blur-xl px-8 py-4 z-10 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calendar className="text-[#1A73E8]" />
            <h1 className="text-xl font-semibold text-white">Events Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href="/events/new"
              className="bg-[#1A73E8] hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition"
            >
              <Plus className="w-4 h-4" />
              New Event
            </Link>
            <div className="h-8 w-8 rounded-full bg-[#1A73E8] flex items-center justify-center text-sm font-bold shadow-md ml-4">
              {userInitial}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeTab === tab 
                  ? 'bg-white/10 text-white' 
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-8 relative z-0">
        {filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-400">
            <Calendar className="h-12 w-12 mb-4 opacity-50" />
            <p>No events found for the "{activeTab}" tab.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEvents.map((event) => (
              <div key={event.id} className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:bg-white/10 transition relative">
                <div className="absolute top-3 left-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Link href={`/events/${event.id}/edit`} className="bg-black/60 hover:bg-black/80 backdrop-blur p-2 rounded text-white shadow-lg transition" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </Link>
                  <button onClick={() => handleDelete(event.id)} className="bg-red-500/80 hover:bg-red-600 backdrop-blur p-2 rounded text-white shadow-lg transition" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-32 bg-zinc-800 relative">
                  {event.banner && (
                    <img src={event.banner} alt={event.name} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold">
                    {event.type || 'Event'}
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-bold text-lg leading-tight truncate">{event.name}</h3>
                  <div className="text-sm text-zinc-400 flex flex-col gap-1">
                    <span className="flex items-center gap-2"><Calendar className="w-3 h-3"/> {event.start_date || event.date || 'TBA'}</span>
                    <span className="flex items-center gap-2"><span className="w-3 h-3 text-center block">📍</span> {event.location || 'Online'}</span>
                  </div>
                  <p className="text-xs text-zinc-500 line-clamp-2">{event.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  )
}
