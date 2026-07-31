import { z } from 'zod'

export const rentalAssetCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
})
export type RentalAssetCategoryFormValues = z.infer<typeof rentalAssetCategorySchema>

export const rentalAssetSchema = z.object({
  category_id: z.string().optional().or(z.literal('')),
  name: z.string().min(1, 'Name is required'),
  serial_number: z.string().optional().or(z.literal('')),
  current_location: z.string().optional().or(z.literal('')),
  purchase_cost: z.coerce.number().min(0).optional(),
  daily_rental_rate: z.coerce.number().min(0),
  notes: z.string().optional().or(z.literal('')),
})
export type RentalAssetFormInput = z.input<typeof rentalAssetSchema>
export type RentalAssetFormValues = z.infer<typeof rentalAssetSchema>

export const rentalInquirySchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  category_id: z.string().optional().or(z.literal('')),
  requirement: z.string().min(1, 'Requirement is required'),
  required_from: z.string().optional().or(z.literal('')),
  required_to: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type RentalInquiryFormValues = z.infer<typeof rentalInquirySchema>

export const rentalQuotationItemSchema = z.object({
  rental_asset_id: z.string().min(1, 'Asset is required'),
  rental_days: z.coerce.number().int().positive('Days must be at least 1'),
  daily_rate: z.coerce.number().min(0),
  gst_rate: z.coerce.number().min(0).max(100),
})

export const rentalQuotationSchema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  rental_inquiry_id: z.string().optional().or(z.literal('')),
  quotation_date: z.string().min(1, 'Quotation date is required'),
  valid_until: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
  items: z.array(rentalQuotationItemSchema).min(1, 'Add at least one asset'),
})
export type RentalQuotationFormInput = z.input<typeof rentalQuotationSchema>
export type RentalQuotationFormValues = z.infer<typeof rentalQuotationSchema>

export const rentalBookingSchema = z.object({
  rental_asset_id: z.string().min(1, 'Asset is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  notes: z.string().optional().or(z.literal('')),
})
export type RentalBookingFormValues = z.infer<typeof rentalBookingSchema>

export const rentalAgreementSchema = z.object({
  security_deposit: z.coerce.number().min(0),
  late_return_charge_rate: z.coerce.number().min(0),
  operator_provided: z.boolean(),
  operator_charge_rate: z.coerce.number().min(0),
  fuel_charge_rate: z.coerce.number().min(0),
  notes: z.string().optional().or(z.literal('')),
})
export type RentalAgreementFormInput = z.input<typeof rentalAgreementSchema>
export type RentalAgreementFormValues = z.infer<typeof rentalAgreementSchema>

export const rentalDispatchSchema = z.object({
  vehicle_id: z.string().optional().or(z.literal('')),
  driver_id: z.string().optional().or(z.literal('')),
  dispatch_condition_notes: z.string().optional().or(z.literal('')),
})
export type RentalDispatchFormValues = z.infer<typeof rentalDispatchSchema>

export const rentalReturnSchema = z.object({
  vehicle_id: z.string().optional().or(z.literal('')),
  driver_id: z.string().optional().or(z.literal('')),
  return_condition_notes: z.string().optional().or(z.literal('')),
})
export type RentalReturnFormValues = z.infer<typeof rentalReturnSchema>

export const rentalInspectionSchema = z.object({
  condition_rating: z.enum(['good', 'fair', 'damaged']),
  notes: z.string().optional().or(z.literal('')),
})
export type RentalInspectionFormValues = z.infer<typeof rentalInspectionSchema>

export const rentalDamageAssessmentSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  estimated_repair_cost: z.coerce.number().min(0),
  charged_to_customer: z.boolean(),
})
export type RentalDamageAssessmentFormInput = z.input<typeof rentalDamageAssessmentSchema>
export type RentalDamageAssessmentFormValues = z.infer<typeof rentalDamageAssessmentSchema>
