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

-First — LinkedIn job scraping using Apify or PhantomBuster. LinkedIn has 10x more signal than HN and you can filter by company size, location, and role type.
-Second — Crunchbase API for real-time funding data. When a company raises money it appears on Crunchbase within 24 hours. That's the highest-intent signal possible.
-Third — automated scheduling. Right now you click Run Pipeline manually. In V2 it runs every 6 hours automatically and sends a Slack alert when a hot lead is found.
-Fourth — ICP configuration. Let the user define their ideal customer profile — industry, company size, stage — and the scoring weights adjust accordingly.
-Fifth — contact extraction using Hunter.io. Given a company domain, find the VP of Sales or CEO email automatically. So the sales team doesn't just know who to call — they know exactly who and how."

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
