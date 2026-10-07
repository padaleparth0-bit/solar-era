import { 
  IndianStateSolarData, 
  CertifiedSolarInstaller, 
  SolarMyth, 
  SolarQuizQuestion, 
  GovernmentScheme,
  SolarCalculationInput,
  SolarCalculationResult
} from '../types';

export const INDIAN_STATES_SOLAR: IndianStateSolarData[] = [
  {
    code: 'DL',
    name: 'Delhi (NCT)',
    capital: 'New Delhi',
    avgSunHoursPerDay: 5.4,
    avgTariffPerKwh: 6.8,
    discoms: ['BSES Rajdhani (BRPL)', 'BSES Yamuna (BYPL)', 'Tata Power DDL (TPDDL)', 'NDMC'],
    stateSubsidyPerKw: 2000,
    statePolicyHighlight: 'Delhi Solar Policy 2024: Generation-Based Incentive (GBI) of ₹3.00/kWh for 5 years on solar generation + zero electricity bill benefit!',
    netMeteringPolicy: '100% Sanctioned Load net metering allowed for residential consumers with automated single-window approval.',
    portalUrl: 'https://delhisolarportal.delhi.gov.in/'
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    capital: 'Mumbai',
    avgSunHoursPerDay: 5.5,
    avgTariffPerKwh: 8.5,
    discoms: ['MSEDCL (Mahavitaran)', 'Tata Power Mumbai', 'Adani Electricity Mumbai', 'BEST'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'Highest retail power tariffs in India makes ROI fastest (under 3.2 years). MSEDCL seamless digital net-metering portal.',
    netMeteringPolicy: 'Net metering up to 100% of sanctioned load, unutilized credits banked monthly and settled annually.',
    portalUrl: 'https://www.mahadiscom.in/solar-rooftop-portal/'
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    capital: 'Gandhinagar',
    avgSunHoursPerDay: 5.8,
    avgTariffPerKwh: 7.2,
    discoms: ['UGVCL', 'DGVCL', 'MGVCL', 'PGVCL', 'Torrent Power (Ahmedabad/Surat)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'Surya Gujarat Scheme: Over 5 Lakh homes solarized. Fastest DISCOM net-meter installation within 7 days of inspection.',
    netMeteringPolicy: 'Net metering with banking rate of ₹2.25/unit surplus purchase by DISCOM.',
    portalUrl: 'https://suryagujarat.guvnl.in/'
  },
  {
    code: 'KA',
    name: 'Karnataka',
    capital: 'Bengaluru',
    avgSunHoursPerDay: 5.3,
    avgTariffPerKwh: 7.8,
    discoms: ['BESCOM', 'MESCOM', 'HESCOM', 'GESCOM', 'CESC Mysuru'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'Karnataka Solar Policy: Online Soura Belaku & KREDL portal with automated net-meter syncing.',
    netMeteringPolicy: 'Net metering permitted up to sanctioned load; surplus exported to grid with quarterly credit adjustment.',
    portalUrl: 'https://kredl.karnataka.gov.in/'
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    capital: 'Chennai',
    avgSunHoursPerDay: 5.6,
    avgTariffPerKwh: 6.9,
    discoms: ['TANGEDCO'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'TANGEDCO LT Bi-directional solar grid connection with automated remote smart meter telemetry.',
    netMeteringPolicy: 'Net feed-in tariff and net metering scheme for residential consumers up to sanctioned load.',
    portalUrl: 'https://www.tnebltd.gov.in/'
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    capital: 'Lucknow',
    avgSunHoursPerDay: 5.2,
    avgTariffPerKwh: 7.4,
    discoms: ['PVVNL (Meerut)', 'DVVNL (Agra)', 'MVVNL (Lucknow)', 'PuVVNL (Varanasi)', 'NPCL (Noida)'],
    stateSubsidyPerKw: 15000, // UP state subsidy (up to ₹30,000 additional for residential)
    statePolicyHighlight: 'UP Solar Policy: Additional State Subsidy of ₹15,000/kW (max ₹30,000) over and above Central PM Surya Ghar subsidy!',
    netMeteringPolicy: 'Net metering enabled across all UPPCL Discoms with fast-track DISCOM processing.',
    portalUrl: 'https://upneda.org.in/'
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    capital: 'Jaipur',
    avgSunHoursPerDay: 6.1,
    avgTariffPerKwh: 7.5,
    discoms: ['JVVNL (Jaipur)', 'AVVNL (Ajmer)', 'JdVVNL (Jodhpur)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'Highest solar insolation in India (over 325 sunny days/year). Maximum annual kWh generation per installed kW (1,650 units/kW/yr).',
    netMeteringPolicy: 'Net metering allowed up to 100% of sanctioned contract demand.',
    portalUrl: 'https://energy.rajasthan.gov.in/rrecl/'
  },
  {
    code: 'TG',
    name: 'Telangana',
    capital: 'Hyderabad',
    avgSunHoursPerDay: 5.5,
    avgTariffPerKwh: 7.6,
    discoms: ['TSSPDCL (Southern)', 'TSNPDCL (Northern)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'Telangana Rooftop Solar single window system via TSREDCO and TSSPDCL with smart net meters.',
    netMeteringPolicy: 'Net metering with energy banking and annual settlement at average pooled power cost.',
    portalUrl: 'https://tsredco.telangana.gov.in/'
  },
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    capital: 'Amaravati',
    avgSunHoursPerDay: 5.6,
    avgTariffPerKwh: 7.1,
    discoms: ['APEPDCL (Eastern)', 'APCPDCL (Central)', 'APSPDCL (Southern)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'NREDCAP rooftop solar program with online feasibility check and DISCOM smart metering.',
    netMeteringPolicy: 'Net metering allowed with 100% load parity and digital energy banking.',
    portalUrl: 'https://nredcap.gov.in/'
  },
  {
    code: 'KL',
    name: 'Kerala',
    capital: 'Thiruvananthapuram',
    avgSunHoursPerDay: 4.8,
    avgTariffPerKwh: 7.3,
    discoms: ['KSEB (Kerala State Electricity Board)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'KSEB Soura Scheme with rooftop solar installation models (EPC model & consumer-owned model).',
    netMeteringPolicy: 'Gross and Net metering available with KSEB digital meter exchange.',
    portalUrl: 'https://soura.kseb.in/'
  },
  {
    code: 'WB',
    name: 'West Bengal',
    capital: 'Kolkata',
    avgSunHoursPerDay: 4.9,
    avgTariffPerKwh: 7.9,
    discoms: ['WBSEDCL', 'CESC (Kolkata & Howrah)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'CESC & WBSEDCL net metering available for 1kW onwards with seamless grid synchronization.',
    netMeteringPolicy: 'Net metering permitted for residential consumers with bi-directional smart meter.',
    portalUrl: 'https://www.wbsedcl.in/'
  },
  {
    code: 'HR',
    name: 'Haryana',
    capital: 'Chandigarh',
    avgSunHoursPerDay: 5.3,
    avgTariffPerKwh: 7.0,
    discoms: ['DHBVN (Dakshin Haryana)', 'UHBVN (Uttar Haryana)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'HAREDA Rooftop solar mandates and DISCOM grid-tied solar net metering facility.',
    netMeteringPolicy: 'Net metering up to 100% of sanctioned load for residential households.',
    portalUrl: 'https://hareda.gov.in/'
  },
  {
    code: 'PB',
    name: 'Punjab',
    capital: 'Chandigarh',
    avgSunHoursPerDay: 5.2,
    avgTariffPerKwh: 6.8,
    discoms: ['PSPCL (Punjab State Power Corp)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'PEDA (Punjab Energy Dev Agency) single window portal with PSPCL net metering.',
    netMeteringPolicy: 'Net metering permitted for residential roofs up to sanctioned connected load.',
    portalUrl: 'https://peda.gov.in/'
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    capital: 'Bhopal',
    avgSunHoursPerDay: 5.6,
    avgTariffPerKwh: 7.4,
    discoms: ['MPMKVVCL (Central)', 'MPPKVVCL (West - Indore)', 'MPPoorvKVVCL (East - Jabalpur)'],
    stateSubsidyPerKw: 0,
    statePolicyHighlight: 'MP Urja Vikas Nigam portal for rooftop solar with automated DISCOM feeder tracking.',
    netMeteringPolicy: 'Net metering with banking for residential rooftops up to sanctioned load.',
    portalUrl: 'https://mprenewable.nic.in/'
  }
];

export const CERTIFIED_INSTALLERS: CertifiedSolarInstaller[] = [
  {
    id: 'tata-power-solar',
    name: 'Tata Power Solar Systems Ltd.',
    brand: 'Tata Power Solar',
    badge: 'National EPC Leader',
    rating: 4.9,
    reviewsCount: 14200,
    completedInstallations: 85000,
    statesServed: ['DL', 'MH', 'GJ', 'KA', 'TN', 'UP', 'RJ', 'TG', 'AP', 'KL', 'WB', 'HR', 'PB', 'MP'],
    contactPhone: '1800 419 8777',
    email: 'rooftop@tatapower.com',
    locationCity: 'Mumbai & Pan-India',
    headquarters: 'Mumbai, Maharashtra',
    avgQuotePerKw: 58000,
    warrantyYears: 25,
    financePartner: 'Tata Capital / SBI Surya Ghar Loan (Zero down payment)',
    features: ['Tier-1 High Efficiency Cells', '25-Year Linear Power Warranty', 'Free 5-Year Comprehensive O&M', 'DISCOM Paperwork Handled End-to-End', 'Mobile App Remote Telemetry'],
    verified: true
  },
  {
    id: 'waaree-energies',
    name: 'Waaree Energies Ltd.',
    brand: 'Waaree Solar',
    badge: 'MNRE Empanelled',
    rating: 4.8,
    reviewsCount: 9800,
    completedInstallations: 62000,
    statesServed: ['MH', 'GJ', 'DL', 'RJ', 'UP', 'MP', 'KA', 'TN', 'TG'],
    contactPhone: '1800 2121 321',
    email: 'rooftop@waaree.com',
    locationCity: 'Surat / Mumbai',
    headquarters: 'Mumbai, Maharashtra',
    avgQuotePerKw: 54000,
    warrantyYears: 25,
    financePartner: 'SBI, HDFC, Canara Bank',
    features: ['India’s Largest Solar Module Manufacturer', 'Bifacial DCR (Domestic Content Requirement) Compliant', 'MNRE Direct Subsidy Guarantee', 'Hot-Dip Galvanized Structure'],
    verified: true
  },
  {
    id: 'adani-solar',
    name: 'Adani Solar (Mundra Solar PV)',
    brand: 'Adani Solar',
    badge: 'DISCOM Approved Tier-1',
    rating: 4.8,
    reviewsCount: 8400,
    completedInstallations: 48000,
    statesServed: ['GJ', 'RJ', 'MH', 'DL', 'UP', 'MP', 'KA', 'AP', 'TG'],
    contactPhone: '1800 120 1800',
    email: 'solar.sales@adani.com',
    locationCity: 'Ahmedabad',
    headquarters: 'Ahmedabad, Gujarat',
    avgQuotePerKw: 56000,
    warrantyYears: 25,
    financePartner: 'Adani Capital / Bank of Baroda',
    features: ['Shine Series High Wattage Panels', 'TopCon High Temperature Tolerance', 'Certified Lightning & Surge Arresters', 'DISCOM Feasibility Express Track'],
    verified: true
  },
  {
    id: 'loom-solar',
    name: 'Loom Solar Pvt. Ltd.',
    brand: 'Loom Solar',
    badge: 'Certified Surya Mitra Partner',
    rating: 4.7,
    reviewsCount: 11200,
    completedInstallations: 39000,
    statesServed: ['DL', 'UP', 'HR', 'PB', 'RJ', 'MH', 'MP', 'WB', 'BR'],
    contactPhone: '011 4118 3600',
    email: 'care@loomsolar.com',
    locationCity: 'Faridabad / Delhi NCR',
    headquarters: 'Faridabad, Haryana',
    avgQuotePerKw: 55000,
    warrantyYears: 25,
    financePartner: 'Bajaj Finserv / SBI / Rupeek',
    features: ['Shark Bi-Facial & Mono PERC Super Panels', 'Space-Saving High Density Arrays', 'Works in Low-Light / Smoggy Conditions', 'Doorstep 3D Shadow Site Survey'],
    verified: true
  },
  {
    id: 'solarsquare-energy',
    name: 'SolarSquare Energy Pvt Ltd',
    brand: 'SolarSquare',
    badge: 'DISCOM Approved Tier-1',
    rating: 4.9,
    reviewsCount: 6500,
    completedInstallations: 25000,
    statesServed: ['MH', 'GJ', 'KA', 'MP', 'TG', 'DL'],
    contactPhone: '022 6902 4444',
    email: 'support@solarsquare.in',
    locationCity: 'Bengaluru / Mumbai / Pune',
    headquarters: 'Mumbai, Maharashtra',
    avgQuotePerKw: 59000,
    warrantyYears: 25,
    financePartner: 'SBI Surya Ghar, Axis Bank Solar Loan',
    features: ['Wind-Resistant Elevated Rooftop Structures (150 km/h rated)', 'Zero-Roof-Leakage Guaranteed Anchoring', 'Automated Micro-Inverter Options', 'Free Lifetime AI Generation Diagnostics'],
    verified: true
  },
  {
    id: 'havells-solar',
    name: 'Havells Enviro Solar Ltd.',
    brand: 'Havells Solar',
    badge: 'MNRE Empanelled',
    rating: 4.8,
    reviewsCount: 5200,
    completedInstallations: 22000,
    statesServed: ['DL', 'UP', 'HR', 'PB', 'RJ', 'MH', 'GJ', 'KA', 'TN'],
    contactPhone: '080 4577 1313',
    email: 'solar@havells.com',
    locationCity: 'Noida / Pan-India',
    headquarters: 'Noida, Uttar Pradesh',
    avgQuotePerKw: 60000,
    warrantyYears: 25,
    financePartner: 'HDFC Bank / ICICI Bank',
    features: ['Havells Grid-Tied Inverter with Built-in DC Isolator', 'Dual Layer Anti-Reflective Coated Glass', 'IP65 Weatherproof Junction Boxes', 'Pan-India 24-hr Service Response'],
    verified: true
  }
];

export const SOLAR_MYTHS: SolarMyth[] = [
  {
    id: 'myth-1',
    myth: 'Solar panels do not work on cloudy, foggy, or rainy monsoon days.',
    fact: 'Solar panels generate 20% to 40% of their rated output even under overcast skies, using diffuse daylight.',
    detailedTruth: 'Solar photovoltaic cells operate on photons (light spectrum), not direct heat or temperature. Even during Indian monsoon rains, diffuse solar irradiance powers the panels. In fact, rainwater provides a natural cleaning wash that removes accumulated urban dust and soot, boosting efficiency as soon as the sun breaks out!',
    category: 'Weather & Monsoon',
    icon: 'CloudRain'
  },
  {
    id: 'myth-2',
    myth: 'Installing solar panels will damage my concrete RCC roof and cause water leakages.',
    fact: 'Professional solar installations use non-penetrating counter-weighted ballasts or chemical anchor fasteners with double waterproofing.',
    detailedTruth: 'Certified installers use standard chemical grouting (Hilti / Fischer anchors) with bitumen rubber flashing or elevated galvanized steel structures that don’t disrupt roof waterproofing. Furthermore, elevated frames create a shaded terrace area underneath that actually keeps the top floor 3°C to 5°C cooler in summer!',
    category: 'Roof & Structure',
    icon: 'Home'
  },
  {
    id: 'myth-3',
    myth: 'Government subsidies are complicated, take years to receive, or are a scam.',
    fact: 'Under PM Surya Ghar Muft Bijli Yojana, the subsidy (up to ₹78,000) is transferred via Direct Benefit Transfer (DBT) straight to your bank account within 30 days of net-meter commissioning.',
    detailedTruth: 'The National Rooftop Solar Portal (pmsuryaghar.gov.in) eliminates middlemen. You register online, choose any empanelled vendor, the DISCOM installs the bi-directional net meter, and the MNRE subsidy lands directly in your Aadhaar-linked bank account within 30 days of certificate upload.',
    category: 'Cost & Subsidies',
    icon: 'ShieldCheck'
  },
  {
    id: 'myth-4',
    myth: 'Solar panel systems require expensive maintenance and battery replacements every 2 years.',
    fact: 'Grid-tied residential solar systems have ZERO moving parts, NO batteries, and only require simple water washing every 15-20 days.',
    detailedTruth: 'Grid-tied rooftop solar systems (the standard in Indian cities) don’t use expensive lead-acid/lithium battery banks. The public electrical grid acts as your virtual battery via Net Metering. Panels come with a 25-year manufacturer performance warranty and only need occasional wipe-downs with clean water.',
    category: 'Maintenance',
    icon: 'Wrench'
  },
  {
    id: 'myth-5',
    myth: 'Rooftop solar takes 10 to 15 years to recover its initial installation cost.',
    fact: 'With Indian electricity tariffs of ₹6.5–₹9.0/unit and the ₹78,000 PM Surya Ghar subsidy, typical ROI payback takes only 3.0 to 4.2 years.',
    detailedTruth: 'For a 3 kW solar system costing ~₹1,65,000 gross, after the ₹78,000 central subsidy, your net cost is only ~₹87,000. Generating ~4,300 units/year saves ₹30,000 to ₹35,000 annually. You recover 100% of your investment in just ~3 years, followed by 22+ years of essentially 100% FREE electricity!',
    category: 'Cost & Subsidies',
    icon: 'TrendingUp'
  },
  {
    id: 'myth-6',
    myth: 'During a city power blackout, my grid-tied solar panels will continue powering my home normally without batteries.',
    fact: 'For safety, standard grid-tied inverters automatically shut down within 10 milliseconds during grid power cuts (Anti-Islanding Protection).',
    detailedTruth: 'This is a mandatory safety feature called "Anti-Islanding". If the grid is down and line workers are fixing power poles, your system must not inject high-voltage power into the lines. To get power during outages, you can opt for a "Hybrid Solar Inverter" with a battery backup bank.',
    category: 'Battery & Grid',
    icon: 'Zap'
  }
];

export const PRESET_QUIZ_QUESTIONS: SolarQuizQuestion[] = [
  {
    id: 'q1',
    question: 'Under the Government of India’s PM Surya Ghar Muft Bijli Yojana, what is the direct subsidy provided for a 3 kW residential rooftop solar system?',
    options: ['₹30,000', '₹50,000', '₹78,000', '₹1,00,000'],
    correctIndex: 2,
    explanation: 'MNRE provides ₹30,000 for 1 kW, ₹60,000 for 2 kW, and ₹78,000 for 3 kW and higher residential capacity directly to the homeowner via Direct Benefit Transfer (DBT).',
    category: 'Government Schemes'
  },
  {
    id: 'q2',
    question: 'In India (Northern Hemisphere), what is the optimal compass orientation for fixed solar panels to capture maximum sunlight throughout the year?',
    options: ['Facing North', 'Facing South (with 15°–25° tilt)', 'Facing East', 'Facing West'],
    correctIndex: 1,
    explanation: 'Because India lies in the Northern Hemisphere (approx 8°N to 37°N latitude), the sun arcs across the southern sky. Facing panels true South captures maximum annual solar insolation.',
    category: 'Solar Engineering'
  },
  {
    id: 'q3',
    question: 'What is the role of a "Bi-directional Net Meter" in a grid-tied rooftop solar system?',
    options: [
      'It converts Direct Current (DC) into Alternating Current (AC)',
      'It tracks both electricity consumed from the grid and surplus solar power exported to the grid',
      'It prevents lightning strikes on the rooftop',
      'It cleans the solar panel surface automatically'
    ],
    correctIndex: 1,
    explanation: 'A Net Meter records both import and export of electricity. At the end of the billing cycle, your DISCOM deducts exported solar units from imported units, billing you only for the net difference!',
    category: 'Net Metering'
  },
  {
    id: 'q4',
    question: 'Approximately how much rooftop area (shadow-free) is required to install a standard 1 kW solar system in India?',
    options: ['20 to 30 sq.ft', '80 to 100 sq.ft', '250 to 300 sq.ft', '500 to 600 sq.ft'],
    correctIndex: 1,
    explanation: 'With modern high-efficiency 540W Mono PERC panels, roughly 80 to 100 square feet (8–10 sq meters) of shadow-free rooftop area is needed per kilowatt (kW) of solar capacity.',
    category: 'Rooftop Sizing'
  },
  {
    id: 'q5',
    question: 'What is the standard manufacturer performance warranty duration on modern residential solar PV modules?',
    options: ['2 Years', '5 Years', '10 Years', '25 Years'],
    correctIndex: 3,
    explanation: 'Tier-1 solar panels come with a 25-year linear power output warranty guaranteeing at least 80% to 85% generation capacity even after 25 years of continuous operation.',
    category: 'Durability'
  },
  {
    id: 'q6',
    question: 'How much CO2 emissions does a typical 3 kW residential rooftop solar system offset every year in India?',
    options: ['~50 kg CO2', '~300 kg CO2', '~3,500 to 4,000 kg CO2', '~50,000 kg CO2'],
    correctIndex: 2,
    explanation: 'In India’s coal-dominated electricity grid, generating 1 unit (kWh) of solar electricity avoids ~0.82 kg of CO2. A 3 kW system generating ~4,300 kWh/year offsets ~3.5 metric tonnes of CO2 annually — equivalent to planting ~175 mature trees!',
    category: 'Carbon Footprint'
  }
];

export const GOVERNMENT_SCHEMES: GovernmentScheme[] = [
  {
    id: 'pm-surya-ghar',
    name: 'PM Surya Ghar: Muft Bijli Yojana',
    shortName: 'PM Surya Ghar',
    targetAudience: 'All Indian residential households, individual homeowners, and Group Housing Societies / RWAs.',
    ministry: 'Ministry of New and Renewable Energy (MNRE), Govt. of India',
    badgeText: 'Flagship National Scheme (₹75,000 Crore Outlay)',
    subsidyStructure: [
      {
        slab: '1 kW System',
        subsidyAmount: '₹30,000 Direct Bank Transfer',
        eligibility: 'Monthly consumption 0 - 150 units. Suitable for small homes.'
      },
      {
        slab: '2 kW System',
        subsidyAmount: '₹60,000 Direct Bank Transfer',
        eligibility: 'Monthly consumption 150 - 300 units. Suitable for 2-3 BHK homes.'
      },
      {
        slab: '3 kW and Above',
        subsidyAmount: '₹78,000 Direct Bank Transfer (Max Capped)',
        eligibility: 'Monthly consumption 300+ units. Suitable for large homes & AC loads.'
      },
      {
        slab: 'Group Housing Societies (RWA)',
        subsidyAmount: '₹18,000 per kW (up to 500 kW capacity)',
        eligibility: 'For common area lighting, lifts, water pumps in residential complexes.'
      }
    ],
    keyBenefits: [
      'Up to 300 units of FREE electricity every month for 1 Crore Indian families',
      'Zero-collateral collateral-free bank loans up to ₹6 Lakhs at concessional 7% interest rate through SBI, Canara Bank, PNB, etc.',
      'Central subsidy transferred directly to your bank account via DBT within 30 days of DISCOM inspection',
      'Net Metering credit banking with your local DISCOM for export of surplus power'
    ],
    applicationSteps: [
      'Step 1: Register on the National Portal (pmsuryaghar.gov.in) with your State, Electricity DISCOM, Consumer Account Number, Mobile & Email.',
      'Step 2: Login and Apply for Rooftop Solar online. Wait for DISCOM Feasibility Approval.',
      'Step 3: Once approved, get the plant installed by any MNRE-registered empanelled vendor of your choice.',
      'Step 4: Submit installation details and apply for Net Meter inspection on the portal.',
      'Step 5: DISCOM installs the Bi-directional Net Meter and issues Commissioning Certificate.',
      'Step 6: Submit bank account details and cancelled cheque copy on the portal. Subsidy lands in your account within 30 days!'
    ],
    officialPortalUrl: 'https://pmsuryaghar.gov.in/',
    directApplyUrl: 'https://pmsuryaghar.gov.in/consumerRegistration'
  },
  {
    id: 'delhi-solar-policy-2024',
    name: 'Delhi Solar Policy 2024 (Mukhyamantri Solar Protsahan)',
    shortName: 'Delhi Solar Policy',
    targetAudience: 'Residential consumers across Delhi (BRPL, BYPL, TPDDL, NDMC areas).',
    ministry: 'Energy Department, Government of NCT of Delhi',
    badgeText: 'State Incentive (Additional GBI ₹3/unit)',
    subsidyStructure: [
      {
        slab: 'Generation-Based Incentive (GBI)',
        subsidyAmount: '₹3.00 per kWh for Residential Rooftops for 5 Years',
        eligibility: 'Credited directly against consumer electricity bill every month'
      },
      {
        slab: 'Commercial / Group Housing GBI',
        subsidyAmount: '₹2.00 per kWh for 5 Years',
        eligibility: 'Group Housing societies and residential associations'
      }
    ],
    keyBenefits: [
      'Zero electricity bills for residential consumers with solar generation higher than consumption',
      'Earn additional monthly income directly credited into your DISCOM bill via GBI',
      'Unified single-window portal with automated DISCOM feasibility approval within 7 days',
      'Combines with Central PM Surya Ghar subsidy (₹78,000) for maximum payback in under 2.5 years'
    ],
    applicationSteps: [
      'Apply online via Delhi Solar Portal or DISCOM app (BSES / Tata Power DDL).',
      'Empanelled vendor completes rooftop layout and safety earthing.',
      'DISCOM installs bi-directional smart meter and activates GBI meter.'
    ],
    officialPortalUrl: 'https://delhisolarportal.delhi.gov.in/',
    helpline: '19124 / 011-2337-0588',
    directApplyUrl: 'https://delhisolarportal.delhi.gov.in/'
  },
  {
    id: 'up-solar-subsidy',
    name: 'Uttar Pradesh Solar Energy Policy (UPNEDA)',
    shortName: 'UP Solar Subsidy',
    targetAudience: 'Residential consumers across UP (MVVNL, PVVNL, DVVNL, PuVVNL, NPCL).',
    ministry: 'UP New and Renewable Energy Development Agency (UPNEDA)',
    badgeText: 'State Top-Up Subsidy (Up to ₹30,000 Extra)',
    subsidyStructure: [
      {
        slab: '1 kW - 2 kW Capacity',
        subsidyAmount: '₹15,000 State Subsidy (Total Central + State = up to ₹75,000)',
        eligibility: 'Residential rooftops in Uttar Pradesh'
      },
      {
        slab: '3 kW and Above Capacity',
        subsidyAmount: '₹30,000 State Subsidy (Total Central ₹78k + State ₹30k = ₹1,08,000 Total Subsidy!)',
        eligibility: 'Residential rooftops with 3kW+ sanctioned load'
      }
    ],
    keyBenefits: [
      'Highest combined subsidy in India (up to ₹1.08 Lakhs total financial aid)',
      'Net metering across all UPPCL Discoms with energy banking',
      'Solar Mitra training and local certified installer support in all 75 UP districts'
    ],
    applicationSteps: [
      'Register on UPNEDA Rooftop portal & PM Surya Ghar portal simultaneously.',
      'Choose an empanelled vendor in your district.',
      'Receive both Central DBT and UP State treasury DBT directly.'
    ],
    officialPortalUrl: 'https://upneda.org.in/',
    helpline: '0522-2720652 / 1800-180-0005',
    directApplyUrl: 'https://upneda.org.in/'
  },
  {
    id: 'sbi-surya-ghar-loan',
    name: 'SBI Surya Ghar Collateral-Free Solar Loan Scheme',
    shortName: 'SBI Solar Loan',
    targetAudience: 'All Indian residential homeowners installing rooftop solar up to 10 kW.',
    ministry: 'State Bank of India in partnership with MNRE',
    badgeText: 'Concessional 7% Interest Rate',
    subsidyStructure: [
      {
        slab: 'Loan for up to 3 kW Systems',
        subsidyAmount: 'Loan up to ₹2,00,000 with only 10% Margin Money',
        eligibility: 'Interest rate at Repo Rate + 0.50% (effective ~7.00% p.a.). Zero processing fee.'
      },
      {
        slab: 'Loan for >3 kW to 10 kW Systems',
        subsidyAmount: 'Loan up to ₹6,00,000 with 20% Margin Money',
        eligibility: 'Interest rate at Repo Rate + 1.00% (effective ~7.50% p.a.). Repayment up to 10 years.'
      }
    ],
    keyBenefits: [
      'Zero collateral or property mortgage required',
      'Monthly EMI is lower than your monthly electricity bill savings, making solar net cashflow POSITIVE from Day 1!',
      'Direct disbursement to verified empanelled vendor after installation',
      'Available at all 22,000+ SBI branches across India or instantly via PM Surya Ghar portal'
    ],
    applicationSteps: [
      'Select "Apply for Loan" on the PM Surya Ghar portal while filling your solar application.',
      'Choose State Bank of India (or other partner banks like Canara, PNB, Bank of Baroda).',
      'Provide Aadhaar, PAN, and electricity bill for instant paperless sanction.'
    ],
    officialPortalUrl: 'https://sbi.co.in/web/personal-banking/loans/pm-surya-ghar-loan',
    helpline: '1800 1234 / 1800 2100',
    directApplyUrl: 'https://pmsuryaghar.gov.in/'
  }
];

// Helper calculation engine
export function calculateSolarPotential(input: SolarCalculationInput): SolarCalculationResult {
  const state = INDIAN_STATES_SOLAR.find(s => s.code === input.stateCode) || INDIAN_STATES_SOLAR[0];
  
  // Estimate monthly units from monthly bill: units = bill / tariff
  const monthlyUnits = Math.max(input.monthlyBill / state.avgTariffPerKwh, 50);
  const dailyUnitsNeeded = monthlyUnits / 30;
  
  // In India: 1 kW generates ~ 4 to 4.5 units per day depending on sun hours
  const unitsPerKwDay = state.avgSunHoursPerDay * 0.78; // 0.78 derating factor for temperature, dust, wire losses
  const rawCapacityKw = dailyUnitsNeeded / unitsPerKwDay;
  
  // Practical rounding to nearest 0.5 kW, minimum 1 kW, max capped by available roof area (80 sq ft per kW)
  const maxPossibleKwByArea = Math.max(Math.floor((input.roofAreaSqFt / 85) * 2) / 2, 0.5);
  let recommendedCapacityKw = Math.min(Math.max(Math.round(rawCapacityKw * 2) / 2, 1), 15);
  
  // Check roof area limitation
  if (recommendedCapacityKw > maxPossibleKwByArea && maxPossibleKwByArea >= 1) {
    recommendedCapacityKw = maxPossibleKwByArea;
  }

  // Panel sizing: 540W per panel
  const panelWattage = input.panelType === 'mono_perc_540' ? 540 : input.panelType === 'bifacial_550' ? 550 : 335;
  const panelCount = Math.ceil((recommendedCapacityKw * 1000) / panelWattage);
  const requiredAreaSqFt = Math.round(panelCount * (panelWattage >= 500 ? 28 : 20));

  // Costs (in ₹ INR)
  // Baseline cost per kW in India ranges from ~₹52,000 to ₹60,000 depending on panel type & battery
  let costPerKw = 55000;
  if (input.panelType === 'bifacial_550') costPerKw = 59000;
  if (input.panelType === 'poly_335') costPerKw = 48000;
  if (input.batteryStorageNeeded) costPerKw += 25000; // Hybrid with LiFePO4 battery

  const totalSystemCost = Math.round(recommendedCapacityKw * costPerKw);

  // PM Surya Ghar Muft Bijli Yojana Central Subsidy
  let centralSubsidy = 0;
  if (recommendedCapacityKw <= 1) {
    centralSubsidy = 30000;
  } else if (recommendedCapacityKw <= 2) {
    centralSubsidy = 60000;
  } else {
    // 3kW and above capped at 78,000
    centralSubsidy = 78000;
  }

  // State Subsidy (e.g. UP up to 30k, Delhi GBI)
  let stateSubsidy = 0;
  if (input.stateCode === 'UP') {
    stateSubsidy = recommendedCapacityKw <= 2 ? 15000 : 30000;
  } else if (state.stateSubsidyPerKw) {
    stateSubsidy = Math.round(recommendedCapacityKw * state.stateSubsidyPerKw);
  }

  const netPayableCost = Math.max(totalSystemCost - centralSubsidy - stateSubsidy, 10000);

  // Generation Metrics
  // Daily generation
  const dailyGenerationUnits = Math.round(recommendedCapacityKw * unitsPerKwDay * 10) / 10;
  const monthlyGenerationUnits = Math.round(dailyGenerationUnits * 30);
  const annualGenerationUnits = Math.round(dailyGenerationUnits * 365);

  // Savings
  const monthlyBillBeforeSolar = input.monthlyBill;
  const solarMonthlyValue = monthlyGenerationUnits * state.avgTariffPerKwh;
  const estimatedNewMonthlyBill = Math.max(Math.round(monthlyBillBeforeSolar - solarMonthlyValue), 180); // minimum DISCOM fixed charge
  const monthlySavings = Math.round(monthlyBillBeforeSolar - estimatedNewMonthlyBill);
  const annualSavings = monthlySavings * 12;
  
  // 25 Year Savings with 3.5% annual electricity tariff inflation
  let twentyFiveYearSavings = 0;
  let currentYearSavings = annualSavings;
  for (let i = 0; i < 25; i++) {
    twentyFiveYearSavings += currentYearSavings;
    currentYearSavings *= 1.035; // 3.5% tariff rise per year in India
  }
  twentyFiveYearSavings = Math.round(twentyFiveYearSavings);

  // Payback period
  const paybackPeriodYears = Math.round((netPayableCost / annualSavings) * 10) / 10;

  // Environmental Footprint (Grid emission factor for India is ~0.82 kg CO2 / kWh)
  const co2AnnualOffsetKg = Math.round(annualGenerationUnits * 0.82);
  const treesEquivalentAnnual = Math.round(co2AnnualOffsetKg / 20); // 1 mature tree absorbs ~20kg CO2/year
  const coalSavedAnnualKg = Math.round(annualGenerationUnits * 0.45); // 0.45 kg coal burned per kWh
  const carKmEquivalentAnnual = Math.round(co2AnnualOffsetKg * 5.2); // ~190g CO2 per car km

  // SBI Loan EMI: 5 years at 7% p.a. for netPayableCost * 0.90 (10% downpayment)
  const principal = netPayableCost * 0.9;
  const monthlyRate = 0.07 / 12;
  const totalMonths = 60;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);

  return {
    recommendedCapacityKw,
    panelCount,
    requiredAreaSqFt,
    totalSystemCost,
    centralSubsidy,
    stateSubsidy,
    netPayableCost,
    dailyGenerationUnits,
    monthlyGenerationUnits,
    annualGenerationUnits,
    monthlyBillBeforeSolar,
    estimatedNewMonthlyBill,
    monthlySavings,
    annualSavings,
    twentyFiveYearSavings,
    paybackPeriodYears: isNaN(paybackPeriodYears) || paybackPeriodYears <= 0 ? 3.2 : paybackPeriodYears,
    co2AnnualOffsetKg,
    treesEquivalentAnnual,
    coalSavedAnnualKg,
    carKmEquivalentAnnual,
    sbiLoanEmiEstimate: Math.round(emi)
  };
}
