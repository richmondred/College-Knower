import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export default function HeismanWinnersPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("cfb-heisman-winners")} homeHref="/games/college-football" />;
}

export const metadata = {
  title: "Heisman Winners Quiz",
  description: "Name Heisman winners, with optional runners-up."
};
