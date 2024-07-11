from flask import Blueprint, send_from_directory, request, jsonify, current_app
from models import db, Users,BoothImage
from werkzeug.utils import secure_filename
import os
import uuid

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
        # Generate unique filename using UUID
        unique_filename = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        filename = secure_filename(unique_filename + file_extension)
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        # 파일 경로와 부스 번호를 데이터베이스에 저장
        new_booth_image = BoothImage(booth_number=booth_number, file_path=f'uploads/{filename}')
        db.session.add(new_booth_image)
        db.session.commit()
        print("파일 저장 완료")

        return jsonify({'filePath': f'uploads/{filename}', 'boothNumber': booth_number}), 200

    return jsonify({'error': 'File not allowed'}), 400

@bp.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(current_app.config['UPLOAD_FOLDER'], filename)

socketio = None  # 전역 소켓 객체

def init_socketio(sock):
    global socketio
    socketio = sock

    @socketio.on('connect')
    def handle_connect():
        # 클라이언트가 연결되면 데이터베이스에서 모든 이미지를 가져와 클라이언트로 보냄
        
        images = BoothImage.query.all()
        data = [{'filePath': image.file_path, 'boothNumber': image.booth_number} for image in images]
        socketio.emit('display_existing_photos', data)   
        print("이미지 보냈다")

    @socketio.on('photo_uploaded')
    def handle_photo_uploaded(data):
        print('photo_uploaded event received:', data)
        socketio.emit('display_photo', data)
        print("전시하자")

