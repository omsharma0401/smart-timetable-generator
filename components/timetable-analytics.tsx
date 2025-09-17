"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { Users, MapPin, BookOpen, Clock } from "lucide-react"

interface TimetableEntry {
  id: string
  time_slot: {
    day_of_week: number
    slot_number: number
  }
  subject: {
    name: string
    code: string
  }
  faculty: {
    profile: {
      full_name: string
    }
  }
  classroom: {
    name: string
    type: string
  }
  batch: {
    name: string
    student_count: number
  }
  class_type: string
}

interface TimetableAnalyticsProps {
  entries: TimetableEntry[]
}

export function TimetableAnalytics({ entries }: TimetableAnalyticsProps) {
  // Calculate daily distribution
  const dailyDistribution = entries.reduce(
    (acc, entry) => {
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
      const dayName = days[entry.time_slot.day_of_week - 1]
      acc[dayName] = (acc[dayName] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const dailyData = Object.entries(dailyDistribution).map(([day, count]) => ({
    day,
    classes: count,
  }))

  // Calculate classroom utilization
  const classroomUtilization = entries.reduce(
    (acc, entry) => {
      const room = entry.classroom.name
      acc[room] = (acc[room] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const classroomData = Object.entries(classroomUtilization)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([room, count]) => ({
      room,
      classes: count,
    }))

  // Calculate class type distribution
  const classTypeDistribution = entries.reduce(
    (acc, entry) => {
      acc[entry.class_type] = (acc[entry.class_type] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const classTypeData = Object.entries(classTypeDistribution).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
  }))

  const COLORS = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444"]

  // Calculate faculty workload
  const facultyWorkload = entries.reduce(
    (acc, entry) => {
      const faculty = entry.faculty.profile.full_name
      acc[faculty] = (acc[faculty] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const avgWorkload = Object.values(facultyWorkload).reduce((a, b) => a + b, 0) / Object.keys(facultyWorkload).length
  const maxWorkload = Math.max(...Object.values(facultyWorkload))

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Class Distribution
          </CardTitle>
          <CardDescription>Number of classes scheduled per day</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="classes" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Class Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Class Type Distribution
          </CardTitle>
          <CardDescription>Breakdown of different class types</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={classTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {classTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Classroom Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Top Classroom Utilization
          </CardTitle>
          <CardDescription>Most frequently used classrooms</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={classroomData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="room" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="classes" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Faculty Workload Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Faculty Workload Analysis
          </CardTitle>
          <CardDescription>Overview of faculty teaching loads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">{Object.keys(facultyWorkload).length}</div>
                <div className="text-sm text-gray-600">Total Faculty</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{avgWorkload.toFixed(1)}</div>
                <div className="text-sm text-gray-600">Avg Classes</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{maxWorkload}</div>
                <div className="text-sm text-gray-600">Max Classes</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Workload Distribution</div>
              {Object.entries(facultyWorkload)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([faculty, classes]) => (
                  <div key={faculty} className="flex items-center justify-between">
                    <span className="text-sm truncate flex-1 mr-2">{faculty}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Progress value={(classes / maxWorkload) * 100} className="w-20" />
                      <span className="text-sm font-medium w-8">{classes}</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
