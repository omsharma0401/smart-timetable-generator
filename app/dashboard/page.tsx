import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Building, BookOpen, GraduationCap, Calendar, Settings, CheckCircle } from "lucide-react"

export default async function DashboardPage() {
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

  // Get dashboard statistics
  const [departmentsResult, classroomsResult, subjectsResult, facultyResult, batchesResult, timetablesResult] =
    await Promise.all([
      supabase.from("departments").select("id", { count: "exact" }),
      supabase.from("classrooms").select("id", { count: "exact" }),
      supabase.from("subjects").select("id", { count: "exact" }),
      supabase.from("faculty").select("id", { count: "exact" }),
      supabase.from("batches").select("id", { count: "exact" }),
      supabase.from("timetables").select("id", { count: "exact" }),
    ])

  const stats = {
    departments: departmentsResult.count || 0,
    classrooms: classroomsResult.count || 0,
    subjects: subjectsResult.count || 0,
    faculty: facultyResult.count || 0,
    batches: batchesResult.count || 0,
    timetables: timetablesResult.count || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Timetable Dashboard</h1>
              <p className="text-gray-600">Welcome back, {profile.full_name}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 capitalize bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                {profile.role}
              </span>
              <form action="/auth/logout" method="post">
                <Button variant="outline" type="submit">
                  Logout
                </Button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Departments</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.departments}</div>
              <p className="text-xs text-muted-foreground">Active departments</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Classrooms</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.classrooms}</div>
              <p className="text-xs text-muted-foreground">Available classrooms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Subjects</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.subjects}</div>
              <p className="text-xs text-muted-foreground">Total subjects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.faculty}</div>
              <p className="text-xs text-muted-foreground">Teaching staff</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Batches</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.batches}</div>
              <p className="text-xs text-muted-foreground">Student batches</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timetables</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.timetables}</div>
              <p className="text-xs text-muted-foreground">Generated timetables</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Manage core system data and configurations</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <Button asChild variant="outline" className="h-20 flex flex-col bg-transparent">
                <Link href="/dashboard/departments">
                  <Building className="h-6 w-6 mb-2" />
                  Departments
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col bg-transparent">
                <Link href="/dashboard/classrooms">
                  <Building className="h-6 w-6 mb-2" />
                  Classrooms
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col bg-transparent">
                <Link href="/dashboard/subjects">
                  <BookOpen className="h-6 w-6 mb-2" />
                  Subjects
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col bg-transparent">
                <Link href="/dashboard/faculty">
                  <Users className="h-6 w-6 mb-2" />
                  Faculty
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col bg-transparent">
                <Link href="/dashboard/batches">
                  <GraduationCap className="h-6 w-6 mb-2" />
                  Batches
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-20 flex flex-col bg-transparent">
                <Link href="/dashboard/settings">
                  <Settings className="h-6 w-6 mb-2" />
                  Settings
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Timetable Management */}
          <Card>
            <CardHeader>
              <CardTitle>Timetable Management</CardTitle>
              <CardDescription>Create, review, and manage timetables</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full h-16 text-lg bg-transparent" variant="outline">
                <Link href="/dashboard/timetables/generate">
                  <Calendar className="h-6 w-6 mr-2" />
                  Generate New Timetable
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 bg-transparent">
                <Link href="/dashboard/timetables">View All Timetables</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 bg-transparent">
                <Link href="/dashboard/timetables/review">Review Pending Timetables</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Workflow Management */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
              <CardDescription>Handle approvals and resolve conflicts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button asChild className="w-full h-16 text-lg bg-transparent" variant="outline">
                <Link href="/dashboard/approvals">
                  <CheckCircle className="h-6 w-6 mr-2" />
                  Review Approvals
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 bg-transparent">
                <Link href="/dashboard/conflicts">Manage Conflicts</Link>
              </Button>
              <Button asChild variant="outline" className="w-full h-12 bg-transparent">
                <Link href="/dashboard/notifications">View Notifications</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
