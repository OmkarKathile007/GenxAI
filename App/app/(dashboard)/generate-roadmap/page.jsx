"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import apiClient from "@/lib/apiClient";
import ProtectedRoute from "@/components/features/auth/ProtectedRoute";
import DayCard from "@/components/features/roadmap-generator/DayCard";
import SpinnerLoad from "@/components/shared/LoadingSpinner";
import { motion } from "framer-motion";
import { Sparkles, RotateCcw, LayoutGrid, History } from "lucide-react";

// --- Global Styles for Fonts & Sketch Borders ---
const HandwritingFont = () => (
  <style jsx global>{`
    @import url("https://fonts.googleapis.com/css2?family=Patrick+Hand&family=Inter:wght@400;600;800&display=swap");
    .font-hand {
      font-family: "Patrick Hand", cursive;
    }
    .sketch-border {
      border: 2px solid rgba(255, 255, 255, 0.7);
      border-radius: 2px 255px 3px 25px / 255px 5px 225px 5px;
      box-shadow: 2px 3px 0px rgba(0, 0, 0, 0.5);
    }
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #334155;
      border-radius: 10px;
    }
  `}</style>
);

const GenAI = () => {
  const [question, setQuestion] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [loader, setLoader] = useState(false);
  const [displayGrid, setDisplayGrid] = useState(false);
  const [error, setError] = useState("");

  // NEW STATE FOR HISTORY & SAVING ---
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [currentRoadmapId, setCurrentRoadmapId] = useState(null);

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_API_URL || "http://localhost:8080";

  // FETCH HISTORY ON LOADING ---
  useEffect(() => {
    fetchSavedRoadmaps();
  }, []);

  const fetchSavedRoadmaps = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const { data } = await axios.get(
        `${BACKEND_URL}/api/roadmaps/my-roadmaps`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setSavedRoadmaps(data);
    } catch (err) {
      console.error("Failed to load history", err);
    }
  };

  //  DATABASE OPERATIONS ---

  const saveToDatabase = async (aiData, userQuestion) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const payload = {
        title: userQuestion,
        roadmapJson: JSON.stringify(aiData),
      };

      const { data } = await axios.post(
        `${BACKEND_URL}/api/roadmaps/save`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setCurrentRoadmapId(data.id); // ID for future updates
      fetchSavedRoadmaps();
      console.log("Roadmap Saved Successfully!");
    } catch (err) {
      console.error("Save failed", err);
    }
  };

  const updateDatabase = async (updatedSchedule) => {
    if (!currentRoadmapId) return; // Only update if we have a saved ID

    try {
      const token = localStorage.getItem("token");
      const payload = {
        roadmapJson: JSON.stringify(updatedSchedule),
      };

      await axios.put(
        `${BACKEND_URL}/api/roadmaps/${currentRoadmapId}`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      console.log("Auto-saved changes.");
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const loadRoadmap = (roadmap) => {
    try {
      const parsedSchedule = JSON.parse(roadmap.roadmapJson);
      setSchedule(parsedSchedule);
      setQuestion(roadmap.title);
      setCurrentRoadmapId(roadmap.id);
      setDisplayGrid(true);
    } catch (e) {
      console.error("Error parsing roadmap", e);
    }
  };

  //  HELPER FUNCTIONS ---

  const getNext7Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(
        d.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      );
    }
    return dates;
  };

  const extractTextFromRawResponse = (rawString) => {
    try {
      const parsed = JSON.parse(rawString);
      return parsed.candidates?.[0]?.content?.parts?.[0]?.text || rawString;
    } catch (e) {
      return rawString;
    }
  };

  const processResponse = (text) => {
    const dates = getNext7Days();
    let aiItems = [];

    try {
      const cleanJson = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.schedule && Array.isArray(parsed.schedule)) {
        aiItems = parsed.schedule;
      }
    } catch (e) {
      console.warn("JSON Parse failed, using fallback");
    }

    return dates.map((dateStr, index) => ({
      date: dateStr,
      heading: aiItems[index]?.focus || "Deep Work Session",
      dayIndex: index,
    }));
  };

  const pollJobStatus = async (jobId) => {
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await apiClient.get(`/api/ai/job/${jobId}`);

        if (data.status === "COMPLETED") {
          clearInterval(pollInterval);
          const cleanResponse = extractTextFromRawResponse(data.responseData);
          const structuredSchedule = processResponse(cleanResponse);

          setSchedule(structuredSchedule);
          setLoader(false);
          setDisplayGrid(true);

          saveToDatabase(structuredSchedule, question);
        } else if (data.status === "FAILED") {
          clearInterval(pollInterval);
          setLoader(false);
          alert("Job Failed. Please try again.");
        }
      } catch (err) {
        if (err.isRateLimit) {
          setError(err.rateLimitMessage); // shows: "Daily AI limit reached. Try again in 23 minutes."
          setLoading(false);
          return;
        }
        console.error("Error:", err);
        setLoader(false);
      }
    }, 2000);
  };

  const generateSchedule = async () => {
    if (!question.trim()) return;
    setLoader(true);
    setDisplayGrid(false);
    setCurrentRoadmapId(null);

    try {
      const { data } = await apiClient.post(`/api/ai/roadmap`, { question: question });

      if (data.jobId) {
        pollJobStatus(data.jobId);
      } else {
        setLoader(false);
        alert("No Job ID received.");
      }
    } catch (err) {
      setLoader(false);
      console.error(err);
      alert("Connection Error.");
    }
  };

  const handleHeadingChange = (dayIndex, newText) => {
    const updated = [...schedule];
    updated[dayIndex].heading = newText;
    setSchedule(updated);

    // --- TRIGGER UPDATE ---
    // We add a small delay (debounce) logic in a real app,
    // but here we just fire it to keep state synced.
    updateDatabase(updated);
  };

  return (
    <ProtectedRoute>
      <HandwritingFont />
      <div className="min-w-full bg-slate-950 min-h-screen text-white relative overflow-hidden font-sans selection:bg-sky-500 selection:text-white pb-20">
        {/* Background Blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-900/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-lime-900/20 rounded-full blur-3xl" />
        </div>

        {/* --- HISTORY SIDEBAR (Only visible on Input Screen) --- */}
        {!displayGrid && !loader && savedRoadmaps.length > 0 && (
          <div className="absolute top-4 right-4 z-50 animate-in fade-in slide-in-from-right-10 duration-700">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl max-w-xs w-64">
              <h3 className="text-sky-400 font-bold mb-3 flex items-center gap-2 text-sm uppercase tracking-wider border-b border-slate-700 pb-2">
                <History size={14} /> Past Sprints
              </h3>
              <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-2">
                {savedRoadmaps.map((rm) => (
                  <button
                    key={rm.id}
                    onClick={() => loadRoadmap(rm)}
                    className="text-left text-xs text-slate-400 hover:text-white truncate p-2 hover:bg-slate-800 rounded transition-colors group"
                  >
                    <span className="block font-semibold truncate text-slate-200 group-hover:text-sky-300">
                      {rm.title}
                    </span>
                    <span className="block text-[10px] opacity-50">
                      {new Date(rm.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {loader ? (
          <SpinnerLoad />
        ) : !displayGrid ? (
          // --- Input View ---
          <div className="w-full flex flex-col items-center justify-center min-h-screen z-10 relative px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-3xl text-center"
            >
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-br from-white to-slate-500 bg-clip-text text-transparent mb-6">
                7-DAY SPRINT
              </h1>
              <p className="text-lg text-slate-400 mb-8 max-w-xl mx-auto">
                Define your goal. We'll generate a high-impact week of deep
                work. You manage the tasks.
              </p>

              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-sky-500 to-lime-500 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
                <textarea
                  className="relative w-full bg-slate-900 p-6 border border-slate-700 rounded-lg focus:border-sky-500 outline-none text-xl text-slate-200 font-hand shadow-2xl resize-none"
                  value={question}
                  placeholder="e.g., Learn AWS Lambda and build a serverless API..."
                  onChange={(e) => setQuestion(e.target.value)}
                  rows="4"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-8 px-10 py-4 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-full shadow-lg flex items-center gap-2 mx-auto"
                onClick={generateSchedule}
              >
                <Sparkles size={18} /> Generate Plan
              </motion.button>
            </motion.div>
          </div>
        ) : (
          // --- 7-Day Grid Result View ---
          <div className="w-full pt-16 px-4 md:px-8 max-w-[1600px] mx-auto z-10 relative">
            <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                  <LayoutGrid className="text-sky-500" /> Your 7-Day Sprint
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Generated for:{" "}
                  <span className="text-sky-300">"{question}"</span>
                </p>
              </div>
              <button
                onClick={() => {
                  setDisplayGrid(false);
                  setQuestion("");
                  setCurrentRoadmapId(null);
                }}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <RotateCcw size={16} /> New Sprint
              </button>
            </div>

            {/* Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {schedule.map((day, index) => (
                <DayCard
                  key={index}
                  dayIndex={index}
                  date={day.date}
                  aiHeading={day.heading}
                  onHeadingChange={(val) => handleHeadingChange(index, val)}
                />
              ))}

              {/* Final "Success" Card */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="hidden xl:flex flex-col items-center justify-center border-2 border-dashed border-slate-800 rounded-3xl p-6 text-slate-600 min-h-[320px]"
              >
                <Sparkles size={40} className="mb-4 text-lime-500/50" />
                <h3 className="text-xl font-hand text-center">
                  Sprint Complete!
                </h3>
                <p className="text-sm text-center mt-2 opacity-60">
                  Review your progress and plan the next one.
                </p>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default GenAI;
