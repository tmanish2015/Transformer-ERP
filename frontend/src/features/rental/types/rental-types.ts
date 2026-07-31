import type { Tables } from '@/types/database.types'

export type RentalAssetCategory = Tables<'rental_asset_categories'>
export type RentalAsset = Tables<'rental_assets'>
export type RentalAssetStatusLog = Tables<'rental_asset_status_log'>
export type RentalInquiry = Tables<'rental_inquiries'>
export type RentalQuotation = Tables<'rental_quotations'>
export type RentalQuotationItem = Tables<'rental_quotation_items'>
export type RentalBooking = Tables<'rental_bookings'>
export type RentalAgreement = Tables<'rental_agreements'>
export type RentalDispatch = Tables<'rental_dispatches'>
export type RentalReturn = Tables<'rental_returns'>
export type RentalInspection = Tables<'rental_inspections'>
export type RentalDamageAssessment = Tables<'rental_damage_assessments'>

export type RentalAssetStatus = 'available' | 'booked' | 'dispatched' | 'running' | 'returned' | 'maintenance' | 'retired'
export type RentalInquiryStatus = 'open' | 'quoted' | 'converted' | 'closed'
export type RentalQuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type RentalBookingStatus = 'confirmed' | 'cancelled' | 'completed'
export type RentalAgreementStatus = 'active' | 'completed' | 'terminated'
export type RentalConditionRating = 'good' | 'fair' | 'damaged'

export const RENTAL_ASSET_STATUS_LABELS: Record<RentalAssetStatus, string> = {
  available: 'Available',
  booked: 'Booked',
  dispatched: 'Dispatched',
  running: 'Running',
  returned: 'Returned',
  maintenance: 'Maintenance',
  retired: 'Retired',
}

export const RENTAL_INQUIRY_STATUS_LABELS: Record<RentalInquiryStatus, string> = {
  open: 'Open',
  quoted: 'Quoted',
  converted: 'Converted',
  closed: 'Closed',
}

export const RENTAL_QUOTATION_STATUS_LABELS: Record<RentalQuotationStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  accepted: 'Accepted',
  rejected: 'Rejected',
  expired: 'Expired',
}

export const RENTAL_BOOKING_STATUS_LABELS: Record<RentalBookingStatus, string> = {
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
}

export const RENTAL_AGREEMENT_STATUS_LABELS: Record<RentalAgreementStatus, string> = {
  active: 'Active',
  completed: 'Completed',
  terminated: 'Terminated',
}

export const RENTAL_CONDITION_RATING_LABELS: Record<RentalConditionRating, string> = {
  good: 'Good',
  fair: 'Fair',
  damaged: 'Damaged',
}

export interface NamedRef {
  id: string
  name: string
}

export interface RentalAssetWithCategory extends RentalAsset {
  category: NamedRef | null
}

export interface RentalInquiryWithRelations extends RentalInquiry {
  customer: NamedRef
  category: NamedRef | null
}

export interface RentalQuotationWithRelations extends RentalQuotation {
  customer: NamedRef
  rental_inquiry: { id: string; inquiry_number: string } | null
}

export interface RentalQuotationItemWithAsset extends RentalQuotationItem {
  rental_asset: { id: string; asset_code: string; name: string }
}

export interface RentalBookingWithRelations extends RentalBooking {
  customer: NamedRef
  rental_asset: { id: string; asset_code: string; name: string }
  rental_quotation: { id: string; quotation_number: string } | null
}

export interface RentalAgreementWithRelations extends RentalAgreement {
  customer: NamedRef
  rental_asset: { id: string; asset_code: string; name: string; status: string }
  rental_booking: { id: string; booking_number: string }
}
