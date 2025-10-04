// Mock AI service that returns consistent location suggestions
const mockLocationData = [
  {
    title: "Historic Dutch Colonial House - Fort Kochi",
    description: "Beautiful 16th-century Dutch colonial architecture near the seashore with authentic period details. Features traditional red-tiled roofs, wooden shutters, and waterfront views perfect for period films.",
    coordinates: { lat: 9.9658, lng: 76.2422 },
    region: "Kochi, Kerala",
    tags: ["historic", "colonial", "waterfront", "architecture", "period-film"],
    permits: [
      { name: "Coastal Regulation Zone Clearance", required: true, notes: "Required for filming near coastal areas" },
      { name: "Local Municipality Permission", required: true, notes: "Municipal corporation filming permit" },
      { name: "Port Trust Clearance", required: true, notes: "Due to proximity to port area" },
      { name: "Archaeological Survey Permit", required: false, notes: "If filming inside heritage structure" }
    ],
    images: [
      "https://example.com/images/dutch-house-1.jpg",
      "https://example.com/images/dutch-house-2.jpg",
      "https://example.com/images/dutch-house-3.jpg"
    ],
    confidence: 0.95
  },
  {
    title: "Backwater Houseboat Village - Alleppey",
    description: "Traditional Kerala backwater village with authentic houseboats and palm-fringed canals. Offers serene water bodies, traditional architecture, and local village life scenes.",
    coordinates: { lat: 9.4981, lng: 76.3388 },
    region: "Alleppey, Kerala",
    tags: ["backwaters", "traditional", "village", "houseboats", "rural"],
    permits: [
      { name: "Tourism Department Permission", required: true, notes: "Required for filming in tourist areas" },
      { name: "Boat Operators Association Clearance", required: true, notes: "Permission from local boat operators" },
      { name: "Village Panchayat Approval", required: true, notes: "Local governing body permission" },
      { name: "Pollution Control Board NOC", required: false, notes: "If using motorized equipment near water" }
    ],
    images: [
      "https://example.com/images/backwater-1.jpg",
      "https://example.com/images/backwater-2.jpg"
    ],
    confidence: 0.88
  },
  {
    title: "Munnar Tea Plantation Estate",
    description: "Sprawling tea plantations with rolling hills, mist-covered valleys, and colonial-era tea factory. Perfect for romantic scenes, musical sequences, or depicting rural life.",
    coordinates: { lat: 10.0889, lng: 77.0595 },
    region: "Munnar, Kerala",
    tags: ["tea-plantation", "hills", "nature", "colonial", "scenic"],
    permits: [
      { name: "Forest Department Clearance", required: true, notes: "Required for filming in forest areas" },
      { name: "Tea Estate Management Permission", required: true, notes: "Permission from estate owners" },
      { name: "District Collector Approval", required: true, notes: "Administrative clearance" },
      { name: "Fire Safety Certificate", required: false, notes: "If using electrical equipment" }
    ],
    images: [
      "https://example.com/images/tea-plantation-1.jpg",
      "https://example.com/images/tea-plantation-2.jpg",
      "https://example.com/images/tea-plantation-3.jpg"
    ],
    confidence: 0.92
  }
];

export const mockAiService = {
  searchLocations: async (prompt) => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return all three suggestions for consistency
    // In a real AI service, this would analyze the prompt and return relevant suggestions
    const suggestions = mockLocationData.map(location => ({
      ...location,
      createdAt: new Date()
    }));
    
    return suggestions;
  }
};

export default mockAiService;