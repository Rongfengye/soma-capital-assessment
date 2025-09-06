export async function searchPexelsImage(query: string): Promise<string | null> {
  const apiKey = process.env.PEXELS_API_KEY;
  
  if (!apiKey) {
    console.error('PEXELS_API_KEY not found in environment variables');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1`,
      {
        headers: {
          'Authorization': apiKey,
        },
      }
    );

    if (!response.ok) {
      console.error('Pexels API error:', response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.small;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching image from Pexels:', error);
    return null;
  }
}