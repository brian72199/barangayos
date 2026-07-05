import type { RecordModel } from 'pocketbase'
import { getClient } from './client'
import { handleApiError } from './errorHandler'

const COLLECTION = 'households'

export interface HouseholdData {
  household_number: string
  purok?: string
  head_name: string
  address?: string
  notes?: string
}

export interface ApiHousehold extends RecordModel {
  household_number: string
  purok: string
  head_name: string
  address: string
  notes: string
  updated: string
}

export async function getHouseholds(): Promise<ApiHousehold[]> {
  try {
    return await getClient().collection(COLLECTION).getFullList<ApiHousehold>({ sort: 'household_number' })
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function getHousehold(id: string): Promise<ApiHousehold> {
  try {
    return await getClient().collection(COLLECTION).getOne<ApiHousehold>(id)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function createHousehold(data: HouseholdData): Promise<ApiHousehold> {
  try {
    return await getClient().collection(COLLECTION).create<ApiHousehold>(data)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function updateHousehold(id: string, data: Partial<HouseholdData>): Promise<ApiHousehold> {
  try {
    return await getClient().collection(COLLECTION).update<ApiHousehold>(id, data)
  } catch (err) {
    throw handleApiError(err)
  }
}

export async function deleteHousehold(id: string): Promise<boolean> {
  try {
    await getClient().collection(COLLECTION).delete(id)
    return true
  } catch (err) {
    throw handleApiError(err)
  }
}
