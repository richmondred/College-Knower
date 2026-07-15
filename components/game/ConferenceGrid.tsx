import type { ConferenceId, QuizDataset } from "@/data/fbs/types";
import type { CSSProperties } from "react";

type ConferenceGridProps = {
  dataset: QuizDataset;
  solvedTeamIds: Set<string>;
  hintedTeamIds: Set<string>;
  recentTeamIds: Set<string>;
  expandedConference: ConferenceId | null;
  onToggleConference: (conference: ConferenceId) => void;
};

export function ConferenceGrid({
  dataset,
  solvedTeamIds,
  hintedTeamIds,
  recentTeamIds,
  expandedConference,
  onToggleConference
}: ConferenceGridProps) {
  const conferences = Object.entries(dataset.conferences).sort(
    ([, a], [, b]) => a.sortOrder - b.sortOrder
  );

  return (
    <section className="conference-grid" aria-label="Conference answer grid">
      {conferences.map(([conferenceId, conference]) => {
        const typedConferenceId = conferenceId as ConferenceId;
        const teams = dataset.teams
          .filter((team) => team.conference === typedConferenceId)
          .sort((a, b) => a.school.localeCompare(b.school));
        const solved = teams.filter((team) => solvedTeamIds.has(team.id)).length;
        const complete = solved === teams.length;
        const open = expandedConference === typedConferenceId || complete;

        return (
          <article
            className="conference-card"
            data-complete={complete}
            data-open={open}
            key={conferenceId}
          >
            <button
              className="conference-trigger"
              type="button"
              aria-expanded={open}
              aria-controls={`conference-${conferenceId}`}
              onClick={() => onToggleConference(typedConferenceId)}
            >
              <span>
                <span className="conference-short">{conference.shortLabel}</span>
                <span className="conference-name">{conference.label}</span>
              </span>
              <span className="conference-count metric">
                {solved} / {teams.length}
              </span>
            </button>
            <div
              className="conference-progress"
              aria-hidden="true"
              style={{ "--progress": `${(solved / teams.length) * 100}%` } as CSSProperties}
            />
            <ol className="conference-body" id={`conference-${conferenceId}`}>
              {teams.map((team, index) => {
                const revealed = solvedTeamIds.has(team.id);
                const hinted = !revealed && hintedTeamIds.has(team.id);
                const recent = recentTeamIds.has(team.id);
                return (
                  <li
                    className="team-slot"
                    data-revealed={revealed}
                    data-hinted={hinted}
                    data-recent={recent}
                    key={team.id}
                  >
                    <span className="slot-index metric">{String(index + 1).padStart(2, "0")}</span>
                    <span className="slot-copy">
                      {revealed ? (
                        <>
                          <strong>{team.displaySchool}</strong>
                          <span>{team.nickname}</span>
                        </>
                      ) : hinted ? (
                        <>
                          <strong className="hinted-clue">{team.nickname}</strong>
                          <span>Nickname clue</span>
                        </>
                      ) : (
                        <span className="empty-slot">Open roster slot</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ol>
          </article>
        );
      })}
    </section>
  );
}
