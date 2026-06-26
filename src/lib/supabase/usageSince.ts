import type { SupabaseClient } from '@supabase/supabase-js'

function monthStart(): string {
  const d = new Date()
  d.setDate(1)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export async function getUsageSince(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data } = await supabase
    .from('usage_resets')
    .select('reset_date')
    .eq('user_id', userId)
    .order('reset_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  const ms = monthStart()
  if (!data?.reset_date) return ms
  return data.reset_date > ms ? data.reset_date : ms
}
