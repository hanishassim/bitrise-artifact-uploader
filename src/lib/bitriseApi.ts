import { supabase } from "@/integrations/supabase/client";

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface ArtifactStatus {
  status: string;
  installable_artifact_url?: string;
  public_install_page_url?: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  artifactId?: string;
  artifactStatus?: ArtifactStatus;
}

export interface ConnectedApp {
  id: string;
  app_name?: string;
  project_title?: string;
  store_app_id?: string;
  platform?: 'ios' | 'android';
  icon_url?: string;
}

function generateUUID(): string {
  const hex = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export async function listConnectedApps(
  apiToken: string, 
  workspaceId: string
): Promise<{ success: boolean; data?: ConnectedApp[]; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'listConnectedApps', apiToken, workspaceId }
    });

    if (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }

    const status = data.status;

    if (status === 200) {
      const apps: ConnectedApp[] = data.data.data || [];
      return { success: true, data: apps };
    } else if (status === 400) {
      return { success: false, error: 'Invalid request parameters' };
    } else if (status === 401) {
      return { success: false, error: 'Invalid or expired API token' };
    } else if (status === 403) {
      return { success: false, error: 'Access forbidden. Check your workspace permissions.' };
    } else if (status === 404) {
      return { success: false, error: 'Workspace not found' };
    } else if (status === 500) {
      return { success: false, error: 'Bitrise server error. Please try again later.' };
    } else {
      return { success: false, error: `Unexpected error (${status})` };
    }
  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function testConnection(apiToken: string, appId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'testConnection', apiToken, appId }
    });

    if (error) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }

    if (data.status === 200) {
      return { success: true, message: 'Connection successful!' };
    } else if (data.status === 401) {
      return { success: false, message: 'Invalid API token' };
    } else if (data.status === 404) {
      return { success: false, message: 'App not found or not connected to Release Management' };
    } else {
      return { success: false, message: `Connection failed: ${data.data?.message || 'Unknown error'}` };
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
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'getUploadUrl', apiToken, appId, artifactId, fileName, fileSizeBytes }
    });

    if (error) {
      return { success: false, error: 'Network error while getting upload URL' };
    }

    if (data.status === 200) {
      return { success: true, data: data.data };
    } else {
      return { success: false, error: data.data?.message || `Failed to get upload URL` };
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
): Promise<{ success: boolean; data?: ArtifactStatus; error?: string }> {
  if (retryCount >= 10) {
    return { success: false, error: 'Artifact processing timed out after 10 retries' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'checkStatus', apiToken, appId, artifactId }
    });

    if (error) {
      return { success: false, error: 'Network error while checking status' };
    }

    if (data.status !== 200) {
      return { success: false, error: `Failed to check status` };
    }

    const status = data.data.status;
    const artifact = data.data;

    if (status === 'processed_valid') {
      return { 
        success: true, 
        data: {
          status: artifact.status,
          installable_artifact_url: artifact.installable_artifact_url,
          public_install_page_url: artifact.public_install_page_url,
        }
      };
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

export async function submitWhatsNew(
  apiToken: string,
  appId: string,
  artifactId: string,
  whatsNewText: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'submitWhatsNew', apiToken, appId, artifactId, whatsNew: whatsNewText }
    });
    if (error) return { success: false, error: 'Network error' };
    if (data.status === 200) return { success: true };
    if (data.status === 400) return { success: false, error: 'Invalid request parameters' };
    if (data.status === 401) return { success: false, error: 'Invalid or expired API token' };
    if (data.status === 404) return { success: false, error: 'Artifact not found' };
    if (data.status === 500) return { success: false, error: 'Bitrise server error' };
    return { success: false, error: `Unexpected error (${data.status})` };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function enablePublicInstallPage(
  apiToken: string,
  appId: string,
  artifactId: string
): Promise<{ success: boolean; data?: ArtifactStatus, error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'enablePublicPage', apiToken, appId, artifactId }
    });

    if (error) return { success: false, error: 'Network error' };
    if (data.status !== 200) {
      if (data.status === 400) return { success: false, error: 'Invalid request parameters' };
      if (data.status === 401) return { success: false, error: 'Invalid or expired API token' };
      if (data.status === 404) return { success: false, error: 'Artifact not found' };
      if (data.status === 500) return { success: false, error: 'Bitrise server error' };
      return { success: false, error: `Unexpected error (${data.status})` };
    }

    const artifact = data.data;

    return {
      success: true,
      data: {
        status: artifact.status,
        installable_artifact_url: artifact.installable_artifact_url,
        public_install_page_url: artifact.public_install_page_url,
      }
    };
  } catch (error) {
    return { success: false, error: 'Network error' };
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
    const artifactId = generateUUID();

    const upload = async () => {
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

    xhr.addEventListener('load', () => {
      const processArtifact = async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          // Step 3: Check artifact processing status
          const statusResult = await checkArtifactStatus(apiToken, appId, artifactId);

          if (statusResult.success) {
            resolve({
              success: true,
              message: 'Upload successful!',
              artifactId,
              artifactStatus: statusResult.data,
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
      };
      processArtifact();
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
    }
    upload();
  });
}
