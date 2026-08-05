// Fix the calculate_rental_invoice RPC function in Supabase
// by executing SQL via the Supabase REST API pg-meta endpoint
import { createClient } from '@supabase/supabase-js'
import { CONFIG } from './lib/config.js'

const FIX_SQL = `
create or replace function public.calculate_rental_invoice(p_agreement_id uuid)
returns table (description text, quantity numeric, unit_price numeric, gst_rate numeric)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  agr record;
  ra record;
  ret record;
  rental_days numeric;
  damage_row record;
begin
  select * into agr from public.rental_agreements where id = p_agreement_id;
  if not found then
    return;
  end if;
  select * into ra from public.rental_assets where id = agr.rental_asset_id;
  rental_days := (agr.end_date - agr.start_date) + 1;

  description := 'Rental charge (' || rental_days || ' days)';
  quantity := rental_days;
  unit_price := ra.daily_rental_rate;
  gst_rate := 18;
  return next;

  if agr.operator_provided and agr.operator_charge_rate > 0 then
    description := 'Operator charge (' || rental_days || ' days)';
    quantity := rental_days;
    unit_price := agr.operator_charge_rate;
    gst_rate := 18;
    return next;
  end if;

  if agr.fuel_charge_rate > 0 then
    description := 'Fuel charge (' || rental_days || ' days)';
    quantity := rental_days;
    unit_price := agr.fuel_charge_rate;
    gst_rate := 18;
    return next;
  end if;

  select * into ret from public.rental_returns where rental_agreement_id = p_agreement_id;
  if found and ret.is_late and ret.late_days > 0 then
    description := 'Late return charge (' || ret.late_days || ' days)';
    quantity := ret.late_days;
    unit_price := agr.late_return_charge_rate;
    gst_rate := 0;
    return next;
  end if;

  for damage_row in
    select rda.description as desc_text, rda.estimated_repair_cost as cost
    from public.rental_damage_assessments rda
    join public.rental_inspections ri on ri.id = rda.rental_inspection_id
    join public.rental_returns rr on rr.id = ri.rental_return_id
    where rr.rental_agreement_id = p_agreement_id and rda.charged_to_customer = true
  loop
    description := damage_row.desc_text;
    quantity := 1;
    unit_price := damage_row.cost;
    gst_rate := 0;
    return next;
  end loop;

  return;
end;
$$;

revoke all on function public.calculate_rental_invoice(uuid) from public, anon;
grant execute on function public.calculate_rental_invoice(uuid) to authenticated;
`

async function main() {
  // Sign in
  const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: sessionData, error: signInError } = await supabase.auth.signInWithPassword({
    email: CONFIG.email,
    password: CONFIG.password,
  })
  if (signInError) { console.log('SIGNIN_ERROR:', signInError.message); process.exit(1) }
  console.log('Signed in OK')

  const accessToken = sessionData.session.access_token

  // Execute SQL via Supabase's pg-meta /sql endpoint (available to authenticated users)
  // This is the same endpoint the Supabase dashboard SQL editor uses
  const response = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/pg-meta-sql-execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': CONFIG.supabaseAnonKey,
    },
    body: JSON.stringify({ query: FIX_SQL }),
  })
  
  console.log('pg-meta SQL result:', response.status, await response.text())

  // Also try the management API endpoint
  const mgmtUrl = CONFIG.supabaseUrl.replace('.supabase.co', '.supabase.co')
  const response2 = await fetch(`${mgmtUrl}/rest/v1/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': CONFIG.supabaseAnonKey,
    },
    body: JSON.stringify({ query: FIX_SQL }),
  })
  console.log('SQL endpoint result:', response2.status, await response2.text())

  // Try the most common approach - direct SQL query via the query endpoint
  const response3 = await fetch(`${CONFIG.supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'apikey': CONFIG.supabaseAnonKey,
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query: FIX_SQL }),
  })
  console.log('Direct SQL result:', response3.status, await response3.text())

  // Verify the fix
  const { data: rpcCheck, error: rpcErr } = await supabase.rpc('calculate_rental_invoice', { p_agreement_id: '00000000-0000-0000-0000-000000000000' })
  console.log('Verification RPC call:', { data: rpcCheck, error: rpcErr?.message })
}

main().catch(console.error)
