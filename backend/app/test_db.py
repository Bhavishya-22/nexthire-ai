from app.database import engine

try:
    with engine.connect() as conn:
        print("[OK] Database connected successfully!")
except Exception as e:
    print("[ERROR] Connection failed:", e)