# Phase 7: Core Module Content (MOD-02, MOD-03, MOD-04) — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-16
**Phase:** 07-core-module-content-mod-02-mod-03-mod-04
**Areas discussed:** Lesson roster + assignment, PS command focus, Scenario incident design, Compliance control depth

---

## Lesson Roster + Assignment

| Option | Description | Selected |
|--------|-------------|----------|
| 3 lessons each (match MOD-01) | Lesson 1=intro/scenario, Lesson 2=PS/exercise, Lesson 3=policy/quiz | ✓ |
| 2 lessons each (keep stubs) | 2 lessons, cramped assignment | |
| Policy/configuration lesson (L3) | MOD-02: firewall-policy, MOD-03: access-policy, MOD-04: ir-procedures | ✓ |
| Advanced/deep-dive lesson (L3) | PAW, JEA, chain of custody | |
| Mirror MOD-01 exactly (assignment) | Scenario on L1, exercise on L2, quiz on L3 | ✓ |
| Vary by module | Different assignment per module | |

**User's choice:** 3 lessons per module, policy/config lesson as L3, MOD-01 assignment pattern mirrored exactly.
**Notes:** User selected specific lesson titles/IDs from the recommended option verbatim.

---

## PS Command Focus

| Option | Description | Selected |
|--------|-------------|----------|
| MOD-02: Firewall rule audit | Get-NetFirewallRule + Test-NetConnection + New-NetFirewallRule | ✓ |
| MOD-02: Port inventory + anomaly | Get-NetTCPConnection + Get-Process | ✓ |
| MOD-03: AD group membership audit | Get-ADGroupMember + Get-ADUser + Get-ADPrincipalGroupMembership | ✓ |
| MOD-03: Local admin audit | Get-LocalGroupMember + Compare-Object | ✓ |
| MOD-04: Evidence collection | Get-Process + Get-NetTCPConnection + Export-Csv | ✓ |
| MOD-04: System isolation | Disable-NetAdapter + Set-NetFirewallProfile | ✓ |

**User's choice:** "Both" for all three modules — combine both sequences into a single multi-step exercise per module.
**Notes:** MOD-02 = 4 steps (firewall audit + port-to-process), MOD-03 = 4 steps (AD group audit + local admin audit), MOD-04 = 4 steps (evidence collection + isolation).

---

## Scenario Incident Design

| Option | Description | Selected |
|--------|-------------|----------|
| MOD-02: Unauthorized port on boundary | RDP open on IT/OT firewall, investigate vs block | ✓ |
| MOD-02: Unknown device on OT segment | Rogue IP in OT VLAN | ✓ |
| MOD-03: Mystery admin in Domain Admins | svc-pipeline-backup unauthorized escalation | ✓ |
| MOD-03: Shared service account | Historian using shared admin account | ✓ |
| MOD-04: Ransomware indicator on DMZ | EDR alert + lateral movement toward historian | ✓ |
| MOD-04: Suspicious PS script on OT asset | Script block logging alert on control workstation | ✓ |

**User's choice:** "Both" for all three — scenarios combine both ideas into a coherent 2-phase narrative per module.
**Notes:** Scenarios are authored as single 2-phase JSON files where Phase 1 flows into Phase 2.

---

## Compliance Control Depth

| Option | Description | Selected |
|--------|-------------|----------|
| Specific NIST control numbers | NIST-SC-7, NIST-AC-2, NIST-IR-4 etc. | ✓ |
| TSA category tags only | TSA-NetworkSeg, TSA-AccessControl, TSA-IR | ✓ |
| NERC CIP: once per module | One callout with disclaimer | |
| NERC CIP: per-lesson where aligned | CIP-007 (MOD-02), CIP-006/004 (MOD-03), CIP-008 (MOD-04) | ✓ |

**User's choice:** "Both" specific NIST IDs AND TSA category tags. NERC CIP per-lesson where a CIP control aligns.
**Notes:** 9 new control IDs total across three modules added to compliance-index.json.

---

## Claude's Discretion

- Lesson prose depth and word count (use MOD-01 as benchmark)
- Quiz question topics (3 questions per quiz)
- Specific hintPatterns per exercise step
- Exact PS output text per step
- OT callout placement within each lesson
- Narrative details within scenarios (IP addresses, timestamps, event counts) — all generic per CLAUDE.md

## Deferred Ideas

None — discussion stayed within Phase 7 scope.
