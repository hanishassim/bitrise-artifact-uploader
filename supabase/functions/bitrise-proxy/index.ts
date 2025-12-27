// Supabase Edge Function: bitrise-proxy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RM_API_HOST = 'https://api.bitrise.io';

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  // Allow requests from localhost on any port
  const isAllowedOrigin = origin && /^http:\/\/localhost:\d+$/.test(origin);

  const corsHeaders = {
    'Access-Control-Allow-Origin': isAllowedOrigin ? origin : '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-workspace-id',
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, apiToken, appId, workspaceId, artifactId, fileName, fileSizeBytes, whatsNew } = await req.json();

    console.log(`Bitrise proxy action: ${action}`);

    if (!apiToken) {
      return new Response(
        JSON.stringify({ error: 'Missing apiToken' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response: Response;
    let url: string;
    let curlCommand: string | undefined;

    const generateCurlCommand = (url: string, method: string, headers: Record<string, string>, body?: string) => {
      const headerPart = Object.entries(headers).map(([key, value]) => `-H '${key}: ${value}'`).join(' ');
      let command = `curl -X ${method} ${headerPart} '${url}'`;
      if (body) {
        command += ` -d '${body.replace(/'/g, "'\\''")}'`;
      }
      return command;
    };

    switch (action) {
      case 'listConnectedApps': {
        console.log('listConnectedApps');
        if (!workspaceId) {
          return new Response(
            JSON.stringify({ error: 'Missing workspaceId' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps?workspace_slug=${workspaceId}&items_per_page=50&page=1`;
        const headers = { 'Authorization': apiToken };
        curlCommand = generateCurlCommand(url, 'GET', headers);
        console.log(curlCommand);
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
        curlCommand = generateCurlCommand(url, 'GET', headers);
        console.log(curlCommand);
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
        curlCommand = generateCurlCommand(url, 'GET', headers);
        console.log(curlCommand);
        response = await fetch(url, { method: 'GET', headers });
        break;
      }

      case 'checkStatus': {
        if (!appId || !artifactId) {
          return new Response(JSON.stringify({ error: 'Missing appId or artifactId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/status`;
        const headers = { 'Authorization': apiToken };
        curlCommand = generateCurlCommand(url, 'GET', headers);
        console.log(curlCommand);
        response = await fetch(url, { method: 'GET', headers });
        break;
      }

      case 'submitWhatsNew': {
        if (!appId || !artifactId || !whatsNew) {
          return new Response(JSON.stringify({ error: 'Missing appId, artifactId, or whatsNew' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/what-to-test`;
        const headers = { 'Authorization': apiToken, 'Content-Type': 'application/json' };
        const body = JSON.stringify({ what_to_test: whatsNew });
        curlCommand = generateCurlCommand(url, 'PUT', headers, body);
        console.log(curlCommand);
        response = await fetch(url, { method: 'PUT', headers, body });
        break;
      }

      case 'enablePublicPage': {
        if (!appId || !artifactId) {
          return new Response(JSON.stringify({ error: 'Missing appId or artifactId' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/public-install-page`;
        const headers = { 'Authorization': apiToken, 'Content-Type': 'application/json' };
        curlCommand = generateCurlCommand(url, 'PUT', headers);
        console.log(curlCommand);
        response = await fetch(url, { method: 'PUT', headers });
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
      JSON.stringify({ status: response.status, data, curlCommand }),
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
