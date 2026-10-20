const ResumeModel = require("../Models/resume");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const path = require("path");
const fs = require("fs");
const { CohereClient } = require("cohere-ai");

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

exports.addResume = async (req, res) => {
  try {
    const { job_desc, user } = req.body;

    const dataBuffer = req.file.buffer;
    const pdfData = await pdfParse(dataBuffer);

    const prompt = `Evaluate the resume against the job description.

Resume:
${pdfData.text}

Job description:
${job_desc}

Instructions:
1. Provide a score from 0 to 100.
2. Write a reason based on the score:
   - Low match: state key missing qualifications.
   - Medium match: state specific areas to improve.
   - High match: state extra skills to stand out.
3. Write exactly 2 complete sentences between 40 and 50 words total so the text finishes before the cutoff.

Format:
Score: XX
Reason: ...`;

    const response = await cohere.chat({
      model: "command-r-08-2024",
      message: prompt,
      maxTokens: 100,
      temperature: 0.7,
    });

    let result = response.text;

    const match = result.match(/Score:\s*(\d+)/);
    const score = match ? parseInt(match[1], 10) : null;

    const reasonMatch = result.match(/Reason:\s*([\s\S]*)/);
    const reason = reasonMatch ? reasonMatch[1].trim() : null;

    const newResume = new ResumeModel({
      user,
      resume_name: req.file.originalname,
      job_desc,
      score,
      feedback: reason,
    });

    await newResume.save();

    res.status(200).json({ message: "your analysis are ready", data: newResume });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error", message: err.message });
  }
};

// Fetch scan history for a specific user ID
exports.getAllResumesForUser = async (req, res) => {
  try {
    const { user } = req.params;
    const resumes = await ResumeModel.find({ user }).sort({ createdAt: -1 });
    return res.status(200).json({ resumes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error", message: err.message });
  }
};

// Fetch all scan records across users with populated user profile fields
exports.getAllResumesForAdmin = async (req, res) => {
  try {
    const resumes = await ResumeModel.find()
      .populate("user", "name email role photoUrl")
      .sort({ createdAt: -1 });
    return res.status(200).json({ resumes });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "server error", message: err.message });
  }
};