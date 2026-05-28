"""Mem0 memory server — Agent memory + Personal memory"""
import os, json, uvicorn
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from mem0 import Memory

_agent_mem0 = None
_personal_mem0 = None
CHROMA_PATH = os.environ.get("CHROMA_PATH", "/root/dolphin-community/mcp-api/chroma_data")

def _mk_config(collection: str):
    return {
        "vector_store": {
            "provider": "chroma",
            "config": {"collection_name": collection, "path": CHROMA_PATH}
        },
        "embedder": {
            "provider": "huggingface",
            "config": {"model": "sentence-transformers/all-MiniLM-L6-v2"}
        },
        "llm": {
            "provider": "openai",
            "config": {
                "api_key": os.environ.get("DEEPSEEK_API_KEY", ""),
                "model": "deepseek-chat",
                "openai_base_url": "https://api.deepseek.com/v1"
            }
        }
    }

def get_agent_mem0():
    global _agent_mem0
    if _agent_mem0 is None:
        _agent_mem0 = Memory.from_config(_mk_config("dolphin_memory"))
    return _agent_mem0

def get_personal_mem0():
    global _personal_mem0
    if _personal_mem0 is None:
        _personal_mem0 = Memory.from_config(_mk_config("h_personal"))
    return _personal_mem0

app = FastAPI(title="Mem0 Memory Server")

# ── Agent Memory ──────────────────────────────────────

@app.post("/mem0/add")
async def add_memory(req: Request):
    try:
        body = await req.json()
        result = get_agent_mem0().add(
            body.get("messages", []),
            user_id=body.get("user_id", "default"),
            agent_id=body.get("agent_id", ""),
        )
        return JSONResponse({"ok": True, "result": result})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:500]})

@app.post("/mem0/search")
async def search_memory(req: Request):
    try:
        body = await req.json()
        uid = body.get("user_id", "default")
        agent_id = body.get("agent_id", "")
        filters: dict = {"user_id": uid}
        if agent_id:
            filters["agent_id"] = agent_id
        result = get_agent_mem0().search(
            body.get("query", ""),
            filters=filters,
            limit=body.get("limit", 5),
        )
        return JSONResponse({"ok": True, "result": result})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:500]})

@app.post("/mem0/list")
async def list_memories(req: Request):
    """List all memories for a user+agent pair."""
    try:
        body = await req.json()
        uid = body.get("user_id", "default")
        agent_id = body.get("agent_id", "")
        m = get_agent_mem0()
        result = m.search("", filters={"user_id": uid, "agent_id": agent_id}, limit=100)
        items = []
        results = result.get("results", []) if isinstance(result, dict) else result or []
        for r in results:
            if isinstance(r, dict):
                items.append({"id": r.get("id", ""), "memory": r.get("memory", ""), "score": r.get("score", 0)})
        return JSONResponse({"ok": True, "items": items})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:500]})

@app.post("/mem0/delete")
async def delete_memory(req: Request):
    """Delete a single memory by ID."""
    try:
        body = await req.json()
        memory_id = body.get("memory_id", "")
        m = get_agent_mem0()
        m.delete(memory_id)
        return JSONResponse({"ok": True})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:500]})

# ── Personal Memory (H's cross-session context) ──────

@app.post("/personal/add")
async def personal_add(req: Request):
    """Store a personal memory. Body: {content, category?}"""
    try:
        body = await req.json()
        content = body.get("content", "")
        category = body.get("category", "general")
        m = get_personal_mem0()
        result = m.add(
            [{"role": "user", "content": content}],
            user_id="h",
            metadata={"category": category},
        )
        return JSONResponse({"ok": True, "result": result})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:500]})

@app.post("/personal/search")
async def personal_search(req: Request):
    """Search personal memories. Body: {query, limit?}"""
    try:
        body = await req.json()
        query = body.get("query", "")
        limit = body.get("limit", 5)
        m = get_personal_mem0()
        results = m.search(query, filters={"user_id": "h"}, limit=limit)
        items = []
        for r in (results.get("results", []) if isinstance(results, dict) else results or []):
            if isinstance(r, dict):
                score = r.get("score", 0)
                memory = r.get("memory", "")
                if score > 0.3 and memory:
                    items.append({"score": round(score, 3), "memory": memory})
        return JSONResponse({"ok": True, "items": items})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:500]})

@app.post("/personal/delete")
async def personal_delete(req: Request):
    """Delete matching personal memories. Body: {query}"""
    try:
        body = await req.json()
        query = body.get("query", "")
        m = get_personal_mem0()
        results = m.search(query, filters={"user_id": "h"}, limit=20)
        deleted = 0
        for r in (results.get("results", []) if isinstance(results, dict) else results or []):
            if isinstance(r, dict) and r.get("id"):
                try:
                    m.delete(r["id"])
                    deleted += 1
                except Exception:
                    pass
        return JSONResponse({"ok": True, "deleted": deleted})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:500]})

@app.get("/personal/stats")
async def personal_stats():
    """Get personal memory stats."""
    try:
        m = get_personal_mem0()
        results = m.search("", filters={"user_id": "h"}, limit=1000)
        count = len(results.get("results", []) if isinstance(results, dict) else results or [])
        return JSONResponse({"ok": True, "count": count})
    except Exception as e:
        return JSONResponse({"ok": False, "error": str(e)[:500]})

@app.get("/health")
def health():
    return {"status": "ok", "agent_mem0": "ready", "personal_mem0": "ready"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8888)
