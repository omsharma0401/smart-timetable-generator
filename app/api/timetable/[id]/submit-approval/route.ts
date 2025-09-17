import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check user permissions
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || !["admin", "coordinator"].includes(profile.role)) {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    const timetableId = params.id

    // Update timetable status to pending approval
    const { error: updateError } = await supabase
      .from("timetables")
      .update({ status: "pending_approval" })
      .eq("id", timetableId)

    if (updateError) {
      throw updateError
    }

    // The trigger will automatically create the approval workflow

    return NextResponse.json({
      success: true,
      message: "Timetable submitted for approval",
    })
  } catch (error) {
    console.error("Error submitting timetable for approval:", error)
    return NextResponse.json({ error: "Failed to submit for approval" }, { status: 500 })
  }
}
