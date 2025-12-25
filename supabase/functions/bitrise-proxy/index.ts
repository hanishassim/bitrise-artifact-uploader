import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RM_API_HOST = 'https://api.bitrise.io';

serve(async (req) => {
  const origin = req.headers.get('Origin');
  // Allow requests from localhost on any port
  const isAllowedOrigin = origin && /^http:\/\/localhost:\d+$/.test(origin);

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, apiToken, appId, artifactId, fileName, fileSizeBytes } = await req.json();

    console.log(`Bitrise proxy action: ${action}`);

    if (!apiToken || !appId) {
      return new Response(
        JSON.stringify({ error: 'Missing apiToken or appId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response: Response;
    let url: string;

    switch (action) {
      case 'testConnection':
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}`;
        console.log(`Testing connection to: ${url}`);
        response = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': apiToken },
        });
        break;

      case 'getUploadUrl':
        if (!artifactId || !fileName || !fileSizeBytes) {
          return new Response(
            JSON.stringify({ error: 'Missing artifactId, fileName, or fileSizeBytes' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/upload-url?file_name=${encodeURIComponent(fileName)}&file_size_bytes=${fileSizeBytes}`;
        console.log(`Getting upload URL from: ${url}`);
        response = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': apiToken },
        });
        break;

      case 'checkStatus':
        if (!artifactId) {
          return new Response(
            JSON.stringify({ error: 'Missing artifactId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/status`;
        console.log(`Checking status at: ${url}`);
        response = await fetch(url, {
          method: 'GET',
          headers: { 'Authorization': apiToken },
        });
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    const data = await response.json().catch(() => ({}));
    console.log(`Response status: ${response.status}`);

    return new Response(
      JSON.stringify({ status: response.status, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    // Log error server-side for debugging (without sensitive data)
    console.error('Bitrise proxy error:', {
      action: req.method,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    
    // Return generic error to client
    return new Response(
      JSON.stringify({ error: 'Request processing failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
