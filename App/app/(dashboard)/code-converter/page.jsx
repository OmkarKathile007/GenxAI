"use client";

import React, { useState } from "react";
import apiClient from "@/lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClipboardCopy, Loader2 } from "lucide-react";
import ProtectedRoute from "@/components/features/auth/ProtectedRoute";

const CodeConverter = () => {
  const [inputLanguage, setInputLanguage] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [outputLanguage, setOutputLanguage] = useState("");
  const [convertedCode, setConvertedCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");

  // Helper to extract clean code from JSON response
  // const extractTextFromRawResponse = (rawString) => {
  //   try {
  //     const parsed = JSON.parse(rawString);
  //     let text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";

  //     // CLEANUP: Remove Markdown backticks (```java ... ```) and whitespace
  //     text = text.replace(/^```[a-z]*\n/i, "") // Remove opening ```java
  //                .replace(/```$/i, "")         // Remove closing ```
  //                .trim();                      // Remove extra spaces

  //     return text || "No code returned.";
  //   } catch (e) {
  //     return rawString;
  //   }
  // };

  // Helper to strictly extract ONLY code
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";
  const extractTextFromRawResponse = (rawString) => {
    try {
      const parsed = JSON.parse(rawString);
      let text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // 1. Remove Markdown Code Block Wrappers (```java ... ```)
      // We use a global regex (g) to catch start and end tags
      text = text
        .replace(/```[a-z]*\n?/gi, "") // Remove opening ```python or ```
        .replace(/```/g, ""); // Remove closing ```

      // 2. Remove common conversational prefixes the AI might slip in
      const badPrefixes = [
        "Here is the code",
        "Sure",
        "The code is",
        "Output:",
      ];
      badPrefixes.forEach((prefix) => {
        if (text.trim().toLowerCase().startsWith(prefix.toLowerCase())) {
          // Find the first newline and slice everything before it
          const firstLineBreak = text.indexOf("\n");
          if (firstLineBreak !== -1) {
            text = text.substring(firstLineBreak);
          }
        }
      });

      return text.trim(); // Remove leading/trailing whitespace
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
          const cleanCode = extractTextFromRawResponse(data.responseData);
          setConvertedCode(cleanCode);
          setLoading(false);
          setStatusMessage("Completed!");
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          setConvertedCode("Error: Task failed on server.");
          setLoading(false);
          setStatusMessage("Failed");
        } else {
          setStatusMessage(`Status: ${data.status}...`);
        }
      } catch (err) {
        clearInterval(pollInterval);
        setConvertedCode("Error polling status: " + err.message);
        setLoading(false);
      }
    }, 2000); // Check every 2 seconds
  };

  const generateAns = async () => {
    if (!inputLanguage || !inputCode.trim() || !outputLanguage) return;

    setLoading(true);
    setConvertedCode("");
    setStatusMessage("Queueing...");

    try {
      // 1. Send Request to Backend
      const payload = {
        code: inputCode,
        targetLanguage: outputLanguage,
      };

      const { data } = await apiClient.post(`/api/ai/convert`, payload);

      // 2. Start Polling using the Job ID
      if (data.jobId) {
        setStatusMessage("Processing...");
        pollJobStatus(data.jobId);
      } else {
        throw new Error("No Job ID received from server");
      }
    } catch (err) {
      if (err.isRateLimit) {
        setError(err.rateLimitMessage); 
        setLoading(false);
        return;
      }
      console.error("Error:", err);
      setConvertedCode("Error: " + (err.message || "Unknown error"));
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard
      .writeText(convertedCode)
      .then(() => alert("Converted code copied!"))
      .catch((e) => console.error("Copy failed", e));
  };

  return (
    <ProtectedRoute>
      <div className="mt-20 mx-auto w-5/6 h-screen flex flex-col md:flex-row gap-10 md:gap-16">
        {/* INPUT SECTION */}
        <div className="w-11/12 md:w-2/5 flex flex-col items-center gap-6">
          <Select onValueChange={setInputLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Input Language" />
            </SelectTrigger>
            <SelectContent>
              {["C++", "Java", "Python", "C", "Javascript", "Rust"].map(
                (lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            className="border border-pink-50 h-96 w-full font-mono text-sm"
            placeholder="Paste your source code here"
          />

          <Button
            className="px-10"
            onClick={generateAns}
            disabled={
              loading || !inputLanguage || !inputCode || !outputLanguage
            }
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {statusMessage}
              </>
            ) : (
              "Convert"
            )}
          </Button>
        </div>

        <div className="hidden md:flex items-center text-2xl font-bold text-gray-500">
          TO
        </div>

        {/* OUTPUT SECTION */}
        <div className="w-11/12 md:w-2/5 flex flex-col items-center gap-6">
          <Select onValueChange={setOutputLanguage}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Output Language" />
            </SelectTrigger>
            <SelectContent>
              {["C++", "Java", "Python", "C", "Javascript", "Rust"].map(
                (lang) => (
                  <SelectItem key={lang} value={lang}>
                    {lang}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          <Textarea
            className="border border-pink-50 h-96 w-full font-mono text-sm bg-transparent"
            placeholder="Converted code will appear here..."
            value={convertedCode}
            readOnly
          />

          <Button
            className="px-6 flex items-center gap-2"
            onClick={copyToClipboard}
            disabled={!convertedCode}
          >
            <ClipboardCopy className="w-5 h-5" /> Copy Code
          </Button>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default CodeConverter;
