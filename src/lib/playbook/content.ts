import type { Chapter } from "./types";

export const RULES = [
  {
    id: "01",
    title: "Sources Sought is not optional",
    text: "A response costs hours. Silence costs the relationship. If the NAICS is adjacent, answer.",
  },
  {
    id: "02",
    title: "NAICS is a filter, not a strategy",
    text: "Agencies miscode constantly. Read the title and PSC. Bid the work, not the six-digit label.",
  },
  {
    id: "03",
    title: "Bid less. Win more.",
    text: "A 12% win rate on 40 bids is a failing factory. A 35% win rate on 10 bids is a company.",
  },
  {
    id: "04",
    title: "Capture starts before the RFP",
    text: "If you first see the work on SAM.gov the day it is solicited, you are already late for anything that matters.",
  },
  {
    id: "05",
    title: "Compliance is the floor",
    text: "Evaluators score what they can find. A brilliant uncompliant volume is a non-responsive volume.",
  },
  {
    id: "06",
    title: "Late is late",
    text: "Portals hang. Emails quarantine. Submit 24 hours early or do not bother scoring the debrief.",
  },
  {
    id: "07",
    title: "Debriefs fund the next bid",
    text: "Request every debrief in writing within three calendar days. Strengths, weaknesses, past performance — then change the factory.",
  },
];

export const CHAPTERS: Chapter[] = [
  {
    slug: "doctrine",
    number: "01",
    title: "The alert-to-award doctrine",
    dek: "A daily NAICS search is a sensor. It is not a capture system. This chapter is the operating thesis.",
    minutes: 7,
    stageLabel: "Foundation",
    blocks: [
      {
        type: "quote",
        text: "Most contractors do not lose on price. They lose on selection — they bid work they were never going to win, and they skip the notices that would have put them in the room.",
      },
      {
        type: "p",
        text: "You are already registered on SAM.gov. You already pull a daily feed by NAICS. That puts you ahead of firms that still browse the site like a catalog. It does not, by itself, produce awards. Awards come from a repeatable path: classify every notice the morning it lands, spend capture calories only on work you can win, write a compliant proposal, and convert the result — win or lose — into past performance and intelligence.",
      },
      {
        type: "p",
        text: "The doctrine is ruthless about time. A two-person BD shop cannot read 40 solicitations. It can bucket 40 notices in 40 minutes, respond to four Sources Sought, score three RFPs, and fully pursue one. That is how small firms beat large BD machines: concentration, not coverage.",
      },
      {
        type: "rule",
        title: "The conversion chain",
        text: "Alert → Bucket (90 seconds) → Go/No-Go (15 minutes, same day) → Capture plan → Proposal factory → On-time submission → Debrief. Skip a link and the rest is theater.",
      },
      {
        type: "table",
        headers: ["Notice type", "Your job", "Default bucket"],
        rows: [
          ["Sources Sought / RFI", "Be seen. Shape the PWS. Get on the list.", "Respond"],
          ["Pre-sol / Industry day / Special", "Start capture. Meet the customer.", "Shape"],
          ["Solicitation (RFP, RFQ, IFB)", "Decide. Then either fully bid or fully walk.", "Score"],
          ["Award / J&A / Bridge", "Record the competitor, value, and next recompete.", "Intel"],
        ],
      },
      {
        type: "p",
        text: "Two numbers run the company. First: fully loaded cost of a serious proposal (people, consultants, color teams, late nights). Second: how many of those you can run at once without wrecking delivery. Everything in this playbook exists to keep those numbers honest.",
      },
      {
        type: "steps",
        items: [
          "Set your NAICS sensor net (primary, adjacent, PSC, set-aside).",
          "Run the Daily Desk every morning before internal meetings.",
          "Never start a volume without a written Go.",
          "Close every bid with a debrief request, a CPARS plan, or a no-bid file.",
        ],
      },
      {
        type: "watch",
        text: "This playbook is operational guidance, not legal advice. FAR, DFARS, SBA size standards, and solicitation instructions control. When they conflict with habit, habit loses.",
      },
    ],
  },
  {
    slug: "sensor-net",
    number: "02",
    title: "Building the NAICS sensor net",
    dek: "Daily search is only as good as the queries. Build a net that catches miscodes, set-asides you can actually bid, and the forecasts that never hit SAM as a surprise.",
    minutes: 8,
    stageLabel: "Sensor",
    blocks: [
      {
        type: "p",
        text: "SAM.gov Contract Opportunities is the system of record for public federal notices. Your saved searches should be boring, redundant, and reviewed monthly. One query is not a net.",
      },
      {
        type: "rule",
        title: "Three-layer search",
        text: "Layer A: your exact registered NAICS, last 24 hours. Layer B: adjacent NAICS + PSC codes that historically buy your work. Layer C: named agencies and keywords (your differentiators), because the KO will miscode.",
      },
      {
        type: "p",
        text: "Register NAICS on your SAM entity record that you can actually perform. Size is determined by the NAICS the contracting officer assigns to the solicitation, not by your favorite code. If you are small under 541512 ($34M receipts, current table) and the RFP lands on 541330, you are small or other-than-small under engineering rules — verify before you certify.",
      },
      {
        type: "table",
        headers: ["Layer", "What to save", "Why"],
        rows: [
          ["A — Exact", "Each primary NAICS, posted date = 1 day, all notice types", "The morning inbox"],
          ["B — Adjacent", "Sibling NAICS + 2–4 PSC codes from your last awards", "Miscodes and follow-on work"],
          ["C — Account", "Target agencies + 5–8 capability keywords, 7-day lookback", "When NAICS is fiction"],
          ["D — Forecast", "Agency procurement forecasts, GSA, DoD, not SAM alone", "Capture before the notice"],
        ],
      },
      {
        type: "p",
        text: "Pair NAICS with Product Service Codes. A 541512 notice tagged DA01 (IT and telecom business application) is a different animal than 541512 tagged R408 (program management). Your Daily Desk should show both codes or you will keep triaging the wrong work.",
      },
      {
        type: "p",
        text: "Set-aside filters are a double-edged sword. Filtering to only 8(a) will hide the unrestricted work you might win as a sub, and the Sources Sought that never has a set-aside yet. Prefer: one search with set-asides you can prime, and a second search with no set-aside filter for intel and teaming.",
      },
      {
        type: "steps",
        items: [
          "List every NAICS on your SAM record. Mark primary vs. dormant.",
          "Pull 24 months of USAspending awards for those NAICS at your top five agencies. Note the PSC mix and incumbents.",
          "Add adjacent NAICS that those agencies actually used when buying your type of work.",
          "Save Layer A/B/C searches. Name them like files: `A-541512-24h`, not `search 3`.",
          "Subscribe to agency forecasts and SAM interested-vendor lists for target offices.",
        ],
      },
      {
        type: "watch",
        text: "SBA proposed a sweeping rewrite of size standards in August 2026 (for example, 541512 moving from $34M toward a much larger receipts cap). Treat the table in Company as a working copy. Recertify against the solicitation's stated standard, the FAR clause, and sba.gov the week you bid.",
      },
      {
        type: "checks",
        id: "sensor",
        items: [
          { id: "sam-active", text: "SAM entity is Active; reps & certs current; NAICS list matches what you sell" },
          { id: "layer-a", text: "Layer A saved searches exist for every primary NAICS" },
          { id: "layer-b", text: "Adjacent NAICS + PSC searches exist" },
          { id: "forecasts", text: "Top five agency forecasts are on a quarterly review calendar" },
          { id: "usaspending", text: "Incumbent pull from USAspending is a weekly habit, not a one-off" },
        ],
      },
    ],
  },
  {
    slug: "daily-desk",
    number: "03",
    title: "The 90-second daily desk",
    dek: "A morning protocol so notices get a bucket before they get a meeting. Inbox overnight is a process failure.",
    minutes: 6,
    stageLabel: "Triage",
    blocks: [
      {
        type: "quote",
        text: "You do not read the solicitation at 7:41 a.m. You classify it.",
      },
      {
        type: "p",
        text: "Run the desk before Slack, before internal stand-up. The feed is perishable. Sources Sought due in nine days that sit until Friday are effectively declined. Award notices you skip are competitor research you will later pay a tool to reconstruct.",
      },
      {
        type: "steps",
        items: [
          "Notice type. Sources Sought / RFI → Respond. Pre-sol / industry day / special → Shape. Solicitation → Score. Award / J&A → Intel. Wrong world → Pass.",
          "Set-aside. If you cannot meet it as prime and cannot team to it in 72 hours, Pass. Unrestricted against a 10-year incumbent is not a character test.",
          "Clock. Full FAR 15 RFP due in under 10 days, no prior capture, not the incumbent → default No-Bid.",
          "Place of performance. On-site in a state you do not cover, labor not remote-eligible → Pass.",
          "NAICS vs. title vs. PSC. Exact match is a plus. Adjacent with a matching PWS is still a candidate. Exact NAICS with a PWS you cannot perform is a Pass.",
          "Value vs. bid cost. Estimated value under ~8–10× fully loaded proposal cost is a lottery ticket unless it is a strategic account.",
          "Write the bucket. Nothing remains in Inbox overnight. That is the 24-hour rule.",
        ],
      },
      {
        type: "rule",
        title: "Respond has a higher priority than Score",
        text: "A Sources Sought takes 2–6 hours and buys you a seat. An un-captured RFP takes 80–250 hours and buys you a lesson. Clear Respond before you romanticize a solicitation.",
      },
      {
        type: "p",
        text: "What a 90-second sort is not: a technical read, a win-theme workshop, or a pricing exercise. If you cannot bucket it, it is a Score item and gets a 15-minute Go/No-Go the same day — not a three-hour rabbit hole in Section C.",
      },
      {
        type: "table",
        headers: ["Trap", "What it looks like", "Correction"],
        rows: [
          ["Curiosity tax", "Reading 40 pages of a Pass", "Title, type, set-aside, due date, NAICS. Stop."],
          ["Hero bid", "Due Thursday, found Tuesday", "No-Bid unless incumbent or customer-asked."],
          ["Set-aside cosplay", "Bidding WOSB work without WOSB", "Team or Pass. Do not 'figure it out in volume 1'."],
          ["Keyword myopia", "Ignoring a mis-NAICS'd PWS that is your work", "Layer C keywords exist for this."],
        ],
      },
      {
        type: "checks",
        id: "desk",
        items: [
          { id: "morning", text: "Desk is run before internal meetings, every business day" },
          { id: "twentyfour", text: "Inbox is empty at close of business" },
          { id: "respond-sla", text: "Respond items have an owner and a due date inside the agency window" },
          { id: "intel-log", text: "Award notices are logged (awardee, value, NAICS, agency) the same day" },
        ],
      },
    ],
  },
  {
    slug: "go-no-go",
    number: "04",
    title: "Go / No-Go without romance",
    dek: "A weighted decision in fifteen minutes. If the math does not clear, the proposal never starts.",
    minutes: 8,
    stageLabel: "Decision",
    blocks: [
      {
        type: "p",
        text: "Firms that win consistently pursue far fewer bids than they are invited to imagine. The Go/No-Go is the only meeting that creates profit before award. Everything after a weak Go is cost.",
      },
      {
        type: "p",
        text: "Score eight factors from 1 (hostile) to 5 (you should already be writing). Weights are in the Decision tool; do not re-litigate them per bid unless your company actually changed.",
      },
      {
        type: "table",
        headers: ["Factor", "Weight", "A 5 looks like"],
        rows: [
          ["Capability & NAICS fit", "20%", "PWS is last year's work with names changed"],
          ["Set-aside & size eligibility", "12%", "Eligible as prime, no waiver theater"],
          ["Customer intimacy", "12%", "You have spoken to the program before the notice"],
          ["Past performance relevance", "14%", "Recent, same-scope, same-complexity citations ready"],
          ["Competitive position", "12%", "Incumbent is beatable or you are the incumbent"],
          ["Bid cost vs. expected value", "12%", "Pwin × value ≥ 3× proposal cost"],
          ["Capacity & key people", "10%", "Named PM is real and available"],
          ["Clock realism", "8%", "Time for storyboard, pink, red, and a 24h-early submit"],
        ],
      },
      {
        type: "rule",
        title: "Thresholds",
        text: "≥ 3.8 weighted: GO. 3.2–3.7: CONDITIONAL (named teammate, narrowed scope, or written assumption). Below 3.2: NO-GO. Record the reason in one paragraph so next quarter's you does not re-bid the same loser.",
      },
      {
        type: "p",
        text: "Expected value is not a vibe. Convert the weighted score to a rough Pwin (the tool does this), multiply by estimated ceiling or first-year value, and divide by fully loaded bid cost. If you cannot clear 3×, you are buying a raffle ticket with senior labor. Exceptions exist — a first award at a target agency, a required past-performance vehicle, a customer who asked you to bid — and they must be written down, not muttered.",
      },
      {
        type: "watch",
        text: "Conditional is not a polite No-Go. It requires a named action: 'GO if we lock a 30% SDVOSB teammate by Friday' or 'NO-GO.' Open-ended conditionals are how pipelines rot.",
      },
      {
        type: "steps",
        items: [
          "Owner fills the eight scores with evidence, not optimism.",
          "Economics line auto-computes. If EV < 3× bid cost, the default is No-Go.",
          "Decision is GO / CONDITIONAL / NO-GO / TEAM-ONLY in the same sitting.",
          "GO opens a capture plan the same day. NO-GO is filed and the notice leaves the active board.",
        ],
      },
      {
        type: "checks",
        id: "gng",
        items: [
          { id: "same-day", text: "Every Score item is decided the same business day it is bucketed" },
          { id: "written", text: "No-Bid reasons are written, not oral" },
          { id: "cap-limit", text: "Concurrent GO count respects max concurrent bids" },
          { id: "team-clock", text: "Conditional teaming has a 72-hour expiry" },
        ],
      },
    ],
  },
  {
    slug: "capture",
    number: "05",
    title: "Capture before the clock starts",
    dek: "A living decision document: who buys, who sits in the way, what you will claim, and what you still lack.",
    minutes: 8,
    stageLabel: "Capture",
    blocks: [
      {
        type: "p",
        text: "A capture plan is not a folder of the RFP. It is the argument for spending the company's scarce proposal capacity. If it cannot tell leadership who the human evaluators are, why the incumbent is vulnerable, and which three claims will score, it is a binder.",
      },
      {
        type: "quote",
        text: "Those answers do not come from SAM.gov. They come from relationships, market research, and deliberate customer engagement over time.",
      },
      {
        type: "p",
        text: "Start capture on Shape items (pre-sol, RFI, industry day) and on GO solicitations with enough clock. For a full RFP that appeared this morning due in 21 days, capture compresses: 48 hours to freeze win themes, teaming, and the compliance matrix, then the factory writes.",
      },
      {
        type: "steps",
        items: [
          "Decompose the PWS into work, labor categories, clearances, tools, and locations.",
          "Map the customer: contracting officer, specialist, COR, program manager, end user, OSBP.",
          "Pull the last award from USAspending / FPDS: incumbent, value, NAICS, vehicle, date.",
          "Write three win themes as evaluator-facing claims, each with a proof point from past performance.",
          "Name discriminators (what you do that the likely field cannot credibly copy in this timeline).",
          "List gaps. Every gap gets a teammate, a hire, or a scope no-bid. Gaps without owners are future weaknesses.",
          "Build a price-to-win band from historical awards, IGCE if leaked in the RFI, and incumbent run-rate — not from your cost plus hope.",
          "Draft Q&A questions that unstick ambiguities. Do not ask questions that telegraph your price.",
        ],
      },
      {
        type: "rule",
        title: "Three themes, not twelve",
        text: "Evaluators remember three claims. If your twelfth 'theme' is 'excellent customer service,' delete it. Themes are testable: mission outcome, risk removal, or proven throughput.",
      },
      {
        type: "p",
        text: "Black-hat the field. Who must bid this? Who is the incumbent's likely teammate? Where will they be weak (staffing, transition, place of performance, cybersecurity)? Your proposal is a document written against those people, not against the government in the abstract.",
      },
      {
        type: "watch",
        text: "Exchanges with the government after solicitation issuance are controlled. Read the RFP's Q&A rules. Do not freelance 'just checking in' with the KO. Pre-RFP, OSBP and industry days exist for a reason — use them while they are legal.",
      },
    ],
  },
  {
    slug: "teaming",
    number: "06",
    title: "Teaming as a weapon",
    dek: "Partners close gaps. They also create OCI, workshare fights, and late proposals. Treat teaming as capture, not as a PDF.",
    minutes: 7,
    stageLabel: "Capture",
    blocks: [
      {
        type: "p",
        text: "Teaming is how small firms bid above their organic footprint and how large firms clear set-asides they cannot hold alone. It is also how bids die: unsigned workshare, exclusive agreements signed in panic, and teammates who disappear at red team.",
      },
      {
        type: "table",
        headers: ["You need a teammate when…", "You do not when…"],
        rows: [
          ["Set-aside you cannot hold", "You are eligible and can staff the PWS"],
          ["A named location or clearance you lack", "The gap is a slide, not a requirement"],
          ["A past-performance hole on a scored factor", "The partner would compete with you on the next three bids"],
          ["A vehicle (MAS SIN, OASIS+ pool) you do not have", "The RFP is open-market and you are otherwise whole"],
        ],
      },
      {
        type: "rule",
        title: "72-hour teaming clock",
        text: "From CONDITIONAL, you have 72 hours to execute a term sheet: workshare %, volume owners, pricing protocol, and exclusivity. If it is not on paper, it is not a team.",
      },
      {
        type: "steps",
        items: [
          "Write the gap first. Shop the gap, not a vague 'want to team?'",
          "Prefer complementary firms. Two 541512 shops splitting the same labor pool is a future protest.",
          "Check SAM exclusions, size, and OCI before the NDAs feel exciting.",
          "Set workshare to the evaluation, not to feelings. If past performance is 25%, the partner who owns that citation must be visible in the volume.",
          "Agree who prints, who prices, who submits. Dual-submit disasters are real.",
          "Keep a clean list of what each party may bid elsewhere.",
        ],
      },
      {
        type: "p",
        text: "Subcontracting is a second market. Large primes have small-business liaison officers and subcontracting plans. SBA SubNet, DSBS, and the interested-vendor list on a SAM notice are how you become the teammate instead of the lonely prime on an unrestricted monster. That is a valid Award Path: not every notice is yours to lead.",
      },
      {
        type: "watch",
        text: "Affiliation rules (SBA) can make a 'teammate' into a size problem. Ostensible subcontractor risk is how SDVOSB and 8(a) primes lose awards after they thought they had won. If the sub is doing the primary and vital requirements, get counsel involved before you sign.",
      },
    ],
  },
  {
    slug: "proposal-factory",
    number: "07",
    title: "The proposal factory",
    dek: "Storyboard, comply, write, color-team, submit. In that order. Prose is the last thing you add.",
    minutes: 9,
    stageLabel: "Proposal",
    blocks: [
      {
        type: "p",
        text: "Section L tells you how to build the document. Section M tells you how it will be scored. The PWS tells you what you must perform. A factory that starts with 'we'll write the technical and see' is how you produce 80 pages of non-responsive memoir.",
      },
      {
        type: "steps",
        items: [
          "Build the compliance matrix before kickoff: every shall / must / will, every L instruction, every M factor, owner, and volume pointer.",
          "Storyboard each scored factor as a claim → proof → feature → benefit → risk removed. No paragraphs yet.",
          "Assign volume owners. One throat to choke per volume. The PM does not also write pricing at 2 a.m.",
          "Write. Then stop writing and run Pink (strategy: did we bid the evaluation?).",
          "Fix strategy. Then Red (evaluators with the RFP only — no author in the room).",
          "Gold / production: fonts, page limits, bookmarks, OCI, amendments, SAM snapshot, reps.",
          "Submit in the specified channel 24 hours early. Then submit the identical package again if the portal allows a replace, so you know it landed.",
        ],
      },
      {
        type: "table",
        headers: ["Color team", "Question it answers", "When"],
        rows: [
          ["Pink", "Are we bidding Section M, or our brochure?", "After storyboards / first draft of themes"],
          ["Red", "What does an evaluator who does not like us score?", "On a frozen draft, with the RFP only"],
          ["Gold", "Is this the document we meant to send?", "24–48 hours before the portal closes"],
        ],
      },
      {
        type: "rule",
        title: "The evaluator has 12 minutes",
        text: "They search for the requirement, the claim, and the proof. Put the requirement identifier in headings. Answer first, explain second. Graphics that restated the PWS are not discriminators.",
      },
      {
        type: "p",
        text: "Past performance: recency, relevance, and quality. A $200K commercial website for a FAR 15 $40M desk-side program is a self-inflicted weakness. Annotate each citation against the PWS. If you must stretch, the stretch belongs in a teammate's citation, not in yours.",
      },
      {
        type: "p",
        text: "Price is an evaluation factor even when it is not 'most important.' Technical and price must tell the same story: if you propose a staffed NOC in the technical volume, the price volume cannot staff a shared inbox. Reconcile labor hours to the approach. Low-balling a staffing plan the QASP will measure is how you win a contract you will hate.",
      },
      {
        type: "watch",
        text: "Late is late (FAR 52.212-1 / 52.215-1 and the solicitation's own language). A SAM outage is not your excuse unless the government extends. Have a fallback path in writing: the RFP's stated alternate, a timestamped courier, whatever it actually allows — not what would be fair.",
      },
      {
        type: "checks",
        id: "factory",
        items: [
          { id: "matrix", text: "Compliance matrix complete before kickoff" },
          { id: "story", text: "Storyboards signed by capture lead" },
          { id: "amend", text: "All amendments acknowledged; dates in the header" },
          { id: "page", text: "Page, font, margin, and file-type limits verified by production" },
          { id: "early", text: "Dry-run submission 48 hours out; final 24 hours out" },
        ],
      },
    ],
  },
  {
    slug: "submit-silence",
    number: "08",
    title: "Submission, silence, and the wait",
    dek: "The portal is part of the evaluation. After send, the work is disciplined quiet and a ready debrief letter.",
    minutes: 6,
    stageLabel: "Submitted",
    blocks: [
      {
        type: "p",
        text: "Read the delivery instructions twice. SAM attachment, email to a named specialist, PIEE, agency portal, paper — they are not interchangeable. File names, page counts, and 'do not include pricing in the technical PDF' are compliance, not etiquette.",
      },
      {
        type: "steps",
        items: [
          "Freeze the files. Hash or checksum if you are sophisticated; at least write the filenames and byte sizes in the capture log.",
          "Submit early in the required channel. Capture the confirmation (screenshot, email, portal ID).",
          "If discussions or clarifications come, answer only what was asked. Do not reopen strategy in an email.",
          "If orals are required, treat them as a scored volume. Same themes, same claims, timed.",
          "If FPRs are requested, change price only with a corresponding technical change you can defend.",
        ],
      },
      {
        type: "rule",
        title: "Silence is a phase, not an absence of process",
        text: "The team does not 'check in' with the KO. They prepare the debrief request, the CPARS skeleton if you are incumbent, and the next capture. The calendar still moves.",
      },
      {
        type: "p",
        text: "Evaluations run weeks to months. Use the wait: CPARS on current work, a Sources Sought you postponed, the forecast for this office's next buy. A submitted bid is not a sabbatical.",
      },
      {
        type: "watch",
        text: "Do not start work, hire against the bid, or announce a win based on a 'good feeling' or an informal email. Award is the written notice. Until then, you are still bidding.",
      },
    ],
  },
  {
    slug: "award-debrief",
    number: "09",
    title: "Award, debrief, protest, flywheel",
    dek: "Winning is a transition. Losing is a data pull. Either way, the clock on debriefs is unforgiving.",
    minutes: 8,
    stageLabel: "Award",
    blocks: [
      {
        type: "p",
        text: "On award notice, two clocks start whether you won or lost. First: the debrief. Second: protest timeliness. Muscle memory is to request a debrief in writing the hour you see the notice — do not wait to 'see how you feel.'",
      },
      {
        type: "table",
        headers: ["Clock", "Rule of thumb", "Why it matters"],
        rows: [
          ["Debrief request", "Written request within 3 calendar days of notice (FAR 15.506)", "You want the record, not the vibe"],
          ["GAO protest timeliness", "Generally 10 days from knowledge of the basis — often from debrief close", "Untimely protests are dismissed, not debated"],
          ["CICA automatic stay", "GAO protest within 10 days of award or 5 days of a required debrief, whichever later", "Stay is the leverage; miss it and the awardee performs"],
        ],
      },
      {
        type: "rule",
        title: "Request the debrief immediately",
        text: "FAR 15.506(a)(1): written request within three calendar days. DoD enhanced debriefs add a question window that can extend 'close of debriefing.' If you might protest, calendar the five-day stay with counsel the same afternoon. This playbook is not counsel.",
      },
      {
        type: "p",
        text: "A useful debrief extracts: evaluated strengths and weaknesses by factor, past-performance ratings, whether discussions were held, and the awardee's overall adjectival or scored outcome if released. You are not there to relitigate. You are there to repair the factory. Write a one-page win/loss note the same day: what we claimed, what scored, what we will change.",
      },
      {
        type: "p",
        text: "If you won: transition is the first CPARS. Staff the kickoff, the QASP, the phase-in. Over-promise in the proposal and you will be measured against it. Quiet the BD champagne until the notice to proceed is real and OCI/badging is in motion.",
      },
      {
        type: "p",
        text: "If you lost and the evaluation looks irrational, protests exist (agency, GAO, Court of Federal Claims), each with different clocks, costs, and stays. Most losses should not be protested. A protest is a business decision: likely outcome, relationship cost at that agency, and whether the defect is prejudicial. Call counsel early; do not self-file from memory of a blog.",
      },
      {
        type: "steps",
        items: [
          "Win or lose: send the written debrief request the same day.",
          "Log the award in Intel (awardee, value, NAICS, vehicle).",
          "Write the one-page win/loss. Feed weaknesses into the factory checklist.",
          "If win: stand up transition, QASP, CPARS owner, and option-year capture.",
          "If lose: decide protest with counsel within the stay window, then return to the desk.",
        ],
      },
    ],
  },
  {
    slug: "cadence",
    number: "10",
    title: "The weekly operating cadence",
    dek: "A company that runs this playbook on a calendar, not on adrenaline. The desk is daily. The pipeline is weekly. The net is monthly.",
    minutes: 6,
    stageLabel: "Cadence",
    blocks: [
      {
        type: "table",
        headers: ["When", "Ritual", "Time box"],
        rows: [
          ["Every morning", "Daily Desk: bucket yesterday's and overnight notices", "30–45 min"],
          ["Same day", "Go/No-Go on every new Score item", "15 min each"],
          ["Tuesday / Thursday", "Capture working session on GO work", "90 min"],
          ["Friday", "Pipeline review: kill rotting CONDITIONAL, count concurrent bids, log intel", "45 min"],
          ["Monthly", "Saved-search audit, size-standard check, forecast sweep", "2 hours"],
          ["Per bid", "Pink / Red / Gold as scheduled in the factory", "On the calendar, not 'when draft is ready'"],
        ],
      },
      {
        type: "rule",
        title: "Concurrent bid cap is a control, not a suggestion",
        text: "If max concurrent is four and a fifth GO appears, something must become a No-Bid or a team-only. Quality of the four beats a fifth heroic PDF.",
      },
      {
        type: "p",
        text: "Measure what the factory actually does. Useful metrics: notices bucketed per week, Sources Sought response rate, Go rate, win rate on GOs, average bid cost, debriefs requested, CPARS received. Vanity metrics: 'opportunities identified,' 'pipeline value' stuffed with Passes.",
      },
      {
        type: "p",
        text: "Past performance is the flywheel. Delivery that produces a strong CPARS is BD. A weak CPARS on a small job will follow you onto the $40M RFP. Assign a CPARS owner on every active contract the day of kickoff, not the day the assessing official is bored.",
      },
      {
        type: "quote",
        text: "The path from a NAICS ping to an awarded contract is not a search problem. It is a decision system run on a clock.",
      },
      {
        type: "checks",
        id: "cadence",
        items: [
          { id: "rituals", text: "Desk, Go/No-Go, and Friday pipeline are on the calendar with owners" },
          { id: "cap", text: "Concurrent GO count is visible and enforced" },
          { id: "metrics", text: "Win rate is computed on GOs only, not on all notices seen" },
          { id: "cpars", text: "Every live contract has a named CPARS owner" },
        ],
      },
    ],
  },
];

export function chapterBySlug(slug: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}
