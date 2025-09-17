import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, Calendar, Users, BookOpen, MapPin, Download, Edit, CheckCircle } from "lucide-react"
import { TimetableGrid } from "@/components/timetable-grid"
import { TimetableAnalytics } from "@/components/timetable-analytics"

export default async function TimetableDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Fetch timetable with all related data
  const { data: timetable, error } = await supabase
    .from("timetables")
    .select(`
      *,
      department:departments(name, code),
      created_by_profile:profiles!timetables_created_by_fkey(full_name),
      approved_by_profile:profiles!timetables_approved_by_fkey(full_name),
      timetable_entries(
        *,
        time_slot:time_slots(*),
        subject:subjects(name, code, credits),
        faculty:faculty(
          *,
          profile:profiles(full_name)
        ),
        classroom:classrooms(name, capacity, type),
        batch:batches(name, student_count)
      )
    `)
    .eq("id", params.id)
    .single()

  if (error || !timetable) {
    notFound()
  }

  const canEdit =
    ["admin", "coordinator"].includes(profile.role) && ["draft", "pending_approval"].includes(timetable.status)

  const canApprove = profile.role === "admin" && timetable.status === "pending_approval"

  const handleStatusUpdate = async (newStatus: string) => {
    // This would be handled by a server action in a real implementation
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard/timetables">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Timetables
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{timetable.name}</h1>
                <p className="text-gray-600">
                  {timetable.department?.name || "All Departments"} • {timetable.academic_year} • Semester{" "}
                  {timetable.semester}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className={getStatusColor(timetable.status)} variant="outline">
                {timetable.status.replace("_", " ").toUpperCase()}
              </Badge>
              {canApprove && (
                <Button className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Timetable
                </Button>
              )}
              {canEdit && (
                <Button asChild variant="outline">
                  <Link href={`/dashboard/timetables/${timetable.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Timetable Info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold">{timetable.timetable_entries.length}</div>
                    <div className="text-sm text-muted-foreground">Total Classes</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {new Set(timetable.timetable_entries.map((e) => e.batch_id)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Batches</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {new Set(timetable.timetable_entries.map((e) => e.subject_id)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Subjects</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold">
                      {new Set(timetable.timetable_entries.map((e) => e.classroom_id)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Classrooms</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Timetable Grid */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
              <CardDescription>Interactive timetable view with all scheduled classes</CardDescription>
            </CardHeader>
            <CardContent>
              <TimetableGrid entries={timetable.timetable_entries} />
            </CardContent>
          </Card>

          {/* Analytics */}
          <TimetableAnalytics entries={timetable.timetable_entries} />

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Timetable Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Creation Details</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created by:</span>
                      <span>{timetable.created_by_profile?.full_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created on:</span>
                      <span>{new Date(timetable.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <Badge className={getStatusColor(timetable.status)} variant="outline">
                        {timetable.status.replace("_", " ").toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {timetable.approved_by_profile && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Approval Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved by:</span>
                        <span>{timetable.approved_by_profile.full_name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Approved on:</span>
                        <span>
                          {timetable.approved_at ? new Date(timetable.approved_at).toLocaleDateString() : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "draft":
      return "bg-gray-100 text-gray-800"
    case "pending_approval":
      return "bg-yellow-100 text-yellow-800"
    case "approved":
      return "bg-green-100 text-green-800"
    case "active":
      return "bg-blue-100 text-blue-800"
    case "archived":
      return "bg-gray-100 text-gray-600"
    default:
      return "bg-gray-100 text-gray-800"
  }
}
