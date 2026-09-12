import { z } from 'zod'

export const rentalAssetCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().or(z.literal('')),
})
export type RentalAssetCategoryFormValues = z.infer<typeof rentalAssetCategorySchema>

export const RENTAL_ASSET_MANUAL_STATUSES = ['available', 'booked', 'maintenance'] as const

export const rentalAssetSchema = z.object({
  name: z.string().min(1, 'Machine / Asset Name is required'),
  category_id: z.string().min(1, 'Category is required'),
  make: z.string().optional().or(z.literal('')),
  model: z.string().optional().or(z.literal('')),
  serial_number: z.string().optional().or(z.literal('')),
  capacity: z.string().optional().or(z.literal('')),
  daily_rental_rate: z.coerce.number().min(0),
  monthly_rental_rate: z.coerce.number().min(0),
  current_location: z.string().optional().or(z.literal('')),
  status: z.enum(RENTAL_ASSET_MANUAL_STATUSES),
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
  end_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})
export type RentalBookingFormValues = z.infer<typeof rentalBookingSchema>

export const rentalBookingReturnSchema = z.object({
  actual_return_date: z.string().min(1, 'Actual return date is required'),
  daily_rate: z.coerce.number().positive('Rate per day must be greater than 0'),
})
export type RentalBookingReturnFormInput = z.input<typeof rentalBookingReturnSchema>
export type RentalBookingReturnFormValues = z.infer<typeof rentalBookingReturnSchema>

export const rentalBookingInvoiceSchema = z.object({
  rental_days: z.coerce.number().int().positive('Days must be at least 1'),
  daily_rate: z.coerce.number().min(0),
  gst_rate: z.coerce.number().min(0).max(100),
})
export type RentalBookingInvoiceFormInput = z.input<typeof rentalBookingInvoiceSchema>
export type RentalBookingInvoiceFormValues = z.infer<typeof rentalBookingInvoiceSchema>

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
