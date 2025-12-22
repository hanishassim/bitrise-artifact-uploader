# The `bitrise-proxy` Supabase Edge Function: A Comprehensive Explanation

This document provides a detailed explanation of the `bitrise-proxy` Supabase Edge Function, covering its purpose, how the frontend application interacts with it, and how to view its logs for debugging and monitoring.

## Why the Need for `bitrise-proxy`?

The `bitrise-proxy` is a crucial component of this application that serves several key purposes:

**1. Bypassing Browser Security (CORS):**

The primary reason for the `bitrise-proxy` is to work around the browser's **Same-Origin Policy**. This security feature prevents a web page from making requests to a different domain than the one that served the page. In this case, our frontend application (running on `localhost` or a deployed URL) cannot directly call the Bitrise API (`api.bitrise.io`) because they have different origins.

The `bitrise-proxy` acts as a middleman. It's a server-side function that receives requests from our frontend and then forwards them to the Bitrise API. Since the proxy is a server, it's not subject to the Same-Origin Policy and can make requests to any domain. This is a standard and secure way to handle cross-origin requests.

**2. Centralizing API Logic:**

The proxy centralizes all the logic for interacting with the Bitrise API in a single place (`supabase/functions/bitrise-proxy/index.ts`). This has several advantages:

*   **Cleaner Frontend Code:** The frontend code (`src/lib/bitriseApi.ts`) doesn't need to know the specific Bitrise API endpoints, headers, or request body formats. It just needs to call the proxy with a simple `action` and the necessary data.
*   **Easier Maintenance:** If the Bitrise API changes, we only need to update the proxy function, not the entire frontend. This makes the application easier to maintain and less prone to errors.

**3. Enhanced Debugging and Logging:**

The `bitrise-proxy` is designed with debuggability in mind. For every API call it makes, it:

*   **Generates a `curl` command:** This is an equivalent command-line representation of the API request, which is invaluable for debugging and replaying requests.
*   **Collects logs:** It logs every step of the process, from receiving the request to getting the response from the Bitrise API.

This information is then sent back to the frontend with every response, where it can be displayed in the UI to help developers understand what's happening under the hood.

## How the Frontend Uses the `bitrise-proxy`

The frontend interacts with the `bitrise-proxy` through the functions defined in `src/lib/bitriseApi.ts`. Here's a breakdown of the process:

1.  **Invoking the Function:** The frontend uses the Supabase client library to call the `bitrise-proxy` function:

    ```typescript
    const { data, error } = await supabase.functions.invoke('bitrise-proxy', {
      body: { action: 'listConnectedApps', apiToken, workspaceId }
    });
    ```

2.  **Passing an `action`:** The `action` in the request body tells the proxy which Bitrise API endpoint to call. For example, the `listConnectedApps` action corresponds to the `/release-management/v1/connected-apps` endpoint.

3.  **Handling the Response:** The frontend code is designed to handle the JSON response from the proxy, which includes the data from the Bitrise API, the `curlCommand`, and the `logs` array.

**A Special Case: File Uploads**

The file upload process is a bit different. It's a two-step process:

1.  **Get Upload URL:** The frontend first calls the `getUploadUrl` action on the proxy. The proxy then asks the Bitrise API for a temporary, signed URL where the file can be uploaded.
2.  **Direct Upload:** The frontend then uses a direct `XMLHttpRequest` to upload the file to the signed URL provided by Bitrise. This is a more efficient way to handle large file uploads, as it doesn't require the file to pass through the proxy.

## How to View the Supabase Edge Function Logs

You can view the logs for the `bitrise-proxy` function in your Supabase project's dashboard. This is useful for debugging issues that may not be apparent from the frontend logs.

Here's how to access the logs:

1.  **Go to your Supabase Project:** Log in to your Supabase account and navigate to your project.
2.  **Go to the "Edge Functions" section:** You'll find this in the left-hand sidebar.
3.  **Select the `bitrise-proxy` function:** Click on the `bitrise-proxy` function in the list.
4.  **View the "Logs" tab:** Here you'll find the logs for the function, including any errors or console messages.

The logs in the Supabase dashboard are particularly useful for seeing server-side errors that might not be sent back to the client, such as uncaught exceptions or issues with the function's environment.
