import { prisma } from "../db.js";

export type GoalDTO = {
  id: string;
  label: string;
  description: string | null;
  current: number;
  target: number;
  createdAt: string;
  updatedAt: string;
};

function toGoalDTO(goal: {
  id: string;
  label: string;
  description: string | null;
  current: { toNumber: () => number };
  target: { toNumber: () => number };
  createdAt: Date;
  updatedAt: Date;
}): GoalDTO {
  return {
    id: goal.id,
    label: goal.label,
    description: goal.description,
    current: goal.current.toNumber(),
    target: goal.target.toNumber(),
    createdAt: goal.createdAt.toISOString(),
    updatedAt: goal.updatedAt.toISOString()
  };
}

export async function listGoals(tenantId: string): Promise<GoalDTO[]> {
  const rows = await prisma.goal.findMany({
    where: { tenantId },
    orderBy: { createdAt: "asc" }
  });

  return rows.map(toGoalDTO);
}

export async function createGoal(
  tenantId: string,
  input: {
    label: string;
    description?: string;
    current?: number;
    target: number;
    createdById?: string;
  }
): Promise<GoalDTO> {
  const row = await prisma.goal.create({
    data: {
      tenantId,
      label: input.label,
      description: input.description,
      current: input.current ?? 0,
      target: input.target,
      createdById: input.createdById
    }
  });

  return toGoalDTO(row);
}

export async function updateGoal(
  tenantId: string,
  goalId: string,
  input: {
    label?: string;
    description?: string;
    current?: number;
    target?: number;
  }
): Promise<GoalDTO | null> {
  const existing = await prisma.goal.findFirst({
    where: {
      id: goalId,
      tenantId
    }
  });

  if (!existing) return null;

  const row = await prisma.goal.update({
    where: { id: goalId },
    data: {
      label: input.label,
      description: input.description,
      current: input.current,
      target: input.target
    }
  });

  return toGoalDTO(row);
}

export async function deleteGoal(tenantId: string, goalId: string): Promise<boolean> {
  const existing = await prisma.goal.findFirst({
    where: {
      id: goalId,
      tenantId
    }
  });

  if (!existing) return false;

  await prisma.goal.delete({ where: { id: goalId } });
  return true;
}
