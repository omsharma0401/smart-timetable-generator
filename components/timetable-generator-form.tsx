"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Clock, Zap } from "lucide-react"

interface Department {
  id: string
  name: string
  code: string
}

interface TimetableGeneratorFormProps {
  departments: Department[]
}

interface TimetableOption {
  option_number: number
  fitness_score: number
  entries: any[]
  conflicts: number
  suggestions: string[]
}

export function TimetableGeneratorForm({ departments }: TimetableGeneratorFormProps) {
  const [name, setName] = useState("")
  const [departmentId, setDepartmentId] = useState("")
  const [academicYear, setAcademicYear] = useState("")
  const [semester, setSemester] = useState("")
  const [description, setDescription] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [generatedOptions, setGeneratedOptions] = useState<TimetableOption[]>([])
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    setError(null)
    setProgress(0)
    setGeneratedOptions([])

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const response = await fetch("/api/timetable/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          department_id: departmentId,
          academic_year: academicYear,
          semester: Number.parseInt(semester),
          description,
        }),
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate timetable")
      }

      const data = await response.json()
      setGeneratedOptions(data.options)
    } catch (error: any) {
      setError(error.message || "An error occurred")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSelectOption = async (optionNumber: number) => {
    // In a real implementation, this would save the selected option
    router.push("/dashboard/timetables")
  }

  const getFitnessColor = (score: number) => {
    if (score >= 0.8) return "text-green-600 bg-green-100"
    if (score >= 0.6) return "text-yellow-600 bg-yellow-100"
    return "text-red-600 bg-red-100"
  }

  return (
    <div className="space-y-8">
      {/* Generation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            Timetable Generation Parameters
          </CardTitle>
          <CardDescription>Configure the parameters for generating optimized timetables</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Timetable Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Fall 2024 - CSE Department"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="department">Department</Label>
                <Select value={departmentId} onValueChange={setDepartmentId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.id}>
                        {dept.name} ({dept.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="academicYear">Academic Year</Label>
                <Input
                  id="academicYear"
                  type="text"
                  placeholder="2024-25"
                  required
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="semester">Semester</Label>
                <Select value={semester} onValueChange={setSemester} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                    <SelectItem value="3">Semester 3</SelectItem>
                    <SelectItem value="4">Semester 4</SelectItem>
                    <SelectItem value="5">Semester 5</SelectItem>
                    <SelectItem value="6">Semester 6</SelectItem>
                    <SelectItem value="7">Semester 7</SelectItem>
                    <SelectItem value="8">Semester 8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Additional notes or requirements for this timetable..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <Button type="submit" disabled={isGenerating} className="w-full h-12 text-lg">
              {isGenerating ? (
                <>
                  <Clock className="h-5 w-5 mr-2 animate-spin" />
                  Generating Timetable...
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5 mr-2" />
                  Generate Optimized Timetable
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Progress Indicator */}
      {isGenerating && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Generation Progress</span>
                <span className="text-sm text-muted-foreground">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <div className="text-sm text-muted-foreground">
                {progress < 30 && "Analyzing constraints and requirements..."}
                {progress >= 30 && progress < 60 && "Optimizing class schedules..."}
                {progress >= 60 && progress < 90 && "Validating timetable options..."}
                {progress >= 90 && "Finalizing results..."}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Generation Failed</span>
            </div>
            <p className="text-red-600 mt-2">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Generated Options */}
      {generatedOptions.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h2 className="text-2xl font-bold text-gray-900">Generated Timetable Options</h2>
          </div>

          <div className="grid gap-6">
            {generatedOptions.map((option) => (
              <Card key={option.option_number} className="border-2 hover:border-blue-300 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      Option {option.option_number}
                      <Badge className={getFitnessColor(option.fitness_score)}>
                        {(option.fitness_score * 100).toFixed(1)}% Optimal
                      </Badge>
                    </CardTitle>
                    <Button onClick={() => handleSelectOption(option.option_number)}>Select This Option</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{option.entries.length}</div>
                      <div className="text-sm text-muted-foreground">Total Classes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{option.conflicts}</div>
                      <div className="text-sm text-muted-foreground">Conflicts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {(option.fitness_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Fitness Score</div>
                    </div>
                  </div>

                  {option.suggestions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Suggestions for Improvement:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {option.suggestions.map((suggestion, index) => (
                          <li key={index} className="text-sm text-gray-600">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
