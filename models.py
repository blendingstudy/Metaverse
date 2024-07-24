from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Users(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    is_admin = db.Column(db.Boolean, default=False, nullable=False)

class BoothImage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booth_number = db.Column(db.String(10), nullable=False)
    file_path = db.Column(db.String(200), nullable=False)