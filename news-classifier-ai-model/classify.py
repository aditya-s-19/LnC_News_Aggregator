from fastapi import FastAPI, Request
from transformers import pipeline

app = FastAPI()
classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-1")

@app.post("/classify")
async def classify(request: Request):
    data = await request.json()
    text = data.get("text", "")
    labels = data.get("labels", [])
    
    if not text or not labels:
        return {"error": "Missing text or labels"}
    
    result = classifier(text, candidate_labels=labels)
    return {
        "label": result["labels"][0],
        "scores": dict(zip(result["labels"], result["scores"]))
    }
