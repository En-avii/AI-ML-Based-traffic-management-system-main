/**
 * trafficAPI.ts
 * Service for interacting with the AI Traffic Management System backend API.
 */

// Define the base URL for your FastAPI backend
// Assumes backend runs on the same host, port 8000. Adjust if different.
const API_BASE_URL = `http://${window.location.hostname}:8000/api`;

/**
 * Handles API responses, parsing JSON and throwing errors for non-ok statuses.
 * @param response - The raw fetch Response object.
 * @returns Parsed JSON data.
 * @throws Error if response status is not ok.
 */
async function handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            errorData = { detail: response.statusText || 'Unknown fetch error' };
        }
        const errorMessage = errorData?.detail || `HTTP error! Status: ${response.status}`;
        console.error("API Error:", errorMessage, errorData);
        throw new Error(errorMessage);
    }
    // Handle cases where response might be empty (e.g., 204 No Content or 202 Accepted)
    if (response.status === 204 || response.status === 202) {
         return { status: response.status, message: response.statusText }; // Return status info
    }
    // Otherwise, parse JSON
    try {
        return await response.json();
    } catch (e) {
         console.error("API JSON Parse Error:", e);
         throw new Error("Failed to parse API response JSON.");
    }
}

/**
 * Main API service object.
 */
export const TrafficAPI = {
    /**
     * Sends an image file to the backend for vehicle detection.
     * @param formData - FormData object containing the image file under the key 'image'.
     * @returns Promise resolving to the vehicle detection result object.
     */
    async detectVehicles(formData: FormData): Promise<any> {
        console.log(`[API] Sending image to ${API_BASE_URL}/detect-vehicles`);
        const response = await fetch(`${API_BASE_URL}/detect-vehicles`, {
            method: 'POST',
            body: formData,
            // Headers are often set automatically for FormData, but you can add others if needed
            // headers: { 'Authorization': 'Bearer YOUR_TOKEN' },
        });
        return handleResponse(response);
    },

    /**
     * Gets the current status of the main intersection.
     * @returns Promise resolving to the intersection status object.
     */
    async getIntersectionStatus(): Promise<any> {
         console.log(`[API] Fetching ${API_BASE_URL}/intersection-status`);
        const response = await fetch(`${API_BASE_URL}/intersection-status`);
        return handleResponse(response);
    },

    /**
     * Sends a request to start the backend traffic simulation.
     * @returns Promise resolving to the API response (e.g., { status: "simulation_started" }).
     */
    async startSimulation(): Promise<any> {
        console.log(`[API] Sending POST to ${API_BASE_URL}/simulation/start`);
        const response = await fetch(`${API_BASE_URL}/simulation/start`, {
            method: 'POST',
        });
        return handleResponse(response);
    },

    /**
     * Sends a request to stop the backend traffic simulation.
     * @returns Promise resolving to the API response (e.g., { status: "simulation_stopped" }).
     */
    async stopSimulation(): Promise<any> {
        console.log(`[API] Sending POST to ${API_BASE_URL}/simulation/stop`);
        const response = await fetch(`${API_BASE_URL}/simulation/stop`, {
            method: 'POST',
        });
        return handleResponse(response);
    },

    /**
     * Sends an emergency alert notification to the backend.
     * @param alertData - Object conforming to the EmergencyAlert model.
     * @returns Promise resolving to the API response.
     */
    async sendEmergencyAlert(alertData: any): Promise<any> {
        console.log(`[API] Sending POST to ${API_BASE_URL}/emergency-override`);
        const response = await fetch(`${API_BASE_URL}/emergency-override`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alertData),
        });
        return handleResponse(response);
    },

    /**
     * Fetches traffic analytics summary data.
     * @param period - The time period for the summary (e.g., "current", "daily").
     * @returns Promise resolving to the analytics summary object.
     */
    async getAnalyticsSummary(period: string = "daily"): Promise<any> {
         console.log(`[API] Fetching ${API_BASE_URL}/analytics/summary?period=${period}`);
        const response = await fetch(`${API_BASE_URL}/analytics/summary?period=${period}`);
        return handleResponse(response);
    },

    /**
     * Fetches traffic heatmap data.
     * @param hours - The number of past hours to include in the heatmap.
     * @returns Promise resolving to the heatmap data object.
     */
    async getAnalyticsHeatmap(hours: number = 24): Promise<any> {
        console.log(`[API] Fetching ${API_BASE_URL}/analytics/heatmap?hours=${hours}`);
        const response = await fetch(`${API_BASE_URL}/analytics/heatmap?hours=${hours}`);
        return handleResponse(response);
    },

     /**
     * Fetches detailed performance report.
     * @returns Promise resolving to the performance report object.
     */
    async getPerformanceReport(): Promise<any> {
         console.log(`[API] Fetching ${API_BASE_URL}/analytics/performance`);
        const response = await fetch(`${API_BASE_URL}/analytics/performance`);
        return handleResponse(response);
    },

     /**
      * Updates the backend system configuration.
      * @param configData - Dictionary containing configuration keys and values to update.
      * @returns Promise resolving to the API response.
      */
     async updateConfiguration(configData: Record<string, any>): Promise<any> {
         console.log(`[API] Sending POST to ${API_BASE_URL}/configuration`);
         const response = await fetch(`${API_BASE_URL}/configuration`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(configData),
         });
         return handleResponse(response);
     },

     /**
      * Fetches system health information.
      * Note: This endpoint is outside the /api prefix in the Python code.
      * @returns Promise resolving to the health status object.
      */
     async getHealthStatus(): Promise<any> {
         const healthUrl = `http://${window.location.hostname}:8000/health`;
         console.log(`[API] Fetching ${healthUrl}`);
         const response = await fetch(healthUrl);
         return handleResponse(response);
     },

     /**
      * Fetches general system information.
      * Note: This endpoint is outside the /api prefix in the Python code.
      * @returns Promise resolving to the system info object.
      */
     async getSystemInfo(): Promise<any> {
         const infoUrl = `http://${window.location.hostname}:8000/system/info`;
         console.log(`[API] Fetching ${infoUrl}`);
         const response = await fetch(infoUrl);
         return handleResponse(response);
     },

};
