"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Classroom {
  id: string
  name: string
  capacity: number
  type: string
  equipment: string[]
  is_available: boolean
  department?: { name: string; code: string }
  created_at: string
}

interface ClassroomsListProps {
  classrooms: Classroom[]
}

export function ClassroomsList({ classrooms }: ClassroomsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this classroom?")) return

    setIsDeleting(id)
    try {
      const { error } = await supabase.from("classrooms").delete().eq("id", id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting classroom:", error)
      alert("Failed to delete classroom")
    } finally {
      setIsDeleting(null)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "lecture_hall":
        return "bg-blue-100 text-blue-800"
      case "laboratory":
        return "bg-green-100 text-green-800"
      case "seminar_room":
        return "bg-purple-100 text-purple-800"
      case "auditorium":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (classrooms.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No classrooms found</p>
        <Button asChild>
          <Link href="/dashboard/classrooms/new">Add First Classroom</Link>
        </Button>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Capacity</TableHead>
          <TableHead>Department</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {classrooms.map((classroom) => (
          <TableRow key={classroom.id}>
            <TableCell className="font-medium">{classroom.name}</TableCell>
            <TableCell>
              <Badge className={getTypeColor(classroom.type)}>{classroom.type.replace("_", " ").toUpperCase()}</Badge>
            </TableCell>
            <TableCell>{classroom.capacity} students</TableCell>
            <TableCell>{classroom.department ? classroom.department.name : "General"}</TableCell>
            <TableCell>
              <Badge variant={classroom.is_available ? "default" : "secondary"}>
                {classroom.is_available ? "Available" : "Unavailable"}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/classrooms/${classroom.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(classroom.id)}
                  disabled={isDeleting === classroom.id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
