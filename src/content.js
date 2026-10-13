// All brochure copy, transcribed from the supplied Canva layout (Image 1).
// Nothing here is invented. Spelling corrections to the source are marked  // FIX  (see README).

export const CONTENT = {
  who: {
    title: 'WHO WE ARE?',
    // FIX: source reads "Univeristy", "Builed", "Competetive"
    body: 'ICPC OUST Community is The Official Programming Community At Obour University For Science And Technology, Dedicated To Build Skilled, Competitive And Problem-Solving Students',
    pillars: ['Learn Together', 'Compete Together', 'Grow Together'],
  },
  what: {
    title: 'WHAT WE DO?',
    items: [
      'Organize training sessions & workshops',
      'Prepare and support teams for ICPC & related competitions',
      'Build a strong community of passionate learners',
      'Connect you with opportunities and mentors',
    ],
    sign: ['Better Students', 'Stronger Teams', 'Bigger Dreams'],
  },
  icpc: {
    title: 'WHAT IS ICPC?',
    lead: 'The International Collegiate Programming Contest (ICPC)',
    rest: ' is a global competition that challenges university students to solve algorithmic problems, build teamwork and think under pressure.',
    journeyTitle: 'THE JOURNEY',
    // NOTE: first row's sub-title is reproduced exactly as it appears in the source layout.
    journey: [
      { t: 'Local Contest', s: '(International Collegiate Programming Contest)', d: 'Local & regional rounds. Your first step!', c: '#f4b73a' },
      { t: 'ECPC', s: '(Egyptian Collegiate Programming Contest)', d: 'Top teams qualify from Egypt.', c: '#9aa3b2' },
      { t: 'ECPC Final', s: 'The national final. Only the best.', d: 'Top teams move forward.', c: '#4a9bff' },
      { t: 'ACPC', s: '(African & Arab Collegiate Programming Contest)', d: 'Represent Egypt in Africa & the Arab world.', c: '#f4b73a' },
      { t: 'ICPC', s: '(International Collegiate Programming Contest)', d: 'The global stage. The ultimate goal.', c: '#4a9bff' },
    ],
    getTitle: 'WHAT YOU GET AT EACH STAGE?',
    get: ['Certificates & recognition', 'Training opportunities', 'Networking & mentorship', 'Access to exclusive courses (at higher stages)'],
  },
  vision: {
    title: ['OUR VISION', 'THIS SEASON'],
    tag: 'Bigger. Stronger. Together.',
    body: "We're aiming for more, and we're not just hoping — we're preparing.",
    stats: [{ n: '30', l: 'Teams', i: 'people' }, { n: '4', l: 'Finalists', i: 'trophy' }],
    items: [
      { i: 'trophy', t: 'Two Local Contests', s: 'in the season (to simulate the real competition).' },
      { i: 'monitor', t: 'Full training & preparation', s: '(more than last year).' },
      { i: 'rocket', t: 'Ongoing support and mentorship', s: 'throughout the season.' },
    ],
    sign: ["This time", "you're not alone", "— we're with you!"],
  },
  did: {
    title: 'WHAT WE DID',
    season: 'Last Season',
    body: 'We had 10 teams, and one of our teams reached the ECPC Finals! We faced tough problems, learned a lot, and made our university proud.',
    badge: ['ECPC', 'Finalists'],
    teamsTitle: 'OUR TEAMS',
    stats: [{ n: '10', l: ['Teams', 'in total'] }, { n: '1', l: ['Team', 'reached the Final'] }],
    sign: ["We didn't just compete...", 'We made it count.'],
  },
  cover: { sign: ['Same Dream', 'Bigger Together'] },
  sponsor: 'Sponsored by Obour University for Science & Technology (OUST)',
};

// Accessible descriptions (alt text) for each panel — used by the simple view.
export const PANEL_ALT = [
  'Brochure cover: the ICPC OUST Community logo, a stone tablet with a code symbol, and the line "Same Dream, Bigger Together".',
  'Who We Are: ICPC OUST Community is the official programming community at Obour University for Science and Technology. Learn Together, Compete Together, Grow Together. A photo of the community seated on a lawn. What We Do: organize training sessions and workshops; prepare and support teams for ICPC and related competitions; build a strong community of passionate learners; connect you with opportunities and mentors. Better Students, Stronger Teams, Bigger Dreams.',
  'What Is ICPC? The International Collegiate Programming Contest is a global competition that challenges university students to solve algorithmic problems, build teamwork and think under pressure. The Journey: Local Contest, ECPC, ECPC Final, ACPC, ICPC. What you get at each stage: certificates and recognition, training opportunities, networking and mentorship, access to exclusive courses at higher stages.',
  'OUST branding panel: the ICPC OUST Community logo above the Obour University for Science and Technology sponsor lockup.',
  'Our Vision This Season: Bigger. Stronger. Together. 30 teams, 4 finalists. Two local contests in the season to simulate the real competition; full training and preparation, more than last year; ongoing support and mentorship throughout the season. This time you are not alone, we are with you.',
  'What We Did, last season: 10 teams, and one team reached the ECPC Finals. Photo of four students holding the OUST flag, and a group photo of the ICPC OUST community. Our Teams: 10 teams in total, 1 team reached the Final. We didn\'t just compete, we made it count.',
];
