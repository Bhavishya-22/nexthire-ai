from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RAGQueryRequest(BaseModel):
    query: str = Field(..., min_length=2, description="The career question to ask the AI assistant.")
    top_k: int = Field(default=5, ge=1, le=15, description="Number of context chunks to retrieve.")


class CitationItem(BaseModel):
    document_id: int
    document_title: str
    doc_type: str
    category: str
    snippet: str
    similarity: float


class RAGQueryResponse(BaseModel):
    success: bool = True
    query: str
    answer: str
    citations: List[CitationItem] = []
    has_sufficient_context: bool = True


class DocumentIngestRequest(BaseModel):
    title: str = Field(..., min_length=2, max_length=255)
    doc_type: str = Field(..., description="'career_goal', 'job_description', 'certification', 'project_notes', 'resume_note'")
    content: str = Field(..., min_length=10)
    metadata: Optional[Dict[str, Any]] = None


class DocumentItemResponse(BaseModel):
    id: int
    title: str
    doc_type: str
    content_preview: str
    chunk_count: int
    created_at: str


class DocumentListResponse(BaseModel):
    success: bool = True
    documents: List[DocumentItemResponse] = []
    total_chunks: int = 0
