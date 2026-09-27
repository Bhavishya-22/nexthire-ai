import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import User, CareerDocument, CareerKnowledgeChunk
from app.auth import get_authenticated_user
from app.schemas.rag import (
    RAGQueryRequest,
    RAGQueryResponse,
    DocumentIngestRequest,
    DocumentItemResponse,
    DocumentListResponse,
)
from app.services.rag import (
    answer_with_rag,
    index_generic_document,
)

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/rag",
    tags=["Career Intelligence RAG"]
)


@router.post("/chat", response_model=RAGQueryResponse)
def rag_chat(
    request: RAGQueryRequest,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Asks the Career Intelligence Assistant a question.
    The assistant retrieves isolated chunks from the user's personal Career Knowledge Base
    and responds with strict anti-hallucination grounding and source citations.
    """
    try:
        response = answer_with_rag(
            db=db,
            user_id=current_user.id,
            query=request.query,
            top_k=request.top_k
        )
        return response
    except Exception as e:
        logger.error(f"RAG query execution error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Career Assistant failed to process your question: {str(e)}"
        )


@router.post("/documents")
def add_career_document(
    request: DocumentIngestRequest,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Ingests a career document (career goal, job description, note, certification)
    into the user's isolated Career Knowledge Base with semantic chunking & embeddings.
    """
    try:
        doc = index_generic_document(
            db=db,
            user_id=current_user.id,
            title=request.title,
            doc_type=request.doc_type,
            content=request.content,
            metadata=request.metadata
        )
        chunk_count = db.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == doc.id).count()

        return {
            "success": True,
            "message": f"Successfully indexed '{doc.title}' into your Career Knowledge Base",
            "document": {
                "id": doc.id,
                "title": doc.title,
                "doc_type": doc.doc_type,
                "chunk_count": chunk_count,
                "created_at": doc.created_at.isoformat()
            }
        }
    except Exception as e:
        logger.error(f"Document ingestion error: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to ingest career document: {str(e)}"
        )


@router.get("/documents", response_model=DocumentListResponse)
def list_career_documents(
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Lists all documents stored in the user's personal Career Knowledge Base.
    """
    docs = (
        db.query(CareerDocument)
        .filter(CareerDocument.user_id == current_user.id)
        .order_by(CareerDocument.created_at.desc())
        .all()
    )

    items = []
    total_chunks = 0
    for d in docs:
        chunk_count = db.query(CareerKnowledgeChunk).filter(CareerKnowledgeChunk.document_id == d.id).count()
        total_chunks += chunk_count
        items.append(DocumentItemResponse(
            id=d.id,
            title=d.title,
            doc_type=d.doc_type,
            content_preview=d.content[:160] + ("..." if len(d.content) > 160 else ""),
            chunk_count=chunk_count,
            created_at=d.created_at.strftime("%Y-%m-%d %H:%M")
        ))

    return DocumentListResponse(
        success=True,
        documents=items,
        total_chunks=total_chunks
    )


@router.delete("/documents/{doc_id}")
def delete_career_document(
    doc_id: int,
    current_user: User = Depends(get_authenticated_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a career document and cascades deletion of all its vector chunks.
    Ensures strict tenant isolation (can only delete own documents).
    """
    doc = (
        db.query(CareerDocument)
        .filter(CareerDocument.id == doc_id, CareerDocument.user_id == current_user.id)
        .first()
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found or access denied")

    try:
        db.delete(doc)
        db.commit()
        return {
            "success": True,
            "message": f"Document '{doc.title}' and all associated knowledge chunks deleted successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete document: {str(e)}")
