// src/modules-config.js
// Static module metadata for Phase 1 placeholder views.
// Phase 2 replaces this with: fetch(import.meta.env.BASE_URL + 'data/modules/index.json')
// Shape contract: id, title, icon (Lucide name), description, order,
//                 estimatedMinutes, lessons[]{id, title}, complianceTags[]

export const MODULES = [
  {
    id: 'logging-auditing',
    title: 'Logging & Auditing',
    icon: 'BookOpen',
    description: 'Configure Windows Event Logging and PowerShell script block logging to meet compliance requirements.',
    order: 1,
    estimatedMinutes: 45,
    lessons: [
      { id: 'intro',          title: 'Introduction to Windows Event Logs' },
      { id: 'ps-logging',     title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
      { id: 'audit-policies', title: 'Configuring Audit Policies via Group Policy', quizId: '01' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'network-hardening',
    title: 'Network Hardening',
    icon: 'Shield',
    description: 'Firewall rules, network segmentation, and port scanning via PowerShell.',
    order: 2,
    estimatedMinutes: 50,
    lessons: [
      { id: 'firewall-basics',       title: 'Windows Firewall with Advanced Security' },
      { id: 'network-segmentation',  title: 'OT Network Segmentation Principles' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'account-access',
    title: 'Account & Access Management',
    icon: 'Users',
    description: 'Active Directory, least privilege, service accounts, and password policies.',
    order: 3,
    estimatedMinutes: 45,
    lessons: [
      { id: 'least-privilege',  title: 'Least Privilege Principles' },
      { id: 'service-accounts', title: 'Securing Service Accounts' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'incident-response',
    title: 'Incident Response',
    icon: 'AlertTriangle',
    description: 'Anomaly detection, system isolation, and evidence collection via PowerShell.',
    order: 4,
    estimatedMinutes: 40,
    lessons: [
      { id: 'anomaly-detection',   title: 'Detecting Anomalies with PowerShell' },
      { id: 'evidence-collection', title: 'Evidence Collection and Preservation' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'patch-management',
    title: 'Patch Management',
    icon: 'Wrench',
    description: 'Windows/IT patching, OT/ICS patching workflows, and compliance reporting.',
    order: 5,
    estimatedMinutes: 60,
    lessons: [
      { id: 'wsus-patching', title: 'Windows Update and WSUS' },
      { id: 'ot-patching',   title: 'OT/ICS Patching in Air-Gapped Environments' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
];
