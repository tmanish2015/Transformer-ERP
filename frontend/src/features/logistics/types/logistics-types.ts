import type { Tables } from '@/types/database.types'

export type Vehicle = Tables<'vehicles'>
export type Driver = Tables<'drivers'>
export type Trip = Tables<'trips'>
export type TripCost = Tables<'trip_costs'>
