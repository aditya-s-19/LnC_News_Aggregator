from fastapi import FastAPI, Request
from transformers import pipeline
import time

print("🔄 Initializing classification model...")
classifier = pipeline("zero-shot-classification", model="valhalla/distilbart-mnli-12-1")
print("✅ Model loaded successfully.")

app = FastAPI()

@app.on_event("startup")
async def on_startup():
    print("🚀 FastAPI server started.")

@app.post("/classify")
async def classify(request: Request):
    print("📥 Received classification request.")
    start_time = time.time()

    try:
        data = await request.json()
        text = data.get("text", "")
        labels = data.get("labels", [])

        if not text or not labels:
            print("❌ Missing text or labels.")
            return {"error": "Missing text or labels"}

        result = classifier(text, candidate_labels=labels)
        print(f"✅ Classification completed in {time.time() - start_time:.2f} seconds : ",result["labels"][0])
        
        return {
            "label": result["labels"][0],
            "scores": dict(zip(result["labels"], result["scores"]))
        }

    except Exception as e:
        print(f"💥 Error during classification: {e}")
        return {"error": str(e)}
