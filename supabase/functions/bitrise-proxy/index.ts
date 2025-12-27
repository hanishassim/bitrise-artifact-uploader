import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RM_API_HOST = 'https://api.bitrise.io';

const logCurlCommand = (url: string, method: string, headers: Record<string, string>) => {
  const headerPart = Object.entries(headers).map(([key, value]) => `-H '${key}: ${value}'`).join(' ');
  const curlCommand = `curl -X ${method} ${headerPart} '${url}'`;
  console.log(curlCommand);
};

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
    const { action, apiToken, appId, workspaceId, artifactId, fileName, fileSizeBytes } = await req.json();

    console.log(`Bitrise proxy action: ${action}`);

    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'Missing apiToken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response: Response;
    let url: string;

    switch (action) {
      case 'listConnectedApps': {
        if (!workspaceId) {
          return new Response(
            JSON.stringify({ error: 'Missing workspaceId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps?workspace_slug=${workspaceId}&items_per_page=50&page=1`;
        const headers = { 'Authorization': apiToken };
        logCurlCommand(url, 'GET', headers);
        response = await fetch(url, { method: 'GET', headers });
        break;
      }

      case 'testConnection': {
        if (!appId) {
          return new Response(
            JSON.stringify({ error: 'Missing appId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}`;
        const headers = { 'Authorization': apiToken };
        logCurlCommand(url, 'GET', headers);
        response = await fetch(url, { method: 'GET', headers });
        break;
      }

      case 'getUploadUrl': {
        if (!appId) {
          return new Response(
            JSON.stringify({ error: 'Missing appId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!artifactId || !fileName || !fileSizeBytes) {
          return new Response(
            JSON.stringify({ error: 'Missing artifactId, fileName, or fileSizeBytes' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/upload-url?file_name=${encodeURIComponent(fileName)}&file_size_bytes=${fileSizeBytes}`;
        const headers = { 'Authorization': apiToken };
        logCurlCommand(url, 'GET', headers);
        response = await fetch(url, { method: 'GET', headers });
        break;
      }

      case 'checkStatus': {
        if (!appId) {
          return new Response(
            JSON.stringify({ error: 'Missing appId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        if (!artifactId) {
          return new Response(
            JSON.stringify({ error: 'Missing artifactId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/status`;
        const headers = { 'Authorization': apiToken };
        logCurlCommand(url, 'GET', headers);
        response = await fetch(url, { method: 'GET', headers });
        break;
      }

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
