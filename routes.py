from flask import Blueprint, send_from_directory, request, jsonify
from models import db, Users

bp = Blueprint('main', __name__)

@bp.route('/')
def serve_index():
    return send_from_directory('templates', 'login.html')

@bp.route('/main')
def serve_main():
    return send_from_directory('templates', 'main.html')

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Missing data'}), 400

    user = Users.query.filter_by(username=username).first()

    if user and user.password == password:
        return jsonify({'success': True, 'username': username}), 200
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
@bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return jsonify({'success': False, 'message': 'Missing data'}), 400

    new_user = Users(username=username, email=email, password=password)

    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'success': True, 'message': 'User created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500
