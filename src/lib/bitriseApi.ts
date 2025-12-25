export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface UploadResult {
  success: boolean;
  message: string;
  artifactId?: string;
}

const RM_API_HOST = 'https://api.bitrise.io';

function generateUUID(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function testConnection(apiToken: string, appId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Using v1 API endpoint
    const response = await fetch(
      `${RM_API_HOST}/release-management/v1/connected-apps/${appId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': apiToken,
        },
      }
    );

    if (response.ok) {
      return { success: true, message: 'Connection successful!' };
    } else if (response.status === 401) {
      return { success: false, message: 'Invalid API token' };
    } else if (response.status === 404) {
      return { success: false, message: 'App not found or not connected to Release Management' };
    } else {
      return { success: false, message: `Connection failed: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, message: 'Network error. Please check your connection.' };
  }
}

interface UploadUrlResponse {
  headers: Record<string, { name: string; value: string }>;
  method: string;
  url: string;
}

async function getUploadUrl(
  apiToken: string,
  appId: string,
  artifactId: string,
  fileName: string,
  fileSizeBytes: number
): Promise<{ success: boolean; data?: UploadUrlResponse; error?: string }> {
  const url = `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/upload-url?file_name=${encodeURIComponent(fileName)}&file_size_bytes=${fileSizeBytes}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': apiToken,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || `Failed to get upload URL: ${response.statusText}` };
    }
  } catch (error) {
    return { success: false, error: 'Network error while getting upload URL' };
  }
}

async function checkArtifactStatus(
  apiToken: string,
  appId: string,
  artifactId: string,
  retryCount = 0
): Promise<{ success: boolean; status?: string; error?: string }> {
  if (retryCount >= 10) {
    return { success: false, error: 'Artifact processing timed out after 10 retries' };
  }

  try {
    const response = await fetch(
      `${RM_API_HOST}/release-management/v1/connected-apps/${appId}/installable-artifacts/${artifactId}/status`,
      {
        method: 'GET',
        headers: {
          'Authorization': apiToken,
        },
      }
    );

    if (!response.ok) {
      return { success: false, error: `Failed to check status: ${response.statusText}` };
    }

    const data = await response.json();
    const status = data.status;

    if (status === 'processed_valid') {
      return { success: true, status };
    } else if (status === 'processed_invalid') {
      return { success: false, error: 'Artifact was processed but is invalid' };
    } else if (status === 'uploaded' || status === 'upload_requested') {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return checkArtifactStatus(apiToken, appId, artifactId, retryCount + 1);
    } else {
      return { success: false, error: `Unexpected status: ${status}` };
    }
  } catch (error) {
    return { success: false, error: 'Network error while checking status' };
  }
}

export function uploadArtifact(
  file: File,
  apiToken: string,
  appId: string,
  onProgress: (progress: UploadProgress) => void,
  abortController: AbortController
): Promise<UploadResult> {
  return new Promise(async (resolve, reject) => {
    const artifactId = generateUUID();
    
    // Step 1: Get upload URL from Bitrise API
    const uploadUrlResult = await getUploadUrl(apiToken, appId, artifactId, file.name, file.size);
    
    if (!uploadUrlResult.success || !uploadUrlResult.data) {
      resolve({
        success: false,
        message: uploadUrlResult.error || 'Failed to get upload URL',
      });
      return;
    }

    const uploadInfo = uploadUrlResult.data;
    
    // Step 2: Upload to Google Cloud Storage using the provided URL and headers
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000;
        const loadedDiff = event.loaded - lastLoaded;
        
        const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
        const remaining = event.total - event.loaded;
        const estimatedTimeRemaining = speed > 0 ? remaining / speed : 0;

        onProgress({
          loaded: event.loaded,
          total: event.total,
          percentage: Math.round((event.loaded / event.total) * 100),
          speed,
          estimatedTimeRemaining,
        });

        lastLoaded = event.loaded;
        lastTime = now;
      }
    });

    xhr.addEventListener('load', async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Step 3: Check artifact processing status
        const statusResult = await checkArtifactStatus(apiToken, appId, artifactId);
        
        if (statusResult.success) {
          resolve({
            success: true,
            message: 'Upload successful!',
            artifactId,
          });
        } else {
          resolve({
            success: false,
            message: statusResult.error || 'Artifact processing failed',
          });
        }
      } else {
        resolve({
          success: false,
          message: `Upload failed: ${xhr.statusText}`,
        });
      }
    });

    xhr.addEventListener('error', () => {
      resolve({
        success: false,
        message: 'Network error during upload',
      });
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('Upload cancelled'));
    });

    abortController.signal.addEventListener('abort', () => {
      xhr.abort();
    });

    // Open connection with the method from Bitrise API
    xhr.open(uploadInfo.method, uploadInfo.url);
    
    // Set headers from Bitrise API response
    Object.values(uploadInfo.headers).forEach((header) => {
      xhr.setRequestHeader(header.name, header.value);
    });

    xhr.send(file);
  });
}
