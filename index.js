
import dotenv from 'dotenv';

dotenv.config();

export const getCauselistData = async (apiUrlType) => {
    try {
        const apiUrl = apiUrlType === 'causeList' ? process.env.CAUSE_LIST_API_URL : process.env.JUDGES_URL_LIST;

        // Validate API URL
        if (!apiUrl) {
            throw new Error('API URL is missing in .env file');
        }

        console.log('Calling Causelist API:', apiUrl);

        let payload;


        if(apiUrlType === 'causeList') {
            try {
                payload = {
                    "clDate": "2026-11-19",
                    "commissionId": "11000000"
                };
            } catch (error) {
                console.error('Error parsing CAUSE_LIST_PAYLOAD:', error);
                return null;
            }
        }else if(apiUrlType === 'judgesList') {
            try {
                payload = {
                    "commissionId": "11000000",
                    "courtId": "0",
                };
            }
            catch (error) {
                console.error('Error parsing JUDGES_URL_LIST payload:', error);
                return null;
            }
        } else {
            throw new Error('No valid API URL found in .env file');
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        // Check HTTP response
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `HTTP Error ${response.status}: ${errorText}`
            );
        }

        const data = await response.json();

        console.log('Causelist API Response:', data);

        return data;

    } catch (error) {
        console.error('Error fetching causelist data:', error.message);
        return null;
    }
};

// Execute API
const main = async () => {
    const data = await getCauselistData('causeList');
    const judgesData = await getCauselistData('judgesList');

    if (data !== null) {
        console.log('Successfully fetched Causelist Data');
        console.log(JSON.stringify(data, null, 2));
    } else {
        console.log('Failed to fetch Causelist Data');
    }

    if (judgesData !== null) {
        console.log('Successfully fetched Judges Data');
        console.log(JSON.stringify(judgesData, null, 2));
    } else {
        console.log('Failed to fetch Judges Data');
    }
};

main();
