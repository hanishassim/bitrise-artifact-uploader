// Supabase Edge Function: bitrise-upload
// Streaming proxy for file uploads to GCS to bypass CORS

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-upload-url, x-file-size, x-file-name, x-upload-headers',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const uploadUrl = req.headers.get('x-upload-url');
    const fileSize = req.headers.get('x-file-size');
    const fileName = req.headers.get('x-file-name');
    const uploadHeadersRaw = req.headers.get('x-upload-headers');

    if (!uploadUrl || !fileSize) {
      return new Response(
        JSON.stringify({ error: 'Missing x-upload-url or x-file-size header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Uploading file: ${fileName}, size: ${fileSize} bytes`);

    // Parse Bitrise-provided headers
    let bitriseHeaders: Record<string, string> = {};
    if (uploadHeadersRaw) {
      try {
        bitriseHeaders = JSON.parse(uploadHeadersRaw);
      } catch (e) {
        console.error('Failed to parse x-upload-headers:', e);
      }
    }

    // Determine fallback Content-Type based on file extension if not provided by Bitrise
    let contentType = bitriseHeaders['Content-Type'] || bitriseHeaders['content-type'] || 'application/octet-stream';

    if (fileName) {
      const extension = fileName.split('.').pop()?.toLowerCase();
      // If Bitrise didn't provide a specific content type or provided octet-stream, we apply our overrides
      if (contentType === 'application/octet-stream') {
        if (extension === 'aab') {
          contentType = 'application/x-authorware-bin';
        } else if (extension === 'apk') {
          contentType = 'application/vnd.android.package-archive';
        }
      }
    }

    // Prepare final headers for GCS
    const finalHeaders: Record<string, string> = {
      ...bitriseHeaders,
      'Content-Type': contentType,
    };

    // Ensure X-Goog-Content-Length-Range is set as requested for Android artifacts
    // or kept if it was already in bitriseHeaders
    const extension = fileName?.split('.').pop()?.toLowerCase();
    if (extension === 'aab' || extension === 'apk') {
      if (!finalHeaders['X-Goog-Content-Length-Range'] && !finalHeaders['x-goog-content-length-range']) {
        finalHeaders['X-Goog-Content-Length-Range'] = `0,${fileSize}`;
      }
    } else if (fileSize && !finalHeaders['X-Goog-Content-Length-Range'] && !finalHeaders['x-goog-content-length-range']) {
       // Original behavior for other files
       finalHeaders['X-Goog-Content-Length-Range'] = `0,${fileSize}`;
    }

    console.log(`Final headers for GCS:`, JSON.stringify(finalHeaders));

    // Forward the request body stream directly to GCS
    const gcsResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: finalHeaders,
      body: req.body,
    });

    console.log(`GCS response status: ${gcsResponse.status}`);

    const responseText = await gcsResponse.text();

    return new Response(
      JSON.stringify({
        success: gcsResponse.status >= 200 && gcsResponse.status < 300,
        status: gcsResponse.status,
        message: gcsResponse.status >= 200 && gcsResponse.status < 300 
          ? 'Upload successful' 
          : `Upload failed: ${responseText}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Upload proxy error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
