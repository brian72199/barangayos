import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ExpenseClassCardProps {
  title: string
  appropriated: number
  obligated: number
  disbursed: number
  itemCount: number
  detailMode?: 'detailed' | 'compact'
}

export function ExpenseClassCard({ title, appropriated, obligated, disbursed, itemCount, detailMode = 'detailed' }: ExpenseClassCardProps) {
  const obligatedPct = appropriated > 0 ? Math.round((obligated / appropriated) * 100) : 0
  const disbursedPct = appropriated > 0 ? Math.round((disbursed / appropriated) * 100) : 0
  const f = (n: number) => '₱' + n.toLocaleString()

  if (detailMode === 'compact') {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-xs font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 text-lg font-bold text-foreground tabular-nums">{f(appropriated)}</p>
          <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-gold transition-all" style={{ width: `${Math.min(obligatedPct, 100)}%` }} />
          </div>
          <p className="mt-1 text-[10px] text-muted-foreground">{obligatedPct}% utilized</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Obligated</span>
            <span>{f(obligated)} / {f(appropriated)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(obligatedPct, 100)}%` }} />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Disbursed</span>
            <span>{f(disbursed)} / {f(appropriated)}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.min(disbursedPct, 100)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground pt-1">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>
      </CardContent>
    </Card>
  )
}
