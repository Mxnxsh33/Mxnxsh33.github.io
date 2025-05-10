document.addEventListener('DOMContentLoaded', function () {
  // Mobile menu toggle
  const menuToggle = document.getElementById('menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (menuToggle && mobileMenu) {
    menuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  // Carousel
  const carouselItems = document.querySelectorAll('.carousel-item');
  let currentItem = 0;
  function showNextItem() {
    carouselItems[currentItem].classList.remove('active');
    currentItem = (currentItem + 1) % carouselItems.length;
    carouselItems[currentItem].classList.add('active');
  }
  if (carouselItems.length > 0) {
    carouselItems[currentItem].classList.add('active');
    setInterval(showNextItem, 5000);
  }

  // Chatbot functionality
  const chatbotToggle = document.getElementById('chatbot-toggle');
  const chatbotContainer = document.getElementById('chatbot-container');
  const sendBtn = document.getElementById('sendBtn');
  const clearBtn = document.getElementById('clearBtn');
  const voiceBtn = document.getElementById('voiceBtn');
  const userInput = document.getElementById('userInput');
  const chatOutput = document.getElementById('chatOutput');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const toggleHistoryBtn = document.getElementById('toggleHistoryBtn');
  const responseHistory = document.getElementById('responseHistory');
  const darkModeToggle = document.getElementById('darkModeToggle');
  const predictionsDiv = document.getElementById('predictions');
  const feedbackYes = document.getElementById('feedbackYes');
  const feedbackNo = document.getElementById('feedbackNo');

  // Verify chatbot elements exist
  if (!chatbotToggle || !chatbotContainer) {
    console.error('Chatbot toggle or container not found');
    return;
  }

  let history = [];
  let conversationContext = { lastIntent: null, history: [] };
  let dynamicPredictions = {};

  // Chatbot toggle event
  chatbotToggle.addEventListener('click', () => {
    chatbotContainer.classList.toggle('hidden');
  });

  // Dark mode toggle
  if (darkModeToggle) {
    darkModeToggle.addEventListener('change', function () {
      const isDark = this.checked;
      document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
      localStorage.setItem('darkMode', isDark);
      // Force re-render of chatbot to ensure styles update
      if (chatbotContainer) {
        chatbotContainer.style.display = 'none';
        setTimeout(() => {
          chatbotContainer.style.display = chatbotContainer.classList.contains('hidden') ? 'none' : 'block';
        }, 0);
      }
    });

    // Initialize dark mode from localStorage
    if (localStorage.getItem('darkMode') === 'true') {
      darkModeToggle.checked = true;
      document.body.setAttribute('data-theme', 'dark');
    }
  }

  // Knowledge base
  const knowledgeBase = {
    greetings: ["Hello! How can I assist you with SEACET today?", "Hi! Ask me about S.E.A College of Engineering and Technology."],
    farewells: ["Goodbye! Visit SEACET at https://seacet.edu.in!", "See you later!"],
    about: `S.E.A College of Engineering and Technology (SEACET) was established by Founder Chairman Sri. A. Krishnappa in 2007.`,
    courses: {
      undergraduate: [
        "Computer Science and Engineering (120 seats)",
        "Information Science and Engineering (60 seats)",
        "Electronics and Communication Engineering (60 seats)",
        "Mechanical Engineering (30 seats)",
        "Civil Engineering (30 seats)",
        "Artificial Intelligence and Machine Learning (60 seats)",
        "CSE (IoT and Cyber Security including Blockchain Technology) (60 seats)",
        "Agricultural Engineering (30 seats)",
        "Artificial Intelligence and Data Science (60 seats)"
      ],
      postgraduate: [
        "M.Tech in VLSI Design and Embedded Systems (18 seats)",
        "M.Tech in Computer Science and Engineering (9 seats)",
        "Master of Business Administration (MBA) (60 seats)"
      ],
      research: [
        "Computer Science and Engineering",
        "Mechanical Engineering",
        "Electronics and Communication Engineering",
        "MBA",
        "Chemistry"
      ]
    },
    placements: {
      overview: `SEACET's placement process is transparent and fair, facilitating recruitment drives for students.`,
      companies: ["IBM", "Samsung", "Apple", "Wipro", "Infosys"]
    },
    facilities: {
      hostel: `SEACET offers one girls' hostel and two boys' hostels, accommodating 530 males and 400 females.`,
      library: `SEACET's library spans 5000 sqm with 23,562 books and 5,166 titles.`
    }
  };

  // Intents
  const intents = [
    {
      name: 'greeting',
      keywords: ['hello', 'hi', 'hey'],
      patterns: [/^hi\b/, /^hello\b/, /^hey\b/],
      response: () => formatResponse('greeting', { user: 'friend' })
    },
    {
      name: 'farewell',
      keywords: ['bye', 'goodbye', 'see you'],
      patterns: [/bye$/, /goodbye$/, /see you$/],
      response: () => formatResponse('farewell', {})
    },
    {
      name: 'about_seacet',
      keywords: ['about', 'college', 'seacet'],
      patterns: [/about.*seacet/, /tell.*about.*college/],
      response: () => knowledgeBase.about
    },
    {
      name: 'courses',
      keywords: ['courses', 'programs', 'degrees'],
      patterns: [/what.*courses/, /list.*programs/, /degrees.*offered/],
      response: () => {
        const ug = knowledgeBase.courses.undergraduate;
        const pg = knowledgeBase.courses.postgraduate;
        const research = knowledgeBase.courses.research;
        const courses = `Undergraduate: ${ug.join(', ')}; Postgraduate: ${pg.join(', ')}; Research: ${research.join(', ')}`;
        return formatResponse('courses', { courses });
      }
    },
    {
      name: 'placements',
      keywords: ['placement', 'jobs', 'recruitment'],
      patterns: [/placement.*details/, /what.*jobs/, /recruitment.*process/],
      response: () => {
        const { overview, companies } = knowledgeBase.placements;
        return `${overview}<br>Top Companies: ${companies.join(', ')}`;
      }
    },
    {
      name: 'facilities',
      keywords: ['facilities', 'infrastructure', 'amenities'],
      patterns: [/what.*facilities/, /tell.*infrastructure/],
      response: () => {
        return `Hostel: ${knowledgeBase.facilities.hostel}<br>Library: ${knowledgeBase.facilities.library}`;
      }
    },
    {
      name: 'default',
      keywords: [],
      patterns: [],
      response: () => "I'm not sure about that. Try asking about SEACET's courses, facilities, placements, or admissions!"
    }
  ];

  // Response templates
  const responseTemplates = {
    greeting: [
      'Hello, {user}! How can I help you with SEACET today?',
      'Hi there! Excited to chat about S.E.A College!'
    ],
    farewell: [
      'Goodbye! Hope to chat again soon!',
      'See you later! Check out https://seacet.edu.in for more info.'
    ],
    courses: [
      'Here are the courses offered at SEACET: {courses}',
      'SEACET provides a wide range of programs: {courses}'
    ]
  };

  // N-gram model
  const nGramModel = {
    'what are': { 'you': 0.4, 'the': 0.3, 'courses': 0.2, 'facilities': 0.1 },
    'tell me': { 'about': 0.7, 'more': 0.2, 'how': 0.1 },
    'about seacet': { 'courses': 0.5, 'placements': 0.3, 'facilities': 0.2 },
    'courses offered': { 'at': 0.6, 'in': 0.3, 'by': 0.1 },
    'placements at': { 'seacet': 0.5, 'college': 0.3, 'details': 0.2 },
    'how to': { 'apply': 0.4, 'register': 0.3, 'join': 0.2, 'enroll': 0.1 },
    'i want': { 'to': 0.6, 'information': 0.3, 'details': 0.1 }
  };

  const commonNGrams = {
    'the': { 'quick': 0.3, 'brown': 0.2, 'courses': 0.2, 'placements': 0.2, 'facilities': 0.1 },
    'and': { 'the': 0.4, 'other': 0.3, 'more': 0.2, 'also': 0.1 }
  };

  const commonWords = {
    'the': 0.2,
    'and': 0.15,
    'that': 0.1,
    'for': 0.1,
    'to': 0.15,
    'in': 0.1,
    'it': 0.1,
    'is': 0.1,
    'courses': 0.05,
    'placements': 0.05,
    'facilities': 0.05
  };

  // Spell correction dictionary
  const dictionary = {
    'cours': 'courses',
    'placment': 'placement',
    'facilites': 'facilities',
    'colledge': 'college',
    'seacett': 'seacet'
  };

  // Utility functions
  function sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function addMessage(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'bot'}`;
    messageDiv.innerHTML = text;
    chatOutput.appendChild(messageDiv);
    chatOutput.scrollTop = chatOutput.scrollHeight;
  }

  function typeWriter(text, callback) {
    let i = 0;
    const speed = 30;
    addMessage('');
    const lastMessage = chatOutput.lastChild;

    function type() {
      if (i < text.length) {
        lastMessage.innerHTML += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        callback();
      }
    }
    type();
  }

  function addToHistory(query, response) {
    history.push({ query, response });
    updateHistoryDisplay();
  }

  function updateHistoryDisplay() {
    responseHistory.innerHTML = '';
    history.forEach((entry, index) => {
      const div = document.createElement('div');
      div.className = 'history-entry';
      div.innerHTML = `<h4>Query ${index + 1}: ${sanitizeHTML(entry.query)}</h4><p>${entry.response}</p>`;
      responseHistory.appendChild(div);
    });
  }

  function getRandom(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function formatResponse(template, data) {
    let response = getRandom(responseTemplates[template] || ['{content}']);
    for (const [key, value] of Object.entries(data)) {
      response = response.replace(`{${key}}`, value);
    }
    return response;
  }

  function correctSpelling(input) {
    return input
      .split(/\s+/)
      .map(word => dictionary[word.toLowerCase()] || word)
      .join(' ');
  }

  function detectIntent(input) {
    input = input.toLowerCase();
    for (const intent of intents) {
      if (
        intent.keywords.some(keyword => input.includes(keyword)) ||
        intent.patterns.some(pattern => pattern.test(input))
      ) {
        return intent;
      }
    }
    return intents.find(intent => intent.name === 'default');
  }

  function updateContext(intent, query, response) {
    conversationContext.lastIntent = intent.name;
    conversationContext.history.push({ query, response, intent: intent.name });
    if (conversationContext.history.length > 5) {
      conversationContext.history.shift();
    }
  }

  function detectSentiment(input) {
    const positiveWords = ['great', 'awesome', 'happy', 'good'];
    const negativeWords = ['bad', 'terrible', 'sad', 'problem'];
    input = input.toLowerCase();

    if (positiveWords.some(word => input.includes(word))) {
      return 'positive';
    } else if (negativeWords.some(word => input.includes(word))) {
      return 'negative';
    }
    return 'neutral';
  }

  function updateDynamicPredictions(input) {
    const words = input.toLowerCase().split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
      const currentWord = words[i];
      const nextWord = words[i + 1];
      if (!dynamicPredictions[currentWord]) {
        dynamicPredictions[currentWord] = {};
      }
      dynamicPredictions[currentWord][nextWord] = (dynamicPredictions[currentWord][nextWord] || 0) + 0.01;
      const total = Object.values(dynamicPredictions[currentWord]).reduce((sum, prob) => sum + prob, 0);
      for (const word in dynamicPredictions[currentWord]) {
        dynamicPredictions[currentWord][word] /= total;
      }
    }
  }

  function getNGramPredictions(text) {
    const words = text.trim().toLowerCase().split(/\s+/);
    const lastTwoWords = words.slice(-2).join(' ');
    const lastWord = words[words.length - 1] || '';

    let predictions = [];

    if (nGramModel[lastTwoWords]) {
      predictions = Object.entries(nGramModel[lastTwoWords]);
    } else if (dynamicPredictions[lastWord]) {
      predictions = Object.entries(dynamicPredictions[lastWord]);
    } else if (text.length > 0) {
      predictions = Object.entries(commonNGrams[lastWord] || commonWords);
    }

    return predictions
      .map(([word, prob]) => ({ word, prob }))
      .sort((a, b) => b.prob - a.prob)
      .slice(0, 8);
  }

  function getContextualPredictions(text) {
    let predictions = getNGramPredictions(text);
    const lastIntent = conversationContext.lastIntent;

    if (lastIntent === 'courses') {
      const courseTerms = {
        'undergraduate': 0.3,
        'postgraduate': 0.3,
        'computer': 0.2,
        'engineering': 0.2
      };
      predictions = predictions.concat(
        Object.entries(courseTerms).map(([word, prob]) => ({ word, prob }))
      );
    } else if (lastIntent === 'placements') {
      const placementTerms = {
        'companies': 0.3,
        'registration': 0.3,
        'eligibility': 0.2,
        'training': 0.2
      };
      predictions = predictions.concat(
        Object.entries(placementTerms).map(([word, prob]) => ({ word, prob }))
      );
    } else if (lastIntent === 'facilities') {
      const facilityTerms = {
        'hostel': 0.3,
        'library': 0.3,
        'sports': 0.2,
        'canteen': 0.2
      };
      predictions = predictions.concat(
        Object.entries(facilityTerms).map(([word, prob]) => ({ word, prob }))
      );
    }

    return predictions
      .sort((a, b) => b.prob - a.prob)
      .filter((item, index, arr) => arr.findIndex(i => i.word === item.word) === index)
      .slice(0, 8);
  }

  function updatePredictions() {
    const text = userInput.value;
    predictionsDiv.innerHTML = '';

    const predictions = getContextualPredictions(text);

    predictions.forEach(({ word, prob }) => {
      const button = document.createElement('button');
      button.className = 'prediction-btn';
      button.textContent = word;

      const probBadge = document.createElement('span');
      probBadge.className = 'probability';
      probBadge.textContent = Math.round(prob * 100);
      button.appendChild(probBadge);

      button.addEventListener('click', () => {
        if (text.length === 0 || userInput.value.endsWith(' ')) {
          userInput.value += word + ' ';
        } else {
          userInput.value += ' ' + word + ' ';
        }
        userInput.focus();
        updatePredictions();
      });
      predictionsDiv.appendChild(button);
    });
  }

  async function handleUserInput() {
    let input = sanitizeHTML(userInput.value.trim().toLowerCase());
    input = correctSpelling(input);
    if (!input) {
      addMessage('Please enter a question.');
      return;
    }

    updateDynamicPredictions(input);
    addMessage(input, true);
    userInput.value = '';
    predictionsDiv.innerHTML = '';
    loadingIndicator.style.display = 'flex';

    setTimeout(() => {
      const intent = detectIntent(input);
      let response = intent.response();
      const sentiment = detectSentiment(input);

      if (input.includes('more') && conversationContext.lastIntent) {
        if (conversationContext.lastIntent === 'courses') {
          response = 'Additional course details: SEACET also offers specialized workshops and certifications in emerging fields like AI and IoT.';
        } else if (conversationContext.lastIntent === 'placements') {
          response = 'More on placements: SEACET organizes career fairs and mock interviews to prepare students.';
        } else if (conversationContext.lastIntent === 'facilities') {
          response = 'More on facilities: SEACET’s campus includes advanced labs and a data center for cutting-edge research.';
        }
      }

      if (sentiment === 'positive') {
        response = `I'm glad you're excited! ${response}`;
      } else if (sentiment === 'negative') {
        response = `I'm here to help! ${response}`;
      }

      loadingIndicator.style.display = 'none';
      typeWriter(response, () => {
        updateContext(intent, input, response);
        addToHistory(input, response);
        document.getElementById('feedbackSection').style.display = 'block';
      });
    }, 800);
  }

  // Event listeners
  if (sendBtn) sendBtn.addEventListener('click', handleUserInput);
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      userInput.value = '';
      predictionsDiv.innerHTML = '';
      chatOutput.innerHTML = '<div class="message bot">Welcome to SEACET Chatbot! Ask me about courses, admissions, facilities, placements, or anything else about S.E.A College of Engineering and Technology.</div>';
      document.getElementById('feedbackSection').style.display = 'none';
    });
  }
  if (voiceBtn) voiceBtn.addEventListener('click', startVoiceRecognition);
  if (userInput) {
    userInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleUserInput();
      }
    });
    userInput.addEventListener('input', updatePredictions);
  }
  if (toggleHistoryBtn) {
    toggleHistoryBtn.addEventListener('click', () => {
      const isHidden = responseHistory.style.display === 'none';
      responseHistory.style.display = isHidden ? 'block' : 'none';
      toggleHistoryBtn.textContent = isHidden ? 'Hide History' : 'Show History';
    });
  }
  if (feedbackYes) {
    feedbackYes.addEventListener('click', () => {
      console.log('Feedback: Positive');
      document.getElementById('feedbackSection').style.display = 'none';
    });
  }
  if (feedbackNo) {
    feedbackNo.addEventListener('click', () => {
      console.log('Feedback: Negative');
      userInput.value = 'Please tell me how I can improve.';
      document.getElementById('feedbackSection').style.display = 'none';
    });
  }

  function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      voiceBtn.style.backgroundColor = 'var(--accent-color)';
    };

    recognition.onresult = (event) => {
      userInput.value = event.results[0][0].transcript;
      handleUserInput();
    };

    recognition.onend = () => {
      voiceBtn.style.backgroundColor = 'var(--primary-color)';
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      alert('Speech recognition error: ' + event.error);
    };

    recognition.start();
  }
});