"use client";

import React, { useState } from "react";
import apiClient from "@/lib/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import ProtectedRoute from "@/components/features/auth/ProtectedRoute";

const CoverLetterGenerator = () => {
  const [companyName, setCompanyName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [error, setError] = useState("");

  // Async States
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

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
          const cleanLetter = extractTextFromRawResponse(data.responseData);
          setCoverLetter(cleanLetter);
          setLoading(false);
          setStatusMessage("Completed!");
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          setCoverLetter("Error: Task failed on server.");
          setLoading(false);
          setStatusMessage("Failed");
        } else {
          setStatusMessage(`Status: ${data.status}...`);
        }
      } catch (err) {
        clearInterval(pollInterval);
        setCoverLetter("Error polling status: " + err.message);
        setLoading(false);
      }
    }, 2000); // Check every 2 seconds
  };

  const generateAns = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !jobTitle.trim() || !jobDescription.trim())
      return;

    setLoading(true);
    setCoverLetter("");
    setStatusMessage("Queueing...");

    try {
      // Construct Payload matching Backend Prompt Keys ({{role}}, {{company}}, {{skills}})
      const payload = {
        role: jobTitle,
        company: companyName,
        skills: jobDescription, // Mapping description to 'skills' for the prompt
      };

      // 2. Submit Job
      const { data } = await apiClient.post(`/api/ai/letter`, payload);

      // 3. Start Polling
      if (data.jobId) {
        setStatusMessage("Writing your letter...");
        pollJobStatus(data.jobId);
      } else {
        throw new Error("No Job ID received");
      }
    } catch (err) {
      if (err.isRateLimit) {
        setError(err.rateLimitMessage); // shows: "Daily AI limit reached. Try again in 23 minutes."
        setLoading(false);
        return;
      }
      console.error("Error:", err);
      setCoverLetter("Error: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen flex flex-col items-center p-6 bg-slate-950 text-slate-100">
        <div className="w-full max-w-2xl mt-10">
          <h1 className="text-3xl font-bold text-center mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-8 h-8 text-blue-500" />
            AI Cover Letter Generator
          </h1>
          <p className="text-center text-slate-400 mb-8">
            Generate professional cover letters in seconds
          </p>

          <form
            onSubmit={generateAns}
            className="space-y-6 bg-slate-900 p-8 rounded-xl border border-slate-800"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name
                </label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google"
                  className="bg-slate-950 border-slate-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Job Title
                </label>
                <Input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Backend Engineer"
                  className="bg-slate-950 border-slate-700"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Job Description / Key Skills
              </label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description or list your skills here..."
                className="min-h-[100px] bg-slate-950 border-slate-700"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {statusMessage}
                </>
              ) : (
                "Generate Cover Letter"
              )}
            </Button>
          </form>

          {coverLetter && (
            <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <h2 className="text-xl font-semibold mb-3 text-blue-400">
                Generated Cover Letter:
              </h2>
              <Textarea
                value={coverLetter}
                readOnly
                className="w-full h-[500px] p-6 bg-slate-900 border-slate-700 text-slate-300 leading-relaxed font-serif text-base"
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CoverLetterGenerator;
