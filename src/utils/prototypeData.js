export const PAGES = {
  REPORT_ISSUE: 'report-issue',
  OPERATIONS_CENTER: 'operations',
  SAFETY_DASHBOARD: 'safety',
  PROJECT_PITCH: 'project'
}

export const API_ENDPOINTS = {
  ISSUES: '/issues',
  OPERATIONS: '/operations',
  SAFETY: '/safety',
  ANALYZE: '/analyze'
}

export const INITIAL_STATE = {
  issues: [],
  operations: {},
  safety: {},
  loading: false,
  error: null
}

// Realistic complaint data with 15 diverse complaints
export const MOCK_COMPLAINTS = [
  {
    id: 'C001',
    title: 'Broken streetlight on Oak Avenue',
    description: 'Multiple streetlights have been out for 2 weeks near Oak Avenue and Main St intersection',
    department: 'Electrical',
    status: 'assigned',
    priority: 'high',
    location: '420 Oak Avenue, Ward 5',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    urgencyScore: 8.5,
    citizensAffected: 47,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Infrastructure Failure', 'Public Safety Risk'],
      confidence: 0.94,
      suggestedDepartment: 'Electrical',
      suggestedPriority: 'high',
      professionalRewrite: 'Critical infrastructure failure: streetlights inoperative for extended period at major intersection, creating public safety hazard.'
    }
  },
  {
    id: 'C002',
    title: 'Pothole damaging vehicles',
    description: 'Large pothole on Maple Street causing damage to cars. Already hit 3 cars this week.',
    department: 'Roads',
    status: 'resolved',
    priority: 'high',
    location: '156 Maple Street, Ward 2',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    urgencyScore: 7.8,
    citizensAffected: 12,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Road Damage', 'Safety Hazard'],
      confidence: 0.91,
      suggestedDepartment: 'Roads',
      suggestedPriority: 'high',
      professionalRewrite: 'Major pavement damage at high-traffic location with documented vehicle incidents.'
    }
  },
  {
    id: 'C003',
    title: 'Water leak from main line',
    description: 'Water gushing from ground at corner of 5th and Park. Possible water main break.',
    department: 'Water',
    status: 'assigned',
    priority: 'critical',
    location: '500 Park Lane, Ward 3',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    urgencyScore: 9.7,
    citizensAffected: 234,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Utility Infrastructure Critical', 'Service Disruption'],
      confidence: 0.98,
      suggestedDepartment: 'Water',
      suggestedPriority: 'critical',
      professionalRewrite: 'Suspected water main rupture causing significant flow. Immediate intervention required to prevent service area disruption.'
    }
  },
  {
    id: 'C004',
    title: 'Garbage collection missed',
    description: 'Residential block not serviced this week despite scheduled pickup on Monday.',
    department: 'Sanitation',
    status: 'pending',
    priority: 'medium',
    location: '1200-1250 Elm Street, Ward 1',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    urgencyScore: 5.2,
    citizensAffected: 28,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Service Failure'],
      confidence: 0.85,
      suggestedDepartment: 'Sanitation',
      suggestedPriority: 'medium',
      professionalRewrite: 'Scheduled waste collection not performed. Requires rescheduling and service verification.'
    }
  },
  {
    id: 'C005',
    title: 'Park playground equipment damaged',
    description: 'Swing set has broken welding, posing safety risk to children. Also missing slats on climbing frame.',
    department: 'Parks',
    status: 'assigned',
    priority: 'high',
    location: 'Central Park, Ward 4',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    urgencyScore: 7.9,
    citizensAffected: 156,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Facility Damage', 'Child Safety Risk'],
      confidence: 0.93,
      suggestedDepartment: 'Parks',
      suggestedPriority: 'high',
      professionalRewrite: 'Multiple structural failures in children\'s play equipment creating acute injury risk. Immediate closure and repair needed.'
    }
  },
  {
    id: 'C006',
    title: 'Dead trees blocking sidewalk',
    description: 'Large dead tree branches hanging over public sidewalk on residential street. Hazardous.',
    department: 'Parks',
    status: 'pending',
    priority: 'medium',
    location: '890 Birch Lane, Ward 2',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    urgencyScore: 6.1,
    citizensAffected: 34,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Tree Management', 'Safety Hazard'],
      confidence: 0.88,
      suggestedDepartment: 'Parks',
      suggestedPriority: 'medium',
      professionalRewrite: 'Hazardous dead tree limbs overhang pedestrian area. Requires pruning or removal to ensure public safety.'
    }
  },
  {
    id: 'C007',
    title: 'Water discoloration in tap',
    description: 'Brown/rusty water coming from tap. Happens intermittently. Concerned about water quality.',
    department: 'Water',
    status: 'assigned',
    priority: 'high',
    location: '675 River Road, Ward 5',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    urgencyScore: 7.6,
    citizensAffected: 89,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Water Quality Issue', 'Health Concern'],
      confidence: 0.90,
      suggestedDepartment: 'Water',
      suggestedPriority: 'high',
      professionalRewrite: 'Water quality degradation indicating potential sediment, mineral content, or pipeline corrosion. Requires testing and investigation.'
    }
  },
  {
    id: 'C008',
    title: 'Illegal dumping in alley',
    description: 'Mattress, appliances, and construction debris dumped in residential alley. Has been there for weeks.',
    department: 'Sanitation',
    status: 'resolved',
    priority: 'medium',
    location: 'Alley between Pine and Cedar, Ward 3',
    timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
    urgencyScore: 5.8,
    citizensAffected: 19,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Illegal Dumping', 'Environmental Hazard'],
      confidence: 0.92,
      suggestedDepartment: 'Sanitation',
      suggestedPriority: 'medium',
      professionalRewrite: 'Unauthorized waste disposal in residential area. Requires cleanup and investigation for source.'
    }
  },
  {
    id: 'C009',
    title: 'Traffic light malfunction',
    description: 'Traffic light at 4th and Market is stuck on red for one direction. Causing major gridlock.',
    department: 'Electrical',
    status: 'assigned',
    priority: 'high',
    location: '400 Market Street, Ward 1',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    urgencyScore: 8.3,
    citizensAffected: 523,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Traffic Infrastructure Failure', 'Congestion'],
      confidence: 0.96,
      suggestedDepartment: 'Electrical',
      suggestedPriority: 'high',
      professionalRewrite: 'Traffic signal malfunction at major intersection causing significant traffic disruption. Emergency repair needed.'
    }
  },
  {
    id: 'C010',
    title: 'Graffiti on city buildings',
    description: 'Tag and graffiti spray painted on community center and library walls.',
    department: 'Public Works',
    status: 'pending',
    priority: 'low',
    location: 'Community Center, 200 City Plaza, Ward 4',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    urgencyScore: 3.2,
    citizensAffected: 45,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Vandalism'],
      confidence: 0.87,
      suggestedDepartment: 'Public Works',
      suggestedPriority: 'low',
      professionalRewrite: 'Vandalism on public buildings. Schedule for removal and investigate prevention measures.'
    }
  },
  {
    id: 'C011',
    title: 'Sidewalk cracked and uneven',
    description: 'Sidewalk on Commerce Ave has multiple cracks and heaving. Trip hazard for pedestrians.',
    department: 'Roads',
    status: 'pending',
    priority: 'medium',
    location: '320 Commerce Avenue, Ward 2',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    urgencyScore: 5.5,
    citizensAffected: 62,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Pedestrian Infrastructure Failure'],
      confidence: 0.89,
      suggestedDepartment: 'Roads',
      suggestedPriority: 'medium',
      professionalRewrite: 'Sidewalk structural failure creating pedestrian trip hazard. Requires repair or replacement.'
    }
  },
  {
    id: 'C012',
    title: 'Noisy construction at night',
    description: 'Construction site on 7th Street operating loudly past midnight. Violates noise ordinance.',
    department: 'Public Works',
    status: 'assigned',
    priority: 'medium',
    location: '750 7th Street, Ward 5',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    urgencyScore: 4.7,
    citizensAffected: 134,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Ordinance Violation', 'Nuisance'],
      confidence: 0.83,
      suggestedDepartment: 'Public Works',
      suggestedPriority: 'medium',
      professionalRewrite: 'Noise ordinance violation by construction activity during restricted hours. Requires compliance enforcement.'
    }
  },
  {
    id: 'C013',
    title: 'Flooding in basement',
    description: 'Heavy rain causing water to back up into residential basement. Storm drain appears clogged.',
    department: 'Water',
    status: 'resolved',
    priority: 'high',
    location: '450 Garden Drive, Ward 3',
    timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000),
    urgencyScore: 7.4,
    citizensAffected: 8,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Drainage System Failure', 'Property Damage'],
      confidence: 0.91,
      suggestedDepartment: 'Water',
      suggestedPriority: 'high',
      professionalRewrite: 'Storm drainage system blockage causing residential flooding. Emergency clearing and inspection required.'
    }
  },
  {
    id: 'C014',
    title: 'Rodent infestation',
    description: 'Rats and mice seen multiple times in commercial district. Droppings found behind businesses.',
    department: 'Health',
    status: 'pending',
    priority: 'high',
    location: 'Downtown Commercial District, Ward 1',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    urgencyScore: 7.1,
    citizensAffected: 156,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Public Health Issue', 'Pest Control'],
      confidence: 0.86,
      suggestedDepartment: 'Health',
      suggestedPriority: 'high',
      professionalRewrite: 'Active rodent infestation in commercial zone presenting health hazard. Requires pest control intervention and sanitation measures.'
    }
  },
  {
    id: 'C015',
    title: 'Missing street sign',
    description: 'Stop sign at residential intersection knocked down. Not visible from approaching traffic.',
    department: 'Roads',
    status: 'assigned',
    priority: 'high',
    location: 'Turner Street & Valley Lane, Ward 4',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    urgencyScore: 8.2,
    citizensAffected: 189,
    imageUrl: null,
    aiAnalysis: {
      detectedIssues: ['Traffic Safety Hazard', 'Infrastructure Damage'],
      confidence: 0.95,
      suggestedDepartment: 'Roads',
      suggestedPriority: 'high',
      professionalRewrite: 'Missing traffic control sign at intersection creating safety hazard. Immediate replacement required.'
    }
  }
]

// Department and status helpers
export const DEPARTMENTS = ['Electrical', 'Roads', 'Water', 'Sanitation', 'Parks', 'Public Works', 'Health']
export const STATUSES = ['pending', 'assigned', 'resolved', 'rejected']
export const PRIORITIES = ['low', 'medium', 'high', 'critical']

export const PRIORITY_COLORS = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-green-100 text-green-800 border-green-300'
}

export const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  resolved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
}
