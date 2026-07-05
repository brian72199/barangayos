import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'
import { logActivity } from './activity'

const COLLECTION = 'visitor_logs'

export interface VisitorData {
  visitor_name: string
  contact_number?: string
  purpose: string
  person_to_visit?: string
  time_out?: string
}

export interface ApiVisitor extends RecordModel {
  visitor_name: string
  contact_number: string
  purpose: string
  person_to_visit: string
  time_in: string
  time_out: string
  updated: string
}

export async function getVisitors(): Promise<ApiVisitor[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiVisitor>({ sort: '-time_in' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getVisitor(id: string): Promise<ApiVisitor> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiVisitor>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createVisitor(data: VisitorData): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).create<ApiVisitor>(data)
    logActivity('create', COLLECTION, result.id, `Visitor logged in: ${result.visitor_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateVisitor(id: string, data: Partial<VisitorData>): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiVisitor>(id, data)
    logActivity('update', COLLECTION, id, `Updated visitor: ${result.visitor_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteVisitor(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    logActivity('delete', COLLECTION, id, `Deleted visitor log`)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function checkOutVisitor(id: string): Promise<ApiVisitor> {
  try {
    const result = await getClient().collection(COLLECTION).update<ApiVisitor>(id, {
      time_out: new Date().toISOString(),
    })
    logActivity('update', COLLECTION, id, `Visitor checked out: ${result.visitor_name}`)
    return result
  } catch (err) {
    throw handleApiError(err)
  }
}
