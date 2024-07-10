from flask import Blueprint, send_from_directory, request, jsonify, current_app
from models import db, Users
from werkzeug.utils import secure_filename
import os

bp = Blueprint('main', __name__)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

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

@bp.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files or 'boothNumber' not in request.form:
        return jsonify({'error': 'Missing file or booth number'}), 400

    file = request.files['file']
    booth_number = request.form['boothNumber']

    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return jsonify({'filePath': f'uploads/{filename}', 'boothNumber': booth_number}), 200

    return jsonify({'error': 'File not allowed'}), 400

@bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

socketio = None  # 전역 소켓 객체

def init_socketio(sock):
    global socketio
    socketio = sock

    @socketio.on('photo_uploaded')
    def handle_photo_uploaded(data):
        print('photo_uploaded event received:', data)
        socketio.emit('display_photo', data)
        print("전시하자")