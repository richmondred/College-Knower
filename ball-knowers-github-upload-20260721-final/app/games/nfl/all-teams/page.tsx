import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export const metadata = {
  title: "NFL All Teams Quiz",
  description: "Name all 32 NFL teams."
};

export default function NflAllTeamsPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("nfl-all-teams")} homeHref="/games/nfl" />;
}
