import dotenv from "dotenv";
dotenv.config();

const displayBoardUrl = process.env.DISPLAY_BOARD || "";
const allStateCommissionIdUrl = process.env.ALL_STATE_COMMISION_ID || "";
const allCommissionByStateIdUrl = process.env.ALL_COMMISION_BY_STATE_ID || "";

const getDisplayBoardData = async (commissionId: string) => {
    try {
        const response = await fetch(displayBoardUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({
                commissionId: commissionId
            })
        });
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching display board data:", error);
        throw error;
    }
};

const getAllStateCommissionId = async () => {
    try {
        const response = await fetch(allStateCommissionIdUrl);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching all state commission IDs:", error);
        throw error;
    }
}

const getAllCommissionByStateId = async (stateId: number) => {
    try {
        const response = await fetch(`${allCommissionByStateIdUrl}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json'
            },
            body: JSON.stringify({ stateId })
        });
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching all commission by state ID:", error);
        throw error;
    }
}

export { getDisplayBoardData, getAllStateCommissionId, getAllCommissionByStateId };
