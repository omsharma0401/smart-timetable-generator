import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { ApprovalsList } from "@/components/approvals-list"

export default async function ApprovalsPage() {
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

  // Fetch pending approvals for this user
  const { data: pendingApprovals, error } = await supabase
    .from("approval_steps")
    .select(`
      *,
      workflow:approval_workflows(
        *,
        timetable:timetables(
          *,
          department:departments(name, code),
          created_by_profile:profiles!timetables_created_by_fkey(full_name)
        )
      )
    `)
    .eq("status", "pending")
    .or(
      `approver_role.eq.${profile.role},and(approver_role.eq.${profile.role},department_id.eq.${profile.department_id})`,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching approvals:", error)
  }

  // Get approval statistics
  const { data: allSteps } = await supabase
    .from("approval_steps")
    .select("status")
    .or(
      `approver_role.eq.${profile.role},and(approver_role.eq.${profile.role},department_id.eq.${profile.department_id})`,
    )

  const stats = {
    pending: allSteps?.filter((s) => s.status === "pending").length || 0,
    approved: allSteps?.filter((s) => s.status === "approved").length || 0,
    rejected: allSteps?.filter((s) => s.status === "rejected").length || 0,
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
                <h1 className="text-3xl font-bold text-gray-900">Approval Requests</h1>
                <p className="text-gray-600">Review and approve timetable submissions</p>
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
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">Awaiting your review</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">Successfully approved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">Rejected submissions</p>
            </CardContent>
          </Card>
        </div>

        {/* Approvals List */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Timetables awaiting your approval</CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalsList approvals={pendingApprovals || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
