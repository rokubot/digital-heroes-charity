import os
import random
import json
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = None
if url and key:
    supabase = create_client(url, key)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_winners(winning_numbers, user_scores):
    winners = {"5-match": [], "4-match": [], "3-match": []}
    for user_id, scores in user_scores.items():
        matches = len(set(winning_numbers) & set(scores))
        if matches == 5:
            winners["5-match"].append(user_id)
        elif matches == 4:
            winners["4-match"].append(user_id)
        elif matches == 3:
            winners["3-match"].append(user_id)
    return winners

def internal_simulate():
    winning_numbers = random.sample(range(1, 46), 5)
    users = supabase.table("users").select("id").eq("subscription_status", "active").execute()
    active_count = len(users.data)
    prize_pool = active_count * 10
    
    scores_resp = supabase.table("scores").select("user_id, score").execute()
    user_scores = {}
    for s in scores_resp.data:
        user_scores.setdefault(s["user_id"], []).append(s["score"])
        
    winners = calculate_winners(winning_numbers, user_scores)
    
    payouts = {
        "5-match": (prize_pool * 0.4) / max(len(winners["5-match"]), 1) if winners["5-match"] else 0,
        "4-match": (prize_pool * 0.35) / max(len(winners["4-match"]), 1) if winners["4-match"] else 0,
        "3-match": (prize_pool * 0.25) / max(len(winners["3-match"]), 1) if winners["3-match"] else 0
    }
    
    return {
        "winning_numbers": winning_numbers,
        "prize_pool": prize_pool,
        "winners_count": {k: len(v) for k, v in winners.items()},
        "payouts_per_winner": payouts,
        "user_scores": user_scores,
        "winners": winners
    }

@app.get("/api/health")
async def handle_health():
    return JSONResponse({"status": "healthy"})

@app.post("/api/draw/simulate")
async def simulate_draw():
    try:
        data = internal_simulate()
        return JSONResponse({
            "winning_numbers": data["winning_numbers"],
            "prize_pool": data["prize_pool"],
            "winners_count": data["winners_count"],
            "payouts_per_winner": data["payouts_per_winner"]
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/draw/publish")
async def publish_draw():
    try:
        month = datetime.now().strftime('%Y-%m')
        
        sim_data = internal_simulate()
        
        winning_numbers = sim_data["winning_numbers"]
        prize_pool = sim_data["prize_pool"]
        
        draw_resp = supabase.table("draws").insert({
            "month": month,
            "winning_numbers": winning_numbers,
            "prize_pool": prize_pool,
            "status": "published",
            "published_at": datetime.now().isoformat()
        }).execute()
        
        draw_id = draw_resp.data[0]["id"]
        
        winners = sim_data["winners"]
        payouts = sim_data["payouts_per_winner"]
        
        winnings_inserts = []
        for match_type, uids in winners.items():
            if payouts[match_type] > 0:
                for uid in uids:
                    winnings_inserts.append({
                        "draw_id": draw_id,
                        "user_id": uid,
                        "match_type": match_type,
                        "amount": payouts[match_type]
                    })
                    
        if winnings_inserts:
            supabase.table("winnings").insert(winnings_inserts).execute()

        return JSONResponse({
            "message": "Draw published successfully!",
            "draw_id": draw_id,
            "total_winners": sum(len(v) for v in winners.values())
        })
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)

@app.post("/api/subscription/toggle")
async def toggle_subscription(request: Request):
    try:
        data = await request.json()
        user_id = data.get('user_id')
        status = data.get('status')
        
        if not user_id or not status:
             return JSONResponse({"error": "Missing user_id or status"}, status_code=400)
             
        response = supabase.table("users").update({"subscription_status": status}).eq("id", user_id).execute()
        return JSONResponse({"message": "Subscription updated successfully", "data": response.data})
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
