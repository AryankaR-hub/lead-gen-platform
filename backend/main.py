from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import Optional
from database import engine, get_db, Base
from models import Lead
from pipeline import run_pipeline
import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Lead Gen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"status": "running"}

@app.post("/api/pipeline/run")
def trigger_pipeline(limit: int = 20):
    added = run_pipeline(limit=limit)
    return {"message": "Pipeline complete", "leads_added": added}

@app.get("/api/leads")
def get_leads(
    db: Session = Depends(get_db),
    tier: Optional[str] = None,
    industry: Optional[str] = None,
    min_score: Optional[float] = None,
    sort_by: str = "intent_score",
    limit: int = 100
):
    query = db.query(Lead)
    if tier:
        query = query.filter(Lead.score_tier == tier)
    if industry:
        query = query.filter(Lead.industry.ilike(f"%{industry}%"))
    if min_score is not None:
        query = query.filter(Lead.intent_score >= min_score)
    if sort_by == "intent_score":
        query = query.order_by(Lead.intent_score.desc())
    elif sort_by == "created_at":
        query = query.order_by(Lead.created_at.desc())
    return query.limit(limit).all()

@app.get("/api/leads/{lead_id}")
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        return {"error": "Not found"}
    return lead

@app.delete("/api/leads/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if lead:
        db.delete(lead)
        db.commit()
    return {"message": "deleted"}

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total = db.query(Lead).count()
    hot = db.query(Lead).filter(Lead.score_tier == "hot").count()
    warm = db.query(Lead).filter(Lead.score_tier == "warm").count()
    cold = db.query(Lead).filter(Lead.score_tier == "cold").count()
    return {"total": total, "hot": hot, "warm": warm, "cold": cold}