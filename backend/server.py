import os
import random
from datetime import datetime
from aiohttp import web
import aiohttp_cors
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '../.env'))

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = None
if url and key:
    supabase = create_client(url, key)

async def handle_health(request):
    return web.json_response({"status": "healthy"})

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

async def simulate_draw(request):
    try:
        # Generate 5 random winning numbers between 1 and 45
        winning_numbers = random.sample(range(1, 46), 5)
        
        # Calculate pool based on active subscribers ($10 per sub for the pool)
        users = supabase.table("users").select("id").eq("subscription_status", "active").execute()
        active_count = len(users.data)
        prize_pool = active_count * 10
        
        # Fetch all scores and group by user
        scores_resp = supabase.table("scores").select("user_id, score").execute()
        user_scores = {}
        for s in scores_resp.data:
            user_scores.setdefault(s["user_id"], []).append(s["score"])
            
        winners = calculate_winners(winning_numbers, user_scores)
        
        # Prize pool math
        payouts = {
            "5-match": (prize_pool * 0.4) / max(len(winners["5-match"]), 1) if winners["5-match"] else 0,
            "4-match": (prize_pool * 0.35) / max(len(winners["4-match"]), 1) if winners["4-match"] else 0,
            "3-match": (prize_pool * 0.25) / max(len(winners["3-match"]), 1) if winners["3-match"] else 0
        }
        
        return web.json_response({
            "winning_numbers": winning_numbers,
            "prize_pool": prize_pool,
            "winners_count": {k: len(v) for k, v in winners.items()},
            "payouts_per_winner": payouts
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def publish_draw(request):
    try:
        data = await request.json()
        month = datetime.now().strftime('%Y-%m')
        
        # 1. Simulate to get data
        sim = await simulate_draw(request)
        sim_data = await sim.json()
        
        if "error" in sim_data:
            return web.json_response(sim_data, status=500)
            
        winning_numbers = sim_data["winning_numbers"]
        prize_pool = sim_data["prize_pool"]
        
        # 2. Insert Draw
        draw_resp = supabase.table("draws").insert({
            "month": month,
            "winning_numbers": winning_numbers,
            "prize_pool": prize_pool,
            "status": "published",
            "published_at": datetime.now().isoformat()
        }).execute()
        
        draw_id = draw_resp.data[0]["id"]
        
        # 3. Recalculate winners to insert into winnings table
        scores_resp = supabase.table("scores").select("user_id, score").execute()
        user_scores = {}
        for s in scores_resp.data:
            user_scores.setdefault(s["user_id"], []).append(s["score"])
            
        winners = calculate_winners(winning_numbers, user_scores)
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

        return web.json_response({
            "message": "Draw published successfully!",
            "draw_id": draw_id,
            "total_winners": sum(len(v) for v in winners.values())
        })
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def toggle_subscription(request):
    try:
        data = await request.json()
        user_id = data.get('user_id')
        status = data.get('status')
        
        if not user_id or not status:
             return web.json_response({"error": "Missing user_id or status"}, status=400)
             
        response = supabase.table("users").update({"subscription_status": status}).eq("id", user_id).execute()
        return web.json_response({"message": "Subscription updated successfully", "data": response.data})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

app = web.Application()
cors = aiohttp_cors.setup(app, defaults={
    "*": aiohttp_cors.ResourceOptions(
        allow_credentials=True,
        expose_headers="*",
        allow_headers="*",
    )
})

app.router.add_get('/api/health', handle_health)
cors.add(app.router.add_post('/api/draw/simulate', simulate_draw))
cors.add(app.router.add_post('/api/draw/publish', publish_draw))
cors.add(app.router.add_post('/api/subscription/toggle', toggle_subscription))

if __name__ == '__main__':
    web.run_app(app, port=8080)
