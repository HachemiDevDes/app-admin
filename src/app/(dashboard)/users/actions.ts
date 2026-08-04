'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateUserSubscription(
  userId: string, 
  newEndDate: string, 
  tier: string = 'Premium', 
  status: string = 'Active'
) {
  const supabase = await createClient()

  // We deployed a Supabase Edge Function to safely bypass RLS
  // using the Service Role Key on the backend.
  const { data, error } = await supabase.functions.invoke('update-subscription', {
    body: { userId, newEndDate, tier, status }
  })

  if (error) {
    throw new Error(`Edge Function Error: ${error.message}`)
  }

  if (data?.error) {
    throw new Error(`Failed to update subscription: ${data.error}`)
  }

  // Trigger a push notification to let the user know about their subscription update
  const title = "Subscription Updated 🎉"
  const message = `Your subscription has been updated to ${tier} tier, valid until ${new Date(newEndDate).toLocaleDateString('en-GB')}.`

  const { error: notificationError } = await supabase.functions.invoke('send-notification', {
    body: { target: userId, title, message }
  })
  
  if(notificationError) {
    console.error("Failed to send push notification:", notificationError)
  } else {
    // Optionally insert into notification history so it shows up in the admin panel
    await supabase.from('notification_history').insert({
      target: userId,
      title,
      message,
      sent_by: 'System (Admin Action)'
    })
  }

  revalidatePath('/users')
  return { success: true }
}
