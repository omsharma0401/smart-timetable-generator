"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      console.log("[v0] Attempting login with email:", email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log("[v0] Login response:", { data, error })

      if (error) {
        console.log("[v0] Login error:", error.message)
        throw error
      }

      if (data.user) {
        console.log("[v0] User authenticated, checking profile...")
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        console.log("[v0] Profile check:", { profile, profileError })

        if (profileError && profileError.code === "PGRST116") {
          // Profile doesn't exist, show helpful error
          setError("Your account doesn't have a profile set up. Please contact an administrator.")
          return
        } else if (profileError) {
          console.log("[v0] Profile fetch error:", profileError)
          setError("Error checking user profile. Please try again.")
          return
        }

        console.log("[v0] Login successful, redirecting to dashboard")
        router.push("/dashboard")
      }
    } catch (error: unknown) {
      console.log("[v0] Login catch error:", error)
      const errorMessage = error instanceof Error ? error.message : "An error occurred"

      if (errorMessage.includes("Invalid login credentials")) {
        setError("Invalid email or password. Please check your credentials and try again.")
      } else if (errorMessage.includes("Email not confirmed")) {
        setError("Please check your email and click the confirmation link before logging in.")
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Timetable</h1>
          <p className="text-gray-600">Classroom & Timetable Scheduler</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin}>
              <div className="flex flex-col gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@college.edu"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">{error}</div>
                )}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{" "}
                <Link href="/auth/sign-up" className="underline underline-offset-4 text-blue-600 hover:text-blue-800">
                  Sign up
                </Link>
              </div>
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-xs text-blue-600 font-medium mb-1">Test Credentials:</p>
                <p className="text-xs text-blue-600">Email: admin@college.edu</p>
                <p className="text-xs text-blue-600">Password: admin123</p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
