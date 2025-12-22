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

export async function testConnection(apiToken: string, appId: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await fetch(
      `https://api.bitrise.io/v0.1/apps/${appId}/release-management/connected-app`,
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

export function uploadArtifact(
  file: File,
  apiToken: string,
  appId: string,
  onProgress: (progress: UploadProgress) => void,
  abortController: AbortController
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const now = Date.now();
        const timeDiff = (now - lastTime) / 1000; // seconds
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

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve({
            success: true,
            message: 'Upload successful!',
            artifactId: response.id,
          });
        } catch {
          resolve({
            success: true,
            message: 'Upload successful!',
          });
        }
      } else {
        let errorMessage = `Upload failed: ${xhr.statusText}`;
        try {
          const errorResponse = JSON.parse(xhr.responseText);
          errorMessage = errorResponse.message || errorMessage;
        } catch {
          // Use default error message
        }
        resolve({
          success: false,
          message: errorMessage,
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

    // Handle abort controller
    abortController.signal.addEventListener('abort', () => {
      xhr.abort();
    });

    const formData = new FormData();
    formData.append('artifact', file);

    xhr.open('POST', `https://api.bitrise.io/v0.1/apps/${appId}/release-management/installable-artifacts`);
    xhr.setRequestHeader('Authorization', apiToken);
    xhr.send(formData);
  });
}
