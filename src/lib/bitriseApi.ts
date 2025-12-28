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

export interface InstallableArtifact {
  id: string;
  platform: 'ios' | 'android';
  public_install_page_url?: string;
  status: string;
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
): Promise<{ success: boolean; data?: ConnectedApp[]; error?: string; curlCommand?: string; logs?: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'listConnectedApps', apiToken, workspaceId }
    });

    if (error) {
      return { success: false, error: 'Network error. Please check your connection.' };
    }

    const { status, curlCommand, logs } = data;

    if (status === 200) {
      const apps: ConnectedApp[] = data.data?.items || [];
      return { success: true, data: apps, curlCommand, logs };
    }

    // Handle non-200 statuses
    if (status === 400) {
      return { success: false, error: 'Invalid request parameters', curlCommand, logs };
    }
    if (status === 401) {
      return { success: false, error: 'Invalid or expired API token', curlCommand, logs };
    }
    if (status === 403) {
      return { success: false, error: 'Access forbidden. Check your permissions.', curlCommand, logs };
    }
    if (status === 404) {
      return { success: false, error: 'Workspace not found', curlCommand, logs };
    }
    if (status === 500) {
      return { success: false, error: 'Bitrise server error. Please try again later.', curlCommand, logs };
    }

    const errorMessage = data.error || data.data?.error || 'An unknown error occurred';
    return { success: false, error: errorMessage, curlCommand, logs };

  } catch (error) {
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

export async function testConnection(
  apiToken: string,
  workspaceId: string
): Promise<{ success: boolean; message: string; curlCommand?: string; logs?: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'listConnectedApps', apiToken, workspaceId }
    });

    if (error) {
      return { success: false, message: 'Network error. Please check your connection.' };
    }

    const { status, curlCommand, logs } = data;

    if (status === 200) {
      return { success: true, message: 'Connection successful!', curlCommand, logs };
    }

    // Handle non-200 statuses
    if (status === 400) {
      return { success: false, message: 'Invalid request parameters', curlCommand, logs };
    }
    if (status === 401) {
      return { success: false, message: 'Invalid or expired API token', curlCommand, logs };
    }
    if (status === 403) {
      return { success: false, message: 'Access forbidden. Check your permissions.', curlCommand, logs };
    }
    if (status === 404) {
      return { success: false, message: 'Workspace not found', curlCommand, logs };
    }
    if (status === 500) {
      return { success: false, message: 'Bitrise server error. Please try again later.', curlCommand, logs };
    }

    const errorMessage = data.error || data.data?.error || 'Connection failed';
    return { success: false, message: errorMessage, curlCommand, logs };

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
): Promise<{ success: boolean; data?: UploadUrlResponse; error?: string; curlCommand?: string; logs?: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'getUploadUrl', apiToken, appId, artifactId, fileName, fileSizeBytes }
    });

    if (error) {
      return { success: false, error: 'Network error while getting upload URL' };
    }

    const { status, curlCommand, logs } = data;

    if (status === 200) {
      return { success: true, data: data.data, curlCommand, logs };
    }

    // Handle non-200 statuses
    if (status === 400) {
      return { success: false, error: 'Invalid file parameters', curlCommand, logs };
    }
    if (status === 401) {
      return { success: false, error: 'Invalid or expired API token', curlCommand, logs };
    }
    if (status === 403) {
      return { success: false, error: 'Access forbidden. Check your permissions.', curlCommand, logs };
    }
    if (status === 404) {
      return { success: false, error: 'Connected app or artifact not found', curlCommand, logs };
    }
    if (status === 500) {
      return { success: false, error: 'Bitrise server error', curlCommand, logs };
    }

    return { success: false, error: data.data?.message || `Failed to get upload URL (${status})`, curlCommand, logs };
  } catch (error) {
    return { success: false, error: 'Network error while getting upload URL' };
  }
}

async function checkArtifactStatus(
  apiToken: string,
  appId: string,
  artifactId: string,
  platform: 'ios' | 'android',
  retryCount = 0,
  addApiLog?: (log: { curlCommand?: string; logs?: string[] }) => void
): Promise<{ success: boolean; data?: ArtifactStatus; error?: string; curlCommand?: string; logs?: string[] }> {
  if (retryCount >= 15) {
    return { success: false, error: 'Artifact processing timed out after 15 retries' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'checkStatus', apiToken, appId, artifactId }
    });

    if (error) {
      return { success: false, error: 'Network error while checking status' };
    }

    const { status, curlCommand, logs } = data;

    if (addApiLog) {
      addApiLog({ curlCommand, logs });
    }

    // Handle non-200 statuses
    if (status === 400) {
      return { success: false, error: 'Invalid request parameters', curlCommand, logs };
    }
    if (status === 401) {
      return { success: false, error: 'Invalid or expired API token', curlCommand, logs };
    }
    if (status === 403) {
      return { success: false, error: 'Access forbidden. Check your permissions.', curlCommand, logs };
    }
    if (status === 404) {
      return { success: false, error: 'Artifact not found', curlCommand, logs };
    }
    if (status === 500) {
      return { success: false, error: 'Bitrise server error', curlCommand, logs };
    }

    if (status !== 200) {
      return { success: false, error: `Failed to check status (${status})`, curlCommand, logs };
    }

    const artifactStatus = data.data.status;

    if (artifactStatus === 'processed_valid') {
      // Enable public install page
      const publicPageResult = await enablePublicInstallPage(apiToken, appId, artifactId);
      if (addApiLog && publicPageResult.curlCommand) {
        addApiLog({ curlCommand: publicPageResult.curlCommand, logs: publicPageResult.logs });
      }

      if (publicPageResult.success) {
        // Fetch installable artifacts to get the public_install_page_url
        const artifactsResult = await getInstallableArtifacts(apiToken, appId);
        if (addApiLog && artifactsResult.curlCommand) {
          addApiLog({ curlCommand: artifactsResult.curlCommand, logs: artifactsResult.logs });
        }

        if (artifactsResult.success && artifactsResult.data) {
          // Filter to find the matching artifact by id and platform
          const matchingArtifact = artifactsResult.data.find(
            (a) => a.id === artifactId && a.platform === platform
          );

          if (matchingArtifact && matchingArtifact.public_install_page_url) {
            return {
              success: true,
              data: {
                status: 'processed_valid',
                public_install_page_url: matchingArtifact.public_install_page_url,
              },
              curlCommand,
              logs,
            };
          }
        }

        // Fallback if we couldn't get the URL from artifacts list
        return {
          success: true,
          data: {
            status: 'processed_valid',
            public_install_page_url: publicPageResult.data?.public_install_page_url,
          },
          curlCommand,
          logs,
        };
      }

      return {
        success: true,
        data: {
          status: 'processed_valid',
        },
        curlCommand,
        logs,
      };
    } else if (artifactStatus === 'processed_invalid') {
      return { success: false, error: 'Artifact was processed but is invalid', curlCommand, logs };
    } else if (artifactStatus === 'uploaded' || artifactStatus === 'upload_requested' || artifactStatus === 'processing') {
      // Wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return checkArtifactStatus(apiToken, appId, artifactId, platform, retryCount + 1, addApiLog);
    } else {
      return { success: false, error: `Unexpected status: ${artifactStatus}`, curlCommand, logs };
    }
  } catch (error) {
    return { success: false, error: 'Network error while checking status' };
  }
}

export async function getInstallableArtifacts(
  apiToken: string,
  appId: string
): Promise<{ success: boolean; data?: InstallableArtifact[]; error?: string; curlCommand?: string; logs?: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'getInstallableArtifacts', apiToken, appId }
    });

    if (error) {
      return { success: false, error: 'Network error while fetching artifacts' };
    }

    const { status, curlCommand, logs } = data;

    if (status === 200) {
      const artifacts: InstallableArtifact[] = data.data?.items || [];
      return { success: true, data: artifacts, curlCommand, logs };
    }

    // Handle non-200 statuses
    if (status === 400) {
      return { success: false, error: 'Invalid request parameters', curlCommand, logs };
    }
    if (status === 401) {
      return { success: false, error: 'Invalid or expired API token', curlCommand, logs };
    }
    if (status === 403) {
      return { success: false, error: 'Access forbidden. Check your permissions.', curlCommand, logs };
    }
    if (status === 404) {
      return { success: false, error: 'Connected app not found', curlCommand, logs };
    }
    if (status === 500) {
      return { success: false, error: 'Bitrise server error', curlCommand, logs };
    }

    return { success: false, error: `Failed to fetch artifacts (${status})`, curlCommand, logs };
  } catch (error) {
    return { success: false, error: 'Network error while fetching artifacts' };
  }
}

export async function submitWhatsNew(
  apiToken: string,
  appId: string,
  artifactId: string,
  whatsNewText: string
): Promise<{ success: boolean; error?: string; curlCommand?: string; logs?: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'submitWhatsNew', apiToken, appId, artifactId, whatsNew: whatsNewText }
    });
    if (error) return { success: false, error: 'Network error' };
    const { status, curlCommand, logs } = data;
    if (status === 200 || status === 204) return { success: true, curlCommand, logs };
    if (status === 400) return { success: false, error: 'Invalid request parameters', curlCommand, logs };
    if (status === 401) return { success: false, error: 'Invalid or expired API token', curlCommand, logs };
    if (status === 403) return { success: false, error: 'Access forbidden. Check your permissions.', curlCommand, logs };
    if (status === 404) return { success: false, error: 'Artifact not found', curlCommand, logs };
    if (status === 500) return { success: false, error: 'Bitrise server error', curlCommand, logs };
    return { success: false, error: `Unexpected error (${status})`, curlCommand, logs };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}

export async function enablePublicInstallPage(
  apiToken: string,
  appId: string,
  artifactId: string
): Promise<{ success: boolean; data?: ArtifactStatus, error?: string; curlCommand?: string; logs?: string[] }> {
  try {
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'enablePublicPage', apiToken, appId, artifactId, withPublicPage: true }
    });

    if (error) return { success: false, error: 'Network error' };
    const { status, curlCommand, logs } = data;
    
    if (status === 200 || status === 204) {
      return {
        success: true,
        data: {
          status: 'enabled',
          public_install_page_url: data.data?.public_install_page_url,
        },
        curlCommand,
        logs
      };
    }

    if (status === 400) return { success: false, error: 'Invalid request parameters', curlCommand, logs };
    if (status === 401) return { success: false, error: 'Invalid or expired API token', curlCommand, logs };
    if (status === 403) return { success: false, error: 'Access forbidden. Check your permissions.', curlCommand, logs };
    if (status === 404) return { success: false, error: 'Artifact not found', curlCommand, logs };
    if (status === 500) return { success: false, error: 'Bitrise server error', curlCommand, logs };
    return { success: false, error: `Unexpected error (${status})`, curlCommand, logs };
  } catch (error) {
    return { success: false, error: 'Network error' };
  }
}


export function uploadArtifact(
  file: File,
  apiToken: string,
  appId: string,
  platform: 'ios' | 'android',
  onProgress: (progress: UploadProgress) => void,
  abortController: AbortController,
  addApiLog: (log: { curlCommand?: string; logs?: string[] }) => void
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const artifactId = generateUUID();

    const upload = async () => {
      // Step 1: Get a pre-signed upload URL from the Bitrise API.
      // This is a GET request, as confirmed by the Swagger documentation.
      const uploadUrlResult = await getUploadUrl(apiToken, appId, artifactId, file.name, file.size);
      addApiLog({ curlCommand: uploadUrlResult.curlCommand, logs: uploadUrlResult.logs });

      if (!uploadUrlResult.success || !uploadUrlResult.data) {
        resolve({
          success: false,
          message: uploadUrlResult.error || 'Failed to get upload URL',
        });
        return;
      }

      const uploadInfo = uploadUrlResult.data;

      // Step 2: Perform the actual file upload to the pre-signed URL.
      // The response from getUploadUrl includes the exact URL, method (PUT), and headers required for this request.
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
          // Step 3: Check artifact processing status (includes auto-enable public page)
          const statusResult = await checkArtifactStatus(apiToken, appId, artifactId, platform, 0, addApiLog);

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
    const headers: Record<string, string> = {};
    Object.values(uploadInfo.headers).forEach((header) => {
      xhr.setRequestHeader(header.name, header.value);
      headers[header.name] = header.value;
    });

    // Generate and log cURL command for the upload
    const headerPart = Object.entries(headers).map(([key, value]) => `-H '${key}: ${value}'`).join(' ');
    const curlCommand = `curl -X ${uploadInfo.method} ${headerPart} --data-binary '@${file.name}' '${uploadInfo.url}'`;
    addApiLog({ curlCommand, logs: [`[File Upload] cURL command generated for ${file.name}`] });

    xhr.send(file);
    }
    upload();
  });
}
