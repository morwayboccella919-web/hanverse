import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PracticeService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(userId: string, assessmentId: string) {
    const assessment = await this.prisma.assessment.findUnique({
      where: { id: assessmentId },
    });
    if (!assessment) throw new NotFoundException("Assessment not found");

    // Generate practice tasks based on assessment results
    const tasks = this.buildTasks(assessment);

    const practice = await this.prisma.practice.create({
      data: {
        userId,
        assessmentId,
        tasks,
        completed: false,
      },
    });

    return { practice_id: practice.id };
  }

  private buildTasks(assessment: any): any[] {
    const tasks: any[] = [];

    // Discrimination task
    tasks.push({
      type: "discrimination",
      instruction: "Listen and choose the correct tone pattern",
      options: assessment.errorPhonemes
        ? [
            assessment.referenceText,
            assessment.referenceText + " (different tones)",
          ]
        : [assessment.referenceText, "alternate pronunciation"],
      answer: assessment.referenceText,
    });

    // Shadowing task
    tasks.push({
      type: "shadowing",
      instruction: `Repeat after the audio: "${assessment.referenceText}"`,
      answer: assessment.referenceText,
    });

    // Fluency task
    tasks.push({
      type: "fluency",
      instruction: `Speak the following sentence naturally: "${assessment.referenceText}"`,
      answer: assessment.referenceText,
    });

    return tasks;
  }

  async getDetail(id: string) {
    const practice = await this.prisma.practice.findUnique({
      where: { id },
      select: {
        id: true,
        tasks: true,
        completed: true,
      },
    });

    if (!practice) throw new NotFoundException("Practice not found");

    return {
      id: practice.id,
      tasks: practice.tasks,
      completed: practice.completed,
    };
  }

  async submitTask(practiceId: string, taskIndex: number, answer: any) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
    });
    if (!practice) throw new NotFoundException("Practice not found");

    const tasks = practice.tasks as any[];
    if (taskIndex < 0 || taskIndex >= tasks.length) {
      throw new NotFoundException("Task index out of range");
    }

    const task = tasks[taskIndex];
    const correct = task.answer === answer;

    // Update scores array
    const scores: any[] = (practice.scores as any[]) || [];
    const existingIdx = scores.findIndex((s) => s.task_index === taskIndex);
    if (existingIdx >= 0) {
      scores[existingIdx] = { task_index: taskIndex, score: correct ? 1 : 0, user_answer: answer };
    } else {
      scores.push({ task_index: taskIndex, score: correct ? 1 : 0, user_answer: answer });
    }

    // Check if all tasks completed
    const completed = scores.length >= tasks.length;

    let xpEarned = practice.xpEarned;
    if (completed && !practice.completed) {
      xpEarned = Math.round(scores.reduce((sum, s) => sum + s.score, 0) * 10);
    }

    await this.prisma.practice.update({
      where: { id: practiceId },
      data: {
        scores,
        completed,
        xpEarned,
      },
    });

    return {
      correct,
      feedback: correct ? "Great job!" : `The correct answer was: ${task.answer}`,
    };
  }

  async getResult(practiceId: string) {
    const practice = await this.prisma.practice.findUnique({
      where: { id: practiceId },
      select: {
        id: true,
        scores: true,
        xpEarned: true,
      },
    });

    if (!practice) throw new NotFoundException("Practice not found");

    const scoresArr = (practice.scores as any[]) || [];
    return {
      scores: scoresArr.map((s) => s.score),
      xp_earned: practice.xpEarned,
    };
  }
}
