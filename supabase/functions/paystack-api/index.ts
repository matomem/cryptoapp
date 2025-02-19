
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
    const { action, params } = await req.json()

    // Get auth user
    const authHeader = req.headers.get('Authorization')!
    const user = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (!user.data.user) {
      throw new Error('Unauthorized')
    }

    switch (action) {
      case 'initializeDeposit': {
        const { amount } = params
        const response = await fetch('https://api.paystack.co/transaction/initialize', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            amount: amount * 100, // Paystack expects amount in kobo
            email: user.data.user.email,
            currency: 'ZAR',
            callback_url: `${req.headers.get('origin')}/user/deposit/callback`
          })
        })

        const data = await response.json()
        
        if (!data.status) {
          throw new Error(data.message)
        }

        // Create deposit record
        const { error: depositError } = await supabase
          .from('deposits')
          .insert({
            user_id: user.data.user.id,
            amount,
            payment_reference: data.data.reference,
          })

        if (depositError) throw depositError

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'verifyDeposit': {
        const { reference } = params
        const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
          headers: {
            'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          }
        })

        const data = await response.json()
        
        if (data.status && data.data.status === 'success') {
          // Update deposit status
          const { error: updateError } = await supabase
            .from('deposits')
            .update({ status: 'completed' })
            .eq('payment_reference', reference)
            .eq('user_id', user.data.user.id)

          if (updateError) throw updateError
        }

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
