"use client";

import React, { useState } from "react";
import apiClient from "@/lib/apiClient";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, Loader2, Sparkles, PenTool } from "lucide-react";
import ProtectedRoute from "@/components/features/auth/ProtectedRoute";

const ImproveText = () => {
  const [inputText, setInputText] = useState("");
  const [improvedText, setImprovedText] = useState("");

  // Async States
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

  // Helper to clean up Gemini's raw JSON response
  const extractTextFromRawResponse = (rawString) => {
    try {
      const parsed = JSON.parse(rawString);
      return (
        parsed.candidates?.[0]?.content?.parts?.[0]?.text || "No text found."
      );
    } catch (e) {
      return rawString;
    }
  };

  const pollJobStatus = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/api/ai/job/${jobId}`);

        console.log("Polling...", data.status);

        if (data.status === "COMPLETED") {
          clearInterval(pollInterval);
          const cleanText = extractTextFromRawResponse(data.responseData);
          setImprovedText(cleanText);
          setLoading(false);
          setStatusMessage("Completed!");
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          setImprovedText("Error: Task failed on server.");
          setLoading(false);
          setStatusMessage("Failed");
        } else {
          setStatusMessage(`Status: ${data.status}...`);
        }
      } catch (err) {
        if (err.isRateLimit) {
          setError(err.rateLimitMessage); 
          setLoading(false);
          return;
        }
        console.error("Error:", err);
        setImprovedText("Error: " + (err.message || "Unknown error"));
        setLoading(false);
      }
    }, 2000); // Check every 2 seconds
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setImprovedText("");
    setStatusMessage("Queueing...");

    try {
      // 1. Submit Job
      const { data } = await apiClient.post(`/api/ai/text`, { text: inputText });

      // 2. Start Polling
      if (data.jobId) {
        setStatusMessage("Improving your text...");
        pollJobStatus(data.jobId);
      } else {
        throw new Error("No Job ID received");
      }
    } catch (err) {
      console.error("Error:", err);
      setImprovedText("Error: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(improvedText)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Failed to copy: ", err));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-slate-950 text-slate-100">
        <div className="w-full max-w-3xl space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-3 text-white">
              <PenTool className="w-8 h-8 text-purple-500" />
              AI Text Improver
            </h1>
            <p className="text-slate-400 mt-2">
              Refine your answers for interviews & emails
            </p>
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={handleSubmit}
            className="border border-slate-800 bg-slate-900 p-6 rounded-xl shadow-lg flex flex-col gap-4"
          >
            <label className="text-slate-300 font-medium">
              Input your draft here
            </label>
            <Textarea
              className="w-full min-h-[150px] p-4 rounded-lg bg-slate-950 border-slate-700 text-white focus:border-purple-500 transition-colors"
              onChange={(e) => setInputText(e.target.value)}
              value={inputText}
              placeholder="e.g. I worked on java project and made api..."
              name="text"
            />
            <Button
              type="submit"
              className="w-full sm:w-1/2 m-auto bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-semibold transition-all"
              disabled={loading || !inputText}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {statusMessage}
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" /> Improve Text
                </>
              )}
            </Button>
          </form>

          {/* OUTPUT SECTION */}
          <div className="border border-slate-800 bg-slate-900 p-6 rounded-xl shadow-lg flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <label className="text-slate-300 font-medium">
              Polished Version
            </label>
            <Textarea
              className="w-full min-h-[150px] p-4 rounded-lg bg-slate-950 border-slate-700 text-green-400 font-medium"
              name="text"
              value={improvedText}
              readOnly
              placeholder="Your improved text will appear here..."
            />
            <Button
              className="self-end px-6 flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              onClick={copyToClipboard}
              disabled={!improvedText}
            >
              <ClipboardCopy className="w-4 h-4" /> Copy
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ImproveText;
