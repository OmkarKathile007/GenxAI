"use client";

import React, { useState } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Mail, Send } from "lucide-react";
import ProtectedRoute from "@/components/features/auth/ProtectedRoute";

const EmailWriter = () => {
  const [recipientName, setRecipientName] = useState("");
  const [subject, setSubject] = useState("");
  const [points, setPoints] = useState(""); // New field for email context
  const [emailContent, setEmailContent] = useState("");
  const [error, setError] = useState("");

  // Async States
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
  // Helper to extract clean text from raw Gemini JSON
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
          const cleanEmail = extractTextFromRawResponse(data.responseData);
          setEmailContent(cleanEmail);
          setLoading(false);
          setStatusMessage("Completed!");
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          setEmailContent("Error: Task failed on server.");
          setLoading(false);
          setStatusMessage("Failed");
        } else {
          setStatusMessage(`Status: ${data.status}...`);
        }
      } catch (err) {
        if (err.isRateLimit) {
          setError(err.rateLimitMessage); // shows: "Daily AI limit reached. Try again in 23 minutes."
          setLoading(false);
          return;
        }
        console.error("Error:", err);
        setEmailContent("Error: " + (err.message || "Unknown error"));
        setLoading(false);
      }
    }, 2000); // Check every 2 seconds
  };

  const generateAns = async (e) => {
    e.preventDefault();
    if (!recipientName.trim() || !subject.trim() || !points.trim()) return;

    setLoading(true);
    setEmailContent("");
    setStatusMessage("Queueing...");

    try {
      // 1. Submit Job
      // Matching backend prompt keys: {{recipient_name}}, {{subject}}, {{points}}
      const payload = {
        recipient_name: recipientName,
        subject: subject,
        points: points,
      };

      const { data } = await apiClient.post(`/api/ai/email`, payload);

      // 2. Start Polling
      if (data.jobId) {
        setStatusMessage("Drafting your email...");
        pollJobStatus(data.jobId);
      } else {
        throw new Error("No Job ID received");
      }
    } catch (err) {
      console.error("Error:", err);
      setEmailContent("Error: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-950 text-slate-100">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold flex items-center justify-center gap-3 text-white">
              <Mail className="w-8 h-8 text-blue-500" />
              AI Email Writer
            </h1>
            <p className="text-slate-400 mt-2">
              Draft professional emails in seconds
            </p>
          </div>

          <form
            onSubmit={generateAns}
            className="space-y-4 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-xl"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Recipient Name
                </label>
                <Input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Hiring Manager"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Subject Line
                </label>
                <Input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Project Update"
                  className="bg-slate-950 border-slate-700 text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Key Points / Message Details
              </label>
              <Textarea
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                placeholder="What do you want to say? (e.g. 'Asking for a meeting on Tuesday to discuss the budget')"
                className="min-h-[200px] bg-slate-950 border-slate-700 text-white"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 font-semibold"
              disabled={loading || !recipientName || !subject || !points}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {statusMessage}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" /> Generate Email
                </>
              )}
            </Button>
          </form>

          {emailContent && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold mb-3 text-blue-400">
                Generated Draft:
              </h2>
              <Textarea
                value={emailContent}
                readOnly
                className="w-full bg-slate-900 border-slate-700 text-slate-300 leading-relaxed p-6 h-[300px]"
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EmailWriter;
