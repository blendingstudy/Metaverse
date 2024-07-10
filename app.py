from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from config import Config
import os
from models import db
from routes import bp, init_socketio
from werkzeug.utils import secure_filename

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    app.register_blueprint(bp)

    CORS(app)
    socketio = SocketIO(app, cors_allowed_origins="*")

    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])

    return app, socketio

app, socketio = create_app()

# routes.py에서 소켓 객체를 사용할 수 있도록 초기화
init_socketio(socketio)

# 사용자 관리 딕셔너리
connected_users = {}

# 소켓 이벤트 핸들러 추가
@socketio.on('connect')
def handle_connect():
    emit('user_list', list(connected_users.keys()))

@socketio.on('add_user')
def handle_add_user(data):
    username = data['username']
    connected_users[username] = request.sid
    emit('user_connected', data, broadcast=True)

@socketio.on('send_message')
def handle_chat_message(data):
    print(f'Message from {data["username"]}: {data["message"]}')
    emit('chat_message', {'username': data['username'], 'message': data['message']}, broadcast=True, include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    username = None
    for user, sid in connected_users.items():
        if sid == request.sid:
            username = user
            break
    if username:
        del connected_users[username]
        emit('user_disconnected', {'username': username}, broadcast=True)

@socketio.on('update_position')
def handle_update_position(data):
    emit('update_position', data, broadcast=True, include_self=False)

if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1', port=8081)