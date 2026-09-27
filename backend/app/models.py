from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector

from app.database import Base

EMBEDDING_DIM = 768


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    documents = relationship("CareerDocument", back_populates="user", cascade="all, delete-orphan")
    chunks = relationship("CareerKnowledgeChunk", back_populates="user", cascade="all, delete-orphan")


class CareerDocument(Base):
    __tablename__ = "career_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    doc_type = Column(String(50), nullable=False)  # 'resume', 'job_description', 'career_goal', 'certification', 'note'
    content = Column(Text, nullable=False)
    doc_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="documents")
    chunks = relationship("CareerKnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class CareerKnowledgeChunk(Base):
    __tablename__ = "career_knowledge_chunks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(Integer, ForeignKey("career_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False, default=0)
    chunk_text = Column(Text, nullable=False)
    chunk_metadata = Column(JSON, default=dict)  # {'category': 'skills', 'source_title': '...', 'section': '...'}
    embedding = Column(Vector(EMBEDDING_DIM))
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="chunks")
    document = relationship("CareerDocument", back_populates="chunks")