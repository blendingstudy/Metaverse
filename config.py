import os

class Config:
    SECRET_KEY = 'secret!'
    SQLALCHEMY_DATABASE_URI = 'mysql+mysqlconnector://root:1234@localhost/metaverse'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = 'uploads/'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif','mp4'}
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your_secret_key')