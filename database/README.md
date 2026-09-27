# 🗄️ Database Setup (Supabase PostgreSQL + pgvector)

NextHire AI uses **PostgreSQL** with the **`pgvector`** extension for its production vector database, enabling lightning-fast semantic retrieval and personalized Career Knowledge Bases.

---

## 🚀 Quick Setup on Supabase

1. **Create a Supabase Project**:
   - Go to [Supabase](https://supabase.com) and create a new project.
   - Note down your database password and connection string (URI).

2. **Execute the Migration Schema**:
   - In your Supabase Dashboard, navigate to the **SQL Editor**.
   - Open and copy the contents of [`database/schema.sql`](./schema.sql).
   - Click **Run**. This will:
     - Enable the `vector` extension.
     - Create the `users` table.
     - Create the `career_documents` table.
     - Create the `career_knowledge_chunks` table with `vector(768)`.
     - Build an HNSW vector index (`vector_cosine_ops`) for sub-millisecond similarity queries.

3. **Configure Backend Environment**:
   - In your backend `.env` (or Render environment variables):
     ```env
     DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT-REF].supabase.co:5432/postgres
     ```

---

## 🧪 Local Testing & Offline Fallback

If `DATABASE_URL` is omitted or set to `sqlite:///./nexthire.db`, NextHire AI automatically falls back to SQLite, storing vector embeddings and computing cosine similarity via NumPy in memory.
