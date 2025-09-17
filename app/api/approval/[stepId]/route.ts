import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { stepId: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, comments } = body // action: 'approved' | 'rejected'

    if (!["approved", "rejected"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Get the approval step
    const { data: step, error: stepError } = await supabase
      .from("approval_steps")
      .select(`
        *,
        workflow:approval_workflows(*)
      `)
      .eq("id", params.stepId)
      .single()

    if (stepError || !step) {
      return NextResponse.json({ error: "Approval step not found" }, { status: 404 })
    }

    // Check if user can approve this step
    const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 })
    }

    const canApprove =
      profile.role === "admin" ||
      (step.approver_role === profile.role && (!step.department_id || step.department_id === profile.department_id))

    if (!canApprove) {
      return NextResponse.json({ error: "Not authorized to approve this step" }, { status: 403 })
    }

    // Use the stored procedure to advance the workflow
    const { error: advanceError } = await supabase.rpc("advance_approval_workflow", {
      workflow_id: step.workflow_id,
      step_id: params.stepId,
      action,
      comments,
    })

    if (advanceError) {
      throw advanceError
    }

    // Create notification for the timetable creator
    const { data: timetable } = await supabase
      .from("timetables")
      .select("created_by, name")
      .eq("id", step.workflow.timetable_id)
      .single()

    if (timetable) {
      await supabase.from("notifications").insert({
        user_id: timetable.created_by,
        title: `Timetable ${action}`,
        message: `Your timetable "${timetable.name}" has been ${action}${comments ? `: ${comments}` : ""}`,
        type: action === "approved" ? "approval_granted" : "approval_rejected",
        related_id: step.workflow.timetable_id,
      })
    }

    return NextResponse.json({
      success: true,
      message: `Approval step ${action}`,
    })
  } catch (error) {
    console.error("Error processing approval:", error)
    return NextResponse.json({ error: "Failed to process approval" }, { status: 500 })
  }
}
