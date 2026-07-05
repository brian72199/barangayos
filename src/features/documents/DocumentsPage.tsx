import { useState, useEffect, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, Search } from 'lucide-react'
import { getDocuments, createDocument, updateDocument, deleteDocument, getDailyQueueNumber, type ApiDocument } from '@/api/documents'
import { getResidents, type ApiResident } from '@/api/residents'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { hasRole } from '@/auth/session'
import { cn } from '@/lib/utils'

const documentTypeOptions = [
  { value: 'barangay_clearance', label: 'Barangay Clearance' },
  { value: 'business_permit', label: 'Business Permit' },
  { value: 'certificate_of_indigency', label: 'Certificate of Indigency' },
  { value: 'certificate_of_residency', label: 'Certificate of Residency' },
  { value: 'certificate_of_good_moral', label: 'Certificate of Good Moral' },
  { value: 'cedula', label: 'Cedula' },
  { value: 'other', label: 'Other' },
]

const statusOptions = ['pending', 'processing', 'for_release', 'released', 'cancelled']

const statusColors: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  for_release: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  released: 'bg-muted text-muted-foreground',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  for_release: 'For Release',
  released: 'Released',
  cancelled: 'Cancelled',
}

function emptyForm() {
  return {
    queue_number: '',
    resident_id: '',
    resident_name: '',
    document_type: '',
    other_document_type: '',
    purpose: '',
    notes: '',
  }
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<ApiDocument[]>([])
  const [residents, setResidents] = useState<ApiResident[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [residentSearch, setResidentSearch] = useState('')

  useEffect(() => {
    Promise.all([
      getDocuments(),
      getResidents(),
    ])
      .then(([docsData, residentsData]) => {
        setDocs(docsData)
        setResidents(residentsData)
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      if (search) {
        const q = search.toLowerCase()
        if (!d.queue_number.toLowerCase().includes(q) && !d.resident_name.toLowerCase().includes(q)) return false
      }
      if (statusFilter && d.status !== statusFilter) return false
      if (typeFilter && d.document_type !== typeFilter) return false
      return true
    })
  }, [docs, search, statusFilter, typeFilter])

  const filteredResidents = useMemo(() => {
    if (!residentSearch) return residents.slice(0, 10)
    const q = residentSearch.toLowerCase()
    return residents.filter((r) =>
      `${r.first_name} ${r.last_name} ${r.middle_name}`.toLowerCase().includes(q),
    ).slice(0, 10)
  }, [residents, residentSearch])

  function updateField(field: string, value: string) {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.document_type || !form.purpose.trim()) return
    if (!form.resident_id && !form.resident_name.trim()) return

    try {
      if (editingId) {
        const updated = await updateDocument(editingId, form)
        setDocs((prev) => prev.map((d) => (d.id === editingId ? updated : d)))
      } else {
        const qn = await getDailyQueueNumber()
        const created = await createDocument({ ...form, queue_number: qn, status: 'pending' })
        setDocs((prev) => [created, ...prev])
      }
      closePanel()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save document request')
    }
  }

  function openCreatePanel() {
    setError(null)
    setEditingId(null)
    setForm(emptyForm())
    setResidentSearch('')
    setPanelOpen(true)
  }

  function openEditPanel(record: ApiDocument) {
    setEditingId(record.id)
    setForm({
      queue_number: record.queue_number,
      resident_id: record.resident_id,
      resident_name: record.resident_name,
      document_type: record.document_type,
      other_document_type: record.other_document_type,
      purpose: record.purpose,
      notes: record.notes,
    })
    setPanelOpen(true)
    setError(null)
  }

  async function handleStatusChange(id: string, newStatus: string) {
    try {
      const payload: Partial<Record<string, unknown>> = { status: newStatus }
      if (newStatus === 'released') {
        payload.released_at = new Date().toISOString()
      }
      const updated = await updateDocument(id, payload)
      setDocs((prev) => prev.map((d) => (d.id === id ? updated : d)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  function handleDelete(id: string) {
    setDeletingId(id)
  }

  async function confirmDelete() {
    if (!deletingId) return
    try {
      await deleteDocument(deletingId)
      setDocs((prev) => prev.filter((d) => d.id !== deletingId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document request')
    } finally {
      setDeletingId(null)
    }
  }

  function closePanel() {
    setPanelOpen(false)
    setEditingId(null)
    setForm(emptyForm())
    setError(null)
  }

  function selectResident(r: ApiResident) {
    updateField('resident_id', r.id)
    updateField('resident_name', `${r.first_name} ${r.last_name}`)
    setResidentSearch(`${r.first_name} ${r.last_name}`)
  }

  const canModify = hasRole('admin', 'staff')

  return (
    <>
      <PageHeader title="Document Queue" subtitle="Manage document requests and track processing status.">
        {canModify && (
          <Button size="sm" className="gap-1.5 motion-press" onClick={openCreatePanel}>
            <Plus className="size-3.5" />
            New Request
          </Button>
        )}
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by queue # or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-60 max-w-full pl-8 text-sm"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v)}
          className="h-9 w-40 text-sm"
        >
          <option value="">All Statuses</option>
          {statusOptions.map((s) => (
            <option key={s} value={s}>{statusLabels[s]}</option>
          ))}
        </Select>
        <Select
          value={typeFilter}
          onValueChange={(v) => setTypeFilter(v)}
          className="h-9 w-44 text-sm"
        >
          <option value="">All Types</option>
          {documentTypeOptions.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Queue</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4 sm:p-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 rounded border p-3 motion-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                  <div className="h-4 w-16 flex-1 animate-pulse rounded bg-muted" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                  <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
                  <div className="h-8 w-20 animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <p className="text-sm text-muted-foreground">No document requests yet.</p>
              {canModify && (
                <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={openCreatePanel}>
                  <Plus className="size-3.5" />
                  Create first request
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                    <th className="px-4 py-3 sm:px-6">Queue #</th>
                    <th className="px-4 py-3 sm:px-6">Resident</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Document Type</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="hidden px-4 py-3 sm:table-cell sm:px-6">Requested</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={filteredDocs.length === 0 ? 'hidden' : ''}>
                  {filteredDocs.map((d, i) => (
                    <tr
                      key={d.id}
                      className="border-b last:border-b-0 even:bg-muted/20 motion-fade-in motion-slide-up"
                      style={{ '--stagger-index': i } as React.CSSProperties}
                    >
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm font-medium text-foreground">
                        #{d.queue_number}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-sm text-foreground">
                        {d.resident_name}
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground capitalize">
                        {d.document_type.replace(/_/g, ' ')}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium', statusColors[d.status])}>
                          {statusLabels[d.status]}
                        </span>
                      </td>
                      <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell sm:px-6 text-sm text-muted-foreground">
                        {new Date(d.requested_at).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 sm:px-6 text-right">
                        {canModify && (
                          <div className="flex justify-end gap-1">
                            {d.status === 'pending' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleStatusChange(d.id, 'processing')}
                              >
                                Process
                              </Button>
                            )}
                            {d.status === 'processing' && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => handleStatusChange(d.id, 'for_release')}
                              >
                                Ready
                              </Button>
                            )}
                            {d.status !== 'released' && d.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                                onClick={() => handleStatusChange(d.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0"
                              onClick={() => openEditPanel(d)}
                              aria-label="Edit"
                            >
                              <Pencil className="size-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 p-0 text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(d.id)}
                              aria-label="Delete"
                            >
                              <Trash2 className="size-3" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDocs.length === 0 && docs.length > 0 && (
                <div className="flex flex-col items-center py-12 text-center">
                  <p className="text-sm text-muted-foreground">No requests match your filters.</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {panelOpen && (
        <div className="fixed inset-0 z-40 flex max-md:flex-col max-md:justify-end md:justify-end">
          <div className="fixed inset-0 bg-black/40 motion-fade-in" onClick={closePanel} aria-hidden="true" />
          <div className="relative w-full bg-card shadow-xl motion-slide-up motion-fade-in overflow-y-auto md:max-w-md md:border-l md:border-border max-md:max-h-[85vh] max-md:rounded-t-2xl">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h2 className="text-sm font-semibold text-foreground">{editingId ? 'Edit Request' : 'New Document Request'}</h2>
              <button
                type="button"
                onClick={closePanel}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Close"
              >
                <ChevronDown className="size-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5 p-5">
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="panel-resident">Resident *</Label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="panel-resident"
                    placeholder="Search resident..."
                    value={residentSearch}
                    onChange={(e) => {
                      setResidentSearch(e.target.value)
                      if (!e.target.value) {
                        updateField('resident_id', '')
                        updateField('resident_name', '')
                      }
                    }}
                    className="h-9 pl-8 text-sm"
                  />
                  {residentSearch && !editingId && (
                    <div className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded-md border bg-card shadow-lg">
                      {filteredResidents.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">No residents found</p>
                      ) : (
                        filteredResidents.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            className="flex w-full items-center px-3 py-2 text-left text-sm hover:bg-accent"
                            onClick={() => selectResident(r)}
                          >
                            {r.first_name} {r.last_name}
                            {r.purok && (
                              <span className="ml-auto text-xs text-muted-foreground">{r.purok}</span>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-doc-type">Document Type *</Label>
                <Select
                  id="panel-doc-type"
                  value={form.document_type}
                  onValueChange={(v) => updateField('document_type', v)}
                >
                  <option value="">Select type</option>
                  {documentTypeOptions.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </Select>
              </div>

              {form.document_type === 'other' && (
                <div className="space-y-2">
                  <Label htmlFor="panel-other-type">Specify Document Type</Label>
                  <Input
                    id="panel-other-type"
                    value={form.other_document_type}
                    onChange={(e) => updateField('other_document_type', e.target.value)}
                    placeholder="Enter document type"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="panel-purpose">Purpose *</Label>
                <textarea
                  id="panel-purpose"
                  value={form.purpose}
                  onChange={(e) => updateField('purpose', e.target.value)}
                  rows={3}
                  required
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="State the purpose of the request..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel-notes">Notes</Label>
                <textarea
                  id="panel-notes"
                  value={form.notes}
                  onChange={(e) => updateField('notes', e.target.value)}
                  rows={2}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="submit">{editingId ? 'Update' : 'Create Request'}</Button>
                <Button type="button" variant="outline" onClick={closePanel}>Cancel</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deletingId !== null}
        title="Delete request"
        message="This action cannot be undone. The document request will be permanently removed."
        confirmLabel="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeletingId(null)}
      />
    </>
  )
}
