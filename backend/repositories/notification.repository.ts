import { prisma } from "@flow/prisma";
import type { Prisma } from "@prisma/client";

export class NotificationRepository {
  findById(id: string) {
    return prisma.notification.findUnique({
      where: { id },
    });
  }

  findManyPaginated(
    where: Prisma.NotificationWhereInput,
    skip: number,
    take: number
  ) {
    return prisma.notification.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: "desc" },
    });
  }

  count(where: Prisma.NotificationWhereInput) {
    return prisma.notification.count({ where });
  }

  countUnread(where: Prisma.NotificationWhereInput) {
    return prisma.notification.count({
      where,
    });
  }

  create(data: Prisma.NotificationCreateInput) {
    return prisma.notification.create({ data });
  }

  update(id: string, data: Prisma.NotificationUpdateInput) {
    return prisma.notification.update({
      where: { id },
      data,
    });
  }

  delete(id: string) {
    return prisma.notification.delete({
      where: { id },
    });
  }
}
