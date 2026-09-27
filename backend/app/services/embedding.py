import logging
import os
import time
from typing import List
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

logger = logging.getLogger(__name__)

EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-001")
EMBEDDING_DIM = int(os.getenv("EMBEDDING_DIMENSION", "768"))


def get_gemini_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not configured in backend environment.")
    return genai.Client(api_key=api_key)


def generate_embedding(text: str) -> List[float]:
    """
    Generates a 768-dimensional vector embedding for a single text string
    using Google Gemini's verified embedding model.
    """
    if not text or not text.strip():
        raise ValueError("Text for embedding cannot be empty.")

    client = get_gemini_client()
    config = types.EmbedContentConfig(output_dimensionality=EMBEDDING_DIM)

    last_error = None
    for attempt in range(3):
        try:
            response = client.models.embed_content(
                model=EMBEDDING_MODEL,
                contents=text.strip(),
                config=config,
            )
            if response.embeddings and len(response.embeddings) > 0:
                values = response.embeddings[0].values
                return [float(v) for v in values]
        except Exception as e:
            last_error = e
            logger.warning(f"Embedding generation attempt {attempt + 1} failed: {e}")
            time.sleep(1.0)

    raise RuntimeError(f"Failed to generate embedding after 3 attempts: {last_error}")


def generate_embeddings_batch(texts: List[str]) -> List[List[float]]:
    """
    Generates embeddings for a batch of text chunks.
    """
    results: List[List[float]] = []
    for t in texts:
        if not t or not t.strip():
            continue
        emb = generate_embedding(t)
        results.append(emb)
    return results
