// Create WebSocket connection.
const originURL = window.location.origin;
const wsURL = convertToWebSocketURL(originURL);
const socket = new WebSocket(wsURL);

// Connection opened
socket.addEventListener("open", () => {
    socket.send(JSON.stringify("Hello Server!"));
});

// Listen for messages
socket.addEventListener("message", (event) => {
    const {data} = event
    console.log("Message from server ", data);
});

// Helper method to convert a URL to a WebSocket URL based on its protocol
function convertToWebSocketURL(originURL) {
    // Parse the original URL
    const url = new URL(originURL);

    // Check if the protocol is 'http' or 'https' and adjust accordingly for WebSockets
    if (url.protocol === 'https:') {
        url.protocol = 'wss:'; // Change HTTPS to WSS
    } else if (url.protocol === 'http:') {
        url.protocol = 'ws:'; // Change HTTP to WS
    } else {
        // If the protocol is neither HTTP nor HTTPS, log a warning and return the URL unchanged
        console.warn('Unsupported protocol for WebSocket conversion. URL returned unchanged.');
        return originURL; // Return the original URL if it's not HTTP/HTTPS
    }

    return url.toString(); // Return the modified URL as a string
}
