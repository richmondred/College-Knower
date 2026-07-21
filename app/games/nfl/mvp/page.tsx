import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export const metadata = {
  title: "NFL MVP Quiz",
  description: "Name NFL MVP winners."
};

export default function NflMvpPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("nfl-mvp")} homeHref="/games/nfl" />;
}
