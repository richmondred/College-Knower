import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export const metadata = {
  title: "Super Bowl Champions Quiz",
  description: "Name every Super Bowl champion."
};

export default function NflPastChampionsPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("nfl-past-champions")} homeHref="/games/nfl" />;
}
