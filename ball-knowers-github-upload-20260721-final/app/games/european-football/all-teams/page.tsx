import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export const metadata = {
  title: "European Football Teams Quiz",
  description: "Name clubs from the European football workbook."
};

export default function EuropeAllTeamsPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("europe-all-teams")} homeHref="/games/european-football" />;
}
