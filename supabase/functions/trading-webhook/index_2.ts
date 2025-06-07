import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
Deno.serve(async (req)=>{
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({
        error: 'Method not allowed'
      }), {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const payload = await req.json();
    console.log('Received webhook payload:', payload);
    // Extract data from TradingView webhook
    const { title, type, entry_price, stoploss_price, stock_symbol, test_mode = false } = payload;
    if (!title || !type || !entry_price || !stoploss_price || !stock_symbol) {
      return new Response(JSON.stringify({
        error: 'Missing required fields: title, type, entry_price, stoploss_price, stock_symbol'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Insert the alert into the database
    const { data, error } = await supabase.from('trading_alerts').insert({
      title,
      type,
      entry_price,
      stoploss_price,
      stock_symbol,
      test_mode,
      timestamp: new Date().toISOString()
    }).select();
    if (error) {
      console.error('Database error:', error);
      return new Response(JSON.stringify({
        error: 'Failed to save alert'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log('Alert saved successfully:', data);
    return new Response(JSON.stringify({
      success: true,
      alert: data[0]
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
