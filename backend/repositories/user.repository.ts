import { prisma } from "@flow/prisma";
import type { Prisma } from "@prisma/client";

const activeUserWhere: Prisma.UserWhereInput = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};

export class UserRepository {
  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  findActiveByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, ...activeUserWhere },
    });
  }

  findActiveById(id: string) {
    return prisma.user.findFirst({
      where: { id, ...activeUserWhere },
    });
  }

  findAllActive() {
    return prisma.user.findMany({
      where: activeUserWhere,
      orderBy: { createdAt: "desc" },
    });
  }

  findAllActivePaginated(skip: number, take: number) {
    return prisma.user.findMany({
      where: activeUserWhere,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  countActive() {
    return prisma.user.count({
      where: activeUserWhere,
    });
  }

  create(data: Prisma.UserCreateInput) {
    return prisma.user.create({ data });
  }

  update(id: string, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }

  softDelete(id: string) {
    return this.update(id, { deletedAt: new Date() });
  }
}
