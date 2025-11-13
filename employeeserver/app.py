from flask import Flask, send_from_directory, render_template_string, request, jsonify, Response, redirect
import os
import requests

app = Flask(__name__)

# Proxy API requests to main Flask server
@app.route('/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_api(path):
    return proxy_request(f'/api/{path}')

@app.route('/admin/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_admin_api(path):
    return proxy_request(f'/admin/api/{path}')

@app.route('/employee/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_employee(path):
    return proxy_request(f'/employee/{path}')

@app.route('/employee/api/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE'])
def proxy_employee_api(path):
    return proxy_request(f'/employee/api/{path}')

@app.route('/qr/<path:path>', methods=['GET'])
def proxy_qr(path):
    return proxy_request(f'/qr/{path}')

@app.route('/auth/<path:path>', methods=['GET', 'POST'])
def proxy_auth(path):
    return proxy_request(f'/auth/{path}')

def proxy_request(path):
    backend_url = 'http://127.0.0.1:5001'
    target_url = backend_url + path
    
    try:
        # Forward the request
        resp = requests.request(
            method=request.method,
            url=target_url,
            headers={key: value for (key, value) in request.headers if key != 'Host'},
            data=request.get_data(),
            cookies=request.cookies,
            allow_redirects=False
        )
        
        # Return the response
        return Response(resp.content, resp.status_code, dict(resp.headers))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/login')
def serve_login():
    return send_from_directory(os.path.dirname(__file__), 'login.html')

@app.route('/')
@app.route('/<path:path>')
def serve_bruh(path=None):
    # Check if user is authenticated
    auth_header = request.headers.get('Authorization', '')
    token = None
    
    # Try to get token from Authorization header (Bearer token)
    if auth_header.startswith('Bearer '):
        token = auth_header.replace('Bearer ', '')
    
    # Also check localStorage via cookie (set by login page)
    if not token:
        token = request.cookies.get('fab-employee-token')
    
    # Allow access to login page and static assets without auth
    if not token and path not in [None, 'login', 'assets/index-BgwGS-hd.js', 'assets/index-DTI8hc3c.css']:
        return redirect('/login')
    
    bruh_dir = os.path.join(os.path.dirname(__file__), 'bruh')
    
    if path and os.path.exists(os.path.join(bruh_dir, path)):
        return send_from_directory(bruh_dir, path)
    else:
        index_path = os.path.join(bruh_dir, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(bruh_dir, 'index.html')
        else:
            return render_template_string("""
            <h1>Employee Server Running</h1>
            <p>Port: 5173</p>
            <p>Folder: bruh/</p>
            <p>Place your built files in bruh/ folder</p>
            """)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5173, debug=True)