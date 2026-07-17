/**
 * Relation adapter — the ONLY file (besides db.ts and cache.ts) that knows
 * how the underlying ORM expresses relation reads and relation mutations.
 * Repositories depend on IRelationAdapter<T>, never on Prisma syntax directly.
 * To swap ORMs, implement a new class satisfying IRelationAdapter<T> here —
 * no other file changes.
 */
export interface IRelationAdapter<T> {
  findManyWithRelations(where: Record<string, any> | undefined, relations: string[]): Promise<T[]>;
  findUniqueWithRelations(id: string, relations: string[]): Promise<T | null>;
  connectRelation(id: string, relationField: string, relatedIds: string[]): Promise<T>;
  disconnectRelation(id: string, relationField: string, relatedIds: string[]): Promise<T>;
  setRelation(id: string, relationField: string, relatedIds: string[]): Promise<T>;
}

export class PrismaRelationAdapter<T> implements IRelationAdapter<T> {
  constructor(private model: any) {}

  private toInclude(relations: string[]): Record<string, boolean> {
    return Object.fromEntries(relations.map((r) => [r, true]));
  }

  findManyWithRelations(where: Record<string, any> | undefined, relations: string[]): Promise<T[]> {
    return this.model.findMany({
      ...(where ? { where } : {}),
      ...(relations.length ? { include: this.toInclude(relations) } : {}),
    });
  }

  findUniqueWithRelations(id: string, relations: string[]): Promise<T | null> {
    return this.model.findUnique({
      where: { id },
      ...(relations.length ? { include: this.toInclude(relations) } : {}),
    });
  }

  connectRelation(id: string, relationField: string, relatedIds: string[]): Promise<T> {
    return this.model.update({
      where: { id },
      data: { [relationField]: { connect: relatedIds.map((rid) => ({ id: rid })) } },
      include: { [relationField]: true },
    });
  }

  disconnectRelation(id: string, relationField: string, relatedIds: string[]): Promise<T> {
    return this.model.update({
      where: { id },
      data: { [relationField]: { disconnect: relatedIds.map((rid) => ({ id: rid })) } },
      include: { [relationField]: true },
    });
  }

  setRelation(id: string, relationField: string, relatedIds: string[]): Promise<T> {
    return this.model.update({
      where: { id },
      data: { [relationField]: { set: relatedIds.map((rid) => ({ id: rid })) } },
      include: { [relationField]: true },
    });
  }
}
