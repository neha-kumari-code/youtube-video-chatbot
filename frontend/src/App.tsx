import { useState } from "react";
import axios from "axios";
import {
  Video,
  Send,
  Sparkles,
  Link,
  Loader2,
  Play,
  Bot,
  User,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ProcessVideoResponse {
  message: string;
  video_id: string;
  total_chunks: number;
}

interface ChatResponse {
  answer: string;
}

function App() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [processing, setProcessing] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleProcessVideo = async () => {
    if (!youtubeUrl.trim()) {
      setError("Please enter a YouTube URL.");
      return;
    }

    setProcessing(true);
    setError("");
    setMessages([]);
    setVideoId("");

    try {
      const response = await axios.post<ProcessVideoResponse>(
        `${API_URL}/api/video/process`,
        { youtube_url: youtubeUrl },
      );

      setVideoId(response.data.video_id);

      setMessages([
        {
          role: "assistant",
          content: `Your video is ready! I have processed ${response.data.total_chunks} transcript chunks. Ask me anything about it.`,
        },
      ]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Unable to process the video.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    const currentQuestion = question.trim();

    if (!currentQuestion || !videoId || sending) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: currentQuestion },
    ]);

    setQuestion("");
    setSending(true);
    setError("");

    try {
      const response = await axios.post<ChatResponse>(`${API_URL}/api/chat`, {
        video_id: videoId,
        question: currentQuestion,
      });

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: response.data.answer },
      ]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || "Unable to get an answer.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  const handleQuestionKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-zinc-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="rounded-xl bg-red-600 p-2">
            <Video size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold">VideoChat AI</h1>
            <p className="text-xs text-zinc-400">Chat with any YouTube video</p>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Heading */}
        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300">
            <Sparkles size={16} className="text-purple-400" />
            AI-powered video understanding
          </div>

          <h2 className="text-3xl font-bold md:text-5xl">
            Don't just watch.
            <span className="text-red-500"> Ask.</span>
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-zinc-400">
            Paste a YouTube link and ask questions. Get answers based on the
            video's transcript.
          </p>
        </div>

        {/* URL Input */}
        <div className="mx-auto mb-10 max-w-3xl">
          <div className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 p-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-3 px-3">
              <Link className="shrink-0 text-zinc-400" size={20} />

              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleProcessVideo();
                }}
                placeholder="Paste YouTube video URL here..."
                className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-zinc-500"
              />
            </div>

            <button
              onClick={handleProcessVideo}
              disabled={processing}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processing...
                </>
              ) : (
                <>
                  <Play size={18} />
                  Process Video
                </>
              )}
            </button>
          </div>

          {error && (
            <p className="mt-3 rounded-lg border border-red-900 bg-red-950/50 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        {/* Video and Chat */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Video Section */}
          <section className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="border-b border-zinc-800 px-5 py-4">
              <h3 className="font-semibold">YouTube Video</h3>
              <p className="mt-1 text-xs text-zinc-400">
                Your selected video appears here
              </p>
            </div>

            {videoId ? (
              <div className="aspect-video">
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="flex aspect-video flex-col items-center justify-center gap-4 text-zinc-500">
                <Video size={56} className="text-zinc-700" />
                <p className="text-sm">Your video preview will appear here</p>
              </div>
            )}
          </section>

          {/* Chat Section */}
          <section className="flex min-h-[450px] flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-800 px-5 py-4">
              <div className="rounded-lg bg-purple-600/20 p-2 text-purple-400">
                <Bot size={20} />
              </div>

              <div>
                <h3 className="font-semibold">Chat with Video</h3>
                <p className="text-xs text-zinc-400">
                  {videoId
                    ? "Video is ready for questions"
                    : "Process a video to start chatting"}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
              {messages.length === 0 && (
                <div className="m-auto max-w-xs text-center">
                  <Sparkles
                    className="mx-auto mb-3 text-purple-400"
                    size={32}
                  />

                  <p className="font-medium text-zinc-300">
                    Your AI conversation starts here
                  </p>

                  <p className="mt-2 text-sm text-zinc-500">
                    Process a YouTube video, then ask questions about its
                    content.
                  </p>
                </div>
              )}

              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "flex-row-reverse" : ""
                  }`}
                >
                  <div
                    className={`h-fit rounded-full p-2 ${
                      message.role === "user"
                        ? "bg-blue-600"
                        : "bg-purple-600/20 text-purple-400"
                    }`}
                  >
                    {message.role === "user" ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-zinc-800 text-zinc-200"
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex items-center gap-3 text-sm text-zinc-400">
                  <div className="rounded-full bg-purple-600/20 p-2 text-purple-400">
                    <Bot size={16} />
                  </div>

                  <span className="animate-pulse">Thinking...</span>
                </div>
              )}
            </div>

            {/* Question Input */}
            <div className="border-t border-zinc-800 p-4">
              <div className="flex items-end gap-2 rounded-xl border border-zinc-700 bg-zinc-950 p-2">
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleQuestionKeyDown}
                  disabled={!videoId || sending}
                  placeholder={
                    videoId
                      ? "Ask something about this video..."
                      : "Process a video first..."
                  }
                  rows={1}
                  className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed"
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!videoId || !question.trim() || sending}
                  className="rounded-lg bg-purple-600 p-3 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Send question"
                >
                  {sending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </div>

              <p className="mt-2 text-center text-xs text-zinc-500">
                Press Enter to send · Shift + Enter for a new line
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default App;
