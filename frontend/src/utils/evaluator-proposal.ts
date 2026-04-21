type ProposalVersionLike = {
  id?: number | string | null;
  file_url?: string | null;
  created_at?: string | null;
};

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : -1;
}

function toTime(value: unknown): number {
  const parsed = new Date((value as string | number | Date | undefined) ?? 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function sortProposalVersions(
  versions: ProposalVersionLike[] | null | undefined,
): ProposalVersionLike[] {
  return [...(versions ?? [])].sort((a, b) => {
    const timeDiff = toTime(a?.created_at) - toTime(b?.created_at);
    if (timeDiff !== 0) return timeDiff;
    return toNumber(a?.id) - toNumber(b?.id);
  });
}

export function getAssignmentProposalFileUrl(
  proposal: { proposal_version?: ProposalVersionLike[] | null; file_url?: string | null } | null | undefined,
  proposalVersionId?: number | string | null,
): string | null {
  if (!proposal) return null;

  const sortedVersions = sortProposalVersions(proposal.proposal_version);
  const matchedVersion =
    proposalVersionId != null
      ? sortedVersions.find((version) => toNumber(version.id) === toNumber(proposalVersionId))
      : null;

  return matchedVersion?.file_url ?? sortedVersions[sortedVersions.length - 1]?.file_url ?? proposal.file_url ?? null;
}

export function shouldReplaceEvaluatorProposal(existing: any, candidate: any): boolean {
  const existingVersionId = toNumber(existing?.proposalVersionId ?? existing?.raw?.proposal_version_id);
  const candidateVersionId = toNumber(candidate?.proposalVersionId ?? candidate?.raw?.proposal_version_id);
  if (candidateVersionId !== existingVersionId) {
    return candidateVersionId > existingVersionId;
  }

  const existingTime = Math.max(
    toTime(existing?.raw?.updated_at),
    toTime(existing?.raw?.created_at),
    toTime(existing?.assignedDate),
    toTime(existing?.evaluatedDate),
    toTime(existing?.reviewedDate),
  );
  const candidateTime = Math.max(
    toTime(candidate?.raw?.updated_at),
    toTime(candidate?.raw?.created_at),
    toTime(candidate?.assignedDate),
    toTime(candidate?.evaluatedDate),
    toTime(candidate?.reviewedDate),
  );
  if (candidateTime !== existingTime) {
    return candidateTime > existingTime;
  }

  return toNumber(candidate?.raw?.id) > toNumber(existing?.raw?.id);
}
