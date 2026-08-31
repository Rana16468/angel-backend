const fs = require('fs');

const path = 'c:/Users/Eusouf/Projects/Event/angel-backend/src/app/modules/event/event.services.ts';
let content = fs.readFileSync(path, 'utf8');

// The fields we want to make sure are present in the select strings
const toAdd = ' audience_settings.ticket_point_value';

// Find select("...") and inject the string if it contains audience_settings.price but not ticket_point_value
content = content.replace(/\.select\(\s*["']([^"']+)["']\s*\)/g, (match, selectString) => {
    if (selectString.includes('event_title') && !selectString.includes('ticket_point_value')) {
        return `.select("${selectString}${toAdd}")`;
    }
    return match;
});

fs.writeFileSync(path, content);
console.log("Updated event.services.ts selects");
