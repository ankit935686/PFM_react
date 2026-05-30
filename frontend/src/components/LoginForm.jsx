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

export function LoginForm({
  className,
  ...props
}) {
  const navigate = useNavigate()
  const { login, loginWithGoogle } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      await login(email, password)
      navigate("/dashboard")
    } catch (authError) {
      setError(getFirebaseAuthErrorMessage(authError))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
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
      <Card className="rounded-3xl border border-[var(--border)] bg-[var(--bg-card)] py-4 shadow-none">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black text-[var(--text-primary)]">Welcome back</CardTitle>
          <CardDescription className="text-base text-[var(--text-secondary)]">
            Login with your Google account or email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup className="gap-6">
              <Field>
                <Button 
                  variant="outline" 
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="h-12 w-full rounded-2xl border-[var(--border)] bg-[var(--bg-elevated)] text-[15px] font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 mr-2">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor" />
                  </svg>
                  Login with Google
                </Button>
              </Field>
              <FieldSeparator className="text-[var(--text-muted)] [&_[data-slot=field-separator-content]]:bg-[var(--bg-card)]">
                Or continue with
              </FieldSeparator>
              <Field>
                <FieldLabel className="text-base font-semibold text-[var(--text-primary)]" htmlFor="email">Email</FieldLabel>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                  disabled={loading}
                  className="h-12 rounded-2xl border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-base text-[var(--text-primary)] focus:border-[var(--accent)]"
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel className="text-base font-semibold text-[var(--text-primary)]" htmlFor="password">Password</FieldLabel>
                  <a href="#" className="ml-auto text-base font-semibold text-[var(--accent)] underline-offset-4 hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                  disabled={loading}
                  className="h-12 rounded-2xl border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-base text-[var(--text-primary)] focus:border-[var(--accent)]"
                />
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
                  className="h-12 w-full rounded-2xl bg-[var(--accent)] text-base font-bold text-white hover:bg-[var(--accent-hover)]"
                >
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="pt-2 text-center text-base text-[var(--text-secondary)]">
                  Don&apos;t have an account? <a href="/signup" className="hover:underline">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center text-sm text-[var(--text-muted)]">
        By clicking continue, you agree to our <a href="#" className="hover:underline">Terms of Service</a>{" "}
        and <a href="#" className="hover:underline">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}
