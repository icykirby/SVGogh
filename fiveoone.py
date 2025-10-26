from flask import Flask, request, jsonify 
from flask_pymongo import PyMongo
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required, current_user
from flask_cors import CORS
import os
import datetime 

# Security and Database Helpers
from werkzeug.security import generate_password_hash, check_password_hash
from bson.objectid import ObjectId

# --- APPLICATION SETUP (RENAMED TO 'api') ---
api = Flask(__name__)

# --- CRITICAL FIX: Explicit CORS Configuration ---
# We must explicitly list the local origin and the render origin, and specify methods/headers
CORS(
    api, 
    # Use environment variable for production URL and localhost for development
    origins=[
        os.environ.get('CORS_ORIGIN', 'http://localhost:8000'), 
        'https://svgogh.onrender.com', # Add your own render domain
        'http://127.0.0.1:8000' # Common alternative for Python server
    ],
    supports_credentials=True,
    methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], # Explicitly allow ALL methods
    allow_headers=['Content-Type', 'Authorization']
)


api.config['SECRET_KEY'] = os.environ.get(
    'FLASK_SECRET_KEY', 
    'e7f2c4b8a1d5e9f3b7c1a8d4e9f3b7c1a8d4e9f3b7c1a8d4e9f3b7c1a8d4e9f3' 
)

# Configure MongoDB Connection URI
api.config['MONGO_URI'] = os.environ.get( 
    'MONGO_URI',
    'mongodb+srv://mongodbdatabase.ph2yrip.mongodb.net/svgogh_db' # Ensure this is your actual URI!
)

# Initialize MongoDB
mongo = PyMongo(api)

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(api)

# user model
class User(UserMixin):
    """
    Represents a user and interfaces with Flask-Login.
    Uses MongoDB's ObjectId as the basis for the user ID.
    """
    def __init__(self, user_data):
        # Flask-Login requires the ID to be a string
        self.id = str(user_data['_id']) 
        self.username = user_data['username']
        self.password_hash = user_data.get('password_hash')

    @staticmethod
    def set_password(password):
        """Hashes a plaintext password for secure storage."""
        return generate_password_hash(password)

    def check_password(self, password):
        """Checks a plaintext password against the stored hash."""
        return check_password_hash(self.password_hash, password)
    
@login_manager.user_loader
def load_user(user_id):
    """Callback used by Flask-Login to reload the user object from the session ID."""
    try:
        # Find the user document by its ObjectId
        user_data = mongo.db.users.find_one({'_id': ObjectId(user_id)})
        if user_data:
            return User(user_data)
        return None
    except Exception as e:
        # Handle cases where user_id might not be a valid ObjectId
        print(f"Error loading user: {e}")
        return None


# --- API ENDPOINTS (ALL ROUTES USE @api.route) ---

# Reverting to the cleaner /api/register route now that cache should be broken
@api.route('/api/register', methods=['POST']) 
def register():
    """Endpoint for user registration."""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'msg': 'Missing username or password'}), 400

    # 1. Check if user already exists
    if mongo.db.users.find_one({'username': username}):
        return jsonify({'msg': 'User already exists'}), 409

    # 2. Hash password and create new user document
    password_hash = User.set_password(password)
    mongo.db.users.insert_one({
        'username': username,
        'password_hash': password_hash
    })

    return jsonify({'msg': 'Registration successful'}), 201


@api.route('/api/login', methods=['POST'])
def login():
    """Endpoint for user login and session establishment."""
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user_data = mongo.db.users.find_one({'username': username})

    if user_data:
        user = User(user_data)
        
        # Check the password
        if user.check_password(password):
            login_user(user) # Establishes the session cookie!
            return jsonify({'msg': 'Logged in successfully', 'user': user.username}), 200

    return jsonify({'msg': 'Invalid credentials'}), 401


@api.route('/api/logout')
@login_required 
def logout():
    """Endpoint for logging out the current user and destroying the session."""
    logout_user()
    return jsonify({'msg': 'Logged out successfully'}), 200


@api.route('/api/data')
@login_required # Requires a valid session cookie for access
def protected_data():
    """Example endpoint to retrieve data only for authenticated users."""
    return jsonify({
        'user_id': current_user.id,
        'username': current_user.username,
        'payload': 'This is the protected data for the canvas application.'
    }), 200


@api.route('/api/canvas', methods=['POST'])
@login_required
def create_canvas():
    """Creates a new canvas document associated with the current user."""
    data = request.get_json()
    title = data.get('title')
    elements = data.get('elements', []) # Expects an array of canvas element objects

    if not title:
        return jsonify({'msg': 'Canvas title is required'}), 400
    
    # 1. Prepare the document to be saved in the 'canvases' collection
    canvas_document = {
        'user_id': current_user.id,
        'title': title,
        'elements': elements, 
        'created_at': datetime.datetime.utcnow(),
        'updated_at': datetime.datetime.utcnow()
    }

    # 2. Insert into the new collection
    result = mongo.db.canvases.insert_one(canvas_document)

    return jsonify({
        'msg': 'Canvas created successfully',
        'id': str(result.inserted_id)
    }), 201


@api.route('/api/canvas', methods=['GET'])
@login_required
def get_all_canvases():
    """Retrieves a list of all canvases belonging to the current user."""
    
    # Query the 'canvases' collection for documents matching the current user's ID
    canvases = mongo.db.canvases.find({'user_id': current_user.id})
    
    # Convert MongoDB documents to a list of Python dictionaries
    output = []
    for canvas in canvases:
        output.append({
            'id': str(canvas['_id']), 
            'title': canvas['title'],
            'elements_count': len(canvas.get('elements', [])), # Helpful summary field
            'created_at': canvas['created_at'].isoformat(),
            'updated_at': canvas['updated_at'].isoformat()
        })
    
    return jsonify(output), 200


@api.route('/api/canvas/<canvas_id>', methods=['GET'])
@login_required
def get_canvas_by_id(canvas_id):
    """Retrieves a single canvas by ID, ensuring it belongs to the user."""
    try:
        # 1. Try to find the canvas by its ObjectId AND the current user's ID
        canvas = mongo.db.canvases.find_one({
            '_id': ObjectId(canvas_id), 
            'user_id': current_user.id
        })
        
        if not canvas:
            return jsonify({'msg': 'Canvas not found or access denied'}), 404

        # 2. Return the canvas data
        return jsonify({
            'id': str(canvas['_id']),
            'title': canvas['title'],
            'elements': canvas['elements'],
            'created_at': canvas['created_at'].isoformat(),
            'updated_at': canvas['updated_at'].isoformat()
        }), 200

    except Exception:
        # Handles errors if canvas_id is not a valid MongoDB ObjectId format
        return jsonify({'msg': 'Invalid canvas ID format'}), 400


@api.route('/api/canvas/<canvas_id>', methods=['PUT'])
@login_required
def update_canvas(canvas_id):
    """Updates an existing canvas, ensuring it belongs to the user."""
    data = request.get_json()
    
    # Use $set to only update the fields provided in the request
    update_fields = {}
    if 'title' in data:
        update_fields['title'] = data['title']
    if 'elements' in data:
        update_fields['elements'] = data['elements']

    if not update_fields:
        return jsonify({'msg': 'No update data provided'}), 400

    # Add the updated_at timestamp
    update_fields['updated_at'] = datetime.datetime.utcnow()

    try:
        # Find the canvas by ID and User ID, and update it
        result = mongo.db.canvases.update_one(
            {'_id': ObjectId(canvas_id), 'user_id': current_user.id},
            {'$set': update_fields}
        )
        
        if result.matched_count == 0:
            return jsonify({'msg': 'Canvas not found or access denied'}), 404
        
        return jsonify({'msg': 'Canvas updated successfully'}), 200

    except Exception:
        return jsonify({'msg': 'Invalid canvas ID format'}), 400


@api.route('/api/canvas/<canvas_id>', methods=['DELETE'])
@login_required
def delete_canvas(canvas_id):
    """Deletes a canvas, ensuring it belongs to the user."""
    
    try:
        # Find the canvas by ID and User ID, and delete it
        result = mongo.db.canvases.delete_one({
            '_id': ObjectId(canvas_id), 
            'user_id': current_user.id
        })
        
        if result.deleted_count == 0:
            return jsonify({'msg': 'Canvas not found or access denied'}), 404
        
        return jsonify({'msg': 'Canvas deleted successfully'}), 200

    except Exception:
        return jsonify({'msg': 'Invalid canvas ID format'}), 400



if __name__ == '__main__':
    api.run(debug=False) 
