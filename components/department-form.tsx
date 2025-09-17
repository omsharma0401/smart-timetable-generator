"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Profile {
  id: string
  full_name: string
  role: string
}

interface DepartmentFormProps {
  profiles: Profile[]
  department?: {
    id: string
    name: string
    code: string
    head_id?: string
  }
}

export function DepartmentForm({ profiles, department }: DepartmentFormProps) {
  const [name, setName] = useState(department?.name || "")
  const [code, setCode] = useState(department?.code || "")
  const [headId, setHeadId] = useState(department?.head_id || "none")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const departmentData = {
        name,
        code: code.toUpperCase(),
        head_id: headId === "none" ? null : headId,
      }

      if (department) {
        // Update existing department
        const { error } = await supabase.from("departments").update(departmentData).eq("id", department.id)
        if (error) throw error
      } else {
        // Create new department
        const { error } = await supabase.from("departments").insert([departmentData])
        if (error) throw error
      }

      router.push("/dashboard/departments")
      router.refresh()
    } catch (error: any) {
      setError(error.message || "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{department ? "Edit Department" : "Add New Department"}</CardTitle>
        <CardDescription>
          {department ? "Update department information" : "Enter the details for the new department"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Department Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="Computer Science and Engineering"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="code">Department Code</Label>
            <Input
              id="code"
              type="text"
              placeholder="CSE"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              maxLength={10}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="head">Department Head (Optional)</Label>
            <Select value={headId} onValueChange={setHeadId}>
              <SelectTrigger>
                <SelectValue placeholder="Select department head" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No head assigned</SelectItem>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name} ({profile.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex gap-4">
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : department ? "Update Department" : "Create Department"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
