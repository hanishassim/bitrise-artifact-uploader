// Supabase Edge Function: bitrise-upload
// Streaming proxy for file uploads to GCS to bypass CORS

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-upload-url, x-file-size, x-file-name',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const uploadUrl = req.headers.get('x-upload-url');
    const fileSize = req.headers.get('x-file-size');
    const fileName = req.headers.get('x-file-name');

    if (!uploadUrl || !fileSize) {
      return new Response(
        JSON.stringify({ error: 'Missing x-upload-url or x-file-size header' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Uploading file: ${fileName}, size: ${fileSize} bytes`);

    // Forward the request body stream directly to GCS
    const gcsResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/octet-stream',
        'X-Goog-Content-Length-Range': `0,${fileSize}`,
      },
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
