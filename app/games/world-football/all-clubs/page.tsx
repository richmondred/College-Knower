import { KnowledgeQuizGame } from "@/components/game/KnowledgeQuizGame";
import { getKnowledgeQuiz } from "@/data/knowledge/quiz-data";

export const metadata = {
  title: "World Football Clubs Quiz",
  description: "Name every club from the world football workbook."
};

export default function WorldAllClubsPage() {
  return <KnowledgeQuizGame quiz={getKnowledgeQuiz("world-all-clubs")} homeHref="/games/world-football" />;
}
