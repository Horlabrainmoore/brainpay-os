# Appwrite integration

The web app is configured to use the existing BrainPay Appwrite project. The project ID and endpoint are public SDK configuration; never put an Appwrite API key or other server credential in a `VITE_` variable.

## Local setup

1. Install the SDK and refresh the project lockfiles from the repository root:

   ```bash
   npm install appwrite@^28.2.0
   ```

2. Copy `.env.example` to `.env.local` and verify `VITE_APPWRITE_PROJECT_ID` and `VITE_APPWRITE_ENDPOINT`. The Appwrite project name is informational and is not required by the SDK client.
3. Run `npm run dev`.

At application startup `src/main.tsx` makes one `Health.get()` request through the Appwrite SDK and logs whether the health check succeeded. The Web SDK `Client` does not provide a `ping()` method, so the Appwrite Health service is used for this connectivity check.

The repository already exists as a Vite + React + TypeScript application, so no starter kit was cloned or project files replaced.
