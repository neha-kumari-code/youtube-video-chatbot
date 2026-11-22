from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()
from rag.transcript import (
    extract_video_id,
    get_transcript,
    split_transcript
)

from rag.embeddings import create_vector_store
from rag.chain import create_rag_chain


app = FastAPI(title="YouTube AI Chatbot")


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Temporary storage for processed videos
video_chains = {}


class ProcessVideoRequest(BaseModel):
    youtube_url: str


class ChatRequest(BaseModel):
    video_id: str
    question: str


@app.get("/")
def home():
    return {"message": "YouTube AI Chatbot API is running"}


@app.post("/api/video/process")
def process_video(request: ProcessVideoRequest):

    try:
        video_id = extract_video_id(request.youtube_url)

        # Extract transcript
        transcript = get_transcript(video_id)

        # Split transcript
        chunks = split_transcript(transcript)

        # Create embeddings and FAISS index
        vector_store = create_vector_store(chunks)

        # Create RAG chain
        chain = create_rag_chain(vector_store)

        # Store chain for later chat requests
        video_chains[video_id] = chain

        return {
            "message": "Video processed successfully",
            "video_id": video_id,
            "total_chunks": len(chunks)
        }

    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


@app.post("/api/chat")
def chat(request: ChatRequest):

    # Check whether video was processed
    if request.video_id not in video_chains:
        raise HTTPException(
            status_code=404,
            detail="Video not processed. Process the video first."
        )

    try:
        chain = video_chains[request.video_id]

        # Invoke RAG chain
        answer = chain.invoke(request.question)

        return {
            "video_id": request.video_id,
            "question": request.question,
            "answer": answer
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
