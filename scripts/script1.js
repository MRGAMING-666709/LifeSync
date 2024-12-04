async function generateWeatherSuggestions(data) {

    const inputText = `the weather is ${data.weather[0].main} suggest me what can i do today in one line and make it sound pleasant.`;
    const outputDiv = document.getElementById('weather-related-suggestions');
    
    const apiKey = 'AIzaSyDYnMX_9GAWlc6cJ_TKj85OfUaBjkDlzL8';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    const headers = {
        'Content-Type': 'application/JSON',
        'Authorization': `Bearer ${apiKey}`
    };

    const body = JSON.stringify({
        model: 'gemini-1.5-flash',
        messages: [{ "role": "user", "content":  inputText}]
    });

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers, body });
        if (!response.ok) {
            throw new Error('API response not successful');
        }

        const result = await response.json();
        outputDiv.textContent = '';
        formatContent(result.choices[0].message.content, outputDiv);
    } catch (error) {
        outputDiv.textContent = 'Error: ' + error.message;
    }
}

document.getElementById('tips-submit').addEventListener('click', async (e) => {
    e.preventDefault();
    const inputText = document.getElementById('User-prompt').value;
    document.getElementById('User-prompt').value = '';
    const outputDiv = document.getElementById('AI-suggestions');

    if (!inputText.trim()) {
        outputDiv.textContent = 'Would you like me to assist you with something?';
        return;
    }
    
    outputDiv.textContent = '...';

    const apiKey = 'AIzaSyDYnMX_9GAWlc6cJ_TKj85OfUaBjkDlzL8';
    const apiUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

    const headers = {
        'Content-Type': 'application/JSON',
        'Authorization': `Bearer ${apiKey}`
    };

    const body = JSON.stringify({
        model: 'gemini-1.5-flash',
        messages: [{ "role": "user", "content": inputText }]
    });

    try {
        const response = await fetch(apiUrl, { method: 'POST', headers, body });
        console.log(response);
        if (!response.ok) {
            throw new Error('API response not successful');
        }

        const result = await response.json();
        outputDiv.textContent = '';
        formatContent(result.choices[0].message.content, outputDiv);
    } catch (error) {
        outputDiv.textContent = 'Error: ' + error.message;
    }
});

document.getElementById('openBtn').addEventListener('click', () => {
    document.getElementById('side-popup').style.right = '0%';
})

document.querySelector('.close-btn').addEventListener('click', () => {
    document.getElementById('side-popup').style.right = '-100%';
})

document.querySelector('#copyBtn').addEventListener('click', (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(document.getElementById('AI-suggestions').textContent);
})

document.querySelector('#clearBtn').addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('AI-suggestions').textContent = '';
})

const openBtn = document.getElementById('openBtn');
const closeBtn = document.getElementById('closeBtn');
const floatingWindow = document.getElementById('side-popup');


function formatContent(rawContent, container) {
    
    const lines = rawContent.split('\n').filter(line => line.trim() !== '');

    let currentList = null;

    lines.forEach(line => {
        line = line.trim();

        if (line.startsWith('**') && line.endsWith('**')) {
            const heading = document.createElement('h2');
            heading.textContent = line.replace(/\*\*/g, '');
            container.appendChild(heading);
            return;
        }

        if (line.startsWith('*')) {
            if (!currentList) {
                currentList = document.createElement('ul'); 
                container.appendChild(currentList);
            }

            const listItem = document.createElement('li');

            const boldMatch = line.match(/^\* \*\*(.*?)\*\*/);
            const rest = line.replace(/^\* \*\*(.*?)\*\*:/, '').trim(); 
            
            if (boldMatch) {
                const boldText = document.createElement('strong');
                boldText.textContent = boldMatch[1];
                listItem.appendChild(boldText);
            }

            if (rest) {
                listItem.appendChild(document.createTextNode(` ${rest}`));
            }

            currentList.appendChild(listItem);
            return;
        }

        
        if (line.startsWith('  *')) {
            if (!currentList) {
                currentList = document.createElement('ul'); 
                container.appendChild(currentList);
            }

            const nestedItem = document.createElement('li');
            nestedItem.textContent = line.replace(/^  \* /, '');
            currentList.appendChild(nestedItem);
            return;
        }

        if (currentList) currentList = null; 

        const paragraph = document.createElement('p');
        paragraph.textContent = line;
        container.appendChild(paragraph);
    });
}

