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
      {/* Woven banig background — subtle diagonal cross-hatch */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            'repeating-linear-gradient(45deg, transparent 0 23px, color-mix(in srgb, var(--bamboo) 6%, transparent) 23px 24px)',
            'repeating-linear-gradient(-45deg, transparent 0 23px, color-mix(in srgb, var(--gold) 3%, transparent) 23px 24px)',
          ].join(', '),
        }}
        aria-hidden="true"
      />

      {/* Warm ambient glow from top */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% -20%, color-mix(in srgb, var(--gold) 8%, transparent) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* Tri-color flag stripe anchored to the bottom edge */}
      <div className="pointer-events-none fixed bottom-0 left-0 right-0 flex h-[3px]" aria-hidden="true">
        <div className="h-full w-[34%] bg-red-pinoy/50" />
        <div className="h-full w-[32%] bg-gold/50" />
        <div className="h-full w-[34%] bg-barangay/50" />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-sm">
        {/* Logo + heading — side by side, no more floating giant seal */}
        <div className="flex items-center gap-4 motion-fade-in">
          <img
            src="/logo.png"
            alt="BarangayOS"
            className="size-14 shrink-0 object-contain"
          />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-narra">
              {greeting}
            </p>
            <h1 className="mt-0.5 font-display text-2xl font-semibold tracking-tight text-barangay">
              BarangayOS
            </h1>
            <p className="mt-px text-xs text-muted-foreground">
              Barangay Records Management System
            </p>
          </div>
        </div>

        {/* Form card — sharp edges, consistent with app language */}
        <div className="mt-8 border border-border bg-card motion-fade-in motion-slide-up">
          <div className="p-6 sm:p-8">
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
                <div className="flex items-start gap-2 border border-red-pinoy/20 bg-red-pinoy/5 px-3.5 py-2.5 text-sm text-red-pinoy motion-scale-in">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                size="lg"
                className="w-full gap-2 text-base transition-all duration-200"
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

        <p className="mt-6 text-center text-xs text-muted-foreground/40 motion-fade-in" style={{ animationDelay: '400ms' }}>
          Version 1.0 — Empowering barangay records management
        </p>
      </div>
    </div>
  )
}
