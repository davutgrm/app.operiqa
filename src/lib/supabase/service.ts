import { createClient } from '@supabase/supabase-js'

const clean = (v: string | undefined) => v?.trim().replace(/^﻿/, '') ?? ''

export function createServiceClient() {
  return createClient(
    clean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    clean(process.env.SUPABASE_SERVICE_ROLE_KEY)
  )
}
