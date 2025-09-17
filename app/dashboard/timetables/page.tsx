import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ArrowLeft, Calendar } from "lucide-react"
import { TimetablesList } from "@/components/timetables-list"

export default async function TimetablesPage() {
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

  // Fetch timetables with related data
  const { data: timetables, error } = await supabase
    .from("timetables")
    .select(`
      *,
      department:departments(name, code),
      created_by_profile:profiles!timetables_created_by_fkey(full_name),
      approved_by_profile:profiles!timetables_approved_by_fkey(full_name),
      timetable_entries(id)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching timetables:", error)
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
                <h1 className="text-3xl font-bold text-gray-900">Timetables</h1>
                <p className="text-gray-600">Manage and review all timetables</p>
              </div>
            </div>
            {["admin", "coordinator"].includes(profile.role) && (
              <Button asChild>
                <Link href="/dashboard/timetables/generate">
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Timetable
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              All Timetables
            </CardTitle>
            <CardDescription>View, review, and manage all generated timetables</CardDescription>
          </CardHeader>
          <CardContent>
            <TimetablesList timetables={timetables || []} userRole={profile.role} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
