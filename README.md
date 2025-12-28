# Bitrise Artifact Uploader

This project is a web-based tool for uploading mobile application artifacts (IPA, APK, and AAB files) to Bitrise Release Management. It provides a simple and intuitive interface for selecting your Bitrise app and uploading new builds.

The application uses a Supabase Edge Function (`bitrise-proxy`) to securely communicate with the Bitrise API, ensuring that your API tokens are never exposed on the client-side.

## Features

-   Securely connect to your Bitrise account using an API token and workspace ID.
-   List and select from your available Bitrise applications.
-   Drag-and-drop or browse to upload your `.ipa`, `.apk`, or `.aab` files.
-   View a history of your recent uploads.
-   See detailed API logs for debugging purposes.

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

## Technologies Used

This project is built with:

-   Vite
-   TypeScript
-   React
-   shadcn-ui
-   Tailwind CSS
-   Supabase (for Edge Functions)
