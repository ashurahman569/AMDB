/* eslint-env node */  
/* eslint-disable no-undef */ 
const scrollbar = require('tailwind-scrollbar');  
  
module.exports = {  
  content: ['./src/**/*.{js,jsx,ts,tsx}'],  
  theme: {  
    extend: {},  
  },  
  plugins: [  
    scrollbar,  
  ],  
};  