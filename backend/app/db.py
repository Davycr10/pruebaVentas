from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.settings import DB_PATH

DB_PATH.parent.mkdir(parents=True, exist_ok=True)

engine = create_engine(
    f"sqlite:///{DB_PATH}".replace("\\", "/"),
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autoflush=False, bind=engine)


def get_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
