const JDModel = require("../model/jobDescription.model");
const generateProfilePpt = require("../services/pptGeneration.service");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { PDFParse } = require("pdf-parse");
const OpenAI = require("openai");

async function storeJD(req, res) {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({
        message: "Title or Description detail missing",
      });
    }
    const result = await JDModel.create({
      title: title,
      description: description,
    });

    res.status(201).json({
      message: "JD added successfully!",
      result,
    });
  } catch (error) {
    console.log("Error occured while creating a Job Description: ", error);
 
    res.status(500).json({ message: "Failed to save job description" });
  }
}

async function getJD(req, res) {
  try {
    const jobDescriptions = await JDModel.find();

    res.json({ jobDescriptions });
  } catch (error) {
    console.log("Error Occured while fetching JD's: ", error);

    res.status(500).json({ message: "Failed to fetch job descriptions" });
  }
}

async function generateProfile(req, res) {
  try {
    const resumeFile = req.files?.resume?.[0];
    const photoFile = req.files?.photo?.[0];
    const { title } = req.body;

    if (!resumeFile) {
      return res.status(400).json({
        message: "Please upload a resume",
      });
    }

    const ext = path.extname(resumeFile.originalname).toLowerCase();

    if (ext !== ".pdf") {
      return res.status(400).json({
        message: "Only PDF files are supported",
      });
    }

    const parser = new PDFParse({
      data: resumeFile.buffer,
    });

    const result = await parser.getText();

    const client = new OpenAI({
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}openai/v1/`,
    });

    const resumeText = result.text;

    const JobDescription = await JDModel.findOne({
      title: { $regex: new RegExp(`^${title}$`, "i") },
    });

    if (!JobDescription) {
      return res.status(404).json({
        message: `Job description not found for: ${title}`,
      });
    }

    let photoOutputPath = null;
    if (photoFile) {
      const photoDir = path.join(__dirname, "..", "output", "photos");
      fs.mkdirSync(photoDir, { recursive: true });
      photoOutputPath = path.join(
        photoDir,
        `${Date.now()}-${path.basename(resumeFile.originalname, ext)}.png`,
      );

      await sharp(photoFile.buffer)
        .resize(400, 400, { fit: "cover" })
        .png()
        .toFile(photoOutputPath);
    }

    const response = await client.responses.create({
      model: process.env.AZURE_OPENAI_DEPLOYMENT,

      instructions: `You are a resume-to-profile data extractor. You will be given a candidate's
resume text and a job description. Your job is to extract and synthesize
information into a strict JSON object that will be used to auto-generate a
one-page profile slide.

RULES:
1. Output ONLY valid JSON. No markdown code fences, no preamble, no explanation.
2. Follow the exact schema below — do not add, remove, or rename fields.
3. If the resume contains an existing professional summary, objective, or "About"
   section, use that content directly for "summary" — preserve its substance and
   phrasing, only lightly cleaning up grammar or trimming length if needed. Do not
   rewrite it into different wording or restructure its sentences. If the resume
   has no existing summary section, synthesize one from the overall resume
   content, emphasizing skills and experience relevant to the job description,
   without inventing anything not present in the resume.
4. In the "summary" field, wrap the 2-4 most important phrases in double
   asterisks (**like this**) to mark them for bold formatting — this applies
   whether the summary was extracted or synthesized. Do not overuse bold —
   pick only the strongest keywords (years of experience, core domain, top
   2-3 skills).
5.  "experienceBullets" must be between 6 and 15 bullets, each one sentence,
   written in past tense, starting with an action verb. Pull these from the
   resume's work experience section, prioritizing bullets most relevant to
   the JD. Rephrase these into a consistent, professional bio voice — do not
   copy resume bullets verbatim, even if they already read well. Include as
   many distinct, resume-supported responsibilities/achievements as
   reasonably exist, up to 15 — do not pad with repetitive or generic
   bullets just to hit the count.
6. "skills" must group related technical/tool skills under short labels
   (e.g. "Backend", "Databases", "Tools") — infer sensible groupings from
   the resume if it isn't already categorized.
7. "industries" must be inferred ONLY from companies, named projects, or domain-specific work explicitly stated in the resume text. Do NOT infer an industry from generic technical work that could apply to any domain (e.g. building REST APIs, admin dashboards, or auth systems does NOT by itself imply "E-commerce", "Healthcare", "Finance", etc. — these are domain-agnostic). Only include an industry if the resume names a specific company, client, or project whose domain is stated or unambiguous (e.g. "VeriSure - document verification" → do not default to a random industry unless the resume itself says what sector it served). Return between 3 and 6 items. If fewer than 3 industries are clearly evidenced, return only the ones that are — do not pad the list to reach 3.
8. If a field cannot be determined from the resume (e.g. phone number is
   missing), use an empty string "" — never guess or fabricate contact info.
9. "photoPath" should always be null — this is filled in separately by the
   application, not by you.
10. "countryCode" should be a 3-letter code inferred from the location
    (e.g. "IND", "USA", "GBR"). If location is unclear, use "".

OUTPUT SCHEMA (return exactly this structure):
{
  "headerLabel": "string, e.g. 'DELIVERY LEADERSHIP BIOS' or similar generic header",
  "name": "string",
  "title": "string, the candidate's professional title/role",
  "location": "string, e.g. 'City, Country'",
  "phone": "string",
  "countryCode": "string, 3-letter code",
  "photoPath": null,
  "summary": "string, 2-4 sentences, with key phrases wrapped in **bold markers**",
  "skills": [
    { "label": "string, category name", "value": "string, comma-separated skills" }
  ],
  "industries": ["string", "string", "string"],
  "experienceBullets": ["string", "string", "string", "string", "string", "string"]
}`,

      input: `
    JOB DESCRIPTION:
    ${JobDescription.description}

    CANDIDATE RESUME:
    ${resumeText}
  `,
    });
    console.log(response.output_text);

    const cleaned = response.output_text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let profileData;
    try {
      profileData = JSON.parse(cleaned);
    } catch (err) {
      console.error("LLM did not return valid JSON:", response.output_text);
      return res
        .status(502)
        .json({ message: "Failed to parse LLM response into profile data" });
    }

    profileData.photoPath = photoOutputPath;

    profileData.industries = (profileData.industries || []).slice(0, 6);
    profileData.experienceBullets = (profileData.experienceBullets || []).slice(
      0,
      6,
    );
    profileData.skills = (profileData.skills || []).slice(0, 15);

    const outDir = path.join(__dirname, "..", "output", "profiles");
    const outPath = path.join(
      outDir,
      `${(profileData.name || "profile").replace(/\s+/g, "_")}-${Date.now()}.pptx`,
    );

    fs.mkdirSync(outDir, { recursive: true });
    
    await generateProfilePpt(profileData, outPath);

    const downloadUrl = `${req.protocol}://${req.get("host")}/output/profiles/${path.basename(outPath)}`;

    return res.status(200).json({
      message: "Profile generated successfully",
      downloadUrl,
      profileData,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to generate profile",
    });
  }
}

module.exports = { storeJD, getJD, generateProfile };
