
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()
    const apiKey = Deno.env.get('7401a7645e1709dd23cd3824d5f3e9938eada4f7b5d23bba781d15c74ac98ce9')
    const apiSecret = Deno.env.get('a5425F5d92cF3A9Be1F8dE21Db2c5304dd6e8A5616318BF9F9f8e7775291B657')

    if (!apiKey || !apiSecret) {
      throw new Error('Coinpayments API credentials not configured')
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user information
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      throw userError || new Error('User not found')
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const hmac = new TextEncoder()

    switch (action) {
      case 'getCoins': {
        const response = await fetch('https://www.coinpayments.net/api.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'HMAC': hmac.encode(`${apiKey}${timestamp}`).toString(),
          },
          body: new URLSearchParams({
            cmd: 'rates',
            key: apiKey,
            version: '1',
            format: 'json',
          }),
        })

        const data = await response.json()
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'getUserCoins': {
        const { data: coins, error } = await supabase
          .from('user_coins')
          .select('*')
          .eq('user_id', user.id)

        if (error) throw error

        return new Response(JSON.stringify({ coins }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      case 'addUserCoin': {
        const { coin_symbol } = params
        const { data: coin, error } = await supabase
          .from('user_coins')
          .insert([
            { user_id: user.id, coin_symbol, enabled: true }
          ])
          .select()
          .single()

        if (error) throw error

        return new Response(JSON.stringify({ coin }), {
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
