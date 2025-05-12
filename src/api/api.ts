import alertManager from "@/util/alerts.ts";

/**
 * Sends an HTTP request to the specified API endpoint.
 *
 * @param url - The endpoint URL to send the request to
 * @param method - The HTTP method to use for the request (GET, POST, PUT, DELETE, etc.)
 * @param shouldDisplaySuccessAlert - Whether to show a success alert after successful request. Defaults to true.
 * @param body - Optional request body data to send
 * @returns Promise resolving to the response data from the server
 * @throws {Error} If the server response cannot be parsed or if the response indicates an error
 *
 * @example
 * // Example GET request
 * const data = await sendApiRequest('/api/users', 'GET');
 *
 * @example
 * // Example POST request with body
 * const newUser = await sendApiRequest('/api/users', 'POST', true, { name: 'John' });
 */
export const sendApiRequest = async (
    url: string,
    method: string,
    shouldDisplaySuccessAlert: boolean = true,
    body?: any
) => {
    try {
        const response = await fetch(url, {
            method,
            headers: body && { "Content-Type": "application/json" },
            body: body && JSON.stringify(body),
        });
        const invalidStatusCodes = [502, 503, 504];
        if (invalidStatusCodes.includes(response.status)) {
            throw new Error(
                "Server is currently unavailable. Please try again later."
            );
        }

        let json;
        try {
            json = await response.json();
        } catch (e: any) {
            throw new Error("Failed to parse server response: " + e.message);
        }

        if (!response.ok) throw new Error(json.message);
        if (shouldDisplaySuccessAlert)
            alertManager.addAlert(json.message, "success");
        return json.data;
    } catch (error: any) {
        alertManager.addAlert(error.message, "error", 3000);
        throw error;
    }
};
