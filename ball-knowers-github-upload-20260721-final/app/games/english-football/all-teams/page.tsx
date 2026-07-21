import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export const metadata = {
  title: "English Football Teams Quiz",
  description: "Name clubs from the English football pyramid."
};

export default function EnglishAllTeamsPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("english-all-teams")} homeHref="/games/english-football" />;
}
