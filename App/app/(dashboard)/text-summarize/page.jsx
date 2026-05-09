

"use client";

import React, { useState } from "react";
import {
  Bot,
  Send,
  Sparkles,
  Type,
  Loader2,
  AlignLeft,
  List,
  ChevronDown,
  FileText,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProtectedRoute from "@/components/features/auth/ProtectedRoute";

function App() {
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Customization State
  const [length, setLength] = useState("medium");
  const [format, setFormat] = useState("paragraph");

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);

      // Reset the "copied" state after 2 seconds
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  const pollJobStatus = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/ai/job/${jobId}`,
        );
        const jobData = await response.json();

        if (jobData.status === "COMPLETED") {
          clearInterval(pollInterval);

          // The responseData from backend is already extracted text (not raw JSON)
          const finalAnswer = jobData.responseData || "No summary generated.";

          setSummary(finalAnswer);
          setLoading(false);
          setStatusMessage("Completed!");
        } else if (jobData.status === "FAILED") {
          clearInterval(pollInterval);
          setSummary("Error: Task failed on server.");
          setLoading(false);
          setStatusMessage("Failed");
        } else {
          setStatusMessage(`Status: ${jobData.status}...`);
        }
      } catch (err) {
        if (err.isRateLimit) {
          setError(err.rateLimitMessage); // shows: "Daily AI limit reached. Try again in 23 minutes."
          setLoading(false);
          return;
        }
        console.error("Error:", err);
        setSummary("Error: " + (err.message || "Unknown error"));
        setLoading(false);
      }
    }, 2000);
  };

  const generateAns = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setSummary("");
    setCopied(false); // Reset copied state when generating new summary
    setStatusMessage("Queueing request...");

    try {
      const payload = {
        text: text,
        length: length,
        format: format,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/ai/summarize`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      const data = await response.json();

      if (data.jobId) {
        setStatusMessage("Request Queued. Waiting for AI worker...");
        pollJobStatus(data.jobId);
      } else {
        throw new Error("No Job ID received");
      }
    } catch (err) {
      console.error("Error:", err);
      setSummary("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen w-full bg-gradient-to-br from-background to-muted/50 p-6">
        <div className="max-w-6xl m-auto ">
          <div className="text-center mb-10 animate-fade-in">
            <h1 className="text-4xl font-bold text-primary mb-2">
              AI Text Summarizer
            </h1>

            <div className="flex flex-wrap items-center justify-center gap-4 bg-card p-4 rounded-xl shadow-sm border w-fit mx-auto">
              {/* Length Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Length:
                </span>
                <div className="relative">
                  <select
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="pl-3 pr-8 py-2 bg-background border rounded-md appearance-none focus:ring-2 focus:ring-primary outline-none cursor-pointer text-sm min-w-[100px]"
                  >
                    <option value="short">Short</option>
                    <option value="medium">Medium</option>
                    <option value="long">Long</option>
                    <option value="detailed">Detailed</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>

              {/* Divider */}
              <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>

              {/* Format Toggle */}
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Format:
                </span>
                <div className="flex bg-muted p-1 rounded-md">
                  <button
                    onClick={() => setFormat("paragraph")}
                    className={`flex items-center px-3 py-1.5 text-sm rounded-sm transition-all ${
                      format === "paragraph"
                        ? "bg-background text-primary shadow-sm font-medium"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <AlignLeft className="w-4 h-4 mr-1" /> Para
                  </button>
                  <button
                    onClick={() => setFormat("bullet")}
                    className={`flex items-center px-3 py-1.5 text-sm rounded-sm transition-all ${
                      format === "bullet"
                        ? "bg-background text-primary shadow-sm font-medium"
                        : "text-muted-foreground hover:text-primary"
                    }`}
                  >
                    <List className="w-4 h-4 mr-1" /> Bullet
                  </button>
                </div>
              </div>
            </div>
            {/* --- END CONTROLS --- */}
          </div>

          {/* --- MAIN CONTENT GRID --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Input Card */}
            <Card className="flex flex-col h-full shadow-md border-muted">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Input Text
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 min-h-[400px] resize-none mb-4 p-4 text-base"
                  placeholder="Paste your article, email, or content here..."
                  required
                />
                <Button
                  className="w-full py-6 text-lg"
                  onClick={generateAns}
                  disabled={!text.trim() || loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {statusMessage}
                    </>
                  ) : (
                    <>Summarize Text</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Output Card */}
            <Card className="flex flex-col h-full shadow-md border-muted">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Send className="h-5 w-5" />
                    Your Summarized Content
                  </div>
                  {summary && !loading && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCopy}
                      className="flex items-center gap-2"
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-green-500">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copy
                        </>
                      )}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                {summary ? (
                  <div className="text-card-foreground leading-relaxed animate-typing h-full min-h-[400px] overflow-auto whitespace-pre-wrap p-6 bg-muted/30 rounded-lg border border-border/50">
                    {summary}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">
                    {loading ? (
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="animate-pulse font-medium">
                          {statusMessage}
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Sparkles className="w-10 h-10 text-muted-foreground/50" />
                        <p>Your summary will appear here</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default App;
