import os

class Config:
    SECRET_KEY = 'secret!'
    SQLALCHEMY_DATABASE_URI = 'mysql+mysqlconnector://root:1234@localhost/metaverse'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
