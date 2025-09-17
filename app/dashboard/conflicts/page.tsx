import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, AlertTriangle, CheckCircle, Clock } from "lucide-react"
import { ConflictsList } from "@/components/conflicts-list"

export default async function ConflictsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !["admin", "coordinator"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch conflicts
  const { data: conflicts, error } = await supabase
    .from("timetable_conflicts")
    .select(`
      *,
      timetable:timetables(
        name,
        academic_year,
        semester,
        department:departments(name, code)
      ),
      resolved_by_profile:profiles!timetable_conflicts_resolved_by_fkey(full_name)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching conflicts:", error)
  }

  // Get conflict statistics
  const stats = {
    unresolved: conflicts?.filter((c) => c.resolution_status === "unresolved").length || 0,
    resolved: conflicts?.filter((c) => c.resolution_status === "resolved").length || 0,
    critical: conflicts?.filter((c) => c.severity === "critical").length || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Timetable Conflicts</h1>
                <p className="text-gray-600">Manage and resolve scheduling conflicts</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unresolved Conflicts</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.unresolved}</div>
              <p className="text-xs text-muted-foreground">Require attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
              <p className="text-xs text-muted-foreground">Successfully resolved</p>
            </CardContent>
          </Card>
        </div>

        {/* Conflicts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Conflicts</CardTitle>
            <CardDescription>Review and resolve timetable scheduling conflicts</CardDescription>
          </CardHeader>
          <CardContent>
            <ConflictsList conflicts={conflicts || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
