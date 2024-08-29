// If using ES Modules (with "type": "module" in package.json)
import { account } from 'appwrite';

// If using CommonJS (default in Node.js)
const { account } = require('appwrite');

// The rest of your script
const container = document.getElementById('container');
const registerBtn = document.getElementById('register');
const loginBtn = document.getElementById('login');

registerBtn.addEventListener('click', () => {
    container.classList.add("active");
});

loginBtn.addEventListener('click', () => {
    container.classList.remove("active");
});


