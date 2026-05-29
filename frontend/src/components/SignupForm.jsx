import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "../context/AuthContext"
import { getFirebaseAuthErrorMessage } from "../lib/firebaseAuthErrors"

export function SignupForm({
  className,
  ...props
}) {
  const navigate = useNavigate()
  const { signup, loginWithGoogle } = useAuth()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    setLoading(true)

    try {
      await signup(email, password)
      navigate("/dashboard")
    } catch (authError) {
      setError(getFirebaseAuthErrorMessage(authError))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setError("")
    setLoading(true)

    try {
      await loginWithGoogle()
      navigate("/dashboard")
    } catch (authError) {
      setError(getFirebaseAuthErrorMessage(authError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-5", className)} {...props}>
      <Card className="rounded-3xl border border-[#E1E4EF] bg-[#F8F8FD] py-4 shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-[#20104E]">Create an account</CardTitle>
          <CardDescription className="text-base text-[#8D96A8]">
            Sign up with your Google account or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-5">
              <Field>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={loading}
                  className="h-12 w-full rounded-2xl border-[#D9DDE8] bg-[#F4F5FA] text-[15px] font-semibold hover:bg-[#EEF0F8]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor" />
                  </svg>
                  Sign up with Google
                </Button>
              </Field>
              <FieldSeparator className="text-[#9AA2B2] [&_[data-slot=field-separator-content]]:bg-[#F8F8FD]">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel className="text-base font-semibold text-[#2C2D40]" htmlFor="name">Full Name</FieldLabel>
                <Input 
                  id="name" 
                  type="text" 
                  placeholder="John Doe" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                  className="h-12 rounded-2xl border-[#D9DDE8] bg-[#F4F5FA] px-4 text-base"
                />
              </Field>
              <Field>
                <FieldLabel className="text-base font-semibold text-[#2C2D40]" htmlFor="email">Email</FieldLabel>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={loading}
                  className="h-12 rounded-2xl border-[#D9DDE8] bg-[#F4F5FA] px-4 text-base"
                />
              </Field>
              <Field>
                <div className="grid grid-cols-1 gap-4">
                  <Field>
                    <FieldLabel className="text-base font-semibold text-[#2C2D40]" htmlFor="password">Password</FieldLabel>
                    <Input 
                      id="password" 
                      type="password" 
                      placeholder="Min. 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required 
                      disabled={loading}
                      className="h-12 rounded-2xl border-[#D9DDE8] bg-[#F4F5FA] px-4 text-base"
                    />
                  </Field>
                  <Field>
                    <FieldLabel className="text-base font-semibold text-[#2C2D40]" htmlFor="confirm-password">
                      Confirm Password
                    </FieldLabel>
                    <Input 
                      id="confirm-password" 
                      type="password" 
                      placeholder="Re-enter password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required 
                      disabled={loading}
                      className="h-12 rounded-2xl border-[#D9DDE8] bg-[#F4F5FA] px-4 text-base"
                    />
                  </Field>
                </div>
                <FieldDescription className="text-xs text-[#8D96A8]">
                  Must be at least 8 characters long.
                </FieldDescription>
              </Field>
              {error && (
                <FieldDescription className="text-red-500">
                  {error}
                </FieldDescription>
              )}
              <Field>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-12 w-full rounded-2xl bg-gradient-to-r from-[#7C3AED] to-[#8B5CF6] text-base font-bold text-white hover:opacity-95"
                >
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
                <FieldDescription className="pt-2 text-center text-base text-[#6D7287]">
                  Already have an account? <a href="/login" className="font-semibold text-[#6D28D9] hover:underline">Log in</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-sm text-[#929AAD]">
        By clicking continue, you agree to our <a href="#" className="hover:underline">Terms of Service</a>{" "}
        and <a href="#" className="hover:underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
