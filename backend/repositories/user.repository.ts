import { prisma } from "@flow/prisma";
import type { Prisma } from "@prisma/client";

const notDeletedUserWhere: Prisma.UserWhereInput = {
  OR: [{ deletedAt: null }, { deletedAt: { isSet: false } }],
};

export class UserRepository {
  findByEmailIncludingDeleted(email: string) {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  findByIdIncludingDeleted(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: {
        email,
        ...notDeletedUserWhere,
      },
    });
  }

  findById(id: string) {
    return prisma.user.findFirst({
      where: {
        id,
        ...notDeletedUserWhere,
      },
    });
  }

  findAll() {
    return prisma.user.findMany({
      where: notDeletedUserWhere,
      orderBy: { createdAt: "desc" },
    });
  }

  findAllPaginated(skip: number, take: number) {
    return prisma.user.findMany({
      where: notDeletedUserWhere,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  count() {
    return prisma.user.count({
      where: notDeletedUserWhere,
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
