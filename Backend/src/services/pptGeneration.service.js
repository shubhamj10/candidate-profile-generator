
const pptxgen = require("pptxgenjs");
const fs = require("fs");
const path = require("path");

const THEME = {
  headerColor: "8A8A8A",
  nameColor: "2E75D6",
  accentColor: "F5A623", // the orange underline bars in the sample
  textColor: "333333",
  mutedColor: "999999",
  fontFace: "Calibri",
};


const SAMPLE_PROFILE = {
  headerLabel: "DELIVERY LEADERSHIP BIOS",
  name: "Jane Doe",
  title: "Business Analyst",
  location: "Hyderabad, IND",
  phone: "+91 XXXXXXXXXX",
  countryCode: "IND",
  photoPath: null, // e.g. "./candidate-photo.jpg" — null draws a placeholder

  summary:
    "Business Analyst with **7+ years of experience** in **Enterprise Banking, SaaS, Customer Success, and Digital Transformation** projects. Strong expertise in **requirements gathering, BRD/FRD preparation, process mapping, GAP analysis, UAT, release management**. Proven ability to bridge business and technology teams and deliver business-critical solutions.",

  skills: [
    { label: "Programming Language", value: "SQL" },
    { label: "Framework", value: "Agile, Waterfall, SDLC, Change Management" },
    { label: "Tools/Application", value: "JIRA, Postman, SQL, API Integrations" },
    { label: "Test Methodologies", value: "UAT, Functional, Integration, Regression" },
  ],

  industries: [
    "Retail Banking & Banking Digitization",
    "Enterprise SaaS & Technology",
    "Software Testing & Digital Transformation",
    "Healthcare",
  ],

  experienceBullets: [
    "Over 7+ years of experience as a Business Analyst delivering enterprise solutions across Banking, SaaS, and Digital Transformation domains.",
    "Collaborated with business stakeholders, product owners, and technical teams to gather, analyze, and document requirements through BRDs, FRDs, user stories, and acceptance criteria.",
    "Performed As-Is/To-Be process analysis, GAP analysis, and solution validation, ensuring requirements were translated into scalable technical solutions.",
    "Facilitated User Acceptance Testing (UAT) by preparing test scenarios, coordinating validation, and obtaining production sign-offs.",
    "Coordinated with cross-functional teams including Business, Development, QA, and Support to manage release planning and defect triage.",
  ],
};


function toRuns(str, baseOpts = {}) {
  if (!str) return [{ text: "", options: baseOpts }];
  const parts = str.split(/\*\*(.*?)\*\*/g); // odd indices are bold
  return parts
    .filter((p) => p.length > 0)
    .map((p, i) => ({
      text: p,
      options: { ...baseOpts, bold: i % 2 === 1 },
    }));
}


function sanitizeProfileData(data = {}) {
  const safeArray = (v) => (Array.isArray(v) ? v.filter(Boolean) : []);

  let photoPath = null;
  if (data.photoPath && typeof data.photoPath === "string") {
    try {
      if (fs.existsSync(data.photoPath)) photoPath = data.photoPath;
    } catch (_) {
      photoPath = null; 
    }
  }

  return {
    headerLabel: data.headerLabel || "PROFILE",
    name: data.name || "Unnamed Candidate",
    title: data.title || "",
    location: data.location || "",
    phone: data.phone || "",
    countryCode: (data.countryCode || "").toString().toUpperCase().slice(0, 4),
    photoPath,
    summary: typeof data.summary === "string" ? data.summary : "",
    skills: safeArray(data.skills).map((s) => {
      if (typeof s === "string") return { label: "", value: s };
      return { label: s.label || "", value: s.value || "" };
    }),
    industries: safeArray(data.industries).map(String),
    experienceBullets: safeArray(data.experienceBullets).map(String),
  };
}


function buildSlide(pres, rawData) {
  const data = sanitizeProfileData(rawData);
  const slide = pres.addSlide();
  slide.background = { color: "FFFFFF" };


  slide.addText(data.headerLabel, {
    x: 0.4,
    y: 0.15,
    w: 8,
    h: 0.3,
    fontSize: 10,
    color: THEME.headerColor,
    fontFace: THEME.fontFace,
    charSpacing: 2,
    bold: true,
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.3,
    y: 0.55,
    w: 12.7,
    h: 6.6,
    rectRadius: 0.1,
    fill: { color: "FFFFFF" },
    line: { color: "DDDDDD", width: 1 },
  });

  const photoX = 0.7,
    photoY = 0.9,
    photoW = 1.5,
    photoH = 1.5;

  if (data.photoPath) {
    try {
      slide.addImage({
        path: data.photoPath,
        x: photoX,
        y: photoY,
        w: photoW,
        h: photoH,
        rounding: true, // circular crop
      });
    } catch (err) {
      console.warn(`Could not embed photo (${data.photoPath}):`, err.message);
      addPhotoPlaceholder(pres, slide, photoX, photoY, photoW, photoH);
    }
  } else {
    addPhotoPlaceholder(pres, slide, photoX, photoY, photoW, photoH);
  }

  if (data.countryCode) {
    slide.addShape(pres.ShapeType.rect, {
      x: photoX,
      y: photoY + photoH + 0.05,
      w: photoW,
      h: 0.3,
      fill: { color: "F0F0F0" },
      line: { type: "none" },
    });
    slide.addText(data.countryCode, {
      x: photoX,
      y: photoY + photoH + 0.05,
      w: photoW,
      h: 0.3,
      align: "center",
      valign: "middle",
      fontSize: 9,
      bold: true,
      color: THEME.textColor,
    });
  }

  const infoX = photoX + photoW + 0.3;
  slide.addText(data.name, {
    x: infoX,
    y: 0.9,
    w: 4,
    h: 0.4,
    fontSize: 20,
    bold: true,
    color: THEME.nameColor,
    fontFace: THEME.fontFace,
    autoFit: true,
  });

  if (data.title) {
    slide.addText(data.title, {
      x: infoX,
      y: 1.3,
      w: 4,
      h: 0.3,
      fontSize: 13,
      bold: true,
      color: THEME.textColor,
      fontFace: THEME.fontFace,
    });
  }
  if (data.location) {
    slide.addText(`📍  ${data.location}`, {
      x: infoX,
      y: 1.7,
      w: 4,
      h: 0.3,
      fontSize: 11,
      color: THEME.textColor,
    });
  }
  if (data.phone) {
    slide.addText(`📞  ${data.phone}`, {
      x: infoX,
      y: 2.0,
      w: 4,
      h: 0.3,
      fontSize: 11,
      color: THEME.textColor,
    });
  }

  // --- Summary paragraph (top right block) --------------------------------
  if (data.summary) {
    slide.addText(
      toRuns(data.summary, { fontSize: 11.5, color: THEME.textColor, fontFace: THEME.fontFace }),
      {
        x: 5.3,
        y: 0.9,
        w: 7.4,
        h: 1.6,
        valign: "top",
        lineSpacing: 16,
        autoFit: true, // shrinks font rather than overflowing on long summaries
      }
    );
  }

  // Divider line under the header block
  slide.addShape(pres.ShapeType.line, {
    x: 0.7,
    y: 2.75,
    w: 11.9,
    h: 0,
    line: { color: "DDDDDD", width: 1 },
  });

  // --- Left column: Skills + Industry --------------------------------------
  let leftY = 3.0;

  if (data.skills.length > 0) {
    leftY = addSectionHeader(pres, slide, "Relevant Tools/Skills –", 0.7, leftY, 1.6);

    const skillBullets = data.skills.map((s) => ({
      text: s.label ? `${s.label} - ${s.value}` : s.value,
      options: { bullet: true, fontSize: 10.5, color: THEME.textColor },
    }));
    const skillsH = 1.6;
    slide.addText(skillBullets, {
      x: 0.7,
      y: leftY,
      w: 5.6,
      h: skillsH,
      valign: "top",
      lineSpacing: 14,
      autoFit: true,
    });
    leftY += skillsH + 0.2;
  }

  if (data.industries.length > 0) {
    leftY = addSectionHeader(pres, slide, "Industry Sector Experience", 0.7, leftY, 1.8);

    const industryBullets = data.industries.map((i) => ({
      text: i,
      options: { bullet: true, fontSize: 10.5, color: THEME.textColor },
    }));
    // give it whatever vertical room remains down to the card's bottom edge
    const remainingH = Math.max(0.9, 7.1 - leftY);
    slide.addText(industryBullets, {
      x: 0.7,
      y: leftY,
      w: 5.6,
      h: remainingH,
      valign: "top",
      lineSpacing: 14,
      autoFit: true,
    });
  }

  // --- Right column: Relevant Experience -----------------------------------
  if (data.experienceBullets.length > 0) {
    addSectionHeader(pres, slide, "Relevant Experience", 6.6, 3.0, 0);

    const expBullets = data.experienceBullets.map((b) => ({
      text: b,
      options: { bullet: true, fontSize: 10.5, color: THEME.textColor },
    }));
    slide.addText(expBullets, {
      x: 6.6,
      y: 3.55,
      w: 6.3,
      h: 3.5,
      valign: "top",
      lineSpacing: 15,
      autoFit: true, 
    });
  }
}


function addPhotoPlaceholder(pres, slide, x, y, w, h) {
  slide.addShape(pres.ShapeType.ellipse, {
    x,
    y,
    w,
    h,
    fill: { color: "EEEEEE" },
    line: { color: "CCCCCC", width: 1 },
  });
  slide.addText("PHOTO", {
    x,
    y,
    w,
    h,
    align: "center",
    valign: "middle",
    fontSize: 10,
    color: THEME.mutedColor,
  });
}

/** Adds a bold section title + orange underline bar; returns the y-position content should start at. */
function addSectionHeader(pres, slide, label, x, y, underlineWidth) {
  slide.addText(label, {
    x,
    y,
    w: 5.5,
    h: 0.3,
    fontSize: 13,
    bold: true,
    color: THEME.textColor,
  });
  if (underlineWidth > 0) {
    slide.addShape(pres.ShapeType.rect, {
      x,
      y: y + 0.32,
      w: underlineWidth,
      h: 0.04,
      fill: { color: THEME.accentColor },
      line: { type: "none" },
    });
  }
  return y + 0.5;
}

// ---------------------------------------------------------------------------
// PUBLIC ENTRY POINT — call this from your Express route
// ---------------------------------------------------------------------------
/**
 * @param {object} profileData - JSON shaped like SAMPLE_PROFILE above
 *   (this is what your LLM extraction step should return).
 * @param {string} outPath - absolute or relative path to write the .pptx to.
 * @returns {Promise<string>} the outPath, once the file has been written.
 */
async function generateProfilePpt(profileData, outPath) {
  const pres = new pptxgen();
  pres.defineLayout({ name: "WIDE", width: 13.33, height: 7.5 });
  pres.layout = "WIDE";

  buildSlide(pres, profileData);

  // make sure the output directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });

  await pres.writeFile({ fileName: outPath });
  return outPath;
}

module.exports = generateProfilePpt;
module.exports.sanitizeProfileData = sanitizeProfileData; // exported for unit testing

// ---------------------------------------------------------------------------
// CLI ENTRY POINT — lets you run `node generate-profile.js` for local testing
// ---------------------------------------------------------------------------
if (require.main === module) {
  const outPath = path.join(__dirname, "profile-output.pptx");
  generateProfilePpt(SAMPLE_PROFILE, outPath)
    .then((p) => console.log("Generated:", p))
    .catch((err) => {
      console.error("Failed to generate PPT:", err);
      process.exit(1);
    });
}