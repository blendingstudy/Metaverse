from flask import Flask, request
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from config import Config
from models import db
from routes import bp

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    app.register_blueprint(bp)

    CORS(app)
    socketio = SocketIO(app, cors_allowed_origins="*")

    return app, socketio

app, socketio = create_app()

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
