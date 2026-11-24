// import dotenv from "dotenv";
// dotenv.config();

// const CASE_DETAILS_URL = process.env.CASE_DETAILS_URL;
// const ADDITIONAL_COMPLAINTS_DETAILS_URL = process.env.ADDITIONAL_COMPLAINTS_DETAILS_URL;
// const ADDITIONAL_RESPONDENT_DETAILS_URL = process.env.ADDITIONAL_RESPONDENT_DETAILS_URL;
// const CASE_STATUS_URL = process.env.CASE_STATUS_URL;

// const caseReferenceNumberFormat = "SC/28/CC/{number}/{year}"



// // get the case details from the api's
// export async function getCaseDetails(caseOrReferenceNumber: string) {
//     try {
//         const response = await fetch(`${CASE_DETAILS_URL}`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Accept": "application/json"
//             },
//             body: JSON.stringify({
//                 caseOrReferenceNumber: caseOrReferenceNumber
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
//         }

//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error("Error fetching case details:", error);
//         return null;

//     }
// }

// export async function getCompliantsDetails(caseOrReferenceNumber: string) {
//     try {
//         const response = await fetch(`${ADDITIONAL_COMPLAINTS_DETAILS_URL}`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Accept": "application/json"
//             },
//             body: JSON.stringify({
//                 caseOrReferenceNumber: caseOrReferenceNumber
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
//         }

//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error("Error fetching case details:", error);
//         return null;

//     }

// }

// export async function getAdditionalRespondentDetails(caseOrReferenceNumber: string) {
//     try {
//         const response = await fetch(`${ADDITIONAL_RESPONDENT_DETAILS_URL}`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Accept": "application/json"
//             },
//             body: JSON.stringify({
//                 caseOrReferenceNumber: caseOrReferenceNumber
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
//         }

//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error("Error fetching case details:", error);
//         return null;

//     }

// }

// export async function getCaseStatus(caseNumber: string) {
//     try {
//         const response = await fetch(`${CASE_STATUS_URL}`, {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//                 "Accept": "application/json"
//             },
//             body: JSON.stringify({
//                 caseNumber: caseNumber
//             })
//         });

//         if (!response.ok) {
//             throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
//         }

//         const data = await response.json();
//         return data;
//     } catch (error) {
//         console.error("Error fetching case details:", error);
//         return null;

//     }

// }



import dotenv from "dotenv";
import fs from "fs";
import path from "path";

dotenv.config();

// ==========================================
// CONFIGURATION
// ==========================================

const YEAR = "2026";
const START_CASE_NUMBER = 1;
const TOTAL_CASES = 50;

const OUTPUT_DIR = path.resolve(
  process.cwd(),
  "output",
  "case_details_data"
);

// ==========================================
// API URLS
// ==========================================

const CASE_DETAILS_URL = process.env.CASE_DETAILS_URL;
const ADDITIONAL_COMPLAINTS_DETAILS_URL =
  process.env.ADDITIONAL_COMPLAINTS_DETAILS_URL;
const ADDITIONAL_RESPONDENT_DETAILS_URL =
  process.env.ADDITIONAL_RESPONDENT_DETAILS_URL;
const CASE_STATUS_URL = process.env.CASE_STATUS_URL;

// ==========================================
// API FUNCTION
// ==========================================

async function postApi(
  apiUrl: string | undefined,
  payload: Record<string, unknown>,
  apiName: string
): Promise<any> {
  try {
    if (!apiUrl) {
      throw new Error(`${apiName} URL is missing in .env`);
    }

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(`❌ ${apiName} failed:`, error);
    return null;
  }
}

// ==========================================
// API CALLS
// ==========================================

async function getCaseDetails(reference: string) {
  return postApi(
    CASE_DETAILS_URL,
    { caseOrReferenceNumber: reference },
    "CASE DETAILS API"
  );
}

async function getCompliantsDetails(reference: string) {
  return postApi(
    ADDITIONAL_COMPLAINTS_DETAILS_URL,
    { caseOrReferenceNumber: reference },
    "ADDITIONAL COMPLAINTS API"
  );
}

async function getAdditionalRespondentDetails(reference: string) {
  return postApi(
    ADDITIONAL_RESPONDENT_DETAILS_URL,
    { caseOrReferenceNumber: reference },
    "ADDITIONAL RESPONDENTS API"
  );
}

async function getCaseStatus(reference: string) {
  return postApi(
    CASE_STATUS_URL,
    { caseNumber: reference },
    "CASE STATUS API"
  );
}

// ==========================================
// CSV HELPERS
// ==========================================

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let text =
    typeof value === "object"
      ? JSON.stringify(value)
      : String(value);

  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

function toRecordArray(data: unknown): Record<string, unknown>[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.filter(
    (item): item is Record<string, unknown> =>
      item !== null &&
      typeof item === "object" &&
      !Array.isArray(item)
  );
}

function writeCsv(
  fileName: string,
  records: Record<string, unknown>[]
): void {
  const filePath = path.join(OUTPUT_DIR, fileName);

  const columns = [
    ...new Set([
      "caseReferenceNumber",
      ...records.flatMap((record) => Object.keys(record)),
    ]),
  ];

  const header = columns.map(escapeCsvValue).join(",");

  const rows = records.map((record) =>
    columns
      .map((column) => escapeCsvValue(record[column]))
      .join(",")
  );

  const csvContent =
    [header, ...rows].join("\n") + "\n";

  fs.writeFileSync(
    filePath,
    "\uFEFF" + csvContent,
    "utf-8"
  );

  console.log(`✅ ${fileName}`);
  console.log(`   Records: ${records.length}`);
  console.log(`   Columns: ${columns.length}`);
}

// ==========================================
// MAIN EXTRACTION
// ==========================================

async function main() {
  console.log("\n======================================");
  console.log("E-JAGRITI 50 CASE DATA EXTRACTION");
  console.log("======================================");

  console.log(`Year: ${YEAR}`);
  console.log(`Starting Case Number: ${START_CASE_NUMBER}`);
  console.log(`Total Cases: ${TOTAL_CASES}`);

  // Create folder if it does not exist.
  // Existing folder contents will not be deleted.
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // ----------------------------------------
  // COLLECT ALL API RECORDS
  // ----------------------------------------

  const allCaseDetails: Record<string, unknown>[] = [];
  const allComplaints: Record<string, unknown>[] = [];
  const allRespondents: Record<string, unknown>[] = [];
  const allCaseStatuses: Record<string, unknown>[] = [];
  const allHearings: Record<string, unknown>[] = [];

  let successfulCases = 0;
  let failedCases = 0;

  // ========================================
  // ITERATE THROUGH 50 CASE NUMBERS
  // ========================================

  for (
    let i = START_CASE_NUMBER;
    i < START_CASE_NUMBER + TOTAL_CASES;
    i++
  ) {
    const caseReferenceNumber = `SC/28/CC/${i}/${YEAR}`;

    console.log("\n--------------------------------------");
    console.log(`Processing ${i}/${TOTAL_CASES}`);
    console.log(`Case: ${caseReferenceNumber}`);
    console.log("--------------------------------------");

    let caseHadError = false;

    try {
      // ------------------------------------
      // 1. CASE DETAILS
      // ------------------------------------

      console.log("1. Fetching case details...");

      const caseDetailsResponse =
        await getCaseDetails(caseReferenceNumber);

      if (caseDetailsResponse === null) {
        caseHadError = true;
      }

      const caseDetails = toRecordArray(
        caseDetailsResponse?.data
      );

      for (const record of caseDetails) {
        allCaseDetails.push({
          caseReferenceNumber,
          ...record,
        });
      }

      console.log(`   Records found: ${caseDetails.length}`);

      // ------------------------------------
      // 2. ADDITIONAL COMPLAINTS
      // ------------------------------------

      console.log("2. Fetching additional complaints...");

      const complaintsResponse =
        await getCompliantsDetails(caseReferenceNumber);

      if (complaintsResponse === null) {
        caseHadError = true;
      }

      const complaints = toRecordArray(
        complaintsResponse?.data
      );

      for (const record of complaints) {
        allComplaints.push({
          caseReferenceNumber,
          ...record,
        });
      }

      console.log(`   Records found: ${complaints.length}`);

      // ------------------------------------
      // 3. ADDITIONAL RESPONDENTS
      // ------------------------------------

      console.log("3. Fetching additional respondents...");

      const respondentsResponse =
        await getAdditionalRespondentDetails(
          caseReferenceNumber
        );

      if (respondentsResponse === null) {
        caseHadError = true;
      }

      const respondents = toRecordArray(
        respondentsResponse?.data
      );

      for (const record of respondents) {
        allRespondents.push({
          caseReferenceNumber,
          ...record,
        });
      }

      console.log(`   Records found: ${respondents.length}`);

      // ------------------------------------
      // 4. CASE STATUS
      // ------------------------------------

      console.log("4. Fetching case status...");

      const caseStatusResponse =
        await getCaseStatus(caseReferenceNumber);

      if (caseStatusResponse === null) {
        caseHadError = true;
      }

      const caseStatusData = caseStatusResponse?.data;

      if (
        caseStatusData &&
        typeof caseStatusData === "object" &&
        !Array.isArray(caseStatusData)
      ) {
        const {
          caseHearingDetails,
          ...caseStatusFields
        } = caseStatusData as Record<string, unknown>;

        // Case-level status information
        allCaseStatuses.push({
          caseReferenceNumber,
          ...caseStatusFields,
        });

        // Individual hearing records
        const hearings = toRecordArray(caseHearingDetails);

        for (const hearing of hearings) {
          allHearings.push({
            caseReferenceNumber,
            ...hearing,
          });
        }

        console.log(`   Hearings found: ${hearings.length}`);
      } else {
        console.log("   No case status data found.");
      }

    } catch (error) {
      caseHadError = true;

      console.error(
        `❌ Error processing ${caseReferenceNumber}:`,
        error
      );
    }

    if (caseHadError) {
      failedCases++;
    } else {
      successfulCases++;
    }

    console.log(
      `Progress: ${i - START_CASE_NUMBER + 1}/${TOTAL_CASES}`
    );
  }

  // ========================================
  // WRITE CSV FILES AFTER ALL ITERATIONS
  // ========================================

  console.log("\n======================================");
  console.log("SAVING CSV FILES");
  console.log("======================================");

  writeCsv("case_details.csv", allCaseDetails);

  writeCsv("additional_complaints.csv", allComplaints);

  writeCsv("additional_respondents.csv", allRespondents);

  writeCsv("case_status.csv", allCaseStatuses);

  writeCsv("case_hearings.csv", allHearings);

  // ========================================
  // FINAL SUMMARY
  // ========================================

  console.log("\n======================================");
  console.log("EXTRACTION COMPLETED");
  console.log("======================================");

  console.log(`Total cases attempted: ${TOTAL_CASES}`);
  console.log(`Cases without API errors: ${successfulCases}`);
  console.log(`Cases with API errors: ${failedCases}`);

  console.log("\nCSV RECORD SUMMARY:");

  console.log(`Case Details: ${allCaseDetails.length}`);
  console.log(`Additional Complaints: ${allComplaints.length}`);
  console.log(`Additional Respondents: ${allRespondents.length}`);
  console.log(`Case Status: ${allCaseStatuses.length}`);
  console.log(`Case Hearings: ${allHearings.length}`);

  console.log("\nOutput Directory:");
  console.log(OUTPUT_DIR);

  console.log("\n======================================");
}

main().catch((error) => {
  console.error("Extraction failed:", error);
  process.exitCode = 1;
});
