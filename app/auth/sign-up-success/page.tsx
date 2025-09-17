import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Timetable</h1>
          <p className="text-gray-600">Classroom & Timetable Scheduler</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center text-green-600">Account Created Successfully!</CardTitle>
            <CardDescription className="text-center">Please check your email to verify your account</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground mb-6">
              We&apos;ve sent a verification email to your inbox. Please click the link in the email to activate your
              account before signing in.
            </p>
            <Button asChild>
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
