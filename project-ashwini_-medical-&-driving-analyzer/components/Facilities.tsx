import React, { useState } from 'react';
import { getNearbyFacilities } from '../services/geminiService';
import { FacilitySuggestion } from '../types';

const Facilities: React.FC = () => {
    const [locationQuery, setLocationQuery] = useState('');
    const [mapLocation, setMapLocation] = useState(''); // Start with no location set
    const [searchType, setSearchType] = useState('Hospitals');
    const [isLoadingLocation, setIsLoadingLocation] = useState(false);
    const [isSearchingAI, setIsSearchingAI] = useState(false);
    const [suggestions, setSuggestions] = useState<FacilitySuggestion[]>([]);
    const [error, setError] = useState<string | null>(null);

    const handleSetLocationFromInput = (e: React.FormEvent) => {
        e.preventDefault();
        if (locationQuery.trim()) {
            setMapLocation(locationQuery);
            setError(null);
        } else {
            setError('Please enter a location to search.');
        }
    };
    
    const handleUseMyLocation = () => {
        setIsLoadingLocation(true);
        setError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                const userLocation = `${latitude},${longitude}`;
                setMapLocation(userLocation);
                setLocationQuery(userLocation); // Update input to reflect coords
                setIsLoadingLocation(false);
            },
            (err) => {
                setError('Could not get your location. Please enable location services or use the search bar.');
                setIsLoadingLocation(false);
                console.error(err);
            }
        );
    };

    const handleFindFacilities = async () => {
        if (!mapLocation) {
            setError('Please set a location first.');
            return;
        }
        setIsSearchingAI(true);
        setSuggestions([]);
        setError(null);

        try {
            const response = await getNearbyFacilities(mapLocation, searchType);
            let jsonText = response.text.trim();
            // Handle markdown code block
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.substring(7, jsonText.length - 3).trim();
            }
            const results: FacilitySuggestion[] = JSON.parse(jsonText);
            setSuggestions(results);

            if (results.length === 0) {
                 setError(`AI couldn't find specific suggestions. Check the map for general results.`);
            }

        } catch (e) {
            console.error(e);
            setError('AI could not fetch suggestions. Please check the map for results.');
        } finally {
            setIsSearchingAI(false);
        }
    };

    const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(searchType)}+near+${encodeURIComponent(mapLocation)}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

    const csharpSnippet = `
// C# Data Model & API Endpoint (Backend Logic)
public class Facility
{
    public string Name { get; set; }
    public double Rating { get; set; }
    public string Address { get; set; }
}

[ApiController]
[Route("api/[controller]")]
public class FacilitiesController : ControllerBase
{
    [HttpGet("search")]
    public async Task<ActionResult<IEnumerable<Facility>>> GetFacilities(
        [FromQuery] string location, 
        [FromQuery] string type)
    {
        // Use a service like Google Places API to find facilities
        var facilities = await _placesService.FindNearbyAsync(location, type);
        
        // Return the top-rated results
        return Ok(facilities.OrderByDescending(f => f.Rating).Take(3));
    }
}
`.trim();

    return (
        <div className="animate-fade-in-up flex flex-col md:flex-row gap-6 h-[85vh]">
            {/* Left Panel: Controls & Suggestions */}
            <div className="md:w-1/3 lg:w-1/3 flex flex-col gap-4 overflow-y-auto p-1">
                <h2 className="text-3xl font-bold text-brand-text-dark text-center">Find Nearby Facilities</h2>
                
                {/* Step 1: Location */}
                <div className="p-4 bg-brand-bg-light rounded-lg border">
                    <h3 className="font-bold text-lg mb-2 text-brand-primary">1. Set Your Location</h3>
                    <div className="flex flex-col gap-4">
                        <form onSubmit={handleSetLocationFromInput} className="flex gap-2">
                            <input
                                type="text"
                                value={locationQuery}
                                onChange={(e) => setLocationQuery(e.target.value)}
                                placeholder="E.g., Hyderabad, India or Lat,Lng"
                                className="flex-grow bg-white border border-gray-300 rounded-md shadow-sm p-3 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all"
                            />
                            <button type="submit" className="bg-brand-secondary hover:bg-brand-primary text-white font-bold py-2 px-4 rounded-lg shadow transition-all">
                                Set
                            </button>
                        </form>
                        <button
                            onClick={handleUseMyLocation}
                            disabled={isLoadingLocation}
                            className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg shadow transition-all disabled:bg-gray-400"
                        >
                            {isLoadingLocation ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                            )}
                            <span>Use My Location</span>
                        </button>
                    </div>
                </div>

                {/* Step 2: Facility Type */}
                <div className="p-4 bg-brand-bg-light rounded-lg border">
                    <h3 className="font-bold text-lg mb-2 text-brand-primary">2. Choose Facility Type</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {['Hospitals', 'Pharmacies', 'Diagnostic Centers'].map(type => (
                            <button
                                key={type}
                                onClick={() => setSearchType(type)}
                                className={`font-semibold py-2 px-3 rounded-md shadow-sm transition-all text-sm
                                    ${searchType === type ? 'bg-brand-primary text-white' : 'bg-white hover:bg-brand-primary/10'}`}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Step 3: Find */}
                <div className="text-center">
                    <button onClick={handleFindFacilities} disabled={isSearchingAI || !mapLocation} className="bg-brand-primary hover:bg-brand-secondary text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-all transform hover:-translate-y-1 disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {isSearchingAI ? 'AI is Searching...' : `Find Best ${searchType}`}
                    </button>
                </div>
                
                {error && <p className="text-red-500 text-center animate-fade-in-up">{error}</p>}

                {/* AI Suggestions */}
                {isSearchingAI && (
                    <div className="text-center p-4"><svg className="animate-spin inline-block h-8 w-8 text-brand-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>
                )}
                {suggestions.length > 0 && (
                    <div className="animate-fade-in-up">
                        <h3 className="text-xl font-bold mb-3 text-brand-text-dark text-center">AI Top 3 Suggestions</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {suggestions.map((s, i) => (
                                <div key={i} className="bg-white p-4 rounded-lg border shadow-sm transition-all hover:shadow-lg hover:border-brand-primary">
                                    <h4 className="font-bold text-brand-primary">{s.name}</h4>
                                    <p className="text-yellow-500 font-semibold flex items-center gap-1 my-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                        {s.rating}
                                    </p>
                                    <p className="text-sm text-gray-600">{s.address}</p>
                                </div>
                            ))}
                        </div>
                         <div className="mt-6">
                            <h3 className="font-semibold text-gray-700 mb-2 text-center">Backend Logic (C# Example)</h3>
                            <div className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto text-sm font-mono">
                                <pre><code>{csharpSnippet}</code></pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Panel: Map View */}
            <div className="flex-grow w-full md:w-2/3 lg:w-2/3 border rounded-lg overflow-hidden shadow-lg">
                {mapLocation ? (
                    <iframe
                        key={mapUrl} // Re-renders iframe when URL changes
                        width="100%"
                        height="100%"
                        loading="lazy"
                        allowFullScreen
                        src={mapUrl}
                    ></iframe>
                ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-500">
                        <p>Set a location to see the map here.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Facilities;