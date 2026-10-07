// extract_data.mjs
// This helper script extracts all solarData arrays and prints them as JSON.
// Called by Python seed.py via Node.

import { INDIAN_STATES_SOLAR, CERTIFIED_INSTALLERS, SOLAR_MYTHS, PRESET_QUIZ_QUESTIONS, GOVERNMENT_SCHEMES } from './src/data/solarData.js';

console.log(JSON.stringify({
  states: INDIAN_STATES_SOLAR,
  installers: CERTIFIED_INSTALLERS,
  myths: SOLAR_MYTHS,
  quizzes: PRESET_QUIZ_QUESTIONS,
  schemes: GOVERNMENT_SCHEMES
}));
