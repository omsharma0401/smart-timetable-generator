import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { DepartmentForm } from "@/components/department-form"

export default async function NewDepartmentPage() {
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

  // Get all profiles for department head selection
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .in("role", ["admin", "coordinator", "faculty"])
    .order("full_name")

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-6">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard/departments">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Departments
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Add New Department</h1>
              <p className="text-gray-600">Create a new academic department</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DepartmentForm profiles={profiles || []} />
      </main>
    </div>
  )
}
