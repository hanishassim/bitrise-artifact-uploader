// Supabase Edge Function: bitrise-proxy
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RM_API_HOST = 'https://api.bitrise.io';

Deno.serve(async (req: Request) => {
  const logs: string[] = [];
  logs.push(`Request received at ${new Date().toISOString()}`);

  const origin = req.headers.get('Origin') || '';
  logs.push(`Origin: ${origin}`);

  // IMPORTANT: Replace this with your frontend's production URL
  const productionUrl = process.env.PRODUCTION_URL || 'https://REPLACE_WITH_YOUR_PRODUCTION_URL.com';

  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:8080',
    productionUrl,
  ];

  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-workspace-id',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    logs.push('Handling OPTIONS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logs.push('Parsing request body...');
    const body = await req.json();
    const { action, apiToken, appId, workspaceId, artifactId, fileName, fileSizeBytes, whatsNew, withPublicPage } = body;
    logs.push(`Action: ${action}`);

    // uploadFile action doesn't require apiToken (uses pre-signed URL)
    if (!apiToken && action !== 'uploadFile') {
      logs.push('Error: Missing apiToken');
      return new Response(
        JSON.stringify({ error: 'Missing apiToken', logs }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let response: Response;
    let url: string;
    let curlCommand: string | undefined;

    const generateCurlCommand = (url: string, method: string, headers: Record<string, string>, body?: string) => {
      const redactedHeaders = { ...headers };
      if (redactedHeaders['Authorization']) {
        redactedHeaders['Authorization'] = '[REDACTED]';
      }

      const headerPart = Object.entries(redactedHeaders).map(([key, value]) => `-H '${key}: ${value}'`).join(' ');
      let command = `curl -X ${method} ${headerPart} '${url}'`;
      if (body) {
        command += ` -d '${body.replace(/'/g, "'\\''")}'`;
      }
      return command;
    };

    switch (action) {
      case 'getOrganizations': {
        logs.push('Action: getOrganizations');
        url = `${RM_API_HOST}/v0.1/organizations`;
        const headers = { 'Authorization': apiToken };
        curlCommand = generateCurlCommand(url, 'GET', headers);
        logs.push(curlCommand);
        response = await fetch(url, { method: 'GET', headers });
        logs.push(`Bitrise API response status: ${response.status}`);
        break;
      }

      case 'listConnectedApps': {
        logs.push('Action: listConnectedApps');
        if (!workspaceId) {
          logs.push('Error: Missing workspaceId');
          return new Response(
            JSON.stringify({ error: 'Missing workspaceId', logs }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps?workspace_slug=${workspaceId}&items_per_page=50&page=1`;
        const headers = { 'Authorization': apiToken };
        curlCommand = generateCurlCommand(url, 'GET', headers);
        logs.push(curlCommand);
        response = await fetch(url, { method: 'GET', headers });
        logs.push(`Bitrise API response status: ${response.status}`);
        break;
      }

      case 'testConnection': {
        logs.push('Action: testConnection');
        if (!appId) {
          logs.push('Error: Missing appId');
          return new Response(
            JSON.stringify({ error: 'Missing appId', logs }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}`;
        const headers = { 'Authorization': apiToken };
        curlCommand = generateCurlCommand(url, 'GET', headers);
        logs.push(curlCommand);
        response = await fetch(url, { method: 'GET', headers });
        logs.push(`Bitrise API response status: ${response.status}`);
        break;
      }

      case 'getUploadUrl': {
        logs.push('Action: getUploadUrl');
        if (!appId || !artifactId || !fileName || !fileSizeBytes) {
          logs.push('Error: Missing required parameters for getUploadUrl');
          return new Response(
            JSON.stringify({ error: 'Missing appId, artifactId, fileName, or fileSizeBytes', logs }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Updated endpoint: /connected-apps/{connected_app_id}/installable-artifacts/{installable_artifact_id}/upload-url
        const queryParams = new URLSearchParams({
          file_name: fileName,
          file_size_bytes: fileSizeBytes.toString(),
        }).toString();
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/upload-url?${queryParams}`;
        const headers = { 'Authorization': apiToken };
        curlCommand = generateCurlCommand(url, 'GET', headers);
        logs.push(curlCommand);
        response = await fetch(url, { method: 'GET', headers });
        logs.push(`Bitrise API response status: ${response.status}`);
        break;
      }

      case 'checkStatus': {
        logs.push('Action: checkStatus');
        if (!appId || !artifactId) {
          logs.push('Error: Missing appId or artifactId');
          return new Response(
            JSON.stringify({ error: 'Missing appId or artifactId', logs }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Updated endpoint: /connected-apps/{connected_app_id}/installable-artifacts/{installable_artifact_id}/status
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/status`;
        const headers = { 'Authorization': apiToken };
        curlCommand = generateCurlCommand(url, 'GET', headers);
        logs.push(curlCommand);
        response = await fetch(url, { method: 'GET', headers });
        logs.push(`Bitrise API response status: ${response.status}`);
        break;
      }

      case 'submitWhatsNew': {
        logs.push('Action: submitWhatsNew');
        if (!appId || !artifactId || !whatsNew) {
          logs.push('Error: Missing required parameters for submitWhatsNew');
          return new Response(
            JSON.stringify({ error: 'Missing appId, artifactId, or whatsNew', logs }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Updated endpoint: /connected-apps/{connected_app_id}/installable-artifacts/{installable_artifact_id}/what-to-test
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/what-to-test`;
        const headers = { 'Authorization': apiToken, 'Content-Type': 'application/json' };
        const payload = JSON.stringify({ what_to_test: whatsNew });
        curlCommand = generateCurlCommand(url, 'PATCH', headers, payload);
        logs.push(curlCommand);
        response = await fetch(url, { method: 'PATCH', headers, body: payload });
        logs.push(`Bitrise API response status: ${response.status}`);
        break;
      }

      case 'enablePublicPage': {
        logs.push('Action: enablePublicPage');
        if (!appId || !artifactId) {
          logs.push('Error: Missing appId or artifactId');
          return new Response(
            JSON.stringify({ error: 'Missing appId or artifactId', logs }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Updated endpoint: /connected-apps/{connected_app_id}/installable-artifacts/{installable_artifact_id}/public-install-page
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/public-install-page`;
        const headers = { 'Authorization': apiToken, 'Content-Type': 'application/json' };
        const payload = JSON.stringify({ with_public_page: withPublicPage ?? true });
        curlCommand = generateCurlCommand(url, 'PATCH', headers, payload);
        logs.push(curlCommand);
        response = await fetch(url, { method: 'PATCH', headers, body: payload });
        logs.push(`Bitrise API response status: ${response.status}`);
        break;
      }

      case 'getInstallableArtifacts': {
        logs.push('Action: getInstallableArtifacts');
        if (!appId) {
          logs.push('Error: Missing appId');
          return new Response(
            JSON.stringify({ error: 'Missing appId', logs }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        // Endpoint: /connected-apps/{connected_app_id}/installable-artifacts
        url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts?items_per_page=50&page=1`;
        const headers = { 'Authorization': apiToken };
        curlCommand = generateCurlCommand(url, 'GET', headers);
        logs.push(curlCommand);
        response = await fetch(url, { method: 'GET', headers });
        logs.push(`Bitrise API response status: ${response.status}`);
        break;
      }

      default:
        logs.push(`Error: Invalid action - ${action}`);
        return new Response(
          JSON.stringify({ error: 'Invalid action', logs }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    logs.push('Parsing response from Bitrise...');
    const data = await response.json().catch((e) => {
      logs.push(`Error parsing Bitrise response JSON: ${e.message}`);
      return { error: 'Failed to parse JSON response from Bitrise' };
    });
    logs.push(`Final response status: ${response.status}`);

    return new Response(
      JSON.stringify({ status: response.status, data, curlCommand, logs }),
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
