// src/modules-config.js
// Static module metadata for Phase 1 placeholder views.
// Phase 2 replaces this with: fetch(import.meta.env.BASE_URL + 'data/modules/index.json')
// Shape contract: id, title, icon (Lucide name), description, order,
//                 estimatedMinutes, lessons[]{id, title}, complianceTags[]

export const MODULES = [
  {
    id: 'logging-auditing',
    title: 'Logging & Auditing',
    icon: 'book-open',
    description: 'Configure Windows Event Logging and PowerShell script block logging to meet compliance requirements.',
    order: 1,
    estimatedMinutes: 45,
    lessons: [
      { id: 'intro',          title: 'Introduction to Windows Event Logs', scenarioId: '01' },
      { id: 'ps-logging',     title: 'Enabling PowerShell Script Block Logging', exerciseId: '01' },
      { id: 'audit-policies',      title: 'Configuring Audit Policies via Group Policy',       quizId: '01' },
      { id: 'ot-logging-advanced', title: 'Advanced OT Log Collection and Retention' },
      { id: 'siem-integration',    title: 'SIEM Integration for Pipeline OT Environments',     quizId: '02' },
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
      { id: 'intro',                  title: 'Network Hardening Overview',                       scenarioId: '01' },
      { id: 'ps-firewall',            title: 'Managing Firewall Rules with PowerShell',           exerciseId: '01' },
      { id: 'firewall-policy',        title: 'Windows Firewall Policy for OT Networks',           quizId: '01' },
      { id: 'ot-network-segmentation', title: 'OT Network Segmentation and DMZ Architecture' },
      { id: 'firewall-audit',          title: 'Firewall Rule Auditing with PowerShell',           quizId: '02' },
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
      { id: 'intro',                title: 'Account and Access Control Overview',              scenarioId: '01' },
      { id: 'ps-ad',                title: 'Active Directory Queries with PowerShell',         exerciseId: '01' },
      { id: 'access-policy',        title: 'Least Privilege and Service Account Policy',       quizId: '01' },
      { id: 'privileged-access-ot', title: 'Privileged Access Management for OT Environments' },
      { id: 'ad-audit',             title: 'Auditing Active Directory with PowerShell',        quizId: '02' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'incident-response',
    title: 'Incident Response',
    icon: 'alert-triangle',
    description: 'Anomaly detection, system isolation, and evidence collection via PowerShell.',
    order: 4,
    estimatedMinutes: 40,
    lessons: [
      { id: 'intro',         title: 'Incident Response Overview',              scenarioId: '01' },
      { id: 'ps-ir',         title: 'Evidence Collection with PowerShell',     exerciseId: '01' },
      { id: 'ir-procedures', title: 'Containment and Recovery Procedures',     quizId: '01' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
  {
    id: 'patch-management',
    title: 'Patch Management',
    icon: 'wrench',
    description: 'Windows/IT patching, OT/ICS patching workflows, and compliance reporting.',
    order: 5,
    estimatedMinutes: 60,
    lessons: [
      { id: 'wsus-patching', title: 'Windows Update and WSUS',                                   scenarioId: '01' },
      { id: 'ot-patching',   title: 'OT/ICS Patching in Air-Gapped Environments',                exerciseId: '01', scenarioId: '02' },
      { id: 'patch-policy',  title: 'Patch Management Policy and Compliance Documentation',       quizId: '01',     scenarioId: '03' },
    ],
    complianceTags: ['TSA', 'NIST'],
  },
];
