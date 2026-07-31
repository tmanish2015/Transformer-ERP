import { supabase } from '@/lib/supabase'
import type { DriverFormValues, TripFormValues, VehicleFormValues } from '@/features/logistics/schemas/logistics-schemas'
import type { Driver, Trip, Vehicle } from '@/features/logistics/types/logistics-types'

export interface TripWithDetails extends Trip {
  vehicle: { id: string; registration_no: string } | null
  driver: { id: string; name: string } | null
}

// ---------- Vehicles ----------

export async function fetchVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase.from('vehicles').select('*').order('registration_no')
  if (error) throw error
  return data
}

export async function createVehicle(values: VehicleFormValues) {
  const { data, error } = await supabase.from('vehicles').insert({ registration_no: values.registration_no, type: values.type || null }).select().single()
  if (error) throw error
  return data
}

export async function updateVehicle(id: string, values: Partial<VehicleFormValues> & { is_active?: boolean }) {
  const { data, error } = await supabase
    .from('vehicles')
    .update({
      ...(values.registration_no !== undefined ? { registration_no: values.registration_no } : {}),
      ...(values.type !== undefined ? { type: values.type || null } : {}),
      ...(values.is_active !== undefined ? { is_active: values.is_active } : {}),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteVehicle(id: string) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id)
  if (error) throw error
}

// ---------- Drivers ----------

export async function fetchDrivers(): Promise<Driver[]> {
  const { data, error } = await supabase.from('drivers').select('*').order('name')
  if (error) throw error
  return data
}

export async function createDriver(values: DriverFormValues) {
  const { data, error } = await supabase.from('drivers').insert({ name: values.name, license_no: values.license_no || null }).select().single()
  if (error) throw error
  return data
}

export async function updateDriver(id: string, values: Partial<DriverFormValues> & { is_active?: boolean }) {
  const { data, error } = await supabase
    .from('drivers')
    .update({
      ...(values.name !== undefined ? { name: values.name } : {}),
      ...(values.license_no !== undefined ? { license_no: values.license_no || null } : {}),
      ...(values.is_active !== undefined ? { is_active: values.is_active } : {}),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteDriver(id: string) {
  const { error } = await supabase.from('drivers').delete().eq('id', id)
  if (error) throw error
}

// ---------- Trips ----------

export async function fetchTrip(id: string): Promise<TripWithDetails> {
  const { data, error } = await supabase.from('trips').select('*, vehicle:vehicles(id,registration_no), driver:drivers(id,name)').eq('id', id).single()
  if (error) throw error
  return data
}

export async function createTrip(tripType: 'pickup' | 'delivery', referenceType: string, referenceId: string, values: TripFormValues): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert({
      trip_type: tripType,
      reference_type: referenceType,
      reference_id: referenceId,
      vehicle_id: values.vehicle_id || null,
      driver_id: values.driver_id || null,
      notes: values.notes || null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}
