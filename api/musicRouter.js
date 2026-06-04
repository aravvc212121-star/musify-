import { saavnSearch, saavnGetStreamUrl, saavnGetMetadata } from './saavn.js';
import { performSearch, getStreamUrl, getYoutubeMetadata } from './youtube.js';

const INDIAN_SCRIPT_REGEX = /[\u0900-\u097F\u0A80-\u0AFF\u0C00-\u0C7F\u0C80-\u0CFF\u0B00-\u0B7F\u0B80-\u0BFF\u0A00-\u0A7F]/;
const INDIAN_KEYWORDS = ['bollywood', 'hindi', 'punjabi', 'tamil', 'telugu', 'bengali', 'arijit', 'shreya', 'badshah', 'neha', 'atif', 'sonu', 'lata', 'kishore'];

function isIndianQuery(query) {
    if (INDIAN_SCRIPT_REGEX.test(query)) return true;
    const lower = query.toLowerCase();
    return INDIAN_KEYWORDS.some(kw => lower.includes(kw));
}

export async function searchMusic(query) {
    try {
        const isIndian = isIndianQuery(query);

        if (isIndian) {
            console.log(`[Router] Indian query detected: "${query}". Routing to Saavn ONLY.`);
            try {
                const saavnResults = await saavnSearch(query);
                if (saavnResults.length > 0) return saavnResults;
                // If 0 results, implicitly fall through to YouTube
            } catch (err) {
                console.error(`[Router] Saavn search failed for Indian query:`, err.message);
                // Fallback to youtube silently
            }
        }

        console.log(`[Router] Searching Saavn first for "${query}"`);
        let saavnResults = [];
        try {
            saavnResults = await saavnSearch(query);
        } catch (err) {
            console.error(`[Router] Saavn search failed:`, err.message);
            console.log(`[Router] Falling back to YouTube...`);
            return await performSearch(query);
        }

        if (saavnResults.length >= 3) {
            console.log(`[Router] Found >= 3 results on Saavn. Returning Saavn results.`);
            return saavnResults;
        }

        console.log(`[Router] Found < 3 results on Saavn. Falling back to YouTube and merging.`);
        const ytResults = await performSearch(query);
        
        // Merge: Saavn first, then YouTube
        return [...saavnResults, ...ytResults];
    } catch (err) {
        console.error(`[Router] Fatal search error:`, err.message);
        return [];
    }
}

export async function getStream(songId, source) {
    if (source === 'saavn') {
        const url = await saavnGetStreamUrl(songId);
        if (url) {
            return { url, source: 'saavn', mime: 'audio/mp4' };
        }
        
        console.log(`[Router] Saavn stream failed/empty for ${songId}. Falling back to YouTube.`);
        // Fallback to YouTube
        try {
            const meta = await saavnGetMetadata(songId);
            if (meta) {
                const query = `${meta.title} ${meta.artist}`;
                console.log(`[Router] Searching YouTube for fallback: "${query}"`);
                const ytResults = await performSearch(query, 1);
                if (ytResults.length > 0) {
                    const fallbackVid = ytResults[0].id;
                    const ytStream = await getStreamUrl(fallbackVid);
                    return { ...ytStream, source: 'youtube', fallback: true };
                }
            }
        } catch (err) {
            console.error(`[Router] Fallback to YouTube failed:`, err.message);
        }
        throw new Error('All stream sources failed');
    }

    // Default to youtube
    const ytStream = await getStreamUrl(songId);
    return { ...ytStream, source: 'youtube' };
}

export async function getMetadata(songId, source) {
    if (source === 'saavn') {
        const meta = await saavnGetMetadata(songId);
        if (meta) return meta;
        // fallback
        return null;
    }
    
    // source === 'youtube'
    const meta = await getYoutubeMetadata(songId);
    return meta;
}
