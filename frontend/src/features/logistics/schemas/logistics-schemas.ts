import { z } from 'zod'

export const vehicleSchema = z.object({
  registration_no: z.string().min(1, 'Registration number is required'),
  type: z.string().optional().or(z.literal('')),
})
export type VehicleFormValues = z.infer<typeof vehicleSchema>

export const driverSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  license_no: z.string().optional().or(z.literal('')),
})
export type DriverFormValues = z.infer<typeof driverSchema>

export const tripSchema = z.object({
  vehicle_id: z.string().optional().or(z.literal('')),
  driver_id: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type TripFormValues = z.infer<typeof tripSchema>
