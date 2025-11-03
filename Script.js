// --- CONFIGURATION ---
// IMPORTANT: Replace this with your Google Sheet ID
const SHEET_ID = '19TBsFiRZY3ZXKqVcERnI9hoVtN10K7cK3ICEoyIlu0U';

// NOTE: These sheet names are based on the NEW "Fardin" portfolio.
// You MUST update your Google Sheet to have these tabs and headers.
// See README.md for the full structure.
const SHEET_NAMES = {
    CONFIG: 'Config', // Expects: 'Profile Image URL', 'Email', 'Location', 'Linkedin Link', 'GitHub Link'
    FLOATING_ICONS: 'FloatingIcons', // Expects: 'Skill', 'ImageURL'
    ABOUT_CARDS: 'AboutCards', // Expects: 'title', 'description'
    EXPERIENCE: 'Experience', // Expects: 'Type', 'Date Range', 'Title', 'Company/School', 'Description'
    SERVICES: 'Services', // Expects: 'Services', 'Description', 'PhotoURL'
    PROJECTS: 'Projects' // Expects: 'Project Name', 'Description', 'ThumbnailURL', 'Project Link', 'Video Link', 'Instructions', 'Tech 1', 'Tech 2', 'Tech 3', 'Tech 4'
};


// --- DATA FETCHING (from original script) ---

/**
 * Fetches data from a published Google Sheet tab.
 * @param {string} sheetName - The name of the sheet tab.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of objects.
 */
async function fetchSheetData(sheetName) {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} for sheet: ${sheetName}`);
        }
        const csvText = await response.text();
        return csvToJSON(csvText);
    } catch (error) {
        console.error(`Error fetching sheet: ${sheetName}`, error);
        // Return empty array on failure so the page doesn't break
        return [];
    }
}

/**
 * A simple CSV to JSON converter.
 * @param {string} csvText - The raw CSV text.
 * @returns {Array<Object>} - An array of objects.
 */
function csvToJSON(csvText) {
    const lines = csvText.trim().split('\n');
    // Regex to split CSV, handling quotes
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    const result = [];
    
    for (let i = 1; i < lines.length; i++) {
        const obj = {};
        // This regex handles comma-separated values, including those enclosed in double quotes.
        const values = lines[i].match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
        
        // Clean up values (remove surrounding quotes and trim whitespace)
        const cleanedValues = values.map(v => v.trim().replace(/^"|"$/g, '').trim());

        for (let j = 0; j < headers.length; j++) {
            if (headers[j]) {
                obj[headers[j]] = cleanedValues[j] || '';
            }
        }
        result.push(obj);
    }
    return result;
}


// --- All JS from the new file ---

let lenis;
let typingInstance;

// Initialize on page load
window.addEventListener('load', function() {
  console.log('Page loaded. Starting initialization...');

  // Initialize Lenis Smooth Scroll
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t))
  });
  
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  // Initialize Typed.js
  typingInstance = new Typed('#typed-role', {
    strings: ['MIS Specialist', 'Data Analyst', 'Apps Script Developer', 'Automation Expert'],
    typeSpeed: 50,
    backSpeed: 30,
    backDelay: 2000,
    loop: true,
    smartBackspace: true
  });

  // Create Floating Particles
  const particlesContainer = document.getElementById('particles-container');
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    const size = Math.random() * 80 + 40;
    particle.style.width = size + 'px';
    particle.style.height = size + 'px';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 20 + 's';
    particlesContainer.appendChild(particle);
  }

  // Fetch data from Google Sheets (MODIFIED)
  loadAndPopulateData();

  // Initialize navigation
  initNavigation();

  // Initialize scroll animations
  initScrollAnimations();

  // Initialize contact form
  initContactForm();

  // Initialize mobile menu
  initMobileMenu();

  // Set current year
  document.getElementById('current-year').textContent = new Date().getFullYear();
});

/**
 * MODIFIED: Fetches all data from public Google Sheet CSVs and transforms it.
 */
async function loadAndPopulateData() {
    try {
        console.log("Fetching data from Google Sheets...");
        // Fetch all data in parallel
        const [
            configData, 
            iconsData, 
            aboutCardsData, 
            expData, 
            servicesData, 
            projectsData
        ] = await Promise.all([
            fetchSheetData(SHEET_NAMES.CONFIG),
            fetchSheetData(SHEET_NAMES.FLOATING_ICONS),
            fetchSheetData(SHEET_NAMES.ABOUT_CARDS),
            fetchSheetData(SHEET_NAMES.EXPERIENCE),
            fetchSheetData(SHEET_NAMES.SERVICES),
            fetchSheetData(SHEET_NAMES.PROJECTS)
        ]);
        console.log("Data fetched. Transforming...");

        // Transform data into the structure populateData() expects
        const transformedData = {
            config: configData[0] || {},
            profileImage: configData[0] ? configData[0]['Profile Image URL'] : null,
            
            floatingIcons: iconsData.map(row => ({
                skill: row.Skill,
                image: row.ImageURL
            })).filter(row => row.skill && row.image),
            
            aboutCards: aboutCardsData.map(row => ({
                title: row.title,
                description: row.description
            })).filter(row => row.title && row.description),

            experience: expData.map(row => ({
                type: row.Type,
                date: row['Date Range'],
                title: row.Title,
                company: row['Company/School'],
                description: row.Description
            })).filter(Boolean), // Filter out any empty rows
            
            services: servicesData.map(row => ({
                name: row.Services,
                description: row.Description,
                photo: row.PhotoURL // Assumes you add a 'PhotoURL' column
            })).filter(row => row.name),

            projects: projectsData.map(row => ({
                name: row['Project Name'], // Assumes 'Project Name'
                description: row.Description,
                thumbnail: row.ThumbnailURL, // Assumes 'ThumbnailURL'
                link: row['Project Link'],
                videoLink: row['Video Link'],
                instructions: row.Instructions,
                tech: [row['Tech 1'], row['Tech 2'], row['Tech 3'], row['Tech 4']].filter(Boolean)
            })).filter(row => row.name)
        };
        
        console.log("Data transformed, populating page:", transformedData);
        populateData(transformedData);

    } catch (error) {
        showError(error);
    }
}

// Populate data from Google Sheets
function populateData(data) {
  console.log('Data received:', data);

  if (data.error) {
    showError({ message: data.error });
    return;
  }

  // Profile Image
  const profileImg = document.getElementById('profile-image');
  if (data.profileImage && !data.profileImage.includes('Invalid+Link')) {
    profileImg.src = data.profileImage;
    profileImg.onerror = () => {
      profileImg.src = 'https://placehold.co/192x192/667eea/ffffff?text=FS';
    };
  } else {
    profileImg.src = 'https://placehold.co/192x192/667eea/ffffff?text=FS';
  }

  // Orbital Floating Icons
  if (data.floatingIcons && data.floatingIcons.length > 0) {
    populateOrbitalIcons(data.floatingIcons);
  }

  // About Content (This is hardcoded in the template)
  const aboutContent = document.getElementById('about-content');
  aboutContent.innerHTML = `
    <p style="font-size: 1.2rem; line-height: 1.8; color: #4b5563; margin-bottom: 30px;">
      Hi, I'm a motivated MIS Executive who turns messy data into clean, actionable insights that actually help businesses run better.
      I work mainly with Google Sheets, Apps Script, Excel, and Looker Studio to build custom dashboards and automate repetitive reporting tasks.
    </p>
    <p style="font-size: 1.2rem; line-height: 1.8; color: #4b5563;">
      I'm comfortable working with BigQuery, SQL, and pretty much anything in Google Workspace. What I enjoy most is taking those overwhelming data problems that nobody wants to deal with and turning them into systems that just work.
    </p>
  `;

  // About Cards
  if (data.aboutCards && data.aboutCards.length > 0) {
    const aboutCardsContainer = document.getElementById('about-cards-container');
    const iconMap = {
      'Languages': '🌐',
      'Education': '🎓',
      'Projects': '💼',
      'Experience': '⚡'
    };
    
    aboutCardsContainer.innerHTML = data.aboutCards.map(card => `
      <div class="glass-card" style="padding: 30px;">
        <div style="font-size: 2.5rem; margin-bottom: 15px;">${iconMap[card.title] || '✨'}</div>
        <h3 style="font-size: 1.3rem; font-weight: 700; color: #1a1a1a; margin-bottom: 10px;">${card.title}</h3>
        <p style="color: #6b7280; line-height: 1.6;">${card.description}</p>
      </div>
    `).join('');
  }

  // --- Experience Timeline ---
  if (data.experience && data.experience.length > 0) {
      console.log('Populating experience:', data.experience); // Added log
      const expContainer = document.getElementById('experience-container');
      
      // Icons for Work and Education
      const iconMap = {
        'Work': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
        'Education': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c0 1.7 3.1 3 7 3s7-1.3 7-3v-5"></path></svg>`,
        'default': `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
      };
      
      expContainer.innerHTML = data.experience.map(item => `
          <div class="timeline-item">
              <div class="timeline-icon">${iconMap[item.type] || iconMap['default']}</div>
              <div class="timeline-content glass-card">
                  <span class="timeline-date">${item.date}</span>
                  <h3 style="font-size: 1.3rem; font-weight: 700; color: #1a1a1a; margin-bottom: 5px;">${item.title}</h3>
                  <h4 style="font-size: 1rem; font-weight: 600; color: #667eea; margin-bottom: 15px;">${item.company}</h4>
                  <p style="color: #6b7280; line-height: 1.6;">${item.description}</p>
              </div>
          </div>
      `).join('');
  } else {
      console.log('No experience data found to populate.'); // Added log
  }
  // --- End of Experience Timeline ---

  // Services
  if (data.services && data.services.length > 0) {
    const servicesContainer = document.getElementById('services-container');
    servicesContainer.innerHTML = data.services.map(service => `
      <div class="glass-card tilt-card" style="padding: 40px; text-align: center;">
        <img src="${service.photo || 'https://placehold.co/100x100/667eea/ffffff?text=Icon'}" 
             alt="${service.name}" 
             style="width: 80px; height: 80px; object-fit: contain; margin: 0 auto 20px; border-radius: 50%; background: rgba(102, 126, 234, 0.1); padding: 15px;"
             onerror="this.src='https://placehold.co/100x100/667eea/ffffff?text=Icon'">
        <h3 style="font-size: 1.3rem; font-weight: 700; color: #1a1a1a; margin-bottom: 12px;">${service.name}</h3>
        <p style="color: #6b7280; line-height: 1.6;">${service.description || ''}</p>
      </div>
    `).join('');
  }

  // Projects
  if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
      const projectsContainer = document.getElementById('projects-container');

      projectsContainer.innerHTML = data.projects.map(project => {
      const name = project.name || "Untitled Project";
      const description = project.description ? project.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
      const thumbnail = project.thumbnail || 'https://placehold.co/600x400/667eea/ffffff?text=Project';

      // Button conditions
      const buttons = [];

      if (project.link && project.link.trim() && project.link !== '#') {
        buttons.push(`
          <a href="${project.link}" target="_blank" class="btn project-btn">🔗 Project</a>
        `);
      }

      if (project.videoLink && project.videoLink.trim() && project.videoLink !== '#') {
        buttons.push(`
          <a href="${project.videoLink}" target="_blank" class="btn video-btn">🎥 Video</a>
        `);
      }

      if (project.instructions && project.instructions.trim() && project.instructions !== '#') {
        buttons.push(`
          <a href="${project.instructions}" target="_blank" class="btn guide-btn">📋 Guide</a>
        `);
      }

      // Dynamic grid columns (1, 2, or 3)
      const colCount = buttons.length || 1;
      const gridStyle = `
        display: grid;
        grid-template-columns: repeat(${colCount}, 1fr);
        gap: 10px;
        margin-top: 20px;
      `;

      // Final Card Layout
      return `
        <div class="project-card" 
             style="background:rgba(255,255,255,0.6); backdrop-filter:blur(15px);
                    border-radius:20px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.1);
                    transition:transform 0.4s ease, box-shadow 0.4s ease; margin-bottom:40px;"
             onmouseover="this.style.transform='translateY(-6px)'; this.style.boxShadow='0 15px 35px rgba(0,0,0,0.15)';"
             onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 10px 30px rgba(0,0,0,0.1)';">
          
          <div style="overflow:hidden;">
            <img src="${thumbnail}" alt="${name}"
                 style="width:100%; height:auto; display:block; transition:transform 0.5s ease;"
                 onmouseover="this.style.transform='scale(1.05)';"
                 onmouseout="this.style.transform='scale(1)';"
                 onerror="this.src='https://placehold.co/600x400/667eea/ffffff?text=Project';">
          </div>

          <div style="padding:30px;">
            <h3 style="font-size:1.5rem; font-weight:700; color:#1a1a1a; margin-bottom:12px;">${name}</h3>
            <p style="color:#6b7280; margin-bottom:20px; line-height:1.6;">${description}</p>

            ${project.tech && project.tech.length > 0 ? `
              <div style="margin-bottom:20px; display:flex; flex-wrap:wrap; gap:8px;">
                ${project.tech.map(tech => `<span style="background:rgba(102,126,234,0.1); color:#667eea; padding:6px 10px; border-radius:6px; font-size:13px; font-weight:500;">${tech}</span>`).join('')}
              </div>
            ` : ''}

            <div style="${gridStyle}">
              ${buttons.join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }


  // Contact Info
  if (data.config) {
    document.getElementById('contact-email').textContent = data.config.Email || 'fardinwork26@gmail.com';
    document.getElementById('contact-location').textContent = data.config.Location || 'Location';
    
    if (data.config['Linkedin Link']) {
      document.getElementById('contact-linkedin').href = data.config['Linkedin Link'];
      document.getElementById('footer-linkedin').href = data.config['Linkedin Link'];
    }
    
    if (data.config['GitHub Link']) {
      document.getElementById('contact-github').href = data.config['GitHub Link'];
      document.getElementById('footer-github').href = data.config['GitHub Link'];
    }
  }

  // Hide loader
  setTimeout(() => {
    const loader = document.getElementById('loader-overlay');
    loader.style.opacity = '0';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }, 1000); // Keep a delay for data to populate

  // Trigger 3D tilt effect
  init3DTilt();
}

// Populate Orbital Icons
function populateOrbitalIcons(icons) {
  const container = document.getElementById('orbital-icons-container');
  if (!container || !icons) return;
  
  container.innerHTML = '';
  
  const baseRadius = 130;
  const radiusStep = 30;
  const baseDuration = 15;
  const durationStep = 3;
  
  icons.forEach((icon, i) => {
    const path = document.createElement('div');
    path.className = 'orbit-path';
    
    const currentRadius = baseRadius + (i * radiusStep);
    const duration = baseDuration + (i * durationStep);
    
    path.style.width = (currentRadius * 2) + 'px';
    path.style.height = (currentRadius * 2) + 'px';
    path.style.animationDuration = duration + 's';
    
    if (i % 2 === 1) {
      path.style.animationDirection = 'reverse';
    }

    const iconEl = document.createElement('img');
    iconEl.src = icon.image;
    iconEl.alt = icon.skill;
    iconEl.className = 'orbit-icon';
    iconEl.style.animationDuration = duration + 's';
    iconEl.style.marginTop = '-' + currentRadius + 'px';
    
    path.style.transform = 'rotate(' + (i * (360 / icons.length)) + 'deg)';
    
    path.appendChild(iconEl);
    container.appendChild(path);
  });
}

// Navigation with smooth scroll and active state
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  // Click handlers
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection && lenis) {
        lenis.scrollTo(targetSection, { offset: 0 });
      }

      // Update active state
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });

  // Mobile nav links (they also need to scroll)
   const mobileNavLinks = document.querySelectorAll('.nav-link-mobile');
   mobileNavLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      
      if (targetSection && lenis) {
        lenis.scrollTo(targetSection, { offset: 0 });
      }
      
      // Close mobile menu on click
      const mobileMenu = document.getElementById('mobile-menu');
      if (mobileMenu && mobileMenu.style.display === 'block') {
          mobileMenu.style.display = 'none';
      }
    });
   });


  // Scroll spy
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.getAttribute('id');
        
        // Update desktop nav
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });

        // Update mobile nav
        mobileNavLinks.forEach(link => {
            // A simple way to highlight, you can add a class
            link.style.fontWeight = '500'; 
            link.style.color = '#1a1a1a';
            if (link.getAttribute('href') === `#${id}`) {
                link.style.fontWeight = '700';
                link.style.color = '#667eea';
            }
        });
      }
    });
  }, { threshold: 0.3, rootMargin: "-100px 0px -100px 0px" }); // Adjust threshold and rootMargin

  sections.forEach(section => observer.observe(section));
}

// Scroll animations
function initScrollAnimations() {
  const revealElements = document.querySelectorAll('.reveal');
  let counterAnimated = false;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');

        // Animate counters
        if (!counterAnimated && entry.target.querySelector('.counter')) {
          animateCounters();
          counterAnimated = true;
        }
      }
    });
  }, { threshold: 0.2 });

  revealElements.forEach(el => observer.observe(el));
}

// Counter animation
function animateCounters() {
  const counters = document.querySelectorAll('.counter');
  counters.forEach(counter => {
    const target = parseInt(counter.getAttribute('data-target'));
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;

    const updateCounter = () => {
      current += increment;
      if (current < target) {
        counter.textContent = Math.floor(current);
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target + '+';
      }
    };
    updateCounter();
  });
}

// 3D Tilt effect on cards
function init3DTilt() {
  const tiltCards = document.querySelectorAll('.tilt-card');
  tiltCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = (y - centerY) / 10;
      const rotateY = (centerX - x) / 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    });
  });
}

// Contact form with Web3Forms integration
function initContactForm() {
  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = document.getElementById('btn-text');
  const btnLoader = document.getElementById('btn-loader');
  const statusMessage = document.getElementById('status-message');
  const formWrapper = document.getElementById('form-wrapper');
  const successState = document.getElementById('success-state');
  const resetBtn = document.getElementById('reset-btn');
  
  if (!form) {
    console.error('Contact form not found!');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(form);
    
    // Show loading state
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';
    submitBtn.disabled = true;
    statusMessage.style.display = 'none';
    
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Hide form, show success state
        formWrapper.style.display = 'none';
        successState.style.display = 'block';
        
        // Reset form
        form.reset();
      } else {
        // Show error message
        statusMessage.textContent = 'Error: ' + (data.message || 'Something went wrong');
        statusMessage.style.color = '#ef4444';
        statusMessage.style.display = 'block';
      }
    } catch (error) {
      console.error('Form submission error:', error);
      statusMessage.textContent = 'Network error. Please try again.';
      statusMessage.style.color = '#ef4444';
      statusMessage.style.display = 'block';
    } finally {
      // Reset button state
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
      submitBtn.disabled = false;
    }
  });

  // Reset button to show form again
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      successState.style.display = 'none';
      formWrapper.style.display = 'block';
      statusMessage.style.display = 'none';
    });
  }

  console.log('✅ Contact form initialized successfully');
}


// Mobile menu
function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');

  if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
      if (mobileMenu.style.display === 'none' || mobileMenu.style.display === '') {
        mobileMenu.style.display = 'block';
      } else {
        mobileMenu.style.display = 'none';
      }
    });
  }
  // Click-away to close mobile menu is handled in initNavigation()
}

// Error handler
function showError(error) {
  console.error('Error loading data:', error);
  const loader = document.getElementById('loader-overlay');
  const loaderContainer = document.querySelector('.new-loader-container'); // Target new loader container
  const loaderText = document.querySelector('.loader-text-title'); // Target new text
  
  let errorMessage = error.message || 'An error occurred loading data.';
  
  if (errorMessage.includes('permissions')) {
    errorMessage = '<b>Action Required:</b> Please grant permissions in Apps Script Editor.';
  } else if (errorMessage.includes('Sheet named')) {
    errorMessage = '<b>Error:</b> ' + errorMessage + '<br>Please check your Google Sheet structure.';
  } else if (errorMessage.includes('HTTP error')) {
    errorMessage = `<b>Error:</b> Could not load sheet data.<br>Please ensure your sheet is published to the web (see README.md).<br><small>${error.message}</small>`;
  }
  
  // Display error message
  if (loaderContainer) {
      loaderContainer.style.display = 'none'; // Hide the animation
  }
  if (loaderText) {
      loaderText.innerHTML = errorMessage;
      loaderText.style.color = '#ef4444';
      loaderText.style.fontSize = '1rem';
      loaderText.style.maxWidth = '400px';
      loaderText.style.textAlign = 'center';
      loaderText.style.lineHeight = '1.5';
      loaderText.style.fontWeight = '500';
      loaderText.style.marginTop = '0'; // Reset margin
  }
}

// Handle responsive behavior
function handleResponsive() {
  const desktopNav = document.getElementById('desktop-nav');
  const mobileNav = document.querySelector('.mobile-nav');
  
  if (window.innerWidth <= 768) {
    if (desktopNav) desktopNav.style.display = 'none';
    if (mobileNav) mobileNav.style.display = 'block';
  } else {
    if (desktopNav) desktopNav.style.display = 'flex';
    if (mobileNav) mobileNav.style.display = 'none';
  }
}

window.addEventListener('resize', handleResponsive);
handleResponsive();

