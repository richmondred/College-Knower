import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export const metadata = {
  title: "English Past Champions Quiz",
  description: "Name English top-flight champions and optional runners-up."
};

export default function EnglishPastChampionsPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("english-past-champions")} homeHref="/games/english-football" />;
}
