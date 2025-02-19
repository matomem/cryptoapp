import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const LUNO_API_KEY = Deno.env.get('LUNO_API_KEY')
const LUNO_API_SECRET = Deno.env.get('LUNO_API_SECRET')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()

    // Get auth user if needed
    let user = null
    const authHeader = req.headers.get('Authorization')
    if (authHeader) {
      const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
      const userData = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
      user = userData.data.user
    }

    const lunoHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${btoa(`${LUNO_API_KEY}:${LUNO_API_SECRET}`)}`
    }

    switch (action) {
      case 'getBalance': {
        const response = await fetch('https://api.luno.com/api/1/balance', {
          headers: lunoHeaders
        })
        const data = await response.json()
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      case 'getAddress': {
        const { asset } = params
        const response = await fetch(`https://api.luno.com/api/1/funding_address?asset=${asset}`, {
          headers: lunoHeaders
        })
        const data = await response.json()
        return new Response(
          JSON.stringify(data),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      case 'buyBitcoin': {
        if (!user) throw new Error('Authentication required')
        
        const { zarAmount } = params
        if (!zarAmount || isNaN(zarAmount)) {
          throw new Error('Invalid ZAR amount')
        }

        // First get the current BTC/ZAR price
        const tickerResponse = await fetch('https://api.luno.com/api/1/ticker?pair=XBTZAR', {
          headers: lunoHeaders
        })
        const tickerData = await tickerResponse.json()
        
        // Calculate BTC amount based on current price
        const btcAmount = (zarAmount / parseFloat(tickerData.bid)).toFixed(8)

        // Create market buy order
        const response = await fetch('https://api.luno.com/api/1/marketorder', {
          method: 'POST',
          headers: lunoHeaders,
          body: JSON.stringify({
            pair: 'XBTZAR',
            type: 'BUY',
            counter_volume: zarAmount.toString()
          })
        })

        const data = await response.json()
        
        if (data.error) throw new Error(data.error)

        // Record the purchase
        const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!)
        const { error: purchaseError } = await supabase
          .from('bitcoin_purchases')
          .insert({
            user_id: user.id,
            zar_amount: zarAmount,
            btc_amount: btcAmount,
            status: 'completed'
          })

        if (purchaseError) throw purchaseError

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
