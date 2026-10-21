/**
 * AI Attendance Intelligence Engine
 * Configured for Grok / OpenAI-compatible endpoint with model 'openai/gpt-oss-120b'
 * Includes a robust, 100% zero-cost Deterministic Heuristic Engine fallback.
 */

export interface StudentRiskProfile {
  studentId: string;
  name: string;
  currentPct: number;
  attended: number;
  total: number;
  lecturesToBreach: number;
  riskScore: number; // 0 - 100
  tier: 'NORMAL' | 'WARNING_ZONE' | 'STATUTORY_CRITICAL';
  actionNeeded: string;
}

export interface AIComplianceBriefing {
  engineUsed: 'GROK_LLM' | 'HEURISTIC_DETERMINISTIC';
  modelName: string;
  generatedAt: string;
  department: string;
  classSection: string;
  totalEnrolled: number;
  averageAttendancePct: number;
  overallHealthTier: 'OPTIMAL' | 'MODERATE_RISK' | 'CRITICAL_RISK';
  summaryText: string;
  predictedBreachesNext14Days: number;
  topAtRiskStudents: StudentRiskProfile[];
  automatedActionRecommendations: string[];
}

/**
 * Deterministic Heuristic Risk Calculator (Free, 0 credits, 0 latency)
 */
export function computeDeterministicComplianceAnalysis(
  students: Array<{ student_id?: string; user_id?: string; name: string; attended_count?: number; total_sessions?: number; attendance_percentage?: number }>,
  department = 'Computer Science & Engineering',
  classSection = 'CSE-A'
): AIComplianceBriefing {
  const analyzedStudents: StudentRiskProfile[] = students.map((s) => {
    const studentId = s.student_id || s.user_id || '25215101';
    const attended = Number(s.attended_count ?? 16);
    const total = Math.max(1, Number(s.total_sessions ?? 20));
    const currentPct = s.attendance_percentage !== undefined ? Number(s.attendance_percentage) : Math.round((attended / total) * 1000) / 10;

    // Consecutive absences before breaching 75% threshold
    // (attended) / (total + beta) < 0.75  =>  attended < 0.75 * total + 0.75 * beta  =>  beta = floor((attended - 0.75*total) / 0.75)
    let lecturesToBreach = 0;
    if (currentPct >= 75) {
      lecturesToBreach = Math.max(0, Math.floor((attended - 0.75 * total) / 0.75));
    }

    let tier: 'NORMAL' | 'WARNING_ZONE' | 'STATUTORY_CRITICAL' = 'NORMAL';
    let riskScore = 15;
    let actionNeeded = 'Maintain Regular Schedule';

    if (currentPct < 65) {
      tier = 'STATUTORY_CRITICAL';
      riskScore = Math.min(100, Math.round(85 + (65 - currentPct) * 1.5));
      actionNeeded = 'Immediate Dean Escalation & Exam Barring Notice';
    } else if (currentPct < 75) {
      tier = 'WARNING_ZONE';
      riskScore = Math.min(84, Math.round(50 + (75 - currentPct) * 3.4));
      actionNeeded = 'Automated Parent Twilio SMS & Advisor Counseling';
    } else if (currentPct < 80) {
      riskScore = 35;
      actionNeeded = 'Attendance Health Monitor';
    }

    return {
      studentId,
      name: s.name,
      currentPct,
      attended,
      total,
      lecturesToBreach,
      riskScore,
      tier,
      actionNeeded,
    };
  });

  const totalEnrolled = analyzedStudents.length;
  const avgPct = totalEnrolled > 0
    ? Math.round((analyzedStudents.reduce((acc, curr) => acc + curr.currentPct, 0) / totalEnrolled) * 10) / 10
    : 78.5;

  const warningCount = analyzedStudents.filter((s) => s.tier === 'WARNING_ZONE').length;
  const criticalCount = analyzedStudents.filter((s) => s.tier === 'STATUTORY_CRITICAL').length;
  const compliantCount = analyzedStudents.filter((s) => s.tier === 'NORMAL').length;

  let overallHealthTier: 'OPTIMAL' | 'MODERATE_RISK' | 'CRITICAL_RISK' = 'OPTIMAL';
  if (criticalCount > 3 || (criticalCount + warningCount) / Math.max(1, totalEnrolled) > 0.3) {
    overallHealthTier = 'CRITICAL_RISK';
  } else if (warningCount > 0 || criticalCount > 0) {
    overallHealthTier = 'MODERATE_RISK';
  }

  // Sort top at-risk students by highest risk score
  const topAtRisk = [...analyzedStudents]
    .filter((s) => s.riskScore >= 40)
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 8);

  const summaryText = `Section ${classSection} (${department}) displays an aggregate compliance level of ${avgPct}%. Currently, ${compliantCount} students (${Math.round((compliantCount / Math.max(1, totalEnrolled)) * 100)}%) are cleared for end-semester examinations. However, ${warningCount} student${warningCount !== 1 ? 's are' : ' is'} hovering in the statutory Warning Zone (65–74%), and ${criticalCount} student${criticalCount !== 1 ? 's have' : ' has'} breached the 65% statutory threshold. Mathematical velocity modeling projects that ${topAtRisk.filter((s) => s.lecturesToBreach <= 2).length} additional students will forfeit exam hall tickets if they miss 2 or more upcoming lectures.`;

  const automatedActionRecommendations = [
    `Trigger automated Twilio SMS alert batch to parents of ${warningCount + criticalCount} at-risk students.`,
    `Sync updated compliance tags to HubSpot / HighLevel CRM pipeline for academic counselor intervention.`,
    `Schedule mandatory dean review for ${criticalCount} critically barred student${criticalCount !== 1 ? 's' : ''} prior to final hall ticket issuance.`,
  ];

  return {
    engineUsed: 'HEURISTIC_DETERMINISTIC',
    modelName: 'SmartCampus-Heuristic-Rules-Engine-v3.0',
    generatedAt: new Date().toISOString(),
    department,
    classSection,
    totalEnrolled,
    averageAttendancePct: avgPct,
    overallHealthTier,
    summaryText,
    predictedBreachesNext14Days: topAtRisk.filter((s) => s.lecturesToBreach <= 3).length,
    topAtRiskStudents: topAtRisk,
    automatedActionRecommendations,
  };
}

/**
 * Primary Generator: Attempts Grok / OpenAI API call if key is present;
 * otherwise gracefully falls back to Deterministic Heuristic Engine.
 */
export async function generateAttendanceComplianceBriefing(
  students: Array<any>,
  department = 'Computer Science & Engineering',
  classSection = 'CSE-A'
): Promise<AIComplianceBriefing> {
  const apiKey = process.env.AI_API_KEY || process.env.GROK_API_KEY || '';
  const baseUrl = process.env.AI_BASE_URL || 'https://api.x.ai/v1';
  const model = process.env.AI_MODEL || 'openai/gpt-oss-120b';

  // Fallback calculation baseline
  const heuristicBaseline = computeDeterministicComplianceAnalysis(students, department, classSection);

  if (!apiKey || apiKey.trim() === '') {
    // Zero-cost heuristic fallback
    return heuristicBaseline;
  }

  try {
    const prompt = `
You are an Enterprise AI Attendance & Compliance Officer for a University accreditation system.
Analyze this course section:
Department: ${department}
Class Section: ${classSection}
Total Enrolled: ${heuristicBaseline.totalEnrolled}
Average Attendance: ${heuristicBaseline.averageAttendancePct}%
Critically Barred Students (<65%): ${heuristicBaseline.topAtRiskStudents.filter((s) => s.tier === 'STATUTORY_CRITICAL').length}
Warning Zone Students (65-74%): ${heuristicBaseline.topAtRiskStudents.filter((s) => s.tier === 'WARNING_ZONE').length}

At-Risk Roster:
${JSON.stringify(heuristicBaseline.topAtRiskStudents.slice(0, 5), null, 2)}

Provide an executive compliance synthesis in strictly valid JSON with this exact schema:
{
  "summaryText": "Concise 3-sentence executive summary explaining health status, student risks, and examination disqualification warnings.",
  "overallHealthTier": "OPTIMAL" | "MODERATE_RISK" | "CRITICAL_RISK",
  "predictedBreachesNext14Days": number,
  "automatedActionRecommendations": ["action 1", "action 2", "action 3"]
}
`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000); // 6s timeout for fast response

    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You are an enterprise university attendance intelligence agent. Respond with raw valid JSON only.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (rawContent) {
        const parsed = JSON.parse(rawContent);
        return {
          ...heuristicBaseline,
          engineUsed: 'GROK_LLM',
          modelName: model,
          summaryText: parsed.summaryText || heuristicBaseline.summaryText,
          overallHealthTier: parsed.overallHealthTier || heuristicBaseline.overallHealthTier,
          predictedBreachesNext14Days: typeof parsed.predictedBreachesNext14Days === 'number'
            ? parsed.predictedBreachesNext14Days
            : heuristicBaseline.predictedBreachesNext14Days,
          automatedActionRecommendations: parsed.automatedActionRecommendations?.length
            ? parsed.automatedActionRecommendations
            : heuristicBaseline.automatedActionRecommendations,
        };
      }
    }
  } catch (err) {
    console.warn('Grok/LLM call skipped or timed out, using deterministic heuristic engine:', err);
  }

  return heuristicBaseline;
}
