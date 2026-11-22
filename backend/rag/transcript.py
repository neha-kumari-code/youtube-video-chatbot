
from youtube_transcript_api import YouTubeTranscriptApi
from langchain_text_splitters import RecursiveCharacterTextSplitter


def extract_video_id(url: str) -> str:
    """Extract the YouTube video ID from a URL."""

    if "youtu.be/" in url:
        return url.split("youtu.be/")[1].split("?")[0]

    if "v=" in url:
        return url.split("v=")[1].split("&")[0]

    if "/shorts/" in url:
        return url.split("/shorts/")[1].split("?")[0]

    raise ValueError("Invalid YouTube URL")


def get_transcript(video_id: str) -> str:
    """Fetch the transcript of a YouTube video."""

    ytt_api = YouTubeTranscriptApi()
    transcript_list = ytt_api.fetch(video_id, languages=["en","hi"])

    transcript = " ".join(
        chunk.text for chunk in transcript_list
    )

    return transcript


def split_transcript(transcript: str):
    """Split transcript into smaller chunks."""

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200
    )

    chunks = splitter.create_documents([transcript])

    return chunks
