/* exported gapiLoaded */
/* exported gisLoaded */
/* exported handleAuthClick */
/* exported handleSignoutClick */

// TODO(developer): Set to client ID and API key from the Developer Console
const CLIENT_ID = '967385830779-stmomdgh2vg57g9un8ohqh57c2n8i5rb.apps.googleusercontent.com';
const API_KEY_CALENDAR = 'AIzaSyCU_Q8nsRbnFt10-jde9j8ILaqHFo9qoac';

// Discovery doc URL for APIs used by the quickstart
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let tokenClient;
let gapiInited = false;
let gisInited = false;

document.getElementById('authorize_button').style.visibility = 'hidden';
document.getElementById('signout_button').style.display = 'none';

/**
 * Callback after api.js is loaded.
 */
function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

/**
 * Callback after the API client is loaded. Loads the
 * discovery doc to initialize the API.
 */
async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY_CALENDAR,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
    maybeEnableButtons();
}

/**
 * Callback after Google Identity Services are loaded.
 */
function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // defined later
    });
    gisInited = true;
    maybeEnableButtons();
}

/**
 * Enables user interaction after all libraries are loaded.
 */
function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        document.getElementById('authorize_button').style.visibility = 'visible';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
        throw (resp);
        }
        document.getElementById('signout_button').style.visibility = 'visible';
        document.getElementById('signout_button').style.display = 'block'
        
        document.getElementById('authorize_button').innerText = 'Refresh';
        document.getElementById('inner-container-TM').style.display = 'flex';
        await listUpcomingEvents();
    };

    if (gapi.client.getToken() === null) {
        // Prompt the user to select a Google Account and ask for consent to share their data
        // when establishing a new session.
        tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
        // Skip display of account chooser and consent dialog for an existing session.
        tokenClient.requestAccessToken({prompt: ''});
    }
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick() {
    const token = gapi.client.getToken();
    if (token !== null) {
        google.accounts.oauth2.revoke(token.access_token);
        gapi.client.setToken('');
        document.getElementById('content').innerText = '';
        document.getElementById('authorize_button').innerText = 'Authorize';
        document.getElementById('signout_button').style.visibility = 'hidden';
        document.getElementById('inner-container-TM').style.display = 'none';
    }
}

/**
 * Print the summary and start datetime/date of the next ten events in
 * the authorized user's calendar. If no events are found an
 * appropriate message is printed.
 */
async function listUpcomingEvents() {
    let response;
    try {
        const request = {
        'calendarId': 'primary',
        'timeMin': (new Date()).toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'maxResults': 10,
        'orderBy': 'startTime',
        };
        response = await gapi.client.calendar.events.list(request);
    } catch (err) {
        document.getElementById('content').innerText = err.message;
        return;
    }
    const events = response.result.items;
    
    if (!events || events.length == 0) {
        document.getElementById('content').innerText = 'No events found.';
        return;
    }
    // Flatten to string to display

    const output = events.reduce((str, event) => {
        let dispDate;
        if (event.start.dateTime) {
            dispDate = event.start.dateTime.split('T').join(' ').split('Z')[0];
        } else if (event.start.date) {
            dispDate = event.start.date;
        } else {
            dispDate = "";
        }
        eventsIDObject[event.summary] = event.id;
        return `${str}${event.summary} -> [${dispDate}]\n`;
    }, 'Events:\n');

    document.getElementById('content').innerText = output;
        
}

async function addEvent() {
    let title = document.getElementById('event-title').value;
    let start = document.getElementById('event-start').value + ':00';

    let endtime = document.getElementById('event-end').value;
    let end;

    if (!endtime) {
        end = start;
    } else {
        end = endtime + ':00';
    }

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    

    try {
        const event = {
            'summary': title,
            'start': {
                'dateTime': start,
                'timeZone': userTimezone,
            },
            'end': {
                'dateTime': end,
                'timeZone': userTimezone,
            },
        };

        const request = gapi.client.calendar.events.insert({
            'calendarId': 'primary',
            'resource': event
        });

        request.execute(async (resp) => {
            if (resp.error !== undefined) {
            throw (resp);
            }
            
            await listUpcomingEvents();
        });
        

    } catch (err) {
        displayError(err.message);
        return;
    }
}

let eventsIDObject = {};

async function deleteEvent(title) {

    const eventId = eventsIDObject[title];
    try {
        const response = await gapi.client.calendar.events.delete({
            calendarId: 'primary',
            eventId: eventId,
        });

        // If successful, refresh the event list
        if (!response.result) {
            document.getElementById('content').innerText = `Event deleted successfully.`;
            await listUpcomingEvents();
        } else {
            throw new Error('Failed to delete the event.');
        }
    } catch (err) {
        console.error('Error deleting event:', err);
        document.getElementById('content').innerText = `Error deleting event: ${err.message}`;
    }
}