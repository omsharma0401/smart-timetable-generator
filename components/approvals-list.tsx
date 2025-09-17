"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface ApprovalStep {
  id: string
  step_number: number
  approver_role: string
  status: string
  created_at: string
  workflow: {
    id: string
    current_step: number
    total_steps: number
    workflow_type: string
    timetable: {
      id: string
      name: string
      academic_year: string
      semester: number
      department?: { name: string; code: string }
      created_by_profile?: { full_name: string }
    }
  }
}

interface ApprovalsListProps {
  approvals: ApprovalStep[]
}

export function ApprovalsList({ approvals }: ApprovalsListProps) {
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [comments, setComments] = useState("")
  const [selectedApproval, setSelectedApproval] = useState<ApprovalStep | null>(null)
  const router = useRouter()

  const handleApproval = async (stepId: string, action: "approved" | "rejected") => {
    setIsProcessing(stepId)
    try {
      const response = await fetch(`/api/approval/${stepId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          comments: comments.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to process approval")
      }

      // Reset form and refresh
      setComments("")
      setSelectedApproval(null)
      router.refresh()
    } catch (error: any) {
      alert(error.message || "An error occurred")
    } finally {
      setIsProcessing(null)
    }
  }

  const getWorkflowProgress = (approval: ApprovalStep) => {
    const { current_step, total_steps } = approval.workflow
    return `${current_step}/${total_steps}`
  }

  if (approvals.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 mb-2">No pending approvals</p>
        <p className="text-sm text-gray-400">All caught up! Check back later for new submissions.</p>
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Timetable</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Step</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Submitted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {approvals.map((approval) => (
            <TableRow key={approval.id}>
              <TableCell className="font-medium">{approval.workflow.timetable.name}</TableCell>
              <TableCell>
                {approval.workflow.timetable.department ? (
                  <Badge variant="outline">{approval.workflow.timetable.department.code}</Badge>
                ) : (
                  "All Departments"
                )}
              </TableCell>
              <TableCell>
                {approval.workflow.timetable.academic_year} - S{approval.workflow.timetable.semester}
              </TableCell>
              <TableCell>{approval.workflow.timetable.created_by_profile?.full_name || "Unknown"}</TableCell>
              <TableCell>
                <Badge variant="outline">
                  Step {approval.step_number} ({approval.approver_role})
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className="text-sm">{getWorkflowProgress(approval)}</div>
                  <div className="w-16 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${(approval.workflow.current_step / approval.workflow.total_steps) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{new Date(approval.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/dashboard/timetables/${approval.workflow.timetable.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedApproval(approval)}
                        className="text-green-600 hover:text-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Approve Timetable</DialogTitle>
                        <DialogDescription>
                          Review and approve "{approval.workflow.timetable.name}" for{" "}
                          {approval.workflow.timetable.department?.name || "all departments"}.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Comments (Optional)</label>
                          <Textarea
                            placeholder="Add any comments or feedback..."
                            value={comments}
                            onChange={(e) => setComments(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleApproval(approval.id, "approved")}
                            disabled={isProcessing === approval.id}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            {isProcessing === approval.id ? "Processing..." : "Approve"}
                          </Button>
                          <Button
                            onClick={() => handleApproval(approval.id, "rejected")}
                            disabled={isProcessing === approval.id}
                            variant="outline"
                            className="flex-1 text-red-600 hover:text-red-700"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
