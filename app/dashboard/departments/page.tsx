import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Plus, ArrowLeft } from "lucide-react"
import { DepartmentsList } from "@/components/departments-list"

export default async function DepartmentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check permissions
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || !["admin", "coordinator"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Fetch departments
  const { data: departments, error } = await supabase
    .from("departments")
    .select(`
      *,
      head:profiles(full_name)
    `)
    .order("name")

  if (error) {
    console.error("Error fetching departments:", error)
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
                <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
                <p className="text-gray-600">Manage academic departments</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/dashboard/departments/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Department
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Departments</CardTitle>
            <CardDescription>View and manage all academic departments in the system</CardDescription>
          </CardHeader>
          <CardContent>
            <DepartmentsList departments={departments || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
