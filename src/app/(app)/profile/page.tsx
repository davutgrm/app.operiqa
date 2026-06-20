import { createClient } from '@/lib/supabase/server'
import ProfilePage from '@/components/ProfilePage'

export default async function ProfileRoute() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <ProfilePage userEmail={user?.email ?? ''} />
}
