#!/usr/bin/env python3
"""
Simple HTTP server for the ESP8266 Dashboard
Run this script to serve the dashboard locally for development and testing.
"""

import http.server
import socketserver
import os
import urllib.request
import urllib.parse
from pathlib import Path

# Configuration
PORT = 8000
HOST = "0.0.0.0"  # Bind to all network interfaces
DIRECTORY = Path(__file__).parent
ESP8266_URL_113 = "http://10.0.0.113"  # Module 113 (outside)
ESP8266_URL_115 = "http://10.0.0.115"  # Module 115 (inside)

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS support and ESP8266 proxy"""

    def end_headers(self):
        # Add CORS headers for development
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_options(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """Handle GET requests with ESP8266 proxy support"""
        # Check if this is a request to the ESP8266 proxy
        if self.path.startswith('/api/esp8266/'):
            self.handle_esp8266_proxy()
        else:
            # Serve static files normally
            super().do_GET()

    def handle_esp8266_proxy(self):
        """Proxy requests to ESP8266 module"""
        try:
            # Extract the endpoint from the path
            endpoint = self.path.replace('/api/esp8266/', '')
            
            # Determine which module to use based on the endpoint
            if endpoint.startswith('113/'):
                # Route to module 113
                actual_endpoint = endpoint.replace('113/', '')
                esp8266_url = f"{ESP8266_URL_113}/{actual_endpoint}"
                module_name = "113"
            elif endpoint.startswith('115/'):
                # Route to module 115
                actual_endpoint = endpoint.replace('115/', '')
                esp8266_url = f"{ESP8266_URL_115}/{actual_endpoint}"
                module_name = "115"
            else:
                # Default to module 113 for backward compatibility
                esp8266_url = f"{ESP8266_URL_113}/{endpoint}"
                module_name = "113"

            print(f"🔄 Proxying request to module {module_name}: {esp8266_url}")

            # Make request to ESP8266
            with urllib.request.urlopen(esp8266_url, timeout=5) as response:
                data = response.read()
                content_type = response.headers.get('Content-Type', 'application/json')

                # Send response back to client
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.end_headers()
                self.wfile.write(data)

        except urllib.error.URLError as e:
            print(f"❌ Error connecting to ESP8266: {e}")
            self.send_error(502, f"Bad Gateway: Cannot connect to ESP8266 at {esp8266_url}")
        except Exception as e:
            print(f"❌ Proxy error: {e}")
            self.send_error(500, f"Internal Server Error: {str(e)}")

def main():
    """Start the HTTP server"""
    # Change to the directory containing this script
    os.chdir(DIRECTORY)

    # Create server
    with socketserver.TCPServer((HOST, PORT), CORSHTTPRequestHandler) as httpd:
        print("🚀 ESP8266 Dashboard server starting...")
        print(f"📁 Serving files from: {DIRECTORY}")
        print(f"🌐 Dashboard available at: http://localhost:{PORT}")
        print(f"🔗 ESP8266 proxy available at: http://localhost:{PORT}/api/esp8266/")
        print("📱 Open your browser and navigate to the URL above")
        
        # Get local IP address for network access
        try:
            import socket
            # Get the local IP address
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            print(f"🌍 Network Access: http://{local_ip}:{PORT}")
            print(f"📱 Any device on your network can access the dashboard at this URL")
        except:
            print(f"⚠️  Could not determine local IP address")
            print(f"📱 Use 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux) to find your IP")
        
        print("⏹️  Press Ctrl+C to stop the server")
        print("-" * 50)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped by user")
            httpd.shutdown()

if __name__ == "__main__":
    main()
