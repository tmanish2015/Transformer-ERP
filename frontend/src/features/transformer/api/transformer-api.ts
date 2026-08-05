import { supabase } from '@/lib/supabase'
import type { TransformerWithCustomer } from '@/features/transformer/types/transformer-types'
import type { TransformerFormValues } from '@/features/transformer/schemas/transformer-schema'

const TABLE = 'transformers'

/**
 * The `transformers.serial_no` column is NOT NULL (matches the provisioned schema).
 * The form treats serial_no as optional, so when the user leaves it blank we generate a
 * deterministic, human-readable default from the required registration_no (guaranteed
 * unique per company) rather than sending null and tripping the NOT NULL constraint.
 */
function resolveSerialNo(serialNo: string | null | undefined, registrationNo: string): string {
  const trimmed = (serialNo ?? '').trim()
  if (trimmed) return trimmed
  const base = registrationNo.trim() || 'TFR'
  // registration_no is unique per company, so "<reg>-SER" is unique too.
  return `${base}-SER`
}

async function assertRegistrationNoUnique(registrationNo: string, excludeId?: string) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id')
    .eq('registration_no', registrationNo)
    .maybeSingle()

  if (error) throw error
  if (data && data.id !== excludeId) {
    throw new Error(`Registration No "${registrationNo}" already exists. Please use a unique value.`)
  }
}

export const transformerApi = {
  list: async (): Promise<TransformerWithCustomer[]> => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*, customer:customers(id,name)')
      .order('registration_no')

    if (error) throw error
    return data as TransformerWithCustomer[]
  },

create: async (values: TransformerFormValues) => {
    await assertRegistrationNoUnique(values.registration_no)

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        customer_id: values.customer_id,
        registration_no: values.registration_no,
        serial_no: resolveSerialNo(values.serial_no, values.registration_no),
        make: values.make || null,
        model: values.model || null,
        capacity_kva: values.capacity_kva,
        voltage_ratio: values.voltage_ratio || null,
        phase: values.phase || null,
        cooling_type: values.cooling_type || null,
        manufacturer: values.manufacturer || null,
        manufacturing_year: values.manufacturing_year ?? null,
        installation_date: values.installation_date || null,
        location: values.location || null,
        current_status: values.current_status,
        warranty_expiry: values.warranty_expiry || null,
        remarks: values.remarks || null,
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  update: async (id: string, values: TransformerFormValues) => {
    await assertRegistrationNoUnique(values.registration_no, id)

    const { data, error } = await supabase
      .from(TABLE)
.update({
        customer_id: values.customer_id,
        registration_no: values.registration_no,
        serial_no: resolveSerialNo(values.serial_no, values.registration_no),
        make: values.make || null,
        model: values.model || null,
        capacity_kva: values.capacity_kva,
        voltage_ratio: values.voltage_ratio || null,
        phase: values.phase || null,
        cooling_type: values.cooling_type || null,
        manufacturer: values.manufacturer || null,
        manufacturing_year: values.manufacturing_year ?? null,
        installation_date: values.installation_date || null,
        location: values.location || null,
        current_status: values.current_status,
        warranty_expiry: values.warranty_expiry || null,
        remarks: values.remarks || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  remove: async (id: string) => {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)

    if (error) throw error
  },
}
