import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { department_id, academic_year, semester, name } = body

    // Fetch all required data for timetable generation
    const [timeSlots, classrooms, subjects, faculty, batches, constraints] = await Promise.all([
      supabase.from("time_slots").select("*").order("day_of_week, slot_number"),
      supabase.from("classrooms").select("*").eq("is_available", true).order("name"),
      supabase.from("subjects").select("*").eq("department_id", department_id).order("name"),
      supabase
        .from("faculty")
        .select(`
          *,
          faculty_subjects(subject_id)
        `)
        .eq("department_id", department_id)
        .eq("is_available", true),
      supabase
        .from("batches")
        .select(`
          *,
          batch_subjects(subject_id)
        `)
        .eq("department_id", department_id)
        .eq("semester", semester),
      supabase.from("scheduling_constraints").select("*").eq("is_active", true),
    ])

    // Transform data for the Python algorithm
    const algorithmData = {
      time_slots: timeSlots.data?.map((slot) => ({
        id: slot.id,
        day_of_week: slot.day_of_week,
        slot_number: slot.slot_number,
        start_time: slot.start_time,
        end_time: slot.end_time,
        is_break: slot.is_break,
        shift: slot.shift,
      })),
      classrooms: classrooms.data?.map((room) => ({
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        type: room.type,
        equipment: room.equipment || [],
        department_id: room.department_id,
      })),
      subjects: subjects.data?.map((subject) => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        credits: subject.credits,
        classes_per_week: subject.classes_per_week,
        duration_minutes: subject.duration_minutes,
        requires_lab: subject.requires_lab,
        subject_type: subject.subject_type,
        department_id: subject.department_id,
      })),
      faculty: faculty.data?.map((fac) => ({
        id: fac.id,
        name: fac.profile_id, // Will be resolved later
        department_id: fac.department_id,
        max_classes_per_day: fac.max_classes_per_day,
        max_classes_per_week: fac.max_classes_per_week,
        specializations: fac.specializations || [],
        subjects: fac.faculty_subjects?.map((fs: any) => fs.subject_id) || [],
      })),
      batches: batches.data?.map((batch) => ({
        id: batch.id,
        name: batch.name,
        year: batch.year,
        semester: batch.semester,
        student_count: batch.student_count,
        department_id: batch.department_id,
        subjects: batch.batch_subjects?.map((bs: any) => bs.subject_id) || [],
      })),
      constraints: constraints.data?.map((constraint) => ({
        name: constraint.name,
        type: constraint.type,
        weight: constraint.weight,
        description: constraint.description,
      })),
    }

    // For now, return a mock response since we can't execute Python directly
    // In a real implementation, you would call the Python script or implement the algorithm in TypeScript
    const mockTimetableOptions = generateMockTimetableOptions(algorithmData, department_id)

    // Create timetable record
    const { data: timetable, error: timetableError } = await supabase
      .from("timetables")
      .insert({
        name,
        academic_year,
        semester,
        department_id,
        status: "draft",
        created_by: user.id,
      })
      .select()
      .single()

    if (timetableError) {
      throw timetableError
    }

    // Store the best timetable option
    const bestOption = mockTimetableOptions[0]
    const timetableEntries = bestOption.entries.map((entry: any) => ({
      timetable_id: timetable.id,
      ...entry,
    }))

    const { error: entriesError } = await supabase.from("timetable_entries").insert(timetableEntries)

    if (entriesError) {
      throw entriesError
    }

    return NextResponse.json({
      success: true,
      timetable_id: timetable.id,
      options: mockTimetableOptions,
      message: "Timetable generated successfully",
    })
  } catch (error) {
    console.error("Error generating timetable:", error)
    return NextResponse.json({ error: "Failed to generate timetable" }, { status: 500 })
  }
}

function generateMockTimetableOptions(data: any, departmentId: string) {
  // Mock implementation - in reality, this would call the Python algorithm
  const options = []

  for (let optionIndex = 0; optionIndex < 3; optionIndex++) {
    const entries = []
    const fitnessScore = 0.85 - optionIndex * 0.1 // Decreasing fitness for demo

    // Generate some sample entries
    if (data.batches && data.subjects && data.faculty && data.classrooms && data.time_slots) {
      for (let i = 0; i < Math.min(10, data.time_slots.length); i++) {
        const timeSlot = data.time_slots[i]
        if (timeSlot.is_break) continue

        const batch = data.batches[0] // Use first batch for demo
        const subject = data.subjects[0] // Use first subject for demo
        const facultyMember = data.faculty[0] // Use first faculty for demo
        const classroom = data.classrooms[0] // Use first classroom for demo

        if (batch && subject && facultyMember && classroom) {
          entries.push({
            time_slot_id: timeSlot.id,
            subject_id: subject.id,
            faculty_id: facultyMember.id,
            classroom_id: classroom.id,
            batch_id: batch.id,
            class_type: "lecture",
          })
        }
      }
    }

    options.push({
      option_number: optionIndex + 1,
      fitness_score: fitnessScore,
      entries,
      conflicts: optionIndex, // Mock conflicts
      suggestions: optionIndex > 0 ? [`Consider rearranging slot ${optionIndex}`] : [],
    })
  }

  return options
}
