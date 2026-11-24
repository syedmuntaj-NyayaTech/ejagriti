import dotenv from 'dotenv';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

dotenv.config();

// --------------------------------------------------
// TYPES
// --------------------------------------------------

type ApiUrlType = 'causeList' | 'judgesList';

interface CauseListPayload {
    clDate: string;
    commissionId: string;
}

interface JudgesListPayload {
    commissionId: string;
    courtId: string;
}

type ApiPayload = CauseListPayload | JudgesListPayload;

type DataRecord = Record<string, unknown>;

// --------------------------------------------------
// API CONFIGURATION
// --------------------------------------------------

const OUTPUT_DIR = path.resolve(process.cwd(), 'output/cause_list_data');

const API_URLS: Record<ApiUrlType, string | undefined> = {
    causeList: process.env.CAUSE_LIST_API_URL,
    judgesList: process.env.JUDGES_URL_LIST
};

// --------------------------------------------------
// FETCH API DATA
// --------------------------------------------------

export const getCauselistData = async (
    apiType: ApiUrlType
): Promise<unknown | null> => {

    try {
        const apiUrl = API_URLS[apiType];

        if (!apiUrl) {
            throw new Error(`${apiType} API URL missing in .env`);
        }

        let payload: ApiPayload;

        if (apiType === 'causeList') {
            payload = {
                clDate: '2026-11-19',
                commissionId: '11000000'
            };
        } else {
            payload = {
                commissionId: '11000000',
                courtId: '0'
            };
        }

        console.log(`Fetching ${apiType} data...`);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}: ${await response.text()}`
            );
        }

        const data: unknown = await response.json();

        console.log(`${apiType} API fetched successfully`);

        return data;

    } catch (error: unknown) {
        console.error(
            `Error fetching ${apiType}:`,
            error instanceof Error ? error.message : error
        );

        return null;
    }
};

// --------------------------------------------------
// CHECK OBJECT
// --------------------------------------------------

const isRecord = (value: unknown): value is DataRecord => {
    return (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
    );
};

// --------------------------------------------------
// EXTRACT CAUSELIST CASES
// --------------------------------------------------

const extractCauseListCases = (response: unknown): DataRecord[] => {

    if (!isRecord(response) || !Array.isArray(response.data)) {
        return [];
    }

    const cases: DataRecord[] = [];

    for (const courtData of response.data) {

        if (!isRecord(courtData)) continue;

        const clData = courtData.clData;

        if (typeof clData === 'string') {

            try {
                const parsed: unknown = JSON.parse(clData);

                if (Array.isArray(parsed)) {
                    for (const caseData of parsed) {
                        if (isRecord(caseData)) {
                            cases.push({
                                ...courtData,
                                ...caseData,

                                // Preserve parent court metadata
                                parentSlno: courtData.slno,
                                parentCourtId: courtData.courtId,
                                parentClDate: courtData.clDate
                            });
                        }
                    }
                }

            } catch (error) {
                console.error(
                    `Unable to parse clData for court ${courtData.slno}`,
                    error
                );
            }

        } else {
            cases.push(courtData);
        }
    }

    return cases;
};

// --------------------------------------------------
// EXTRACT JUDGES DATA
// --------------------------------------------------

const extractJudgesData = (response: unknown): DataRecord[] => {

    if (Array.isArray(response)) {
        return response.filter(isRecord);
    }

    if (!isRecord(response)) {
        return [];
    }

    // Most common API response structure
    if (Array.isArray(response.data)) {
        return response.data.filter(isRecord);
    }

    // Support nested response objects
    if (isRecord(response.data)) {

        const data = response.data;

        for (const key of Object.keys(data)) {
            if (Array.isArray(data[key])) {
                return (data[key] as unknown[]).filter(isRecord);
            }
        }

        return [data];
    }

    return [response];
};

// --------------------------------------------------
// CONVERT OBJECTS INTO CSV VALUES
// --------------------------------------------------

const convertValue = (value: unknown): string => {

    if (value === null || value === undefined) {
        return '';
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
};

// --------------------------------------------------
// SAVE DATA INTO CSV
// --------------------------------------------------

const saveToCSV = async (
    records: DataRecord[],
    filename: string
): Promise<void> => {

    await mkdir(OUTPUT_DIR, { recursive: true });

    const filePath = path.join(OUTPUT_DIR, filename);

    if (records.length === 0) {
        await writeFile(filePath, '', 'utf8');
        console.log(`No records available for ${filename}`);
        return;
    }

    // Collect all available column names
    const headers = [
        ...new Set(records.flatMap(record => Object.keys(record)))
    ];

    // CSV escaping
    const escapeCSV = (value: unknown): string => {
        const text = convertValue(value);

        return `"${text.replace(/"/g, '""')}"`;
    };

    const csvContent = [
        headers.map(escapeCSV).join(','),

        ...records.map(record =>
            headers
                .map(header => escapeCSV(record[header]))
                .join(',')
        )
    ].join('\n');

    await writeFile(filePath, '\uFEFF' + csvContent, 'utf8');

    console.log(`CSV saved successfully: ${filePath}`);
    console.log(`Total records: ${records.length}`);
    console.log(`Total columns: ${headers.length}`);
};

// --------------------------------------------------
// MAIN EXECUTION
// --------------------------------------------------

const main = async (): Promise<void> => {

    console.log('\n========== E-JAGRITI DATA EXTRACTION ==========\n');

    // Fetch both APIs
    const [causeListResponse, judgesResponse] = await Promise.all([
        getCauselistData('causeList'),
        getCauselistData('judgesList')
    ]);

    // Process Causelist
    if (causeListResponse !== null) {

        const causeListCases = extractCauseListCases(
            causeListResponse
        );

        console.log('\nCauselist records:', causeListCases.length);

        await saveToCSV(
            causeListCases,
            'cause_list.csv'
        );

    } else {
        console.error('Causelist API failed');
    }

    // Process Judges
    if (judgesResponse !== null) {

        const judges = extractJudgesData(judgesResponse);

        console.log('\nJudges records:', judges.length);

        await saveToCSV(
            judges,
            'judges_list.csv'
        );

    } else {
        console.error('Judges API failed');
    }

    console.log('\n========== EXTRACTION COMPLETED ==========\n');
};

// Execute
main().catch(error => {
    console.error('Application error:', error);
    process.exitCode = 1;
});

