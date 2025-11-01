// --- SECURITY & CORS WARNING ---
// 1. SECURITY: It is NOT recommended to expose your Twilio SID and Auth Token on the client-side
//    in a production application. This is done here for demonstration purposes only. In a real-world
//    scenario, this logic should be handled by a secure backend server.
//
// 2. CORS: Web browsers block front-end code from calling APIs on different domains (like api.twilio.com)
//    for security reasons (this is called the Same-Origin Policy or CORS). Twilio's API is designed
//    for server-to-server communication and doesn't support direct calls from a browser.
//
//    To work around this limitation for this demo, the API call is routed through a public CORS proxy.
//    These proxies are often unreliable and can go down without notice, causing "Failed to fetch" errors.
//    We are switching to a new proxy to resolve the current network errors.
//    THIS IS NOT A PRODUCTION-READY SOLUTION.

const TWILIO_SID = 'ACe1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'; // New placeholder SID
const TWILIO_AUTH_TOKEN = '123abc456def789ghi012jkl345mno678'; // New placeholder Auth Token
const TWILIO_PHONE_NUMBER = '+15017122661'; // New placeholder Twilio Number


const twilioEndpoint = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
// The previous proxy (proxy.cors.sh) became unreliable. Switching to corsproxy.io to fix "Failed to fetch" errors.
// This proxy prefixes the target URL to its own query parameter.
const TWILIO_API_URL = `https://corsproxy.io/?${encodeURIComponent(twilioEndpoint)}`;


export const sendEmergencyAlert = async (contact: string, message: string): Promise<{ success: boolean; error?: string }> => {
  console.log(`Sending emergency alert to ${contact} via new CORS proxy.`);

  const headers = new Headers();
  // Twilio uses Basic Auth, with the Account SID as the username and the Auth Token as the password.
  headers.append('Authorization', 'Basic ' + btoa(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`));
  headers.append('Content-Type', 'application/x-www-form-urlencoded');

  const body = new URLSearchParams();
  body.append('To', contact);
  body.append('From', TWILIO_PHONE_NUMBER);
  body.append('Body', message);

  try {
    const response = await fetch(TWILIO_API_URL, {
      method: 'POST',
      headers: headers,
      body: body,
    });

    if (response.ok) {
      console.log('Twilio SMS sent successfully!');
      return { success: true };
    } else {
      // The proxy might return errors differently. Let's try to parse as JSON first, then text.
      let errorData;
      try {
          errorData = await response.json();
      } catch (e) {
          errorData = { message: await response.text() };
      }
      console.error('Twilio API Error (via proxy):', errorData);
      return { success: false, error: errorData.message || 'Failed to send SMS due to an API error.' };
    }
  } catch (error) {
    console.error('Network error while sending SMS via Twilio:', error);
    return { success: false, error: 'A network error occurred. This could be due to the CORS proxy or network issues.' };
  }
};