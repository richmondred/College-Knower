import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export default function PastChampionsPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("cfb-past-champions")} homeHref="/games/college-football" />;
}

export const metadata = {
  title: "College Football Past Champions Quiz",
  description: "Name college football national champion selections."
};
