"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Users } from "lucide-react"

interface TimetableEntry {
  id: string
  time_slot: {
    id: string
    day_of_week: number
    slot_number: number
    start_time: string
    end_time: string
  }
  subject: {
    name: string
    code: string
    credits: number
  }
  faculty: {
    profile: {
      full_name: string
    }
  }
  classroom: {
    name: string
    capacity: number
    type: string
  }
  batch: {
    name: string
    student_count: number
  }
  class_type: string
}

interface TimetableGridProps {
  entries: TimetableEntry[]
}

export function TimetableGrid({ entries }: TimetableGridProps) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
  const timeSlots = Array.from(new Set(entries.map((e) => e.time_slot.slot_number))).sort()

  // Get unique time slot info
  const slotTimes = entries.reduce(
    (acc, entry) => {
      const slot = entry.time_slot
      acc[slot.slot_number] = `${slot.start_time} - ${slot.end_time}`
      return acc
    },
    {} as Record<number, string>,
  )

  const getEntryForSlot = (day: number, slotNumber: number) => {
    return entries.find((entry) => entry.time_slot.day_of_week === day && entry.time_slot.slot_number === slotNumber)
  }

  const getClassTypeColor = (classType: string) => {
    switch (classType) {
      case "lecture":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "practical":
        return "bg-green-100 text-green-800 border-green-200"
      case "tutorial":
        return "bg-purple-100 text-purple-800 border-purple-200"
      case "seminar":
        return "bg-orange-100 text-orange-800 border-orange-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          <div className="font-medium text-gray-900 p-3">Time</div>
          {days.map((day, index) => (
            <div key={day} className="font-medium text-gray-900 p-3 text-center">
              {day}
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="space-y-2">
          {timeSlots.map((slotNumber) => (
            <div key={slotNumber} className="grid grid-cols-6 gap-2">
              {/* Time column */}
              <div className="p-3 bg-gray-50 rounded-lg border">
                <div className="text-sm font-medium text-gray-900">Slot {slotNumber}</div>
                <div className="text-xs text-gray-600">{slotTimes[slotNumber]}</div>
              </div>

              {/* Day columns */}
              {days.map((day, dayIndex) => {
                const entry = getEntryForSlot(dayIndex + 1, slotNumber)

                return (
                  <div key={`${day}-${slotNumber}`} className="min-h-[80px]">
                    {entry ? (
                      <Card
                        className={`h-full border-2 ${getClassTypeColor(entry.class_type)} hover:shadow-md transition-shadow`}
                      >
                        <CardContent className="p-3">
                          <div className="space-y-1">
                            <div className="font-medium text-sm truncate" title={entry.subject.name}>
                              {entry.subject.code}
                            </div>
                            <div className="text-xs text-gray-600 truncate" title={entry.faculty.profile.full_name}>
                              {entry.faculty.profile.full_name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{entry.classroom.name}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Users className="h-3 w-3" />
                              <span className="truncate">{entry.batch.name}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="h-full border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50"></div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
