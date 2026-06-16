# Lead Generation Intelligence Platform

AI-powered lead discovery and intent scoring platform for identifying companies likely to need outbound sales support.

## Features

### Lead Discovery
- Hacker News startup discovery
- Growth signal detection
- Company enrichment

### AI Enrichment
- Industry classification
- Company stage estimation
- Intent reasoning generation

### Intent Scoring
Scores leads based on:

- Funding signals
- Hiring signals
- Growth indicators
- AI-generated relevance

### Dashboard
- Lead table view
- Intent score badges
- Filtering
- Sorting

## Tech Stack

### Frontend
- Next.js
- TypeScript
- TailwindCSS

### Backend
- FastAPI
- SQLite
- OpenAI API

## Architecture

Scraper
->
Enrichment Pipeline
->
Intent Scoring
->
SQLite Database
->
FastAPI
->
Next.js Dashboard

## V1 Scope

Implemented:
- Lead discovery
- Company enrichment
- Intent scoring
- Dashboard

## V2 Ideas

- Real-time monitoring
- Contact extraction
- Automated outreach suggestions
- ICP filtering
- Multi-source signal aggregation

## Local Setup

### Backend

```bash
cd backend

pip install -r requirements.txt

uvicorn main:app --reload
```

### Frontend

```bash
cd frontend

npm install

npm run dev
```
