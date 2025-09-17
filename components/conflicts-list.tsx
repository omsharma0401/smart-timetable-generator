"use client"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Eye } from "lucide-react"

interface Conflict {
  id: string
  conflict_type: string
  description: string
  severity: string
  resolution_status: string
  created_at: string
  resolved_at?: string
  timetable: {
    name: string
    academic_year: string
    semester: number
    department?: { name: string; code: string }
  }
  resolved_by_profile?: { full_name: string }
}

interface ConflictsListProps {
  conflicts: Conflict[]
}

export function ConflictsList({ conflicts }: ConflictsListProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "resolved":
        return "bg-green-100 text-green-800"
      case "unresolved":
        return "bg-red-100 text-red-800"
      case "ignored":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getConflictTypeIcon = (type: string) => {
    switch (type) {
      case "faculty_overlap":
        return "👥"
      case "classroom_overlap":
        return "🏫"
      case "resource_conflict":
        return "⚠️"
      default:
        return "❓"
    }
  }

  if (conflicts.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">No conflicts detected</p>
        <p className="text-sm text-gray-400">All timetables are conflict-free!</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Timetable</TableHead>
          <TableHead>Severity</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Detected</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conflicts.map((conflict) => (
          <TableRow key={conflict.id}>
            <TableCell>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getConflictTypeIcon(conflict.conflict_type)}</span>
                <span className="capitalize">{conflict.conflict_type.replace("_", " ")}</span>
              </div>
            </TableCell>
            <TableCell className="max-w-xs">
              <div className="truncate" title={conflict.description}>
                {conflict.description}
              </div>
            </TableCell>
            <TableCell>
              <div>
                <div className="font-medium">{conflict.timetable.name}</div>
                <div className="text-sm text-gray-600">
                  {conflict.timetable.department?.code || "All"} • {conflict.timetable.academic_year} • S
                  {conflict.timetable.semester}
                </div>
              </div>
            </TableCell>
            <TableCell>
              <Badge className={getSeverityColor(conflict.severity)}>
                {conflict.severity === "critical" && <AlertTriangle className="h-3 w-3 mr-1" />}
                {conflict.severity.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge className={getStatusColor(conflict.resolution_status)}>
                {conflict.resolution_status === "resolved" && <CheckCircle className="h-3 w-3 mr-1" />}
                {conflict.resolution_status.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>{new Date(conflict.created_at).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
