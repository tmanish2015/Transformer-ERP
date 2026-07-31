// Hand-written to match database/migrations/*.sql exactly, in the same shape the
// Supabase CLI's `supabase gen types typescript` would produce. Replace this file by
// running that command against the provisioned project once it exists — do not
// hand-edit past that point. Extend this file as each new migration lands in the
// meantime so the frontend always type-checks against the real schema.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string
          name: string
          industry_type: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          industry_type: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['companies']['Insert']>
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          key: string
          name: string
          description: string | null
          is_system: boolean
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          name: string
          description?: string | null
          is_system?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['roles']['Insert']>
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          key: string
          module: string
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          key: string
          module: string
          description?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['permissions']['Insert']>
        Relationships: []
      }
      role_permissions: {
        Row: { role_id: string; permission_id: string }
        Insert: { role_id: string; permission_id: string }
        Update: Partial<Database['public']['Tables']['role_permissions']['Insert']>
        Relationships: [
          { foreignKeyName: 'role_permissions_role_id_fkey'; columns: ['role_id']; referencedRelation: 'roles'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'role_permissions_permission_id_fkey'; columns: ['permission_id']; referencedRelation: 'permissions'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      profiles: {
        Row: {
          id: string
          company_id: string | null
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role_id: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          company_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role_id: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
        Relationships: [
          { foreignKeyName: 'profiles_role_id_fkey'; columns: ['role_id']; referencedRelation: 'roles'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'profiles_company_id_fkey'; columns: ['company_id']; referencedRelation: 'companies'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      plans: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          monthly_price: number
          yearly_price: number
          trial_days: number
          max_users: number | null
          max_branches: number | null
          max_warehouses: number | null
          storage_limit_gb: number | null
          status: string
          sequence: number
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['plans']['Row']> & { code: string; name: string }
        Update: Partial<Database['public']['Tables']['plans']['Row']>
        Relationships: []
      }
      industry_packs: {
        Row: { id: string; code: string; name: string; description: string | null; status: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['industry_packs']['Row']> & { code: string; name: string }
        Update: Partial<Database['public']['Tables']['industry_packs']['Row']>
        Relationships: []
      }
      modules: {
        Row: {
          id: string
          code: string
          name: string
          icon: string | null
          sequence: number
          category: string | null
          description: string | null
          status: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['modules']['Row']> & { code: string; name: string }
        Update: Partial<Database['public']['Tables']['modules']['Row']>
        Relationships: []
      }
      module_dependencies: {
        Row: { module_id: string; depends_on_module_id: string }
        Insert: { module_id: string; depends_on_module_id: string }
        Update: Partial<Database['public']['Tables']['module_dependencies']['Insert']>
        Relationships: []
      }
      features: {
        Row: { id: string; module_id: string; code: string; name: string; description: string | null; status: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['features']['Row']> & { module_id: string; code: string; name: string }
        Update: Partial<Database['public']['Tables']['features']['Row']>
        Relationships: [
          { foreignKeyName: 'features_module_id_fkey'; columns: ['module_id']; referencedRelation: 'modules'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      industry_pack_modules: {
        Row: { industry_pack_id: string; module_id: string }
        Insert: { industry_pack_id: string; module_id: string }
        Update: Partial<Database['public']['Tables']['industry_pack_modules']['Insert']>
        Relationships: []
      }
      plan_modules: {
        Row: { plan_id: string; module_id: string }
        Insert: { plan_id: string; module_id: string }
        Update: Partial<Database['public']['Tables']['plan_modules']['Insert']>
        Relationships: []
      }
      plan_features: {
        Row: { plan_id: string; feature_id: string }
        Insert: { plan_id: string; feature_id: string }
        Update: Partial<Database['public']['Tables']['plan_features']['Insert']>
        Relationships: []
      }
      addons: {
        Row: {
          id: string
          code: string
          name: string
          description: string | null
          monthly_price: number
          yearly_price: number
          status: string
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['addons']['Row']> & { code: string; name: string }
        Update: Partial<Database['public']['Tables']['addons']['Row']>
        Relationships: []
      }
      license_customers: {
        Row: {
          id: string
          company_id: string
          industry_pack_id: string | null
          status: string
          license_key: string
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['license_customers']['Row']> & { company_id: string }
        Update: Partial<Database['public']['Tables']['license_customers']['Row']>
        Relationships: [
          { foreignKeyName: 'license_customers_company_id_fkey'; columns: ['company_id']; referencedRelation: 'companies'; referencedColumns: ['id']; isOneToOne: true },
        ]
      }
      customer_subscriptions: {
        Row: {
          id: string
          customer_id: string
          plan_id: string
          billing_cycle: string
          start_date: string
          end_date: string | null
          trial_ends_at: string | null
          status: string
          auto_renew: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['customer_subscriptions']['Row']> & { customer_id: string; plan_id: string }
        Update: Partial<Database['public']['Tables']['customer_subscriptions']['Row']>
        Relationships: []
      }
      customer_modules: {
        Row: { customer_id: string; module_id: string; enabled: boolean; source: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['customer_modules']['Row']> & { customer_id: string; module_id: string }
        Update: Partial<Database['public']['Tables']['customer_modules']['Row']>
        Relationships: []
      }
      customer_features: {
        Row: { customer_id: string; feature_id: string; enabled: boolean; source: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['customer_features']['Row']> & { customer_id: string; feature_id: string }
        Update: Partial<Database['public']['Tables']['customer_features']['Row']>
        Relationships: []
      }
      customer_addons: {
        Row: { customer_id: string; addon_id: string; status: string; billing_cycle: string; start_date: string; end_date: string | null }
        Insert: Partial<Database['public']['Tables']['customer_addons']['Row']> & { customer_id: string; addon_id: string }
        Update: Partial<Database['public']['Tables']['customer_addons']['Row']>
        Relationships: []
      }
      licenses: {
        Row: {
          id: string
          customer_id: string
          license_key: string
          issued_at: string
          expires_at: string | null
          status: string
          max_users: number | null
          max_branches: number | null
          max_warehouses: number | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['licenses']['Row']> & { customer_id: string; license_key: string }
        Update: Partial<Database['public']['Tables']['licenses']['Row']>
        Relationships: []
      }
      license_logs: {
        Row: { id: string; license_id: string; event: string; notes: string | null; created_at: string }
        Insert: Partial<Database['public']['Tables']['license_logs']['Row']> & { license_id: string; event: string }
        Update: Partial<Database['public']['Tables']['license_logs']['Row']>
        Relationships: []
      }
      units: {
        Row: { id: string; company_id: string; name: string; short_code: string; is_active: boolean; created_at: string }
        Insert: Partial<Database['public']['Tables']['units']['Row']> & { name: string; short_code: string }
        Update: Partial<Database['public']['Tables']['units']['Row']>
        Relationships: []
      }
      categories: {
        Row: { id: string; company_id: string; name: string; parent_id: string | null; description: string | null; is_active: boolean; created_at: string }
        Insert: Partial<Database['public']['Tables']['categories']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['categories']['Row']>
        Relationships: [
          { foreignKeyName: 'categories_parent_id_fkey'; columns: ['parent_id']; referencedRelation: 'categories'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      brands: {
        Row: { id: string; company_id: string; name: string; logo_url: string | null; is_active: boolean; created_at: string }
        Insert: Partial<Database['public']['Tables']['brands']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['brands']['Row']>
        Relationships: []
      }
      warehouses: {
        Row: {
          id: string
          company_id: string
          name: string
          code: string
          address: string | null
          city: string | null
          state: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['warehouses']['Row']> & { name: string; code: string }
        Update: Partial<Database['public']['Tables']['warehouses']['Row']>
        Relationships: []
      }
      suppliers: {
        Row: {
          id: string
          company_id: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          address: string | null
          gstin: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['suppliers']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['suppliers']['Row']>
        Relationships: []
      }
      products: {
        Row: {
          id: string
          company_id: string
          sku: string
          name: string
          description: string | null
          category_id: string | null
          brand_id: string | null
          unit_id: string
          hsn_code: string | null
          gst_rate: number
          purchase_price: number
          selling_price: number
          barcode: string | null
          image_url: string | null
          reorder_level: number
          reorder_quantity: number
          is_batch_tracked: boolean
          is_serial_tracked: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['products']['Row']> & { sku: string; name: string; unit_id: string }
        Update: Partial<Database['public']['Tables']['products']['Row']>
        Relationships: [
          { foreignKeyName: 'products_category_id_fkey'; columns: ['category_id']; referencedRelation: 'categories'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'products_brand_id_fkey'; columns: ['brand_id']; referencedRelation: 'brands'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'products_unit_id_fkey'; columns: ['unit_id']; referencedRelation: 'units'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      product_suppliers: {
        Row: { company_id: string; product_id: string; supplier_id: string; supplier_sku: string | null; cost_price: number | null; is_preferred: boolean; created_at: string }
        Insert: Partial<Database['public']['Tables']['product_suppliers']['Row']> & { product_id: string; supplier_id: string }
        Update: Partial<Database['public']['Tables']['product_suppliers']['Row']>
        Relationships: [
          { foreignKeyName: 'product_suppliers_supplier_id_fkey'; columns: ['supplier_id']; referencedRelation: 'suppliers'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      product_batches: {
        Row: {
          id: string
          company_id: string
          product_id: string
          warehouse_id: string
          batch_number: string
          manufacture_date: string | null
          expiry_date: string | null
          quantity: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['product_batches']['Row']> & { product_id: string; warehouse_id: string; batch_number: string }
        Update: Partial<Database['public']['Tables']['product_batches']['Row']>
        Relationships: [
          { foreignKeyName: 'product_batches_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'product_batches_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      serial_numbers: {
        Row: {
          id: string
          company_id: string
          product_id: string
          serial_no: string
          current_status: string
          current_warehouse_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['serial_numbers']['Row']> & { product_id: string; serial_no: string }
        Update: Partial<Database['public']['Tables']['serial_numbers']['Row']>
        Relationships: [
          { foreignKeyName: 'serial_numbers_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'serial_numbers_current_warehouse_id_fkey'; columns: ['current_warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      scrap_entries: {
        Row: {
          id: string
          company_id: string
          product_id: string
          warehouse_id: string
          quantity: number
          reason: string
          scrapped_at: string
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['scrap_entries']['Row']> & { product_id: string; warehouse_id: string; quantity: number; reason: string }
        Update: Partial<Database['public']['Tables']['scrap_entries']['Row']>
        Relationships: [
          { foreignKeyName: 'scrap_entries_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'scrap_entries_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      stock_levels: {
        Row: { company_id: string; product_id: string; warehouse_id: string; quantity: number; updated_at: string }
        Insert: Partial<Database['public']['Tables']['stock_levels']['Row']> & { product_id: string; warehouse_id: string }
        Update: Partial<Database['public']['Tables']['stock_levels']['Row']>
        Relationships: [
          { foreignKeyName: 'stock_levels_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'stock_levels_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      stock_movements: {
        Row: {
          id: string
          company_id: string
          product_id: string
          warehouse_id: string
          batch_id: string | null
          serial_number_id: string | null
          movement_type: string
          quantity: number
          reference_type: string | null
          reference_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['stock_movements']['Row']> & { product_id: string; warehouse_id: string; movement_type: string; quantity: number }
        Update: Partial<Database['public']['Tables']['stock_movements']['Row']>
        Relationships: [
          { foreignKeyName: 'stock_movements_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'stock_movements_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      document_sequences: {
        Row: { company_id: string; sequence_key: string; last_value: number }
        Insert: Partial<Database['public']['Tables']['document_sequences']['Row']> & { sequence_key: string }
        Update: Partial<Database['public']['Tables']['document_sequences']['Row']>
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          id: string
          company_id: string
          code: string
          name: string
          account_type: string
          account_group: string
          parent_id: string | null
          is_group: boolean
          opening_balance: number
          opening_balance_type: string
          is_system: boolean
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['chart_of_accounts']['Row']> & { code: string; name: string; account_type: string; account_group: string }
        Update: Partial<Database['public']['Tables']['chart_of_accounts']['Row']>
        Relationships: [
          { foreignKeyName: 'chart_of_accounts_parent_id_fkey'; columns: ['parent_id']; referencedRelation: 'chart_of_accounts'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      journal_entries: {
        Row: {
          id: string
          company_id: string
          entry_number: string
          voucher_type: string
          entry_date: string
          narration: string | null
          reference_type: string | null
          reference_id: string | null
          party_type: string | null
          party_id: string | null
          payment_method: string | null
          cheque_number: string | null
          cheque_date: string | null
          status: string
          approval_status: string
          approved_by: string | null
          approved_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['journal_entries']['Row']>
        Update: Partial<Database['public']['Tables']['journal_entries']['Row']>
        Relationships: []
      }
      journal_entry_lines: {
        Row: {
          id: string
          company_id: string
          journal_entry_id: string
          account_id: string
          debit: number
          credit: number
          description: string | null
          is_reconciled: boolean
          reconciled_at: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['journal_entry_lines']['Row']> & { journal_entry_id: string; account_id: string }
        Update: Partial<Database['public']['Tables']['journal_entry_lines']['Row']>
        Relationships: [
          { foreignKeyName: 'journal_entry_lines_journal_entry_id_fkey'; columns: ['journal_entry_id']; referencedRelation: 'journal_entries'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'journal_entry_lines_account_id_fkey'; columns: ['account_id']; referencedRelation: 'chart_of_accounts'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      purchase_orders: {
        Row: {
          id: string
          company_id: string
          po_number: string
          supplier_id: string
          warehouse_id: string
          status: string
          order_date: string
          expected_date: string | null
          notes: string | null
          subtotal: number
          tax_total: number
          total: number
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['purchase_orders']['Row']> & { supplier_id: string; warehouse_id: string }
        Update: Partial<Database['public']['Tables']['purchase_orders']['Row']>
        Relationships: [
          { foreignKeyName: 'purchase_orders_supplier_id_fkey'; columns: ['supplier_id']; referencedRelation: 'suppliers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'purchase_orders_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          company_id: string
          purchase_order_id: string
          product_id: string
          quantity: number
          received_quantity: number
          unit_price: number
          gst_rate: number
          line_total: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['purchase_order_items']['Row']> & { purchase_order_id: string; product_id: string; quantity: number }
        Update: Partial<Database['public']['Tables']['purchase_order_items']['Row']>
        Relationships: [
          { foreignKeyName: 'purchase_order_items_purchase_order_id_fkey'; columns: ['purchase_order_id']; referencedRelation: 'purchase_orders'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'purchase_order_items_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      goods_receipts: {
        Row: {
          id: string
          company_id: string
          grn_number: string
          purchase_order_id: string
          warehouse_id: string
          received_date: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['goods_receipts']['Row']> & { purchase_order_id: string; warehouse_id: string }
        Update: Partial<Database['public']['Tables']['goods_receipts']['Row']>
        Relationships: [
          { foreignKeyName: 'goods_receipts_purchase_order_id_fkey'; columns: ['purchase_order_id']; referencedRelation: 'purchase_orders'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'goods_receipts_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      goods_receipt_items: {
        Row: {
          id: string
          company_id: string
          goods_receipt_id: string
          purchase_order_item_id: string
          product_id: string
          quantity_received: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['goods_receipt_items']['Row']> & { goods_receipt_id: string; purchase_order_item_id: string; product_id: string; quantity_received: number }
        Update: Partial<Database['public']['Tables']['goods_receipt_items']['Row']>
        Relationships: [
          { foreignKeyName: 'goods_receipt_items_goods_receipt_id_fkey'; columns: ['goods_receipt_id']; referencedRelation: 'goods_receipts'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'goods_receipt_items_purchase_order_item_id_fkey'; columns: ['purchase_order_item_id']; referencedRelation: 'purchase_order_items'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'goods_receipt_items_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      purchase_bills: {
        Row: {
          id: string
          company_id: string
          bill_number: string
          purchase_order_id: string | null
          supplier_id: string
          bill_date: string
          due_date: string | null
          subtotal: number
          tax_total: number
          total: number
          amount_paid: number
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['purchase_bills']['Row']> & { supplier_id: string }
        Update: Partial<Database['public']['Tables']['purchase_bills']['Row']>
        Relationships: [
          { foreignKeyName: 'purchase_bills_supplier_id_fkey'; columns: ['supplier_id']; referencedRelation: 'suppliers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'purchase_bills_purchase_order_id_fkey'; columns: ['purchase_order_id']; referencedRelation: 'purchase_orders'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      purchase_payments: {
        Row: {
          id: string
          company_id: string
          purchase_bill_id: string
          payment_date: string
          amount: number
          payment_method: string
          reference_number: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['purchase_payments']['Row']> & { purchase_bill_id: string; amount: number; payment_method: string }
        Update: Partial<Database['public']['Tables']['purchase_payments']['Row']>
        Relationships: [
          { foreignKeyName: 'purchase_payments_purchase_bill_id_fkey'; columns: ['purchase_bill_id']; referencedRelation: 'purchase_bills'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      customers: {
        Row: {
          id: string
          company_id: string
          customer_code: string
          name: string
          contact_person: string | null
          email: string | null
          phone: string | null
          billing_address: string | null
          shipping_address: string | null
          gstin: string | null
          credit_limit: number
          credit_days: number
          status: string
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['customers']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['customers']['Row']>
        Relationships: []
      }
      quotations: {
        Row: {
          id: string
          company_id: string
          quotation_number: string
          customer_id: string
          quotation_date: string
          valid_until: string | null
          status: string
          subtotal: number
          discount_total: number
          tax_total: number
          total: number
          notes: string | null
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['quotations']['Row']> & { customer_id: string }
        Update: Partial<Database['public']['Tables']['quotations']['Row']>
        Relationships: [{ foreignKeyName: 'quotations_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false }]
      }
      quotation_items: {
        Row: {
          id: string
          company_id: string
          quotation_id: string
          product_id: string
          quantity: number
          unit_price: number
          discount_percent: number
          gst_rate: number
          line_total: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['quotation_items']['Row']> & { quotation_id: string; product_id: string; quantity: number }
        Update: Partial<Database['public']['Tables']['quotation_items']['Row']>
        Relationships: [
          { foreignKeyName: 'quotation_items_quotation_id_fkey'; columns: ['quotation_id']; referencedRelation: 'quotations'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'quotation_items_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      sales_orders: {
        Row: {
          id: string
          company_id: string
          so_number: string
          customer_id: string
          quotation_id: string | null
          warehouse_id: string
          order_date: string
          delivery_date: string | null
          status: string
          subtotal: number
          discount_total: number
          tax_total: number
          total: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['sales_orders']['Row']> & { customer_id: string; warehouse_id: string }
        Update: Partial<Database['public']['Tables']['sales_orders']['Row']>
        Relationships: [
          { foreignKeyName: 'sales_orders_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'sales_orders_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      sales_order_items: {
        Row: {
          id: string
          company_id: string
          sales_order_id: string
          product_id: string
          quantity: number
          delivered_quantity: number
          invoiced_quantity: number
          unit_price: number
          discount_percent: number
          gst_rate: number
          line_total: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['sales_order_items']['Row']> & { sales_order_id: string; product_id: string; quantity: number }
        Update: Partial<Database['public']['Tables']['sales_order_items']['Row']>
        Relationships: [
          { foreignKeyName: 'sales_order_items_sales_order_id_fkey'; columns: ['sales_order_id']; referencedRelation: 'sales_orders'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'sales_order_items_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      delivery_challans: {
        Row: {
          id: string
          company_id: string
          dc_number: string
          sales_order_id: string
          warehouse_id: string
          delivery_date: string
          vehicle_number: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['delivery_challans']['Row']> & { sales_order_id: string; warehouse_id: string }
        Update: Partial<Database['public']['Tables']['delivery_challans']['Row']>
        Relationships: [
          { foreignKeyName: 'delivery_challans_sales_order_id_fkey'; columns: ['sales_order_id']; referencedRelation: 'sales_orders'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'delivery_challans_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      delivery_challan_items: {
        Row: {
          id: string
          company_id: string
          delivery_challan_id: string
          sales_order_item_id: string
          product_id: string
          quantity_delivered: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['delivery_challan_items']['Row']> & { delivery_challan_id: string; sales_order_item_id: string; product_id: string; quantity_delivered: number }
        Update: Partial<Database['public']['Tables']['delivery_challan_items']['Row']>
        Relationships: [
          { foreignKeyName: 'delivery_challan_items_delivery_challan_id_fkey'; columns: ['delivery_challan_id']; referencedRelation: 'delivery_challans'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'delivery_challan_items_sales_order_item_id_fkey'; columns: ['sales_order_item_id']; referencedRelation: 'sales_order_items'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      sales_invoices: {
        Row: {
          id: string
          company_id: string
          invoice_number: string
          invoice_type: string
          sales_order_id: string | null
          delivery_challan_id: string | null
          customer_id: string
          invoice_date: string
          due_date: string | null
          subtotal: number
          discount_total: number
          tax_total: number
          total: number
          amount_received: number
          status: string
          repair_job_id: string | null
          rental_agreement_id: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['sales_invoices']['Row']> & { customer_id: string }
        Update: Partial<Database['public']['Tables']['sales_invoices']['Row']>
        Relationships: [
          { foreignKeyName: 'sales_invoices_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'sales_invoices_sales_order_id_fkey'; columns: ['sales_order_id']; referencedRelation: 'sales_orders'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'sales_invoices_repair_job_id_fkey'; columns: ['repair_job_id']; referencedRelation: 'repair_jobs'; referencedColumns: ['id']; isOneToOne: true },
          { foreignKeyName: 'sales_invoices_rental_agreement_id_fkey'; columns: ['rental_agreement_id']; referencedRelation: 'rental_agreements'; referencedColumns: ['id']; isOneToOne: true },
        ]
      }
      sales_invoice_items: {
        Row: {
          id: string
          company_id: string
          sales_invoice_id: string
          sales_order_item_id: string | null
          product_id: string | null
          description: string | null
          quantity: number
          unit_price: number
          discount_percent: number
          gst_rate: number
          line_total: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['sales_invoice_items']['Row']> & { sales_invoice_id: string; quantity: number }
        Update: Partial<Database['public']['Tables']['sales_invoice_items']['Row']>
        Relationships: [
          { foreignKeyName: 'sales_invoice_items_sales_invoice_id_fkey'; columns: ['sales_invoice_id']; referencedRelation: 'sales_invoices'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'sales_invoice_items_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      sales_payments: {
        Row: {
          id: string
          company_id: string
          sales_invoice_id: string
          payment_date: string
          amount: number
          payment_method: string
          reference_number: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['sales_payments']['Row']> & { sales_invoice_id: string; amount: number; payment_method: string }
        Update: Partial<Database['public']['Tables']['sales_payments']['Row']>
        Relationships: [{ foreignKeyName: 'sales_payments_sales_invoice_id_fkey'; columns: ['sales_invoice_id']; referencedRelation: 'sales_invoices'; referencedColumns: ['id']; isOneToOne: false }]
      }
      repair_jobs: {
        Row: {
          id: string
          company_id: string
          job_number: string
          customer_id: string
          transformer_make: string | null
          transformer_model: string | null
          transformer_serial_no: string | null
          transformer_capacity_kva: number | null
          complaint: string
          pickup_required: boolean
          pickup_address: string | null
          pickup_requested_date: string | null
          pickup_completed_date: string | null
          status: string
          current_stage: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['repair_jobs']['Row']> & { customer_id: string; complaint: string }
        Update: Partial<Database['public']['Tables']['repair_jobs']['Row']>
        Relationships: [{ foreignKeyName: 'repair_jobs_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false }]
      }
      repair_estimates: {
        Row: {
          id: string
          company_id: string
          estimate_number: string
          repair_job_id: string
          estimate_date: string
          status: string
          subtotal: number
          tax_total: number
          total: number
          notes: string | null
          sent_at: string | null
          customer_approval_notes: string | null
          customer_approved_at: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['repair_estimates']['Row']> & { repair_job_id: string }
        Update: Partial<Database['public']['Tables']['repair_estimates']['Row']>
        Relationships: [{ foreignKeyName: 'repair_estimates_repair_job_id_fkey'; columns: ['repair_job_id']; referencedRelation: 'repair_jobs'; referencedColumns: ['id']; isOneToOne: false }]
      }
      repair_estimate_items: {
        Row: {
          id: string
          company_id: string
          repair_estimate_id: string
          item_type: string
          product_id: string | null
          description: string
          quantity: number
          unit_price: number
          gst_rate: number
          line_total: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['repair_estimate_items']['Row']> & { repair_estimate_id: string; description: string }
        Update: Partial<Database['public']['Tables']['repair_estimate_items']['Row']>
        Relationships: [
          { foreignKeyName: 'repair_estimate_items_repair_estimate_id_fkey'; columns: ['repair_estimate_id']; referencedRelation: 'repair_estimates'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'repair_estimate_items_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      repair_job_stage_history: {
        Row: {
          id: string
          company_id: string
          repair_job_id: string
          stage: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['repair_job_stage_history']['Row']> & { repair_job_id: string; stage: string }
        Update: Partial<Database['public']['Tables']['repair_job_stage_history']['Row']>
        Relationships: [{ foreignKeyName: 'repair_job_stage_history_repair_job_id_fkey'; columns: ['repair_job_id']; referencedRelation: 'repair_jobs'; referencedColumns: ['id']; isOneToOne: false }]
      }
      documents: {
        Row: {
          id: string
          company_id: string
          reference_type: string
          reference_id: string
          category: string
          file_name: string
          storage_path: string
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: Partial<Database['public']['Tables']['documents']['Row']> & { reference_type: string; reference_id: string; category: string; file_name: string; storage_path: string }
        Update: Partial<Database['public']['Tables']['documents']['Row']>
        Relationships: []
      }
      test_types: {
        Row: {
          id: string
          code: string
          name: string
          parameters: Json
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['test_types']['Row']> & { code: string; name: string }
        Update: Partial<Database['public']['Tables']['test_types']['Row']>
        Relationships: []
      }
      test_reports: {
        Row: {
          id: string
          company_id: string
          report_number: string
          customer_id: string
          repair_job_id: string | null
          production_order_id: string | null
          test_type_id: string
          tested_by: string | null
          tested_at: string
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['test_reports']['Row']> & { customer_id: string; test_type_id: string }
        Update: Partial<Database['public']['Tables']['test_reports']['Row']>
        Relationships: [
          { foreignKeyName: 'test_reports_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'test_reports_repair_job_id_fkey'; columns: ['repair_job_id']; referencedRelation: 'repair_jobs'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'test_reports_production_order_id_fkey'; columns: ['production_order_id']; referencedRelation: 'production_orders'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'test_reports_test_type_id_fkey'; columns: ['test_type_id']; referencedRelation: 'test_types'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      test_report_results: {
        Row: {
          id: string
          company_id: string
          test_report_id: string
          parameter_key: string
          parameter_label: string
          value: string
          unit: string | null
          pass_fail: boolean | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['test_report_results']['Row']> & { test_report_id: string; parameter_key: string; parameter_label: string; value: string }
        Update: Partial<Database['public']['Tables']['test_report_results']['Row']>
        Relationships: [{ foreignKeyName: 'test_report_results_test_report_id_fkey'; columns: ['test_report_id']; referencedRelation: 'test_reports'; referencedColumns: ['id']; isOneToOne: false }]
      }
      test_certificates: {
        Row: {
          id: string
          company_id: string
          test_report_id: string
          certificate_number: string
          storage_path: string
          issued_by: string | null
          issued_at: string
        }
        Insert: Partial<Database['public']['Tables']['test_certificates']['Row']> & { test_report_id: string; storage_path: string }
        Update: Partial<Database['public']['Tables']['test_certificates']['Row']>
        Relationships: [{ foreignKeyName: 'test_certificates_test_report_id_fkey'; columns: ['test_report_id']; referencedRelation: 'test_reports'; referencedColumns: ['id']; isOneToOne: true }]
      }
      repair_warranties: {
        Row: {
          id: string
          company_id: string
          repair_job_id: string
          warranty_months: number
          start_date: string
          end_date: string
          terms: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['repair_warranties']['Row']> & { repair_job_id: string; warranty_months: number }
        Update: Partial<Database['public']['Tables']['repair_warranties']['Row']>
        Relationships: [{ foreignKeyName: 'repair_warranties_repair_job_id_fkey'; columns: ['repair_job_id']; referencedRelation: 'repair_jobs'; referencedColumns: ['id']; isOneToOne: true }]
      }
      rental_asset_categories: {
        Row: {
          id: string
          company_id: string
          name: string
          description: string | null
          is_active: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_asset_categories']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['rental_asset_categories']['Row']>
        Relationships: []
      }
      rental_assets: {
        Row: {
          id: string
          company_id: string
          asset_code: string
          category_id: string | null
          name: string
          serial_number: string | null
          qr_code: string | null
          status: string
          current_location: string | null
          purchase_cost: number | null
          daily_rental_rate: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_assets']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['rental_assets']['Row']>
        Relationships: [{ foreignKeyName: 'rental_assets_category_id_fkey'; columns: ['category_id']; referencedRelation: 'rental_asset_categories'; referencedColumns: ['id']; isOneToOne: false }]
      }
      rental_asset_status_log: {
        Row: {
          id: string
          company_id: string
          rental_asset_id: string
          status: string
          reference_type: string | null
          reference_id: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_asset_status_log']['Row']> & { rental_asset_id: string; status: string }
        Update: Partial<Database['public']['Tables']['rental_asset_status_log']['Row']>
        Relationships: [{ foreignKeyName: 'rental_asset_status_log_rental_asset_id_fkey'; columns: ['rental_asset_id']; referencedRelation: 'rental_assets'; referencedColumns: ['id']; isOneToOne: false }]
      }
      rental_inquiries: {
        Row: {
          id: string
          company_id: string
          inquiry_number: string
          customer_id: string
          category_id: string | null
          requirement: string
          required_from: string | null
          required_to: string | null
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_inquiries']['Row']> & { customer_id: string; requirement: string }
        Update: Partial<Database['public']['Tables']['rental_inquiries']['Row']>
        Relationships: [
          { foreignKeyName: 'rental_inquiries_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'rental_inquiries_category_id_fkey'; columns: ['category_id']; referencedRelation: 'rental_asset_categories'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      rental_quotations: {
        Row: {
          id: string
          company_id: string
          quotation_number: string
          rental_inquiry_id: string | null
          customer_id: string
          quotation_date: string
          valid_until: string | null
          status: string
          subtotal: number
          tax_total: number
          total: number
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_quotations']['Row']> & { customer_id: string }
        Update: Partial<Database['public']['Tables']['rental_quotations']['Row']>
        Relationships: [
          { foreignKeyName: 'rental_quotations_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'rental_quotations_rental_inquiry_id_fkey'; columns: ['rental_inquiry_id']; referencedRelation: 'rental_inquiries'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      rental_quotation_items: {
        Row: {
          id: string
          company_id: string
          rental_quotation_id: string
          rental_asset_id: string
          rental_days: number
          daily_rate: number
          gst_rate: number
          line_total: number
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_quotation_items']['Row']> & { rental_quotation_id: string; rental_asset_id: string; rental_days: number }
        Update: Partial<Database['public']['Tables']['rental_quotation_items']['Row']>
        Relationships: [
          { foreignKeyName: 'rental_quotation_items_rental_quotation_id_fkey'; columns: ['rental_quotation_id']; referencedRelation: 'rental_quotations'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'rental_quotation_items_rental_asset_id_fkey'; columns: ['rental_asset_id']; referencedRelation: 'rental_assets'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      rental_bookings: {
        Row: {
          id: string
          company_id: string
          booking_number: string
          rental_quotation_id: string | null
          customer_id: string
          rental_asset_id: string
          start_date: string
          end_date: string
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_bookings']['Row']> & { customer_id: string; rental_asset_id: string; start_date: string; end_date: string }
        Update: Partial<Database['public']['Tables']['rental_bookings']['Row']>
        Relationships: [
          { foreignKeyName: 'rental_bookings_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'rental_bookings_rental_asset_id_fkey'; columns: ['rental_asset_id']; referencedRelation: 'rental_assets'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'rental_bookings_rental_quotation_id_fkey'; columns: ['rental_quotation_id']; referencedRelation: 'rental_quotations'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      vehicles: {
        Row: { id: string; company_id: string; registration_no: string; type: string | null; is_active: boolean; created_at: string }
        Insert: Partial<Database['public']['Tables']['vehicles']['Row']> & { registration_no: string }
        Update: Partial<Database['public']['Tables']['vehicles']['Row']>
        Relationships: []
      }
      drivers: {
        Row: { id: string; company_id: string; name: string; license_no: string | null; is_active: boolean; created_at: string }
        Insert: Partial<Database['public']['Tables']['drivers']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['drivers']['Row']>
        Relationships: []
      }
      trips: {
        Row: {
          id: string
          company_id: string
          vehicle_id: string | null
          driver_id: string | null
          trip_type: string
          reference_type: string
          reference_id: string
          gps_start: Json | null
          gps_end: Json | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['trips']['Row']> & { trip_type: string; reference_type: string; reference_id: string }
        Update: Partial<Database['public']['Tables']['trips']['Row']>
        Relationships: [
          { foreignKeyName: 'trips_vehicle_id_fkey'; columns: ['vehicle_id']; referencedRelation: 'vehicles'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'trips_driver_id_fkey'; columns: ['driver_id']; referencedRelation: 'drivers'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      trip_costs: {
        Row: { id: string; company_id: string; trip_id: string; cost_type: string; amount: number; notes: string | null; created_at: string }
        Insert: Partial<Database['public']['Tables']['trip_costs']['Row']> & { trip_id: string; cost_type: string; amount: number }
        Update: Partial<Database['public']['Tables']['trip_costs']['Row']>
        Relationships: [{ foreignKeyName: 'trip_costs_trip_id_fkey'; columns: ['trip_id']; referencedRelation: 'trips'; referencedColumns: ['id']; isOneToOne: false }]
      }
      trip_photos: {
        Row: { id: string; company_id: string; trip_id: string; storage_path: string; uploaded_by: string | null; uploaded_at: string }
        Insert: Partial<Database['public']['Tables']['trip_photos']['Row']> & { trip_id: string; storage_path: string }
        Update: Partial<Database['public']['Tables']['trip_photos']['Row']>
        Relationships: [{ foreignKeyName: 'trip_photos_trip_id_fkey'; columns: ['trip_id']; referencedRelation: 'trips'; referencedColumns: ['id']; isOneToOne: false }]
      }
      customer_signatures: {
        Row: { id: string; company_id: string; trip_id: string; storage_path: string; signed_at: string }
        Insert: Partial<Database['public']['Tables']['customer_signatures']['Row']> & { trip_id: string; storage_path: string }
        Update: Partial<Database['public']['Tables']['customer_signatures']['Row']>
        Relationships: [{ foreignKeyName: 'customer_signatures_trip_id_fkey'; columns: ['trip_id']; referencedRelation: 'trips'; referencedColumns: ['id']; isOneToOne: false }]
      }
      rental_agreements: {
        Row: {
          id: string
          company_id: string
          agreement_number: string
          rental_booking_id: string
          customer_id: string
          rental_asset_id: string
          start_date: string
          end_date: string
          security_deposit: number
          late_return_charge_rate: number
          operator_provided: boolean
          operator_charge_rate: number
          fuel_charge_rate: number
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_agreements']['Row']> & {
          rental_booking_id: string
          customer_id: string
          rental_asset_id: string
          start_date: string
          end_date: string
        }
        Update: Partial<Database['public']['Tables']['rental_agreements']['Row']>
        Relationships: [
          { foreignKeyName: 'rental_agreements_rental_booking_id_fkey'; columns: ['rental_booking_id']; referencedRelation: 'rental_bookings'; referencedColumns: ['id']; isOneToOne: true },
          { foreignKeyName: 'rental_agreements_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'rental_agreements_rental_asset_id_fkey'; columns: ['rental_asset_id']; referencedRelation: 'rental_assets'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      rental_dispatches: {
        Row: {
          id: string
          company_id: string
          rental_agreement_id: string
          trip_id: string | null
          dispatched_at: string
          dispatch_condition_notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_dispatches']['Row']> & { rental_agreement_id: string }
        Update: Partial<Database['public']['Tables']['rental_dispatches']['Row']>
        Relationships: [
          { foreignKeyName: 'rental_dispatches_rental_agreement_id_fkey'; columns: ['rental_agreement_id']; referencedRelation: 'rental_agreements'; referencedColumns: ['id']; isOneToOne: true },
          { foreignKeyName: 'rental_dispatches_trip_id_fkey'; columns: ['trip_id']; referencedRelation: 'trips'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      rental_returns: {
        Row: {
          id: string
          company_id: string
          rental_agreement_id: string
          trip_id: string | null
          returned_at: string
          return_condition_notes: string | null
          is_late: boolean
          late_days: number
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_returns']['Row']> & { rental_agreement_id: string }
        Update: Partial<Database['public']['Tables']['rental_returns']['Row']>
        Relationships: [
          { foreignKeyName: 'rental_returns_rental_agreement_id_fkey'; columns: ['rental_agreement_id']; referencedRelation: 'rental_agreements'; referencedColumns: ['id']; isOneToOne: true },
          { foreignKeyName: 'rental_returns_trip_id_fkey'; columns: ['trip_id']; referencedRelation: 'trips'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      rental_inspections: {
        Row: {
          id: string
          company_id: string
          rental_return_id: string
          inspected_by: string | null
          inspected_at: string
          condition_rating: string
          notes: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_inspections']['Row']> & { rental_return_id: string; condition_rating: string }
        Update: Partial<Database['public']['Tables']['rental_inspections']['Row']>
        Relationships: [{ foreignKeyName: 'rental_inspections_rental_return_id_fkey'; columns: ['rental_return_id']; referencedRelation: 'rental_returns'; referencedColumns: ['id']; isOneToOne: true }]
      }
      rental_damage_assessments: {
        Row: {
          id: string
          company_id: string
          rental_inspection_id: string
          description: string
          estimated_repair_cost: number
          charged_to_customer: boolean
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['rental_damage_assessments']['Row']> & { rental_inspection_id: string; description: string }
        Update: Partial<Database['public']['Tables']['rental_damage_assessments']['Row']>
        Relationships: [
          { foreignKeyName: 'rental_damage_assessments_rental_inspection_id_fkey'; columns: ['rental_inspection_id']; referencedRelation: 'rental_inspections'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      maintenance_schedules: {
        Row: {
          id: string
          company_id: string
          reference_type: string
          reference_id: string
          frequency_days: number
          next_due_at: string
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['maintenance_schedules']['Row']> & { reference_type: string; reference_id: string; frequency_days: number; next_due_at: string }
        Update: Partial<Database['public']['Tables']['maintenance_schedules']['Row']>
        Relationships: []
      }
      maintenance_visits: {
        Row: {
          id: string
          company_id: string
          schedule_id: string
          visited_at: string
          technician_id: string | null
          status: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: Partial<Database['public']['Tables']['maintenance_visits']['Row']> & { schedule_id: string }
        Update: Partial<Database['public']['Tables']['maintenance_visits']['Row']>
        Relationships: [{ foreignKeyName: 'maintenance_visits_schedule_id_fkey'; columns: ['schedule_id']; referencedRelation: 'maintenance_schedules'; referencedColumns: ['id']; isOneToOne: false }]
      }
      maintenance_checklists: {
        Row: { id: string; company_id: string; name: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['maintenance_checklists']['Row']> & { name: string }
        Update: Partial<Database['public']['Tables']['maintenance_checklists']['Row']>
        Relationships: []
      }
      maintenance_checklist_items: {
        Row: { id: string; company_id: string; checklist_id: string; visit_id: string | null; item_text: string; is_checked: boolean; created_at: string }
        Insert: Partial<Database['public']['Tables']['maintenance_checklist_items']['Row']> & { checklist_id: string; item_text: string }
        Update: Partial<Database['public']['Tables']['maintenance_checklist_items']['Row']>
        Relationships: [
          { foreignKeyName: 'maintenance_checklist_items_checklist_id_fkey'; columns: ['checklist_id']; referencedRelation: 'maintenance_checklists'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'maintenance_checklist_items_visit_id_fkey'; columns: ['visit_id']; referencedRelation: 'maintenance_visits'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      boms: {
        Row: { id: string; company_id: string; product_id: string; version: number; name: string | null; is_active: boolean; created_by: string | null; created_at: string; updated_at: string }
        Insert: Partial<Database['public']['Tables']['boms']['Row']> & { product_id: string }
        Update: Partial<Database['public']['Tables']['boms']['Row']>
        Relationships: [{ foreignKeyName: 'boms_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false }]
      }
      bom_lines: {
        Row: { id: string; company_id: string; bom_id: string; raw_material_product_id: string; qty: number; unit_id: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['bom_lines']['Row']> & { bom_id: string; raw_material_product_id: string; qty: number; unit_id: string }
        Update: Partial<Database['public']['Tables']['bom_lines']['Row']>
        Relationships: [
          { foreignKeyName: 'bom_lines_bom_id_fkey'; columns: ['bom_id']; referencedRelation: 'boms'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'bom_lines_raw_material_product_id_fkey'; columns: ['raw_material_product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'bom_lines_unit_id_fkey'; columns: ['unit_id']; referencedRelation: 'units'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      production_orders: {
        Row: {
          id: string
          company_id: string
          order_number: string
          product_id: string
          bom_id: string
          quantity: number
          warehouse_id: string
          status: string
          current_stage: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['production_orders']['Row']> & { product_id: string; bom_id: string; quantity: number; warehouse_id: string }
        Update: Partial<Database['public']['Tables']['production_orders']['Row']>
        Relationships: [
          { foreignKeyName: 'production_orders_product_id_fkey'; columns: ['product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'production_orders_bom_id_fkey'; columns: ['bom_id']; referencedRelation: 'boms'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'production_orders_warehouse_id_fkey'; columns: ['warehouse_id']; referencedRelation: 'warehouses'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      raw_material_requirements: {
        Row: { id: string; company_id: string; production_order_id: string; raw_material_product_id: string; required_qty: number; unit_id: string; created_at: string }
        Insert: Partial<Database['public']['Tables']['raw_material_requirements']['Row']> & { production_order_id: string; raw_material_product_id: string; required_qty: number; unit_id: string }
        Update: Partial<Database['public']['Tables']['raw_material_requirements']['Row']>
        Relationships: [
          { foreignKeyName: 'raw_material_requirements_production_order_id_fkey'; columns: ['production_order_id']; referencedRelation: 'production_orders'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'raw_material_requirements_raw_material_product_id_fkey'; columns: ['raw_material_product_id']; referencedRelation: 'products'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'raw_material_requirements_unit_id_fkey'; columns: ['unit_id']; referencedRelation: 'units'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      production_stage_history: {
        Row: { id: string; company_id: string; production_order_id: string; stage: string; notes: string | null; created_by: string | null; created_at: string }
        Insert: Partial<Database['public']['Tables']['production_stage_history']['Row']> & { production_order_id: string; stage: string }
        Update: Partial<Database['public']['Tables']['production_stage_history']['Row']>
        Relationships: [
          { foreignKeyName: 'production_stage_history_production_order_id_fkey'; columns: ['production_order_id']; referencedRelation: 'production_orders'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
      site_surveys: {
        Row: {
          id: string
          company_id: string
          survey_number: string
          customer_id: string
          scheduled_date: string | null
          conducted_date: string | null
          conducted_by: string | null
          status: string
          findings: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['site_surveys']['Row']> & { customer_id: string }
        Update: Partial<Database['public']['Tables']['site_surveys']['Row']>
        Relationships: [{ foreignKeyName: 'site_surveys_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false }]
      }
      opportunities: {
        Row: {
          id: string
          company_id: string
          opportunity_number: string
          customer_id: string
          site_survey_id: string | null
          title: string
          estimated_value: number
          stage: string
          expected_close_date: string | null
          notes: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: Partial<Database['public']['Tables']['opportunities']['Row']> & { customer_id: string; title: string }
        Update: Partial<Database['public']['Tables']['opportunities']['Row']>
        Relationships: [
          { foreignKeyName: 'opportunities_customer_id_fkey'; columns: ['customer_id']; referencedRelation: 'customers'; referencedColumns: ['id']; isOneToOne: false },
          { foreignKeyName: 'opportunities_site_survey_id_fkey'; columns: ['site_survey_id']; referencedRelation: 'site_surveys'; referencedColumns: ['id']; isOneToOne: false },
        ]
      }
    }
    Views: Record<string, never>
    Functions: {
      has_permission: { Args: { perm_key: string }; Returns: boolean }
      current_company_id: { Args: Record<string, never>; Returns: string }
      create_company_and_admin: { Args: { p_company_name: string; p_industry_type: string }; Returns: string }
      get_my_entitlements: { Args: Record<string, never>; Returns: Json }
      can_activate_module: { Args: { p_customer_id: string; p_module_id: string }; Returns: boolean }
      next_document_number: { Args: { p_sequence_key: string; p_prefix: string; p_pad?: number }; Returns: string }
      post_sales_invoice_to_ledger: { Args: { p_invoice_id: string }; Returns: void }
      calculate_rental_invoice: {
        Args: { p_agreement_id: string }
        Returns: { description: string; quantity: number; unit_price: number; gst_rate: number }[]
      }
      explode_bom: {
        Args: { p_bom_id: string; p_qty: number }
        Returns: { raw_material_product_id: string; required_qty: number; unit_id: string }[]
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

type PublicSchema = Database['public']

export type Tables<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof PublicSchema['Tables']> = PublicSchema['Tables'][T]['Update']
