"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Trash2, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Timetable {
  id: string
  name: string
  academic_year: string
  semester: number
  status: string
  department?: { name: string; code: string }
  created_by_profile?: { full_name: string }
  approved_by_profile?: { full_name: string }
  created_at: string
  approved_at?: string
  timetable_entries: { id: string }[]
}

interface TimetablesListProps {
  timetables: Timetable[]
  userRole: string
}

export function TimetablesList({ timetables, userRole }: TimetablesListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this timetable?")) return

    setIsDeleting(id)
    try {
      const { error } = await supabase.from("timetables").delete().eq("id", id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting timetable:", error)
      alert("Failed to delete timetable")
    } finally {
      setIsDeleting(null)
    }
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setIsUpdating(id)
    try {
      const updateData: any = { status: newStatus }

      if (newStatus === "approved") {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        updateData.approved_by = user?.id
        updateData.approved_at = new Date().toISOString()
      }

      const { error } = await supabase.from("timetables").update(updateData).eq("id", id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error updating timetable status:", error)
      alert("Failed to update timetable status")
    } finally {
      setIsUpdating(null)
    }
  }

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-4 w-4" />
      case "pending_approval":
        return <Clock className="h-4 w-4" />
      case "active":
        return <CheckCircle className="h-4 w-4" />
      default:
        return null
    }
  }

  const canApprove = (timetable: Timetable) => {
    return userRole === "admin" && timetable.status === "pending_approval"
  }

  const canEdit = (timetable: Timetable) => {
    return ["admin", "coordinator"].includes(userRole) && ["draft", "pending_approval"].includes(timetable.status)
  }

  const canDelete = (timetable: Timetable) => {
    return userRole === "admin" && timetable.status !== "active"
  }

  if (timetables.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No timetables found</p>
        {["admin", "coordinator"].includes(userRole) && (
          <Button asChild>
            <Link href="/dashboard/timetables/generate">Generate First Timetable</Link>
          </Button>
        )}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Academic Year</TableHead>
          <TableHead>Semester</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Classes</TableHead>
          <TableHead>Created By</TableHead>
          <TableHead>Created Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {timetables.map((timetable) => (
          <TableRow key={timetable.id}>
            <TableCell className="font-medium">{timetable.name}</TableCell>
            <TableCell>
              {timetable.department ? <Badge variant="outline">{timetable.department.code}</Badge> : "All Departments"}
            </TableCell>
            <TableCell>{timetable.academic_year}</TableCell>
            <TableCell>Semester {timetable.semester}</TableCell>
            <TableCell>
              <Badge className={getStatusColor(timetable.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(timetable.status)}
                  {timetable.status.replace("_", " ").toUpperCase()}
                </div>
              </Badge>
            </TableCell>
            <TableCell>{timetable.timetable_entries.length} classes</TableCell>
            <TableCell>{timetable.created_by_profile?.full_name || "Unknown"}</TableCell>
            <TableCell>{new Date(timetable.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/timetables/${timetable.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>

                {canApprove(timetable) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleStatusUpdate(timetable.id, "approved")}
                    disabled={isUpdating === timetable.id}
                    className="text-green-600 hover:text-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                  </Button>
                )}

                {canEdit(timetable) && (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/timetables/${timetable.id}/edit`}>
                      <Edit className="h-4 w-4" />
                    </Link>
                  </Button>
                )}

                {canDelete(timetable) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(timetable.id)}
                    disabled={isDeleting === timetable.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
