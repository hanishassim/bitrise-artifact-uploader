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

    // Use Bitrise-provided headers as the base.
    // IMPORTANT: We must NOT override headers provided by Bitrise (like Content-Type)
    // because they are used to generate the signed URL signature.
    const finalHeaders: Record<string, string> = { ...bitriseHeaders };

    // Determine fallback Content-Type ONLY if not provided by Bitrise at all
    if (!finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
      let contentType = 'application/octet-stream';
      if (fileName) {
        const extension = fileName.split('.').pop()?.toLowerCase();
        if (extension === 'aab') {
          contentType = 'application/x-authorware-bin';
        } else if (extension === 'apk') {
          contentType = 'application/vnd.android.package-archive';
        }
      }
      finalHeaders['Content-Type'] = contentType;
    }

    // Ensure X-Goog-Content-Length-Range is set ONLY if not provided by Bitrise
    if (!finalHeaders['X-Goog-Content-Length-Range'] && !finalHeaders['x-goog-content-length-range']) {
      if (fileSize) {
        finalHeaders['X-Goog-Content-Length-Range'] = `0,${fileSize}`;
      }
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
