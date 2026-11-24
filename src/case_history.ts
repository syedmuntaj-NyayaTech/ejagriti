import dotenv from 'dotenv';
dotenv.config();

const caseHistoryUrl = process.env.CASE_HISTORY_URL || "";
const judgementOrderDownloadUrl = process.env.JUDGEMENT_ORDER_DOWNLOAD_URL || "";

const getCaseHistoryData = async (caseNumber: string) => {
    try {
        const response = await fetch(caseHistoryUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                caseNumber
            })
        });
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching case history data:", error);
        throw error;
    }
};

const downloadJudgementOrderPdf = async (dateOfHearing: string, filingReferenceNumber: number, orderTypeId: number) => {
    try {
        const response = await fetch(judgementOrderDownloadUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                dateOfHearing,
                filingReferenceNumber,
                orderTypeId
            })
        });
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error downloading judgement order PDF:", error);
        throw error;
    }
};

export { getCaseHistoryData, downloadJudgementOrderPdf };