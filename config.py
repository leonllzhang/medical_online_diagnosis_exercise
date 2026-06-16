import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    BASE_DIR = BASE_DIR
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(BASE_DIR, 'exam.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # 及格分数线
    PASS_THRESHOLD = 60
