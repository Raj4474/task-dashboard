"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getClients() {
  return await prisma.client.findMany({
    orderBy: { id: 'desc' }
  });
}

export async function getTasks() {
  return await prisma.task.findMany({
    orderBy: { id: 'desc' }
  });
}

export async function addClient(data: any) {
  const client = await prisma.client.create({
    data: {
      name: data.name,
      industry: data.industry,
      status: data.status,
      nextAction: data.nextAction,
      lastContact: data.lastContact,
    }
  });
  revalidatePath('/');
  return client;
}

export async function addTask(data: any) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      time: data.time || null,
      priority: data.priority,
      status: data.status,
      category: data.category,
      date: data.date,
      clientId: data.clientId,
    }
  });
  revalidatePath('/');
  return task;
}

export async function toggleTaskStatus(taskId: number, currentStatus: string) {
  const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus }
  });
  revalidatePath('/');
  return task;
}

export async function deleteClient(id: number) {
  await prisma.client.delete({ where: { id } });
  revalidatePath('/');
}

export async function resetDatabase() {
  await prisma.task.deleteMany({});
  await prisma.client.deleteMany({});
  revalidatePath('/');
}
