import json
from datetime import datetime, timezone

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class ExamPaper(db.Model):
    """试卷版本表 - 记录题库版本，保证历史记录可追溯"""
    __tablename__ = "exam_papers"

    id = db.Column(db.Integer, primary_key=True)
    version = db.Column(db.String(20), nullable=False, default="1.0")
    description = db.Column(db.String(200), default="")
    questions_json = db.Column(db.Text, nullable=False)  # 完整题库 JSON
    total_questions = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    examinees = db.relationship("Examinee", backref="exam_paper", lazy="dynamic")


class Examinee(db.Model):
    """考生答题记录表（旧版单次提交记录）"""
    __tablename__ = "examinees"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, index=True)
    department = db.Column(db.String(100), nullable=False, index=True)
    score = db.Column(db.Integer, nullable=False, default=0)
    total = db.Column(db.Integer, nullable=False, default=0)
    percentage = db.Column(db.Float, nullable=False, default=0.0)
    status = db.Column(db.String(10), nullable=False, default="fail")  # pass / fail
    answers_json = db.Column(db.Text, nullable=False)  # 详细答题记录
    paper_id = db.Column(db.Integer, db.ForeignKey("exam_papers.id"), nullable=True)
    ip_address = db.Column(db.String(45), default="")
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc), index=True
    )


class Role(db.Model):
    """角色表 — 如医生、护士、药师等"""
    __tablename__ = "roles"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    description = db.Column(db.String(200), default="")
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    configs = db.relationship(
        "RoleConfig", backref="role", lazy="dynamic", cascade="all, delete-orphan"
    )


class RoleConfig(db.Model):
    """角色章节配置 — 每种角色可配置从各章节抽取的题目数量"""
    __tablename__ = "role_configs"

    id = db.Column(db.Integer, primary_key=True)
    role_id = db.Column(
        db.Integer, db.ForeignKey("roles.id", ondelete="CASCADE"), nullable=False
    )
    chapter_id = db.Column(db.Integer, nullable=False)
    chapter_title = db.Column(db.String(100), nullable=False)
    question_count = db.Column(db.Integer, nullable=False, default=0)  # 0=全部


class ExamSession(db.Model):
    """考试会话表 — 支持续答和记录"""
    __tablename__ = "exam_sessions"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, index=True)
    department = db.Column(db.String(100), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("roles.id"), nullable=True)
    role_name = db.Column(db.String(50), default="")
    status = db.Column(
        db.String(20), nullable=False, default="in_progress"
    )  # in_progress | finished
    questions_json = db.Column(db.Text, nullable=False)
    answers_json = db.Column(db.Text, nullable=False, default="[]")
    current_index = db.Column(db.Integer, nullable=False, default=0)
    score = db.Column(db.Integer, default=0)
    total = db.Column(db.Integer, default=0)
    percentage = db.Column(db.Float, default=0.0)
    status_result = db.Column(db.String(10), default="")  # pass / fail
    paper_id = db.Column(db.Integer, db.ForeignKey("exam_papers.id"), nullable=True)
    ip_address = db.Column(db.String(45), default="")
    started_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    finished_at = db.Column(db.DateTime, nullable=True)
