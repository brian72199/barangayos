import { useState } from 'react'
import { useNavigate } from 'react-router'
import { AlertCircle, ArrowRight } from 'lucide-react'
import { login } from './session'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Magandang Umaga'
  if (hour < 18) return 'Magandang Hapon'
  return 'Magandang Gabi'
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [greeting] = useState(getGreeting)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-capiz px-4 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,color-mix(in_srgb,var(--gold)_6%,transparent)_0%,transparent_70%)]" aria-hidden="true" />
      <div className="relative w-full max-w-sm">
        <div className="flex justify-center motion-scale-in">
          <div className="flex size-16 items-center justify-center rounded-full border-2 border-gold/30 bg-gold/5">
            <span className="text-2xl font-bold tracking-tight text-gold">B</span>
          </div>
        </div>

        <div className="mt-5 text-center motion-fade-in motion-slide-up" style={{ animationDelay: '100ms' }}>
          <p className="text-sm font-medium tracking-[0.15em] text-narra uppercase">
            {greeting}
          </p>
          <div className="mx-auto mt-2 h-0.5 w-8 rounded-full bg-gold/60" aria-hidden="true" />
        </div>

        <div className="mt-8 motion-fade-in motion-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="rounded-2xl border border-bamboo bg-card p-6 shadow-sm shadow-md ring-1 ring-transparent transition-shadow duration-200 focus-within:shadow-md focus-within:ring-gold/20 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@barangay.gov.ph"
                  className="text-base"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="text-base"
                />
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-pinoy/20 bg-red-pinoy/5 px-3.5 py-2.5 text-sm text-red-pinoy motion-scale-in">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full gap-2 text-base transition-all duration-200"
                style={{ width: loading ? '10rem' : undefined }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Signing in...
                  </span>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="size-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center text-[11px] text-muted-foreground/30 motion-fade-in" style={{ animationDelay: '400ms' }}>
          BarangayOS
        </p>
      </div>
    </div>
  )
}
