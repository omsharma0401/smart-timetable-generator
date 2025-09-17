"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2 } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface Department {
  id: string
  name: string
  code: string
  head?: { full_name: string }
  created_at: string
}

interface DepartmentsListProps {
  departments: Department[]
}

export function DepartmentsList({ departments }: DepartmentsListProps) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return

    setIsDeleting(id)
    try {
      const { error } = await supabase.from("departments").delete().eq("id", id)
      if (error) throw error
      router.refresh()
    } catch (error) {
      console.error("Error deleting department:", error)
      alert("Failed to delete department")
    } finally {
      setIsDeleting(null)
    }
  }

  if (departments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No departments found</p>
        <Button asChild>
          <Link href="/dashboard/departments/new">Add First Department</Link>
        </Button>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Code</TableHead>
          <TableHead>Department Head</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {departments.map((department) => (
          <TableRow key={department.id}>
            <TableCell className="font-medium">{department.name}</TableCell>
            <TableCell>
              <Badge variant="secondary">{department.code}</Badge>
            </TableCell>
            <TableCell>{department.head?.full_name || "Not assigned"}</TableCell>
            <TableCell>{new Date(department.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link href={`/dashboard/departments/${department.id}/edit`}>
                    <Edit className="h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(department.id)}
                  disabled={isDeleting === department.id}
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
