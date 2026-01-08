# Bitrise Artifact Uploader

![Bitrise-uploader](https://github.com/user-attachments/assets/6ee98726-bfca-4ab0-93ce-0dab39697c6c)

This open-source project is a web-based tool for uploading mobile application artifacts (IPA, APK, and AAB files) to Bitrise Release Management. It provides a simple and intuitive interface for selecting your Bitrise app and uploading new builds.

The application uses a Supabase Edge Function (`bitrise-proxy`) to securely communicate with the Bitrise API, ensuring that your API tokens are never exposed on the client-side.

## Features

-   Securely connect to your Bitrise account using an API token and workspace ID.
-   List and select from your available Bitrise applications.
-   Drag-and-drop or browse to upload your `.ipa`, `.apk`, or `.aab` files.
-   View a history of your recent uploads.
-   See detailed API logs for debugging purposes.

## Sequence Diagram

```mermaid
sequenceDiagram
    participant User
    participant ReactApp as React App
    participant SupabaseEdge as Supabase Edge Function
    participant BitriseAPI as Bitrise API
    participant BitriseStorage as Bitrise Storage

    Note over User, BitriseStorage: Authentication & App Selection
    User->>ReactApp: Enter API Token & Workspace ID
    ReactApp->>SupabaseEdge: Test Connection (listConnectedApps)
    SupabaseEdge->>BitriseAPI: GET /release-management/v1/connected-apps
    BitriseAPI-->>SupabaseEdge: Apps list + status
    SupabaseEdge-->>ReactApp: Response + logs + curl command
    ReactApp-->>User: Show connected apps list

    User->>ReactApp: Select app from list
    ReactApp->>ReactApp: Store selected app in state

    Note over User, BitriseStorage: File Upload Flow
    User->>ReactApp: Drag & drop or select artifact file
    ReactApp->>ReactApp: Validate file type (IPA/APK/AAB)
    ReactApp->>ReactApp: Calculate SHA256 hash
    ReactApp-->>User: Show file details + hash

    User->>ReactApp: Click Upload (optional: add "What's New")
    ReactApp->>ReactApp: Generate unique artifact ID
    
    Note over ReactApp, BitriseAPI: Get Upload URL
    ReactApp->>SupabaseEdge: getUploadUrl(apiToken, appId, artifactId, fileName, fileSize)
    SupabaseEdge->>BitriseAPI: GET /connected-apps/{appId}/installable-artifacts/{artifactId}/upload-url
    BitriseAPI-->>SupabaseEdge: Pre-signed upload URL + headers
    SupabaseEdge-->>ReactApp: Upload URL + logs + curl command

    Note over ReactApp, BitriseStorage: Direct File Upload
    ReactApp->>BitriseStorage: PUT file to pre-signed URL
    BitriseStorage-->>ReactApp: Upload progress events
    ReactApp-->>User: Show upload progress (speed, ETA)
    BitriseStorage-->>ReactApp: Upload complete (200 OK)

    Note over ReactApp, BitriseAPI: Status Polling & Processing
    loop Poll every 2 seconds (max 15 retries)
        ReactApp->>SupabaseEdge: checkStatus(apiToken, appId, artifactId)
        SupabaseEdge->>BitriseAPI: GET /connected-apps/{appId}/installable-artifacts/{artifactId}/status
        BitriseAPI-->>SupabaseEdge: Status response
        SupabaseEdge-->>ReactApp: Status + logs + curl command
    end
    
    alt Status is processed_valid
        ReactApp->>SupabaseEdge: enablePublicPage(apiToken, appId, artifactId)
        SupabaseEdge->>BitriseAPI: PATCH /connected-apps/{appId}/installable-artifacts/{artifactId}/public-install-page
        BitriseAPI-->>SupabaseEdge: Public page enabled
        SupabaseEdge-->>ReactApp: Response + logs + curl command
        
        ReactApp->>SupabaseEdge: getInstallableArtifacts(apiToken, appId)
        SupabaseEdge->>BitriseAPI: GET /connected-apps/{appId}/installable-artifacts
        BitriseAPI-->>SupabaseEdge: Artifacts list with public URLs
        SupabaseEdge-->>ReactApp: Artifacts + logs + curl command
        
    else Status is processed_invalid
        ReactApp-->>User: Show error - artifact is invalid
    end

    Note over ReactApp, BitriseAPI: Optional Release Notes
    opt User provided "What's New" text
        ReactApp->>SupabaseEdge: submitWhatsNew(apiToken, appId, artifactId, whatsNew)
        SupabaseEdge->>BitriseAPI: PATCH /connected-apps/{appId}/installable-artifacts/{artifactId}/what-to-test
        BitriseAPI-->>SupabaseEdge: Release notes updated
        SupabaseEdge-->>ReactApp: Response + logs + curl command
    end

    Note over User, ReactApp: Success State
    ReactApp-->>User: Show success with QR code & install link
    ReactApp->>ReactApp: Save upload to history (localStorage)
    ReactApp->>ReactApp: Show API logs panel with all curl commands

    Note over User, ReactApp: Error Handling
    alt Any API call fails
        ReactApp-->>User: Show error message + API logs
        ReactApp->>ReactApp: Save failed upload to history
    end
```

## Getting Started

To run this project locally, you'll need Node.js and npm installed.

```sh
# Step 1: Clone the repository.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server.
npm run dev
```

The development server will start, and you can access the application in your browser, usually at `http://localhost:8080`.

## Configuration

Before starting the development server, you need to set up your environment variables.

1.  **Create a `.env` file:** Copy the `.env.example` file to a new file named `.env`.

    ```sh
    cp .env.example .env
    ```

2.  **Add your Supabase credentials:** Open the `.env` file and replace the placeholder values with your Supabase project's credentials. You can find these in your Supabase project's "API" settings.

    ```
    VITE_SUPABASE_PROJECT_ID="your-project-id"
    VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
    VITE_SUPABASE_URL="https://your-project-id.supabase.co"
    ```

## Deploying Supabase Edge Functions

This project requires the `bitrise-proxy` Edge Function to be deployed to your Supabase project to handle Bitrise API requests securely.

1.  **Install the Supabase CLI:**

    ```sh
    npm i supabase --save-dev
    ```

2.  **Update the Supabase config file:** Open `supabase/config.toml` and replace the placeholder `project_id` with your actual Supabase project ID.

3.  **Link your Supabase project:**

    ```sh
    npx supabase link --project-ref <PROJECT_ID>
    ```

3.  **Set your Supabase access token:** You will need to provide a `SUPABASE_ACCESS_TOKEN` with `owner` or `admin` permissions for the CLI to deploy the function.

    ```sh
    export SUPABASE_ACCESS_TOKEN=<YOUR_ACCESS_TOKEN>
    ```

4.  **Deploy the Edge Function:**

    ```sh
    npx supabase functions deploy --no-verify-jwt bitrise-proxy bitrise-upload
    ```

After completing these steps, the `bitrise-proxy` & `bitrise-upload` functions will be ready to handle API requests.

## Technologies Used

This project is built with:

-   Vite
-   TypeScript
-   React
-   shadcn-ui
-   Tailwind CSS
-   Supabase (for Edge Functions)

## Security Note

If you have accidentally committed your `.env` file to the repository, you should take immediate action to remove it from the Git history. Even after you delete the file and update your `.gitignore`, the file will still exist in the commit history. You can use a tool like `git-filter-repo` to permanently remove the file from your repository's history.

## License

Bitrise Artifact Uploader is released under the [MIT license](LICENSE). Feel free to use, modify, and distribute it as you wish. 

## Support

If you like this project you can [buy me a coffee](https://www.buymeacoffee.com/hanis).

<a href="https://www.buymeacoffee.com/hanis" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>