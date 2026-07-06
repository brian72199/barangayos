import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import type { ApiAppropriation } from './appropriations'
import { getCurrentUser } from '@/auth/session'
import { createFinanceAuditLog } from './financeAudit'

const COLLECTION = 'disbursements'

export interface DisbursementData {
  appropriation?: string
  payee?: string
  disbursement_date?: string
  amount?: number
  check_no?: string
  or_no?: string
  particular?: string
  notes?: string
}

export interface ApiDisbursement extends RecordModel {
  appropriation: string
  payee: string
  disbursement_date: string
  amount: number
  check_no: string
  or_no: string
  particular: string
  notes: string
  created_by?: string
  created: string
  updated: string
  expand?: { appropriation?: ApiAppropriation }
}

export async function getDisbursements(startDate?: string, endDate?: string): Promise<ApiDisbursement[]> {
  try {
    let filter = ''
    const filters: string[] = []
    if (startDate) filters.push(`disbursement_date >= "${startDate}"`)
    if (endDate) filters.push(`disbursement_date <= "${endDate}"`)
    if (filters.length) filter = filters.join(' && ')
    return await getClient().collection<ApiDisbursement>(COLLECTION).getFullList({ filter, sort: '-disbursement_date', expand: 'appropriation' })
  } catch (e) { throw handleApiError(e) }
}

export async function getDisbursement(id: string): Promise<ApiDisbursement> {
  try { return await getClient().collection<ApiDisbursement>(COLLECTION).getOne(id, { expand: 'appropriation' }) }
  catch (e) { throw handleApiError(e) }
}

export async function createDisbursement(data: DisbursementData): Promise<ApiDisbursement> {
  try {
    const result = await getClient().collection<ApiDisbursement>(COLLECTION).create({
      ...data,
      created_by: getCurrentUser()?.id,
    })
    createFinanceAuditLog('create', COLLECTION, result.id, `created disbursements: ${data.particular || ''}`, data.amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function updateDisbursement(id: string, data: Partial<DisbursementData>): Promise<ApiDisbursement> {
  try {
    const result = await getClient().collection<ApiDisbursement>(COLLECTION).update(id, data)
    createFinanceAuditLog('update', COLLECTION, result.id, `updated disbursements`, result.amount)
    return result
  }
  catch (e) { throw handleApiError(e) }
}

export async function deleteDisbursement(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    createFinanceAuditLog('delete', COLLECTION, id, `deleted disbursements`)
    return true
  }
  catch (e) { throw handleApiError(e) }
}
